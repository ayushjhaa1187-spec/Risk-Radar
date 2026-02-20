/**
 * Risk Repository
 *
 * Data access layer for risks, events, and exposures
 * Abstracts database queries
 */

import { queryAll, queryOne, query } from '../utils/db.js';
import logger from '../utils/logger.js';

/**
 * Get all risks with optional filters
 */
export const getRisks = async (filters = {}) => {
  try {
    const { region, severity, status = 'active', limit = 50, offset = 0 } = filters;

    let sql = `
      SELECT
        r.id,
        r.risk_key,
        r.title,
        r.description,
        r.category,
        r.severity,
        r.confidence,
        r.exposure_score,
        r.detected_date,
        r.start_date,
        r.expected_duration_days,
        r.status,
        reg.code as region_code,
        reg.name as region_name,
        r.estimated_impact_json
      FROM risks r
      LEFT JOIN regions reg ON r.region_id = reg.id
      WHERE r.status = $1
    `;

    const params = [status];
    let paramIndex = 2;

    if (region) {
      sql += ` AND reg.code = $${paramIndex}`;
      params.push(region);
      paramIndex++;
    }

    if (severity) {
      sql += ` AND r.severity >= $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    sql += ` ORDER BY r.detected_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const results = await queryAll(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM risks r LEFT JOIN regions reg ON r.region_id = reg.id WHERE r.status = $1';
    const countParams = [status];
    let countIndex = 2;

    if (region) {
      countSql += ` AND reg.code = $${countIndex}`;
      countParams.push(region);
      countIndex++;
    }

    if (severity) {
      countSql += ` AND r.severity >= $${countIndex}`;
      countParams.push(severity);
      countIndex++;
    }

    const countResult = await queryOne(countSql, countParams);
    const total = parseInt(countResult.total);

    return {
      data: results,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      },
    };
  } catch (err) {
    logger.error('Error getting risks', { error: err.message });
    throw err;
  }
};

/**
 * Get single risk by ID with full details
 */
export const getRiskById = async (riskId) => {
  try {
    const risk = await queryOne(
      `
      SELECT
        r.id,
        r.risk_key,
        r.title,
        r.description,
        r.category,
        r.severity,
        r.confidence,
        r.exposure_score,
        r.detected_date,
        r.start_date,
        r.expected_duration_days,
        r.status,
        r.affected_facility_ids,
        r.estimated_impact_json,
        r.mitigation_notes,
        reg.id as region_id,
        reg.code as region_code,
        reg.name as region_name
      FROM risks r
      LEFT JOIN regions reg ON r.region_id = reg.id
      WHERE r.id = $1
    `,
      [riskId]
    );

    if (!risk) {
      return null;
    }

    // Get affected facilities
    const facilityIds = risk.affected_facility_ids || [];
    let facilities = [];
    if (facilityIds.length > 0) {
      facilities = await queryAll(
        `SELECT id, facility_id, name, facility_type, country FROM facilities WHERE id = ANY($1)`,
        [facilityIds]
      );
    }

    // Get exposed OEMs
    const exposures = await queryAll(
      `
      SELECT
        o.id,
        o.org_id,
        o.name,
        ore.affected_tier1_suppliers,
        ore.disruption_probability_6w,
        ore.estimated_disruption_days,
        ore.risk_assessment_json
      FROM oem_risk_exposure ore
      JOIN organizations o ON ore.oem_id = o.id
      WHERE ore.risk_id = $1
      ORDER BY ore.disruption_probability_6w DESC
    `,
      [riskId]
    );

    return {
      ...risk,
      affected_facilities: facilities,
      oems_exposed: exposures,
    };
  } catch (err) {
    logger.error('Error getting risk by ID', { error: err.message });
    throw err;
  }
};

/**
 * Get events with filters
 */
export const getEvents = async (filters = {}) => {
  try {
    const {
      region,
      event_type,
      start_date,
      end_date,
      processed = null,
      limit = 20,
      offset = 0,
    } = filters;

    let sql = `
      SELECT
        e.id,
        e.event_key,
        e.event_type,
        e.title,
        e.description,
        e.detected_date,
        e.occurrence_date,
        e.source,
        e.severity_score,
        e.classification_confidence,
        e.entities_json,
        reg.code as region_code,
        reg.name as region_name
      FROM events e
      LEFT JOIN regions reg ON e.region_id = reg.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (region) {
      sql += ` AND reg.code = $${paramIndex}`;
      params.push(region);
      paramIndex++;
    }

    if (event_type) {
      sql += ` AND e.event_type = $${paramIndex}`;
      params.push(event_type);
      paramIndex++;
    }

    if (start_date) {
      sql += ` AND e.detected_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      sql += ` AND e.detected_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (processed !== null) {
      sql += ` AND e.processed = $${paramIndex}`;
      params.push(processed);
      paramIndex++;
    }

    sql += ` ORDER BY e.detected_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const results = await queryAll(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM events e LEFT JOIN regions reg ON e.region_id = reg.id WHERE 1=1';
    const countParams = [];
    if (region) {
      countSql += ` AND reg.code = $${countParams.length + 1}`;
      countParams.push(region);
    }
    if (event_type) {
      countSql += ` AND e.event_type = $${countParams.length + 1}`;
      countParams.push(event_type);
    }
    if (start_date) {
      countSql += ` AND e.detected_date >= $${countParams.length + 1}`;
      countParams.push(start_date);
    }
    if (end_date) {
      countSql += ` AND e.detected_date <= $${countParams.length + 1}`;
      countParams.push(end_date);
    }
    if (processed !== null) {
      countSql += ` AND e.processed = $${countParams.length + 1}`;
      countParams.push(processed);
    }

    const countResult = await queryOne(countSql, countParams);
    const total = parseInt(countResult.total);

    return {
      data: results,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      },
    };
  } catch (err) {
    logger.error('Error getting events', { error: err.message });
    throw err;
  }
};

/**
 * Get OEM exposure to risks
 */
export const getOEMExposure = async (oemId, filters = {}) => {
  try {
    const { commodity, active_only = true } = filters;

    // Get OEM info
    const oem = await queryOne('SELECT * FROM organizations WHERE org_id = $1', [oemId]);

    if (!oem) {
      return null;
    }

    // Get commodity exposures
    let commodityExposureSql = `
      SELECT
        c.commodity_code,
        c.name as commodity_name,
        oce.dependency_percentage,
        oce.concentration_risk_level,
        oce.tier2_supplier_count,
        oce.alternative_sources
      FROM oem_commodity_exposure oce
      JOIN commodities c ON oce.commodity_id = c.id
      WHERE oce.oem_id = $1
    `;

    const commodityParams = [oem.id];
    if (commodity) {
      commodityExposureSql += ` AND c.commodity_code = $2`;
      commodityParams.push(commodity);
    }

    const commodityExposures = await queryAll(commodityExposureSql, commodityParams);

    // Get risk exposures
    const riskExposures = await queryAll(
      `
      SELECT
        r.id as risk_id,
        r.risk_key,
        r.title,
        r.severity,
        r.category,
        ore.affected_tier1_suppliers,
        ore.disruption_probability_6w,
        ore.estimated_disruption_days,
        ore.risk_assessment_json
      FROM oem_risk_exposure ore
      JOIN risks r ON ore.risk_id = r.id
      WHERE ore.oem_id = $1
      ${active_only ? 'AND r.status = \'active\'' : ''}
      ORDER BY ore.disruption_probability_6w DESC
    `,
      [oem.id]
    );

    return {
      oem: {
        oem_id: oem.org_id,
        name: oem.name,
        industry: oem.industry,
      },
      commodity_exposures: commodityExposures,
      active_risks: riskExposures,
      risk_count: riskExposures.length,
    };
  } catch (err) {
    logger.error('Error getting OEM exposure', { error: err.message });
    throw err;
  }
};

/**
 * Get regional risk summary
 */
export const getRegionalRiskSummary = async (region = null) => {
  try {
    let sql = `
      SELECT
        r.id,
        r.code,
        r.name,
        r.country,
        COUNT(DISTINCT ri.id) as active_risk_count,
        AVG(ri.severity) as avg_severity,
        MAX(ri.severity) as max_severity,
        COUNT(DISTINCT e.id) as recent_event_count,
        MAX(e.detected_date) as latest_event_date
      FROM regions r
      LEFT JOIN risks ri ON ri.region_id = r.id AND ri.status = 'active'
      LEFT JOIN events e ON e.region_id = r.id AND e.detected_date > NOW() - INTERVAL '30 days'
      WHERE r.monitoring_enabled = true
    `;

    const params = [];
    if (region) {
      sql += ` AND r.code = $1`;
      params.push(region);
    }

    sql += ` GROUP BY r.id, r.code, r.name, r.country ORDER BY max_severity DESC`;

    return await queryAll(sql, params);
  } catch (err) {
    logger.error('Error getting regional risk summary', { error: err.message });
    throw err;
  }
};

/**
 * Create a new risk
 */
export const createRisk = async (riskData) => {
  try {
    const {
      risk_key,
      title,
      description,
      category,
      region_id,
      severity,
      confidence,
      exposure_score,
      start_date,
      expected_duration_days,
      affected_facility_ids,
      estimated_impact_json,
    } = riskData;

    const result = await queryOne(
      `
      INSERT INTO risks (
        risk_key, title, description, category, region_id, severity,
        confidence, exposure_score, start_date, expected_duration_days,
        affected_facility_ids, estimated_impact_json, detected_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), 'active')
      RETURNING *
    `,
      [
        risk_key,
        title,
        description,
        category,
        region_id,
        severity,
        confidence,
        exposure_score,
        start_date,
        expected_duration_days,
        affected_facility_ids,
        JSON.stringify(estimated_impact_json),
      ]
    );

    logger.info('Risk created', { risk_id: result.id, risk_key });
    return result;
  } catch (err) {
    logger.error('Error creating risk', { error: err.message });
    throw err;
  }
};

/**
 * Create a new event
 */
export const createEvent = async (eventData) => {
  try {
    const {
      event_key,
      event_type,
      title,
      description,
      raw_text_original,
      raw_text_translated,
      source,
      source_url,
      region_id,
      country,
      severity_score,
      classification_confidence,
      entities_json,
    } = eventData;

    const result = await queryOne(
      `
      INSERT INTO events (
        event_key, event_type, title, description, raw_text_original,
        raw_text_translated, source, source_url, region_id, country,
        severity_score, classification_confidence, entities_json, processed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false)
      RETURNING *
    `,
      [
        event_key,
        event_type,
        title,
        description,
        raw_text_original,
        raw_text_translated,
        source,
        source_url,
        region_id,
        country,
        severity_score,
        classification_confidence,
        JSON.stringify(entities_json),
      ]
    );

    logger.info('Event created', { event_id: result.id });
    return result;
  } catch (err) {
    logger.error('Error creating event', { error: err.message });
    throw err;
  }
};

export default {
  getRisks,
  getRiskById,
  getEvents,
  getOEMExposure,
  getRegionalRiskSummary,
  createRisk,
  createEvent,
};

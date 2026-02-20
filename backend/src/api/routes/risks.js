import express from 'express';
import { asyncHandler, AppError } from '../../utils/error-handler.js';
import * as riskRepository from '../../services/risk-repository.js';
import logger from '../../utils/logger.js';

const router = express.Router();

/**
 * GET /api/risks
 * List all active risks with filtering and pagination
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { region, severity, status = 'active', limit = 50, offset = 0 } = req.query;

    // Validate inputs
    if (limit && (isNaN(limit) || limit < 1 || limit > 500)) {
      throw new AppError('Invalid limit parameter', 400, 'INVALID_PARAM');
    }
    if (offset && (isNaN(offset) || offset < 0)) {
      throw new AppError('Invalid offset parameter', 400, 'INVALID_PARAM');
    }

    // Fetch risks
    const result = await riskRepository.getRisks({
      region,
      severity: severity ? parseInt(severity) : null,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Format response
    const formattedRisks = result.data.map((risk) => ({
      risk_id: risk.id,
      risk_key: risk.risk_key,
      title: risk.title,
      region: risk.region_code,
      region_name: risk.region_name,
      category: risk.category,
      severity: risk.severity,
      confidence: risk.confidence,
      exposure_score: risk.exposure_score,
      detected_date: risk.detected_date,
      start_date: risk.start_date,
      expected_duration_days: risk.expected_duration_days,
      status: risk.status,
      estimated_impact: risk.estimated_impact_json,
    }));

    res.json({
      data: formattedRisks,
      pagination: result.pagination,
    });
  })
);

/**
 * GET /api/risks/:riskId
 * Get detailed risk information with supply chain impact
 */
router.get(
  '/:riskId',
  asyncHandler(async (req, res) => {
    const { riskId } = req.params;

    if (!riskId) {
      throw new AppError('Risk ID is required', 400, 'MISSING_PARAM');
    }

    const risk = await riskRepository.getRiskById(riskId);

    if (!risk) {
      throw new AppError('Risk not found', 404, 'NOT_FOUND');
    }

    // Format response
    const response = {
      risk_id: risk.id,
      risk_key: risk.risk_key,
      title: risk.title,
      description: risk.description,
      region: risk.region_code,
      region_name: risk.region_name,
      category: risk.category,
      severity: risk.severity,
      confidence: risk.confidence,
      exposure_score: risk.exposure_score,
      detected_date: risk.detected_date,
      start_date: risk.start_date,
      expected_duration_days: risk.expected_duration_days,
      status: risk.status,
      estimated_impact: risk.estimated_impact_json,
      affected_facilities: risk.affected_facilities.map((f) => ({
        facility_id: f.facility_id,
        name: f.name,
        type: f.facility_type,
        country: f.country,
      })),
      oems_exposed: risk.oems_exposed.map((o) => ({
        oem_id: o.org_id,
        name: o.name,
        tier1_suppliers_affected: o.affected_tier1_suppliers,
        disruption_probability_6w: o.disruption_probability_6w,
        estimated_disruption_days: o.estimated_disruption_days,
        assessment: o.risk_assessment_json,
      })),
      mitigation_notes: risk.mitigation_notes,
    };

    res.json(response);
  })
);

export default router;

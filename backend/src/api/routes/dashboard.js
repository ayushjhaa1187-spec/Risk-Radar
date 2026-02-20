import express from 'express';
import { asyncHandler } from '../../utils/error-handler.js';
import * as riskRepository from '../../services/risk-repository.js';

const router = express.Router();

/**
 * GET /api/dashboard-summary
 * Get all data needed for dashboard home page
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { regions = 'peru,mexico,vietnam' } = req.query;
    const regionList = regions.split(',').map((r) => r.trim());

    // 1. Get regional risk summaries
    const regionalSummaries = [];
    for (const region of regionList) {
      const summary = await riskRepository.getRegionalRiskSummary(region);
      if (summary && summary.length > 0) {
        regionalSummaries.push(summary[0]);
      }
    }

    // 2. Get recent events
    const recentEvents = await riskRepository.getEvents({
      limit: 10,
      offset: 0,
    });

    // 3. Get critical risks (severity >= 4)
    const criticalRisks = await riskRepository.getRisks({
      severity: 4,
      limit: 5,
      offset: 0,
    });

    // 4. Calculate global risk score
    const allRisks = await riskRepository.getRisks({
      limit: 1000,
      offset: 0,
    });

    const globalRiskScore =
      allRisks.data.length > 0
        ? allRisks.data.reduce((sum, r) => sum + (r.exposure_score || 0), 0) /
          allRisks.data.length
        : 0;

    // 5. Format response
    const response = {
      global_risk_score: globalRiskScore.toFixed(3),
      active_risks_count: allRisks.pagination.total,
      regions: regionalSummaries.map((r) => ({
        region: r.code,
        region_name: r.name,
        country: r.country,
        risk_score:
          r.max_severity && r.active_risk_count
            ? (r.max_severity / 5) * (r.active_risk_count / 50)
            : 0,
        active_risks: r.active_risk_count || 0,
        recent_events: r.recent_event_count || 0,
        latest_event: r.latest_event_date,
        map_color: mapRiskToColor(r.max_severity),
      })),
      critical_alerts: criticalRisks.data.slice(0, 3).map((r) => ({
        risk_id: r.id,
        risk_key: r.risk_key,
        title: r.title,
        region: r.region_code,
        severity: r.severity,
        detected_date: r.detected_date,
        status: r.status,
      })),
      recent_events_timeline: recentEvents.data.slice(0, 5).map((e) => ({
        event_id: e.id,
        event_key: e.event_key,
        title: e.title,
        timestamp: e.detected_date,
        region: e.region_code,
        type: e.event_type,
        severity: e.severity_score,
      })),
      summary: {
        regions_monitored: regionalSummaries.length,
        total_active_risks: allRisks.pagination.total,
        critical_risks: criticalRisks.data.length,
        recent_events: recentEvents.pagination.total,
      },
    };

    res.json(response);
  })
);

/**
 * Map risk severity to color
 */
const mapRiskToColor = (maxSeverity) => {
  if (!maxSeverity) return 'gray';
  if (maxSeverity >= 4) return 'red';
  if (maxSeverity === 3) return 'orange';
  if (maxSeverity === 2) return 'yellow';
  return 'green';
};

export default router;

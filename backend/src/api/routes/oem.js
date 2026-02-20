import express from 'express';
import { asyncHandler, AppError } from '../../utils/error-handler.js';
import * as riskRepository from '../../services/risk-repository.js';

const router = express.Router();

/**
 * GET /api/oem-exposure
 * Get OEM supply chain exposure analysis
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { oem_id, commodity, time_horizon = 6 } = req.query;

    if (!oem_id) {
      throw new AppError('OEM ID is required', 400, 'MISSING_PARAM');
    }

    // Fetch OEM exposure
    const exposure = await riskRepository.getOEMExposure(oem_id, {
      commodity,
      active_only: true,
    });

    if (!exposure) {
      throw new AppError('OEM not found', 404, 'NOT_FOUND');
    }

    // Calculate aggregated metrics
    const totalCommodityExposure = exposure.commodity_exposures.reduce(
      (sum, c) => sum + c.dependency_percentage,
      0
    );

    const highRiskCount = exposure.active_risks.filter((r) => r.severity >= 4).length;
    const mediumRiskCount = exposure.active_risks.filter((r) => r.severity === 3).length;

    const maxDisruption = exposure.active_risks.reduce(
      (max, r) => Math.max(max, r.disruption_probability_6w || 0),
      0
    );

    // Format response
    const response = {
      oem: exposure.oem,
      exposure_summary: {
        total_commodity_dependency: totalCommodityExposure,
        commodity_count: exposure.commodity_exposures.length,
        active_risks: exposure.risk_count,
        high_severity_risks: highRiskCount,
        medium_severity_risks: mediumRiskCount,
        max_disruption_probability_6w: maxDisruption.toFixed(3),
        overall_risk_level:
          maxDisruption > 0.6 ? 'HIGH' : maxDisruption > 0.3 ? 'MEDIUM' : 'LOW',
      },
      commodity_exposures: exposure.commodity_exposures.map((c) => ({
        commodity: c.commodity_code,
        commodity_name: c.commodity_name,
        dependency_percentage: c.dependency_percentage,
        concentration_risk: c.concentration_risk_level,
        tier2_suppliers: c.tier2_supplier_count,
        alternative_sources: c.alternative_sources,
      })),
      top_risks: exposure.active_risks.slice(0, 5).map((r) => ({
        risk_id: r.risk_id,
        risk_key: r.risk_key,
        title: r.title,
        category: r.category,
        severity: r.severity,
        affected_tier1_suppliers: r.affected_tier1_suppliers,
        disruption_probability_6w: r.disruption_probability_6w,
        estimated_disruption_days: r.estimated_disruption_days,
      })),
      forecast_6weeks: {
        time_horizon_weeks: parseInt(time_horizon),
        expected_disruptions: exposure.active_risks.filter(
          (r) => r.disruption_probability_6w > 0.3
        ).length,
        recommended_actions: generateRecommendedActions(exposure),
      },
    };

    res.json(response);
  })
);

/**
 * Generate recommended actions based on exposure
 */
const generateRecommendedActions = (exposure) => {
  const actions = [];

  // Check for high concentration risk
  const highConcentrationCommodities = exposure.commodity_exposures.filter(
    (c) => c.concentration_risk_level === 'HIGH'
  );
  if (highConcentrationCommodities.length > 0) {
    actions.push({
      priority: 'HIGH',
      action: 'Diversify supplier base',
      detail: `${highConcentrationCommodities.length} commodity has high geographic concentration risk`,
      estimated_cost_usd: 500000,
    });
  }

  // Check for high-risk events
  const highSeverityRisks = exposure.active_risks.filter((r) => r.severity >= 4);
  if (highSeverityRisks.length > 0) {
    actions.push({
      priority: 'URGENT',
      action: 'Activate contingency plans',
      detail: `${highSeverityRisks.length} high-severity risk(s) detected`,
      timeline: '1-2 weeks',
    });
  }

  // Buffer inventory recommendation
  const totalDependency = exposure.commodity_exposures.reduce(
    (sum, c) => sum + c.dependency_percentage,
    0
  );
  if (totalDependency > 20) {
    const bufferWeeks = Math.ceil(totalDependency / 30);
    actions.push({
      priority: 'MEDIUM',
      action: 'Increase inventory buffer',
      detail: `Maintain ${bufferWeeks}-${bufferWeeks + 2} weeks of critical commodity inventory`,
      timeline: 'Immediately',
    });
  }

  return actions;
};

export default router;

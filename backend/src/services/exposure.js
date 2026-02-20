/**
 * Exposure Service
 *
 * Calculates how much each OEM is exposed to supply chain risks
 * Traverses supply chain: Risk → Facility → Suppliers → Tier-1 → OEM
 */

import logger from '../utils/logger.js';
import { calculateExposureScore, calculateDisruptionProbability, estimateImpactTimeline } from './risk-scoring.js';

/**
 * Calculate OEM exposure to a specific risk
 */
export const calculateOEMExposure = async (oemData, riskData, supplyChainConnections) => {
  try {
    const { oem_id, name: oemName } = oemData;
    const { id: riskId, title: riskTitle, severity, start_date, expected_duration_days } = riskData;

    // Count affected Tier-1 suppliers
    const affectedTier1Suppliers = supplyChainConnections.filter(
      (conn) => conn.supplier_tier === 1
    ).length;

    // Calculate exposure percentage
    const exposureData = {
      commodity: supplyChainConnections[0]?.commodity || 'unknown',
      dependency_percentage: supplyChainConnections.reduce(
        (sum, conn) => sum + (conn.dependency_pct || 0),
        0
      ) / Math.max(supplyChainConnections.length, 1),
      affected_tier1_suppliers: affectedTier1Suppliers,
      alternative_sources: supplyChainConnections.filter((c) => c.alternative_available).length,
    };

    // Calculate scores
    const exposureScore = calculateExposureScore(oemData, riskData, exposureData);
    const disruptionProbability = calculateDisruptionProbability(riskData, 6);
    const timeline = estimateImpactTimeline({ facility_type: 'mine' }, { lead_time_weeks: 4 });

    logger.info('OEM exposure calculated', {
      oem_id,
      risk_id: riskId,
      exposure_score: exposureScore.toFixed(3),
      disruption_probability: disruptionProbability.toFixed(3),
    });

    return {
      oem_id,
      oem_name: oemName,
      risk_id: riskId,
      risk_title: riskTitle,
      exposed: exposureScore > 0.1,
      exposure_score: exposureScore,
      affected_tier1_suppliers: affectedTier1Suppliers,
      commodity: exposureData.commodity,
      dependency_percentage: exposureData.dependency_percentage,
      alternative_sources: exposureData.alternative_sources,
      disruption_probability_6w: disruptionProbability,
      estimated_disruption_days: timeline.impact_days,
      impact_assessment: {
        risk_level: exposureScore > 0.6 ? 'HIGH' : exposureScore > 0.3 ? 'MEDIUM' : 'LOW',
        supply_gap_estimate: exposureData.dependency_percentage * (1 - Math.min(1, exposureData.alternative_sources / 3)),
        recommendations: generateMitigationRecommendations(exposureData, riskData, timeline),
      },
    };
  } catch (err) {
    logger.error('Error calculating OEM exposure', { error: err.message });
    return null;
  }
};

/**
 * Get all OEMs affected by a risk
 * Returns sorted list by exposure score (highest first)
 */
export const getAffectedOEMs = async (riskData, supplyChainData) => {
  try {
    const affectedOEMs = [];

    // For each OEM in supply chain data
    for (const oemConnection of supplyChainData.oem_connections || []) {
      const exposure = await calculateOEMExposure(
        { oem_id: oemConnection.oem_id, name: oemConnection.oem_name },
        riskData,
        oemConnection.supply_chain_path
      );

      if (exposure && exposure.exposed) {
        affectedOEMs.push(exposure);
      }
    }

    // Sort by exposure score (highest first)
    return affectedOEMs.sort((a, b) => b.exposure_score - a.exposure_score);
  } catch (err) {
    logger.error('Error getting affected OEMs', { error: err.message });
    return [];
  }
};

/**
 * Calculate commodity exposure for an OEM
 * Returns exposure metrics for each commodity they depend on
 */
export const calculateCommodityExposure = async (oemId, commoditySupplyData) => {
  try {
    const commodityExposures = {};

    for (const [commodity, supplyInfo] of Object.entries(commoditySupplyData)) {
      const {
        dependency_pct = 5,
        source_regions = [],
        active_risks = [],
        tier2_supplier_count = 0,
        alternative_supplier_count = 0,
      } = supplyInfo;

      // Calculate regional concentration risk
      const concentrationRisk = calculateConcentrationRisk(source_regions);

      // Calculate number of active risks affecting this commodity
      const affectedRisk = active_risks.reduce((max, risk) => Math.max(max, risk.severity), 0);

      // Calculate exposure score for this commodity
      const commodityExposureScore =
        (dependency_pct / 100) * (affectedRisk / 5) * (1 - alternative_supplier_count * 0.25);

      commodityExposures[commodity] = {
        dependency_percentage: dependency_pct,
        primary_source_regions: source_regions,
        regional_concentration_risk: concentrationRisk,
        tier2_supplier_count: tier2_supplier_count,
        alternative_supplier_count: alternative_supplier_count,
        active_risks: affectedRisk,
        exposure_score: Math.min(1, commodityExposureScore),
        lead_time_weeks: calculateLeadTime(source_regions),
        recommended_buffer_weeks: Math.ceil(dependency_pct / 20), // 1 week per 20% dependency
      };
    }

    return commodityExposures;
  } catch (err) {
    logger.error('Error calculating commodity exposure', { error: err.message });
    return {};
  }
};

/**
 * Calculate regional concentration risk
 * High concentration in one region = HIGH risk
 */
const calculateConcentrationRisk = (regions = []) => {
  if (regions.length === 0) return 'UNKNOWN';
  if (regions.length === 1) return 'HIGH';
  if (regions.length === 2) return 'MEDIUM';
  return 'LOW';
};

/**
 * Calculate lead time based on source regions
 */
const calculateLeadTime = (regions = []) => {
  const regionLeadTimes = {
    peru: 4,
    mexico: 2,
    vietnam: 3,
    china: 4,
    india: 5,
    other: 6,
  };

  const avgLeadTime = regions.reduce((sum, region) => {
    return sum + (regionLeadTimes[region.toLowerCase()] || 4);
  }, 0) / Math.max(regions.length, 1);

  return Math.ceil(avgLeadTime);
};

/**
 * Generate mitigation recommendations
 */
const generateMitigationRecommendations = (exposureData, riskData, timeline) => {
  const recommendations = [];
  const { severity = 3 } = riskData;
  const { dependency_percentage = 0, alternative_sources = 0 } = exposureData;

  // Buffer inventory recommendation
  const bufferWeeks = Math.ceil(dependency_percentage / 20);
  recommendations.push({
    action: 'Increase inventory buffer',
    detail: `${bufferWeeks}-${bufferWeeks + 2} weeks of ${exposureData.commodity} inventory`,
    priority: severity >= 4 ? 'URGENT' : 'HIGH',
    timeline: 'Immediately',
  });

  // Alternative sourcing
  if (alternative_sources < 2) {
    recommendations.push({
      action: 'Activate alternative suppliers',
      detail: `Source from $${alternative_sources === 0 ? 'new' : 'existing alternative'} suppliers to reduce concentration risk`,
      priority: 'HIGH',
      timeline: `${timeline.earliest_impact_weeks} weeks`,
    });
  }

  // Hedging for volatile commodities
  if (exposureData.commodity.includes('raw_material')) {
    recommendations.push({
      action: 'Financial hedging',
      detail: 'Consider futures contracts or price locks on critical commodities',
      priority: 'MEDIUM',
      timeline: '1-2 weeks',
    });
  }

  // Strategic partnerships
  recommendations.push({
    action: 'Strengthen supplier relationships',
    detail: 'Contact Tier-1 suppliers to discuss contingency plans and backup sourcing',
    priority: 'MEDIUM',
    timeline: 'Within 1 week',
  });

  return recommendations;
};

/**
 * Calculate total supply chain value at risk
 */
export const calculateSupplyChainValueAtRisk = (oemSupplyChain, affectedRisks) => {
  try {
    let totalValue = 0;
    let riskValue = 0;

    for (const [commodity, supplyInfo] of Object.entries(oemSupplyChain)) {
      const { annual_value_usd = 0, dependency_pct = 0 } = supplyInfo;
      totalValue += annual_value_usd;

      // Check if this commodity has active risks
      const hasRisk = affectedRisks.some((risk) => risk.commodity === commodity);
      if (hasRisk) {
        riskValue += annual_value_usd * (dependency_pct / 100);
      }
    }

    return {
      total_supply_chain_value: totalValue,
      value_at_risk: riskValue,
      percentage_at_risk: totalValue > 0 ? (riskValue / totalValue) * 100 : 0,
    };
  } catch (err) {
    logger.error('Error calculating supply chain value at risk', { error: err.message });
    return {
      total_supply_chain_value: 0,
      value_at_risk: 0,
      percentage_at_risk: 0,
    };
  }
};

/**
 * Forecast OEM supply chain disruption over time horizon
 */
export const forecastDisruption = (riskData, supplyChainExposure, timeHorizonWeeks = 6) => {
  try {
    const forecast = [];

    for (let week = 0; week <= timeHorizonWeeks; week++) {
      // Simulate time decay and event progression
      const timeDecay = Math.pow(0.95, week);
      const probability = calculateDisruptionProbability(riskData, timeHorizonWeeks - week);
      const expectedDisruption = probability * supplyChainExposure * timeDecay;

      forecast.push({
        week,
        probability: probability.toFixed(3),
        expected_disruption: expectedDisruption.toFixed(3),
        risk_level: expectedDisruption > 0.6 ? 'HIGH' : expectedDisruption > 0.3 ? 'MEDIUM' : 'LOW',
      });
    }

    return {
      time_horizon_weeks: timeHorizonWeeks,
      forecast: forecast,
      peak_risk_week: forecast.reduce((max, f) => (f.probability > max.probability ? f : max)),
    };
  } catch (err) {
    logger.error('Error forecasting disruption', { error: err.message });
    return {
      time_horizon_weeks: timeHorizonWeeks,
      forecast: [],
      peak_risk_week: null,
    };
  }
};

export default {
  calculateOEMExposure,
  getAffectedOEMs,
  calculateCommodityExposure,
  calculateSupplyChainValueAtRisk,
  forecastDisruption,
};

/**
 * Risk Scoring Service
 *
 * Calculates risk score for events and risks using weighted formula:
 * Risk Score = Severity × Confidence × Regional Production Share × Commodity Criticality × Time Factor
 */

import logger from '../utils/logger.js';

// Configuration (from database later, hardcoded now for MVP)
const WEIGHTS = {
  severity: {
    strike: 0.85,
    bankruptcy: 0.90,
    environmental_shutdown: 0.75,
    regulatory_action: 0.70,
    infrastructure_outage: 0.60,
    labor_protest: 0.65,
  },
  minConfidenceThreshold: 0.60,
  impactDecayRateWeekly: 0.05,
  substitutionDifficultyMultiplier: {
    high: 3.0,
    medium: 2.0,
    low: 1.0,
  },
};

const SEVERITY_SCALE = {
  strike: { min: 3, max: 5 },
  bankruptcy: { min: 4, max: 5 },
  environmental_shutdown: { min: 2, max: 4 },
  regulatory_action: { min: 2, max: 4 },
  infrastructure_outage: { min: 1, max: 3 },
  labor_protest: { min: 1, max: 3 },
};

/**
 * Calculate event severity (1-5 scale)
 * Based on event type and indicators
 */
export const calculateEventSeverity = (eventData) => {
  const { event_type, indicators = {} } = eventData;

  const range = SEVERITY_SCALE[event_type] || { min: 1, max: 3 };
  let severity = range.min;

  // Adjust based on indicators
  const { scope, participants, historical_impact } = indicators;

  if (scope === 'major' || participants > 1000 || historical_impact === 'high') {
    severity = range.max;
  } else if (scope === 'moderate' || participants > 500 || historical_impact === 'medium') {
    severity = Math.ceil((range.min + range.max) / 2);
  }

  // Clamp to 1-5
  return Math.max(1, Math.min(5, severity));
};

/**
 * Calculate impact decay over time
 * This week: 100% impact
 * Next week: 95% impact (0.95 factor)
 * 2 weeks: 90.25% impact (0.95^2)
 * etc.
 */
const calculateTimeDecay = (daysAgo) => {
  const weeksAgo = daysAgo / 7;
  return Math.pow(1 - WEIGHTS.impactDecayRateWeekly, weeksAgo);
};

/**
 * Calculate regional production share impact
 * If a region produces 80% of a commodity, risk has 80% higher potential impact
 */
const calculateRegionalProductionShare = (regionProductionData) => {
  const { globalProduction = 100, regionProduction = 80 } = regionProductionData;
  return Math.min(1.0, regionProduction / globalProduction);
};

/**
 * Calculate commodity supply dependency risk
 * High substitution difficulty = higher risk
 */
const calculateCommodityRisk = (commodityData) => {
  const { substitution_difficulty = 'medium' } = commodityData;
  const baseMultiplier = WEIGHTS.substitutionDifficultyMultiplier[substitution_difficulty] || 1.0;
  return Math.min(2.0, baseMultiplier / 3.0); // Normalize to 0-1
};

/**
 * Main risk scoring algorithm
 * Returns score from 0-1 (internal representation)
 */
export const calculateRiskScore = (eventData, facilityData, regionData, commodityData) => {
  try {
    const {
      event_type = 'unknown',
      severity = 3,
      confidence = 0.5,
      detected_date = new Date(),
    } = eventData;

    const { annual_capacity_tonnes = 1000 } = facilityData || {};
    const { production_percentage = 0.5 } = regionData || {};
    const { substitution_difficulty = 'medium' } = commodityData || {};

    // 1. Base score from event severity
    const eventWeight = WEIGHTS.severity[event_type] || 0.65;
    const severityNormalized = severity / 5; // Convert to 0-1
    const baseScore = severityNormalized * eventWeight;

    // 2. Apply confidence
    const confidenceAdjusted = baseScore * confidence;

    // 3. Apply time decay (more recent = higher score)
    const daysAgo = Math.floor((Date.now() - new Date(detected_date)) / (1000 * 60 * 60 * 24));
    const timeDecay = calculateTimeDecay(daysAgo);
    const timeAdjusted = confidenceAdjusted * timeDecay;

    // 4. Regional production multiplier
    const regionalMultiplier = calculateRegionalProductionShare({
      globalProduction: 100,
      regionProduction: production_percentage * 100,
    });

    // 5. Commodity substitution difficulty
    const commodityRisk = calculateCommodityRisk({ substitution_difficulty });

    // 6. Facility capacity impact (small capacity mines = more critical)
    const capacityFactor = Math.min(1.0, 100 / Math.max(annual_capacity_tonnes, 10));

    // Final score: combine all factors
    const finalScore = timeAdjusted * regionalMultiplier * commodityRisk * capacityFactor;

    logger.debug('Risk score calculated', {
      event_type,
      baseScore: baseScore.toFixed(3),
      confidenceAdjusted: confidenceAdjusted.toFixed(3),
      timeAdjusted: timeAdjusted.toFixed(3),
      finalScore: finalScore.toFixed(3),
      daysAgo,
      timeDecay: timeDecay.toFixed(3),
    });

    return Math.max(0, Math.min(1, finalScore)); // Clamp to 0-1
  } catch (err) {
    logger.error('Error calculating risk score', { error: err.message });
    return 0.3; // Default moderate score on error
  }
};

/**
 * Calculate exposure score for OEM
 * How much of their supply chain is affected?
 */
export const calculateExposureScore = (oemData, riskData, supplyChainData) => {
  try {
    const {
      commodity,
      dependency_percentage = 10,
      affected_tier1_suppliers = 1,
      alternative_sources = 0,
    } = supplyChainData || {};

    const { severity = 3 } = riskData || {};

    // Base exposure from commodity dependency
    let exposureScore = (dependency_percentage / 100) * (severity / 5);

    // Reduce exposure if alternatives available
    if (alternative_sources > 0) {
      const alternativeReduction = 1 - (alternative_sources * 0.2); // Each alt reduces by 20%
      exposureScore *= Math.max(0.1, alternativeReduction);
    }

    // Increase exposure for concentrated supply
    if (affected_tier1_suppliers === 1) {
      exposureScore *= 1.5; // Single source = high risk
    }

    return Math.max(0, Math.min(1, exposureScore));
  } catch (err) {
    logger.error('Error calculating exposure score', { error: err.message });
    return 0.2;
  }
};

/**
 * Calculate disruption probability (0-1)
 * Based on risk severity, event phase, and historical patterns
 */
export const calculateDisruptionProbability = (riskData, timeHorizonWeeks = 6) => {
  try {
    const {
      severity = 3,
      confidence = 0.5,
      status = 'active',
      start_date,
      expected_duration_days = 14,
    } = riskData || {};

    // Base probability from severity
    const severityFactor = (severity / 5) * confidence;

    // Phase factor: escalating risks have higher probability
    const phaseFactor = status === 'escalating' ? 1.2 : 1.0;

    // Timeline factor: if risk occurs within time horizon, higher probability
    let timelineFactor = 0.5;
    if (start_date) {
      const daysUntilStart = Math.floor((new Date(start_date) - Date.now()) / (1000 * 60 * 60 * 24));
      const weeksUntilStart = daysUntilStart / 7;

      if (weeksUntilStart < timeHorizonWeeks) {
        timelineFactor = 1.0 - (weeksUntilStart / timeHorizonWeeks) * 0.3;
      } else {
        timelineFactor = 0.2;
      }
    }

    const probability = severityFactor * phaseFactor * timelineFactor;
    return Math.max(0, Math.min(1, probability));
  } catch (err) {
    logger.error('Error calculating disruption probability', { error: err.message });
    return 0.3;
  }
};

/**
 * Estimate impact duration in days
 * Based on event type and historical data
 */
export const estimateDurationDays = (eventData) => {
  const { event_type = 'unknown', expected_duration_days = null } = eventData;

  // Return provided estimate if available
  if (expected_duration_days) {
    return expected_duration_days;
  }

  // Default estimates by event type
  const typicalDurations = {
    strike: 21, // Typically 2-4 weeks
    bankruptcy: 180, // 6 months resolution
    environmental_shutdown: 60, // 2 months for permits
    regulatory_action: 45, // 1-2 months
    infrastructure_outage: 7, // 1 week
    labor_protest: 3, // Few days
  };

  return typicalDurations[event_type] || 14;
};

/**
 * Estimate supply chain impact timeline
 * From facility disruption to OEM impact
 */
export const estimateImpactTimeline = (facilityData, supplyChainData) => {
  try {
    const { facility_type = 'mine' } = facilityData || {};
    const { lead_time_weeks = 4 } = supplyChainData || {};

    // Facility types have different impact delays
    const baseDelayWeeks = {
      mine: 4, // Mine → Smelter → Component → OEM
      smelter: 2,
      refinery: 2,
      manufacturing: 1,
      assembly: 0.5,
    };

    const facilityDelay = baseDelayWeeks[facility_type] || 3;
    const totalImpactWeeks = facilityDelay + lead_time_weeks;

    return {
      earliest_impact_weeks: facilityDelay,
      typical_impact_weeks: totalImpactWeeks,
      impact_days: Math.floor(totalImpactWeeks * 7),
    };
  } catch (err) {
    logger.error('Error estimating impact timeline', { error: err.message });
    return {
      earliest_impact_weeks: 2,
      typical_impact_weeks: 4,
      impact_days: 28,
    };
  }
};

export default {
  calculateEventSeverity,
  calculateRiskScore,
  calculateExposureScore,
  calculateDisruptionProbability,
  estimateDurationDays,
  estimateImpactTimeline,
  WEIGHTS,
};

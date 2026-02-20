import {
  calculateEventSeverity,
  calculateRiskScore,
  estimateDurationDays,
} from '../../src/services/risk-scoring.js';

describe('risk-scoring', () => {
  test('calculateEventSeverity increases with indicators', () => {
    const sevLow = calculateEventSeverity({ event_type: 'strike', indicators: { participants: 10 } });
    const sevHigh = calculateEventSeverity({ event_type: 'strike', indicators: { participants: 2000 } });
    expect(sevHigh).toBeGreaterThan(sevLow);
    expect(sevHigh).toBeGreaterThanOrEqual(4);
  });

  test('calculateRiskScore clamps between 0 and 1', () => {
    const score = calculateRiskScore(
      { event_type: 'strike', severity: 5, confidence: 0.9, detected_date: new Date() },
      { annual_capacity_tonnes: 50 },
      { production_percentage: 0.8 },
      { substitution_difficulty: 'high' },
    );
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  test('estimateDurationDays uses defaults per event type', () => {
    expect(estimateDurationDays({ event_type: 'infrastructure_outage' })).toBe(7);
    expect(estimateDurationDays({ event_type: 'strike' })).toBe(21);
  });
});

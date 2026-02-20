import express from 'express';
import { asyncHandler } from '../../utils/error-handler.js';

const router = express.Router();

/**
 * GET /api/dashboard-summary
 * Get all data needed for dashboard home page
 */
router.get('/', asyncHandler(async (req, res) => {
  const { regions = 'peru,mexico,vietnam' } = req.query;

  // TODO: Aggregate risks by region
  // TODO: Get recent events
  // TODO: Calculate global risk score
  // TODO: Identify critical alerts

  res.json({
    global_risk_score: 0,
    active_risks_count: 0,
    regions: [],
    critical_alerts: [],
    recent_events_timeline: []
  });
}));

export default router;

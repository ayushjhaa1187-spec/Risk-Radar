import express from 'express';
import { asyncHandler } from '../../utils/error-handler.js';

const router = express.Router();

/**
 * GET /api/regions
 * List all monitored regions
 */
router.get('/', asyncHandler(async (req, res) => {
  // TODO: Retrieve monitored regions from database
  // TODO: Include risk metrics for each region

  const regions = [
    {
      region_code: 'peru',
      region_name: 'Peru',
      country: 'Peru',
      primary_commodities: ['copper', 'lithium'],
      risk_level: 'HIGH',
      monitored_since: '2026-01-15'
    },
    {
      region_code: 'mexico',
      region_name: 'Mexico',
      country: 'Mexico',
      primary_commodities: ['copper', 'semiconductors', 'auto_parts'],
      risk_level: 'MEDIUM',
      monitored_since: '2026-01-15'
    },
    {
      region_code: 'vietnam',
      region_name: 'Vietnam',
      country: 'Vietnam',
      primary_commodities: ['semiconductors', 'electronics'],
      risk_level: 'MEDIUM',
      monitored_since: '2026-01-15'
    }
  ];

  res.json({
    data: regions
  });
}));

export default router;

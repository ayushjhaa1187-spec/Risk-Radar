import express from 'express';
import { asyncHandler } from '../../utils/error-handler.js';
import { queryAll } from '../../utils/db.js';
import logger from '../../utils/logger.js';

const router = express.Router();

/**
 * GET /api/regions
 * List all monitored regions (DB-backed, fallback to static)
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      const regions = await queryAll(
        `
        SELECT
          code as region_code,
          name as region_name,
          country,
          primary_commodities,
          monitoring_enabled,
          monitored_since,
          COALESCE(NULLIF(monitoring_enabled, FALSE), TRUE) AS is_active
        FROM regions
        WHERE monitoring_enabled = TRUE
        ORDER BY region_name
      `,
      );

      if (regions && regions.length > 0) {
        return res.json({ data: regions });
      }
    } catch (err) {
      logger.warn('Falling back to static regions list', { error: err.message });
    }

    // Fallback static list for local/dev without DB
    const fallback = [
      {
        region_code: 'peru',
        region_name: 'Peru',
        country: 'Peru',
        primary_commodities: ['copper', 'lithium'],
        risk_level: 'HIGH',
        monitored_since: '2026-01-15',
      },
      {
        region_code: 'mexico',
        region_name: 'Mexico',
        country: 'Mexico',
        primary_commodities: ['copper', 'semiconductors', 'auto_parts'],
        risk_level: 'MEDIUM',
        monitored_since: '2026-01-15',
      },
      {
        region_code: 'vietnam',
        region_name: 'Vietnam',
        country: 'Vietnam',
        primary_commodities: ['semiconductors', 'electronics'],
        risk_level: 'MEDIUM',
        monitored_since: '2026-01-15',
      },
    ];

    res.json({ data: fallback });
  }),
);

export default router;

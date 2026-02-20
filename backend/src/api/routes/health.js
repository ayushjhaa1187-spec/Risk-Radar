import express from 'express';
import { queryOne } from '../../utils/db.js';

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint for deployment monitoring
 */
router.get('/', async (req, res) => {
  try {
    const skipDb = process.env.NODE_ENV === 'test' || process.env.HEALTH_SKIP_DB === 'true';

    // Check database connection
    let dbResult = null;
    if (!skipDb) {
      dbResult = await queryOne('SELECT NOW() as timestamp');
    }

    if (!skipDb && !dbResult) {
      return res.status(503).json({
        status: 'unhealthy',
        database: 'failed',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      status: 'healthy',
      database: skipDb ? 'skipped' : 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'error',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

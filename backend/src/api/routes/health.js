import express from 'express';
import { queryOne } from '../../utils/db.js';

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint for deployment monitoring
 */
router.get('/', async (req, res) => {
  try {
    // Check database connection
    const dbResult = await queryOne('SELECT NOW() as timestamp');

    if (!dbResult) {
      return res.status(503).json({
        status: 'unhealthy',
        database: 'failed',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      status: 'healthy',
      database: 'connected',
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

import express from 'express';
import { asyncHandler, AppError } from '../../utils/error-handler.js';
import * as riskRepository from '../../services/risk-repository.js';

const router = express.Router();

/**
 * GET /api/events
 * Get classified events with filters
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      region,
      event_type,
      start_date,
      end_date,
      limit = 20,
      offset = 0,
    } = req.query;

    // Validate inputs
    if (limit && (isNaN(limit) || limit < 1 || limit > 500)) {
      throw new AppError('Invalid limit parameter', 400, 'INVALID_PARAM');
    }
    if (offset && (isNaN(offset) || offset < 0)) {
      throw new AppError('Invalid offset parameter', 400, 'INVALID_PARAM');
    }

    // Validate date range
    if (start_date && isNaN(new Date(start_date).getTime())) {
      throw new AppError('Invalid start_date format', 400, 'INVALID_DATE');
    }
    if (end_date && isNaN(new Date(end_date).getTime())) {
      throw new AppError('Invalid end_date format', 400, 'INVALID_DATE');
    }

    // Fetch events
    const result = await riskRepository.getEvents({
      region,
      event_type,
      start_date,
      end_date,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Format response
    const formattedEvents = result.data.map((event) => ({
      event_id: event.id,
      event_key: event.event_key,
      title: event.title,
      event_type: event.event_type,
      severity: event.severity_score,
      confidence: event.classification_confidence,
      detected_date: event.detected_date,
      occurrence_date: event.occurrence_date,
      region: event.region_code,
      region_name: event.region_name,
      source: event.source,
      description: event.description,
      entities_detected: event.entities_json || [],
    }));

    res.json({
      data: formattedEvents,
      pagination: result.pagination,
    });
  })
);

export default router;

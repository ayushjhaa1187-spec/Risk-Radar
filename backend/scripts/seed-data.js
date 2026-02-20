/**
 * Seed minimal data for local development using docs/mock-data.json.
 */
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import logger from '../src/utils/logger.js';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const mockPath = path.resolve(process.cwd(), 'docs', 'mock-data.json');

async function seed() {
  const data = JSON.parse(fs.readFileSync(mockPath, 'utf-8'));
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Seed regions
    for (const region of data.regions.data) {
      await client.query(
        `INSERT INTO regions (code, name, country, primary_commodities, monitoring_enabled, monitored_since)
         VALUES ($1,$2,$3,$4,true,$5)
         ON CONFLICT (code) DO NOTHING`,
        [region.region_code, region.region_name, region.country, region.primary_commodities, region.monitored_since],
      );
    }

    // Seed events (trim to 5)
    for (const event of data.events.data.slice(0, 5)) {
      await client.query(
        `INSERT INTO events (event_key, event_type, title, description, raw_text_original, raw_text_translated,
          detected_date, occurrence_date, source, source_url, region_id, country, severity_score, classification_confidence, entities_json, processed)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
           (SELECT id FROM regions WHERE code=$11),
           $12,$13,$14,$15,false)
         ON CONFLICT (event_key) DO NOTHING`,
        [
          event.event_id,
          event.event_type,
          event.title,
          event.description,
          event.raw_text_translated,
          event.raw_text_translated,
          event.detected_date,
          event.occurrence_date,
          event.source,
          event.source_url,
          event.region,
          event.region?.toUpperCase() || 'XX',
          event.severity,
          event.confidence || 0.7,
          JSON.stringify(event.entities_detected || []),
        ],
      );
    }

    // Seed risks (trim to 3)
    for (const risk of data.risks.data.slice(0, 3)) {
      await client.query(
        `INSERT INTO risks (risk_key, title, description, category, region_id, severity, confidence, exposure_score,
          detected_date, start_date, expected_duration_days, status, estimated_impact_json)
         VALUES ($1,$2,$3,$4,
           (SELECT id FROM regions WHERE code=$5),
           $6,$7,$8,$9,$10,$11,'active',$12)
         ON CONFLICT (risk_key) DO NOTHING`,
        [
          risk.risk_id,
          risk.title,
          risk.description,
          risk.category,
          risk.region,
          risk.severity,
          risk.confidence || 0.7,
          risk.exposure_score || 0.4,
          risk.detected_date,
          risk.start_date,
          risk.expected_duration_days,
          JSON.stringify(risk.estimated_impact),
        ],
      );
    }

    await client.query('COMMIT');
    logger.info('Seed data inserted');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Seed failed', { error: err.message });
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

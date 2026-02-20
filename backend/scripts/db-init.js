/**
 * Apply database/schema.sql using pg.
 * Usage: npm run db:init
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

async function run() {
  const schemaPath = path.resolve(process.cwd(), 'backend', 'database', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  const client = await pool.connect();
  try {
    logger.info('Applying schema...', { schemaPath });
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    logger.info('Schema applied successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Failed to apply schema', { error: err.message });
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();

import pg from 'pg';
import logger from '../utils/logger.js';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', { error: err });
});

export const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    if (duration > 1000) {
      logger.warn('Slow query detected', {
        duration,
        query: text.substring(0, 100)
      });
    }

    return res;
  } catch (err) {
    logger.error('Database query error', {
      error: err.message,
      query: text
    });
    throw err;
  }
};

export const queryOne = async (text, params = []) => {
  const res = await query(text, params);
  return res.rows[0] || null;
};

export const queryAll = async (text, params = []) => {
  const res = await query(text, params);
  return res.rows;
};

export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const getPool = () => pool;

export default {
  query,
  queryOne,
  queryAll,
  transaction,
  getPool
};

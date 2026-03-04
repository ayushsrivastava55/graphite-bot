import pg from 'pg';
import { config } from '../config.js';
import { log } from '../utils/logger.js';

const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (err) => {
  log.error('Unexpected pool error', { error: err.message });
});

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  log.debug('query', { text: text.slice(0, 80), rows: result.rowCount, ms: Date.now() - start });
  return result;
}

export async function testConnection(): Promise<void> {
  const res = await pool.query('SELECT NOW()');
  log.info('DB connected', { time: res.rows[0].now });
}

export async function endPool(): Promise<void> {
  await pool.end();
  log.info('DB pool closed');
}

export { pool };

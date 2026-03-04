import { query } from './client.js';

export async function logStart(jobName: string): Promise<number> {
  const res = await query<{ id: number }>(
    `INSERT INTO scrape_log (job_name, status) VALUES ($1, 'running') RETURNING id`,
    [jobName],
  );
  return res.rows[0].id;
}

export async function logComplete(id: number, found: number, newCount: number): Promise<void> {
  await query(
    `UPDATE scrape_log SET status = 'completed', articles_found = $2, articles_new = $3, completed_at = NOW() WHERE id = $1`,
    [id, found, newCount],
  );
}

export async function logError(id: number, errorMessage: string): Promise<void> {
  await query(
    `UPDATE scrape_log SET status = 'error', error_message = $2, completed_at = NOW() WHERE id = $1`,
    [id, errorMessage],
  );
}

import { query } from './client.js';
import type { FinancialQuote } from '../types.js';

export async function insertBatch(quotes: FinancialQuote[]): Promise<void> {
  if (quotes.length === 0) return;

  const values: unknown[] = [];
  const placeholders: string[] = [];

  quotes.forEach((q, i) => {
    const offset = i * 4;
    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`,
    );
    values.push(q.company_id, q.close_price, q.market_cap, q.volume);
  });

  await query(
    `INSERT INTO financial_data (company_id, close_price, market_cap, volume)
     VALUES ${placeholders.join(', ')}`,
    values,
  );
}

export interface FinancialRow {
  id: number;
  company_id: number;
  close_price: number | null;
  market_cap: number | null;
  volume: number | null;
  week_change_pct: number | null;
  fetched_at: string;
}

export async function getLatest(): Promise<FinancialRow[]> {
  const res = await query<FinancialRow>(`
    SELECT DISTINCT ON (company_id) *
    FROM financial_data
    ORDER BY company_id, fetched_at DESC
  `);
  return res.rows;
}

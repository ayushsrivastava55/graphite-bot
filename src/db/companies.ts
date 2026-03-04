import { query } from './client.js';
import type { Company } from '../types.js';

export async function getAll(): Promise<Company[]> {
  const res = await query<Company>('SELECT * FROM companies ORDER BY id');
  return res.rows;
}

export async function getCompetitors(): Promise<Company[]> {
  const res = await query<Company>('SELECT * FROM companies WHERE is_target = FALSE ORDER BY id');
  return res.rows;
}

export async function getTarget(): Promise<Company> {
  const res = await query<Company>('SELECT * FROM companies WHERE is_target = TRUE LIMIT 1');
  if (!res.rows[0]) throw new Error('No target company found');
  return res.rows[0];
}

export async function getAllWithTicker(): Promise<Company[]> {
  const res = await query<Company>(
    'SELECT * FROM companies WHERE yahoo_ticker IS NOT NULL ORDER BY id',
  );
  return res.rows;
}

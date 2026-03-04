import { query } from './client.js';
import type { ScrapedArticle, Article } from '../types.js';

export async function dedupInsertBatch(articles: ScrapedArticle[]): Promise<Article[]> {
  if (articles.length === 0) return [];

  const values: unknown[] = [];
  const placeholders: string[] = [];

  articles.forEach((a, i) => {
    const offset = i * 6;
    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`,
    );
    values.push(
      a.company_id ?? null,
      a.source_url,
      a.title,
      a.published_date ?? null,
      a.raw_text,
      a.source_site,
    );
  });

  const sql = `
    INSERT INTO articles (company_id, source_url, title, published_date, raw_text, source_site)
    VALUES ${placeholders.join(', ')}
    ON CONFLICT (source_url) DO NOTHING
    RETURNING *
  `;

  const res = await query<Article>(sql, values);
  return res.rows;
}

export async function getRecent(limit = 50): Promise<Article[]> {
  const res = await query<Article>(
    'SELECT * FROM articles ORDER BY scraped_at DESC LIMIT $1',
    [limit],
  );
  return res.rows;
}

export async function getByIds(ids: number[]): Promise<Article[]> {
  if (ids.length === 0) return [];
  const res = await query<Article>(
    `SELECT * FROM articles WHERE id = ANY($1)`,
    [ids],
  );
  return res.rows;
}

import { query } from './client.js';

export async function insert(
  summaryType: string,
  content: string,
  articleIds: number[],
  modelUsed: string,
  tokenCount: number,
): Promise<number> {
  const res = await query<{ id: number }>(
    `INSERT INTO summaries (summary_type, content, article_ids, model_used, token_count)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [summaryType, content, articleIds, modelUsed, tokenCount],
  );
  return res.rows[0].id;
}

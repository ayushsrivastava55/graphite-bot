import { query } from './client.js';
import type { SentimentResult } from '../types.js';

export async function bulkInsert(sentiments: SentimentResult[]): Promise<void> {
  if (sentiments.length === 0) return;

  const values: unknown[] = [];
  const placeholders: string[] = [];

  sentiments.forEach((s, i) => {
    const offset = i * 5;
    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`,
    );
    values.push(s.company_id, s.article_id, s.sentiment_label, s.sentiment_score, s.reasoning);
  });

  await query(
    `INSERT INTO sentiment_scores (company_id, article_id, sentiment_label, sentiment_score, reasoning)
     VALUES ${placeholders.join(', ')}`,
    values,
  );
}

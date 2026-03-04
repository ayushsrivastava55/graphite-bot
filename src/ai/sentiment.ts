import { callGPT } from './openai.js';
import { log } from '../utils/logger.js';
import type { Article, SentimentResult } from '../types.js';

const SYSTEM_PROMPT = `You are a mining stock sentiment analyst. For each article, classify the sentiment for the associated company.

Return a JSON object with this exact structure:
{
  "results": [
    {
      "article_index": 0,
      "sentiment_label": "BREAKTHROUGH" | "POSITIVE" | "STEADY" | "NEGATIVE" | "FAILURE",
      "sentiment_score": -1.0 to 1.0,
      "reasoning": "Brief 1-2 sentence explanation"
    }
  ]
}

Scoring guide:
- BREAKTHROUGH (0.7 to 1.0): Major positive news — new resource discovery, key partnership, production start
- POSITIVE (0.3 to 0.69): Good news — funding secured, good drill results, expansion
- STEADY (-0.29 to 0.29): Neutral — routine updates, minor news
- NEGATIVE (-0.69 to -0.3): Bad news — delays, cost overruns, regulatory issues
- FAILURE (-1.0 to -0.7): Major negative — project cancellation, financial distress, litigation`;

interface SentimentJSON {
  results: {
    article_index: number;
    sentiment_label: string;
    sentiment_score: number;
    reasoning: string;
  }[];
}

export async function analyzeSentiment(
  articles: (Article & { company_id: number })[],
): Promise<{ sentiments: SentimentResult[]; tokens: number; model: string }> {
  const articleTexts = articles
    .map(
      (a, i) =>
        `[${i}] Company ID: ${a.company_id} | "${a.title}"\n${(a.raw_text ?? '').slice(0, 1500)}`,
    )
    .join('\n\n');

  const userPrompt = `Analyze sentiment for these ${articles.length} articles:\n\n${articleTexts}`;

  const res = await callGPT(SYSTEM_PROMPT, userPrompt, { jsonMode: true, maxTokens: 2000 });

  let parsed: SentimentJSON;
  try {
    parsed = JSON.parse(res.content);
  } catch {
    log.error('Failed to parse sentiment JSON', { content: res.content.slice(0, 200) });
    return { sentiments: [], tokens: res.totalTokens, model: res.model };
  }

  const sentiments: SentimentResult[] = parsed.results
    .map((r) => {
      const article = articles[r.article_index];
      if (!article) return null;
      return {
        company_id: article.company_id,
        article_id: article.id,
        sentiment_label: r.sentiment_label,
        sentiment_score: Math.max(-1, Math.min(1, r.sentiment_score)),
        reasoning: r.reasoning,
      };
    })
    .filter((s): s is SentimentResult => s !== null);

  return { sentiments, tokens: res.totalTokens, model: res.model };
}

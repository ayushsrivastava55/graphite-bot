import { callGPT } from './openai.js';
import type { Company } from '../types.js';
import type { FinancialRow } from '../db/financials.js';

const SYSTEM_PROMPT = `You are a financial analyst specializing in graphite mining stocks. Write a concise market narrative based on the financial data provided.

Structure your response as:

## FCI Market Position
[1-2 paragraphs on FCI's current financials and what they indicate]

## Peer Comparison
[1-2 paragraphs comparing FCI to notable peers — who's gaining, who's lagging]

## Market Outlook
[1 paragraph on overall graphite sector trends implied by this data]

Be specific with numbers. Reference actual price movements and volume changes.`;

export async function generateMarketNarrative(
  financials: FinancialRow[],
  companies: Company[],
): Promise<{ narrative: string; tokens: number; model: string }> {
  const companyMap = new Map(companies.map((c) => [c.id, c]));

  const dataLines = financials
    .map((f) => {
      const c = companyMap.get(f.company_id);
      if (!c) return null;
      return `${c.name} (${c.ticker}.${c.exchange}): Price=${f.close_price ?? 'N/A'}, MarketCap=${f.market_cap ?? 'N/A'}, Volume=${f.volume ?? 'N/A'}, 52wk%=${f.week_change_pct ?? 'N/A'}`;
    })
    .filter(Boolean)
    .join('\n');

  const target = companies.find((c) => c.is_target);
  const userPrompt = `Generate a market narrative for ${target?.name ?? 'FCI'} vs peers based on this week's data:\n\n${dataLines}`;

  const res = await callGPT(SYSTEM_PROMPT, userPrompt, { maxTokens: 2000 });
  return { narrative: res.content, tokens: res.totalTokens, model: res.model };
}

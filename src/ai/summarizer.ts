import { callGPT } from './openai.js';
import type { Article } from '../types.js';

const SYSTEM_PROMPT = `You are a graphite industry analyst. Summarize the provided news articles into a concise intelligence brief for a mining company executive.

Focus on:
- Drill results and resource estimates
- Funding rounds, financials, partnerships
- Production milestones and facility updates
- Regulatory and policy changes
- Market dynamics (EV demand, supply chain shifts)

Ignore marketing fluff and press release boilerplate.

IMPORTANT: Output ONLY valid HTML. Do NOT use markdown. Use these HTML tags:
<h3>Key Highlights</h3>
<ul><li>3-5 bullet points of most important developments</li></ul>

<h3>Full Summary</h3>
<p>2-3 paragraphs covering all significant news</p>

<h3>Sources Referenced</h3>
<ul><li>Article titles with brief note on each</li></ul>`;

export async function summarizeArticles(
  articles: Article[],
): Promise<{ summary: string; tokens: number; model: string }> {
  const articleTexts = articles
    .map((a, i) => `--- Article ${i + 1}: "${a.title}" ---\n${(a.raw_text ?? '').slice(0, 2000)}`)
    .join('\n\n');

  const userPrompt = `Summarize these ${articles.length} graphite industry articles:\n\n${articleTexts}`;

  const res = await callGPT(SYSTEM_PROMPT, userPrompt, { maxTokens: 3000 });
  return { summary: res.content, tokens: res.totalTokens, model: res.model };
}

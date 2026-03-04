import { log } from '../utils/logger.js';
import { config } from '../config.js';
import * as scrapeLog from '../db/scrapeLog.js';
import * as articlesDb from '../db/articles.js';
import * as companiesDb from '../db/companies.js';
import * as sentimentsDb from '../db/sentiments.js';
import * as summariesDb from '../db/summaries.js';
import { fetchAndParse } from '../scrapers/newsScraper.js';
import { defaultCompanyConfig } from '../scrapers/siteConfigs.js';
import { analyzeSentiment } from '../ai/sentiment.js';
import { summarizeArticles } from '../ai/summarizer.js';
import { sendReport } from '../email/sendgrid.js';
import { renderCompetitorSynthesis } from '../email/templates.js';
import type { ScrapedArticle, Article, SentimentResult } from '../types.js';

export async function runCompetitorSynthesis(): Promise<void> {
  const logId = await scrapeLog.logStart('competitor_synthesis');
  log.info('=== Competitor Synthesis job started ===');

  try {
    // 1. Get all competitors
    const competitors = await companiesDb.getCompetitors();
    log.info(`Analyzing ${competitors.length} competitors`);

    // 2. Scrape each competitor's news page
    const allScraped: ScrapedArticle[] = [];
    for (const company of competitors) {
      if (!company.news_page_url) continue;

      try {
        const siteConfig = {
          name: company.ticker,
          url: company.news_page_url,
          ...defaultCompanyConfig,
          baseUrl: company.website_url || undefined,
        };

        const articles = await fetchAndParse(siteConfig, company.id);
        allScraped.push(...articles);
      } catch (err) {
        log.warn(`Failed to scrape ${company.name}, continuing`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    log.info(`Total competitor articles scraped: ${allScraped.length}`);

    // 3. Dedup insert
    const newArticles = await articlesDb.dedupInsertBatch(allScraped);
    log.info(`New competitor articles inserted: ${newArticles.length}`);

    // 4. Sentiment analysis on articles with company_id
    const articlesWithCompany = newArticles.filter(
      (a): a is Article & { company_id: number } => a.company_id !== null,
    );

    const allSentiments: SentimentResult[] = [];
    let totalTokens = 0;
    let model = '';

    // Process in batches of 10
    for (let i = 0; i < articlesWithCompany.length; i += 10) {
      const batch = articlesWithCompany.slice(i, i + 10);
      const result = await analyzeSentiment(batch);
      allSentiments.push(...result.sentiments);
      totalTokens += result.tokens;
      model = result.model;
    }

    if (allSentiments.length > 0) {
      await sentimentsDb.bulkInsert(allSentiments);
      log.info(`Inserted ${allSentiments.length} sentiment scores`);
    }

    // 5. Overall summary
    let overallSummary = 'No new competitor articles found this cycle.';
    if (newArticles.length > 0) {
      const summaryResult = await summarizeArticles(newArticles);
      overallSummary = summaryResult.summary;
      totalTokens += summaryResult.tokens;

      await summariesDb.insert(
        'competitor_synthesis',
        overallSummary,
        newArticles.map((a) => a.id),
        model,
        totalTokens,
      );
    }

    // 6. Aggregate sentiments by company
    const companyMap = new Map(competitors.map((c) => [c.id, c]));
    const sentByCompany = new Map<number, SentimentResult[]>();
    for (const s of allSentiments) {
      const arr = sentByCompany.get(s.company_id) || [];
      arr.push(s);
      sentByCompany.set(s.company_id, arr);
    }

    const sentimentRows = [...sentByCompany.entries()]
      .map(([companyId, sents]) => {
        const company = companyMap.get(companyId);
        if (!company) return null;

        const avgScore = sents.reduce((sum, s) => sum + s.sentiment_score, 0) / sents.length;
        const topLabel = sents
          .sort((a, b) => Math.abs(b.sentiment_score) - Math.abs(a.sentiment_score))[0]
          ?.sentiment_label ?? 'STEADY';

        return {
          company: company.name,
          ticker: company.ticker,
          label: topLabel,
          score: Math.round(avgScore * 100) / 100,
          reasoning: sents.map((s) => s.reasoning).join(' '),
          articleCount: sents.length,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.score - a.score);

    // 7. Render and send
    const html = renderCompetitorSynthesis({
      sentiments: sentimentRows,
      overallSummary,
    });

    await sendReport(
      config.reportToEmail,
      `Competitor Sentiment Synthesis — ${new Date().toLocaleDateString('en-CA')}`,
      html,
    );

    await scrapeLog.logComplete(logId, allScraped.length, newArticles.length);
    log.info('=== Competitor Synthesis job completed ===');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error('Competitor Synthesis job failed', { error: msg });
    await scrapeLog.logError(logId, msg);
    throw err;
  }
}

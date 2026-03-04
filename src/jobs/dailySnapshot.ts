import { log } from '../utils/logger.js';
import { config } from '../config.js';
import * as scrapeLog from '../db/scrapeLog.js';
import * as articlesDb from '../db/articles.js';
import { fetchAndParse } from '../scrapers/newsScraper.js';
import { industrySites } from '../scrapers/siteConfigs.js';
import { summarizeArticles } from '../ai/summarizer.js';
import * as summariesDb from '../db/summaries.js';
import { sendReport } from '../email/sendgrid.js';
import { renderDailySnapshot } from '../email/templates.js';
import type { ScrapedArticle, Article } from '../types.js';

export async function runDailySnapshot(): Promise<void> {
  const logId = await scrapeLog.logStart('daily_snapshot');
  log.info('=== Daily Snapshot job started ===');

  try {
    // 1. Scrape all industry sites
    const allScraped: ScrapedArticle[] = [];
    for (const site of industrySites) {
      try {
        const articles = await fetchAndParse(site);
        allScraped.push(...articles);
      } catch (err) {
        log.warn(`Failed to scrape ${site.name}, continuing`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    log.info(`Total scraped articles: ${allScraped.length}`);

    // 2. Dedup insert into DB
    const newArticles = await articlesDb.dedupInsertBatch(allScraped);
    log.info(`New articles inserted: ${newArticles.length}`);

    // 3. If we have new articles, summarize
    let summaryContent = 'No new articles found today.';
    let summaryTokens = 0;
    let summaryModel = '';
    const articleIds: number[] = [];

    if (newArticles.length > 0) {
      const result = await summarizeArticles(newArticles);
      summaryContent = result.summary;
      summaryTokens = result.tokens;
      summaryModel = result.model;
      articleIds.push(...newArticles.map((a) => a.id));

      await summariesDb.insert('daily_snapshot', summaryContent, articleIds, summaryModel, summaryTokens);
    }

    // 4. Build sources list
    const sources = newArticles.map((a) => ({
      title: a.title || 'Untitled',
      url: a.source_url,
      site: a.source_site || 'Unknown',
    }));

    // 5. Render and send email
    const html = renderDailySnapshot({
      summary: summaryContent,
      articleCount: allScraped.length,
      sources,
    });

    await sendReport(
      config.reportToEmail,
      `Graphite Daily Snapshot — ${new Date().toLocaleDateString('en-CA')}`,
      html,
    );

    await scrapeLog.logComplete(logId, allScraped.length, newArticles.length);
    log.info('=== Daily Snapshot job completed ===');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error('Daily Snapshot job failed', { error: msg });
    await scrapeLog.logError(logId, msg);
    throw err;
  }
}

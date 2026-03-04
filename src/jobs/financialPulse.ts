import { log } from '../utils/logger.js';
import { config } from '../config.js';
import * as scrapeLog from '../db/scrapeLog.js';
import * as companiesDb from '../db/companies.js';
import * as financialsDb from '../db/financials.js';
import { fetchQuotes } from '../scrapers/yahooFinance.js';
import { generateMarketNarrative } from '../ai/narrative.js';
import * as summariesDb from '../db/summaries.js';
import { sendReport } from '../email/sendgrid.js';
import { renderFinancialPulse } from '../email/templates.js';
import { fmtPrice, fmtCap, fmtVol, fmtPct } from '../utils/formatters.js';

export async function runFinancialPulse(): Promise<void> {
  const logId = await scrapeLog.logStart('financial_pulse');
  log.info('=== Financial Pulse job started ===');

  try {
    // 1. Get all companies with tickers
    const companies = await companiesDb.getAllWithTicker();
    log.info(`Fetching quotes for ${companies.length} companies`);

    // 2. Fetch Yahoo Finance quotes
    const quotes = await fetchQuotes(companies);

    // 3. Insert into DB
    await financialsDb.insertBatch(quotes);
    log.info(`Inserted ${quotes.length} financial records`);

    // 4. Get latest data for narrative
    const latest = await financialsDb.getLatest();

    // 5. Generate market narrative
    const { narrative, tokens, model } = await generateMarketNarrative(latest, companies);

    await summariesDb.insert('financial_pulse', narrative, [], model, tokens);

    // 6. Find target company data
    const target = companies.find((c) => c.is_target);
    const targetQuote = quotes.find((q) => q.company_id === target?.id);

    const targetData = {
      name: target?.name ?? 'FCI',
      ticker: target?.ticker ?? 'FCI',
      price: fmtPrice(targetQuote?.close_price ?? null),
      marketCap: fmtCap(targetQuote?.market_cap ?? null),
      volume: fmtVol(targetQuote?.volume ?? null),
      weekChange: fmtPct(targetQuote?.week_change_pct ?? null),
      weekChangeRaw: targetQuote?.week_change_pct ?? 0,
    };

    // 7. Build peer data
    const peers = quotes
      .filter((q) => q.company_id !== target?.id)
      .map((q) => {
        const c = companies.find((co) => co.id === q.company_id);
        return {
          name: c?.name ?? 'Unknown',
          ticker: c?.ticker ?? '?',
          price: fmtPrice(q.close_price),
          marketCap: fmtCap(q.market_cap),
          volume: fmtVol(q.volume),
          weekChange: fmtPct(q.week_change_pct),
          weekChangeRaw: q.week_change_pct ?? 0,
        };
      })
      .filter((p) => p.price !== 'N/A')
      .sort((a, b) => b.weekChangeRaw - a.weekChangeRaw);

    // 8. Render and send
    const html = renderFinancialPulse({
      target: targetData,
      peers,
      narrative,
    });

    await sendReport(
      config.reportToEmail,
      `Financial Pulse — ${new Date().toLocaleDateString('en-CA')}`,
      html,
    );

    await scrapeLog.logComplete(logId, companies.length, quotes.length);
    log.info('=== Financial Pulse job completed ===');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error('Financial Pulse job failed', { error: msg });
    await scrapeLog.logError(logId, msg);
    throw err;
  }
}

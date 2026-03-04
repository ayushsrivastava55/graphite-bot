import YahooFinance from 'yahoo-finance2';
import { log } from '../utils/logger.js';
import type { FinancialQuote } from '../types.js';
import type { Company } from '../types.js';

const yf = new YahooFinance();

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchQuotes(companies: Company[]): Promise<FinancialQuote[]> {
  const results: FinancialQuote[] = [];

  for (const company of companies) {
    if (!company.yahoo_ticker) continue;

    try {
      await sleep(1000);

      const quote = await yf.quote(company.yahoo_ticker);

      results.push({
        company_id: company.id,
        close_price: quote.regularMarketPrice ?? null,
        market_cap: quote.marketCap ?? null,
        volume: quote.regularMarketVolume ?? null,
        week_change_pct: quote.fiftyTwoWeekChangePercent
          ? quote.fiftyTwoWeekChangePercent * 100
          : null,
      });

      log.debug(`Fetched quote for ${company.ticker}`, {
        price: quote.regularMarketPrice,
        cap: quote.marketCap,
      });
    } catch (err) {
      log.warn(`Failed to fetch quote for ${company.yahoo_ticker}`, {
        error: err instanceof Error ? err.message : String(err),
      });

      results.push({
        company_id: company.id,
        close_price: null,
        market_cap: null,
        volume: null,
        week_change_pct: null,
      });
    }
  }

  log.info(`Fetched ${results.length} financial quotes`);
  return results;
}

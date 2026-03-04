import * as cheerio from 'cheerio';
import { log } from '../utils/logger.js';
import { retryAsync } from '../utils/retry.js';
import type { SiteConfig } from './siteConfigs.js';
import type { ScrapedArticle } from '../types.js';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const RATE_LIMIT_MS = 2000;

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function resolveUrl(href: string, baseUrl?: string): string {
  if (href.startsWith('http')) return href;
  if (baseUrl) return new URL(href, baseUrl).href;
  return href;
}

function extractLinks(
  html: string,
  config: SiteConfig,
): { url: string; title: string }[] {
  const $ = cheerio.load(html);
  const links: { url: string; title: string }[] = [];
  const seen = new Set<string>();

  $(config.linkSelector).each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    const fullUrl = resolveUrl(href, config.baseUrl || config.url);
    if (seen.has(fullUrl)) return;
    seen.add(fullUrl);

    const title = $(el).text().trim() ||
      $(el).attr('title') ||
      $(el).find('h2, h3, h4').first().text().trim() ||
      'Untitled';

    if (title.length > 5 && fullUrl.startsWith('http')) {
      links.push({ url: fullUrl, title });
    }
  });

  return links.slice(0, 15);
}

function extractContent(html: string, contentSelector: string): string {
  const $ = cheerio.load(html);

  // Remove noise
  $('script, style, nav, footer, header, .sidebar, .ad, .advertisement, .social-share').remove();

  const content = $(contentSelector).first().text();
  if (content && content.trim().length > 100) {
    return content.trim().replace(/\s+/g, ' ').slice(0, 5000);
  }

  // Fallback: use body text
  return $('body').text().trim().replace(/\s+/g, ' ').slice(0, 5000);
}

export async function fetchAndParse(
  config: SiteConfig,
  companyId?: number | null,
): Promise<ScrapedArticle[]> {
  log.info(`Scraping ${config.name}: ${config.url}`);

  const listHtml = await retryAsync(
    () => fetchPage(config.url),
    3,
    2000,
    `fetch-list-${config.name}`,
  );

  const links = extractLinks(listHtml, config);
  log.info(`Found ${links.length} article links on ${config.name}`);

  const articles: ScrapedArticle[] = [];
  let domain: string | undefined;

  try {
    domain = new URL(config.url).hostname;
  } catch { /* ignore */ }

  for (const link of links) {
    try {
      await sleep(RATE_LIMIT_MS);

      const articleHtml = await retryAsync(
        () => fetchPage(link.url),
        2,
        3000,
        `fetch-article-${link.url.slice(0, 60)}`,
      );

      const rawText = extractContent(articleHtml, config.contentSelector);

      if (rawText.length < 50) {
        log.debug(`Skipping short content: ${link.url}`);
        continue;
      }

      articles.push({
        company_id: companyId ?? null,
        source_url: link.url,
        title: link.title,
        raw_text: rawText,
        source_site: config.name,
      });
    } catch (err) {
      log.warn(`Failed to fetch article: ${link.url}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  log.info(`Scraped ${articles.length} articles from ${config.name}`);
  return articles;
}

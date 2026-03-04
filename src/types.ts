export interface Company {
  id: number;
  name: string;
  ticker: string;
  exchange: string;
  yahoo_ticker: string | null;
  website_url: string | null;
  news_page_url: string | null;
  is_target: boolean;
}

export interface Article {
  id: number;
  company_id: number | null;
  source_url: string;
  title: string | null;
  published_date: string | null;
  raw_text: string | null;
  source_site: string | null;
  scraped_at: string;
}

export interface ScrapedArticle {
  company_id?: number | null;
  source_url: string;
  title: string;
  published_date?: string | null;
  raw_text: string;
  source_site: string;
}

export interface FinancialQuote {
  company_id: number;
  close_price: number | null;
  market_cap: number | null;
  volume: number | null;
  week_change_pct: number | null;
}

export interface SentimentResult {
  company_id: number;
  article_id: number;
  sentiment_label: string;
  sentiment_score: number;
  reasoning: string;
}

export interface ScrapeLogEntry {
  id: number;
  job_name: string;
  status: string;
  articles_found: number;
  articles_new: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

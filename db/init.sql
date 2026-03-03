-- ============================================================
-- FCI Competitive Intelligence Agent — Database Schema
-- PostgreSQL 16
-- ============================================================

-- 1. Companies
CREATE TABLE IF NOT EXISTS companies (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    ticker          TEXT NOT NULL,
    exchange        TEXT NOT NULL,
    yahoo_ticker    TEXT,
    website_url     TEXT,
    news_page_url   TEXT,
    is_target       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_is_target ON companies (is_target);

-- 2. Articles
CREATE TABLE IF NOT EXISTS articles (
    id              SERIAL PRIMARY KEY,
    company_id      INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    source_url      TEXT NOT NULL UNIQUE,
    title           TEXT,
    published_date  DATE,
    raw_text        TEXT,
    source_site     TEXT,
    scraped_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_articles_company_id ON articles (company_id);
CREATE INDEX idx_articles_published_date ON articles (published_date);
CREATE INDEX idx_articles_source_site ON articles (source_site);

-- 3. Summaries
CREATE TABLE IF NOT EXISTS summaries (
    id              SERIAL PRIMARY KEY,
    summary_type    TEXT NOT NULL,
    content         TEXT NOT NULL,
    generated_at    TIMESTAMPTZ DEFAULT NOW(),
    article_ids     INTEGER[],
    model_used      TEXT,
    token_count     INTEGER
);

CREATE INDEX idx_summaries_summary_type ON summaries (summary_type);
CREATE INDEX idx_summaries_generated_at ON summaries (generated_at);

-- 4. Financial Data
CREATE TABLE IF NOT EXISTS financial_data (
    id              SERIAL PRIMARY KEY,
    company_id      INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    close_price     NUMERIC(12,4),
    market_cap      BIGINT,
    volume          BIGINT,
    week_change_pct NUMERIC(8,4),
    fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_financial_data_company_id ON financial_data (company_id);
CREATE INDEX idx_financial_data_fetched_at ON financial_data (fetched_at);

-- 5. Sentiment Scores
CREATE TABLE IF NOT EXISTS sentiment_scores (
    id              SERIAL PRIMARY KEY,
    company_id      INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    article_id      INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    sentiment_label TEXT NOT NULL,
    sentiment_score NUMERIC(4,2) CHECK (sentiment_score >= -1.0 AND sentiment_score <= 1.0),
    reasoning       TEXT,
    scored_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sentiment_scores_company_id ON sentiment_scores (company_id);
CREATE INDEX idx_sentiment_scores_article_id ON sentiment_scores (article_id);

-- 6. Scrape Log
CREATE TABLE IF NOT EXISTS scrape_log (
    id              SERIAL PRIMARY KEY,
    job_name        TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'running',
    articles_found  INTEGER DEFAULT 0,
    articles_new    INTEGER DEFAULT 0,
    error_message   TEXT,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_scrape_log_job_name ON scrape_log (job_name);
CREATE INDEX idx_scrape_log_started_at ON scrape_log (started_at);

-- ============================================================
-- Seed Data: 21 Companies (FCI + 20 Competitors)
-- ============================================================

INSERT INTO companies (name, ticker, exchange, yahoo_ticker, website_url, news_page_url, is_target) VALUES
    -- Target company
    ('First Canadian Graphite',  'FCI',  'TSXV', 'FCI.V',   'https://firstcanadiangraphite.com/',           'https://firstcanadiangraphite.com/news/',                  TRUE),
    -- Competitors
    ('Nouveau Monde Graphite',   'NOU',  'TSX',  'NOU.TO',  'https://nmg.com/',                             'https://nmg.com/news/',                                    FALSE),
    ('Graphite One Inc.',        'GPH',  'TSXV', 'GPH.V',   'https://www.graphiteoneinc.com/',               'https://www.graphiteoneinc.com/news/',                     FALSE),
    ('Northern Graphite',        'NGC',  'TSX',  'NGC.TO',  'https://northerngraphite.com/',                 'https://northerngraphite.com/news/',                       FALSE),
    ('Titan Mining Corp.',       'TI',   'TSX',  'TI.TO',   'https://www.titanminingcorp.com/',              'https://www.titanminingcorp.com/news/',                    FALSE),
    ('Westwater Resources',      'WWR',  'NYSE', 'WWR',     'https://westwaterresources.net/',               'https://westwaterresources.net/investors/',                FALSE),
    ('NextSource Materials',     'NEXT', 'TSX',  'NEXT.TO', 'https://www.nextsourcematerials.com/',          'https://www.nextsourcematerials.com/news/',                FALSE),
    ('Lomiko Metals',            'LMR',  'TSXV', 'LMR.V',  'https://lomiko.com/',                           'https://lomiko.com/news/',                                 FALSE),
    ('Canada Carbon',            'CCB',  'TSXV', 'CCB.V',   'https://www.canadacarbon.com/',                 'https://www.canadacarbon.com/news/',                       FALSE),
    ('Focus Graphite',           'FMS',  'TSXV', 'FMS.V',   'https://focusgraphite.com/',                    'https://focusgraphite.com/news/',                          FALSE),
    ('Volt Carbon Tech',         'VCT',  'TSXV', 'VCT.V',   'https://voltcarbontech.com/',                   'https://voltcarbontech.com/news/',                         FALSE),
    ('Mason Graphite',           'LLG',  'TSXV', 'LLG.V',   'https://masongraphite.com/',                    'https://masongraphite.com/news/',                          FALSE),
    ('South Star Battery Metals','STS',  'TSXV', 'STS.V',   'https://www.southstarbatterymetals.com/',       'https://www.southstarbatterymetals.com/news/',             FALSE),
    ('Giga Metals',              'GIGA', 'TSXV', 'GIGA.V',  'https://www.gigametals.com/',                   'https://www.gigametals.com/news/',                         FALSE),
    ('Gratomic Inc.',            'GRAT', 'TSXV', 'GRAT.V',  'https://gratomic.ca/',                          'https://gratomic.ca/news/',                                FALSE),
    ('International Graphite',   'IG6',  'ASX',  'IG6.AX',  'https://internationalgraphite.com.au/',         'https://internationalgraphite.com.au/news/',               FALSE),
    ('Ceylon Graphite',          'CYL',  'TSXV', 'CYL.V',   'https://www.ceylongraphite.com/',               'https://www.ceylongraphite.com/news/',                     FALSE),
    ('Sayona Mining',            'SYA',  'ASX',  'SYA.AX',  'https://sayonamining.com.au/',                  'https://sayonamining.com.au/news/',                        FALSE),
    ('Eagle Graphite',           'EGA',  'TSXV', 'EGA.V',   'https://eaglegraphite.com/',                    'https://eaglegraphite.com/news/',                          FALSE),
    ('Metals Australia',         'MLS',  'ASX',  'MLS.AX',  'https://metalsaustralia.com.au/',               'https://metalsaustralia.com.au/news/',                     FALSE),
    ('Applied Graphite Tech',    'AGT',  'TSXV', 'AGT.V',   'https://appliedgraphite.com/',                  'https://appliedgraphite.com/news/',                        FALSE);

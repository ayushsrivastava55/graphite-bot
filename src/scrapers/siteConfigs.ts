export interface SiteConfig {
  name: string;
  url: string;
  linkSelector: string;
  titleSelector?: string;
  contentSelector: string;
  baseUrl?: string;
}

export const industrySites: SiteConfig[] = [
  {
    name: 'graphitehub',
    url: 'https://graphitehub.com/news',
    linkSelector: 'a[href*="/news/"]',
    contentSelector: 'article, .post-content, .entry-content, main',
    baseUrl: 'https://graphitehub.com',
  },
  {
    name: 'investingnews',
    url: 'https://investingnews.com/graphite-investing/',
    linkSelector: 'a[href*="/daily/"]',
    contentSelector: 'article, .article-body, .post-content, main',
    baseUrl: 'https://investingnews.com',
  },
  {
    name: 'mining.com',
    url: 'https://www.mining.com/tag/graphite/',
    linkSelector: 'a[href*="/graphite"], .post-title a, h2 a, h3 a',
    contentSelector: 'article, .entry-content, .post-content, main',
    baseUrl: 'https://www.mining.com',
  },
];

export const defaultCompanyConfig: Omit<SiteConfig, 'name' | 'url'> = {
  linkSelector: 'a[href*="news"], a[href*="press"], a[href*="release"], .news a, article a, .post a',
  contentSelector: 'article, .post-content, .entry-content, .news-content, main',
};

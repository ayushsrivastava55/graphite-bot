import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.resolve(__dirname, '../../email-templates');

function loadTemplate(name: string): HandlebarsTemplateDelegate {
  const filePath = path.join(TEMPLATE_DIR, `${name}.hbs`);
  const source = fs.readFileSync(filePath, 'utf-8');
  return Handlebars.compile(source);
}

// Register helpers
Handlebars.registerHelper('sentimentColor', function (label: string) {
  const colors: Record<string, string> = {
    BREAKTHROUGH: '#22c55e',
    POSITIVE: '#4ade80',
    STEADY: '#fbbf24',
    NEGATIVE: '#f97316',
    FAILURE: '#ef4444',
  };
  return colors[label] || '#6b7280';
});

Handlebars.registerHelper('signColor', function (val: number) {
  if (val > 0) return '#22c55e';
  if (val < 0) return '#ef4444';
  return '#6b7280';
});

Handlebars.registerHelper('dateNow', function () {
  return new Date().toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Toronto',
  });
});

export interface DailySnapshotData {
  summary: string;
  articleCount: number;
  sources: { title: string; url: string; site: string }[];
}

export interface CompetitorSynthesisData {
  sentiments: {
    company: string;
    ticker: string;
    label: string;
    score: number;
    reasoning: string;
    articleCount: number;
  }[];
  overallSummary: string;
}

export interface FinancialPulseData {
  target: {
    name: string;
    ticker: string;
    price: string;
    marketCap: string;
    volume: string;
    weekChange: string;
    weekChangeRaw: number;
  };
  peers: {
    name: string;
    ticker: string;
    price: string;
    marketCap: string;
    volume: string;
    weekChange: string;
    weekChangeRaw: number;
  }[];
  narrative: string;
}

let _dailySnapshot: HandlebarsTemplateDelegate | null = null;
let _competitorSynthesis: HandlebarsTemplateDelegate | null = null;
let _financialPulse: HandlebarsTemplateDelegate | null = null;

export function renderDailySnapshot(data: DailySnapshotData): string {
  if (!_dailySnapshot) _dailySnapshot = loadTemplate('daily_snapshot');
  return _dailySnapshot(data);
}

export function renderCompetitorSynthesis(data: CompetitorSynthesisData): string {
  if (!_competitorSynthesis) _competitorSynthesis = loadTemplate('competitor_synthesis');
  return _competitorSynthesis(data);
}

export function renderFinancialPulse(data: FinancialPulseData): string {
  if (!_financialPulse) _financialPulse = loadTemplate('financial_pulse');
  return _financialPulse(data);
}

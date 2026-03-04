import 'dotenv/config';

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const config = {
  databaseUrl: required('DATABASE_URL'),
  openaiApiKey: required('OPENAI_API_KEY'),
  sendgridApiKey: required('SENDGRID_API_KEY'),
  sendgridFromEmail: required('SENDGRID_FROM_EMAIL'),
  reportToEmail: required('REPORT_TO_EMAIL'),
  logLevel: optional('LOG_LEVEL', 'info'),
  nodeEnv: optional('NODE_ENV', 'development'),
  tz: optional('TZ', 'America/Toronto'),
  openaiModel: optional('OPENAI_MODEL', 'gpt-5-mini'),
} as const;

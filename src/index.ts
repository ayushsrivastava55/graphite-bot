import { CronJob } from 'cron';
import { config } from './config.js';
import { testConnection, endPool } from './db/client.js';
import { log } from './utils/logger.js';
import { runDailySnapshot } from './jobs/dailySnapshot.js';
import { runCompetitorSynthesis } from './jobs/competitorSynthesis.js';
import { runFinancialPulse } from './jobs/financialPulse.js';

async function main() {
  log.info('Starting FCI Competitive Intelligence Agent');
  log.info(`Environment: ${config.nodeEnv}, Timezone: ${config.tz}`);

  // Verify DB connection
  await testConnection();

  // Cron A: Daily Snapshot — daily at 06:00 ET
  const dailyCron = new CronJob(
    '0 6 * * *',
    async () => {
      try {
        await runDailySnapshot();
      } catch (err) {
        log.error('Daily Snapshot cron failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    null,
    false,
    config.tz,
  );

  // Cron B: Competitor Synthesis — every 72 hours (Mon/Thu at 06:00 ET)
  const competitorCron = new CronJob(
    '0 6 */3 * *',
    async () => {
      try {
        await runCompetitorSynthesis();
      } catch (err) {
        log.error('Competitor Synthesis cron failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    null,
    false,
    config.tz,
  );

  // Cron C: Financial Pulse — Fridays at 16:30 ET
  const financialCron = new CronJob(
    '30 16 * * 5',
    async () => {
      try {
        await runFinancialPulse();
      } catch (err) {
        log.error('Financial Pulse cron failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    null,
    false,
    config.tz,
  );

  // Start all crons
  dailyCron.start();
  competitorCron.start();
  financialCron.start();

  log.info('Cron jobs registered:');
  log.info('  - Daily Snapshot: 06:00 ET daily');
  log.info('  - Competitor Synthesis: 06:00 ET every 3 days');
  log.info('  - Financial Pulse: 16:30 ET Fridays');
  log.info('Agent is running. Press Ctrl+C to stop.');

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    log.info(`Received ${signal}, shutting down...`);
    dailyCron.stop();
    competitorCron.stop();
    financialCron.stop();
    await endPool();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  log.error('Fatal error', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});

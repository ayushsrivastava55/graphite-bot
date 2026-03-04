import 'dotenv/config';
import { runDailySnapshot } from '../src/jobs/dailySnapshot.js';
import { runCompetitorSynthesis } from '../src/jobs/competitorSynthesis.js';
import { runFinancialPulse } from '../src/jobs/financialPulse.js';
import { endPool } from '../src/db/client.js';

const jobs: Record<string, () => Promise<void>> = {
  daily_snapshot: runDailySnapshot,
  competitor_synthesis: runCompetitorSynthesis,
  financial_pulse: runFinancialPulse,
};

async function main() {
  const jobName = process.argv[2];

  if (!jobName || !jobs[jobName]) {
    console.error(`Usage: npx tsx scripts/run-job.ts <job_name>`);
    console.error(`Available jobs: ${Object.keys(jobs).join(', ')}`);
    process.exit(1);
  }

  console.log(`Running job: ${jobName}`);
  const start = Date.now();

  try {
    await jobs[jobName]();
    console.log(`Job ${jobName} completed in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  } catch (err) {
    console.error(`Job ${jobName} failed:`, err);
    process.exit(1);
  } finally {
    await endPool();
  }
}

main();

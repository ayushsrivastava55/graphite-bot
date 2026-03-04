import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const sqlPath = path.resolve(__dirname, '..', 'db', 'init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Neon DB');

    await client.query(sql);
    console.log('Schema created and seed data inserted');

    const res = await client.query('SELECT COUNT(*) as count FROM companies');
    console.log(`Companies in DB: ${res.rows[0].count}`);
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

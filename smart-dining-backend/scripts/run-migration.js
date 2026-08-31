const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Read DATABASE_URL from .env if not set in process.env
if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
    if (match) {
      process.env.DATABASE_URL = match[1];
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const migrationPath = path.join(__dirname, '..', '..', 'supabase', 'migrations', '20260901000000_initial_schema.sql');
  console.log('Reading migration file from:', migrationPath);

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Connecting to database and running migration...');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Migration applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

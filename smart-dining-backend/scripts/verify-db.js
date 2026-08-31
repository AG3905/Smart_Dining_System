const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verify() {
  const tables = [
    'super_admins', 'restaurants', 'restaurant_staff', 'tables',
    'reservations', 'reservation_tables', 'waiting_queue', 'menu_categories',
    'menu_items', 'orders', 'order_items', 'bills', 'reviews',
    'sms_notifications', 'audit_log'
  ];

  console.log('--- SUPABASE DATABASE VERIFICATION ---');
  const client = await pool.connect();
  try {
    for (const table of tables) {
      const res = await client.query(`SELECT COUNT(*) FROM ${table};`);
      console.log(`  Table: ${table.padEnd(20)} Row count: ${res.rows[0].count}`);
    }
    console.log('--------------------------------------');
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

verify();

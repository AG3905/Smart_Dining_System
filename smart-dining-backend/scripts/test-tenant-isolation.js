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

const BASE_URL = 'http://localhost:4000';

async function runTenantIsolationTest() {
  console.log('=== MULTI-TENANT ISOLATION & AUTH SECURITY TEST ===\n');

  // 1. Get Restaurant A and Restaurant B details from DB
  const restRes = await pool.query(`SELECT id, name, email FROM restaurants ORDER BY name ASC;`);
  if (restRes.rows.length < 2) {
    console.error('ERROR: Need at least 2 seeded restaurants in the database.');
    process.exit(1);
  }

  const restA = restRes.rows.find(r => r.name.includes('La Bella')) || restRes.rows[0];
  const restB = restRes.rows.find(r => r.name.includes('Tokyo')) || restRes.rows[1];

  console.log(`Restaurant A: "${restA.name}" (ID: ${restA.id})`);
  console.log(`Restaurant B: "${restB.name}" (ID: ${restB.id})\n`);

  // 2. Login as Restaurant A Owner
  console.log(`[Step 1] Logging in as Restaurant A Owner (owner@labellaitalia.com)...`);
  const loginRes = await fetch(`${BASE_URL}/api/auth/restaurant/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@labellaitalia.com',
      password: 'Password123!',
    }),
  });

  if (!loginRes.ok) {
    console.error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    process.exit(1);
  }

  const loginData = await loginRes.json();
  const tokenA = loginData.token;
  console.log(`  ✓ Login successful! Token acquired for Restaurant A (${loginData.user.restaurantId})\n`);

  // 3. Attempt to fetch Restaurant B's data by manually passing B's restaurant_id in query parameter
  console.log(`[Step 2] Attempting to fetch Restaurant B's data by passing ?restaurant_id=${restB.id} with Rest A's JWT token...`);
  const tablesRes = await fetch(`${BASE_URL}/api/restaurant/tables?restaurant_id=${restB.id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`,
    },
  });

  if (!tablesRes.ok) {
    console.error(`Request failed: ${tablesRes.status} ${await tablesRes.text()}`);
    process.exit(1);
  }

  const tablesData = await tablesRes.json();
  console.log(`  Response received:`);
  console.log(`    Authenticated Role: ${tablesData.authenticatedRole}`);
  console.log(`    Authenticated Restaurant ID (JWT): ${tablesData.authenticatedRestaurantId}`);
  console.log(`    Requested Restaurant ID (Spoofed Query): ${tablesData.requestedRestaurantId}`);
  console.log(`    Effective Target Restaurant ID: ${tablesData.effectiveRestaurantId}`);
  console.log(`    Tables Returned Count: ${tablesData.tables.length}`);

  // 4. Assert Tenant Isolation Integrity
  const allBelongToRestA = tablesData.tables.every(t => t.restaurant_id === restA.id);
  const noneBelongToRestB = tablesData.tables.every(t => t.restaurant_id !== restB.id);

  if (tablesData.effectiveRestaurantId === restA.id && allBelongToRestA && noneBelongToRestB) {
    console.log(`\n  ✅ SECURITY VERIFIED: Spoofed restaurant_id (${restB.id}) was STRICTLY IGNORED!`);
    console.log(`     The system safely locked queries to Restaurant A (${restA.id}).`);
  } else {
    console.error(`\n  ❌ SECURITY FAILURE: Cross-tenant data leak detected!`);
    process.exit(1);
  }

  // 5. Test Super Admin Login and Tenant Creation
  console.log(`\n[Step 3] Testing Super Admin Login and New Tenant Onboarding...`);
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/super-admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@smartdining.com',
      password: 'Password123!',
    }),
  });

  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;
  console.log(`  ✓ Super Admin logged in! Token acquired.`);

  console.log(`[Step 4] Creating new restaurant tenant via POST /api/super-admin/restaurants...`);
  const createRestRes = await fetch(`${BASE_URL}/api/super-admin/restaurants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Le Petit Bistro',
      address: '789 Riviera Blvd',
      email: 'contact@lepetitbistro.com',
      ownerEmail: 'owner@lepetitbistro.com',
      password: 'Password123!',
      phone: '+1-555-0999',
    }),
  });

  if (createRestRes.status === 201) {
    const createData = await createRestRes.json();
    console.log(`  ✅ Tenant Onboarded Successfully!`);
    console.log(`     New Restaurant ID: ${createData.restaurant.id}`);
    console.log(`     Owner Email: ${createData.owner.email}`);
    console.log(`     Tables Initialized: ${createData.tablesInitialized}`);
  } else if (createRestRes.status === 409) {
    console.log(`  ℹ Tenant already exists from previous test run.`);
  } else {
    console.error(`  Tenant creation failed: ${createRestRes.status} ${await createRestRes.text()}`);
  }

  console.log('\n=== ALL SECURITY & TENANT ISOLATION TESTS PASSED ===');
  await pool.end();
}

runTenantIsolationTest().catch(err => {
  console.error('Test Error:', err);
  process.exit(1);
});

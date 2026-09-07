const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4000';

async function runTablesCRUDTest() {
  console.log('=== FLOOR PLAN TABLES CRUD & COLLISION SECURITY TEST ===\n');

  // 1. Login as Restaurant Owner (La Bella Italia)
  console.log('[Step 1] Logging in as Restaurant Owner (owner@labellaitalia.com)...');
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
  const token = loginData.token;
  const restaurantId = loginData.user.restaurantId;
  console.log(`  ✓ Login successful! Token acquired for Restaurant (${restaurantId})\n`);

  // 2. GET /api/tables
  console.log('[Step 2] Testing GET /api/tables...');
  const getRes = await fetch(`${BASE_URL}/api/tables`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!getRes.ok) {
    console.error(`GET /api/tables failed: ${getRes.status} ${await getRes.text()}`);
    process.exit(1);
  }

  const getResult = await getRes.json();
  console.log(`  ✓ GET /api/tables succeeded! Total tables returned: ${getResult.tables.length}`);
  console.log(`    First table: Number '${getResult.tables[0]?.table_number}', Position: (row ${getResult.tables[0]?.grid_row}, col ${getResult.tables[0]?.grid_col}), Capacity: ${getResult.tables[0]?.capacity}\n`);

  // 3. POST /api/tables (Create new table T9 at row 5, col 1)
  console.log('[Step 3] Testing POST /api/tables (creating new table T9 at row 5, col 1)...');
  const postRes = await fetch(`${BASE_URL}/api/tables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      table_number: 'T9',
      capacity: 4,
      grid_row: 5,
      grid_col: 1,
    }),
  });

  if (!postRes.ok && postRes.status !== 409) {
    console.error(`POST /api/tables failed: ${postRes.status} ${await postRes.text()}`);
    process.exit(1);
  }

  let createdTableId = null;
  if (postRes.status === 201) {
    const postData = await postRes.json();
    createdTableId = postData.table.id;
    console.log(`  ✅ Table T9 created successfully! ID: ${createdTableId}\n`);
  } else {
    console.log(`  ℹ Table T9 already exists from previous test run.\n`);
    // Retrieve T9 ID
    const findRes = await fetch(`${BASE_URL}/api/tables`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const findData = await findRes.json();
    const t9 = findData.tables.find(t => t.table_number === 'T9');
    if (t9) createdTableId = t9.id;
  }

  // 4. Test Grid Collision Rejection (POST duplicate at row 5, col 1)
  console.log('[Step 4] Testing duplicate POST /api/tables grid position rejection at row 5, col 1...');
  const dupRes = await fetch(`${BASE_URL}/api/tables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      table_number: 'T10_COLLISION',
      capacity: 2,
      grid_row: 5,
      grid_col: 1,
    }),
  });

  if (dupRes.status === 409) {
    const dupErr = await dupRes.json();
    console.log(`  ✅ DUP GRID COLLISION REJECTED as expected (HTTP 409)! Message: "${dupErr.message}"\n`);
  } else {
    console.error(`  ❌ COLLISION TEST FAILED: Server allowed duplicate grid placement! Status: ${dupRes.status}`);
    process.exit(1);
  }

  if (createdTableId) {
    // 5. Test PATCH /api/tables/:id (Update capacity to 6 and status to occupied)
    console.log(`[Step 5] Testing PATCH /api/tables/${createdTableId} (Updating capacity=6, status='occupied')...`);
    const patchRes = await fetch(`${BASE_URL}/api/tables/${createdTableId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        capacity: 6,
        status: 'occupied',
        order_status: 'seated',
      }),
    });

    if (!patchRes.ok) {
      console.error(`PATCH failed: ${patchRes.status} ${await patchRes.text()}`);
      process.exit(1);
    }

    const patchData = await patchRes.json();
    console.log(`  ✅ PATCH succeeded! Updated capacity: ${patchData.table.capacity}, status: ${patchData.table.status}, order_status: ${patchData.table.order_status}\n`);

    // 6. Test DELETE /api/tables/:id
    console.log(`[Step 6] Testing DELETE /api/tables/${createdTableId}...`);
    const delRes = await fetch(`${BASE_URL}/api/tables/${createdTableId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!delRes.ok) {
      console.error(`DELETE failed: ${delRes.status} ${await delRes.text()}`);
      process.exit(1);
    }

    const delData = await delRes.json();
    console.log(`  ✅ DELETE succeeded! Message: "${delData.message}"\n`);
  }

  console.log('=== ALL FLOOR PLAN TABLES CRUD TESTS PASSED ===');
}

runTablesCRUDTest().catch(err => {
  console.error('Test Error:', err);
  process.exit(1);
});

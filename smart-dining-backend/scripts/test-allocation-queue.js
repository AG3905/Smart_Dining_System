const BASE_URL = 'http://localhost:4000';

async function testAllocationAndQueueFlow() {
  console.log('=== STAGE 4 & STAGE 5 ALLOCATION & QUEUE END-TO-END TEST ===\n');

  // 1. Login as owner to get restaurant ID and token
  console.log('[Step 1] Logging in as La Bella Italia owner...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/restaurant/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@labellaitalia.com', password: 'Password123!' }),
  });
  if (!loginRes.ok) throw new Error(`Login failed: ${await loginRes.text()}`);
  const loginData = await loginRes.json();
  const token = loginData.token;
  const restaurantId = loginData.user.restaurantId;
  console.log(`  ✓ Token acquired. Restaurant ID: ${restaurantId}\n`);

  // 2. Test GET /api/restaurants/:id/public
  console.log('[Step 2] Testing GET /api/restaurants/:id/public...');
  const pubRes = await fetch(`${BASE_URL}/api/restaurants/${restaurantId}/public`);
  if (!pubRes.ok) throw new Error(`Public info failed: ${await pubRes.text()}`);
  const pubData = await pubRes.json();
  console.log(`  ✓ Public info fetched: Name = "${pubData.restaurant.name}"\n`);

  // 3. Test POST /api/reservations (Instant booking for group of 2)
  console.log('[Step 3] Testing Instant Booking (Group of 2 - should fit single table)...');
  const res1 = await fetch(`${BASE_URL}/api/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurant_id: restaurantId,
      customer_name: 'Test Customer 1 (Small Group)',
      customer_phone: '+15550101',
      group_size: 2,
      booking_type: 'instant',
    }),
  });
  const res1Text = await res1.text();
  if (!res1.ok) throw new Error(`Instant booking failed [HTTP ${res1.status}]: ${res1Text}`);
  const data1 = JSON.parse(res1Text);

  console.log(`  ✓ Booking 1 created! Status: "${data1.status}", Allocated: ${data1.allocated}`);
  if (data1.table) {
    console.log(`    Seated at Table ${data1.table.table_number} (Capacity: ${data1.table.capacity})\n`);
  }

  // 4. Test POST /api/reservations (Large party of 25 - force into waiting queue)
  console.log('[Step 4] Testing Instant Booking for Large Party (Group of 25 - forces queue)...');
  const res2 = await fetch(`${BASE_URL}/api/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurant_id: restaurantId,
      customer_name: 'Test Customer 2 (VIP Candidate)',
      customer_phone: '+15550102',
      group_size: 25,
      booking_type: 'instant',
    }),
  });
  if (!res2.ok) throw new Error(`Queue booking failed [HTTP ${res2.status}]: ${await res2.text()}`);
  const data2 = await res2.json();
  const queueReservationId = data2.reservation.id;
  console.log(`  ✓ Booking 2 created! Status: "${data2.status}", Allocated: ${data2.allocated}\n`);

  // 5. Test GET /api/reservations/:id/status for queued booking
  console.log('[Step 5] Polling status for queued booking...');
  const statusRes = await fetch(`${BASE_URL}/api/reservations/${queueReservationId}/status`);
  if (!statusRes.ok) throw new Error(`Status check failed [HTTP ${statusRes.status}]: ${await statusRes.text()}`);
  const statusData = await statusRes.json();
  console.log(`  ✓ Queue Position: #${statusData.queuePosition}, Est. Wait: ~${statusData.estimatedWaitMinutes} mins\n`);

  // 6. Test GET /api/waiting-queue (Staff endpoint)
  console.log('[Step 6] Testing GET /api/waiting-queue (Staff view)...');
  const qListRes = await fetch(`${BASE_URL}/api/waiting-queue`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!qListRes.ok) throw new Error(`Fetch queue failed [HTTP ${qListRes.status}]: ${await qListRes.text()}`);
  const qListData = await qListRes.json();
  console.log(`  ✓ Total queued items returned: ${qListData.queue.length}`);
  const targetQueueItem = qListData.queue.find((q) => q.reservation_id === queueReservationId);

  if (targetQueueItem) {
    // 7. Test PATCH /api/waiting-queue/:id/vip (Mark VIP)
    console.log(`[Step 7] Testing PATCH /api/waiting-queue/${targetQueueItem.id}/vip (Mark VIP)...`);
    const vipRes = await fetch(`${BASE_URL}/api/waiting-queue/${targetQueueItem.id}/vip`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!vipRes.ok) throw new Error(`Mark VIP failed [HTTP ${vipRes.status}]: ${await vipRes.text()}`);
    const vipData = await vipRes.json();
    console.log(`  ✓ VIP Status updated! Message: "${vipData.message}"\n`);
  }

  // 8. Test POST /api/reservations/:id/cancel
  console.log(`[Step 8] Testing POST /api/reservations/${data1.reservation.id}/cancel...`);
  const cancelRes = await fetch(`${BASE_URL}/api/reservations/${data1.reservation.id}/cancel`, {
    method: 'POST',
  });
  if (!cancelRes.ok) throw new Error(`Cancel failed [HTTP ${cancelRes.status}]: ${await cancelRes.text()}`);

  console.log(`  ✓ Reservation 1 cancelled and table freed successfully!\n`);

  console.log('=== STAGE 4 & 5 ALLOCATION & QUEUE TESTS PASSED SUCCESSFULLY! ===');
}

testAllocationAndQueueFlow().catch((err) => {
  console.error('Test Error:', err);
  process.exit(1);
});

import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

export async function POST(request: Request) {
  const client = await getClient();

  try {
    const body = await request.json();
    const {
      restaurant_id,
      customer_name,
      customer_phone,
      group_size,
      booking_type,
      scheduled_time,
    } = body;

    // Validation
    if (!restaurant_id || !customer_name || !customer_phone || !group_size || !booking_type) {
      return NextResponse.json(
        { message: 'Missing required fields (restaurant_id, customer_name, customer_phone, group_size, booking_type)' },
        { status: 400 }
      );
    }

    const parsedGroupSize = parseInt(group_size, 10);
    if (isNaN(parsedGroupSize) || parsedGroupSize <= 0) {
      return NextResponse.json({ message: 'group_size must be a positive integer' }, { status: 400 });
    }

    if (!['instant', 'future'].includes(booking_type)) {
      return NextResponse.json({ message: 'booking_type must be instant or future' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Confirm restaurant exists
    const restCheck = await client.query('SELECT id FROM restaurants WHERE id = $1', [restaurant_id]);
    if (restCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Restaurant not found' }, { status: 404 });
    }

    if (booking_type === 'future') {
      // Save future booking
      const resQuery = `
        INSERT INTO reservations 
          (restaurant_id, customer_name, customer_phone, group_size, booking_type, scheduled_time, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'confirmed')
        RETURNING *
      `;
      const resResult = await client.query(resQuery, [
        restaurant_id,
        customer_name.trim(),
        customer_phone.trim(),
        parsedGroupSize,
        booking_type,
        scheduled_time || null,
      ]);

      await client.query('COMMIT');
      return NextResponse.json(
        {
          reservation: resResult.rows[0],
          allocated: false,
          status: 'confirmed',
          message: 'Future reservation confirmed successfully.',
        },
        { status: 201 }
      );
    }

    // Instant Booking: try to find single smallest free table with capacity >= group_size
    const freeTableQuery = `
      SELECT * FROM tables
      WHERE restaurant_id = $1 AND status = 'free' AND capacity >= $2
      ORDER BY capacity ASC
      LIMIT 1
      FOR UPDATE
    `;
    const freeTableRes = await client.query(freeTableQuery, [restaurant_id, parsedGroupSize]);

    if (freeTableRes.rowCount && freeTableRes.rowCount > 0) {
      // Instant allocation succeeded!
      const table = freeTableRes.rows[0];

      // 1. Create reservation (status: 'confirmed')
      const resQuery = `
        INSERT INTO reservations 
          (restaurant_id, customer_name, customer_phone, group_size, booking_type, status, confirmed_at, seated_at)
        VALUES ($1, $2, $3, $4, $5, 'seated', NOW(), NOW())
        RETURNING *
      `;
      const resResult = await client.query(resQuery, [
        restaurant_id,
        customer_name.trim(),
        customer_phone.trim(),
        parsedGroupSize,
        booking_type,
      ]);
      const reservation = resResult.rows[0];

      // 2. Link reservation to table
      await client.query(
        'INSERT INTO reservation_tables (reservation_id, table_id) VALUES ($1, $2)',
        [reservation.id, table.id]
      );

      // 3. Mark table as occupied & seated
      await client.query(
        "UPDATE tables SET status = 'occupied', order_status = 'seated', seated_at = NOW() WHERE id = $1",
        [table.id]
      );

      await client.query('COMMIT');
      return NextResponse.json(
        {
          reservation,
          allocated: true,
          status: 'seated',
          table,
          message: `Instant booking allocated to Table ${table.table_number}!`,
        },
        { status: 201 }
      );
    }

    // No immediate table fit -> place into waiting_queue (status: 'queued')
    const resQuery = `
      INSERT INTO reservations 
        (restaurant_id, customer_name, customer_phone, group_size, booking_type, status)
      VALUES ($1, $2, $3, $4, $5, 'queued')
      RETURNING *
    `;
    const resResult = await client.query(resQuery, [
      restaurant_id,
      customer_name.trim(),
      customer_phone.trim(),
      parsedGroupSize,
      booking_type,
    ]);
    const reservation = resResult.rows[0];

    // Priority score: group_size * 2 (W_SIZE=2, W_WAIT=1)
    const initialPriority = parsedGroupSize * 2;

    const queueResult = await client.query(
      `INSERT INTO waiting_queue 
        (reservation_id, restaurant_id, priority_score, status)
       VALUES ($1, $2, $3, 'waiting')
       RETURNING *`,
      [reservation.id, restaurant_id, initialPriority]
    );

    await client.query('COMMIT');

    return NextResponse.json(
      {
        reservation,
        queueEntry: queueResult.rows[0],
        allocated: false,
        status: 'queued',
        message: 'No immediate free table fit. Placed in waiting queue.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {}
    console.error('Error creating reservation:', error);
    return NextResponse.json({ message: error?.message || 'Internal server error', detail: String(error) }, { status: 500 });
  } finally {
    client.release();
  }

}

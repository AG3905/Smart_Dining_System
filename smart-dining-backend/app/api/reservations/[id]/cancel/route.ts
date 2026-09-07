import { NextResponse } from 'next/server';
import { getClient } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const client = await getClient();

  try {
    const reservationId = params.id;
    if (!reservationId) {
      return NextResponse.json({ message: 'Reservation ID required' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Check reservation
    const resResult = await client.query('SELECT * FROM reservations WHERE id = $1 FOR UPDATE', [reservationId]);
    if (resResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Reservation not found' }, { status: 404 });
    }

    const reservation = resResult.rows[0];

    // 2. Mark reservation cancelled
    await client.query("UPDATE reservations SET status = 'cancelled' WHERE id = $1", [reservationId]);

    // 3. Mark waiting queue entry cancelled if present
    await client.query("UPDATE waiting_queue SET status = 'cancelled' WHERE reservation_id = $1", [reservationId]);

    // 4. Free linked tables if any were assigned
    const tableRes = await client.query('SELECT table_id FROM reservation_tables WHERE reservation_id = $1', [reservationId]);
    if (tableRes.rowCount && tableRes.rowCount > 0) {
      const tableIds = tableRes.rows.map((r) => r.table_id);
      await client.query(
        "UPDATE tables SET status = 'free', order_status = NULL, seated_at = NULL WHERE id = ANY($1::uuid[])",
        [tableIds]
      );
      await client.query('DELETE FROM reservation_tables WHERE reservation_id = $1', [reservationId]);
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Reservation cancelled successfully.',
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error cancelling reservation:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

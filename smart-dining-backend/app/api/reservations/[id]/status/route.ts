import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = params.id;
    if (!reservationId) {
      return NextResponse.json({ message: 'Reservation ID required' }, { status: 400 });
    }

    // Fetch reservation
    const resResult = await query(
      'SELECT r.*, rest.name as restaurant_name FROM reservations r JOIN restaurants rest ON r.restaurant_id = rest.id WHERE r.id = $1',
      [reservationId]
    );

    if (resResult.rowCount === 0) {
      return NextResponse.json({ message: 'Reservation not found' }, { status: 404 });
    }

    const reservation = resResult.rows[0];

    // If reservation is seated / confirmed, check allocated table
    if (['confirmed', 'seated'].includes(reservation.status)) {
      const tableRes = await query(
        `SELECT t.id, t.table_number, t.capacity, t.grid_row, t.grid_col 
         FROM reservation_tables rt 
         JOIN tables t ON rt.table_id = t.id 
         WHERE rt.reservation_id = $1`,
        [reservationId]
      );

      return NextResponse.json({
        reservation,
        allocated: true,
        tables: tableRes.rows,
        queuePosition: 0,
        estimatedWaitMinutes: 0,
      });
    }

    // If reservation is queued, calculate position & estimated wait time
    if (reservation.status === 'queued') {
      const queueRes = await query(
        'SELECT * FROM waiting_queue WHERE reservation_id = $1 AND status = $2',
        [reservationId, 'waiting']
      );

      if (queueRes.rowCount === 0) {
        return NextResponse.json({
          reservation,
          allocated: false,
          queuePosition: 1,
          estimatedWaitMinutes: 10,
        });
      }

      const queueEntry = queueRes.rows[0];

      // Calculate queue position: count waiting entries with higher priority_score or earlier joined_at
      const posRes = await query(
        `SELECT COUNT(*) as count 
         FROM waiting_queue 
         WHERE restaurant_id = $1 
           AND status = 'waiting' 
           AND (priority_score > $2 OR (priority_score = $2 AND joined_at <= $3))`,
        [reservation.restaurant_id, queueEntry.priority_score, queueEntry.joined_at]
      );

      const queuePosition = parseInt(posRes.rows[0].count, 10) || 1;
      const estimatedWaitMinutes = queuePosition * 12; // ~12 mins per queued group

      return NextResponse.json({
        reservation,
        queueEntry,
        allocated: false,
        queuePosition,
        estimatedWaitMinutes,
      });
    }

    return NextResponse.json({
      reservation,
      allocated: false,
      queuePosition: 0,
      estimatedWaitMinutes: 0,
    });
  } catch (error: any) {
    console.error('Error fetching reservation status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

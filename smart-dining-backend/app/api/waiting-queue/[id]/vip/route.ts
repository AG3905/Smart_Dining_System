import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/db';
import { requireAuth, getEnforcedRestaurantId } from '@/lib/auth';
import { attemptAllocation, VIP_BOOST } from '@/lib/allocation';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { authContext, errorResponse } = await requireAuth(req, ['owner', 'staff', 'super_admin']);
  if (errorResponse) return errorResponse;

  const restaurantId = getEnforcedRestaurantId(authContext);
  if (!restaurantId) {
    return NextResponse.json({ message: 'Restaurant ID required' }, { status: 400 });
  }

  const queueId = params.id;
  if (!queueId) {
    return NextResponse.json({ message: 'Queue ID required' }, { status: 400 });
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Fetch queue entry
    const qRes = await client.query(
      `SELECT w.*, r.group_size 
       FROM waiting_queue w 
       JOIN reservations r ON w.reservation_id = r.id 
       WHERE w.id = $1 AND w.restaurant_id = $2 FOR UPDATE`,
      [queueId, restaurantId]
    );


    if (qRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Queue entry not found' }, { status: 404 });
    }

    const queueEntry = qRes.rows[0];

    // Mark as VIP
    await client.query(
      `UPDATE waiting_queue 
       SET is_vip = true, priority_score = priority_score + $1 
       WHERE id = $2`,
      [VIP_BOOST, queueId]
    );
    await client.query(
      'UPDATE reservations SET is_vip = true WHERE id = $1',
      [queueEntry.reservation_id]
    );

    // Try immediate allocation
    const allocResult = await attemptAllocation(
      client,
      queueEntry.reservation_id,
      restaurantId,
      queueEntry.group_size
    );

    if (allocResult.allocated) {
      await client.query("UPDATE waiting_queue SET status = 'allocated' WHERE id = $1", [queueId]);
      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        allocated: true,
        method: allocResult.method,
        message: 'VIP fast-forwarded: Seated immediately!',
      });
    }

    // If no free table, soft-reserve earliest expected free table
    const occupiedTablesRes = await client.query(
      `SELECT id, table_number, capacity, order_status, seated_at 
       FROM tables 
       WHERE restaurant_id = $1 AND status = 'occupied' AND capacity >= $2 
       ORDER BY 
         CASE order_status 
           WHEN 'checkout_in_progress' THEN 1 
           WHEN 'food_served' THEN 2 
           WHEN 'order_placed' THEN 3 
           ELSE 4 
         END ASC, seated_at ASC 
       LIMIT 1 FOR UPDATE`,
      [restaurantId, queueEntry.group_size]
    );


    let softReservedTable = null;
    if (occupiedTablesRes.rowCount && occupiedTablesRes.rowCount > 0) {
      softReservedTable = occupiedTablesRes.rows[0];
      await client.query(
        "UPDATE tables SET status = 'reserved' WHERE id = $1",
        [softReservedTable.id]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      allocated: false,
      isVip: true,
      softReservedTable: softReservedTable ? softReservedTable.table_number : null,
      message: softReservedTable
        ? `VIP fast-forwarded: Priority boosted & soft-reserved Table ${softReservedTable.table_number}`
        : 'VIP fast-forwarded: Priority boosted by +1000',
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error updating VIP status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

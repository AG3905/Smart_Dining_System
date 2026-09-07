import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth, getEnforcedRestaurantId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { authContext, errorResponse } = await requireAuth(req, ['owner', 'staff', 'super_admin']);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const restaurantId = getEnforcedRestaurantId(authContext, url.searchParams.get('restaurant_id'));

  if (!restaurantId) {
    return NextResponse.json({ message: 'Restaurant ID required' }, { status: 400 });
  }

  try {
    const res = await query(
      `SELECT w.id, w.reservation_id, w.priority_score, w.is_vip, w.joined_at, w.status,
              r.customer_name, r.customer_phone, r.group_size, r.booking_type, r.created_by
       FROM waiting_queue w
       JOIN reservations r ON w.reservation_id = r.id
       WHERE w.restaurant_id = $1 AND w.status = 'waiting'
       ORDER BY w.priority_score DESC, w.joined_at ASC`,
      [restaurantId]
    );

    return NextResponse.json({ queue: res.rows });
  } catch (error: any) {
    console.error('Error fetching waiting queue:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


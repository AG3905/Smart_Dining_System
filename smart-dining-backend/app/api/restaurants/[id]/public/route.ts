import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const restaurantId = params.id;
    if (!restaurantId) {
      return NextResponse.json({ message: 'Restaurant ID required' }, { status: 400 });
    }

    const res = await query(
      'SELECT id, name, address, phone, avg_dining_duration_minutes FROM restaurants WHERE id = $1 AND is_active = true',
      [restaurantId]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ message: 'Restaurant not found' }, { status: 404 });
    }

    return NextResponse.json({ restaurant: res.rows[0] });
  } catch (error: any) {
    console.error('Error fetching public restaurant info:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

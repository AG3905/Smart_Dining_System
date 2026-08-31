import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth, getEnforcedRestaurantId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  // 1. Verify authentication
  const { authContext, errorResponse } = await requireAuth(req, ['owner', 'staff', 'super_admin']);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const userSuppliedRestaurantId = url.searchParams.get('restaurant_id');

  // 2. STRIKT TENANT ISOLATION:
  // getEnforcedRestaurantId guarantees that for owner/staff roles,
  // userSuppliedRestaurantId is STRICTLY IGNORED and overridden with
  // authContext.restaurantId from the verified JWT token.
  const targetRestaurantId = getEnforcedRestaurantId(authContext, userSuppliedRestaurantId);

  if (!targetRestaurantId) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Target restaurant_id is required for super admin' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `SELECT id, restaurant_id, table_number, capacity, grid_row, grid_col, status, order_status, seated_at
       FROM tables
       WHERE restaurant_id = $1
       ORDER BY grid_row ASC, grid_col ASC;`,
      [targetRestaurantId]
    );

    return NextResponse.json({
      authenticatedRole: authContext.role,
      authenticatedRestaurantId: authContext.restaurantId,
      requestedRestaurantId: userSuppliedRestaurantId,
      effectiveRestaurantId: targetRestaurantId,
      tables: result.rows,
    });
  } catch (err: any) {
    console.error('Fetch Tables Error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message || 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}

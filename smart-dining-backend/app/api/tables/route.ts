import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth, getEnforcedRestaurantId } from '@/lib/auth';

/**
 * GET /api/tables
 * Returns all floor plan tables for the authenticated restaurant.
 */
export async function GET(req: NextRequest) {
  const { authContext, errorResponse } = await requireAuth(req, ['owner', 'staff', 'super_admin']);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const userSuppliedRestaurantId = url.searchParams.get('restaurant_id');

  // Enforce tenant scoping from JWT
  const restaurantId = getEnforcedRestaurantId(authContext, userSuppliedRestaurantId);

  if (!restaurantId) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Target restaurant_id is required' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `SELECT id, restaurant_id, table_number, capacity, grid_row, grid_col, status, order_status, seated_at, created_at
       FROM tables
       WHERE restaurant_id = $1
       ORDER BY grid_row ASC, grid_col ASC, table_number ASC;`,
      [restaurantId]
    );

    return NextResponse.json({
      restaurantId,
      tables: result.rows,
    });
  } catch (err: any) {
    console.error('GET /api/tables error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message || 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tables
 * Creates a new table for the authenticated restaurant.
 * Validates grid position collision (grid_row, grid_col) and capacity > 0.
 */
export async function POST(req: NextRequest) {
  const { authContext, errorResponse } = await requireAuth(req, ['owner', 'staff', 'super_admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { table_number, capacity, grid_row, grid_col, target_restaurant_id } = body;

    // Determine target restaurant ID (strictly JWT-bound for non-super-admins)
    const restaurantId = getEnforcedRestaurantId(authContext, target_restaurant_id);

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Target restaurant_id is required' },
        { status: 400 }
      );
    }

    if (!table_number || capacity === undefined || grid_row === undefined || grid_col === undefined) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'table_number, capacity, grid_row, and grid_col are required fields',
        },
        { status: 400 }
      );
    }

    const numCapacity = parseInt(capacity, 10);
    const numRow = parseInt(grid_row, 10);
    const numCol = parseInt(grid_col, 10);

    if (isNaN(numCapacity) || numCapacity <= 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Capacity must be a positive integer greater than 0' },
        { status: 400 }
      );
    }

    if (isNaN(numRow) || isNaN(numCol)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'grid_row and grid_col must be valid integers' },
        { status: 400 }
      );
    }

    const cleanTableNum = String(table_number).trim();

    // 1. Check for duplicate grid position (grid_row, grid_col) for this restaurant
    const gridCheck = await query(
      `SELECT id, table_number FROM tables WHERE restaurant_id = $1 AND grid_row = $2 AND grid_col = $3 LIMIT 1;`,
      [restaurantId, numRow, numCol]
    );

    if (gridCheck.rows.length > 0) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: `Grid position (row ${numRow}, col ${numCol}) is already occupied by table '${gridCheck.rows[0].table_number}'`,
        },
        { status: 409 }
      );
    }

    // 2. Check for duplicate table_number for this restaurant
    const numCheck = await query(
      `SELECT id FROM tables WHERE restaurant_id = $1 AND table_number = $2 LIMIT 1;`,
      [restaurantId, cleanTableNum]
    );

    if (numCheck.rows.length > 0) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: `Table number '${cleanTableNum}' already exists for this restaurant`,
        },
        { status: 409 }
      );
    }

    // 3. Insert new table
    const insertRes = await query(
      `INSERT INTO tables (restaurant_id, table_number, capacity, grid_row, grid_col, status)
       VALUES ($1, $2, $3, $4, $5, 'free')
       RETURNING id, restaurant_id, table_number, capacity, grid_row, grid_col, status, order_status, created_at;`,
      [restaurantId, cleanTableNum, numCapacity, numRow, numCol]
    );

    return NextResponse.json(
      {
        message: 'Table created successfully',
        table: insertRes.rows[0],
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('POST /api/tables error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message || 'Failed to create table' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth, getEnforcedRestaurantId } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/tables/:id
 * Updates table position, capacity, status, or order_status.
 * Strictly scopes table mutation to the authenticated restaurant tenant.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { authContext, errorResponse } = await requireAuth(req, ['owner', 'staff', 'super_admin']);
  if (errorResponse) return errorResponse;

  const tableId = params.id;
  if (!tableId) {
    return NextResponse.json({ error: 'Bad Request', message: 'Table ID is required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { target_restaurant_id, table_number, capacity, grid_row, grid_col, status, order_status } = body;

    // Determine target restaurant ID (strictly JWT-bound for non-super-admins)
    const restaurantId = getEnforcedRestaurantId(authContext, target_restaurant_id);

    // 1. Verify table exists and belongs to requesting user's restaurant
    const checkRes = await query(
      `SELECT id, restaurant_id, table_number, capacity, grid_row, grid_col, status, order_status
       FROM tables
       WHERE id = $1 ${restaurantId ? 'AND restaurant_id = $2' : ''} LIMIT 1;`,
      restaurantId ? [tableId, restaurantId] : [tableId]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Table not found or does not belong to your restaurant' },
        { status: 404 }
      );
    }

    const currentTable = checkRes.rows[0];
    const targetRestId = currentTable.restaurant_id;

    const newTableNum = table_number !== undefined ? String(table_number).trim() : currentTable.table_number;
    const newCapacity = capacity !== undefined ? parseInt(capacity, 10) : currentTable.capacity;
    const newRow = grid_row !== undefined ? parseInt(grid_row, 10) : currentTable.grid_row;
    const newCol = grid_col !== undefined ? parseInt(grid_col, 10) : currentTable.grid_col;
    const newStatus = status !== undefined ? status : currentTable.status;
    const newOrderStatus = order_status !== undefined ? order_status : currentTable.order_status;

    if (isNaN(newCapacity) || newCapacity <= 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Capacity must be a positive integer greater than 0' },
        { status: 400 }
      );
    }

    // 2. Validate grid collision if row or col updated
    if (newRow !== currentTable.grid_row || newCol !== currentTable.grid_col) {
      const gridCheck = await query(
        `SELECT id, table_number FROM tables WHERE restaurant_id = $1 AND grid_row = $2 AND grid_col = $3 AND id != $4 LIMIT 1;`,
        [targetRestId, newRow, newCol, tableId]
      );
      if (gridCheck.rows.length > 0) {
        return NextResponse.json(
          {
            error: 'Conflict',
            message: `Grid position (row ${newRow}, col ${newCol}) is already occupied by table '${gridCheck.rows[0].table_number}'`,
          },
          { status: 409 }
        );
      }
    }

    // 3. Validate duplicate table number if updated
    if (newTableNum !== currentTable.table_number) {
      const numCheck = await query(
        `SELECT id FROM tables WHERE restaurant_id = $1 AND table_number = $2 AND id != $3 LIMIT 1;`,
        [targetRestId, newTableNum, tableId]
      );
      if (numCheck.rows.length > 0) {
        return NextResponse.json(
          {
            error: 'Conflict',
            message: `Table number '${newTableNum}' already exists for this restaurant`,
          },
          { status: 409 }
        );
      }
    }

    // 4. Update table in DB
    const updateRes = await query(
      `UPDATE tables
       SET table_number = $1,
           capacity = $2,
           grid_row = $3,
           grid_col = $4,
           status = $5,
           order_status = $6,
           seated_at = CASE WHEN $5 = 'occupied' AND seated_at IS NULL THEN now()
                            WHEN $5 = 'free' THEN NULL
                            ELSE seated_at END
       WHERE id = $7
       RETURNING id, restaurant_id, table_number, capacity, grid_row, grid_col, status, order_status, seated_at;`,
      [newTableNum, newCapacity, newRow, newCol, newStatus, newOrderStatus, tableId]
    );

    return NextResponse.json({
      message: 'Table updated successfully',
      table: updateRes.rows[0],
    });
  } catch (err: any) {
    console.error(`PATCH /api/tables/${tableId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message || 'Failed to update table' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tables/:id
 * Deletes a floor plan table.
 * Strictly scopes deletion to the authenticated restaurant tenant.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { authContext, errorResponse } = await requireAuth(req, ['owner', 'staff', 'super_admin']);
  if (errorResponse) return errorResponse;

  const tableId = params.id;
  if (!tableId) {
    return NextResponse.json({ error: 'Bad Request', message: 'Table ID is required' }, { status: 400 });
  }

  try {
    const url = new URL(req.url);
    const userSuppliedRestaurantId = url.searchParams.get('restaurant_id');

    // Determine target restaurant ID
    const restaurantId = getEnforcedRestaurantId(authContext, userSuppliedRestaurantId);

    // 1. Verify table exists and belongs to requesting user's restaurant
    const checkRes = await query(
      `SELECT id, table_number, restaurant_id FROM tables WHERE id = $1 ${restaurantId ? 'AND restaurant_id = $2' : ''} LIMIT 1;`,
      restaurantId ? [tableId, restaurantId] : [tableId]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Table not found or does not belong to your restaurant' },
        { status: 404 }
      );
    }

    // 2. Perform deletion
    await query(`DELETE FROM tables WHERE id = $1;`, [tableId]);

    return NextResponse.json({
      message: `Table '${checkRes.rows[0].table_number}' deleted successfully`,
      id: tableId,
    });
  } catch (err: any) {
    console.error(`DELETE /api/tables/${tableId} error:`, err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message || 'Failed to delete table' },
      { status: 500 }
    );
  }
}

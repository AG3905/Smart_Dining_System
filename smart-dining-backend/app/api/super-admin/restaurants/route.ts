import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  // 1. Enforce Super Admin Authorization ONLY
  const { authContext, errorResponse } = await requireAuth(req, ['super_admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const {
      name,
      address,
      email,
      phone,
      ownerName,
      ownerEmail,
      password,
      avgDiningDurationMinutes = 60,
    } = body;

    if (!name || !email || !ownerEmail || !password) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Restaurant name, email, ownerEmail, and password are required',
        },
        { status: 400 }
      );
    }

    const cleanRestEmail = email.trim().toLowerCase();
    const cleanOwnerEmail = ownerEmail.trim().toLowerCase();

    // Hash password for owner login
    const passwordHash = await bcrypt.hash(password, 10);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check for existing restaurant email
      const existingRest = await client.query(
        `SELECT id FROM restaurants WHERE LOWER(email) = $1 LIMIT 1;`,
        [cleanRestEmail]
      );
      if (existingRest.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Conflict', message: 'A restaurant with this email already exists' },
          { status: 409 }
        );
      }

      // 1. Create Restaurant Tenant
      const restRes = await client.query(
        `INSERT INTO restaurants (
           name, address, email, phone, password_hash, avg_dining_duration_minutes, created_by_super_admin_id
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, email, address, phone, is_active, created_at;`,
        [
          name,
          address || null,
          cleanRestEmail,
          phone || null,
          passwordHash,
          avgDiningDurationMinutes,
          authContext.userId,
        ]
      );
      const restaurant = restRes.rows[0];

      // 2. Create Primary Owner Entry in restaurant_staff
      const staffRes = await client.query(
        `INSERT INTO restaurant_staff (restaurant_id, name, email, password_hash, role)
         VALUES ($1, $2, $3, $4, 'owner')
         RETURNING id, name, email, role;`,
        [
          restaurant.id,
          ownerName || `${name} Owner`,
          cleanOwnerEmail,
          passwordHash,
        ]
      );
      const owner = staffRes.rows[0];

      // 3. Initialize 8 default tables in a 4x2 grid
      const capacities = [2, 2, 4, 4, 4, 6, 6, 8];
      let tCount = 1;
      for (let row = 1; row <= 4; row++) {
        for (let col = 1; col <= 2; col++) {
          await client.query(
            `INSERT INTO tables (restaurant_id, table_number, capacity, grid_row, grid_col, status)
             VALUES ($1, $2, $3, $4, $5, 'free');`,
            [restaurant.id, `T${tCount}`, capacities[tCount - 1], row, col]
          );
          tCount++;
        }
      }

      // 4. Audit Log entry
      await client.query(
        `INSERT INTO audit_log (super_admin_id, restaurant_id, table_name, record_id, action, after_data)
         VALUES ($1, $2, 'restaurants', $3, 'create', $4);`,
        [
          authContext.userId,
          restaurant.id,
          restaurant.id,
          JSON.stringify({ restaurant, owner }),
        ]
      );

      await client.query('COMMIT');

      return NextResponse.json(
        {
          message: 'Tenant restaurant successfully onboarded',
          restaurant,
          owner,
          tablesInitialized: 8,
        },
        { status: 201 }
      );
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Create Restaurant Error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message || 'Failed to create restaurant' },
      { status: 500 }
    );
  }
}

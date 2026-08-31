import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check restaurant_staff table first
    let staffRes = await query(
      `SELECT rs.id, rs.restaurant_id, rs.name, rs.email, rs.password_hash, rs.role, r.name as restaurant_name, r.is_active
       FROM restaurant_staff rs
       JOIN restaurants r ON r.id = rs.restaurant_id
       WHERE LOWER(rs.email) = $1 LIMIT 1;`,
      [cleanEmail]
    );

    let user: any = null;

    if (staffRes.rows.length > 0) {
      user = staffRes.rows[0];
    } else {
      // 2. Fallback check restaurants primary owner email
      const restRes = await query(
        `SELECT id as restaurant_id, name as restaurant_name, email, password_hash, is_active
         FROM restaurants
         WHERE LOWER(email) = $1 LIMIT 1;`,
        [cleanEmail]
      );

      if (restRes.rows.length > 0) {
        const rest = restRes.rows[0];
        user = {
          id: rest.restaurant_id, // Owner user ID fallback
          restaurant_id: rest.restaurant_id,
          name: `${rest.restaurant_name} Owner`,
          email: rest.email,
          password_hash: rest.password_hash,
          role: 'owner',
          restaurant_name: rest.restaurant_name,
          is_active: rest.is_active,
        };
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Restaurant account is inactive. Please contact Super Admin.' },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token containing restaurantId strictly for tenant isolation
    const token = signToken({
      userId: user.id,
      role: user.role as 'owner' | 'staff',
      email: user.email,
      name: user.name,
      restaurantId: user.restaurant_id,
    });

    const response = NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        restaurantId: user.restaurant_id,
        restaurantName: user.restaurant_name,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    console.error('Restaurant Login Error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message || 'Login failed' },
      { status: 500 }
    );
  }
}

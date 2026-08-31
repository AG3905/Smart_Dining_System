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

    // Query super_admins table
    const result = await query(
      `SELECT id, name, email, password_hash FROM super_admins WHERE email = $1 LIMIT 1;`,
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const admin = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token for super_admin
    const token = signToken({
      userId: admin.id,
      role: 'super_admin',
      email: admin.email,
      name: admin.name,
    });

    const response = NextResponse.json({
      message: 'Super admin login successful',
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: 'super_admin',
      },
    });

    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    console.error('Super Admin Login Error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message || 'Login failed' },
      { status: 500 }
    );
  }
}

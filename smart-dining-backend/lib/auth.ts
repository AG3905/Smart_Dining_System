import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-smart-dining-jwt-key-2026';

export interface JWTPayload {
  userId: string;
  role: 'super_admin' | 'owner' | 'staff';
  email: string;
  name: string;
  restaurantId?: string; // Present for owner & staff roles
  iat?: number;
  exp?: number;
}

export interface AuthContext {
  userId: string;
  role: 'super_admin' | 'owner' | 'staff';
  email: string;
  name: string;
  restaurantId: string | null; // Null only for super_admin
}

/**
 * Sign a JWT token with 7-day expiration
 */
export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

/**
 * requireAuth helper to authenticate requests and enforce role authorization.
 *
 * For non-super-admin roles ('owner', 'staff'), restaurantId is ALWAYS
 * sourced directly from the verified JWT payload, preventing any tenant
 * spoofing or cross-tenant data leaks.
 */
export async function requireAuth(
  req: NextRequest,
  allowedRoles?: Array<'super_admin' | 'owner' | 'staff'>
): Promise<{ authContext: AuthContext; errorResponse?: Response }> {
  let token: string | null = null;

  // Check Authorization header (Bearer <token>)
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // Fallback to cookies
  if (!token) {
    const cookieToken = req.cookies.get('token') || req.cookies.get('auth_token');
    if (cookieToken) {
      token = cookieToken.value;
    }
  }

  if (!token) {
    return {
      authContext: null as any,
      errorResponse: new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication token is missing' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  try {
    const decoded = verifyToken(token);

    // Validate role permissions if specified
    if (allowedRoles && !allowedRoles.includes(decoded.role)) {
      return {
        authContext: null as any,
        errorResponse: new Response(
          JSON.stringify({
            error: 'Forbidden',
            message: `Role '${decoded.role}' does not have access to this resource`,
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        ),
      };
    }

    const authContext: AuthContext = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
      // For owner / staff, restaurantId comes STRICTLY from JWT
      restaurantId: decoded.role === 'super_admin' ? null : (decoded.restaurantId || null),
    };

    return { authContext };
  } catch (err: any) {
    return {
      authContext: null as any,
      errorResponse: new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
}

/**
 * Enforces tenant scope resolution.
 * - Non-super-admins: ALWAYS returns JWT-sourced restaurantId (ignores user-supplied target).
 * - Super admin: Uses user-supplied target or null.
 */
export function getEnforcedRestaurantId(
  authContext: AuthContext,
  requestedRestaurantId?: string | null
): string | null {
  if (authContext.role === 'super_admin') {
    return requestedRestaurantId || null;
  }
  // For owner / staff, NEVER trust requestedRestaurantId from body/URL
  return authContext.restaurantId;
}

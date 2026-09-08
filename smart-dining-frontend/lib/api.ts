const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Helper to get a cookie value by name in browser context
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

/**
 * Store JWT token in cookie & localStorage
 */
export function setAuthToken(token: string, user?: any) {
  if (typeof document !== 'undefined') {
    // Store in cookie for server/middleware accessibility
    document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;

    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
  }
}

/**
 * Clear JWT token and user session
 */
export function clearAuthToken() {
  if (typeof document !== 'undefined') {
    document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
    localStorage.removeItem('auth_user');
  }
}

/**
 * Get stored user profile from localStorage
 */
export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('auth_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export interface ApiFetchOptions extends RequestInit {
  token?: string;
}

/**
 * Custom fetch wrapper that prefixes calls with NEXT_PUBLIC_API_URL
 * and attaches auth token from cookies (or provided options).
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { token: customToken, headers: customHeaders, ...restOptions } = options;

  // Retrieve token from cookie if not explicitly passed
  const token = customToken || getCookie('auth_token') || getCookie('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ensure leading slash for endpoint formatting
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${API_URL}${formattedEndpoint}`;

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      headers,
      ...restOptions,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Unable to reach the API at ${API_URL}. Make sure the backend is running on port 4000 and open the app at http://localhost:3000.`);
    }
    throw error;
  }

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.message) errorMessage = errorData.message;
      else if (errorData.error) errorMessage = errorData.error;
    } catch {
      // Ignore JSON parse error on non-200 non-JSON responses
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export default apiFetch;

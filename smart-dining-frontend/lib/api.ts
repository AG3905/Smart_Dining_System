const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Helper to get a cookie value by name in browser context
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
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

  const response = await fetch(fullUrl, {
    headers,
    ...restOptions,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.message) errorMessage = errorData.message;
    } catch {
      // Ignore JSON parse error on non-200 non-JSON responses
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export default apiFetch;

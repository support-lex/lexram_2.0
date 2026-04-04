/**
 * Authentication utilities for LexRam
 * Provides auth token management via cookies for secure authentication
 */

const AUTH_COOKIE_NAME = 'lexram_auth';

/**
 * Set an authentication token in a cookie
 */
export function setAuthToken(token: string): void {
  // Set cookie via document.cookie (client-side only)
  if (typeof document !== 'undefined') {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7); // 7 day expiration

    document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(
      token
    )}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`;
  }
}

/**
 * Get the authentication token from cookies
 */
export function getAuthToken(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === AUTH_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

/**
 * Clear the authentication token
 */
export function clearAuthToken(): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * Validate credentials (demo implementation)
 * For demo purposes: any email + password "demo123" works
 */
export async function validateCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Invalid email format' };
  }

  // Validate password (demo password is "demo123")
  if (password !== 'demo123') {
    return { success: false, error: 'Invalid password' };
  }

  // Generate a demo token (in production, this would come from the server)
  const token = `demo_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  return { success: true, token };
}

/**
 * Sign out the user
 */
export function signOut(): void {
  clearAuthToken();
}

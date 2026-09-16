const GENERIC_AUTH_ERROR = 'An unexpected error occurred. Please try again.';

/**
 * Maps a raw Firebase Auth error code to a user-readable message.
 *
 * Raw Firebase error codes (e.g. `auth/invalid-credential`) are never surfaced
 * to users directly. Unknown or unmapped codes fall back to a generic message.
 *
 * @param code - The Firebase Auth error code.
 * @returns A user-readable error message.
 */
export function mapAuthError(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/wrong-password': 'Current password is incorrect.',
    'auth/weak-password': 'New password is too weak. Use at least 6 characters.',
    'auth/requires-recent-login': 'Session expired. Please sign out and back in, then try again.'
  };
  // Use `Object.hasOwn` so inherited members (e.g. a code of "toString" or
  // "constructor") do not resolve to prototype values and correctly fall back
  // to the generic message.
  return Object.hasOwn(map, code) ? map[code] : GENERIC_AUTH_ERROR;
}

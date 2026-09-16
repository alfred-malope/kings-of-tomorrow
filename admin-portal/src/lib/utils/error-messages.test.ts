import { describe, it, expect } from 'vitest';
import { mapAuthError } from './error-messages';

const FALLBACK = 'An unexpected error occurred. Please try again.';

describe('mapAuthError', () => {
  it('maps auth/invalid-credential', () => {
    expect(mapAuthError('auth/invalid-credential')).toBe('Invalid email or password.');
  });

  it('maps auth/user-disabled', () => {
    expect(mapAuthError('auth/user-disabled')).toBe('This account has been disabled.');
  });

  it('maps auth/too-many-requests', () => {
    expect(mapAuthError('auth/too-many-requests')).toBe(
      'Too many attempts. Please try again later.'
    );
  });

  it('maps auth/network-request-failed', () => {
    expect(mapAuthError('auth/network-request-failed')).toBe(
      'Network error. Check your connection.'
    );
  });

  it('returns the generic fallback for an unknown code', () => {
    expect(mapAuthError('auth/some-unknown-code')).toBe(FALLBACK);
  });

  it('returns the generic fallback for an empty string', () => {
    expect(mapAuthError('')).toBe(FALLBACK);
  });

  it('never surfaces the raw code in the mapped message', () => {
    const code = 'auth/invalid-credential';
    expect(mapAuthError(code)).not.toContain(code);
  });
});

// ── Property-based tests ──────────────────────────────────────────────────────
import fc from 'fast-check';

describe('mapAuthError — properties', () => {
  // Feature: kot-fc-admin-portal, Property 3: Auth error codes are never exposed to the user
  // **Validates: Requirements 2.8**
  it('never exposes the raw code and always returns a non-empty message', () => {
    fc.assert(
      fc.property(fc.string(), (code) => {
        const result = mapAuthError(code);
        // The message is always user-readable (non-empty).
        expect(result.length).toBeGreaterThan(0);
        // The raw Firebase code must never be leaked into the message. Guard
        // against trivial containment: an empty string is a substring of every
        // string, and single characters like a space incidentally appear in the
        // generic fallback ("An unexpected error occurred…"). Those overlaps are
        // not code leakage, so only assert non-containment when the code is not
        // already ordinary text within the generic fallback.
        if (code.length > 0 && !FALLBACK.includes(code)) {
          expect(result).not.toContain(code);
        }
      })
    );
  });
});

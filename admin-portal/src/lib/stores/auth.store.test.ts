import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';

// The store module imports the Firebase client (auth) at module load; stub it so
// no real Firebase app is initialised during the test.
vi.mock('$lib/firebase/client', () => ({ auth: {} }));

import { resolveRoleFromToken } from './auth.store.svelte';

describe('resolveRoleFromToken — properties', () => {
  // Feature: kot-fc-admin-portal, Property 4: Auth store reflects role from ID token claims
  // **Validates: Requirements 3.1**
  it('returns the role claim for any valid role value', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('admin', 'editor', 'viewer') as fc.Arbitrary<'admin' | 'editor' | 'viewer'>,
        (role) => {
          const resolved = resolveRoleFromToken({ claims: { role } } as never);
          expect(resolved).toBe(role);
        }
      )
    );
  });

  // Any claim value that is not one of the known roles resolves to null.
  it('returns null for any non-role claim value', () => {
    fc.assert(
      fc.property(
        fc
          .string()
          .filter((s) => s !== 'admin' && s !== 'editor' && s !== 'viewer'),
        (role) => {
          const resolved = resolveRoleFromToken({ claims: { role } } as never);
          expect(resolved).toBeNull();
        }
      )
    );
  });
});

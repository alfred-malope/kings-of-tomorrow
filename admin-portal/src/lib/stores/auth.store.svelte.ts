import { onAuthStateChanged, type IdTokenResult, type User } from 'firebase/auth';
import { auth } from '$lib/firebase/client';
import { db } from '$lib/firebase/client';
import { getUser } from '$lib/repositories/users.repository';
import type { UserRole } from '$lib/types/firestore.types';

/**
 * Reactive authentication state for the Admin_Portal.
 *
 * Exposes the current Firebase `user`, the resolved `role` custom claim, and a
 * `loading` flag that is `true` until the first `onAuthStateChanged` callback
 * has been processed (Requirement 3.1).
 *
 * The state is defined with Svelte 5 `$state` runes so components can read it
 * reactively (typically via `$derived`).
 */

/**
 * Extract the `role` custom claim from a Firebase ID token result.
 *
 * Kept as a standalone, side-effect-free helper so the role-resolution logic
 * can be unit- and property-tested against a mock `IdTokenResult` without
 * needing a live Firebase connection (Property 4). Returns `null` when the
 * claim is missing or is not one of the known {@link UserRole} values.
 */
export function resolveRoleFromToken(result: Pick<IdTokenResult, 'claims'>): UserRole | null {
  const role = result.claims?.role;
  if (role === 'admin' || role === 'editor' || role === 'viewer') {
    return role;
  }
  return null;
}

class AuthStore {
  /** The currently authenticated Firebase user, or `null` when signed out. */
  user = $state<User | null>(null);
  /** Display name stored in the portal user record, when available. */
  displayName = $state<string | null>(null);
  /** The user's role resolved from the ID token custom claim. */
  role = $state<UserRole | null>(null);
  /** `true` until the first auth-state resolution completes. */
  loading = $state(true);

  #initialised = false;
  #unsubscribe: (() => void) | null = null;

  /**
   * Process a resolved Firebase user, updating `user` and `role`.
   *
   * Reads the `role` custom claim from a forced ID-token refresh so freshly
   * assigned claims take effect immediately. Exposed as a method so tests can
   * drive the store with a mocked user without an `onAuthStateChanged` cycle.
   */
  async setUser(user: User | null): Promise<void> {
    this.user = user;
    this.displayName = user?.displayName?.trim() || null;
    if (user) {
      const result = await user.getIdTokenResult(true);
      this.role = resolveRoleFromToken(result);
      try {
        const record = await getUser(db, user.uid);
        if (record?.displayName?.trim()) {
          this.displayName = record.displayName.trim();
        }
      } catch {
        // Firebase Auth displayName remains the fallback when the profile record is unavailable.
      }
    } else {
      this.role = null;
    }
    this.loading = false;
  }

  /**
   * Subscribe to Firebase auth-state changes. Safe to call multiple times; the
   * subscription is only established once. Intended to be invoked from the root
   * layout (inside a `$effect`) so it runs in the browser.
   *
   * Returns an unsubscribe function.
   */
  init(): () => void {
    if (this.#initialised) {
      return this.#unsubscribe ?? (() => {});
    }
    this.#initialised = true;
    this.#unsubscribe = onAuthStateChanged(auth, (user) => {
      void this.setUser(user);
    });
    return this.#unsubscribe;
  }
}

export const authStore = new AuthStore();

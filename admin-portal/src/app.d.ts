// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { UserRole } from '$lib/types/firestore.types';

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      /** Whether the current request carries a valid authenticated session. */
      isAuthenticated: boolean;
      /** The authenticated user's role, or null when unauthenticated. */
      role: UserRole | null;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};

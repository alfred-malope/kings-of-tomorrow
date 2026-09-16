import type { LayoutServerLoad } from './$types';

/**
 * Minimal root server layout. It performs no route-guard logic itself — route
 * protection is handled by `hooks.server.ts` (and the `/admin` layout guard).
 * It simply surfaces the auth state derived by the hook so any page can read it
 * from `data` if needed.
 */
export const load: LayoutServerLoad = ({ locals }) => {
  return {
    isAuthenticated: locals.isAuthenticated,
    role: locals.role
  };
};

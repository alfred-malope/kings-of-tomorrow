import { redirect } from '@sveltejs/kit';
import { evaluateRouteGuard } from '../../hooks.server';
import type { LayoutServerLoad } from './$types';

/**
 * Server-side route guard for all `/admin/*` routes (Requirements 2.4, 2.5,
 * 3.2, 13.4, 14.8). Reuses the pure `evaluateRouteGuard` helper so the guard
 * decision is identical to the global hook:
 *
 * - Unauthenticated requests to `/admin/*` → redirect to `/login`.
 * - Non-admin requests to `/admin/users` or `/admin/settings` → redirect to `/admin`.
 *
 * `hooks.server.ts` already enforces this globally; this layout guard provides
 * defence in depth at the layout boundary.
 */
export const load: LayoutServerLoad = ({ locals, url }) => {
  const target = evaluateRouteGuard({
    path: url.pathname,
    isAuthenticated: locals.isAuthenticated,
    role: locals.role
  });

  if (target && target !== url.pathname) {
    redirect(303, target);
  }

  return {
    isAuthenticated: locals.isAuthenticated,
    role: locals.role
  };
};

import { redirect, type Handle } from '@sveltejs/kit';
import type { UserRole } from '$lib/types/firestore.types';

/**
 * Input to the pure route-guard decision function.
 */
export type RouteGuardInput = {
  /** The request pathname, e.g. "/admin/users". */
  path: string;
  /** Whether the request carries a valid authenticated session. */
  isAuthenticated: boolean;
  /** The authenticated user's role, or null when unknown / unauthenticated. */
  role: UserRole | null;
};

/** Routes that only an `admin` may access. */
const ADMIN_ONLY_PREFIXES = ['/admin/users', '/admin/settings'] as const;
const WRITE_ROUTE_PREFIXES = [
  '/admin/players/',
  '/admin/fixtures/',
  '/admin/results/',
  '/admin/news/',
  '/admin/tournaments/',
  '/admin/members/',
  '/admin/gallery/new'
] as const;

/**
 * Returns true when `path` is (or is nested under) `prefix`.
 * Guards against false positives like "/admin/userspace" matching "/admin/users".
 */
function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/** Returns true when the path is within the `/admin` area. */
function isAdminPath(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/');
}

/** Returns true when the path is the login page. */
function isLoginPath(path: string): boolean {
  return path === '/login';
}

/** Returns true when the path opens a create/edit content form. */
function isWritePath(path: string): boolean {
  return WRITE_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Pure, side-effect-free route-guard decision function.
 *
 * Given the request path and the caller's authentication state, it returns the
 * path the caller should be redirected to, or `null` when the request is allowed
 * to proceed unmodified. Keeping this logic pure makes it directly testable
 * (see tests/hooks.test.ts — Properties 1, 2, and 5).
 *
 * Rules (Requirements 2.4, 2.5, 3.2, 13.4, 14.8):
 * - Unauthenticated request to any `/admin` route → redirect to `/login`.
 * - Authenticated request to `/login` → redirect to `/admin`.
 * - Authenticated non-admin request to `/admin/users` or `/admin/settings`
 *   → redirect to `/admin`.
 * - Authenticated viewer request to a content create/edit route → redirect to
 *   the relevant content list.
 * - Everything else → `null` (proceed).
 */
export function evaluateRouteGuard({ path, isAuthenticated, role }: RouteGuardInput): string | null {
  // Unauthenticated users may not enter the admin area.
  if (isAdminPath(path) && !isAuthenticated) {
    return '/login';
  }

  // Authenticated users should not sit on the login page.
  if (isLoginPath(path) && isAuthenticated) {
    return '/admin';
  }

  // Role-restricted admin routes: only `admin` may access users/settings.
  if (isAuthenticated && role !== 'admin') {
    const isRestricted = ADMIN_ONLY_PREFIXES.some((prefix) => matchesPrefix(path, prefix));
    if (isRestricted) {
      return '/admin';
    }
  }

  // Viewers may read content lists but cannot open create/edit forms.
  if (isAuthenticated && role === 'viewer' && isWritePath(path)) {
    const section = path.split('/')[2];
    return `/admin/${section}`;
  }

  // No redirect required — allow the request through.
  return null;
}

/** Cookie names used to convey auth state to the server. */
const SESSION_COOKIE = 'session';
const ROLE_COOKIE = 'role';

const VALID_ROLES: readonly UserRole[] = ['admin', 'editor', 'viewer'];

/** Narrows an arbitrary cookie value to a valid `UserRole`, or null. */
function parseRole(value: string | undefined): UserRole | null {
  return value != null && (VALID_ROLES as readonly string[]).includes(value)
    ? (value as UserRole)
    : null;
}

/**
 * SvelteKit server hook.
 *
 * This is a client-auth Firebase app, so the server derives auth state from
 * cookies set by the client after Firebase authentication: a `session` cookie
 * (its presence indicates an authenticated session) and a `role` cookie holding
 * the user's custom-claim role. The decision itself is delegated to the pure
 * `evaluateRouteGuard` helper so it can be unit/property tested in isolation.
 */
export const handle: Handle = async ({ event, resolve }) => {
  const sessionCookie = event.cookies.get(SESSION_COOKIE);
  const isAuthenticated = Boolean(sessionCookie);
  const role = parseRole(event.cookies.get(ROLE_COOKIE));

  // Expose auth state to load functions / endpoints.
  event.locals.isAuthenticated = isAuthenticated;
  event.locals.role = role;

  const target = evaluateRouteGuard({
    path: event.url.pathname,
    isAuthenticated,
    role
  });

  if (target && target !== event.url.pathname) {
    throw redirect(303, target);
  }

  // Forward all other requests unmodified.
  return resolve(event);
};

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { evaluateRouteGuard } from '../src/hooks.server';

const ADMIN_PATHS = ['/admin', '/admin/players', '/admin/users', '/admin/settings'];

describe('evaluateRouteGuard — properties', () => {
  // Feature: kot-fc-admin-portal, Property 1: Unauthenticated requests are always redirected to /login
  // **Validates: Requirements 2.4**
  it('redirects any unauthenticated /admin request to /login', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ADMIN_PATHS), (path) => {
        const target = evaluateRouteGuard({ path, isAuthenticated: false, role: null });
        expect(target).toBe('/login');
      })
    );
  });

  // Feature: kot-fc-admin-portal, Property 2: Authenticated users are redirected away from /login
  // **Validates: Requirements 2.5**
  it('redirects any authenticated user away from /login to /admin', () => {
    fc.assert(
      fc.property(fc.constantFrom('admin', 'editor', 'viewer') as fc.Arbitrary<'admin' | 'editor' | 'viewer'>, (role) => {
        const target = evaluateRouteGuard({ path: '/login', isAuthenticated: true, role });
        expect(target).toBe('/admin');
      })
    );
  });

  // Feature: kot-fc-admin-portal, Property 5: Non-admin users cannot access admin-only routes
  // **Validates: Requirements 3.2, 13.4, 14.8**
  it('redirects editor/viewer away from admin-only routes to /admin', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('editor', 'viewer') as fc.Arbitrary<'editor' | 'viewer'>,
        fc.constantFrom('/admin/users', '/admin/settings'),
        (role, path) => {
          const target = evaluateRouteGuard({ path, isAuthenticated: true, role });
          expect(target).toBe('/admin');
        }
      )
    );
  });
});

import { writable } from 'svelte/store';

export interface Route {
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
}

function parsePath(): Route {
  const href = window.location.pathname;
  const search = window.location.search;
  const query: Record<string, string> = {};
  if (search) {
    new URLSearchParams(search).forEach((v, k) => {
      query[k] = v;
    });
  }
  return { path: href, params: {}, query };
}

function createRouter() {
  const { subscribe, set, update } = writable<Route>(parsePath());

  function navigate(path: string) {
    if (path === window.location.pathname) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', path);
    set(parsePath());
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }

  function back() {
    window.history.back();
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => set(parsePath()));
  }

  return { subscribe, navigate, set, update, back };
}

export const router = createRouter();

/**
 * Match a route pattern against the current path and extract params.
 * Patterns use :param syntax, e.g. "/news/:slug"
 */
export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i];
    const ap = pathParts[i];
    if (pp.startsWith(':')) {
      params[pp.slice(1)] = decodeURIComponent(ap);
    } else if (pp !== ap) {
      return null;
    }
  }
  return params;
}

export function isActive(path: string, currentPath: string): boolean {
  if (path === '/') return currentPath === '/';
  return currentPath === path || currentPath.startsWith(path + '/');
}

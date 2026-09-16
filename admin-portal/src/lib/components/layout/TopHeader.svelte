<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import { signOutUser } from '$lib/firebase/auth';

  interface Props {
    /** Toggles the mobile slide-out drawer (Requirement 4.3). */
    onToggleDrawer?: () => void;
  }

  let { onToggleDrawer }: Props = $props();

  // Human-readable titles for each admin route segment.
  const titles: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/players': 'Players',
    '/admin/fixtures': 'Fixtures',
    '/admin/results': 'Results',
    '/admin/news': 'News',
    '/admin/gallery': 'Gallery',
    '/admin/tournaments': 'Tournaments',
    '/admin/members': 'Members',
    '/admin/settings': 'Settings',
    '/admin/users': 'User Management'
  };

  /**
   * Derive the current page title from the route pathname (Requirement 4.2).
   * Matches the longest known prefix so nested routes (e.g. /admin/players/new)
   * still resolve to their section title.
   */
  const pageTitle = $derived.by(() => {
    const path = $page.url.pathname;
    if (titles[path]) {
      return titles[path];
    }
    const match = Object.keys(titles)
      .filter((key) => key !== '/admin' && path.startsWith(`${key}/`))
      .sort((a, b) => b.length - a.length)[0];
    return match ? titles[match] : 'Admin';
  });

  // Prefer the display name; avoid exposing the email in the visible header.
  const userName = $derived(authStore.displayName || 'Account');

  let signingOut = $state(false);

  async function handleLogout(): Promise<void> {
    signingOut = true;
    try {
      await signOutUser();
      // Clear the cookie-based auth state the server guard reads (hooks.server.ts).
      document.cookie = 'session=; path=/; Max-Age=0; SameSite=Lax';
      document.cookie = 'role=; path=/; Max-Age=0; SameSite=Lax';
      await goto('/login');
    } finally {
      signingOut = false;
    }
  }
</script>

<!-- Top header bar for all /admin/* routes (Requirement 4.2). -->
<header
  class="flex h-[71px] shrink-0 items-center gap-3 border-b border-white/10 bg-navy-950/80 px-4 shadow-lg shadow-black/10 backdrop-blur-xl sm:px-7"
>
  <!-- Hamburger toggle, visible on mobile only (Requirement 4.3). -->
  <button
    type="button"
    onclick={() => onToggleDrawer?.()}
    class="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900 md:hidden"
    aria-label="Open navigation menu"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-6 w-6" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  </button>

  <div class="flex min-w-0 flex-1 items-center gap-3">
    <div class="hidden h-8 w-px bg-white/10 sm:block"></div>
    <div class="min-w-0">
      <p class="hidden text-[0.65rem] font-bold uppercase tracking-[0.22em] text-blue-400 sm:block">K.O.T FC / Control room</p>
      <h1 class="heading-display truncate text-2xl text-white sm:text-3xl">{pageTitle}</h1>
    </div>
  </div>

  <div class="hidden items-center gap-3 border-l border-white/10 pl-4 sm:flex">
    <span class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/15 text-sm font-bold text-blue-300">
      {userName.slice(0, 1).toUpperCase()}
    </span>
    <div class="max-w-[11rem] leading-tight">
      <p class="truncate text-sm font-semibold text-white" title={userName}>{userName}</p>
      <p class="mt-0.5 text-[0.65rem] font-bold uppercase tracking-widest text-white/40">{authStore.role ?? 'member'}</p>
    </div>
  </div>

  <button
    type="button"
    onclick={handleLogout}
    disabled={signingOut}
    class="btn-outline !min-h-10 !px-4 !py-2 !text-[0.68rem] disabled:cursor-not-allowed disabled:opacity-60"
  >
    {signingOut ? 'Signing out…' : 'Logout'}
  </button>
</header>

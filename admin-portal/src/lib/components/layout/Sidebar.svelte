<script lang="ts">
  import { page } from '$app/stores';
  import { authStore } from '$lib/stores/auth.store.svelte';

  interface Props {
    /** Invoked when a nav link is activated — used by the mobile drawer to close itself. */
    onNavigate?: () => void;
  }

  let { onNavigate }: Props = $props();

  type NavItem = {
    label: string;
    href: string;
    /** Inline SVG path data (24x24 viewBox) drawn for this item. */
    icon: string;
    /** When true, the link is only shown to `admin` users (Requirement 4.5). */
    adminOnly?: boolean;
  };

  // Icon path data (Heroicons-style, 24x24 viewBox, stroke-based outline).
  const icons = {
    dashboard:
      'M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75',
    players:
      'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    fixtures:
      'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    results:
      'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    news:
      'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z',
    gallery:
      'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
    tournaments:
      'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0',
    members:
      'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
    settings:
      'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z',
    settingsGear: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    users:
      'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'
  } as const;

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin', icon: icons.dashboard },
    { label: 'Players', href: '/admin/players', icon: icons.players },
    { label: 'Fixtures', href: '/admin/fixtures', icon: icons.fixtures },
    { label: 'Results', href: '/admin/results', icon: icons.results },
    { label: 'News', href: '/admin/news', icon: icons.news },
    { label: 'Gallery', href: '/admin/gallery', icon: icons.gallery },
    { label: 'Tournaments', href: '/admin/tournaments', icon: icons.tournaments },
    { label: 'User Management', href: '/admin/users', icon: icons.users, adminOnly: true }
  ];

  // Settings and User Management are each evaluated independently against the
  // admin role; editor/viewer never see them (Requirement 4.5).
  const visibleItems = $derived(
    navItems.filter((item) => !item.adminOnly || authStore.role === 'admin')
  );

  const currentPath: string = $derived($page.url.pathname);

  /**
   * The Dashboard link (`/admin`) must only be active on an exact match,
   * otherwise every `/admin/*` route would highlight it. All other links are
   * active when the current path matches or is nested beneath them
   * (Requirement 4.6).
   */
  function isActive(href: string): boolean {
    if (href === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath === href || currentPath.startsWith(`${href}/`);
  }
</script>

<!-- Persistent left sidebar for all /admin/* routes (Requirement 4.1). -->
<nav
  class="flex h-full w-64 flex-col border-r border-white/10 bg-navy-950"
  aria-label="Primary"
>
  <!-- Branding header: logo + club name (Requirement 4.4). -->
  <a
    href="/admin"
    onclick={() => onNavigate?.()}
    class="flex h-[71px] shrink-0 items-center gap-3 border-b border-white/10 bg-navy-900 px-5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900"
  >
    <img src="/kot-logo.svg" alt="" class="h-10 w-10 shrink-0" aria-hidden="true" />
    <span>
      <span class="heading-display block text-lg leading-none text-white">K.O.T FC</span>
      <span class="mt-1 block text-[0.58rem] font-bold uppercase tracking-[0.2em] text-blue-400">Admin workspace</span>
    </span>
  </a>

  <!-- Navigation links. -->
  <div class="px-5 pb-2 pt-5 text-[0.62rem] font-bold uppercase tracking-[0.22em] text-white/30">Workspace</div>
  <ul class="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
    {#each visibleItems as item (item.href)}
      {@const active = isActive(item.href)}
      <li>
        <a
          href={item.href}
          onclick={() => onNavigate?.()}
          aria-current={active ? 'page' : undefined}
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900
            {active
              ? 'border-l-2 border-blue-400 bg-blue-400/10 text-blue-300 shadow-[inset_10px_0_24px_-20px_rgba(0,174,239,0.8)]'
              : 'border-l-2 border-transparent text-white/60 hover:bg-white/5 hover:text-white'}"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            class="h-5 w-5 shrink-0"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d={item.icon} />
            {#if item.href === '/admin/settings'}
              <path stroke-linecap="round" stroke-linejoin="round" d={icons.settingsGear} />
            {/if}
          </svg>
          <span>{item.label}</span>
        </a>
      </li>
    {/each}
  </ul>

  <!-- Developer credit -->
  <div class="border-t border-white/5 px-5 py-4">
    <p class="text-center text-[0.6rem] font-medium tracking-wide text-white/25">
      Developed by <a href="https://365itconsultants.co.za" target="_blank" rel="noopener noreferrer" class="text-white/40 transition-colors hover:text-blue-400">365 IT Consultants</a>
    </p>
  </div>
</nav>

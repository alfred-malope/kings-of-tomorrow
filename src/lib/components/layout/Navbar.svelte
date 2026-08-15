<script lang="ts">
  import { club } from '../../data/club';
  import { navItems, ctaLabel, ctaUrl } from '../../data/navigation';
  import { router, isActive } from '../../router';
  import { mobileMenuOpen } from './mobileMenuStore';

  let scrolled = false;
  let currentPath = '/';

  router.subscribe((r) => {
    currentPath = r.path;
  });

  function handleNav(path: string) {
    mobileMenuOpen.set(false);
    router.navigate(path);
  }

  function onScroll() {
    scrolled = window.scrollY > 40;
  }

  function handleKeydown(event: KeyboardEvent, path: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNav(path);
    }
  }
</script>

<svelte:window on:scroll={onScroll} />

<header
  class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 {scrolled
    ? 'bg-navy-900/95 backdrop-blur-md shadow-lg shadow-black/30 border-b border-white/5'
    : 'bg-gradient-to-b from-navy-950/80 to-transparent'}"
>
  <nav class="container-x flex items-center justify-between h-16 lg:h-20" aria-label="Main navigation">
    <button
      on:click={() => handleNav('/')}
      on:keydown={(e) => handleKeydown(e, '/')}
      class="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg"
      aria-label="K.O.T FC home"
    >
      <img src={club.logo} alt={club.name} class="h-10 w-10 lg:h-12 lg:w-12" />
      <div class="hidden sm:flex flex-col leading-none">
        <span class="heading-display text-base lg:text-lg text-white">K.O.T FC</span>
        <span class="text-[0.6rem] uppercase tracking-widest text-blue-400">Kings Of Tomorrow</span>
      </div>
    </button>

    <ul class="hidden lg:flex items-center gap-7" role="menubar">
      {#each navItems as item (item.path)}
        <li role="none">
          <button
            on:click={() => handleNav(item.path)}
            on:keydown={(e) => handleKeydown(e, item.path)}
            role="menuitem"
            class="link-nav {isActive(item.path, currentPath) ? 'active' : ''}"
            aria-current={isActive(item.path, currentPath) ? 'page' : undefined}
          >
            {item.label}
          </button>
        </li>
      {/each}
    </ul>

    <div class="flex items-center gap-3">
      <a href={ctaUrl} target="_blank" rel="noreferrer" class="hidden sm:inline-flex btn-primary !px-5 !py-2.5 !text-xs">
        {ctaLabel}
      </a>
      <button
        on:click={() => mobileMenuOpen.set(true)}
        class="lg:hidden p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg"
        aria-label="Open menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </div>
  </nav>
</header>

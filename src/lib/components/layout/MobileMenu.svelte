<script lang="ts">
  import { club } from '../../data/club';
  import { navItems, ctaLabel, ctaUrl } from '../../data/navigation';
  import { router, isActive } from '../../router';
  import { mobileMenuOpen } from './mobileMenuStore';
  import { fly, fade } from 'svelte/transition';

  let currentPath = '/';
  router.subscribe((r) => {
    currentPath = r.path;
  });

  function handleNav(path: string) {
    mobileMenuOpen.set(false);
    router.navigate(path);
  }

  function close() {
    mobileMenuOpen.set(false);
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') close();
  }
</script>

<svelte:window on:keydown={onKeydown} />

{#if $mobileMenuOpen}
  <div
    class="fixed inset-0 z-[60] lg:hidden"
    transition:fade={{ duration: 200 }}
    role="dialog"
    aria-modal="true"
    aria-label="Mobile navigation menu"
  >
    <!-- Backdrop -->
    <button
      class="absolute inset-0 bg-navy-950/80 backdrop-blur-sm"
      on:click={close}
      aria-label="Close menu"
    ></button>

    <!-- Drawer -->
    <div
      class="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-navy-900 border-l border-white/10 flex flex-col"
      transition:fly={{ x: 320, duration: 300, opacity: 1 }}
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-5 border-b border-white/10">
        <div class="flex items-center gap-3">
          <img src={club.logo} alt={club.name} class="h-10 w-10" />
          <span class="heading-display text-base text-white">K.O.T FC</span>
        </div>
        <button
          on:click={close}
          class="p-2 text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg"
          aria-label="Close menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Nav links -->
      <nav class="flex-1 overflow-y-auto py-4" aria-label="Mobile navigation">
        <ul class="flex flex-col">
          {#each navItems as item (item.path)}
            <li>
              <button
                on:click={() => handleNav(item.path)}
                class="w-full text-left px-5 py-4 text-lg font-semibold uppercase tracking-wider transition-colors duration-200 {isActive(item.path, currentPath) ? 'text-blue-400 bg-blue-500/5 border-l-2 border-blue-400' : 'text-white/70 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}"
                aria-current={isActive(item.path, currentPath) ? 'page' : undefined}
              >
                {item.label}
              </button>
            </li>
          {/each}
        </ul>
      </nav>

      <!-- CTA -->
      <div class="p-5 border-t border-white/10">
        <a href={ctaUrl} target="_blank" rel="noreferrer" class="btn-primary w-full">
          {ctaLabel}
        </a>
      </div>
    </div>
  </div>
{/if}

<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import type { GalleryImage } from '../../gallery/types';

  export let images: GalleryImage[] = [];
  export let startIndex: number = 0;
  export let isOpen: boolean = false;

  let currentIndex = 0;

  $: if (isOpen) {
    currentIndex = Math.min(
      Math.max(startIndex, 0),
      Math.max(images.length - 1, 0)
    );
  }

  function close() {
    isOpen = false;
  }

  function next() {
    currentIndex = (currentIndex + 1) % images.length;
  }

  function prev() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
  }

  function onKeydown(event: KeyboardEvent) {
    if (!isOpen) return;
    switch (event.key) {
      case 'Escape':
        close();
        break;
      case 'ArrowRight':
        next();
        break;
      case 'ArrowLeft':
        prev();
        break;
    }
  }

  function trapFocus(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault();
    }
  }
</script>

<svelte:window on:keydown={onKeydown} />

{#if isOpen && images.length > 0}
  <div
    class="fixed inset-0 z-[100] bg-navy-950/95 backdrop-blur-md flex flex-col"
    transition:fade={{ duration: 200 }}
    role="dialog"
    aria-modal="true"
    aria-label="Photo viewer"
    tabindex="-1"
  >
    <!-- Top bar -->
    <div class="flex items-center justify-between p-4 sm:p-6 text-white">
      <span class="text-sm font-semibold text-white/60">
        {currentIndex + 1} / {images.length}
      </span>
      <button
        on:click={close}
        class="p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
        aria-label="Close photo viewer"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Image area -->
    <div class="flex-1 flex items-center justify-center px-4 sm:px-16 relative min-h-0">
      <!-- Prev -->
      {#if images.length > 1}
        <button
          on:click={prev}
          class="absolute left-2 sm:left-4 p-2 sm:p-3 rounded-full bg-white/5 hover:bg-white/15 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors z-10"
          aria-label="Previous photo"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      {/if}

      {#key currentIndex}
        <div class="max-w-full max-h-full flex items-center justify-center" transition:fade={{ duration: 150 }}>
          <img
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            class="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
        </div>
      {/key}

      <!-- Next -->
      {#if images.length > 1}
        <button
          on:click={next}
          class="absolute right-2 sm:right-4 p-2 sm:p-3 rounded-full bg-white/5 hover:bg-white/15 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors z-10"
          aria-label="Next photo"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      {/if}
    </div>

    <!-- Caption + counter -->
    <div class="p-4 sm:p-6 text-center">
      <p class="text-xs text-white/40 uppercase tracking-widest">
        Use arrow keys to navigate &middot; Esc to close
      </p>
    </div>
  </div>
{/if}

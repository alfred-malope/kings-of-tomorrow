<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { GalleryImage } from '../../gallery/types';

  export let images: GalleryImage[] = [];
  export let startIndex: number = 0;
  export let isOpen: boolean = false;

  let currentIndex = 0;
  let wasOpen = false;

  // Touch/swipe state
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  const SWIPE_THRESHOLD = 50;

  // Set the starting image only when the lightbox opens
  $: {
    if (isOpen && !wasOpen) {
      currentIndex = Math.min(
        Math.max(startIndex, 0),
        Math.max(images.length - 1, 0)
      );
    }

    wasOpen = isOpen;
  }

  function close() {
    isOpen = false;
  }

  function next() {
    if (images.length <= 1) return;

    currentIndex = (currentIndex + 1) % images.length;
  }

  function prev() {
    if (images.length <= 1) return;

    currentIndex =
      (currentIndex - 1 + images.length) % images.length;
  }

  function onKeydown(event: KeyboardEvent) {
    if (!isOpen || images.length === 0) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        close();
        break;

      case 'ArrowRight':
        event.preventDefault();
        next();
        break;

      case 'ArrowLeft':
        event.preventDefault();
        prev();
        break;
    }
  }

  function handleTouchStart(event: TouchEvent) {
    if (event.touches.length !== 1) return;

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchEndX = touchStartX;
    touchEndY = touchStartY;
  }

  function handleTouchMove(event: TouchEvent) {
    if (event.touches.length !== 1) return;

    touchEndX = event.touches[0].clientX;
    touchEndY = event.touches[0].clientY;
  }

  function handleTouchEnd() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Ignore small movements
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) {
      return;
    }

    // Ignore mostly vertical swipes
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    if (deltaX < 0) {
      // Swipe left → next photo
      next();
    } else {
      // Swipe right → previous photo
      prev();
    }

    // Reset touch values
    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
    touchEndY = 0;
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
        type="button"
        on:click={close}
        class="p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
        aria-label="Close photo viewer"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Image area -->
    <div
      class="flex-1 flex items-center justify-center px-4 sm:px-16 relative min-h-0 touch-pan-y"
      on:touchstart={handleTouchStart}
      on:touchmove={handleTouchMove}
      on:touchend={handleTouchEnd}
    >
      <!-- Previous -->
      {#if images.length > 1}
        <button
          type="button"
          on:click={prev}
          class="absolute left-2 sm:left-4 p-2 sm:p-3 rounded-full bg-white/5 hover:bg-white/15 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors z-10"
          aria-label="Previous photo"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      {/if}

      <!-- Image -->
      {#key currentIndex}
        <div
          class="max-w-full max-h-full flex items-center justify-center"
          transition:fade={{ duration: 150 }}
        >
          <img
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            class="max-w-full max-h-[80vh] object-contain rounded-lg select-none"
            draggable="false"
          />
        </div>
      {/key}

      <!-- Next -->
      {#if images.length > 1}
        <button
          type="button"
          on:click={next}
          class="absolute right-2 sm:right-4 p-2 sm:p-3 rounded-full bg-white/5 hover:bg-white/15 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors z-10"
          aria-label="Next photo"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      {/if}
    </div>

    <!-- Caption -->
    <div class="p-4 sm:p-6 text-center">
      <p class="text-xs text-white/40 uppercase tracking-widest">
        Swipe to navigate · Use arrow keys · Esc to close
      </p>
    </div>
  </div>
{/if}
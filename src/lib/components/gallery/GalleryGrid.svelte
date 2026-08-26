<script lang="ts">
  import type { GalleryImage } from '../../gallery/types';

  export let images: GalleryImage[] = [];
  export let onImageClick: (index: number) => void = () => {};
</script>

<div class="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [&>*]:mb-4">
  {#each images as image, i (image.src)}
    <button
      on:click={() => onImageClick(i)}
      class="block w-full break-inside-avoid overflow-hidden rounded-lg group focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label={`Open photo ${i + 1} of ${images.length}`}
    >
      <div class="relative overflow-hidden rounded-lg">
        <img
          src={image.src}
          alt={image.alt}
          class="w-full h-auto object-cover transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
          loading="lazy"
          decoding="async"
        />
        <div class="absolute inset-0 bg-navy-950/0 group-hover:bg-navy-950/20 transition-colors duration-300 flex items-center justify-center">
          <svg class="opacity-0 group-hover:opacity-100 transition-opacity duration-300" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00AEEF" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </div>
      </div>
    </button>
  {/each}
</div>

<script lang="ts">
  import type { GalleryAlbum } from '../../gallery/types';
  import { router } from '../../router';

  export let album: GalleryAlbum;

  function openAlbum() {
    router.navigate(`/gallery/${album.slug}`);
  }
</script>

<button
  on:click={openAlbum}
  class="group block w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-xl overflow-hidden"
  aria-label={`Open gallery: ${album.title}, ${album.count} photos`}
>
  <div class="relative aspect-[4/3] overflow-hidden rounded-xl">
    <img
      src={album.cover}
      alt={album.title}
      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      loading="lazy"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/30 to-transparent"></div>

    <!-- Hover overlay -->
    <div class="absolute inset-0 bg-navy-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
      <span class="btn-primary !px-5 !py-2.5 !text-xs">View Album</span>
    </div>

    <!-- Info -->
    <div class="absolute bottom-0 left-0 right-0 p-4">
      <p class="heading-display text-lg sm:text-xl text-white leading-tight">{album.title}</p>
      <p class="text-xs uppercase tracking-widest text-blue-400 mt-1">{album.count} Photos</p>
    </div>
  </div>
</button>

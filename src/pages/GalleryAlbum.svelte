<script lang="ts">
  import SEO from '../lib/components/seo/SEO.svelte';
  import GalleryGrid from '../lib/components/gallery/GalleryGrid.svelte';
  import GalleryLightbox from '../lib/components/gallery/GalleryLightbox.svelte';
  import Badge from '../lib/components/ui/Badge.svelte';
  import Button from '../lib/components/ui/Button.svelte';
  import { reveal } from '../lib/actions/reveal';
  import { getAlbum } from '../lib/gallery';
  import { router } from '../lib/router';

  export let slug: string;

  const album = getAlbum(slug);

  let lightboxOpen = false;
  let lightboxIndex = 0;

  function openLightbox(index: number) {
    lightboxIndex = index;
    lightboxOpen = true;
  }
</script>

{#if album}
  <SEO title={`${album.title} | Gallery | K.O.T FC`} description={`Photos from ${album.title} — Kings Of Tomorrow FC gallery.`} image={album.cover} />

  <!-- Album header -->
  <section class="pt-24 pb-8 lg:pt-32 lg:pb-12">
    <div class="container-x">
      <div use:reveal>
        <button on:click={() => router.navigate('/gallery')} class="text-xs text-blue-400 hover:text-blue-300 uppercase tracking-widest mb-4 inline-flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Gallery
        </button>
        <Badge variant="gold">Gallery</Badge>
        <h1 class="heading-display text-3xl sm:text-4xl lg:text-6xl text-white mt-4">{album.title}</h1>
        <p class="mt-3 text-sm text-white/50 uppercase tracking-widest">{album.count} Photos</p>
      </div>
    </div>
  </section>

  <!-- Photo grid -->
  <section class="pb-16 lg:pb-24">
    <div class="container-x">
      <div use:reveal>
        <GalleryGrid images={album.images} onImageClick={openLightbox} />
      </div>
    </div>
  </section>

  <!-- Lightbox -->
  <GalleryLightbox images={album.images} bind:isOpen={lightboxOpen} bind:startIndex={lightboxIndex} />
{:else}
  <SEO title="Gallery Not Found | K.O.T FC" description="The requested gallery album could not be found." />
  <section class="min-h-[60vh] flex items-center justify-center pt-24">
    <div class="container-x text-center">
      <div use:reveal>
        <p class="heading-display text-6xl text-white/20 mb-4">404</p>
        <h1 class="heading-display text-2xl text-white mb-2">Album Not Found</h1>
        <p class="text-white/50 mb-8">This gallery album doesn't exist or has been removed.</p>
        <Button variant="primary" href="/gallery">Back to Gallery</Button>
      </div>
    </div>
  </section>
{/if}

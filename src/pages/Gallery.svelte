<script lang="ts">
  import SEO from '../lib/components/seo/SEO.svelte';
  import GalleryAlbumCard from '../lib/components/gallery/GalleryAlbumCard.svelte';
  import Badge from '../lib/components/ui/Badge.svelte';
  import { reveal } from '../lib/actions/reveal';
  import { galleryAlbums } from '../lib/gallery';

  const galleryHeroImage = 'https://images.pexels.com/photos/35898730/pexels-photo-35898730.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop';
</script>

<SEO title="Gallery | K.O.T FC" description="Match photos, training shots, and club moments from Kings Of Tomorrow FC." />

<!-- Page hero -->
<section class="relative pt-24 pb-12 lg:pt-32 lg:pb-16 overflow-hidden">
  <div class="absolute inset-0 z-0">
    <img src={galleryHeroImage} alt="K.O.T FC gallery" class="w-full h-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-b from-navy-950/90 via-navy-900/85 to-navy-950"></div>
  </div>
  <div class="container-x relative z-10">
    <div use:reveal>
      <Badge variant="gold">Latest Gallery</Badge>
      <h1 class="heading-display text-4xl sm:text-5xl lg:text-7xl text-white mt-4">Gallery</h1>
      <p class="mt-4 text-lg text-white/60 max-w-2xl">Match photos, training sessions, and club moments — captured from the K.O.T FC season.</p>
    </div>
  </div>
</section>

<!-- Albums -->
<section class="section-pad">
  <div class="container-x">
    {#if galleryAlbums.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {#each galleryAlbums as album (album.slug)}
          <div use:reveal>
            <GalleryAlbumCard {album} />
          </div>
        {/each}
      </div>
    {:else}
      <div class="card-surface p-12 text-center">
        <p class="heading-display text-lg text-white/70 mb-2">No Gallery Photos Yet</p>
        <p class="text-sm text-white/40">Match photos and club moments will appear here soon.</p>
      </div>
    {/if}
  </div>
</section>

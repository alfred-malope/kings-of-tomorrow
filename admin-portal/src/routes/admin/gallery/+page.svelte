<script lang="ts">
  import { browser } from '$app/environment';
  import { db } from '$lib/firebase/client';
  import { getAlbums } from '$lib/repositories/gallery.repository';
  import type { GalleryAlbum } from '$lib/types/firestore.types';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';

  /**
   * Gallery albums list page (Requirement 10.1).
   *
   * Renders albums as a card grid, each card showing the cover image (or a
   * placeholder when none is set), the album name, category, and photo count.
   * Cards link through to the album detail page. Loading, empty, and error
   * states use the shared UI components (Req 17.x). The "Create Album" action
   * is hidden for the `viewer` role (Req 3.3).
   */

  const canWrite = $derived(authStore.role === 'admin' || authStore.role === 'editor');

  let albums = $state<GalleryAlbum[]>([]);
  let loading = $state(true);
  let errored = $state(false);

  async function reload(): Promise<void> {
    loading = true;
    errored = false;
    try {
      albums = await getAlbums(db);
    } catch {
      errored = true;
      albums = [];
    } finally {
      loading = false;
    }
  }

  let started = false;
  $effect(() => {
    if (browser && !started) {
      started = true;
      void reload();
    }
  });
</script>

<svelte:head>
  <title>Gallery — K.O.T FC Admin</title>
</svelte:head>

<div class="container-x py-8">
  <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="text-eyebrow">Media</p>
      <h1 class="heading-display mt-1 text-3xl sm:text-4xl">Gallery</h1>
    </div>
    {#if canWrite}
      <a href="/admin/gallery/new" class="btn-primary">Create Album</a>
    {/if}
  </header>

  {#if loading}
    <SkeletonLoader variant="card" count={8} />
  {:else if errored}
    <ErrorState message="We couldn't load the gallery albums." onRetry={reload} />
  {:else if albums.length === 0}
    <EmptyState
      message="No albums yet."
      ctaLabel={canWrite ? 'Create your first album' : undefined}
      ctaHref={canWrite ? '/admin/gallery/new' : undefined}
    />
  {:else}
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each albums as album (album.id)}
        <a
          href={`/admin/gallery/${album.id}`}
          class="card-surface group overflow-hidden transition-all duration-200 hover:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900"
        >
          <div class="aspect-[4/3] w-full overflow-hidden bg-navy-700/60">
            {#if album.coverImageUrl}
              <img
                src={album.coverImageUrl}
                alt={album.name}
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            {:else}
              <div class="flex h-full w-full items-center justify-center text-white/40" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-12 w-12">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </div>
            {/if}
          </div>
          <div class="p-4">
            <div class="flex items-start justify-between gap-3">
              <h2 class="heading-display text-lg leading-tight text-white group-hover:text-blue-400">
                {album.name}
              </h2>
              <span class="shrink-0 rounded-full bg-navy-700/60 px-2.5 py-1 text-xs font-semibold text-white/60">
                {album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'}
              </span>
            </div>
            {#if album.category}
              <p class="mt-1 text-sm text-white/60">{album.category}</p>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

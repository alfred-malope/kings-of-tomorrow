<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { db } from '$lib/firebase/client';
  import {
    getAlbum,
    getAlbumPhotos,
    createPhoto,
    updatePhoto,
    deletePhoto,
    updateAlbum,
    MAX_PHOTO_PAGE_SIZE
  } from '$lib/repositories/gallery.repository';
  import type { GalleryAlbum, GalleryPhoto, Visibility } from '$lib/types/firestore.types';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import { uploadImage, deleteImage } from '$lib/firebase/storage';
  import { validateUpload } from '$lib/utils/validation';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
  import Pagination from '$lib/components/ui/Pagination.svelte';
  import type { QueryDocumentSnapshot } from 'firebase/firestore';

  /**
   * Album detail page (Requirements 10.3–10.11).
   *
   * Loads the album (getAlbum) and a page of its photos (getAlbumPhotos). Photos
   * can be uploaded via a drag-and-drop zone and an always-visible multi-file
   * `<input>` fallback (Req 10.4). Each file is client-validated (Req 10.10),
   * uploaded to `gallery/{albumId}/photos/{uuid}` with a per-file progress bar
   * (Req 10.5), then a photo document is written via the repository. The photo
   * grid supports editable captions (Req 10.6), "Set as Cover" (Req 10.7), and
   * "Delete Photo" behind a confirmation dialog (Req 10.8). A publish/unpublish
   * toggle flips the album's `visibility` (Req 10.9). Photos paginate at
   * MAX_PHOTO_PAGE_SIZE (Req 10.11). All write controls are hidden for the
   * `viewer` role (Req 3.3).
   */

  const albumId = $derived($page.params.albumId ?? '');
  const canWrite = $derived(authStore.role === 'admin' || authStore.role === 'editor');

  // ── Album + photo state ──
  let album = $state<GalleryAlbum | null>(null);
  let photos = $state<GalleryPhoto[]>([]);
  let loading = $state(true);
  let errored = $state(false);

  // Cursor-based pagination bookkeeping. `pageCursors[i]` is the cursor to start
  // page `i` (page 0 starts with `undefined`).
  let pageCursors = $state<(QueryDocumentSnapshot | undefined)[]>([undefined]);
  let currentPage = $state(0);
  let lastDoc = $state<QueryDocumentSnapshot | null>(null);

  const hasPrev = $derived(currentPage > 0);
  const hasNext = $derived(lastDoc !== null && photos.length === MAX_PHOTO_PAGE_SIZE);

  async function loadPhotos(cursor: QueryDocumentSnapshot | undefined): Promise<void> {
    const result = await getAlbumPhotos(db, albumId, MAX_PHOTO_PAGE_SIZE, cursor);
    photos = result.photos;
    lastDoc = result.lastDoc;
  }

  async function reload(): Promise<void> {
    loading = true;
    errored = false;
    try {
      album = await getAlbum(db, albumId);
      pageCursors = [undefined];
      currentPage = 0;
      await loadPhotos(undefined);
    } catch {
      errored = true;
      album = null;
      photos = [];
    } finally {
      loading = false;
    }
  }

  async function nextPage(): Promise<void> {
    if (!hasNext || lastDoc === null) return;
    const cursor = lastDoc;
    currentPage += 1;
    if (pageCursors.length <= currentPage) {
      pageCursors = [...pageCursors, cursor];
    } else {
      pageCursors[currentPage] = cursor;
    }
    try {
      await loadPhotos(cursor);
    } catch {
      toastStore.error('Failed to load photos.');
    }
  }

  async function prevPage(): Promise<void> {
    if (!hasPrev) return;
    currentPage -= 1;
    try {
      await loadPhotos(pageCursors[currentPage]);
    } catch {
      toastStore.error('Failed to load photos.');
    }
  }

  let started = false;
  $effect(() => {
    if (browser && !started && albumId) {
      started = true;
      void reload();
    }
  });

  // ── Multi-file upload (Req 10.4, 10.5, 10.10) ──
  type UploadItem = {
    id: string;
    fileName: string;
    progress: number;
    error: string | null;
  };
  let uploads = $state<UploadItem[]>([]);
  let dragOver = $state(false);
  let fileInputEl: HTMLInputElement | null = $state(null);

  async function uploadOne(file: File): Promise<void> {
    const localId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Client-side validation before any upload (Req 10.10).
    const validation = validateUpload(file);
    if (!validation.valid) {
      uploads = [
        ...uploads,
        { id: localId, fileName: file.name, progress: 0, error: validation.reason }
      ];
      return;
    }

    uploads = [...uploads, { id: localId, fileName: file.name, progress: 0, error: null }];

    // The Firestore photo doc id is auto-generated by createPhoto; use a UUID
    // for the Storage path so the object is uniquely addressable.
    const storagePath = `gallery/${albumId}/photos/${localId}`;
    try {
      const downloadUrl = await uploadImage(storagePath, file, (p) => {
        uploads = uploads.map((u) => (u.id === localId ? { ...u, progress: p } : u));
      });
      await createPhoto(db, albumId, {
        fileName: file.name,
        storagePath,
        downloadUrl,
        caption: '',
        uploadedBy: authStore.user?.uid ?? ''
      });
    } catch {
      uploads = uploads.map((u) =>
        u.id === localId ? { ...u, error: 'Upload failed.' } : u
      );
    }
  }

  async function handleFiles(fileList: FileList | null): Promise<void> {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    // Upload sequentially so progress bars stay readable and we avoid hammering
    // Storage; each writes its photo doc on completion.
    for (const file of files) {
      await uploadOne(file);
    }
    // Refresh album (for photoCount) and current page once uploads settle.
    try {
      album = await getAlbum(db, albumId);
      await loadPhotos(pageCursors[currentPage]);
    } catch {
      toastStore.error('Uploaded, but failed to refresh the album.');
    }
    const failed = uploads.filter((u) => u.error).length;
    const succeeded = uploads.length - failed;
    if (succeeded > 0) toastStore.success(`${succeeded} photo${succeeded === 1 ? '' : 's'} uploaded.`);
    if (failed > 0) toastStore.error(`${failed} file${failed === 1 ? '' : 's'} could not be uploaded.`);
    // Clear the transient upload list.
    uploads = [];
  }

  function onInputChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    void handleFiles(input.files);
    input.value = '';
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    dragOver = false;
    void handleFiles(event.dataTransfer?.files ?? null);
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
    dragOver = true;
  }

  function onDragLeave() {
    dragOver = false;
  }

  // ── Caption editing (Req 10.6) ──
  async function saveCaption(photo: GalleryPhoto, caption: string): Promise<void> {
    if (caption === photo.caption) return;
    try {
      await updatePhoto(db, albumId, photo.id, { caption });
      photos = photos.map((p) => (p.id === photo.id ? { ...p, caption } : p));
      toastStore.success('Caption saved.');
    } catch {
      toastStore.error('Failed to save caption.');
    }
  }

  // ── Set as cover (Req 10.7) ──
  async function setAsCover(photo: GalleryPhoto): Promise<void> {
    try {
      await updateAlbum(db, albumId, { coverImageUrl: photo.downloadUrl });
      if (album) album = { ...album, coverImageUrl: photo.downloadUrl };
      toastStore.success('Cover image updated.');
    } catch {
      toastStore.error('Failed to set cover image.');
    }
  }

  // ── Delete photo (Req 10.8) ──
  let photoToDelete = $state<GalleryPhoto | null>(null);

  async function confirmDeletePhoto(): Promise<void> {
    const photo = photoToDelete;
    photoToDelete = null;
    if (!photo) return;
    try {
      await deleteImage(photo.storagePath);
      await deletePhoto(db, albumId, photo.id);
      photos = photos.filter((p) => p.id !== photo.id);
      if (album) album = { ...album, photoCount: Math.max(0, album.photoCount - 1) };
      toastStore.success('Photo deleted.');
    } catch {
      toastStore.error('Failed to delete photo.');
    }
  }

  // ── Publish / unpublish (Req 10.9) ──
  async function toggleVisibility(): Promise<void> {
    if (!album) return;
    const next: Visibility = album.visibility === 'public' ? 'private' : 'public';
    try {
      await updateAlbum(db, albumId, { visibility: next });
      album = { ...album, visibility: next };
      toastStore.success(next === 'public' ? 'Album published.' : 'Album unpublished.');
    } catch {
      toastStore.error('Failed to update album visibility.');
    }
  }

  const fieldClass =
    'w-full rounded-lg border border-white/20 bg-navy-800/60 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900';
</script>

<svelte:head>
  <title>{album ? album.name : 'Album'} — K.O.T FC Admin</title>
</svelte:head>

<div class="container-x py-8">
  {#if loading}
    <div class="mb-8 space-y-2">
      <div class="skeleton h-3 w-24"></div>
      <div class="skeleton h-9 w-64"></div>
    </div>
    <SkeletonLoader variant="card" count={8} />
  {:else if errored}
    <ErrorState message="We couldn't load this album." onRetry={reload} />
  {:else if !album}
    <EmptyState message="This album could not be found." ctaLabel="Back to Gallery" ctaHref="/admin/gallery" />
  {:else}
    <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <a href="/admin/gallery" class="text-eyebrow hover:text-blue-400">← Gallery</a>
        <h1 class="heading-display mt-1 text-3xl sm:text-4xl">{album.name}</h1>
        <p class="mt-1 text-sm text-white/60">
          {album.category ? `${album.category} · ` : ''}{album.photoCount}
          {album.photoCount === 1 ? 'photo' : 'photos'} ·
          <span class={album.visibility === 'public' ? 'text-blue-400' : 'text-white/60'}>
            {album.visibility}
          </span>
        </p>
      </div>
      {#if canWrite}
        <button type="button" class="btn-gold" onclick={() => void toggleVisibility()}>
          {album.visibility === 'public' ? 'Unpublish' : 'Publish'}
        </button>
      {/if}
    </header>

    <!-- ── Upload zone (Req 10.4) ── -->
    {#if canWrite}
      <div class="mb-8 space-y-3">
        <div
          role="button"
          tabindex="0"
          class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors {dragOver
            ? 'border-blue-400 bg-blue-500/10'
            : 'border-white/20 bg-navy-800/40'}"
          ondrop={onDrop}
          ondragover={onDragOver}
          ondragleave={onDragLeave}
          onclick={() => fileInputEl?.click()}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputEl?.click();
            }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-3 h-10 w-10 text-blue-400" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          <p class="text-sm text-white/70">Drag &amp; drop images here, or use the file picker below.</p>
          <p class="mt-1 text-xs text-white/50">JPEG, PNG, or WebP · up to 10MB each</p>
        </div>

        <!-- Always-visible file input fallback (Req 10.4) -->
        <input
          bind:this={fileInputEl}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onchange={onInputChange}
          class="block w-full cursor-pointer rounded-lg border border-white/20 bg-navy-800/60 text-sm text-white/80 file:mr-4 file:cursor-pointer file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-bold file:uppercase file:tracking-wider file:text-navy-950 hover:file:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900"
        />

        <!-- Per-file progress (Req 10.5) -->
        {#if uploads.length > 0}
          <ul class="space-y-2">
            {#each uploads as item (item.id)}
              <li class="rounded-lg border border-white/10 bg-navy-800/40 p-3">
                <div class="flex items-center justify-between gap-3">
                  <span class="truncate text-sm text-white/80">{item.fileName}</span>
                  {#if item.error}
                    <span class="text-xs text-red-400">{item.error}</span>
                  {:else}
                    <span class="text-xs text-white/60">{item.progress}%</span>
                  {/if}
                </div>
                {#if !item.error}
                  <div
                    class="mt-2 h-2 w-full overflow-hidden rounded-full bg-navy-700"
                    role="progressbar"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={item.progress}
                  >
                    <div class="h-full bg-blue-500 transition-all duration-150" style="width: {item.progress}%"></div>
                  </div>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}

    <!-- ── Photo grid (Req 10.3) ── -->
    {#if photos.length === 0}
      <EmptyState message="No photos in this album yet." />
    {:else}
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {#each photos as photo (photo.id)}
          <div class="card-surface overflow-hidden">
            <div class="aspect-square w-full overflow-hidden bg-navy-700/60">
              <img src={photo.downloadUrl} alt={photo.caption || photo.fileName} class="h-full w-full object-cover" />
            </div>
            <div class="space-y-3 p-4">
              {#if canWrite}
                <div>
                  <label for={`caption-${photo.id}`} class="text-eyebrow mb-1.5 block">Caption</label>
                  <input
                    id={`caption-${photo.id}`}
                    type="text"
                    class={fieldClass}
                    value={photo.caption}
                    placeholder="Add a caption…"
                    onblur={(e) => void saveCaption(photo, (e.currentTarget as HTMLInputElement).value.trim())}
                  />
                </div>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="btn-outline flex-1 !px-3 !py-2 text-xs"
                    onclick={() => void setAsCover(photo)}
                  >
                    Set as Cover
                  </button>
                  <button
                    type="button"
                    class="inline-flex flex-1 items-center justify-center rounded-lg border border-red-500/40 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-400 transition-colors hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-navy-900"
                    onclick={() => (photoToDelete = photo)}
                  >
                    Delete
                  </button>
                </div>
              {:else if photo.caption}
                <p class="text-sm text-white/70">{photo.caption}</p>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <div class="mt-6">
        <Pagination
          {hasNext}
          {hasPrev}
          onNext={() => void nextPage()}
          onPrev={() => void prevPage()}
          label={`Page ${currentPage + 1}`}
        />
      </div>
    {/if}
  {/if}
</div>

{#if photoToDelete}
  <ConfirmDialog
    title="Delete photo?"
    description="This permanently removes the photo from the album and storage. This action cannot be undone."
    confirmLabel="Delete"
    onConfirm={() => void confirmDeletePhoto()}
    onCancel={() => (photoToDelete = null)}
  />
{/if}

<script lang="ts">
  import { goto } from '$app/navigation';
  import { db } from '$lib/firebase/client';
  import { createAlbum } from '$lib/repositories/gallery.repository';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import GalleryAlbumForm, {
    type GalleryAlbumFormValues
  } from '$lib/components/forms/GalleryAlbumForm.svelte';

  /**
   * Create-album page (Requirement 10.2).
   *
   * Renders <GalleryAlbumForm> and, on submit, creates the album document. The
   * cover image is set later from the album detail page (from an uploaded
   * photo), so no deferred upload happens here. On success we redirect to the
   * new album's detail page with a success toast; failures surface an error
   * toast (Req 17.5, 17.6).
   */

  let submitting = $state(false);

  async function handleSubmit(values: GalleryAlbumFormValues): Promise<void> {
    if (submitting) return;
    submitting = true;
    try {
      const id = await createAlbum(db, {
        name: values.name,
        slug: values.slug,
        description: values.description,
        category: values.category,
        visibility: values.visibility,
        coverImageUrl: values.coverImageUrl ?? null
      });

      toastStore.success('Album created.');
      await goto(`/admin/gallery/${id}`);
    } catch {
      toastStore.error('Failed to create album. Please try again.');
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Create Album — K.O.T FC Admin</title>
</svelte:head>

<div class="container-narrow py-8">
  <header class="mb-8">
    <p class="text-eyebrow">Media</p>
    <h1 class="heading-display mt-1 text-3xl sm:text-4xl">Create Album</h1>
  </header>

  <GalleryAlbumForm {submitting} onSubmit={handleSubmit} submitLabel="Create Album" />
</div>

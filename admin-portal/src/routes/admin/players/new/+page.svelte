<script lang="ts">
  import { goto } from '$app/navigation';
  import { db } from '$lib/firebase/client';
  import { createPlayer, updatePlayer } from '$lib/repositories/players.repository';
  import { uploadImage } from '$lib/firebase/storage';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import PlayerForm, { type PlayerFormValues } from '$lib/components/forms/PlayerForm.svelte';

  /**
   * Create-player page (Requirements 6.4, 6.5, 6.6).
   *
   * Renders <PlayerForm> and, on submit, creates the player document first.
   * Because a brand-new player has no id, the photo upload is deferred: the
   * form captures the raw File via `onPhotoSelect`; after the document is
   * created we upload it to `players/{id}/photo` and persist the resulting URL
   * via `updatePlayer({ photoUrl })` (Req 6.6). On success we redirect to the
   * list with a success toast; failures surface an error toast (Req 17.5, 17.6).
   */

  let submitting = $state(false);
  // Photo selected before the player exists — uploaded after create.
  let pendingPhoto = $state<File | null>(null);

  async function handleSubmit(values: PlayerFormValues): Promise<void> {
    if (submitting) return;
    submitting = true;
    try {
      const id = await createPlayer(db, {
        firstName: values.firstName,
        lastName: values.lastName,
        displayName: values.displayName,
        squadNumber: values.squadNumber,
        position: values.position,
        status: values.status,
        bio: values.bio,
        joinedDate: values.joinedDate,
        photoUrl: values.photoUrl ?? null
      });

      // If a photo was chosen, upload it now that we have the player id (Req 6.6).
      if (pendingPhoto) {
        const url = await uploadImage(`players/${id}/photo`, pendingPhoto);
        await updatePlayer(db, id, { photoUrl: url });
      }

      toastStore.success('Player created.');
      await goto('/admin/players');
    } catch {
      toastStore.error('Failed to create player. Please try again.');
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Add Player — K.O.T FC Admin</title>
</svelte:head>

<div class="container-narrow py-8">
  <header class="mb-8">
    <p class="text-eyebrow">Squad</p>
    <h1 class="heading-display mt-1 text-3xl sm:text-4xl">Add Player</h1>
  </header>

  <PlayerForm
    {submitting}
    onSubmit={handleSubmit}
    onPhotoSelect={(file) => (pendingPhoto = file)}
    submitLabel="Create Player"
  />
</div>

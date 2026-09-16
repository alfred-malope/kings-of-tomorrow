<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { db } from '$lib/firebase/client';
  import { getPlayer, updatePlayer, deletePlayer } from '$lib/repositories/players.repository';
  import { deleteImage } from '$lib/firebase/storage';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import type { Player } from '$lib/types/firestore.types';
  import PlayerForm, { type PlayerFormValues } from '$lib/components/forms/PlayerForm.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

  /**
   * Edit-player page (Requirements 6.4, 6.7, 6.8, 6.9).
   *
   * Loads the player with `getPlayer($page.params.id)` and pre-populates
   * <PlayerForm>. On submit it persists changes via `updatePlayer` (Req 6.7).
   * A Delete button opens a <ConfirmDialog> (Req 6.8); on confirm it deletes
   * the document then attempts to delete the associated Storage photo — if the
   * Storage delete fails after the document is gone, an error toast is shown
   * but the document is NOT restored (Req 6.9). Write controls (edit form +
   * delete) are hidden for the `viewer` role (Req 3.3).
   */

  const playerId = $derived($page.params.id ?? '');
  const canWrite = $derived(authStore.role === 'admin' || authStore.role === 'editor');

  let player = $state<Player | null>(null);
  let loading = $state(true);
  let errored = $state(false);
  let notFound = $state(false);

  let submitting = $state(false);
  let deleting = $state(false);
  let showConfirm = $state(false);

  async function load(): Promise<void> {
    loading = true;
    errored = false;
    notFound = false;
    try {
      const result = await getPlayer(db, playerId);
      if (!result) {
        notFound = true;
        player = null;
      } else {
        player = result;
      }
    } catch {
      errored = true;
      player = null;
    } finally {
      loading = false;
    }
  }

  let started = false;
  $effect(() => {
    if (browser && !started && playerId) {
      started = true;
      void load();
    }
  });

  async function handleSubmit(values: PlayerFormValues): Promise<void> {
    if (submitting) return;
    submitting = true;
    try {
      await updatePlayer(db, playerId, {
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
      toastStore.success('Player updated.');
      await goto('/admin/players');
    } catch {
      toastStore.error('Failed to update player. Please try again.');
    } finally {
      submitting = false;
    }
  }

  /** When a photo finishes uploading in edit mode, persist the URL immediately. */
  async function handlePhotoUpload(url: string): Promise<void> {
    try {
      await updatePlayer(db, playerId, { photoUrl: url });
      if (player) player = { ...player, photoUrl: url };
      toastStore.success('Photo saved.');
    } catch {
      toastStore.error('Failed to save photo. Please try again.');
    }
  }

  async function confirmDelete(): Promise<void> {
    showConfirm = false;
    if (deleting) return;
    deleting = true;
    const hadPhoto = Boolean(player?.photoUrl);
    try {
      // Delete the document first (Req 6.9).
      await deletePlayer(db, playerId);
      // Then attempt to delete the Storage photo. A failure here must NOT
      // restore the document — we only surface an error toast (Req 6.9).
      if (hadPhoto) {
        try {
          await deleteImage(`players/${playerId}/photo`);
        } catch {
          toastStore.error('Player deleted, but its photo could not be removed from storage.');
          await goto('/admin/players');
          return;
        }
      }
      toastStore.success('Player deleted.');
      await goto('/admin/players');
    } catch {
      toastStore.error('Failed to delete player. Please try again.');
    } finally {
      deleting = false;
    }
  }
</script>

<svelte:head>
  <title>Edit Player — K.O.T FC Admin</title>
</svelte:head>

<div class="container-narrow py-8">
  <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="text-eyebrow">Squad</p>
      <h1 class="heading-display mt-1 text-3xl sm:text-4xl">
        {player ? player.displayName : 'Edit Player'}
      </h1>
    </div>
    {#if canWrite && player}
      <button type="button" class="btn-outline" onclick={() => (showConfirm = true)} disabled={deleting}>
        {deleting ? 'Deleting…' : 'Delete Player'}
      </button>
    {/if}
  </header>

  {#if loading}
    <SkeletonLoader variant="row" count={4} />
  {:else if errored}
    <ErrorState message="We couldn't load this player." onRetry={load} />
  {:else if notFound}
    <EmptyState message="This player could not be found." ctaLabel="Back to players" ctaHref="/admin/players" />
  {:else if player && canWrite}
    <PlayerForm
      id={playerId}
      initial={player}
      {submitting}
      onSubmit={handleSubmit}
      onPhotoUpload={(url) => void handlePhotoUpload(url)}
      submitLabel="Save Changes"
    />
  {:else if player}
    <EmptyState message="You don't have permission to edit this player." ctaLabel="Back to players" ctaHref="/admin/players" />
  {/if}
</div>

{#if showConfirm}
  <ConfirmDialog
    title="Delete player?"
    description="This permanently removes the player and their photo. This action cannot be undone."
    confirmLabel="Delete"
    onConfirm={() => void confirmDelete()}
    onCancel={() => (showConfirm = false)}
  />
{/if}

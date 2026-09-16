<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { db } from '$lib/firebase/client';
  import {
    getTournament,
    updateTournament,
    deleteTournament
  } from '$lib/repositories/tournaments.repository';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import type { Tournament } from '$lib/types/firestore.types';
  import TournamentForm, {
    type TournamentFormValues
  } from '$lib/components/forms/TournamentForm.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

  /**
   * Edit-tournament page (Requirements 11.4, 11.5).
   *
   * Loads the tournament with `getTournament($page.params.id)` and
   * pre-populates <TournamentForm>. On submit it persists changes via
   * `updateTournament` (Req 11.4). A Delete button opens a <ConfirmDialog>
   * (Req 11.5); on confirm it deletes the document and redirects. Write
   * controls (edit form + delete) are hidden for the `viewer` role (Req 3.3).
   */

  const tournamentId = $derived($page.params.id ?? '');
  const canWrite = $derived(authStore.role === 'admin' || authStore.role === 'editor');

  let tournament = $state<Tournament | null>(null);
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
      const result = await getTournament(db, tournamentId);
      if (!result) {
        notFound = true;
        tournament = null;
      } else {
        tournament = result;
      }
    } catch {
      errored = true;
      tournament = null;
    } finally {
      loading = false;
    }
  }

  let started = false;
  $effect(() => {
    if (browser && !started && tournamentId) {
      started = true;
      void load();
    }
  });

  async function handleSubmit(values: TournamentFormValues): Promise<void> {
    if (submitting) return;
    submitting = true;
    try {
      await updateTournament(db, tournamentId, {
        name: values.name,
        description: values.description,
        startDate: values.startDate,
        endDate: values.endDate,
        venue: values.venue,
        status: values.status,
        visibility: values.visibility
      });
      toastStore.success('Tournament updated.');
      await goto('/admin/tournaments');
    } catch {
      toastStore.error('Failed to update tournament. Please try again.');
    } finally {
      submitting = false;
    }
  }

  async function confirmDelete(): Promise<void> {
    showConfirm = false;
    if (deleting) return;
    deleting = true;
    try {
      await deleteTournament(db, tournamentId);
      toastStore.success('Tournament deleted.');
      await goto('/admin/tournaments');
    } catch {
      toastStore.error('Failed to delete tournament. Please try again.');
    } finally {
      deleting = false;
    }
  }
</script>

<svelte:head>
  <title>Edit Tournament — K.O.T FC Admin</title>
</svelte:head>

<div class="container-narrow py-8">
  <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="text-eyebrow">Competitions</p>
      <h1 class="heading-display mt-1 text-3xl sm:text-4xl">
        {tournament ? tournament.name : 'Edit Tournament'}
      </h1>
    </div>
    {#if canWrite && tournament}
      <button
        type="button"
        class="btn-outline"
        onclick={() => (showConfirm = true)}
        disabled={deleting}
      >
        {deleting ? 'Deleting…' : 'Delete Tournament'}
      </button>
    {/if}
  </header>

  {#if loading}
    <SkeletonLoader variant="row" count={4} />
  {:else if errored}
    <ErrorState message="We couldn't load this tournament." onRetry={load} />
  {:else if notFound}
    <EmptyState
      message="This tournament could not be found."
      ctaLabel="Back to tournaments"
      ctaHref="/admin/tournaments"
    />
  {:else if tournament && canWrite}
    <TournamentForm
      initial={tournament}
      {submitting}
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
    />
  {:else if tournament}
    <EmptyState message="You don't have permission to edit tournaments." />
  {/if}
</div>

{#if showConfirm}
  <ConfirmDialog
    title="Delete tournament?"
    description="This permanently removes the tournament. This action cannot be undone."
    confirmLabel="Delete"
    onConfirm={() => void confirmDelete()}
    onCancel={() => (showConfirm = false)}
  />
{/if}

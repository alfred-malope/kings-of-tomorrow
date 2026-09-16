<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { db } from '$lib/firebase/client';
  import { getResult, updateResult, deleteResult } from '$lib/repositories/results.repository';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import type { Result } from '$lib/types/firestore.types';
  import ResultForm, { type ResultFormValues } from '$lib/components/forms/ResultForm.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

  /**
   * Edit-result page (Requirements 8.5, 8.6).
   *
   * Loads the result with `getResult($page.params.id)` and pre-populates
   * <ResultForm>. On submit it persists changes via `updateResult` (Req 8.5).
   * A Delete button opens a <ConfirmDialog> (Req 8.6); on confirm it deletes
   * the document via `deleteResult`. Write controls (edit form + delete) are
   * hidden for the `viewer` role (Req 3.3).
   */

  const resultId = $derived($page.params.id ?? '');
  const canWrite = $derived(authStore.role === 'admin' || authStore.role === 'editor');

  let result = $state<Result | null>(null);
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
      const found = await getResult(db, resultId);
      if (!found) {
        notFound = true;
        result = null;
      } else {
        result = found;
      }
    } catch {
      errored = true;
      result = null;
    } finally {
      loading = false;
    }
  }

  let started = false;
  $effect(() => {
    if (browser && !started && resultId) {
      started = true;
      void load();
    }
  });

  async function handleSubmit(values: ResultFormValues): Promise<void> {
    if (submitting) return;
    submitting = true;
    try {
      await updateResult(db, resultId, {
        fixtureId: values.fixtureId,
        homeTeam: values.homeTeam,
        awayTeam: values.awayTeam,
        homeScore: values.homeScore,
        awayScore: values.awayScore,
        homePenaltyScore: values.homePenaltyScore,
        awayPenaltyScore: values.awayPenaltyScore,
        visibility: values.visibility,
        matchReport: values.matchReport
      });
      toastStore.success('Result updated.');
      await goto('/admin/results');
    } catch {
      toastStore.error('Failed to update result. Please try again.');
    } finally {
      submitting = false;
    }
  }

  async function confirmDelete(): Promise<void> {
    showConfirm = false;
    if (deleting) return;
    deleting = true;
    try {
      await deleteResult(db, resultId);
      toastStore.success('Result deleted.');
      await goto('/admin/results');
    } catch {
      toastStore.error('Failed to delete result. Please try again.');
    } finally {
      deleting = false;
    }
  }
</script>

<svelte:head>
  <title>Edit Result — K.O.T FC Admin</title>
</svelte:head>

<div class="container-narrow py-8">
  <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="text-eyebrow">Matches</p>
      <h1 class="heading-display mt-1 text-3xl sm:text-4xl">
        {result ? `${result.homeTeam} vs ${result.awayTeam}` : 'Edit Result'}
      </h1>
    </div>
    {#if canWrite && result}
      <button type="button" class="btn-outline" onclick={() => (showConfirm = true)} disabled={deleting}>
        {deleting ? 'Deleting…' : 'Delete Result'}
      </button>
    {/if}
  </header>

  {#if loading}
    <SkeletonLoader variant="row" count={4} />
  {:else if errored}
    <ErrorState message="We couldn't load this result." onRetry={load} />
  {:else if notFound}
    <EmptyState message="This result could not be found." ctaLabel="Back to results" ctaHref="/admin/results" />
  {:else if result && canWrite}
    <ResultForm
      initial={result}
      {submitting}
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
    />
  {:else if result}
    <EmptyState message="You don't have permission to edit this result." ctaLabel="Back to results" ctaHref="/admin/results" />
  {/if}
</div>

{#if showConfirm}
  <ConfirmDialog
    title="Delete result?"
    description="This permanently removes the recorded result. This action cannot be undone."
    confirmLabel="Delete"
    onConfirm={() => void confirmDelete()}
    onCancel={() => (showConfirm = false)}
  />
{/if}

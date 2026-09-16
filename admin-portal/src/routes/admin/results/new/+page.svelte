<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { db } from '$lib/firebase/client';
  import { createResult } from '$lib/repositories/results.repository';
  import { getFixture } from '$lib/repositories/fixtures.repository';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import type { Result } from '$lib/types/firestore.types';
  import ResultForm, { type ResultFormValues } from '$lib/components/forms/ResultForm.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';

  /**
   * Create-result page (Requirements 8.2, 8.4).
   *
   * When navigated to with `?fixtureId=X` (e.g. via a fixture's "Record Result"
   * button), the linked fixture is loaded via `getFixture` and its home/away
   * team names pre-populate the form (Req 8.2). On submit the result is written
   * via `createResult`, which also flips the linked fixture's status to
   * `completed` (Req 8.4). On success we redirect to the list with a success
   * toast; failures surface an error toast (Req 17.5, 17.6).
   */

  const fixtureId = $derived($page.url.searchParams.get('fixtureId') ?? '');

  let submitting = $state(false);
  // Loading state only applies while pre-populating from a linked fixture.
  let loading = $state(false);
  let initial = $state<Partial<Result> | null>(null);

  async function prefillFromFixture(id: string): Promise<void> {
    loading = true;
    try {
      const fixture = await getFixture(db, id);
      if (fixture) {
        initial = {
          fixtureId: id,
          homeTeam: fixture.homeTeam,
          awayTeam: fixture.awayTeam,
          visibility: fixture.visibility
        };
      }
    } catch {
      // If the fixture can't be loaded we still let the user record a result;
      // the fixtureId is retained so the link/status update still happens.
      toastStore.error("Couldn't load the linked fixture details.");
    } finally {
      loading = false;
    }
  }

  let started = false;
  $effect(() => {
    if (browser && !started) {
      started = true;
      if (fixtureId) void prefillFromFixture(fixtureId);
    }
  });

  async function handleSubmit(values: ResultFormValues): Promise<void> {
    if (submitting) return;
    submitting = true;
    try {
      // createResult also updates the linked fixture's status to completed (Req 8.4).
      await createResult(db, {
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
      toastStore.success('Result recorded.');
      await goto('/admin/results');
    } catch {
      toastStore.error('Failed to record result. Please try again.');
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Add Result — K.O.T FC Admin</title>
</svelte:head>

<div class="container-narrow py-8">
  <header class="mb-8">
    <p class="text-eyebrow">Matches</p>
    <h1 class="heading-display mt-1 text-3xl sm:text-4xl">Add Result</h1>
  </header>

  {#if loading}
    <SkeletonLoader variant="row" count={4} />
  {:else}
    <ResultForm
      {fixtureId}
      {initial}
      {submitting}
      onSubmit={handleSubmit}
      submitLabel="Record Result"
    />
  {/if}
</div>

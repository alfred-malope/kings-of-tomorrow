<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { db } from '$lib/firebase/client';
  import { getFixture, updateFixture, deleteFixture } from '$lib/repositories/fixtures.repository';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import type { Fixture } from '$lib/types/firestore.types';
  import FixtureForm, { type FixtureFormValues } from '$lib/components/forms/FixtureForm.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

  /**
   * Edit-fixture page (Requirements 7.3, 7.5, 7.6).
   *
   * Loads the fixture with `getFixture($page.params.id)` and pre-populates
   * <FixtureForm>. On submit it persists changes via `updateFixture` (Req 7.5).
   * A Delete button opens a <ConfirmDialog> (Req 7.6); on confirm it deletes the
   * document and redirects to the list. Write controls (edit form + delete) are
   * hidden for the `viewer` role (Req 3.3).
   */

  const fixtureId = $derived($page.params.id ?? '');
  const canWrite = $derived(authStore.role === 'admin' || authStore.role === 'editor');

  let fixture = $state<Fixture | null>(null);
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
      const result = await getFixture(db, fixtureId);
      if (!result) {
        notFound = true;
        fixture = null;
      } else {
        fixture = result;
      }
    } catch {
      errored = true;
      fixture = null;
    } finally {
      loading = false;
    }
  }

  let started = false;
  $effect(() => {
    if (browser && !started && fixtureId) {
      started = true;
      void load();
    }
  });

  async function handleSubmit(values: FixtureFormValues): Promise<void> {
    if (submitting) return;
    submitting = true;
    try {
      await updateFixture(db, fixtureId, {
        competition: values.competition,
        homeTeam: values.homeTeam,
        awayTeam: values.awayTeam,
        date: values.date,
        time: values.time,
        venue: values.venue,
        status: values.status,
        visibility: values.visibility,
        tournamentId: values.tournamentId,
        notes: values.notes
      });
      toastStore.success('Fixture updated.');
      await goto('/admin/fixtures');
    } catch {
      toastStore.error('Failed to update fixture. Please try again.');
    } finally {
      submitting = false;
    }
  }

  async function confirmDelete(): Promise<void> {
    showConfirm = false;
    if (deleting) return;
    deleting = true;
    try {
      await deleteFixture(db, fixtureId);
      toastStore.success('Fixture deleted.');
      await goto('/admin/fixtures');
    } catch {
      toastStore.error('Failed to delete fixture. Please try again.');
    } finally {
      deleting = false;
    }
  }
</script>

<svelte:head>
  <title>Edit Fixture — K.O.T FC Admin</title>
</svelte:head>

<div class="container-narrow py-8">
  <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="text-eyebrow">Schedule</p>
      <h1 class="heading-display mt-1 text-3xl sm:text-4xl">
        {fixture ? `${fixture.homeTeam} vs ${fixture.awayTeam}` : 'Edit Fixture'}
      </h1>
    </div>
    {#if canWrite && fixture}
      <button type="button" class="btn-outline" onclick={() => (showConfirm = true)} disabled={deleting}>
        {deleting ? 'Deleting…' : 'Delete Fixture'}
      </button>
    {/if}
  </header>

  {#if loading}
    <SkeletonLoader variant="row" count={4} />
  {:else if errored}
    <ErrorState message="We couldn't load this fixture." onRetry={load} />
  {:else if notFound}
    <EmptyState message="This fixture could not be found." ctaLabel="Back to fixtures" ctaHref="/admin/fixtures" />
  {:else if fixture && canWrite}
    <FixtureForm initial={fixture} {submitting} onSubmit={handleSubmit} submitLabel="Save Changes" />
  {:else if fixture}
    <EmptyState message="You don't have permission to edit this fixture." ctaLabel="Back to fixtures" ctaHref="/admin/fixtures" />
  {/if}
</div>

{#if showConfirm}
  <ConfirmDialog
    title="Delete fixture?"
    description="This permanently removes the fixture. This action cannot be undone."
    confirmLabel="Delete"
    onConfirm={() => void confirmDelete()}
    onCancel={() => (showConfirm = false)}
  />
{/if}

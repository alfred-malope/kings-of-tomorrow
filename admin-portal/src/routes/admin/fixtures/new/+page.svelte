<script lang="ts">
  import { goto } from '$app/navigation';
  import { db } from '$lib/firebase/client';
  import { createFixture } from '$lib/repositories/fixtures.repository';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import FixtureForm, { type FixtureFormValues } from '$lib/components/forms/FixtureForm.svelte';

  /**
   * Create-fixture page (Requirements 7.3, 7.4).
   *
   * Renders <FixtureForm> and, on submit, writes the fixture document via
   * `createFixture` (which sets createdAt/updatedAt with serverTimestamp).
   * On success we redirect to the list with a success toast; failures surface
   * an error toast (Req 17.5, 17.6).
   */

  let submitting = $state(false);

  async function handleSubmit(values: FixtureFormValues): Promise<void> {
    if (submitting) return;
    submitting = true;
    try {
      await createFixture(db, {
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
      toastStore.success('Fixture created.');
      await goto('/admin/fixtures');
    } catch {
      toastStore.error('Failed to create fixture. Please try again.');
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Add Fixture — K.O.T FC Admin</title>
</svelte:head>

<div class="container-narrow py-8">
  <header class="mb-8">
    <p class="text-eyebrow">Schedule</p>
    <h1 class="heading-display mt-1 text-3xl sm:text-4xl">Add Fixture</h1>
  </header>

  <FixtureForm {submitting} onSubmit={handleSubmit} submitLabel="Create Fixture" />
</div>

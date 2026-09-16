<script lang="ts">
  import { goto } from '$app/navigation';
  import { db } from '$lib/firebase/client';
  import { createTournament } from '$lib/repositories/tournaments.repository';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import TournamentForm, {
    type TournamentFormValues
  } from '$lib/components/forms/TournamentForm.svelte';

  /**
   * Create-tournament page (Requirements 11.2, 11.3).
   *
   * Renders <TournamentForm> and, on submit, creates the tournament document
   * via `createTournament` (the form only calls back when valid). On success we
   * redirect to the list with a success toast; failures surface an error toast.
   */

  let submitting = $state(false);

  async function handleSubmit(values: TournamentFormValues): Promise<void> {
    if (submitting) return;
    submitting = true;
    try {
      await createTournament(db, {
        name: values.name,
        description: values.description,
        startDate: values.startDate,
        endDate: values.endDate,
        venue: values.venue,
        status: values.status,
        visibility: values.visibility
      });
      toastStore.success('Tournament created.');
      await goto('/admin/tournaments');
    } catch {
      toastStore.error('Failed to create tournament. Please try again.');
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Add Tournament — K.O.T FC Admin</title>
</svelte:head>

<div class="container-narrow py-8">
  <header class="mb-8">
    <p class="text-eyebrow">Competitions</p>
    <h1 class="heading-display mt-1 text-3xl sm:text-4xl">Add Tournament</h1>
  </header>

  <TournamentForm {submitting} onSubmit={handleSubmit} submitLabel="Create Tournament" />
</div>

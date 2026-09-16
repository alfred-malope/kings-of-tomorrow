<script lang="ts" module>
  import type { Tournament, TournamentStatus, Visibility } from '$lib/types/firestore.types';

  /** The subset of a tournament captured by this form. */
  export type TournamentFormValues = {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    venue: string;
    status: TournamentStatus;
    visibility: Visibility;
  };

  /**
   * Pure validation for the tournament form (Req 11.2, 11.3, 11.4).
   *
   * Kept as a module-level export so it can be unit/property tested without
   * mounting the component. Required fields: name, startDate, endDate, venue.
   * Cross-field rule: `endDate` must be on or after `startDate`. Returns a map
   * of field -> error message; an empty map means the values are valid.
   */
  export function validateTournament(values: TournamentFormValues): Record<string, string> {
    const errors: Record<string, string> = {};
    if (values.name.trim() === '') errors.name = 'Name is required.';
    if (values.startDate.trim() === '') errors.startDate = 'Start date is required.';
    if (values.endDate.trim() === '') errors.endDate = 'End date is required.';
    if (values.venue.trim() === '') errors.venue = 'Venue is required.';
    // Only compare dates when both are present, so we don't mask the required
    // errors above with a confusing range error.
    if (
      values.startDate.trim() !== '' &&
      values.endDate.trim() !== '' &&
      values.endDate < values.startDate
    ) {
      errors.endDate = 'End date must be on or after the start date.';
    }
    return errors;
  }
</script>

<script lang="ts">
  /**
   * Tournament create/edit form (Requirement 11.2).
   *
   * Presentation + validation only — persistence is delegated to the parent via
   * the `onSubmit` callback prop, which receives the validated form values.
   * Required fields (name, startDate, endDate, venue) plus the cross-field rule
   * `endDate >= startDate` are validated inline via {@link validateTournament}
   * before `onSubmit` is invoked; when any field is invalid `onSubmit` is NOT
   * called (Req 11.3, 11.4).
   */

  interface Props {
    /** Existing tournament to pre-populate the form for editing. */
    initial?: Partial<Tournament> | null;
    /** Whether a submit is currently in flight (disables the submit button). */
    submitting?: boolean;
    /** Called with the validated form values when the form is submitted. */
    onSubmit: (values: TournamentFormValues) => void;
    /** Label for the submit button. */
    submitLabel?: string;
  }

  let { initial = null, submitting = false, onSubmit, submitLabel = 'Save Tournament' }: Props =
    $props();

  const statuses: TournamentStatus[] = ['upcoming', 'ongoing', 'completed', 'cancelled'];
  const visibilities: Visibility[] = ['public', 'private'];

  // ── Form state (Svelte 5 runes) ──
  // Snapshot the initial prop once; the form is uncontrolled thereafter.
  // svelte-ignore state_referenced_locally
  const seed = initial;
  let name = $state(seed?.name ?? '');
  let description = $state(seed?.description ?? '');
  let startDate = $state(seed?.startDate ?? '');
  let endDate = $state(seed?.endDate ?? '');
  let venue = $state(seed?.venue ?? '');
  let status = $state<TournamentStatus>(seed?.status ?? 'upcoming');
  let visibility = $state<Visibility>(seed?.visibility ?? 'public');

  // Per-field validation errors, shown inline (Req 11.4).
  let errors = $state<Record<string, string>>({});

  function currentValues(): TournamentFormValues {
    return {
      name: name.trim(),
      description: description.trim(),
      startDate,
      endDate,
      venue: venue.trim(),
      status,
      visibility
    };
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const values = currentValues();
    const next = validateTournament(values);
    errors = next;
    // Abort when invalid — onSubmit (and the repository) is never called.
    if (Object.keys(next).length > 0) return;
    onSubmit(values);
  }

  const fieldClass =
    'w-full rounded-lg border border-white/20 bg-navy-800/60 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900';
</script>

<form class="space-y-6" onsubmit={handleSubmit} novalidate>
  <!-- Name -->
  <div>
    <label for="name" class="text-eyebrow mb-1.5 block">Name</label>
    <input id="name" type="text" class={fieldClass} bind:value={name} />
    {#if errors.name}
      <p class="mt-1 text-sm text-red-400" role="alert">{errors.name}</p>
    {/if}
  </div>

  <!-- Description -->
  <div>
    <label for="description" class="text-eyebrow mb-1.5 block">Description</label>
    <textarea id="description" rows="4" class={fieldClass} bind:value={description}></textarea>
  </div>

  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
    <!-- Start date -->
    <div>
      <label for="startDate" class="text-eyebrow mb-1.5 block">Start Date</label>
      <input id="startDate" type="date" class={fieldClass} bind:value={startDate} />
      {#if errors.startDate}
        <p class="mt-1 text-sm text-red-400" role="alert">{errors.startDate}</p>
      {/if}
    </div>

    <!-- End date -->
    <div>
      <label for="endDate" class="text-eyebrow mb-1.5 block">End Date</label>
      <input id="endDate" type="date" class={fieldClass} bind:value={endDate} />
      {#if errors.endDate}
        <p class="mt-1 text-sm text-red-400" role="alert">{errors.endDate}</p>
      {/if}
    </div>

    <!-- Venue -->
    <div>
      <label for="venue" class="text-eyebrow mb-1.5 block">Venue</label>
      <input id="venue" type="text" class={fieldClass} bind:value={venue} />
      {#if errors.venue}
        <p class="mt-1 text-sm text-red-400" role="alert">{errors.venue}</p>
      {/if}
    </div>

    <!-- Status -->
    <div>
      <label for="status" class="text-eyebrow mb-1.5 block">Status</label>
      <select id="status" class={fieldClass} bind:value={status}>
        {#each statuses as s}
          <option value={s}>{s}</option>
        {/each}
      </select>
    </div>

    <!-- Visibility -->
    <div>
      <label for="visibility" class="text-eyebrow mb-1.5 block">Visibility</label>
      <select id="visibility" class={fieldClass} bind:value={visibility}>
        {#each visibilities as v}
          <option value={v}>{v}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="flex justify-end gap-3">
    <a href="/admin/tournaments" class="btn-outline">Cancel</a>
    <button type="submit" class="btn-primary" disabled={submitting}>
      {submitting ? 'Saving…' : submitLabel}
    </button>
  </div>
</form>

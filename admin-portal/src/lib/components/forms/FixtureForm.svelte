<script lang="ts">
  import { browser } from '$app/environment';
  import { db } from '$lib/firebase/client';
  import { getTournaments } from '$lib/repositories/tournaments.repository';
  import type { Fixture, FixtureStatus, Visibility, Tournament } from '$lib/types/firestore.types';

  /**
   * Fixture create/edit form (Requirement 7.3).
   *
   * The form is presentation + validation only — persistence is delegated to
   * the parent via the `onSubmit` callback prop, which receives the validated
   * form values (Req 7.4, 7.5). Required fields (competition, homeTeam,
   * awayTeam, venue) are validated inline before `onSubmit` is invoked; if any
   * is invalid, `onSubmit` is not called. Date and time are optional because a
   * fixture may be TBC (Req 7.1) — an empty date/time is stored as the literal
   * "TBC".
   *
   * The optional tournament association field (Req 11.6) is populated from
   * `getTournaments(db)` on mount; failures leave the select with only the
   * "None" option and do not block the form.
   */

  /** The subset of a fixture captured by this form. */
  export type FixtureFormValues = {
    competition: string;
    homeTeam: string;
    awayTeam: string;
    date: string | 'TBC';
    time: string | 'TBC';
    venue: string;
    status: FixtureStatus;
    visibility: Visibility;
    tournamentId: string | null;
    notes: string;
  };

  interface Props {
    /** Existing fixture to pre-populate the form for editing. */
    initial?: Partial<Fixture> | null;
    /** Whether a submit is currently in flight (disables the submit button). */
    submitting?: boolean;
    /** Called with the validated form values when the form is submitted. */
    onSubmit: (values: FixtureFormValues) => void;
    /** Label for the submit button. */
    submitLabel?: string;
  }

  let { initial = null, submitting = false, onSubmit, submitLabel = 'Save Fixture' }: Props =
    $props();

  const statuses: FixtureStatus[] = ['scheduled', 'completed', 'postponed', 'cancelled', 'tbc'];
  const visibilities: Visibility[] = ['public', 'private'];

  // Tournament options for the optional association select (Req 11.6).
  let tournaments = $state<Tournament[]>([]);

  let started = false;
  $effect(() => {
    if (browser && !started) {
      started = true;
      void loadTournaments();
    }
  });

  async function loadTournaments(): Promise<void> {
    try {
      tournaments = await getTournaments(db);
    } catch {
      // Non-fatal: the association is optional, so we simply offer "None".
      tournaments = [];
    }
  }

  // ── Form state (Svelte 5 runes) ──
  // Snapshot the initial prop once; the form is uncontrolled thereafter. A
  // "TBC" date/time is surfaced to the user as an empty field.
  // svelte-ignore state_referenced_locally
  const seed = initial;
  let competition = $state(seed?.competition ?? '');
  let homeTeam = $state(seed?.homeTeam ?? '');
  let awayTeam = $state(seed?.awayTeam ?? '');
  let date = $state(seed?.date && seed.date !== 'TBC' ? seed.date : '');
  let time = $state(seed?.time && seed.time !== 'TBC' ? seed.time : '');
  let venue = $state(seed?.venue ?? '');
  let status = $state<FixtureStatus>(seed?.status ?? 'scheduled');
  let visibility = $state<Visibility>(seed?.visibility ?? 'public');
  let tournamentId = $state<string>(seed?.tournamentId ?? '');
  let notes = $state(seed?.notes ?? '');

  // Per-field validation errors, shown inline (Req 7.3).
  let errors = $state<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (competition.trim() === '') next.competition = 'Competition is required.';
    if (homeTeam.trim() === '') next.homeTeam = 'Home team is required.';
    if (awayTeam.trim() === '') next.awayTeam = 'Away team is required.';
    if (venue.trim() === '') next.venue = 'Venue is required.';
    errors = next;
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    // Emit validation before calling onSubmit; abort when invalid.
    if (!validate()) return;
    onSubmit({
      competition: competition.trim(),
      homeTeam: homeTeam.trim(),
      awayTeam: awayTeam.trim(),
      // An empty date/time means the fixture is To Be Confirmed (Req 7.1).
      date: date.trim() === '' ? 'TBC' : date,
      time: time.trim() === '' ? 'TBC' : time,
      venue: venue.trim(),
      status,
      visibility,
      tournamentId: tournamentId === '' ? null : tournamentId,
      notes: notes.trim()
    });
  }

  const fieldClass =
    'w-full rounded-lg border border-white/20 bg-navy-800/60 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900';
</script>

<form class="space-y-6" onsubmit={handleSubmit} novalidate>
  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
    <!-- Competition -->
    <div class="sm:col-span-2">
      <label for="competition" class="text-eyebrow mb-1.5 block">Competition</label>
      <input id="competition" type="text" class={fieldClass} bind:value={competition} />
      {#if errors.competition}
        <p class="mt-1 text-sm text-red-400" role="alert">{errors.competition}</p>
      {/if}
    </div>

    <!-- Home team -->
    <div>
      <label for="homeTeam" class="text-eyebrow mb-1.5 block">Home Team</label>
      <input id="homeTeam" type="text" class={fieldClass} bind:value={homeTeam} />
      {#if errors.homeTeam}
        <p class="mt-1 text-sm text-red-400" role="alert">{errors.homeTeam}</p>
      {/if}
    </div>

    <!-- Away team -->
    <div>
      <label for="awayTeam" class="text-eyebrow mb-1.5 block">Away Team</label>
      <input id="awayTeam" type="text" class={fieldClass} bind:value={awayTeam} />
      {#if errors.awayTeam}
        <p class="mt-1 text-sm text-red-400" role="alert">{errors.awayTeam}</p>
      {/if}
    </div>

    <!-- Date (optional — blank means TBC) -->
    <div>
      <label for="date" class="text-eyebrow mb-1.5 block">Date</label>
      <input id="date" type="date" class={fieldClass} bind:value={date} />
      <p class="mt-1 text-xs text-white/50">Leave blank if the date is to be confirmed.</p>
    </div>

    <!-- Time (optional — blank means TBC) -->
    <div>
      <label for="time" class="text-eyebrow mb-1.5 block">Time</label>
      <input id="time" type="time" class={fieldClass} bind:value={time} />
      <p class="mt-1 text-xs text-white/50">Leave blank if the time is to be confirmed.</p>
    </div>

    <!-- Venue -->
    <div class="sm:col-span-2">
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

    <!-- Tournament (optional association — Req 11.6) -->
    <div class="sm:col-span-2">
      <label for="tournamentId" class="text-eyebrow mb-1.5 block">Tournament (optional)</label>
      <select id="tournamentId" class={fieldClass} bind:value={tournamentId}>
        <option value="">None</option>
        {#each tournaments as t}
          <option value={t.id}>{t.name}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Notes -->
  <div>
    <label for="notes" class="text-eyebrow mb-1.5 block">Notes</label>
    <textarea id="notes" rows="4" class={fieldClass} bind:value={notes}></textarea>
  </div>

  <div class="flex justify-end gap-3">
    <a href="/admin/fixtures" class="btn-outline">Cancel</a>
    <button type="submit" class="btn-primary" disabled={submitting}>
      {submitting ? 'Saving…' : submitLabel}
    </button>
  </div>
</form>

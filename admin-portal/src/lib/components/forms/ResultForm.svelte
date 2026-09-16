<script lang="ts">
  import type { Result, Visibility } from '$lib/types/firestore.types';
  import { getResultLabel, type ResultLabel } from '$lib/utils/result-label';

  /**
   * Result create/edit form (Requirements 8.2, 8.3).
   *
   * Presentation + validation only — persistence is delegated to the parent
   * via the `onSubmit` callback prop, which receives the validated form values.
   * Required fields are validated inline before `onSubmit` is invoked; if any
   * field is invalid, `onSubmit` is not called.
   *
   * `fixtureId` is captured but not user-editable: it is read-only, shown for
   * reference and pre-populated when navigating from the Fixtures page
   * (Req 8.2). When the "Penalty shootout?" checkbox is off, both penalty
   * scores are emitted as `null` (Req 8.3). A live Win/Draw/Loss preview is
   * computed from the current values via {@link getResultLabel} (Req 8.1).
   */

  /** The subset of a result captured by this form. */
  export type ResultFormValues = {
    fixtureId: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    homePenaltyScore: number | null;
    awayPenaltyScore: number | null;
    visibility: Visibility;
    matchReport: string;
  };

  interface Props {
    /** Existing result to pre-populate the form for editing. */
    initial?: Partial<Result> | null;
    /** Linked fixture id — pre-populated from a query param in create mode. */
    fixtureId?: string;
    /** Whether a submit is currently in flight (disables the submit button). */
    submitting?: boolean;
    /** Called with the validated form values when the form is submitted. */
    onSubmit: (values: ResultFormValues) => void;
    /** Label for the submit button. */
    submitLabel?: string;
  }

  let {
    initial = null,
    fixtureId = '',
    submitting = false,
    onSubmit,
    submitLabel = 'Save Result'
  }: Props = $props();

  const visibilities: Visibility[] = ['public', 'private'];

  // ── Form state (Svelte 5 runes) ──
  // Snapshot the initial prop once; the form is uncontrolled thereafter.
  // svelte-ignore state_referenced_locally
  const seed = initial;
  // svelte-ignore state_referenced_locally
  let linkedFixtureId = $state(seed?.fixtureId ?? fixtureId);
  let homeTeam = $state(seed?.homeTeam ?? '');
  let awayTeam = $state(seed?.awayTeam ?? '');
  // Empty string represents "no score entered yet" for the number inputs.
  let homeScore = $state<number | ''>(
    typeof seed?.homeScore === 'number' ? seed.homeScore : ''
  );
  let awayScore = $state<number | ''>(
    typeof seed?.awayScore === 'number' ? seed.awayScore : ''
  );
  // Penalty shootout is "on" when either penalty score is present on the seed.
  let hasPenalties = $state(
    typeof seed?.homePenaltyScore === 'number' || typeof seed?.awayPenaltyScore === 'number'
  );
  let homePenaltyScore = $state<number | ''>(
    typeof seed?.homePenaltyScore === 'number' ? seed.homePenaltyScore : ''
  );
  let awayPenaltyScore = $state<number | ''>(
    typeof seed?.awayPenaltyScore === 'number' ? seed.awayPenaltyScore : ''
  );
  let visibility = $state<Visibility>(seed?.visibility ?? 'public');
  let matchReport = $state(seed?.matchReport ?? '');

  // Per-field validation errors, shown inline (Req 8.2, 8.3).
  let errors = $state<Record<string, string>>({});

  /** True when a value is a non-negative integer. */
  function isNonNegativeInt(value: number | ''): boolean {
    return value !== '' && Number.isInteger(Number(value)) && Number(value) >= 0;
  }

  /**
   * Live Win/Draw/Loss preview from K.O.T FC's perspective. Only meaningful
   * once both regular-time scores are valid; returns `null` otherwise so the
   * template can hide the preview until it can be computed.
   */
  const previewLabel = $derived<ResultLabel | null>(
    isNonNegativeInt(homeScore) && isNonNegativeInt(awayScore)
      ? getResultLabel(
          homeTeam,
          awayTeam,
          Number(homeScore),
          Number(awayScore),
          hasPenalties && isNonNegativeInt(homePenaltyScore) ? Number(homePenaltyScore) : null,
          hasPenalties && isNonNegativeInt(awayPenaltyScore) ? Number(awayPenaltyScore) : null
        )
      : null
  );

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (homeTeam.trim() === '') next.homeTeam = 'Home team is required.';
    if (awayTeam.trim() === '') next.awayTeam = 'Away team is required.';
    if (!isNonNegativeInt(homeScore)) {
      next.homeScore = 'Home score must be a non-negative whole number.';
    }
    if (!isNonNegativeInt(awayScore)) {
      next.awayScore = 'Away score must be a non-negative whole number.';
    }
    if (hasPenalties) {
      if (!isNonNegativeInt(homePenaltyScore)) {
        next.homePenaltyScore = 'Home penalty score must be a non-negative whole number.';
      }
      if (!isNonNegativeInt(awayPenaltyScore)) {
        next.awayPenaltyScore = 'Away penalty score must be a non-negative whole number.';
      }
    }
    errors = next;
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({
      fixtureId: linkedFixtureId,
      homeTeam: homeTeam.trim(),
      awayTeam: awayTeam.trim(),
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      // Penalty scores are null when the shootout checkbox is off (Req 8.3).
      homePenaltyScore: hasPenalties ? Number(homePenaltyScore) : null,
      awayPenaltyScore: hasPenalties ? Number(awayPenaltyScore) : null,
      visibility,
      matchReport: matchReport.trim()
    });
  }

  function labelClasses(label: ResultLabel): string {
    if (label === 'Win') return 'bg-blue-500/15 text-blue-400';
    if (label === 'Loss') return 'bg-red-500/15 text-red-400';
    return 'bg-silver-400/15 text-silver-200';
  }

  const fieldClass =
    'w-full rounded-lg border border-white/20 bg-navy-800/60 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900';
</script>

<form class="space-y-6" onsubmit={handleSubmit} novalidate>
  <!-- Linked fixture id (read-only, pre-populated from Fixtures) (Req 8.2) -->
  <div>
    <label for="fixtureId" class="text-eyebrow mb-1.5 block">Linked Fixture</label>
    <input
      id="fixtureId"
      type="text"
      class="{fieldClass} cursor-not-allowed opacity-70"
      value={linkedFixtureId}
      readonly
      placeholder="Not linked to a fixture"
    />
    <p class="mt-1 text-xs text-white/50">
      The fixture this result belongs to. Set automatically when recording from a fixture.
    </p>
  </div>

  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

    <!-- Home score -->
    <div>
      <label for="homeScore" class="text-eyebrow mb-1.5 block">Home Score</label>
      <input id="homeScore" type="number" min="0" step="1" class={fieldClass} bind:value={homeScore} />
      {#if errors.homeScore}
        <p class="mt-1 text-sm text-red-400" role="alert">{errors.homeScore}</p>
      {/if}
    </div>

    <!-- Away score -->
    <div>
      <label for="awayScore" class="text-eyebrow mb-1.5 block">Away Score</label>
      <input id="awayScore" type="number" min="0" step="1" class={fieldClass} bind:value={awayScore} />
      {#if errors.awayScore}
        <p class="mt-1 text-sm text-red-400" role="alert">{errors.awayScore}</p>
      {/if}
    </div>
  </div>

  <!-- Penalty shootout toggle (Req 8.3) -->
  <div class="rounded-lg border border-white/10 bg-navy-800/40 p-4">
    <label class="flex items-center gap-3 text-sm font-semibold text-white">
      <input
        type="checkbox"
        class="h-4 w-4 rounded border-white/30 bg-navy-800 text-blue-500 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900"
        bind:checked={hasPenalties}
      />
      Penalty shootout?
    </label>

    {#if hasPenalties}
      <div class="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <!-- Home penalty score -->
        <div>
          <label for="homePenaltyScore" class="text-eyebrow mb-1.5 block">Home Penalty Score</label>
          <input
            id="homePenaltyScore"
            type="number"
            min="0"
            step="1"
            class={fieldClass}
            bind:value={homePenaltyScore}
          />
          {#if errors.homePenaltyScore}
            <p class="mt-1 text-sm text-red-400" role="alert">{errors.homePenaltyScore}</p>
          {/if}
        </div>

        <!-- Away penalty score -->
        <div>
          <label for="awayPenaltyScore" class="text-eyebrow mb-1.5 block">Away Penalty Score</label>
          <input
            id="awayPenaltyScore"
            type="number"
            min="0"
            step="1"
            class={fieldClass}
            bind:value={awayPenaltyScore}
          />
          {#if errors.awayPenaltyScore}
            <p class="mt-1 text-sm text-red-400" role="alert">{errors.awayPenaltyScore}</p>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Live result label preview (Req 8.1) -->
  {#if previewLabel}
    <div class="flex items-center gap-3">
      <span class="text-eyebrow">Result (K.O.T FC)</span>
      <span class="rounded-full px-2.5 py-1 text-xs font-semibold {labelClasses(previewLabel)}">
        {previewLabel}
      </span>
    </div>
  {/if}

  <!-- Visibility -->
  <div class="sm:max-w-xs">
    <label for="visibility" class="text-eyebrow mb-1.5 block">Visibility</label>
    <select id="visibility" class={fieldClass} bind:value={visibility}>
      {#each visibilities as v}
        <option value={v}>{v}</option>
      {/each}
    </select>
  </div>

  <!-- Match report -->
  <div>
    <label for="matchReport" class="text-eyebrow mb-1.5 block">Match Report</label>
    <textarea id="matchReport" rows="6" class={fieldClass} bind:value={matchReport}></textarea>
  </div>

  <div class="flex justify-end gap-3">
    <a href="/admin/results" class="btn-outline">Cancel</a>
    <button type="submit" class="btn-primary" disabled={submitting}>
      {submitting ? 'Saving…' : submitLabel}
    </button>
  </div>
</form>

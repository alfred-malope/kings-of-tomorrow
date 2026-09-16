<script lang="ts">
  import { browser } from '$app/environment';
  import { db } from '$lib/firebase/client';
  import { getResults, MAX_PAGE_SIZE } from '$lib/repositories/results.repository';
  import type { Result } from '$lib/types/firestore.types';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import { getResultLabel, type ResultLabel } from '$lib/utils/result-label';
  import DataTable from '$lib/components/ui/DataTable.svelte';
  import Pagination from '$lib/components/ui/Pagination.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import type { Column } from '$lib/components/ui/data-table.types';
  import type { QueryDocumentSnapshot } from 'firebase/firestore';

  /**
   * Results list page (Requirements 8.1, 8.7).
   *
   * Renders a data table of results: "homeTeam vs awayTeam", the score, a
   * Win/Draw/Loss label from K.O.T FC's perspective (via getResultLabel), and
   * the match date. Pagination is cursor-based via the repository's `lastDoc`
   * cursor; a stack of the cursors that started each page lets us step back as
   * well as forward (Req 8.7). Loading, empty, and error states use the shared
   * UI components (Req 17.x). Write controls (Add / Edit) are hidden for the
   * `viewer` role (Req 3.3).
   */

  const canWrite = $derived(authStore.role === 'admin' || authStore.role === 'editor');

  // ── Data / UI state ──
  let results = $state<Result[]>([]);
  let loading = $state(true);
  let errored = $state(false);

  // Cursor-based pagination bookkeeping. `pageCursors[i]` is the cursor to
  // start page `i` (page 0 starts with `undefined`). `currentPage` indexes it.
  let pageCursors = $state<(QueryDocumentSnapshot | undefined)[]>([undefined]);
  let currentPage = $state(0);
  // Cursor returned by the most recent page; drives whether a next page exists.
  let lastDoc = $state<QueryDocumentSnapshot | null>(null);

  const hasPrev = $derived(currentPage > 0);
  // A next page likely exists whenever the query returned a continuation cursor.
  let fullPage = $state(false);
  const hasNext = $derived(fullPage && lastDoc !== null);

  async function loadPage(cursor: QueryDocumentSnapshot | undefined): Promise<void> {
    loading = true;
    errored = false;
    try {
      const result = await getResults(db, MAX_PAGE_SIZE, cursor);
      results = result.results;
      lastDoc = result.lastDoc;
      fullPage = result.lastDoc !== null;
    } catch {
      errored = true;
      results = [];
    } finally {
      loading = false;
    }
  }

  /** Reload from the first page — used on mount and retry. */
  async function reload(): Promise<void> {
    pageCursors = [undefined];
    currentPage = 0;
    await loadPage(undefined);
  }

  async function nextPage(): Promise<void> {
    if (!hasNext || lastDoc === null) return;
    const cursor = lastDoc;
    currentPage += 1;
    if (pageCursors.length <= currentPage) {
      pageCursors = [...pageCursors, cursor];
    } else {
      pageCursors[currentPage] = cursor;
    }
    await loadPage(cursor);
  }

  async function prevPage(): Promise<void> {
    if (!hasPrev) return;
    currentPage -= 1;
    await loadPage(pageCursors[currentPage]);
  }

  let started = false;
  $effect(() => {
    if (browser && !started) {
      started = true;
      void reload();
    }
  });

  /**
   * Formats a Firestore timestamp-like value (`{ toDate() }`), a `Date`, an ISO
   * string, or epoch millis into a readable date. Returns an em dash when the
   * value cannot be interpreted (e.g. an unresolved `serverTimestamp()`).
   */
  function formatTimestamp(value: unknown): string {
    let date: Date | null = null;
    if (value && typeof value === 'object' && 'toDate' in value) {
      const d = (value as { toDate: () => Date }).toDate();
      date = d instanceof Date ? d : null;
    } else if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      const d = new Date(value);
      date = Number.isNaN(d.getTime()) ? null : d;
    } else if (typeof value === 'number') {
      date = new Date(value);
    }
    if (!date || Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function labelClasses(label: ResultLabel): string {
    if (label === 'Win') return 'bg-blue-500/15 text-blue-400';
    if (label === 'Loss') return 'bg-red-500/15 text-red-400';
    return 'bg-silver-400/15 text-silver-200';
  }

  // Row shape for the generic DataTable (which requires an index signature).
  type ResultRow = {
    id: string;
    match: string;
    score: string;
    label: ResultLabel;
    matchDate: string;
    [key: string]: unknown;
  };

  /** Builds the "a–b" (with penalties) score string for display. */
  function formatScore(r: Result): string {
    const base = `${r.homeScore}–${r.awayScore}`;
    if (typeof r.homePenaltyScore === 'number' && typeof r.awayPenaltyScore === 'number') {
      return `${base} (${r.homePenaltyScore}–${r.awayPenaltyScore} pens)`;
    }
    return base;
  }

  const rows = $derived<ResultRow[]>(
    results.map((r) => ({
      id: r.id,
      match: `${r.homeTeam} vs ${r.awayTeam}`,
      score: formatScore(r),
      label: getResultLabel(
        r.homeTeam,
        r.awayTeam,
        r.homeScore,
        r.awayScore,
        r.homePenaltyScore,
        r.awayPenaltyScore
      ),
      matchDate: formatTimestamp(r.createdAt)
    }))
  );

  const columns = $derived<Column<ResultRow>[]>([
    { key: 'match', label: 'Match' },
    { key: 'score', label: 'Score' },
    { key: 'label', label: 'Result' },
    { key: 'matchDate', label: 'Date' },
    ...(canWrite ? [{ key: 'actions', label: '' } as Column<ResultRow>] : [])
  ]);
</script>

<svelte:head>
  <title>Results — K.O.T FC Admin</title>
</svelte:head>

<div class="container-x py-8">
  <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="text-eyebrow">Matches</p>
      <h1 class="heading-display mt-1 text-3xl sm:text-4xl">Results</h1>
    </div>
    {#if canWrite}
      <a href="/admin/results/new" class="btn-primary">Add Result</a>
    {/if}
  </header>

  {#if loading}
    <SkeletonLoader variant="row" count={6} />
  {:else if errored}
    <ErrorState message="We couldn't load the results." onRetry={reload} />
  {:else if results.length === 0}
    <EmptyState
      message="No results have been recorded yet."
      ctaLabel={canWrite ? 'Add your first result' : undefined}
      ctaHref={canWrite ? '/admin/results/new' : undefined}
    />
  {:else}
    <DataTable {columns} {rows}>
      {#snippet cell(row: ResultRow, key: string)}
        {#if key === 'match'}
          {#if canWrite}
            <a href={`/admin/results/${row.id}`} class="font-semibold text-white hover:text-blue-400">
              {row.match}
            </a>
          {:else}
            <span class="font-semibold text-white">{row.match}</span>
          {/if}
        {:else if key === 'label'}
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold {labelClasses(row.label)}">
            {row.label}
          </span>
        {:else if key === 'score'}
          {row.score}
        {:else if key === 'matchDate'}
          {row.matchDate}
        {:else if key === 'actions'}
          <a
            href={`/admin/results/${row.id}`}
            class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:border-blue-400 hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900"
            aria-label={`Edit ${row.match}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="h-3.5 w-3.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
            Edit
          </a>
        {/if}
      {/snippet}
    </DataTable>

    <div class="mt-6">
      <Pagination
        {hasNext}
        {hasPrev}
        onNext={() => void nextPage()}
        onPrev={() => void prevPage()}
        label={`Page ${currentPage + 1}`}
      />
    </div>
  {/if}
</div>

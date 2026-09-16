<script lang="ts">
  import { browser } from '$app/environment';
  import { db } from '$lib/firebase/client';
  import { getFixtures, MAX_PAGE_SIZE, type FixtureFilters } from '$lib/repositories/fixtures.repository';
  import type { Fixture, FixtureStatus } from '$lib/types/firestore.types';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import DataTable from '$lib/components/ui/DataTable.svelte';
  import Pagination from '$lib/components/ui/Pagination.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import type { Column } from '$lib/components/ui/data-table.types';
  import type { QueryDocumentSnapshot } from 'firebase/firestore';

  /**
   * Fixtures list page (Requirements 7.1, 7.2, 7.7, 7.8, 7.9).
   *
   * Renders fixtures in tabbed views — Upcoming (scheduled), Completed, TBC,
   * Cancelled, and All (no filter). Selecting a tab queries fixtures filtered
   * by the corresponding `status`, ordered by `date` ascending (Req 7.1, 7.2).
   * Pagination is cursor-based via the repository's `lastDoc` cursor, mirroring
   * the Players page: we keep a stack of the cursors that started each page so
   * we can step backwards as well as forwards (Req 7.8). Loading, empty, and
   * error states use the shared UI components (Req 7.9, 17.x). A "Record Result"
   * action appears only on completed fixtures (Req 7.7). Write controls
   * (Add / Edit) are hidden for the `viewer` role (Req 3.3).
   */

  const canWrite = $derived(authStore.role === 'admin' || authStore.role === 'editor');

  // ── Tab definitions ──
  type Tab = { id: string; label: string; status?: FixtureStatus };
  const tabs: Tab[] = [
    { id: 'upcoming', label: 'Upcoming', status: 'scheduled' },
    { id: 'completed', label: 'Completed', status: 'completed' },
    { id: 'tbc', label: 'TBC', status: 'tbc' },
    { id: 'cancelled', label: 'Cancelled', status: 'cancelled' },
    { id: 'all', label: 'All' }
  ];

  let activeTab = $state<string>('upcoming');
  const currentTab = $derived(tabs.find((t) => t.id === activeTab) ?? tabs[0]);

  // ── Data / UI state ──
  let fixtures = $state<Fixture[]>([]);
  let loading = $state(true);
  let errored = $state(false);

  // Cursor-based pagination bookkeeping. `pageCursors[i]` is the cursor to
  // start page `i` (page 0 starts with `undefined`). `currentPage` indexes it.
  let pageCursors = $state<(QueryDocumentSnapshot | undefined)[]>([undefined]);
  let currentPage = $state(0);
  let lastDoc = $state<QueryDocumentSnapshot | null>(null);

  const hasPrev = $derived(currentPage > 0);
  // A next page likely exists whenever the query returned a continuation cursor.
  let fullPage = $state(false);
  const hasNext = $derived(fullPage && lastDoc !== null);

  function currentFilters(): FixtureFilters {
    return { status: currentTab.status };
  }

  async function loadPage(cursor: QueryDocumentSnapshot | undefined): Promise<void> {
    loading = true;
    errored = false;
    try {
      const result = await getFixtures(db, currentFilters(), MAX_PAGE_SIZE, cursor);
      fixtures = result.fixtures;
      lastDoc = result.lastDoc;
      fullPage = result.lastDoc !== null;
    } catch {
      errored = true;
      fixtures = [];
    } finally {
      loading = false;
    }
  }

  /** Reload from the first page — used on mount, retry, and tab changes. */
  async function reload(): Promise<void> {
    pageCursors = [undefined];
    currentPage = 0;
    await loadPage(undefined);
  }

  function selectTab(id: string): void {
    if (id === activeTab) return;
    activeTab = id;
    void reload();
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

  // Kick off the first load once, browser-only.
  let started = false;
  $effect(() => {
    if (browser && !started) {
      started = true;
      void reload();
    }
  });

  // Row shape for the generic DataTable (which requires an index signature).
  type FixtureRow = {
    id: string;
    competition: string;
    homeTeam: string;
    awayTeam: string;
    date: string;
    time: string;
    venue: string;
    status: FixtureStatus;
    [key: string]: unknown;
  };

  const rows = $derived<FixtureRow[]>(
    fixtures.map((f) => ({
      id: f.id,
      competition: f.competition,
      homeTeam: f.homeTeam,
      awayTeam: f.awayTeam,
      date: f.date,
      time: f.time,
      venue: f.venue,
      status: f.status
    }))
  );

  const columns: Column<FixtureRow>[] = [
    { key: 'competition', label: 'Competition' },
    { key: 'match', label: 'Match' },
    { key: 'datetime', label: 'Date / Time' },
    { key: 'venue', label: 'Venue' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: '' }
  ];

  function statusClasses(status: FixtureStatus): string {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/15 text-blue-400';
      case 'completed':
        return 'bg-green-500/15 text-green-400';
      case 'cancelled':
        return 'bg-red-500/15 text-red-400';
      case 'postponed':
        return 'bg-gold-500/15 text-gold-400';
      default:
        return 'bg-silver-400/15 text-silver-200';
    }
  }

  /** Human-friendly date/time, showing "TBC" verbatim. */
  function formatDateTime(date: string, time: string): string {
    const d = date === 'TBC' || date === '' ? 'TBC' : date;
    const t = time === 'TBC' || time === '' ? 'TBC' : time;
    return `${d} · ${t}`;
  }

  /** Per-tab empty-state message (Req 7.9). */
  const emptyMessage = $derived(
    activeTab === 'all'
      ? 'No fixtures have been added yet.'
      : `No ${currentTab.label.toLowerCase()} fixtures.`
  );
</script>

<svelte:head>
  <title>Fixtures — K.O.T FC Admin</title>
</svelte:head>

<div class="container-x py-8">
  <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="text-eyebrow">Schedule</p>
      <h1 class="heading-display mt-1 text-3xl sm:text-4xl">Fixtures</h1>
    </div>
    {#if canWrite}
      <a href="/admin/fixtures/new" class="btn-primary">Add Fixture</a>
    {/if}
  </header>

  <!-- ── Tabs (Req 7.1) ── -->
  <div class="mb-6 flex flex-wrap gap-2 border-b border-white/10" role="tablist" aria-label="Fixture status">
    {#each tabs as tab}
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === tab.id}
        class="-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900 {activeTab ===
        tab.id
          ? 'border-blue-500 text-blue-400'
          : 'border-transparent text-white/60 hover:text-white'}"
        onclick={() => selectTab(tab.id)}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- ── Table / states ── -->
  {#if loading}
    <SkeletonLoader variant="row" count={6} />
  {:else if errored}
    <ErrorState message="We couldn't load the fixtures." onRetry={reload} />
  {:else if fixtures.length === 0}
    <EmptyState
      message={emptyMessage}
      ctaLabel={canWrite ? 'Add a fixture' : undefined}
      ctaHref={canWrite ? '/admin/fixtures/new' : undefined}
    />
  {:else}
    <DataTable {columns} {rows}>
      {#snippet cell(row: FixtureRow, key: string)}
        {#if key === 'competition'}
          {row.competition}
        {:else if key === 'match'}
          {#if canWrite}
            <a href={`/admin/fixtures/${row.id}`} class="font-semibold text-white hover:text-blue-400">
              {row.homeTeam} vs {row.awayTeam}
            </a>
          {:else}
            <span class="font-semibold text-white">{row.homeTeam} vs {row.awayTeam}</span>
          {/if}
        {:else if key === 'datetime'}
          <span class="whitespace-nowrap">{formatDateTime(row.date, row.time)}</span>
        {:else if key === 'venue'}
          {row.venue}
        {:else if key === 'status'}
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold {statusClasses(row.status)}">
            {row.status}
          </span>
        {:else if key === 'actions'}
          {#if canWrite && row.status === 'completed'}
            <a
              href={`/admin/results/new?fixtureId=${row.id}`}
              class="whitespace-nowrap text-sm font-semibold text-gold-400 hover:text-gold-500"
            >
              Record Result
            </a>
          {/if}
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

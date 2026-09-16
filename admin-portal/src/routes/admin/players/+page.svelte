<script lang="ts">
  import { browser } from '$app/environment';
  import { db } from '$lib/firebase/client';
  import {
    getPlayers,
    MAX_PAGE_SIZE,
    type PlayerFilters
  } from '$lib/repositories/players.repository';
  import type { Player, PlayerStatus, Position } from '$lib/types/firestore.types';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import DataTable from '$lib/components/ui/DataTable.svelte';
  import Pagination from '$lib/components/ui/Pagination.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import type { Column } from '$lib/components/ui/data-table.types';
  import type { QueryDocumentSnapshot } from 'firebase/firestore';

  /**
   * Players list page (Requirements 6.1, 6.2, 6.3, 6.10, 6.11).
   *
   * Renders a data table of players with position/status filter selects and a
   * text search box. Pagination is cursor-based via the repository's `lastDoc`
   * cursor: we keep a stack of the cursors that started each page so we can
   * step backwards as well as forwards (Req 6.10). Loading, empty, and error
   * states use the shared UI components (Req 6.11, 17.x). Write controls
   * (Add / Edit / Delete) are hidden for the `viewer` role (Req 3.3).
   */

  const positions: Position[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
  const statuses: PlayerStatus[] = ['active', 'inactive', 'injured', 'suspended'];

  const canWrite = $derived(authStore.role === 'admin' || authStore.role === 'editor');

  // ── Filter state ──
  let statusFilter = $state<PlayerStatus | ''>('');
  let positionFilter = $state<Position | ''>('');
  let search = $state('');

  // ── Data / UI state ──
  let players = $state<Player[]>([]);
  let loading = $state(true);
  let errored = $state(false);

  // Cursor-based pagination bookkeeping. `pageCursors[i]` is the cursor to
  // start page `i` (page 0 starts with `undefined`). `currentPage` indexes it.
  let pageCursors = $state<(QueryDocumentSnapshot | undefined)[]>([undefined]);
  let currentPage = $state(0);
  // Cursor returned by the most recent page; drives whether a next page exists.
  let lastDoc = $state<QueryDocumentSnapshot | null>(null);

  const hasPrev = $derived(currentPage > 0);
  // A next page likely exists when the current page filled to the page size and
  // the query returned a cursor to continue from.
  let fullPage = $state(false);
  const hasNext = $derived(fullPage && lastDoc !== null);

  function currentFilters(): PlayerFilters {
    return {
      status: statusFilter === '' ? undefined : statusFilter,
      position: positionFilter === '' ? undefined : positionFilter,
      search: search.trim() === '' ? undefined : search.trim()
    };
  }

  async function loadPage(cursor: QueryDocumentSnapshot | undefined): Promise<void> {
    loading = true;
    errored = false;
    try {
      const result = await getPlayers(db, currentFilters(), MAX_PAGE_SIZE, cursor);
      players = result.players;
      lastDoc = result.lastDoc;
      // A next page may exist whenever the query returned a continuation cursor.
      fullPage = result.lastDoc !== null;
    } catch {
      errored = true;
      players = [];
    } finally {
      loading = false;
    }
  }

  /** Reload from the first page — used on mount, retry, and filter changes. */
  async function reload(): Promise<void> {
    pageCursors = [undefined];
    currentPage = 0;
    await loadPage(undefined);
  }

  async function nextPage(): Promise<void> {
    if (!hasNext || lastDoc === null) return;
    const cursor = lastDoc;
    currentPage += 1;
    // Record the cursor that starts this new page (if not already recorded).
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

  // Debounce filter/search changes into a single reload from page 0.
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  function onFilterChange() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void reload(), 250);
  }

  // Row shape for the generic DataTable (which requires an index signature).
  // We carry only the fields the table renders, plus the id for row links.
  type PlayerRow = {
    id: string;
    photoUrl: string | null;
    displayName: string;
    squadNumber: number;
    position: Position;
    status: PlayerStatus;
    [key: string]: unknown;
  };

  const rows = $derived<PlayerRow[]>(
    players.map((p) => ({
      id: p.id,
      photoUrl: p.photoUrl,
      displayName: p.displayName,
      squadNumber: p.squadNumber,
      position: p.position,
      status: p.status
    }))
  );

  const columns = $derived<Column<PlayerRow>[]>([
    { key: 'photo', label: 'Photo' },
    { key: 'displayName', label: 'Name' },
    { key: 'squadNumber', label: 'No.' },
    { key: 'position', label: 'Position' },
    { key: 'status', label: 'Status' },
    ...(canWrite ? [{ key: 'actions', label: '' } as Column<PlayerRow>] : [])
  ]);

  function statusClasses(status: PlayerStatus): string {
    switch (status) {
      case 'active':
        return 'bg-blue-500/15 text-blue-400';
      case 'injured':
        return 'bg-red-500/15 text-red-400';
      case 'suspended':
        return 'bg-gold-500/15 text-gold-400';
      default:
        return 'bg-silver-400/15 text-silver-200';
    }
  }
</script>

<svelte:head>
  <title>Players — K.O.T FC Admin</title>
</svelte:head>

<div class="container-x py-8">
  <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="text-eyebrow">Squad</p>
      <h1 class="heading-display mt-1 text-3xl sm:text-4xl">Players</h1>
    </div>
    {#if canWrite}
      <a href="/admin/players/new" class="btn-primary">Add Player</a>
    {/if}
  </header>

  <!-- ── Filters (Req 6.2, 6.3) ── -->
  <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div>
      <label for="filter-position" class="text-eyebrow mb-1.5 block">Position</label>
      <select
        id="filter-position"
        class="w-full rounded-lg border border-white/20 bg-navy-800/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900"
        bind:value={positionFilter}
        onchange={onFilterChange}
      >
        <option value="">All positions</option>
        {#each positions as p}
          <option value={p}>{p}</option>
        {/each}
      </select>
    </div>

    <div>
      <label for="filter-status" class="text-eyebrow mb-1.5 block">Status</label>
      <select
        id="filter-status"
        class="w-full rounded-lg border border-white/20 bg-navy-800/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900"
        bind:value={statusFilter}
        onchange={onFilterChange}
      >
        <option value="">All statuses</option>
        {#each statuses as s}
          <option value={s}>{s}</option>
        {/each}
      </select>
    </div>

    <div>
      <label for="filter-search" class="text-eyebrow mb-1.5 block">Search</label>
      <input
        id="filter-search"
        type="search"
        placeholder="Name…"
        class="w-full rounded-lg border border-white/20 bg-navy-800/60 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900"
        bind:value={search}
        oninput={onFilterChange}
      />
    </div>
  </div>

  <!-- ── Table / states ── -->
  {#if loading}
    <SkeletonLoader variant="row" count={6} />
  {:else if errored}
    <ErrorState message="We couldn't load the players." onRetry={reload} />
  {:else if players.length === 0}
    <EmptyState
      message="No players match the current filters."
      ctaLabel={canWrite ? 'Add your first player' : undefined}
      ctaHref={canWrite ? '/admin/players/new' : undefined}
    />
  {:else}
    <DataTable {columns} {rows}>
      {#snippet cell(row: PlayerRow, key: string)}
        {#if key === 'photo'}
          {#if row.photoUrl}
            <img
              src={row.photoUrl}
              alt={row.displayName}
              class="h-10 w-10 rounded-full border border-white/10 object-cover"
            />
          {:else}
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-navy-700/60 text-xs font-semibold text-white/60"
              aria-hidden="true"
            >
              {row.displayName?.charAt(0) ?? '?'}
            </div>
          {/if}
        {:else if key === 'displayName'}
          {#if canWrite}
            <a href={`/admin/players/${row.id}`} class="font-semibold text-white hover:text-blue-400">
              {row.displayName}
            </a>
          {:else}
            <span class="font-semibold text-white">{row.displayName}</span>
          {/if}
        {:else if key === 'status'}
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold {statusClasses(row.status)}">
            {row.status}
          </span>
        {:else if key === 'squadNumber'}
          {row.squadNumber}
        {:else if key === 'position'}
          {row.position}
        {:else if key === 'actions'}
          <a
            href={`/admin/players/${row.id}`}
            class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:border-blue-400 hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900"
            aria-label={`Edit ${row.displayName}`}
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

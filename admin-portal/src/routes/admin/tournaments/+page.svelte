<script lang="ts">
  import { browser } from '$app/environment';
  import { db } from '$lib/firebase/client';
  import { getTournaments } from '$lib/repositories/tournaments.repository';
  import type { Tournament, TournamentStatus, Visibility } from '$lib/types/firestore.types';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import DataTable from '$lib/components/ui/DataTable.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import type { Column } from '$lib/components/ui/data-table.types';

  /**
   * Tournaments list page (Requirement 11.1).
   *
   * Renders every tournament (name, startDate, endDate, venue, status,
   * visibility) in a data table. Loading, empty, and error states use the
   * shared UI components. Write controls (Add / Edit) are hidden for the
   * `viewer` role (Req 3.3).
   */

  const canWrite = $derived(authStore.role === 'admin' || authStore.role === 'editor');

  let tournaments = $state<Tournament[]>([]);
  let loading = $state(true);
  let errored = $state(false);

  async function load(): Promise<void> {
    loading = true;
    errored = false;
    try {
      tournaments = await getTournaments(db);
    } catch {
      errored = true;
      tournaments = [];
    } finally {
      loading = false;
    }
  }

  let started = false;
  $effect(() => {
    if (browser && !started) {
      started = true;
      void load();
    }
  });

  // Row shape for the generic DataTable (which requires an index signature).
  type TournamentRow = {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    venue: string;
    status: TournamentStatus;
    visibility: Visibility;
    [key: string]: unknown;
  };

  const rows = $derived<TournamentRow[]>(
    tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      startDate: t.startDate,
      endDate: t.endDate,
      venue: t.venue,
      status: t.status,
      visibility: t.visibility
    }))
  );

  const columns = $derived<Column<TournamentRow>[]>([
    { key: 'name', label: 'Name' },
    { key: 'startDate', label: 'Start' },
    { key: 'endDate', label: 'End' },
    { key: 'venue', label: 'Venue' },
    { key: 'status', label: 'Status' },
    { key: 'visibility', label: 'Visibility' },
    ...(canWrite ? [{ key: 'actions', label: '' } as Column<TournamentRow>] : [])
  ]);

  function statusClasses(status: TournamentStatus): string {
    switch (status) {
      case 'ongoing':
        return 'bg-blue-500/15 text-blue-400';
      case 'upcoming':
        return 'bg-gold-500/15 text-gold-400';
      case 'cancelled':
        return 'bg-red-500/15 text-red-400';
      default:
        return 'bg-silver-400/15 text-silver-200';
    }
  }
</script>

<svelte:head>
  <title>Tournaments — K.O.T FC Admin</title>
</svelte:head>

<div class="container-x py-8">
  <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="text-eyebrow">Competitions</p>
      <h1 class="heading-display mt-1 text-3xl sm:text-4xl">Tournaments</h1>
    </div>
    {#if canWrite}
      <a href="/admin/tournaments/new" class="btn-primary">Add Tournament</a>
    {/if}
  </header>

  {#if loading}
    <SkeletonLoader variant="row" count={6} />
  {:else if errored}
    <ErrorState message="We couldn't load the tournaments." onRetry={load} />
  {:else if tournaments.length === 0}
    <EmptyState
      message="No tournaments have been created yet."
      ctaLabel={canWrite ? 'Add your first tournament' : undefined}
      ctaHref={canWrite ? '/admin/tournaments/new' : undefined}
    />
  {:else}
    <DataTable {columns} {rows}>
      {#snippet cell(row: TournamentRow, key: string)}
        {#if key === 'name'}
          {#if canWrite}
            <a
              href={`/admin/tournaments/${row.id}`}
              class="font-semibold text-white hover:text-blue-400"
            >
              {row.name}
            </a>
          {:else}
            <span class="font-semibold text-white">{row.name}</span>
          {/if}
        {:else if key === 'status'}
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold {statusClasses(row.status)}">
            {row.status}
          </span>
        {:else if key === 'visibility'}
          {row.visibility}
        {:else if key === 'startDate'}
          {row.startDate}
        {:else if key === 'endDate'}
          {row.endDate}
        {:else if key === 'venue'}
          {row.venue}
        {:else if key === 'actions'}
          <a
            href={`/admin/tournaments/${row.id}`}
            class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:border-blue-400 hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900"
            aria-label={`Edit ${row.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="h-3.5 w-3.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
            Edit
          </a>
        {/if}
      {/snippet}
    </DataTable>
  {/if}
</div>

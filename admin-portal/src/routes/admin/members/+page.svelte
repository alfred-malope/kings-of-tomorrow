<script lang="ts">
  import { browser } from '$app/environment';
  import { db } from '$lib/firebase/client';
  import {
    getMembers,
    MAX_PAGE_SIZE,
    type MemberFilters
  } from '$lib/repositories/members.repository';
  import type { Member, MemberStatus, MembershipType } from '$lib/types/firestore.types';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import DataTable from '$lib/components/ui/DataTable.svelte';
  import Pagination from '$lib/components/ui/Pagination.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import type { Column } from '$lib/components/ui/data-table.types';
  import type { QueryDocumentSnapshot } from 'firebase/firestore';

  /**
   * Members list page (Requirements 12.1, 12.2, 12.8, 12.9).
   *
   * Renders a data table of members with status/membership-type filter selects.
   * Pagination is cursor-based via the repository's `lastDoc` cursor: we keep a
   * stack of the cursors that started each page so we can step backwards as
   * well as forwards (Req 12.8). Loading, empty, and error states use the
   * shared UI components (Req 12.9, 17.x). Write controls (Add / row edit
   * links) are hidden for the `viewer` role (Req 3.3).
   */

  const membershipTypes: MembershipType[] = ['standard', 'premium', 'lifetime', 'honorary'];
  const statuses: MemberStatus[] = ['active', 'inactive', 'expired', 'suspended'];

  const canWrite = $derived(authStore.role === 'admin' || authStore.role === 'editor');

  // ── Filter state ──
  let statusFilter = $state<MemberStatus | ''>('');
  let membershipTypeFilter = $state<MembershipType | ''>('');

  // ── Data / UI state ──
  let members = $state<Member[]>([]);
  let loading = $state(true);
  let errored = $state(false);

  // Cursor-based pagination bookkeeping. `pageCursors[i]` is the cursor to
  // start page `i` (page 0 starts with `undefined`). `currentPage` indexes it.
  let pageCursors = $state<(QueryDocumentSnapshot | undefined)[]>([undefined]);
  let currentPage = $state(0);
  // Cursor returned by the most recent page; drives whether a next page exists.
  let lastDoc = $state<QueryDocumentSnapshot | null>(null);

  const hasPrev = $derived(currentPage > 0);
  // A next page likely exists when the query returned a continuation cursor.
  let fullPage = $state(false);
  const hasNext = $derived(fullPage && lastDoc !== null);

  function currentFilters(): MemberFilters {
    return {
      status: statusFilter === '' ? undefined : statusFilter,
      membershipType: membershipTypeFilter === '' ? undefined : membershipTypeFilter
    };
  }

  async function loadPage(cursor: QueryDocumentSnapshot | undefined): Promise<void> {
    loading = true;
    errored = false;
    try {
      const result = await getMembers(db, currentFilters(), MAX_PAGE_SIZE, cursor);
      members = result.members;
      lastDoc = result.lastDoc;
      fullPage = result.lastDoc !== null;
    } catch {
      errored = true;
      members = [];
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

  function onFilterChange() {
    void reload();
  }

  // Row shape for the generic DataTable (which requires an index signature).
  type MemberRow = {
    id: string;
    membershipNumber: string;
    fullName: string;
    email: string;
    membershipType: MembershipType;
    status: MemberStatus;
    expiryDate: string;
    [key: string]: unknown;
  };

  const rows = $derived<MemberRow[]>(
    members.map((m) => ({
      id: m.id,
      membershipNumber: m.membershipNumber,
      fullName: `${m.firstName} ${m.lastName}`.trim(),
      email: m.email,
      membershipType: m.membershipType,
      status: m.status,
      expiryDate: m.expiryDate
    }))
  );

  const columns = $derived<Column<MemberRow>[]>([
    { key: 'membershipNumber', label: 'Member No.' },
    { key: 'fullName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'membershipType', label: 'Type' },
    { key: 'status', label: 'Status' },
    { key: 'expiryDate', label: 'Expiry' },
    ...(canWrite ? [{ key: 'actions', label: '' } as Column<MemberRow>] : [])
  ]);

  function statusClasses(status: MemberStatus): string {
    switch (status) {
      case 'active':
        return 'bg-blue-500/15 text-blue-400';
      case 'expired':
        return 'bg-red-500/15 text-red-400';
      case 'suspended':
        return 'bg-gold-500/15 text-gold-400';
      default:
        return 'bg-silver-400/15 text-silver-200';
    }
  }
</script>

<svelte:head>
  <title>Members — K.O.T FC Admin</title>
</svelte:head>

<div class="container-x py-8">
  <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="text-eyebrow">Club</p>
      <h1 class="heading-display mt-1 text-3xl sm:text-4xl">Members</h1>
    </div>
    {#if canWrite}
      <a href="/admin/members/new" class="btn-primary">Add Member</a>
    {/if}
  </header>

  <!-- ── Filters (Req 12.2) ── -->
  <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div>
      <label for="filter-type" class="text-eyebrow mb-1.5 block">Membership Type</label>
      <select
        id="filter-type"
        class="w-full rounded-lg border border-white/20 bg-navy-800/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900"
        bind:value={membershipTypeFilter}
        onchange={onFilterChange}
      >
        <option value="">All types</option>
        {#each membershipTypes as t}
          <option value={t}>{t}</option>
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
  </div>

  <!-- ── Table / states ── -->
  {#if loading}
    <SkeletonLoader variant="row" count={6} />
  {:else if errored}
    <ErrorState message="We couldn't load the members." onRetry={reload} />
  {:else if members.length === 0}
    <EmptyState
      message="No members match the current filters."
      ctaLabel={canWrite ? 'Add your first member' : undefined}
      ctaHref={canWrite ? '/admin/members/new' : undefined}
    />
  {:else}
    <DataTable {columns} {rows}>
      {#snippet cell(row: MemberRow, key: string)}
        {#if key === 'fullName'}
          {#if canWrite}
            <a href={`/admin/members/${row.id}`} class="font-semibold text-white hover:text-blue-400">
              {row.fullName}
            </a>
          {:else}
            <span class="font-semibold text-white">{row.fullName}</span>
          {/if}
        {:else if key === 'status'}
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold {statusClasses(row.status)}">
            {row.status}
          </span>
        {:else if key === 'membershipNumber'}
          {row.membershipNumber}
        {:else if key === 'email'}
          {row.email}
        {:else if key === 'membershipType'}
          {row.membershipType}
        {:else if key === 'expiryDate'}
          {row.expiryDate}
        {:else if key === 'actions'}
          <a
            href={`/admin/members/${row.id}`}
            class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:border-blue-400 hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900"
            aria-label={`Edit ${row.fullName}`}
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

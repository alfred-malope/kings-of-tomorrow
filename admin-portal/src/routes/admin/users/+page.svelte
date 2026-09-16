<script lang="ts">
  import { browser } from '$app/environment';
  import { db } from '$lib/firebase/client';
  import { getUsers } from '$lib/repositories/users.repository';
  import type { UserRecord, UserRole } from '$lib/types/firestore.types';
  import DataTable from '$lib/components/ui/DataTable.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import type { Column } from '$lib/components/ui/data-table.types';

  /**
   * Users list page (Requirements 14.1, 14.2, 14.8).
   *
   * Renders a data table of user records (display name, email, role, active
   * status, created date). The route is admin-only and already guarded by the
   * layout Route_Guard (Req 14.1). Loading, empty, and error states use the
   * shared UI components (Req 14.8). "Add User" links to the create page and
   * each row's display name links to the edit page.
   */

  let users = $state<UserRecord[]>([]);
  let loading = $state(true);
  let errored = $state(false);

  async function load(): Promise<void> {
    loading = true;
    errored = false;
    try {
      users = await getUsers(db);
    } catch {
      errored = true;
      users = [];
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
    } else if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      date = Number.isNaN(d.getTime()) ? null : d;
    }
    if (!date) return '—';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Row shape for the generic DataTable (which requires an index signature).
  type UserRow = {
    id: string;
    displayName: string;
    email: string;
    role: UserRole;
    active: boolean;
    created: string;
    [key: string]: unknown;
  };

  const rows = $derived<UserRow[]>(
    users.map((u) => ({
      id: u.id,
      displayName: u.displayName,
      email: u.email,
      role: u.role,
      active: u.active,
      created: formatTimestamp(u.createdAt)
    }))
  );

  const columns: Column<UserRow>[] = [
    { key: 'displayName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'active', label: 'Status' },
    { key: 'created', label: 'Created' },
    { key: 'actions', label: '' }
  ];

  function roleClasses(role: UserRole): string {
    switch (role) {
      case 'admin':
        return 'bg-gold-500/15 text-gold-400';
      case 'editor':
        return 'bg-blue-500/15 text-blue-400';
      default:
        return 'bg-silver-400/15 text-silver-200';
    }
  }
</script>

<svelte:head>
  <title>Users — K.O.T FC Admin</title>
</svelte:head>

<div class="container-x py-8">
  <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="text-eyebrow">Access</p>
      <h1 class="heading-display mt-1 text-3xl sm:text-4xl">Users</h1>
    </div>
    <a href="/admin/users/new" class="btn-primary">Add User</a>
  </header>

  {#if loading}
    <SkeletonLoader variant="row" count={6} />
  {:else if errored}
    <ErrorState message="We couldn't load the users." onRetry={load} />
  {:else if users.length === 0}
    <EmptyState
      message="No users have been added yet."
      ctaLabel="Add your first user"
      ctaHref="/admin/users/new"
    />
  {:else}
    <DataTable {columns} {rows}>
      {#snippet cell(row: UserRow, key: string)}
        {#if key === 'displayName'}
          <a href={`/admin/users/${row.id}`} class="font-semibold text-white hover:text-blue-400">
            {row.displayName}
          </a>
        {:else if key === 'email'}
          <span class="text-white/80">{row.email}</span>
        {:else if key === 'role'}
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold {roleClasses(row.role)}">
            {row.role}
          </span>
        {:else if key === 'active'}
          <span
            class="rounded-full px-2.5 py-1 text-xs font-semibold {row.active
              ? 'bg-blue-500/15 text-blue-400'
              : 'bg-silver-400/15 text-silver-200'}"
          >
            {row.active ? 'active' : 'inactive'}
          </span>
        {:else if key === 'created'}
          <span class="whitespace-nowrap">{row.created}</span>
        {:else if key === 'actions'}
          <a
            href={`/admin/users/${row.id}`}
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
  {/if}
</div>

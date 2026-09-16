<script lang="ts">
  import { browser } from '$app/environment';
  import { db } from '$lib/firebase/client';
  import {
    getNews,
    updateNews,
    MAX_PAGE_SIZE,
    type NewsFilters
  } from '$lib/repositories/news.repository';
  import type { NewsArticle, NewsCategory, NewsStatus } from '$lib/types/firestore.types';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import DataTable from '$lib/components/ui/DataTable.svelte';
  import Pagination from '$lib/components/ui/Pagination.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import type { Column } from '$lib/components/ui/data-table.types';
  import type { QueryDocumentSnapshot } from 'firebase/firestore';

  /**
   * News list page (Requirements 9.1, 9.2, 9.8, 9.9).
   *
   * Renders a data table of articles (title, category, status, author,
   * published date) with status/category filter selects. Pagination is
   * cursor-based via the repository's `lastDoc` cursor; we keep a stack of the
   * cursors that started each page so we can step backwards as well as forwards
   * (Req 9.9). Loading, empty, and error states use the shared UI components
   * (Req 17.x). Inline row actions (Edit, Publish, Unpublish, Archive) let the
   * user change an article's status without leaving the list (Req 9.8); each
   * refreshes the current page afterward. Write controls are hidden for the
   * `viewer` role (Req 3.3).
   */

  const statuses: NewsStatus[] = ['draft', 'published', 'archived'];
  const categories: NewsCategory[] = [
    'Match Report',
    'Team News',
    'Training',
    'Club News',
    'Tournament Announcement'
  ];

  const canWrite = $derived(authStore.role === 'admin' || authStore.role === 'editor');

  // ── Filter state ──
  let statusFilter = $state<NewsStatus | ''>('');
  let categoryFilter = $state<NewsCategory | ''>('');

  // ── Data / UI state ──
  let articles = $state<NewsArticle[]>([]);
  let loading = $state(true);
  let errored = $state(false);
  // The id of the article whose inline action is currently in flight.
  let actioningId = $state<string | null>(null);

  // Cursor-based pagination bookkeeping (mirrors the players list).
  let pageCursors = $state<(QueryDocumentSnapshot | undefined)[]>([undefined]);
  let currentPage = $state(0);
  let lastDoc = $state<QueryDocumentSnapshot | null>(null);

  const hasPrev = $derived(currentPage > 0);
  let fullPage = $state(false);
  const hasNext = $derived(fullPage && lastDoc !== null);

  function currentFilters(): NewsFilters {
    return {
      status: statusFilter === '' ? undefined : statusFilter,
      category: categoryFilter === '' ? undefined : categoryFilter
    };
  }

  async function loadPage(cursor: QueryDocumentSnapshot | undefined): Promise<void> {
    loading = true;
    errored = false;
    try {
      const result = await getNews(db, currentFilters(), MAX_PAGE_SIZE, cursor);
      articles = result.articles;
      lastDoc = result.lastDoc;
      fullPage = result.lastDoc !== null;
    } catch {
      errored = true;
      articles = [];
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

  /** Reload the current page in place (used after an inline status change). */
  async function refreshCurrentPage(): Promise<void> {
    await loadPage(pageCursors[currentPage]);
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

  // Debounce filter changes into a single reload from page 0.
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  function onFilterChange() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void reload(), 250);
  }

  /**
   * Applies a status change to an article via the repository, then refreshes
   * the current page so the table reflects the new status (Req 9.8).
   */
  async function setStatus(id: string, status: NewsStatus): Promise<void> {
    if (actioningId) return;
    actioningId = id;
    try {
      await updateNews(db, id, { status });
      const verb =
        status === 'published' ? 'published' : status === 'archived' ? 'archived' : 'unpublished';
      toastStore.success(`Article ${verb}.`);
      await refreshCurrentPage();
    } catch {
      toastStore.error('Failed to update the article. Please try again.');
    } finally {
      actioningId = null;
    }
  }

  /**
   * Formats a Firestore timestamp-like value (`{ toDate() }`), a `Date`, an ISO
   * string, or epoch millis into a readable date. Returns an em dash when the
   * value cannot be interpreted (e.g. an unresolved `serverTimestamp()` or null).
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

  function statusClasses(status: NewsStatus): string {
    switch (status) {
      case 'published':
        return 'bg-blue-500/15 text-blue-400';
      case 'archived':
        return 'bg-silver-400/15 text-silver-200';
      default:
        return 'bg-gold-500/15 text-gold-400';
    }
  }

  // Row shape for the generic DataTable (which requires an index signature).
  type NewsRow = {
    id: string;
    title: string;
    category: NewsCategory;
    status: NewsStatus;
    author: string;
    publishedDate: string;
    [key: string]: unknown;
  };

  const rows = $derived<NewsRow[]>(
    articles.map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category,
      status: a.status,
      author: a.authorId,
      publishedDate: formatTimestamp(a.publishedAt)
    }))
  );

  const columns: Column<NewsRow>[] = [
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Status' },
    { key: 'author', label: 'Author' },
    { key: 'publishedDate', label: 'Published' },
    { key: 'actions', label: 'Actions' }
  ];
</script>

<svelte:head>
  <title>News — K.O.T FC Admin</title>
</svelte:head>

<div class="container-x py-8">
  <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="text-eyebrow">Content</p>
      <h1 class="heading-display mt-1 text-3xl sm:text-4xl">News</h1>
    </div>
    {#if canWrite}
      <a href="/admin/news/new" class="btn-primary">Add Article</a>
    {/if}
  </header>

  <!-- ── Filters (Req 9.2) ── -->
  <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      <label for="filter-category" class="text-eyebrow mb-1.5 block">Category</label>
      <select
        id="filter-category"
        class="w-full rounded-lg border border-white/20 bg-navy-800/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900"
        bind:value={categoryFilter}
        onchange={onFilterChange}
      >
        <option value="">All categories</option>
        {#each categories as c}
          <option value={c}>{c}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- ── Table / states ── -->
  {#if loading}
    <SkeletonLoader variant="row" count={6} />
  {:else if errored}
    <ErrorState message="We couldn't load the news articles." onRetry={reload} />
  {:else if articles.length === 0}
    <EmptyState
      message="No articles match the current filters."
      ctaLabel={canWrite ? 'Add your first article' : undefined}
      ctaHref={canWrite ? '/admin/news/new' : undefined}
    />
  {:else}
    <DataTable {columns} {rows}>
      {#snippet cell(row: NewsRow, key: string)}
        {#if key === 'title'}
          {#if canWrite}
            <a href={`/admin/news/${row.id}`} class="font-semibold text-white hover:text-blue-400">
              {row.title}
            </a>
          {:else}
            <span class="font-semibold text-white">{row.title}</span>
          {/if}
        {:else if key === 'status'}
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold {statusClasses(row.status)}">
            {row.status}
          </span>
        {:else if key === 'actions'}
          {#if canWrite}
            <div class="flex flex-wrap gap-2">
              <a
                href={`/admin/news/${row.id}`}
                class="rounded-md border border-white/20 px-2.5 py-1 text-xs font-semibold text-white/80 transition-colors hover:border-blue-400 hover:text-blue-400"
              >
                Edit
              </a>
              {#if row.status !== 'published'}
                <button
                  type="button"
                  disabled={actioningId !== null}
                  onclick={() => void setStatus(row.id, 'published')}
                  class="rounded-md border border-blue-400/40 px-2.5 py-1 text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-500/10 disabled:opacity-50"
                >
                  Publish
                </button>
              {/if}
              {#if row.status === 'published'}
                <button
                  type="button"
                  disabled={actioningId !== null}
                  onclick={() => void setStatus(row.id, 'draft')}
                  class="rounded-md border border-gold-400/40 px-2.5 py-1 text-xs font-semibold text-gold-400 transition-colors hover:bg-gold-500/10 disabled:opacity-50"
                >
                  Unpublish
                </button>
              {/if}
              {#if row.status !== 'archived'}
                <button
                  type="button"
                  disabled={actioningId !== null}
                  onclick={() => void setStatus(row.id, 'archived')}
                  class="rounded-md border border-white/20 px-2.5 py-1 text-xs font-semibold text-white/70 transition-colors hover:border-silver-300 hover:text-silver-200 disabled:opacity-50"
                >
                  Archive
                </button>
              {/if}
            </div>
          {:else}
            <span class="text-white/40">—</span>
          {/if}
        {:else if key === 'category'}
          {row.category}
        {:else if key === 'author'}
          <span class="text-white/70">{row.author}</span>
        {:else}
          {row.publishedDate}
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

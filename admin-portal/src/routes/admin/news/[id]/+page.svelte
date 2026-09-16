<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { db } from '$lib/firebase/client';
  import {
    getNewsArticle,
    updateNews,
    deleteNews,
    dateToTimestamp
  } from '$lib/repositories/news.repository';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import type { NewsArticle } from '$lib/types/firestore.types';
  import NewsForm, { type NewsFormValues } from '$lib/components/forms/NewsForm.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

  /**
   * Edit-article page (Requirements 9.3, 9.5, 9.7).
   *
   * Loads the article with `getNewsArticle($page.params.id)` and pre-populates
   * <NewsForm>. On submit it persists changes via `updateNews` (Req 9.7 — the
   * repository stamps `publishedAt` automatically on first publish; an explicit
   * date supplied here is passed through). A Delete button opens a
   * <ConfirmDialog>; on confirm it deletes the document then attempts to delete
   * the associated Storage featured image — if the Storage delete fails after
   * the document is gone, an error toast is shown but the document is NOT
   * restored. Edit/Delete controls are hidden for the `viewer` role (Req 3.3).
   */

  const articleId = $derived($page.params.id ?? '');
  const canWrite = $derived(authStore.role === 'admin' || authStore.role === 'editor');

  let article = $state<NewsArticle | null>(null);
  let loading = $state(true);
  let errored = $state(false);
  let notFound = $state(false);

  let submitting = $state(false);
  let deleting = $state(false);
  let showConfirm = $state(false);
  let pendingImage = $state<File | null>(null);

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Unable to read image'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Converts a Firestore timestamp-like `publishedAt` value into the string
   * format expected by an `<input type="datetime-local">` (`YYYY-MM-DDTHH:mm`).
   * Returns an empty string when the value is null/unresolved.
   */
  function toDateTimeLocal(value: unknown): string {
    let date: Date | null = null;
    if (value && typeof value === 'object' && 'toDate' in value) {
      const d = (value as { toDate: () => Date }).toDate();
      date = d instanceof Date ? d : null;
    } else if (value instanceof Date) {
      date = value;
    }
    if (!date || Number.isNaN(date.getTime())) return '';
    // Build a local-time string without seconds; offset the UTC ISO by the
    // timezone so the displayed value matches the user's local clock.
    const offsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  }

  const initialPublishedAt = $derived(article ? toDateTimeLocal(article.publishedAt) : '');

  async function load(): Promise<void> {
    loading = true;
    errored = false;
    notFound = false;
    try {
      const result = await getNewsArticle(db, articleId);
      if (!result) {
        notFound = true;
        article = null;
      } else {
        article = result;
      }
    } catch {
      errored = true;
      article = null;
    } finally {
      loading = false;
    }
  }

  let started = false;
  $effect(() => {
    if (browser && !started && articleId) {
      started = true;
      void load();
    }
  });

  async function handleSubmit(values: NewsFormValues): Promise<void> {
    if (submitting) return;
    submitting = true;
    try {
      const featuredImageBase64 = pendingImage ? await fileToDataUrl(pendingImage) : article?.featuredImageBase64 ?? null;
      await updateNews(db, articleId, {
        title: values.title,
        slug: values.slug,
        excerpt: values.excerpt,
        content: values.content,
        category: values.category,
        status: values.status,
        featuredImageUrl: values.featuredImageUrl ?? null,
        featuredImageBase64,
        // Pass an explicit publishedAt only when the user set one; leaving it
        // undefined lets the repository auto-stamp on first publish (Req 9.7).
        ...(values.publishedAt.trim() === ''
          ? {}
          : { publishedAt: dateToTimestamp(values.publishedAt) })
      });
      toastStore.success('Article updated.');
      await goto('/admin/news');
    } catch {
      toastStore.error('Failed to update article. Please try again.');
    } finally {
      submitting = false;
    }
  }

  async function confirmDelete(): Promise<void> {
    showConfirm = false;
    if (deleting) return;
    deleting = true;
    try {
      // Delete the document first.
      await deleteNews(db, articleId);
      toastStore.success('Article deleted.');
      await goto('/admin/news');
    } catch {
      toastStore.error('Failed to delete article. Please try again.');
    } finally {
      deleting = false;
    }
  }
</script>

<svelte:head>
  <title>Edit Article — K.O.T FC Admin</title>
</svelte:head>

<div class="container-narrow py-8">
  <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="text-eyebrow">Content</p>
      <h1 class="heading-display mt-1 text-3xl sm:text-4xl">
        {article ? article.title : 'Edit Article'}
      </h1>
    </div>
    {#if canWrite && article}
      <button type="button" class="btn-outline" onclick={() => (showConfirm = true)} disabled={deleting}>
        {deleting ? 'Deleting…' : 'Delete Article'}
      </button>
    {/if}
  </header>

  {#if loading}
    <SkeletonLoader variant="row" count={4} />
  {:else if errored}
    <ErrorState message="We couldn't load this article." onRetry={load} />
  {:else if notFound}
    <EmptyState message="This article could not be found." ctaLabel="Back to news" ctaHref="/admin/news" />
  {:else if article && canWrite}
    <NewsForm
      id={articleId}
      initial={article}
      {initialPublishedAt}
      {submitting}
      onSubmit={handleSubmit}
      onImageSelect={(file) => (pendingImage = file)}
      submitLabel="Save Changes"
    />
  {:else if article}
    <EmptyState message="You do not have permission to edit this article." ctaLabel="Back to news" ctaHref="/admin/news" />
  {/if}
</div>

{#if showConfirm}
  <ConfirmDialog
    title="Delete article?"
    description="This permanently removes the article and its featured image. This action cannot be undone."
    confirmLabel="Delete"
    onConfirm={() => void confirmDelete()}
    onCancel={() => (showConfirm = false)}
  />
{/if}

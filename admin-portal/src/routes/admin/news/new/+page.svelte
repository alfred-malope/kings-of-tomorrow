<script lang="ts">
  import { goto } from '$app/navigation';
  import { db } from '$lib/firebase/client';
  import { createNews, dateToTimestamp } from '$lib/repositories/news.repository';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import NewsForm, { type NewsFormValues } from '$lib/components/forms/NewsForm.svelte';

  /**
   * Create-article page (Requirements 9.3, 9.5, 9.6, 9.7).
   *
   * Renders <NewsForm> and, on submit, creates the article document first with
   * `authorId` set to the current user's UID (Req 9.6). Because a brand-new
   * article has no id, the featured image upload is deferred: the form captures
   * the raw File via `onImageSelect`; after the document is created we upload it
   * to `news/{id}/featured` and persist the resulting URL via
   * `updateNews({ featuredImageUrl })` (Req 9.5). On success we redirect to the
   * list with a success toast; failures surface an error toast (Req 17.5, 17.6).
   */

  let submitting = $state(false);
  // Image selected before the article exists — converted before create.
  let pendingImage = $state<File | null>(null);

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Unable to read image'));
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(values: NewsFormValues): Promise<void> {
    if (submitting) return;
    submitting = true;
    try {
      const authorId = authStore.user?.uid ?? '';
      const featuredImageBase64 = pendingImage ? await fileToDataUrl(pendingImage) : null;
      await createNews(db, {
        title: values.title,
        slug: values.slug,
        excerpt: values.excerpt,
        content: values.content,
        category: values.category,
        status: values.status,
        authorId,
        featuredImageUrl: values.featuredImageUrl ?? null,
        featuredImageBase64,
        publishedAt: dateToTimestamp(values.publishedAt)
      });

      toastStore.success('Article created.');
      await goto('/admin/news');
    } catch {
      toastStore.error('Failed to create article. Please try again.');
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Add Article — K.O.T FC Admin</title>
</svelte:head>

<div class="container-narrow py-8">
  <header class="mb-8">
    <p class="text-eyebrow">Content</p>
    <h1 class="heading-display mt-1 text-3xl sm:text-4xl">Add Article</h1>
  </header>

  <NewsForm
    {submitting}
    onSubmit={handleSubmit}
    onImageSelect={(file) => (pendingImage = file)}
    submitLabel="Create Article"
  />
</div>

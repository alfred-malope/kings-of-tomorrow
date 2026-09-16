<script lang="ts">
  import type { NewsArticle, NewsCategory, NewsStatus } from '$lib/types/firestore.types';
  import ImageUpload from '$lib/components/ui/ImageUpload.svelte';
  import { slugify } from '$lib/utils/slug';

  /**
   * News article create/edit form (Requirements 9.3, 9.4).
   *
   * The form is presentation + validation only — persistence is delegated to
   * the parent via the `onSubmit` callback prop, which receives the validated
   * form values. Required fields (title, slug, content) are validated inline
   * before `onSubmit` is invoked; if any field is invalid, `onSubmit` is not
   * called.
   *
   * Slug behaviour (Req 9.4): the slug is auto-generated from the title via
   * `slugify` as the user types, until the user manually edits the slug field.
   * Once the user edits the slug, their value is preserved and title changes no
   * longer overwrite it.
   *
   * Featured image (Req 9.5): the `<ImageUpload>` field targets
   * `news/{id}/featured` and is only rendered when an `id` is present (editing
   * an existing article). For a brand-new article no id exists yet, so the
   * featured image is deferred: a plain file input captures the selected `File`
   * which is handed to the parent via `onImageSelect`; the parent uploads it
   * after creating the document.
   */

  /** The subset of an article captured by this form. */
  export type NewsFormValues = {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: NewsCategory;
    status: NewsStatus;
    /** ISO-ish `datetime-local` string, or empty when not set. */
    publishedAt: string;
    featuredImageUrl: string | null;
  };

  interface Props {
    /** Existing article to pre-populate the form for editing. */
    initial?: Partial<NewsArticle> | null;
    /** News document id — required to enable the featured image upload field. */
    id?: string | null;
    /** Whether a submit is currently in flight (disables the submit button). */
    submitting?: boolean;
    /** Called with the validated form values when the form is submitted. */
    onSubmit: (values: NewsFormValues) => void;
    /** Called with the download URL when a featured image finishes uploading (edit mode). */
    onImageUpload?: (url: string) => void;
    /** Called with the selected, validated File in create mode (deferred upload). */
    onImageSelect?: (file: File | null) => void;
    /** Label for the submit button. */
    submitLabel?: string;
    /** Optional pre-formatted `datetime-local` value for publishedAt. */
    initialPublishedAt?: string;
  }

  let {
    initial = null,
    id = null,
    submitting = false,
    onSubmit,
    onImageUpload,
    onImageSelect,
    submitLabel = 'Save Article',
    initialPublishedAt = ''
  }: Props = $props();

  const categories: NewsCategory[] = [
    'Match Report',
    'Team News',
    'Training',
    'Club News',
    'Tournament Announcement'
  ];
  const statuses: NewsStatus[] = ['draft', 'published', 'archived'];

  // ── Form state (Svelte 5 runes) ──
  // Snapshot the initial prop once; the form is uncontrolled thereafter.
  // svelte-ignore state_referenced_locally
  const seed = initial;
  let title = $state(seed?.title ?? '');
  let slug = $state(seed?.slug ?? '');
  let excerpt = $state(seed?.excerpt ?? '');
  let content = $state(seed?.content ?? '');
  let category = $state<NewsCategory>(seed?.category ?? 'Club News');
  let status = $state<NewsStatus>(seed?.status ?? 'draft');
  // svelte-ignore state_referenced_locally
  let publishedAt = $state(initialPublishedAt);
  let featuredImageUrl = $state<string | null>(seed?.featuredImageUrl ?? null);

  // Tracks whether the user has manually edited the slug. Once true, the slug
  // is preserved and title changes stop regenerating it (Req 9.4). When editing
  // an existing article that already has a slug, treat it as user-owned.
  // svelte-ignore state_referenced_locally
  let slugTouched = $state((seed?.slug ?? '') !== '');

  // Inline error for the deferred (create-mode) image file input.
  let imageError = $state<string | null>(null);

  // Per-field validation errors, shown inline (Req 9.3).
  let errors = $state<Record<string, string>>({});

  function handleTitleInput() {
    if (!slugTouched) {
      slug = slugify(title);
    }
  }

  function handleSlugInput() {
    slugTouched = true;
  }

  function handleImageSelect(event: Event) {
    imageError = null;
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      onImageSelect?.(null);
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxBytes = 10 * 1024 * 1024;
    if (!validTypes.includes(file.type)) {
      imageError = 'Image must be a JPEG, PNG, or WebP file.';
      input.value = '';
      onImageSelect?.(null);
      return;
    }
    if (file.size > maxBytes) {
      imageError = 'Image must be 10MB or smaller.';
      input.value = '';
      onImageSelect?.(null);
      return;
    }
    onImageSelect?.(file);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (title.trim() === '') next.title = 'Title is required.';
    if (slug.trim() === '') next.slug = 'Slug is required.';
    if (content.trim() === '') next.content = 'Content is required.';
    errors = next;
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      category,
      status,
      publishedAt: publishedAt.trim(),
      featuredImageUrl
    });
  }

  function handleImageUpload(url: string) {
    featuredImageUrl = url;
    onImageUpload?.(url);
  }

  const fieldClass =
    'w-full rounded-lg border border-white/20 bg-navy-800/60 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900';
</script>

<form class="space-y-6" onsubmit={handleSubmit} novalidate>
  <!-- Title -->
  <div>
    <label for="title" class="text-eyebrow mb-1.5 block">Title</label>
    <input id="title" type="text" class={fieldClass} bind:value={title} oninput={handleTitleInput} />
    {#if errors.title}
      <p class="mt-1 text-sm text-red-400" role="alert">{errors.title}</p>
    {/if}
  </div>

  <!-- Slug -->
  <div>
    <label for="slug" class="text-eyebrow mb-1.5 block">Slug</label>
    <input id="slug" type="text" class={fieldClass} bind:value={slug} oninput={handleSlugInput} />
    <p class="mt-1 text-xs text-white/50">Auto-generated from the title; edit to override.</p>
    {#if errors.slug}
      <p class="mt-1 text-sm text-red-400" role="alert">{errors.slug}</p>
    {/if}
  </div>

  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
    <!-- Category -->
    <div>
      <label for="category" class="text-eyebrow mb-1.5 block">Category</label>
      <select id="category" class={fieldClass} bind:value={category}>
        {#each categories as c}
          <option value={c}>{c}</option>
        {/each}
      </select>
    </div>

    <!-- Status -->
    <div>
      <label for="status" class="text-eyebrow mb-1.5 block">Status</label>
      <select id="status" class={fieldClass} bind:value={status}>
        {#each statuses as s}
          <option value={s}>{s}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Published date (optional) -->
  <div>
    <label for="publishedAt" class="text-eyebrow mb-1.5 block">Published Date (optional)</label>
    <input id="publishedAt" type="datetime-local" class={fieldClass} bind:value={publishedAt} />
    <p class="mt-1 text-xs text-white/50">
      Leave blank to set automatically when the article is first published.
    </p>
  </div>

  <!-- Excerpt -->
  <div>
    <label for="excerpt" class="text-eyebrow mb-1.5 block">Excerpt</label>
    <textarea id="excerpt" rows="2" class={fieldClass} bind:value={excerpt}></textarea>
  </div>

  <!-- Content -->
  <div>
    <label for="content" class="text-eyebrow mb-1.5 block">Content (Markdown)</label>
    <textarea id="content" rows="12" class="{fieldClass} font-mono" bind:value={content}></textarea>
    {#if errors.content}
      <p class="mt-1 text-sm text-red-400" role="alert">{errors.content}</p>
    {/if}
  </div>

  <!-- Featured image -->
  {#if id}
    <ImageUpload
      label="Featured Image"
      storagePath={`news/${id}/featured`}
      currentUrl={featuredImageUrl}
      onUpload={handleImageUpload}
    />
  {:else}
    <div class="space-y-2">
      <span class="text-eyebrow block">Featured Image</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onchange={handleImageSelect}
        class="block w-full cursor-pointer rounded-lg border border-white/20 bg-navy-800/60 text-sm text-white/80 file:mr-4 file:cursor-pointer file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-bold file:uppercase file:tracking-wider file:text-navy-950 hover:file:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900"
      />
      <p class="text-xs text-white/50">The image will be uploaded after the article is created.</p>
      {#if imageError}
        <p class="text-sm text-red-400" role="alert">{imageError}</p>
      {/if}
    </div>
  {/if}

  <div class="flex justify-end gap-3">
    <a href="/admin/news" class="btn-outline">Cancel</a>
    <button type="submit" class="btn-primary" disabled={submitting}>
      {submitting ? 'Saving…' : submitLabel}
    </button>
  </div>
</form>

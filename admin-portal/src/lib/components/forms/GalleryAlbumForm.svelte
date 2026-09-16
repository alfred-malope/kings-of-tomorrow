<script lang="ts">
  import type { GalleryAlbum, Visibility } from '$lib/types/firestore.types';
  import ImageUpload from '$lib/components/ui/ImageUpload.svelte';
  import { slugify } from '$lib/utils/slug';

  /**
   * Gallery album create/edit form (Requirement 10.2).
   *
   * The form is presentation + validation only — persistence is delegated to
   * the parent via the `onSubmit` callback prop, which receives the validated
   * form values. Required fields (name, slug) are validated inline before
   * `onSubmit` is invoked; if any field is invalid, `onSubmit` is not called.
   *
   * Slug behaviour: the slug is auto-generated from the name via `slugify` as
   * the user types, until the user manually edits the slug field. Once the user
   * edits the slug, their value is preserved and name changes no longer
   * overwrite it.
   *
   * Cover image (Req 10.2): the `<ImageUpload>` field targets
   * `gallery/{id}/cover` and is only rendered when an `id` is present (editing
   * an existing album). For a brand-new album no id exists yet, so the cover is
   * deferred — it can be set later from the album's photo grid via
   * "Set as Cover" (Req 10.7).
   */

  /** The subset of an album captured by this form. */
  export type GalleryAlbumFormValues = {
    name: string;
    slug: string;
    description: string;
    category: string;
    visibility: Visibility;
    coverImageUrl: string | null;
  };

  interface Props {
    /** Existing album to pre-populate the form for editing. */
    initial?: Partial<GalleryAlbum> | null;
    /** Album document id — required to enable the cover image upload field. */
    id?: string | null;
    /** Whether a submit is currently in flight (disables the submit button). */
    submitting?: boolean;
    /** Called with the validated form values when the form is submitted. */
    onSubmit: (values: GalleryAlbumFormValues) => void;
    /** Called with the download URL when a cover image finishes uploading (edit mode). */
    onCoverUpload?: (url: string) => void;
    /** Label for the submit button. */
    submitLabel?: string;
  }

  let {
    initial = null,
    id = null,
    submitting = false,
    onSubmit,
    onCoverUpload,
    submitLabel = 'Save Album'
  }: Props = $props();

  const visibilities: Visibility[] = ['public', 'private'];

  // ── Form state (Svelte 5 runes) ──
  // Snapshot the initial prop once; the form is uncontrolled thereafter.
  // svelte-ignore state_referenced_locally
  const seed = initial;
  let name = $state(seed?.name ?? '');
  let slug = $state(seed?.slug ?? '');
  let description = $state(seed?.description ?? '');
  let category = $state(seed?.category ?? '');
  let visibility = $state<Visibility>(seed?.visibility ?? 'private');
  let coverImageUrl = $state<string | null>(seed?.coverImageUrl ?? null);

  // Tracks whether the user has manually edited the slug. Once true, the slug
  // is preserved and name changes stop regenerating it. When editing an
  // existing album that already has a slug, treat it as user-owned.
  // svelte-ignore state_referenced_locally
  let slugTouched = $state((seed?.slug ?? '') !== '');

  // Per-field validation errors, shown inline.
  let errors = $state<Record<string, string>>({});

  function handleNameInput() {
    if (!slugTouched) {
      slug = slugify(name);
    }
  }

  function handleSlugInput() {
    slugTouched = true;
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (name.trim() === '') next.name = 'Name is required.';
    if (slug.trim() === '') next.slug = 'Slug is required.';
    errors = next;
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      category: category.trim(),
      visibility,
      coverImageUrl
    });
  }

  function handleCoverUpload(url: string) {
    coverImageUrl = url;
    onCoverUpload?.(url);
  }

  const fieldClass =
    'w-full rounded-lg border border-white/20 bg-navy-800/60 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900';
</script>

<form class="space-y-6" onsubmit={handleSubmit} novalidate>
  <!-- Name -->
  <div>
    <label for="name" class="text-eyebrow mb-1.5 block">Name</label>
    <input id="name" type="text" class={fieldClass} bind:value={name} oninput={handleNameInput} />
    {#if errors.name}
      <p class="mt-1 text-sm text-red-400" role="alert">{errors.name}</p>
    {/if}
  </div>

  <!-- Slug -->
  <div>
    <label for="slug" class="text-eyebrow mb-1.5 block">Slug</label>
    <input id="slug" type="text" class={fieldClass} bind:value={slug} oninput={handleSlugInput} />
    <p class="mt-1 text-xs text-white/50">Auto-generated from the name; edit to override.</p>
    {#if errors.slug}
      <p class="mt-1 text-sm text-red-400" role="alert">{errors.slug}</p>
    {/if}
  </div>

  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
    <!-- Category -->
    <div>
      <label for="category" class="text-eyebrow mb-1.5 block">Category</label>
      <input
        id="category"
        type="text"
        class={fieldClass}
        placeholder="e.g. Match Day, Training"
        bind:value={category}
      />
    </div>

    <!-- Visibility -->
    <div>
      <label for="visibility" class="text-eyebrow mb-1.5 block">Visibility</label>
      <select id="visibility" class={fieldClass} bind:value={visibility}>
        {#each visibilities as v}
          <option value={v}>{v}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Description -->
  <div>
    <label for="description" class="text-eyebrow mb-1.5 block">Description</label>
    <textarea id="description" rows="4" class={fieldClass} bind:value={description}></textarea>
  </div>

  <!-- Cover image -->
  {#if id}
    <ImageUpload
      label="Cover Image"
      storagePath={`gallery/${id}/cover`}
      currentUrl={coverImageUrl}
      onUpload={handleCoverUpload}
    />
  {:else}
    <div class="space-y-2">
      <span class="text-eyebrow block">Cover Image</span>
      <p class="text-xs text-white/50">
        Add photos to the album after creating it, then choose one as the cover.
      </p>
    </div>
  {/if}

  <div class="flex justify-end gap-3">
    <a href="/admin/gallery" class="btn-outline">Cancel</a>
    <button type="submit" class="btn-primary" disabled={submitting}>
      {submitting ? 'Saving…' : submitLabel}
    </button>
  </div>
</form>

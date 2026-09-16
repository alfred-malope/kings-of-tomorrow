<script lang="ts">
  import type { Player, PlayerStatus, Position } from '$lib/types/firestore.types';
  import { validateUpload } from '$lib/utils/validation';

  /**
   * Player create/edit form (Requirement 6.4).
   *
   * The form is presentation + validation only — persistence is delegated to
   * the parent via the `onSubmit` callback prop, which receives the validated
   * form values (Req 6.5, 6.7). Required fields are validated inline before
   * `onSubmit` is invoked; if any field is invalid, `onSubmit` is not called.
   *
   * Photo handling: when an `id` is provided (editing an existing player) the
   * `<ImageUpload>` component uploads immediately to `players/{id}/photo` and
   * surfaces the resulting download URL via `onPhotoUpload`. For a brand-new
   * player no id exists yet, so the photo is deferred: a plain file input
   * captures the selected (client-validated) `File`, which is handed to the
   * parent via `onPhotoSelect`; the parent uploads it after creating the
   * document (Req 6.6).
   */

  /** The subset of a player captured by this form. */
  export type PlayerFormValues = {
    firstName: string;
    lastName: string;
    displayName: string;
    squadNumber: number;
    position: Position;
    status: PlayerStatus;
    bio: string;
    joinedDate: string;
    photoUrl: string | null;
    photoBase64: string | null;
  };

  interface Props {
    /** Existing player to pre-populate the form for editing. */
    initial?: Partial<Player> | null;
    /** Player document id, retained for edit-page compatibility. */
    id?: string | null;
    /** Whether a submit is currently in flight (disables the submit button). */
    submitting?: boolean;
    /** Called with the validated form values when the form is submitted. */
    onSubmit: (values: PlayerFormValues) => void;
    /** Called with the selected, validated image file. */
    onPhotoSelect?: (file: File | null) => void;
    /** Label for the submit button. */
    submitLabel?: string;
  }

  let {
    initial = null,
    id = null,
    submitting = false,
    onSubmit,
    onPhotoSelect,
    submitLabel = 'Save Player'
  }: Props = $props();

  // Inline error for the deferred (create-mode) photo file input.
  let photoError = $state<string | null>(null);

  function handlePhotoSelect(event: Event) {
    photoError = null;
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      onPhotoSelect?.(null);
      return;
    }
    const result = validateUpload(file);
    if (!result.valid) {
      photoError = result.reason;
      input.value = '';
      onPhotoSelect?.(null);
      return;
    }
    if (file.size > 700 * 1024) {
      photoError = 'Photo must be 700KB or smaller so it fits in Firestore.';
      input.value = '';
      onPhotoSelect?.(null);
      return;
    }
    onPhotoSelect?.(file);
  }

  const positions: Position[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
  const statuses: PlayerStatus[] = ['active', 'inactive', 'injured', 'suspended'];

  // ── Form state (Svelte 5 runes) ──
  // Snapshot the initial prop once; the form is uncontrolled thereafter.
  // svelte-ignore state_referenced_locally
  const seed = initial;
  let firstName = $state(seed?.firstName ?? '');
  let lastName = $state(seed?.lastName ?? '');
  let displayName = $state(seed?.displayName ?? '');
  // Empty string represents "no squad number entered yet" for the number input.
  let squadNumber = $state<number | ''>(
    typeof seed?.squadNumber === 'number' ? seed.squadNumber : ''
  );
  let position = $state<Position>(seed?.position ?? 'Goalkeeper');
  let status = $state<PlayerStatus>(seed?.status ?? 'active');
  let bio = $state(seed?.bio ?? '');
  let joinedDate = $state(seed?.joinedDate ?? '');
  let photoUrl = $state<string | null>(seed?.photoUrl ?? null);
  let photoBase64 = $state<string | null>(seed?.photoBase64 ?? null);

  // Per-field validation errors, shown inline (Req 6.4).
  let errors = $state<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (firstName.trim() === '') next.firstName = 'First name is required.';
    if (lastName.trim() === '') next.lastName = 'Last name is required.';
    if (displayName.trim() === '') next.displayName = 'Display name is required.';
    if (squadNumber === '' || Number.isNaN(Number(squadNumber))) {
      next.squadNumber = 'Squad number is required.';
    } else if (Number(squadNumber) < 0) {
      next.squadNumber = 'Squad number must be zero or greater.';
    }
    if (joinedDate.trim() === '') next.joinedDate = 'Joined date is required.';
    errors = next;
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    // Emit validation before calling onSubmit; abort when invalid.
    if (!validate()) return;
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: displayName.trim(),
      squadNumber: Number(squadNumber),
      position,
      status,
      bio: bio.trim(),
      joinedDate,
      photoUrl,
      photoBase64
    });
  }

  const fieldClass =
    'w-full rounded-lg border border-white/20 bg-navy-800/60 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900';
</script>

<form class="space-y-6" onsubmit={handleSubmit} novalidate>
  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
    <!-- First name -->
    <div>
      <label for="firstName" class="text-eyebrow mb-1.5 block">First Name</label>
      <input id="firstName" type="text" class={fieldClass} bind:value={firstName} />
      {#if errors.firstName}
        <p class="mt-1 text-sm text-red-400" role="alert">{errors.firstName}</p>
      {/if}
    </div>

    <!-- Last name -->
    <div>
      <label for="lastName" class="text-eyebrow mb-1.5 block">Last Name</label>
      <input id="lastName" type="text" class={fieldClass} bind:value={lastName} />
      {#if errors.lastName}
        <p class="mt-1 text-sm text-red-400" role="alert">{errors.lastName}</p>
      {/if}
    </div>

    <!-- Display name -->
    <div>
      <label for="displayName" class="text-eyebrow mb-1.5 block">Display Name</label>
      <input id="displayName" type="text" class={fieldClass} bind:value={displayName} />
      {#if errors.displayName}
        <p class="mt-1 text-sm text-red-400" role="alert">{errors.displayName}</p>
      {/if}
    </div>

    <!-- Squad number -->
    <div>
      <label for="squadNumber" class="text-eyebrow mb-1.5 block">Squad Number</label>
      <input
        id="squadNumber"
        type="number"
        min="0"
        class={fieldClass}
        bind:value={squadNumber}
      />
      {#if errors.squadNumber}
        <p class="mt-1 text-sm text-red-400" role="alert">{errors.squadNumber}</p>
      {/if}
    </div>

    <!-- Position -->
    <div>
      <label for="position" class="text-eyebrow mb-1.5 block">Position</label>
      <select id="position" class={fieldClass} bind:value={position}>
        {#each positions as p}
          <option value={p}>{p}</option>
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

    <!-- Joined date -->
    <div>
      <label for="joinedDate" class="text-eyebrow mb-1.5 block">Joined Date</label>
      <input id="joinedDate" type="date" class={fieldClass} bind:value={joinedDate} />
      {#if errors.joinedDate}
        <p class="mt-1 text-sm text-red-400" role="alert">{errors.joinedDate}</p>
      {/if}
    </div>
  </div>

  <!-- Bio -->
  <div>
    <label for="bio" class="text-eyebrow mb-1.5 block">Bio</label>
    <textarea id="bio" rows="4" class={fieldClass} bind:value={bio}></textarea>
  </div>

  <!-- Photo upload -->
  <div class="space-y-2">
    <span class="text-eyebrow block">Player Photo</span>
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      onchange={handlePhotoSelect}
      class="block w-full cursor-pointer rounded-lg border border-white/20 bg-navy-800/60 text-sm text-white/80 file:mr-4 file:cursor-pointer file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-bold file:uppercase file:tracking-wider file:text-navy-950 hover:file:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900"
    />
    <p class="text-xs text-white/50">JPEG, PNG, or WebP up to 700KB. Photos are stored directly in the player record.</p>
    {#if photoBase64 || photoUrl}
      <p class="text-xs text-green-400">Player photo saved.</p>
    {/if}
    {#if photoError}
      <p class="text-sm text-red-400" role="alert">{photoError}</p>
    {/if}
  </div>

  <div class="flex justify-end gap-3">
    <a href="/admin/players" class="btn-outline">Cancel</a>
    <button type="submit" class="btn-primary" disabled={submitting}>
      {submitting ? 'Saving…' : submitLabel}
    </button>
  </div>
</form>

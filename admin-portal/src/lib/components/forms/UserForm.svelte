<script lang="ts">
  import type { UserRecord, UserRole } from '$lib/types/firestore.types';

  /**
   * User create/edit form (Requirement 14.3).
   *
   * Presentation + validation only — persistence is delegated to the parent via
   * the `onSubmit` callback prop, which receives the validated form values.
   * Required fields (email + valid format, displayName) are validated inline
   * before `onSubmit` is invoked; if any field is invalid, `onSubmit` is not
   * called. In edit mode the email is read-only because the document id is the
   * Firebase Auth UID and the email identifies the account.
   */

  /** The subset of a user captured by this form. */
  export type UserFormValues = {
    email: string;
    password?: string;
    displayName: string;
    role: UserRole;
    active: boolean;
  };

  interface Props {
    /** Existing user to pre-populate the form for editing. */
    initial?: Partial<UserRecord> | null;
    /** When true, the email and password fields are in edit mode (email read-only, password hidden). */
    emailReadonly?: boolean;
    /** Whether a submit is currently in flight (disables the submit button). */
    submitting?: boolean;
    /** Called with the validated form values when the form is submitted. */
    onSubmit: (values: UserFormValues) => void;
    /** Label for the submit button. */
    submitLabel?: string;
  }

  let {
    initial = null,
    emailReadonly = false,
    submitting = false,
    onSubmit,
    submitLabel = 'Save User'
  }: Props = $props();

  const roles: UserRole[] = ['admin', 'editor', 'viewer'];

  // ── Form state (Svelte 5 runes) ──
  // Snapshot the initial prop once; the form is uncontrolled thereafter.
  // svelte-ignore state_referenced_locally
  const seed = initial;
  let email = $state(seed?.email ?? '');
  let displayName = $state(seed?.displayName ?? '');
  let password = $state('');
  let role = $state<UserRole>(seed?.role ?? 'viewer');
  let active = $state(seed?.active ?? true);

  /** Whether this is a new user (show password field) or editing an existing one. */
  const isNewUser = $derived(!emailReadonly);

  // Per-field validation errors, shown inline (Req 14.3).
  let errors = $state<Record<string, string>>({});

  // Basic email format check — a single @ with non-empty local and domain
  // parts and at least one dot in the domain.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (email.trim() === '') {
      next.email = 'Email is required.';
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (displayName.trim() === '') next.displayName = 'Display name is required.';
    if (isNewUser && password.length < 6) {
      next.password = 'Password must be at least 6 characters.';
    }
    errors = next;
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({
      email: email.trim(),
      ...(isNewUser ? { password } : {}),
      displayName: displayName.trim(),
      role,
      active
    });
  }

  const fieldClass =
    'w-full rounded-lg border border-white/20 bg-navy-800/60 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900';
</script>

<form class="space-y-6" onsubmit={handleSubmit} novalidate>
  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
    <!-- Email -->
    <div>
      <label for="email" class="text-eyebrow mb-1.5 block">Email</label>
      <input
        id="email"
        type="email"
        class="{fieldClass}{emailReadonly ? ' cursor-not-allowed opacity-60' : ''}"
        bind:value={email}
        readonly={emailReadonly}
      />
      {#if errors.email}
        <p class="mt-1 text-sm text-red-400" role="alert">{errors.email}</p>
      {/if}
    </div>

    <!-- Password (only for new users) -->
    {#if isNewUser}
      <div>
        <label for="password" class="text-eyebrow mb-1.5 block">Password</label>
        <input
          id="password"
          type="password"
          autocomplete="new-password"
          class={fieldClass}
          bind:value={password}
          placeholder="Min 6 characters"
        />
        {#if errors.password}
          <p class="mt-1 text-sm text-red-400" role="alert">{errors.password}</p>
        {/if}
        <p class="mt-1 text-xs text-white/40">This will be the user's login password.</p>
      </div>
    {/if}

    <!-- Display name -->
    <div>
      <label for="displayName" class="text-eyebrow mb-1.5 block">Display Name</label>
      <input id="displayName" type="text" class={fieldClass} bind:value={displayName} />
      {#if errors.displayName}
        <p class="mt-1 text-sm text-red-400" role="alert">{errors.displayName}</p>
      {/if}
    </div>

    <!-- Role -->
    <div>
      <label for="role" class="text-eyebrow mb-1.5 block">Role</label>
      <select id="role" class={fieldClass} bind:value={role}>
        {#each roles as r}
          <option value={r}>{r}</option>
        {/each}
      </select>
    </div>

    <!-- Active -->
    <div class="flex items-end">
      <label class="flex cursor-pointer items-center gap-3 py-2 text-sm text-white">
        <input
          type="checkbox"
          class="h-4 w-4 rounded border-white/20 bg-navy-800/60 text-blue-500 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900"
          bind:checked={active}
        />
        Active
      </label>
    </div>
  </div>

  <div class="flex justify-end gap-3">
    <a href="/admin/users" class="btn-outline">Cancel</a>
    <button type="submit" class="btn-primary" disabled={submitting}>
      {submitting ? 'Saving…' : submitLabel}
    </button>
  </div>
</form>

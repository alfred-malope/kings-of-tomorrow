<script lang="ts">
  import type { Member, MemberStatus, MembershipType } from '$lib/types/firestore.types';

  /**
   * Member create/edit form (Requirement 12.3).
   *
   * Presentation + validation only — persistence is delegated to the parent via
   * the `onSubmit` callback prop, which receives the validated form values
   * (Req 12.4, 12.5). Required fields (firstName, lastName, membershipNumber,
   * email) are validated inline before `onSubmit` is invoked, and the email is
   * checked against a basic format. If any field is invalid, `onSubmit` is not
   * called.
   */

  /** The subset of a member captured by this form. */
  export type MemberFormValues = {
    firstName: string;
    lastName: string;
    membershipNumber: string;
    email: string;
    phone: string;
    membershipType: MembershipType;
    status: MemberStatus;
    joinedDate: string;
    expiryDate: string;
  };

  interface Props {
    /** Existing member to pre-populate the form for editing. */
    initial?: Partial<Member> | null;
    /** Whether a submit is currently in flight (disables the submit button). */
    submitting?: boolean;
    /** Called with the validated form values when the form is submitted. */
    onSubmit: (values: MemberFormValues) => void;
    /** Label for the submit button. */
    submitLabel?: string;
  }

  let { initial = null, submitting = false, onSubmit, submitLabel = 'Save Member' }: Props =
    $props();

  const membershipTypes: MembershipType[] = ['standard', 'premium', 'lifetime', 'honorary'];
  const statuses: MemberStatus[] = ['active', 'inactive', 'expired', 'suspended'];

  // Basic email format check (Req 12.3).
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ── Form state (Svelte 5 runes) ──
  // Snapshot the initial prop once; the form is uncontrolled thereafter.
  // svelte-ignore state_referenced_locally
  const seed = initial;
  let firstName = $state(seed?.firstName ?? '');
  let lastName = $state(seed?.lastName ?? '');
  let membershipNumber = $state(seed?.membershipNumber ?? '');
  let email = $state(seed?.email ?? '');
  let phone = $state(seed?.phone ?? '');
  let membershipType = $state<MembershipType>(seed?.membershipType ?? 'standard');
  let status = $state<MemberStatus>(seed?.status ?? 'active');
  let joinedDate = $state(seed?.joinedDate ?? '');
  let expiryDate = $state(seed?.expiryDate ?? '');

  // Per-field validation errors, shown inline (Req 12.3).
  let errors = $state<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (firstName.trim() === '') next.firstName = 'First name is required.';
    if (lastName.trim() === '') next.lastName = 'Last name is required.';
    if (membershipNumber.trim() === '') next.membershipNumber = 'Membership number is required.';
    if (email.trim() === '') {
      next.email = 'Email is required.';
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }
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
      membershipNumber: membershipNumber.trim(),
      email: email.trim(),
      phone: phone.trim(),
      membershipType,
      status,
      joinedDate,
      expiryDate
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

    <!-- Membership number -->
    <div>
      <label for="membershipNumber" class="text-eyebrow mb-1.5 block">Membership Number</label>
      <input id="membershipNumber" type="text" class={fieldClass} bind:value={membershipNumber} />
      {#if errors.membershipNumber}
        <p class="mt-1 text-sm text-red-400" role="alert">{errors.membershipNumber}</p>
      {/if}
    </div>

    <!-- Email -->
    <div>
      <label for="email" class="text-eyebrow mb-1.5 block">Email</label>
      <input id="email" type="email" class={fieldClass} bind:value={email} />
      {#if errors.email}
        <p class="mt-1 text-sm text-red-400" role="alert">{errors.email}</p>
      {/if}
    </div>

    <!-- Phone -->
    <div>
      <label for="phone" class="text-eyebrow mb-1.5 block">Phone</label>
      <input id="phone" type="tel" class={fieldClass} bind:value={phone} />
    </div>

    <!-- Membership type -->
    <div>
      <label for="membershipType" class="text-eyebrow mb-1.5 block">Membership Type</label>
      <select id="membershipType" class={fieldClass} bind:value={membershipType}>
        {#each membershipTypes as t}
          <option value={t}>{t}</option>
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
    </div>

    <!-- Expiry date -->
    <div>
      <label for="expiryDate" class="text-eyebrow mb-1.5 block">Expiry Date</label>
      <input id="expiryDate" type="date" class={fieldClass} bind:value={expiryDate} />
    </div>
  </div>

  <div class="flex justify-end gap-3">
    <a href="/admin/members" class="btn-outline">Cancel</a>
    <button type="submit" class="btn-primary" disabled={submitting}>
      {submitting ? 'Saving…' : submitLabel}
    </button>
  </div>
</form>

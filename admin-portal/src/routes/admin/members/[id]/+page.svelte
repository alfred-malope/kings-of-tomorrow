<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { db } from '$lib/firebase/client';
  import { getMember, updateMember, deleteMember } from '$lib/repositories/members.repository';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import type { Member } from '$lib/types/firestore.types';
  import MemberForm, { type MemberFormValues } from '$lib/components/forms/MemberForm.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

  /**
   * Edit-member page (Requirements 12.3, 12.5, 12.6).
   *
   * Loads the member with `getMember($page.params.id)` and pre-populates
   * <MemberForm>. On submit it persists changes via `updateMember` (Req 12.5).
   * A Delete button opens a <ConfirmDialog> (Req 12.6); on confirm it deletes
   * the document and redirects. Write controls (edit form + delete) are hidden
   * for the `viewer` role (Req 3.3).
   */

  const memberId = $derived($page.params.id ?? '');
  const canWrite = $derived(authStore.role === 'admin' || authStore.role === 'editor');

  let member = $state<Member | null>(null);
  let loading = $state(true);
  let errored = $state(false);
  let notFound = $state(false);

  let submitting = $state(false);
  let deleting = $state(false);
  let showConfirm = $state(false);

  async function load(): Promise<void> {
    loading = true;
    errored = false;
    notFound = false;
    try {
      const result = await getMember(db, memberId);
      if (!result) {
        notFound = true;
        member = null;
      } else {
        member = result;
      }
    } catch {
      errored = true;
      member = null;
    } finally {
      loading = false;
    }
  }

  let started = false;
  $effect(() => {
    if (browser && !started && memberId) {
      started = true;
      void load();
    }
  });

  async function handleSubmit(values: MemberFormValues): Promise<void> {
    if (submitting) return;
    submitting = true;
    try {
      await updateMember(db, memberId, {
        firstName: values.firstName,
        lastName: values.lastName,
        membershipNumber: values.membershipNumber,
        email: values.email,
        phone: values.phone,
        membershipType: values.membershipType,
        status: values.status,
        joinedDate: values.joinedDate,
        expiryDate: values.expiryDate
      });
      toastStore.success('Member updated.');
      await goto('/admin/members');
    } catch {
      toastStore.error('Failed to update member. Please try again.');
    } finally {
      submitting = false;
    }
  }

  async function confirmDelete(): Promise<void> {
    showConfirm = false;
    if (deleting) return;
    deleting = true;
    try {
      await deleteMember(db, memberId);
      toastStore.success('Member deleted.');
      await goto('/admin/members');
    } catch {
      toastStore.error('Failed to delete member. Please try again.');
    } finally {
      deleting = false;
    }
  }
</script>

<svelte:head>
  <title>Edit Member — K.O.T FC Admin</title>
</svelte:head>

<div class="container-narrow py-8">
  <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="text-eyebrow">Club</p>
      <h1 class="heading-display mt-1 text-3xl sm:text-4xl">
        {member ? `${member.firstName} ${member.lastName}` : 'Edit Member'}
      </h1>
    </div>
    {#if canWrite && member}
      <button
        type="button"
        class="btn-outline"
        onclick={() => (showConfirm = true)}
        disabled={deleting}
      >
        {deleting ? 'Deleting…' : 'Delete Member'}
      </button>
    {/if}
  </header>

  {#if loading}
    <SkeletonLoader variant="row" count={4} />
  {:else if errored}
    <ErrorState message="We couldn't load this member." onRetry={load} />
  {:else if notFound}
    <EmptyState
      message="This member could not be found."
      ctaLabel="Back to members"
      ctaHref="/admin/members"
    />
  {:else if member && canWrite}
    <MemberForm
      initial={member}
      {submitting}
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
    />
  {:else if member}
    <EmptyState message="You don't have permission to edit this member." ctaLabel="Back to members" ctaHref="/admin/members" />
  {/if}
</div>

{#if showConfirm}
  <ConfirmDialog
    title="Delete member?"
    description="This permanently removes the member record. This action cannot be undone."
    confirmLabel="Delete"
    onConfirm={() => void confirmDelete()}
    onCancel={() => (showConfirm = false)}
  />
{/if}

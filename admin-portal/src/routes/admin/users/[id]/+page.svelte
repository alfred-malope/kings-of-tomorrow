<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { db } from '$lib/firebase/client';
  import { getUser, updateUser, deleteUser } from '$lib/repositories/users.repository';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import type { UserRecord } from '$lib/types/firestore.types';
  import UserForm, { type UserFormValues } from '$lib/components/forms/UserForm.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

  /**
   * Edit-user page (Requirements 14.5, 14.6).
   *
   * Loads the user with `getUser($page.params.id)` and pre-populates <UserForm>.
   * The email is read-only in edit mode (the id is the Auth UID). On submit it
   * persists role/active/displayName changes via `updateUser`, which refreshes
   * `updatedAt` with serverTimestamp (Req 14.5). A Delete button opens a
   * <ConfirmDialog> (Req 14.6); on confirm it deletes the document and
   * redirects. The route is admin-only and already guarded by the layout.
   */

  const userId = $derived($page.params.id ?? '');

  let user = $state<UserRecord | null>(null);
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
      const result = await getUser(db, userId);
      if (!result) {
        notFound = true;
        user = null;
      } else {
        user = result;
      }
    } catch {
      errored = true;
      user = null;
    } finally {
      loading = false;
    }
  }

  let started = false;
  $effect(() => {
    if (browser && !started && userId) {
      started = true;
      void load();
    }
  });

  async function handleSubmit(values: UserFormValues): Promise<void> {
    if (submitting) return;
    submitting = true;
    try {
      await updateUser(db, userId, {
        displayName: values.displayName,
        role: values.role,
        active: values.active
      });
      toastStore.success('User updated.');
      await goto('/admin/users');
    } catch {
      toastStore.error('Failed to update user. Please try again.');
    } finally {
      submitting = false;
    }
  }

  async function confirmDelete(): Promise<void> {
    showConfirm = false;
    if (deleting) return;
    deleting = true;
    try {
      await deleteUser(db, userId);
      toastStore.success('User deleted.');
      await goto('/admin/users');
    } catch {
      toastStore.error('Failed to delete user. Please try again.');
    } finally {
      deleting = false;
    }
  }
</script>

<svelte:head>
  <title>Edit User — K.O.T FC Admin</title>
</svelte:head>

<div class="container-narrow py-8">
  <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p class="text-eyebrow">Access</p>
      <h1 class="heading-display mt-1 text-3xl sm:text-4xl">
        {user ? user.displayName : 'Edit User'}
      </h1>
    </div>
    {#if user}
      <button
        type="button"
        class="btn-outline"
        onclick={() => (showConfirm = true)}
        disabled={deleting}
      >
        {deleting ? 'Deleting…' : 'Delete User'}
      </button>
    {/if}
  </header>

  {#if loading}
    <SkeletonLoader variant="row" count={4} />
  {:else if errored}
    <ErrorState message="We couldn't load this user." onRetry={load} />
  {:else if notFound}
    <EmptyState message="This user could not be found." ctaLabel="Back to users" ctaHref="/admin/users" />
  {:else if user}
    <UserForm
      initial={user}
      emailReadonly
      {submitting}
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
    />
  {/if}
</div>

{#if showConfirm}
  <ConfirmDialog
    title="Delete user?"
    description="This permanently removes the user record. This action cannot be undone."
    confirmLabel="Delete"
    onConfirm={() => void confirmDelete()}
    onCancel={() => (showConfirm = false)}
  />
{/if}

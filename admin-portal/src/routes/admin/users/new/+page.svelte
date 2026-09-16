<script lang="ts">
  import { goto } from '$app/navigation';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import UserForm, { type UserFormValues } from '$lib/components/forms/UserForm.svelte';

  /**
   * Create-user page (Requirements 14.3, 14.4).
   *
   * Submits to the server-side API endpoint `/api/users` which uses the Firebase
   * Admin SDK to create a real Auth account (with password), set the role custom
   * claim, and write the Firestore record — all in one step. The new user can
   * immediately log in with the email and password set here.
   */

  let submitting = $state(false);

  async function handleSubmit(values: UserFormValues): Promise<void> {
    if (submitting) return;
    submitting = true;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          displayName: values.displayName,
          role: values.role,
          active: values.active
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Failed to create user.' }));
        throw new Error(data.message ?? `Error ${res.status}`);
      }

      toastStore.success('User created. They can now sign in with the email and password you set.');
      await goto('/admin/users');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user.';
      toastStore.error(message);
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Add User — K.O.T FC Admin</title>
</svelte:head>

<div class="container-narrow py-8">
  <header class="mb-8">
    <p class="text-eyebrow">Access</p>
    <h1 class="heading-display mt-1 text-3xl sm:text-4xl">Add User</h1>
    <p class="mt-2 text-sm text-white/50">Create a new portal account. The user will be able to sign in immediately with the credentials you set.</p>
  </header>

  <UserForm {submitting} onSubmit={handleSubmit} submitLabel="Create User" />
</div>

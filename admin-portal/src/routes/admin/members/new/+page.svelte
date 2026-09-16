<script lang="ts">
  import { goto } from '$app/navigation';
  import { db } from '$lib/firebase/client';
  import { createMember } from '$lib/repositories/members.repository';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import MemberForm, { type MemberFormValues } from '$lib/components/forms/MemberForm.svelte';

  /**
   * Create-member page (Requirements 12.3, 12.4).
   *
   * Renders <MemberForm> and, on submit, creates the member document via the
   * repository (which sets `createdAt`/`updatedAt` with serverTimestamp). On
   * success we redirect to the list with a success toast; failures surface an
   * error toast (Req 17.5, 17.6).
   */

  let submitting = $state(false);

  async function handleSubmit(values: MemberFormValues): Promise<void> {
    if (submitting) return;
    submitting = true;
    try {
      await createMember(db, {
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
      toastStore.success('Member created.');
      await goto('/admin/members');
    } catch {
      toastStore.error('Failed to create member. Please try again.');
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Add Member — K.O.T FC Admin</title>
</svelte:head>

<div class="container-narrow py-8">
  <header class="mb-8">
    <p class="text-eyebrow">Club</p>
    <h1 class="heading-display mt-1 text-3xl sm:text-4xl">Add Member</h1>
  </header>

  <MemberForm {submitting} onSubmit={handleSubmit} submitLabel="Create Member" />
</div>

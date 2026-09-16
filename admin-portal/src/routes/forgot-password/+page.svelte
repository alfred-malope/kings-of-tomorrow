<script lang="ts">
  import { goto } from '$app/navigation';
  import { resetPassword } from '$lib/firebase/auth';
  import { mapAuthError } from '$lib/utils/error-messages';

  let email = $state('');
  let loading = $state(false);
  let success = $state('');
  let errorMessage = $state('');

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (loading) return;

    loading = true;
    errorMessage = '';
    success = '';

    try {
      await resetPassword(email);
      success = 'Password reset email sent. Check your inbox and follow the instructions.';
      email = '';
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code: unknown }).code)
          : '';
      errorMessage = mapAuthError(code);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Forgot password — K.O.T FC Admin</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-4 py-12">
  <div class="card-surface w-full max-w-md p-8 sm:p-10">
    <div class="flex flex-col items-center text-center">
      <img src="/kot-logo.svg" alt="Kings Of Tomorrow FC" class="h-16 w-auto" />
      <p class="text-eyebrow mt-6">Admin Portal</p>
      <h1 class="heading-display mt-2 text-3xl">Reset password</h1>
    </div>

    <p class="mt-5 text-sm text-white/70">
      Enter the email address associated with your admin account and we’ll send a reset link.
    </p>

    <form class="mt-8 flex flex-col gap-5" onsubmit={handleSubmit} novalidate>
      <div class="flex flex-col gap-2">
        <label for="email" class="text-eyebrow">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autocomplete="email"
          required
          bind:value={email}
          disabled={loading}
          class="rounded-lg border border-white/10 bg-navy-900/60 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900 disabled:opacity-60"
          placeholder="you@kotfc.co.za"
        />
      </div>

      {#if errorMessage}
        <p class="text-sm font-medium text-red-400" role="alert" aria-live="polite">
          {errorMessage}
        </p>
      {/if}

      {#if success}
        <p class="text-sm font-medium text-green-400" role="status" aria-live="polite">
          {success}
        </p>
      {/if}

      <button
        type="submit"
        class="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
        disabled={loading}
      >
        {#if loading}
          <svg
            class="h-5 w-5 animate-spin text-navy-950"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
          <span>Sending…</span>
        {:else}
          <span>Send reset link</span>
        {/if}
      </button>

      <div class="flex items-center justify-center">
        <button
          type="button"
          class="text-sm font-medium text-blue-300 transition-colors hover:text-blue-200"
          onclick={() => goto('/login')}
        >
          Back to sign in
        </button>
      </div>
    </form>
  </div>
</main>

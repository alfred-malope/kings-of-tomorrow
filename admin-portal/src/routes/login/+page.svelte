<script lang="ts">
  import { goto } from '$app/navigation';
  import { signInWithEmail, getIdTokenRole } from '$lib/firebase/auth';
  import { mapAuthError } from '$lib/utils/error-messages';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let errorMessage = $state('');

  /**
   * Persist the auth state the server route guard (hooks.server.ts) reads.
   *
   * Firebase authenticates client-side, but the server guard derives auth state
   * from a `session` cookie (presence => authenticated) and a `role` cookie.
   * We set both here so the server recognises the session after login.
   */
  function setAuthCookies(uid: string, role: string | null): void {
    // Session-scoped cookies (no Max-Age) so they clear when the browser closes;
    // Firebase's own persistence keeps the user signed in across refreshes.
    document.cookie = `session=${uid}; path=/; SameSite=Lax`;
    document.cookie = 'role=; path=/; Max-Age=0; SameSite=Lax';
    if (role) {
      document.cookie = `role=${role}; path=/; SameSite=Lax`;
    }
  }

  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (loading) return;

    loading = true;
    errorMessage = '';

    try {
      const credential = await signInWithEmail(email, password);
      const role = await getIdTokenRole(credential.user);
      setAuthCookies(credential.user.uid, role);
      await goto('/admin');
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
  <title>Sign in — K.O.T FC Admin</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-4 py-12">
  <div class="card-surface w-full max-w-md p-8 sm:p-10">
    <div class="flex flex-col items-center text-center">
      <img src="/kot-logo.svg" alt="Kings Of Tomorrow FC" class="h-16 w-auto" />
      <p class="text-eyebrow mt-6">Admin Portal</p>
      <h1 class="heading-display mt-2 text-3xl">Sign in</h1>
    </div>

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

      <div class="flex flex-col gap-2">
        <label for="password" class="text-eyebrow">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          required
          bind:value={password}
          disabled={loading}
          class="rounded-lg border border-white/10 bg-navy-900/60 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900 disabled:opacity-60"
          placeholder="••••••••"
        />
      </div>

      {#if errorMessage}
        <p class="text-sm font-medium text-red-400" role="alert" aria-live="polite">
          {errorMessage}
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
          <span>Signing in…</span>
        {:else}
          <span>Sign in</span>
        {/if}
      </button>
    </form>
  </div>

  <p class="mt-8 text-center text-[0.65rem] font-medium tracking-wide text-white/25">
    Developed by <a href="https://365itconsultants.co.za" target="_blank" rel="noopener noreferrer" class="text-white/40 transition-colors hover:text-blue-400">365 IT Consultants</a>
  </p>
</main>

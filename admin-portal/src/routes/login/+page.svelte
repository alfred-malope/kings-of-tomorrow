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

      <div class="flex items-center justify-end">
        <a href="/forgot-password" class="text-sm font-medium text-blue-300 transition-colors hover:text-blue-200">
          Forgot password?
        </a>
      </div>
    </form>

    <!-- Developer credit -->
    <div class="mt-8 flex items-center gap-3">
      <div class="h-px flex-1 bg-white/10"></div>
      <p class="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/30">
        Developed by
      </p>
      <div class="h-px flex-1 bg-white/10"></div>
    </div>
    <div class="mt-3 flex justify-center">
      <a
        href="https://365itconsultants.co.za"
        target="_blank"
        rel="noopener noreferrer"
        class="group flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors hover:bg-white/5"
      >
        <span class="text-sm font-bold tracking-wide text-white/50 transition-colors group-hover:text-blue-400">
          365 IT Consultants
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5 text-white/30 transition-colors group-hover:text-blue-400" aria-hidden="true">
          <path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clip-rule="evenodd" />
          <path fill-rule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clip-rule="evenodd" />
        </svg>
      </a>
    </div>
  </div>
</main>

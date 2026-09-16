<script lang="ts">
  import { browser } from '$app/environment';
  import { db } from '$lib/firebase/client';
  import { getSettings, updateSettings } from '$lib/repositories/settings.repository';
  import { changePassword } from '$lib/firebase/auth';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import { mapAuthError } from '$lib/utils/error-messages';
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';

  // ── Site Settings state ──
  let siteName = $state('');
  let contactEmail = $state('');
  let facebook = $state('');
  let instagram = $state('');
  let twitter = $state('');

  let loading = $state(true);
  let errored = $state(false);
  let submitting = $state(false);

  async function load(): Promise<void> {
    loading = true;
    errored = false;
    try {
      const settings = await getSettings(db);
      siteName = settings?.siteName ?? '';
      contactEmail = settings?.contactEmail ?? '';
      facebook = settings?.socialLinks?.facebook ?? '';
      instagram = settings?.socialLinks?.instagram ?? '';
      twitter = settings?.socialLinks?.twitter ?? '';
    } catch {
      errored = true;
    } finally {
      loading = false;
    }
  }

  let started = false;
  $effect(() => {
    if (browser && !started) {
      started = true;
      void load();
    }
  });

  async function handleSiteSettings(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (submitting) return;
    submitting = true;
    try {
      await updateSettings(db, {
        siteName: siteName.trim(),
        contactEmail: contactEmail.trim(),
        socialLinks: {
          facebook: facebook.trim(),
          instagram: instagram.trim(),
          twitter: twitter.trim()
        }
      });
      toastStore.success('Site settings saved.');
    } catch {
      toastStore.error('Failed to save settings.');
    } finally {
      submitting = false;
    }
  }

  // ── Change Password state ──
  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let passwordSubmitting = $state(false);
  let passwordError = $state('');

  async function handlePasswordChange(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    passwordError = '';

    if (!currentPassword) { passwordError = 'Current password is required.'; return; }
    if (newPassword.length < 6) { passwordError = 'New password must be at least 6 characters.'; return; }
    if (newPassword !== confirmPassword) { passwordError = 'New passwords do not match.'; return; }
    if (newPassword === currentPassword) { passwordError = 'New password must be different from the current one.'; return; }
    if (!authStore.user) { passwordError = 'You must be signed in.'; return; }

    passwordSubmitting = true;
    try {
      await changePassword(authStore.user, currentPassword, newPassword);
      toastStore.success('Password updated successfully.');
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code: unknown }).code)
          : '';
      passwordError = mapAuthError(code);
    } finally {
      passwordSubmitting = false;
    }
  }

  const fieldClass =
    'w-full rounded-lg border border-white/10 bg-navy-900/80 px-4 py-3 text-sm text-white placeholder-white/30 transition-colors focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900 disabled:cursor-not-allowed disabled:opacity-50';

  // Active section for mobile tab-like navigation
  let activeSection = $state<'general' | 'social' | 'security'>('general');
</script>

<svelte:head>
  <title>Settings — K.O.T FC Admin</title>
</svelte:head>

<div class="container-x py-8">
  <header class="mb-10">
    <p class="text-eyebrow">Configuration</p>
    <h1 class="heading-display mt-1 text-3xl sm:text-4xl">Settings</h1>
    <p class="mt-2 max-w-lg text-sm text-white/50">Manage your site configuration, social links, and account security.</p>
  </header>

  {#if loading}
    <SkeletonLoader variant="row" count={6} />
  {:else if errored}
    <ErrorState message="We couldn't load the settings." onRetry={load} />
  {:else}
    <!-- Section navigation tabs -->
    <div class="mb-8 flex gap-1 rounded-lg border border-white/10 bg-navy-950/60 p-1" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={activeSection === 'general'}
        class="flex-1 rounded-md px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all {activeSection === 'general' ? 'bg-blue-500/15 text-blue-400 shadow-sm' : 'text-white/50 hover:text-white/80'}"
        onclick={() => (activeSection = 'general')}
      >
        General
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeSection === 'social'}
        class="flex-1 rounded-md px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all {activeSection === 'social' ? 'bg-blue-500/15 text-blue-400 shadow-sm' : 'text-white/50 hover:text-white/80'}"
        onclick={() => (activeSection = 'social')}
      >
        Social Links
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeSection === 'security'}
        class="flex-1 rounded-md px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all {activeSection === 'security' ? 'bg-blue-500/15 text-blue-400 shadow-sm' : 'text-white/50 hover:text-white/80'}"
        onclick={() => (activeSection = 'security')}
      >
        Security
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- GENERAL SECTION                                                        -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    {#if activeSection === 'general'}
      <section class="card-surface max-w-2xl p-6 sm:p-8">
        <div class="mb-6 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="h-5 w-5 text-blue-400" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          </div>
          <div>
            <h2 class="heading-display text-xl text-white">General</h2>
            <p class="text-xs text-white/50">Site name and contact information</p>
          </div>
        </div>

        <form class="space-y-5" onsubmit={handleSiteSettings} novalidate>
          <div>
            <label for="siteName" class="mb-1.5 block text-sm font-medium text-white/70">Site Name</label>
            <input id="siteName" type="text" class={fieldClass} bind:value={siteName} disabled={submitting} placeholder="Kings Of Tomorrow FC" />
          </div>

          <div>
            <label for="contactEmail" class="mb-1.5 block text-sm font-medium text-white/70">Contact Email</label>
            <input id="contactEmail" type="email" class={fieldClass} bind:value={contactEmail} disabled={submitting} placeholder="info@kotfc.co.za" />
          </div>

          <div class="flex justify-end border-t border-white/5 pt-5">
            <button type="submit" class="btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>
    {/if}

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- SOCIAL LINKS SECTION                                                   -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    {#if activeSection === 'social'}
      <section class="card-surface max-w-2xl p-6 sm:p-8">
        <div class="mb-6 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="h-5 w-5 text-blue-400" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
          </div>
          <div>
            <h2 class="heading-display text-xl text-white">Social Links</h2>
            <p class="text-xs text-white/50">Connect your social media profiles</p>
          </div>
        </div>

        <form class="space-y-5" onsubmit={handleSiteSettings} novalidate>
          <div>
            <label for="facebook" class="mb-1.5 flex items-center gap-2 text-sm font-medium text-white/70">
              <svg viewBox="0 0 24 24" class="h-4 w-4 text-blue-400" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </label>
            <input id="facebook" type="url" class={fieldClass} bind:value={facebook} disabled={submitting} placeholder="https://facebook.com/kotfc" />
          </div>

          <div>
            <label for="instagram" class="mb-1.5 flex items-center gap-2 text-sm font-medium text-white/70">
              <svg viewBox="0 0 24 24" class="h-4 w-4 text-pink-400" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              Instagram
            </label>
            <input id="instagram" type="url" class={fieldClass} bind:value={instagram} disabled={submitting} placeholder="https://instagram.com/kotfc" />
          </div>

          <div>
            <label for="twitter" class="mb-1.5 flex items-center gap-2 text-sm font-medium text-white/70">
              <svg viewBox="0 0 24 24" class="h-4 w-4 text-white/70" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X (Twitter)
            </label>
            <input id="twitter" type="url" class={fieldClass} bind:value={twitter} disabled={submitting} placeholder="https://x.com/kotfc" />
          </div>

          <div class="flex justify-end border-t border-white/5 pt-5">
            <button type="submit" class="btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Social Links'}
            </button>
          </div>
        </form>
      </section>
    {/if}

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- SECURITY SECTION                                                       -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    {#if activeSection === 'security'}
      <section class="card-surface max-w-2xl p-6 sm:p-8">
        <div class="mb-6 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="h-5 w-5 text-blue-400" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div>
            <h2 class="heading-display text-xl text-white">Security</h2>
            <p class="text-xs text-white/50">Update your login credentials</p>
          </div>
        </div>

        <!-- Current account info -->
        <div class="mb-6 rounded-lg border border-white/5 bg-navy-950/50 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-wider text-white/40">Signed in as</p>
          <p class="mt-1 text-sm font-medium text-white">{authStore.user?.email ?? '—'}</p>
        </div>

        <form class="space-y-5" onsubmit={handlePasswordChange} novalidate>
          <div>
            <label for="currentPassword" class="mb-1.5 block text-sm font-medium text-white/70">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              autocomplete="current-password"
              required
              class={fieldClass}
              bind:value={currentPassword}
              disabled={passwordSubmitting}
            />
          </div>

          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label for="newPassword" class="mb-1.5 block text-sm font-medium text-white/70">New Password</label>
              <input
                id="newPassword"
                type="password"
                autocomplete="new-password"
                required
                class={fieldClass}
                bind:value={newPassword}
                disabled={passwordSubmitting}
                placeholder="Min 6 characters"
              />
            </div>

            <div>
              <label for="confirmPassword" class="mb-1.5 block text-sm font-medium text-white/70">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                class={fieldClass}
                bind:value={confirmPassword}
                disabled={passwordSubmitting}
              />
            </div>
          </div>

          {#if passwordError}
            <div class="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 shrink-0 text-red-400" aria-hidden="true">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
              <p class="text-sm text-red-300" role="alert">{passwordError}</p>
            </div>
          {/if}

          <div class="flex justify-end border-t border-white/5 pt-5">
            <button type="submit" class="btn-primary" disabled={passwordSubmitting}>
              {passwordSubmitting ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>
    {/if}
  {/if}
</div>

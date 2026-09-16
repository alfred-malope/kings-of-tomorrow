<script lang="ts">
  import type { ToastType } from '$lib/stores/toast.store.svelte';

  interface Props {
    type: ToastType;
    message: string;
    onDismiss: () => void;
  }

  let { type, message, onDismiss }: Props = $props();

  // Success toasts use a blue/navy treatment; error toasts a red accent
  // (Component-Level Alignment Rules → Toasts).
  const accent = $derived(
    type === 'success'
      ? 'border-blue-500/40 bg-navy-800/90'
      : 'border-red-500/50 bg-navy-800/90'
  );
  const iconColor = $derived(type === 'success' ? 'text-blue-400' : 'text-red-400');
</script>

<div
  role="alert"
  aria-live="assertive"
  class="pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border {accent} px-4 py-3 shadow-lg backdrop-blur-sm animate-fade-in"
>
  <span class="mt-0.5 shrink-0 {iconColor}" aria-hidden="true">
    {#if type === 'success'}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
        <path fill-rule="evenodd" d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.5a1 1 0 0 1-1.42 0l-3.5-3.5a1 1 0 1 1 1.42-1.408l2.79 2.79 6.79-6.79a1 1 0 0 1 1.414-.006Z" clip-rule="evenodd" />
      </svg>
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
        <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.94 6.94a.75.75 0 0 1 1.06 0L10 7.94l1-1a.75.75 0 1 1 1.06 1.06l-1 1 1 1A.75.75 0 1 1 11 11.06l-1-1-1 1A.75.75 0 1 1 6.94 10l1-1-1-1a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
      </svg>
    {/if}
  </span>

  <p class="flex-1 text-sm text-white">{message}</p>

  <button
    type="button"
    onclick={onDismiss}
    aria-label="Dismiss notification"
    class="shrink-0 rounded text-white/60 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  </button>
</div>

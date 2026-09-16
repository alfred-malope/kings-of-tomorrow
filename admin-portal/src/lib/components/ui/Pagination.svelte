<script lang="ts">
  interface Props {
    /** Whether a next page is available. */
    hasNext: boolean;
    /** Whether a previous page is available. */
    hasPrev: boolean;
    /** Advance to the next page. */
    onNext: () => void;
    /** Go back to the previous page. */
    onPrev: () => void;
    /** Optional label shown between the controls (e.g. "Page 2"). */
    label?: string;
  }

  let { hasNext, hasPrev, onNext, onPrev, label }: Props = $props();

  // Minimum 44x44px tap targets (Requirement 17 / responsive rules).
  const btn =
    'inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-white/20 px-4 text-sm font-semibold uppercase tracking-wider text-white transition-all duration-200 hover:border-blue-400 hover:bg-blue-500/10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-navy-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/20 disabled:hover:bg-transparent';
</script>

<nav class="flex items-center justify-between gap-4" aria-label="Pagination">
  <button type="button" class={btn} onclick={onPrev} disabled={!hasPrev} aria-label="Previous page">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
      <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.08 10l3.71 3.71a.75.75 0 1 1-1.06 1.06l-4.24-4.24a.75.75 0 0 1 0-1.06l4.24-4.24a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
    </svg>
    <span>Prev</span>
  </button>

  {#if label}
    <span class="text-sm text-white/60">{label}</span>
  {/if}

  <button type="button" class={btn} onclick={onNext} disabled={!hasNext} aria-label="Next page">
    <span>Next</span>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
      <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.92 10 7.21 6.29a.75.75 0 1 1 1.06-1.06l4.24 4.24a.75.75 0 0 1 0 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0Z" clip-rule="evenodd" />
    </svg>
  </button>
</nav>

<script lang="ts">
  type Variant = 'card' | 'row' | 'list';

  interface Props {
    /** Which skeleton layout to render. */
    variant?: Variant;
    /** How many skeleton items to render (for `list`/`row`). */
    count?: number;
    /** Optional extra classes applied to the wrapper. */
    class?: string;
  }

  let { variant = 'card', count = 3, class: className = '' }: Props = $props();

  const items = $derived(Array.from({ length: Math.max(1, count) }));
</script>

<!--
  Loading placeholders driven by the shared `skeleton` shimmer class
  (Requirement 17.1). Marked aria-hidden and status-labelled for a11y.
-->
{#if variant === 'card'}
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 {className}" role="status" aria-label="Loading">
    {#each items as _}
      <div class="card-surface p-5">
        <div class="skeleton mb-3 h-3 w-1/2"></div>
        <div class="skeleton h-8 w-3/4"></div>
      </div>
    {/each}
  </div>
{:else if variant === 'row'}
  <div class="space-y-3 {className}" role="status" aria-label="Loading">
    {#each items as _}
      <div class="flex items-center gap-4 rounded-lg border border-white/10 bg-navy-800/40 p-4">
        <div class="skeleton h-10 w-10 rounded-full"></div>
        <div class="flex-1 space-y-2">
          <div class="skeleton h-3 w-1/3"></div>
          <div class="skeleton h-3 w-1/2"></div>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <div class="space-y-2 {className}" role="status" aria-label="Loading">
    {#each items as _}
      <div class="skeleton h-4 w-full"></div>
    {/each}
  </div>
{/if}

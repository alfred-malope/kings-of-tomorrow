<script lang="ts">
  interface Props {
    /** Message describing the empty result. */
    message: string;
    /** Optional call-to-action button label. */
    ctaLabel?: string;
    /** Optional href the CTA links to. */
    ctaHref?: string;
  }

  let { message, ctaLabel, ctaHref }: Props = $props();
</script>

<!-- Empty-result state with optional CTA (Requirement 17.2). -->
<div class="card-surface flex flex-col items-center justify-center px-6 py-14 text-center">
  <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy-700/60 text-blue-400" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-7 w-7">
      <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5 12 3 3.75 7.5m16.5 0L12 12m8.25-4.5v9L12 21m0-9L3.75 7.5m0 0v9L12 21" />
    </svg>
  </div>
  <p class="max-w-sm text-sm text-white/70">{message}</p>
  {#if ctaLabel && ctaHref}
    <a href={ctaHref} class="btn-primary mt-6">{ctaLabel}</a>
  {/if}
</div>

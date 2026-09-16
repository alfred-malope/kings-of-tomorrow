<script lang="ts">
  interface Props {
    /** Human-readable error message. */
    message: string;
    /** Invoked when the user clicks the retry button. */
    onRetry: () => void;
    /** Retry button label. */
    retryLabel?: string;
  }

  let { message, onRetry, retryLabel = 'Retry' }: Props = $props();
</script>

<!-- Inline error state with retry action (Requirement 17.3). -->
<div class="card-surface flex flex-col items-center justify-center px-6 py-14 text-center" role="alert">
  <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-400" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-7 w-7">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.008M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.29 2.25h17.78A1.5 1.5 0 0 0 22.18 18L13.71 3.86a1.5 1.5 0 0 0-2.58 0Z" />
    </svg>
  </div>
  <p class="max-w-sm text-sm text-white/80">{message}</p>
  <button type="button" class="btn-outline mt-6" onclick={onRetry}>{retryLabel}</button>
</div>

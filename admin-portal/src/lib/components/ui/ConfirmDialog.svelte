<script lang="ts">
  interface Props {
    /** Dialog heading. */
    title: string;
    /** Supporting description of the action being confirmed. */
    description?: string;
    /** Label for the confirm button. */
    confirmLabel?: string;
    /** Label for the cancel button. */
    cancelLabel?: string;
    /** Use the gold treatment on confirm instead of the destructive red. */
    variant?: 'danger' | 'gold';
    /** Invoked when the user confirms the action. */
    onConfirm: () => void;
    /** Invoked when the user cancels or dismisses the dialog. */
    onCancel: () => void;
  }

  let {
    title,
    description = '',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel
  }: Props = $props();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!--
  Modal confirmation dialog for destructive actions (Requirement 17.4). The
  panel uses `card-surface`; the backdrop click and Escape both cancel.
-->
<div
  class="fixed inset-0 z-50 flex items-center justify-center p-4"
  role="dialog"
  aria-modal="true"
  aria-labelledby="confirm-title"
>
  <!-- Backdrop -->
  <button
    type="button"
    class="absolute inset-0 h-full w-full cursor-default bg-navy-950/70 backdrop-blur-sm"
    aria-label="Cancel"
    onclick={onCancel}
  ></button>

  <!-- Panel -->
  <div class="card-surface relative z-10 w-full max-w-md p-6 animate-fade-in">
    <h2 id="confirm-title" class="heading-display text-xl text-white">{title}</h2>
    {#if description}
      <p class="mt-2 text-sm text-white/70">{description}</p>
    {/if}

    <div class="mt-6 flex justify-end gap-3">
      <button type="button" class="btn-outline" onclick={onCancel}>{cancelLabel}</button>
      {#if variant === 'gold'}
        <button type="button" class="btn-gold" onclick={onConfirm}>{confirmLabel}</button>
      {:else}
        <button
          type="button"
          onclick={onConfirm}
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all duration-200 hover:bg-red-500 hover:shadow-lg hover:shadow-red-600/30 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-navy-900 active:scale-95"
        >
          {confirmLabel}
        </button>
      {/if}
    </div>
  </div>
</div>

<script lang="ts">
  import { toastStore } from '$lib/stores/toast.store.svelte';
  import Toast from './Toast.svelte';
</script>

<!--
  Fixed top-right toast region (Requirement 4.7). Reads live toasts from the
  toast store and renders one <Toast> per entry. The container is
  pointer-events-none so it never blocks clicks; individual toasts re-enable
  pointer events for their dismiss button.
-->
<div
  class="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2"
  aria-live="polite"
>
  {#each toastStore.toasts as toast (toast.id)}
    <Toast
      type={toast.type}
      message={toast.message}
      onDismiss={() => toastStore.dismiss(toast.id)}
    />
  {/each}
</div>

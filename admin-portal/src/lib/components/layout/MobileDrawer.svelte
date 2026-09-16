<script lang="ts">
  import Sidebar from './Sidebar.svelte';

  interface Props {
    /** Whether the drawer is open (Requirement 4.3). */
    open: boolean;
    /** Invoked when the drawer requests to close (backdrop click, Escape, or navigation). */
    onClose?: () => void;
  }

  let { open, onClose }: Props = $props();

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      onClose?.();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!--
  Slide-out drawer that wraps the Sidebar. Only rendered on viewports < 768px
  (the `md:hidden` wrapper), collapsing the persistent sidebar on mobile
  (Requirement 4.3).
-->
<div class="md:hidden" aria-hidden={!open}>
  <!-- Backdrop -->
  <button
    type="button"
    tabindex={open ? 0 : -1}
    onclick={() => onClose?.()}
    aria-label="Close navigation menu"
    class="fixed inset-0 z-40 bg-navy-950/70 backdrop-blur-sm transition-opacity duration-300
      {open ? 'opacity-100' : 'pointer-events-none opacity-0'}"
  ></button>

  <!-- Sliding panel -->
  <div
    class="fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-out
      {open ? 'translate-x-0' : '-translate-x-full'}"
    role="dialog"
    aria-modal="true"
    aria-label="Navigation menu"
  >
    <Sidebar onNavigate={() => onClose?.()} />
  </div>
</div>

<script lang="ts">
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import TopHeader from '$lib/components/layout/TopHeader.svelte';
  import MobileDrawer from '$lib/components/layout/MobileDrawer.svelte';

  let { children } = $props();

  // Mobile slide-out drawer open/close state (Requirement 4.3).
  let drawerOpen = $state(false);
</script>

<!--
  Admin shell (Requirements 4.1–4.3): a persistent sidebar on md+ viewports, a
  top header with a hamburger toggle, a slide-out drawer on mobile, and the page
  content in the main region.
-->
<div class="flex h-screen overflow-hidden bg-navy-900 text-white">
  <!-- Persistent sidebar on md+; hidden on mobile in favour of the drawer. -->
  <aside class="hidden md:flex">
    <Sidebar />
  </aside>

  <!-- Mobile slide-out drawer (renders only < 768px via its own wrapper). -->
  <MobileDrawer open={drawerOpen} onClose={() => (drawerOpen = false)} />

  <!-- Main column: header + scrollable content. -->
  <div class="flex min-w-0 flex-1 flex-col">
    <TopHeader onToggleDrawer={() => (drawerOpen = !drawerOpen)} />

    <main class="flex-1 overflow-y-auto">
      {@render children?.()}
    </main>
  </div>
</div>

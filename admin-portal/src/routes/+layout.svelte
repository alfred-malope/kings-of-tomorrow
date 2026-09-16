<script lang="ts">
  import '../app.css';
  import { browser } from '$app/environment';
  import { authStore } from '$lib/stores/auth.store.svelte';
  import ToastContainer from '$lib/components/ui/ToastContainer.svelte';

  let { children } = $props();

  // Subscribe to Firebase auth-state changes once, in the browser only, so the
  // reactive auth store stays in sync across the whole app (design:
  // "authStore initialisation ($effect listens to onAuthStateChanged)").
  $effect(() => {
    if (!browser) return;
    const unsubscribe = authStore.init();
    return unsubscribe;
  });
</script>

<!-- Fixed top-right toast region (Requirement 4.7), available on every route. -->
<ToastContainer />

{@render children?.()}

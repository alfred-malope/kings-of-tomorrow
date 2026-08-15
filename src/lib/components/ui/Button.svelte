<script lang="ts">
  export let variant: 'primary' | 'gold' | 'outline' = 'primary';
  export let href: string | null = null;
  export let external: boolean = false;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let type: 'button' | 'submit' = 'button';

  let classMap: Record<string, string> = {
    primary: 'btn-primary',
    gold: 'btn-gold',
    outline: 'btn-outline',
  };

  let sizeMap: Record<string, string> = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };
</script>

{#if href}
  {#if external}
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      class="{classMap[variant]} {sizeMap[size]}"
    >
      <slot />
    </a>
  {:else}
    <a href={href} class="{classMap[variant]} {sizeMap[size]}">
      <slot />
    </a>
  {/if}
{:else}
  <button {type} class="{classMap[variant]} {sizeMap[size]}">
    <slot />
  </button>
{/if}

<script lang="ts">
  export let eyebrow: string = '';
  export let title: string = '';
  export let subtitle: string = '';
  export let align: 'left' | 'center' = 'left';
  export let accent: 'blue' | 'gold' = 'blue';
</script>

<div class="{align === 'center' ? 'text-center mx-auto' : 'text-left'} max-w-2xl">
  {#if eyebrow}
    <p class="text-eyebrow {accent === 'gold' ? '!text-gold-400' : ''} mb-3">
      {eyebrow}
    </p>
  {/if}
  {#if title}
    <h2 class="heading-display text-3xl sm:text-4xl lg:text-5xl text-white">
      {title}
    </h2>
  {/if}
  {#if subtitle}
    <p class="mt-4 text-base sm:text-lg text-white/60 leading-relaxed">
      {subtitle}
    </p>
  {/if}
</div>

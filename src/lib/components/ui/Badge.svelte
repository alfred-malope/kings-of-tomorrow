<script lang="ts">
  export let variant: 'blue' | 'gold' | 'silver' | 'navy' = 'blue';
  export let size: 'sm' | 'md' = 'sm';

  let variantMap: Record<string, string> = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    gold: 'bg-gold-500/15 text-gold-400 border-gold-500/30',
    silver: 'bg-white/10 text-silver-400 border-white/20',
    navy: 'bg-navy-700/50 text-white/80 border-white/10',
  };
</script>

<span
  class="inline-flex items-center rounded-full border font-semibold uppercase tracking-wider {variantMap[variant]} {size === 'sm' ? 'px-3 py-1 text-[0.65rem]' : 'px-4 py-1.5 text-xs'}"
>
  <slot />
</span>

<script lang="ts">
  import type { Player } from '../../data/players';

  export let player: Player;
</script>

<div class="group relative overflow-hidden rounded-xl bg-navy-800 border border-white/10 hover:border-blue-500/40 transition-all duration-300 cursor-pointer">
  <!-- Player image -->
  <div class="relative aspect-[3/4] overflow-hidden">
    <img
      src={player.image}
      alt={player.name}
      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      loading="lazy"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/20 to-transparent"></div>

    <!-- Squad number -->
    <div class="absolute top-3 left-3">
      <span class="heading-display text-3xl text-gold-500 drop-shadow-lg">#{player.number}</span>
    </div>

    <!-- Position badge -->
    <div class="absolute top-3 right-3">
      <span class="text-[0.6rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 backdrop-blur-sm">
        {player.position}
      </span>
    </div>
  </div>

  <!-- Info -->
  <div class="absolute bottom-0 left-0 right-0 p-4">
    <p class="heading-display text-base sm:text-lg text-white leading-tight">{player.name}</p>
    <p class="text-xs uppercase tracking-widest text-white/50 mt-1">{player.position}</p>
  </div>
</div>

<script lang="ts">
  import type { Fixture } from '../../data/fixtures';
  import { formatDate } from '../../data/fixtures';
  import Badge from '../ui/Badge.svelte';

  export let fixture: Fixture;
</script>

<div class="card-surface p-6 sm:p-8 group hover:border-gold-500/30 transition-all duration-300">
  <div class="flex items-center justify-center gap-3 mb-6">
    <Badge variant="gold">Latest Result</Badge>
    <Badge variant="navy">Full Time</Badge>
  </div>

  <!-- Score -->
  <div class="flex items-center justify-between gap-4">
    <!-- Home -->
    <div class="flex flex-col items-center text-center flex-1 min-w-0">
      <img src={fixture.homeLogo} alt={fixture.homeTeam} class="h-14 w-14 sm:h-16 sm:w-16 object-contain mb-2" />
      <p class="heading-display text-xs sm:text-sm text-white truncate w-full">{fixture.homeTeam}</p>
    </div>

    <!-- Score -->
    <div class="flex items-center gap-3 sm:gap-5">
      <span class="heading-display text-4xl sm:text-5xl lg:text-6xl text-white">{fixture.homeScore}</span>
      <span class="heading-display text-2xl sm:text-3xl text-white/30">-</span>
      <span class="heading-display text-4xl sm:text-5xl lg:text-6xl text-white">{fixture.awayScore}</span>
    </div>

    <!-- Away -->
    <div class="flex flex-col items-center text-center flex-1 min-w-0">
      <img src={fixture.awayLogo} alt={fixture.awayTeam} class="h-14 w-14 sm:h-16 sm:w-16 object-contain mb-2" />
      <p class="heading-display text-xs sm:text-sm text-white truncate w-full">{fixture.awayTeam}</p>
    </div>
  </div>

  <!-- Details -->
  <div class="border-t border-white/10 pt-5 mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
    <span>{fixture.competition}</span>
    <span class="text-white/20">|</span>
    <span>{formatDate(fixture.date)}</span>
  </div>

  <!-- Result indicator -->
  {#if fixture.homeScore !== undefined && fixture.awayScore !== undefined}
    {@const isWin = (fixture.isHome && fixture.homeScore > fixture.awayScore) || (!fixture.isHome && fixture.awayScore > fixture.homeScore)}
    {@const isDraw = fixture.homeScore === fixture.awayScore}
    <div class="mt-4 flex justify-center">
      <span class="text-xs font-bold uppercase tracking-widest {isWin ? 'text-blue-400' : isDraw ? 'text-silver-400' : 'text-white/40'}">
        {isWin ? 'K.O.T Win' : isDraw ? 'Draw' : 'K.O.T Loss'}
      </span>
    </div>
  {/if}
</div>

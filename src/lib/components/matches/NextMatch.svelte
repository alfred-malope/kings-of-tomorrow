<script lang="ts">
  import type { Fixture } from '../../data/fixtures';
  import { formatDate, formatDayMonth } from '../../data/fixtures';
  import { club } from '../../data/club';
  import Badge from '../ui/Badge.svelte';

  export let fixture: Fixture;
</script>

<div class="card-surface p-6 sm:p-8 group hover:border-blue-500/30 transition-all duration-300">
  <div class="flex items-center justify-center gap-3 mb-6">
    <Badge variant="blue">Next Match</Badge>
    <Badge variant="navy">{fixture.competition}</Badge>
  </div>

  <!-- Teams -->
  <div class="flex items-center justify-between gap-4 mb-6">
    <!-- Home -->
    <div class="flex flex-col items-center text-center flex-1 min-w-0">
      <img src={fixture.homeLogo} alt={fixture.homeTeam} class="h-16 w-16 sm:h-20 sm:w-20 object-contain mb-2" />
      <p class="heading-display text-sm sm:text-base text-white truncate w-full">{fixture.homeTeam}</p>
    </div>

    <div class="flex flex-col items-center px-2">
      <span class="heading-display text-2xl sm:text-3xl text-gold-500">VS</span>
    </div>

    <!-- Away -->
    <div class="flex flex-col items-center text-center flex-1 min-w-0">
      <img src={fixture.awayLogo} alt={fixture.awayTeam} class="h-16 w-16 sm:h-20 sm:w-20 object-contain mb-2" />
      <p class="heading-display text-sm sm:text-base text-white truncate w-full">{fixture.awayTeam}</p>
    </div>
  </div>

  <!-- Details -->
  <div class="border-t border-white/10 pt-5 space-y-3">
    <div class="flex items-center justify-center gap-2 text-white/80">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-blue-400"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      <span class="text-sm font-semibold">{formatDate(fixture.date)}</span>
    </div>
    <div class="flex items-center justify-center gap-2 text-white/80">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-blue-400"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span class="text-sm font-semibold">{fixture.time} Kick Off</span>
    </div>
    <div class="flex items-center justify-center gap-2 text-white/60">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gold-400"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      <span class="text-sm">{fixture.venue}</span>
    </div>
  </div>

  <!-- Home/Away indicator -->
  <div class="mt-5 flex justify-center">
    <span class="text-xs font-bold uppercase tracking-widest {fixture.isHome ? 'text-blue-400' : 'text-silver-400'}">
      {fixture.isHome ? 'Home' : 'Away'}
    </span>
  </div>
</div>

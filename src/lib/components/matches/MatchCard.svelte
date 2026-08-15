<script lang="ts">
  import type { Fixture } from "../../data/fixtures";
  import { formatDateShort } from "../../data/fixtures";
  import Badge from "../ui/Badge.svelte";

  export let fixture: Fixture;

  $: hasPenaltyScore =
    fixture.homePenaltyScore !== undefined &&
    fixture.awayPenaltyScore !== undefined;
</script>

<div
  class="card-surface p-5 group hover:border-blue-500/30 transition-all duration-300"
>
  <!-- Top row: date + competition -->
  <div class="flex items-center justify-between mb-4">
    <span class="text-xs font-semibold text-white/50 uppercase tracking-wider">
      {formatDateShort(fixture.date)}
    </span>

    <Badge variant="navy" size="sm">
      {fixture.competition}
    </Badge>
  </div>

  <!-- Teams + score/status -->
  <div class="flex items-center justify-between gap-3">
    <!-- Home Team -->
    <div class="flex items-center gap-3 flex-1 min-w-0">
      <img
        src={fixture.homeLogo}
        alt={fixture.homeTeam}
        class="h-10 w-10 object-contain shrink-0"
      />

      <span class="text-sm font-semibold text-white truncate">
        {fixture.homeTeam}
      </span>
    </div>

    <!-- Score / Time -->
    <div class="shrink-0 px-3">
      {#if fixture.status === "result" && fixture.homeScore !== undefined}
        <div class="flex items-center justify-center gap-1.5">
          <span class="heading-display text-xl text-white">
            {fixture.homeScore}
          </span>

          {#if hasPenaltyScore}
            <span class="text-md font-bold text-gold-400">
              ({fixture.homePenaltyScore})
            </span>
          {/if}

          <span class="text-white/30 text-sm mx-1"> - </span>

          <span class="heading-display text-xl text-white">
            {fixture.awayScore}
          </span>

          {#if hasPenaltyScore}
            <span class="text-md font-bold text-gold-400">
              ({fixture.awayPenaltyScore})
            </span>
          {/if}
        </div>
      {:else}
        <span class="text-xs font-bold uppercase text-gold-400">
          {fixture.time}
        </span>
      {/if}
    </div>

    <!-- Away Team -->
    <div class="flex items-center gap-3 flex-1 min-w-0 justify-end">
      <span class="text-sm font-semibold text-white truncate text-right">
        {fixture.awayTeam}
      </span>

      <img
        src={fixture.awayLogo}
        alt={fixture.awayTeam}
        class="h-10 w-10 object-contain shrink-0"
      />
    </div>
  </div>

  <!-- Venue -->
  <div
    class="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40"
  >
    <span>{fixture.venue}</span>

    <span
      class="uppercase tracking-wider {fixture.isHome
        ? 'text-blue-400'
        : 'text-silver-400'}"
    >
      {fixture.isHome ? "Home" : "Away"}
    </span>
  </div>
</div>

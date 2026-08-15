<script lang="ts">
  import SEO from '../lib/components/seo/SEO.svelte';
  import PlayerCard from '../lib/components/squad/PlayerCard.svelte';
  import SectionHeading from '../lib/components/ui/SectionHeading.svelte';
  import Badge from '../lib/components/ui/Badge.svelte';
  import { reveal } from '../lib/actions/reveal';
  import { players, positionGroups } from '../lib/data/players';
  import type { Position } from '../lib/data/players';

  let activeFilter: Position | 'All' = 'All';

  $: filteredPlayers = activeFilter === 'All'
    ? players
    : players.filter((p) => p.position === activeFilter);

  const squadHeroImage = 'https://images.pexels.com/photos/38615473/pexels-photo-38615473.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop';
</script>

<SEO title="Squad | K.O.T FC" description="Meet the players of Kings Of Tomorrow FC — the Kings of the pitch." />

<!-- Page hero -->
<section class="relative pt-24 pb-12 lg:pt-32 lg:pb-16 overflow-hidden">
  <div class="absolute inset-0 z-0">
    <img src={squadHeroImage} alt="K.O.T FC squad" class="w-full h-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-b from-navy-950/90 via-navy-900/85 to-navy-950"></div>
  </div>
  <div class="container-x relative z-10">
    <div use:reveal>
      <Badge variant="blue">First Team</Badge>
      <h1 class="heading-display text-4xl sm:text-5xl lg:text-7xl text-white mt-4">The Squad</h1>
      <p class="mt-4 text-lg text-white/60 max-w-2xl">Meet the players who represent Kings Of Tomorrow FC with pride, passion, and purpose.</p>
    </div>
  </div>
</section>

<!-- Filters + Player grid -->
<section class="section-pad">
  <div class="container-x">
    <!-- Filters -->
    <div class="flex flex-wrap gap-2 mb-10" role="tablist" aria-label="Filter players by position">
      {#each positionGroups as group (group.value)}
        <button
          on:click={() => (activeFilter = group.value)}
          class="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 {activeFilter === group.value
            ? 'bg-blue-500 text-navy-950'
            : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'}"
          role="tab"
          aria-selected={activeFilter === group.value}
        >
          {group.label}
        </button>
      {/each}
    </div>

    <!-- Grid -->
    {#if filteredPlayers.length > 0}
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {#each filteredPlayers as player (player.id)}
          <div use:reveal>
            <PlayerCard {player} />
          </div>
        {/each}
      </div>
    {:else}
      <div class="card-surface p-12 text-center">
        <p class="heading-display text-lg text-white/70 mb-2">No Players In This Category</p>
        <p class="text-sm text-white/40">Check back soon for updates to the K.O.T FC squad.</p>
      </div>
    {/if}
  </div>
</section>

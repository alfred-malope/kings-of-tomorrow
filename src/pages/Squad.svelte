<script lang="ts">
  import SEO from '../lib/components/seo/SEO.svelte';
  import PlayerCard from '../lib/components/squad/PlayerCard.svelte';
  import SectionHeading from '../lib/components/ui/SectionHeading.svelte';
  import Badge from '../lib/components/ui/Badge.svelte';
  import { reveal } from '../lib/actions/reveal';
  import { club } from '../lib/data/club';
  import { players, positionGroups } from '../lib/data/players';
  import type { Player, Position } from '../lib/data/players';

  let activeFilter: Position | 'All' = 'All';
  let selectedPlayer: Player | null = null;

  $: filteredPlayers = activeFilter === 'All'
    ? players
    : players.filter((p) => p.position === activeFilter);

  const squadHeroImage = 'https://images.pexels.com/photos/38615473/pexels-photo-38615473.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop';

  function closeProfileOnEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') selectedPlayer = null;
  }
</script>

<svelte:window on:keydown={closeProfileOnEscape} />

<SEO
  title={`${club.name} Roster | ${club.league} South Africa`}
  description={`Explore the Kings Of Tomorrow FC roster, player positions, and first-team squad competing in the ${club.league} in South Africa.`}
/>

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
          type="button"
          on:click={() => (activeFilter = group.value)}
          class="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 {activeFilter === group.value
            ? 'bg-blue-500 text-navy-950'
            : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'}"
          role="tab"
          aria-selected={activeFilter === group.value}
          aria-controls="squad-player-grid"
        >
          {group.label}
        </button>
      {/each}
    </div>

    <!-- Grid -->
    {#if filteredPlayers.length > 0}
      <div id="squad-player-grid" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6" role="tabpanel" tabindex="0">
        {#each filteredPlayers as player (player.id)}
          <div use:reveal>
            <PlayerCard {player} onSelect={(selected) => (selectedPlayer = selected)} />
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

{#if selectedPlayer}
  <div
    class="fixed inset-0 z-[70] flex items-center justify-center bg-navy-950/85 p-4 backdrop-blur-sm"
    role="presentation"
    on:click={(event) => event.target === event.currentTarget && (selectedPlayer = null)}
  >
    <section
      class="relative grid w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-navy-800 shadow-2xl shadow-black/50 sm:grid-cols-[0.8fr_1.2fr]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-profile-name"
    >
      <button
        type="button"
        class="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-navy-950/70 text-2xl text-white/70 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Close player profile"
        on:click={() => (selectedPlayer = null)}
      >
        &times;
      </button>

      <img src={selectedPlayer.image} alt={selectedPlayer.name} class="h-72 w-full object-cover sm:h-full" />
      <div class="flex flex-col justify-center p-6 sm:p-8">
        <p class="text-eyebrow">First team profile</p>
        <p class="heading-display mt-3 text-6xl text-gold-500">#{selectedPlayer.number}</p>
        <h2 id="player-profile-name" class="heading-display mt-2 text-3xl text-white sm:text-4xl">{selectedPlayer.name}</h2>
        <div class="mt-4 flex flex-wrap gap-2">
          <Badge variant="blue">{selectedPlayer.position}</Badge>
          {#if selectedPlayer.nationality}<Badge variant="navy">{selectedPlayer.nationality}</Badge>{/if}
          {#if selectedPlayer.age}<Badge variant="navy">Age {selectedPlayer.age}</Badge>{/if}
        </div>
        <p class="mt-6 text-base leading-relaxed text-white/60">
          {selectedPlayer.bio || 'Player profile details coming soon. Follow K.O.T FC for the latest from the squad.'}
        </p>
      </div>
    </section>
  </div>
{/if}

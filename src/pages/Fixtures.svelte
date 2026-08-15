<script lang="ts">
  import SEO from '../lib/components/seo/SEO.svelte';
  import MatchCard from '../lib/components/matches/MatchCard.svelte';
  import SectionHeading from '../lib/components/ui/SectionHeading.svelte';
  import Badge from '../lib/components/ui/Badge.svelte';
  import { reveal } from '../lib/actions/reveal';
  import { fixtures } from '../lib/data/fixtures';

  type Tab = 'upcoming' | 'results' | 'all';
  let activeTab: Tab = 'upcoming';

  $: filteredFixtures = activeTab === 'all'
    ? [...fixtures].sort((a, b) => b.date.localeCompare(a.date))
    : activeTab === 'upcoming'
      ? fixtures.filter((f) => f.status === 'upcoming').sort((a, b) => a.date.localeCompare(b.date))
      : fixtures.filter((f) => f.status === 'result').sort((a, b) => b.date.localeCompare(a.date));

  const tabs: { label: string; value: Tab }[] = [
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Results', value: 'results' },
    { label: 'All', value: 'all' },
  ];

  const fixturesHeroImage = 'https://images.pexels.com/photos/30651230/pexels-photo-30651230.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop';
</script>

<SEO title="Fixtures & Results | K.O.T FC" description="Upcoming matches, results, and fixtures for Kings Of Tomorrow FC." />

<!-- Page hero -->
<section class="relative pt-24 pb-12 lg:pt-32 lg:pb-16 overflow-hidden">
  <div class="absolute inset-0 z-0">
    <img src={fixturesHeroImage} alt="K.O.T FC stadium" class="w-full h-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-b from-navy-950/90 via-navy-900/85 to-navy-950"></div>
  </div>
  <div class="container-x relative z-10">
    <div use:reveal>
      <Badge variant="gold">Match Centre</Badge>
      <h1 class="heading-display text-4xl sm:text-5xl lg:text-7xl text-white mt-4">Fixtures & Results</h1>
      <p class="mt-4 text-lg text-white/60 max-w-2xl">Follow K.O.T FC through the season — every match, every result, every moment.</p>
    </div>
  </div>
</section>

<!-- Tabs + Fixtures -->
<section class="section-pad">
  <div class="container-x">
    <!-- Tabs -->
    <div class="flex flex-wrap gap-2 mb-10" role="tablist" aria-label="Filter fixtures">
      {#each tabs as tab (tab.value)}
        <button
          on:click={() => (activeTab = tab.value)}
          class="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 {activeTab === tab.value
            ? 'bg-blue-500 text-navy-950'
            : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'}"
          role="tab"
          aria-selected={activeTab === tab.value}
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <!-- Fixture list -->
    {#if filteredFixtures.length > 0}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {#each filteredFixtures as fixture (fixture.id)}
          <div use:reveal>
            <MatchCard {fixture} />
          </div>
        {/each}
      </div>
    {:else}
      <div class="card-surface p-12 text-center">
        <p class="heading-display text-lg text-white/70 mb-2">No Upcoming Fixtures</p>
        <p class="text-sm text-white/40">Check back soon for the next K.O.T FC match.</p>
      </div>
    {/if}
  </div>
</section>

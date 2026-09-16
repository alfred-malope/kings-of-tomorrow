<script lang="ts">
  import { onMount } from 'svelte';
  import Hero from '../lib/components/hero/Hero.svelte';
  import NextMatch from '../lib/components/matches/NextMatch.svelte';
  import ResultCard from '../lib/components/matches/ResultCard.svelte';
  import MatchCard from '../lib/components/matches/MatchCard.svelte';
  import PlayerCard from '../lib/components/squad/PlayerCard.svelte';
  import NewsCard from '../lib/components/news/NewsCard.svelte';
  import GalleryAlbumCard from '../lib/components/gallery/GalleryAlbumCard.svelte';
  import SectionHeading from '../lib/components/ui/SectionHeading.svelte';
  import Badge from '../lib/components/ui/Badge.svelte';
  import SEO from '../lib/components/seo/SEO.svelte';
  import { reveal } from '../lib/actions/reveal';
  import { club } from '../lib/data/club';
  import { fixtures as fallbackFixtures, loadPublicFixtures, type Fixture } from '../lib/data/fixtures';
  import { loadPublicPlayers, type Player } from '../lib/data/players';
  import { loadPublicNews, news as fallbackNews, type NewsArticle } from '../lib/data/news';
  import { galleryAlbums as fallbackAlbums } from '../lib/gallery';
  import type { GalleryAlbum } from '../lib/gallery/types';
  import { router } from '../lib/router';

  let fixtures: Fixture[] = fallbackFixtures;
  let featuredPlayers: Player[] = [];
  let latestNews: NewsArticle[] = fallbackNews.slice(0, 3);
  let galleryAlbums: GalleryAlbum[] = fallbackAlbums;
  let nextFixture: Fixture | undefined = getNextFixture(fallbackFixtures);
  let latestResult: Fixture | undefined = getLatestResult(fallbackFixtures);
  let stats = buildStats(fallbackFixtures);

  $: previewAlbums = galleryAlbums.slice(0, 3);

  function getNextFixture(items: Fixture[]): Fixture | undefined {
    return items
      .filter((fixture) => fixture.status === 'upcoming')
      .sort((left, right) => {
        if (left.date === 'TBC') return 1;
        if (right.date === 'TBC') return -1;
        return left.date.localeCompare(right.date);
      })[0];
  }

  function getLatestResult(items: Fixture[]): Fixture | undefined {
    return items
      .filter((fixture) => fixture.status === 'result')
      .sort((left, right) => right.date.localeCompare(left.date))[0];
  }

  function buildStats(items: Fixture[]) {
    const results = items.filter(
      (fixture) => fixture.status === 'result' && fixture.homeScore !== undefined && fixture.awayScore !== undefined
    );
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goals = 0;

    for (const result of results) {
      const kotScore = result.isHome ? result.homeScore! : result.awayScore!;
      const opponentScore = result.isHome ? result.awayScore! : result.homeScore!;
      goals += kotScore;
      if (kotScore > opponentScore) wins += 1;
      else if (kotScore === opponentScore) draws += 1;
      else losses += 1;
    }

    return [
      { label: 'Matches', value: results.length, accent: 'blue' },
      { label: 'Wins', value: wins, accent: 'gold' },
      { label: 'Draws', value: draws, accent: 'silver' },
      { label: 'Losses', value: losses, accent: 'white' },
      { label: 'Goals', value: goals, accent: 'blue' },
    ];
  }

  onMount(async () => {
    const [fixturesResult, playersResult, newsResult] = await Promise.allSettled([
      loadPublicFixtures(),
      loadPublicPlayers(),
      loadPublicNews(),
    ]);

    if (fixturesResult.status === 'fulfilled') {
      fixtures = fixturesResult.value;
      nextFixture = getNextFixture(fixtures);
      latestResult = getLatestResult(fixtures);
      stats = buildStats(fixtures);
    }
    if (playersResult.status === 'fulfilled') featuredPlayers = playersResult.value.slice(0, 4);
    if (newsResult.status === 'fulfilled') latestNews = newsResult.value.slice(0, 3);
  });

  function navigate(path: string) {
    router.navigate(path);
  }

  const clubSchema = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: club.name,
    alternateName: club.shortName,
    url: 'https://kingsoftomorrowfc.co.za/',
    logo: 'https://kingsoftomorrowfc.co.za' + club.logo,
    foundingDate: String(club.founded),
    sport: 'Football',
    location: {
      '@type': 'Place',
      name: club.location,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'ZA',
      },
    },
    memberOf: {
      '@type': 'SportsOrganization',
      name: club.league,
    },
  };
</script>

<SEO
  title="Kings Of Tomorrow FC | Official Website"
  description="Welcome to Kings Of Tomorrow FC — One Team. One Vision. One Future."
  structuredData={clubSchema}
/>

<!-- Hero -->
<Hero />

<!-- Next Match + Latest Result -->
<section class="section-pad relative">
  <div class="container-x">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      {#if nextFixture}
        <div use:reveal>
          <NextMatch fixture={nextFixture} />
        </div>
      {/if}
      {#if latestResult}
        <div use:reveal>
          <ResultCard fixture={latestResult} />
        </div>
      {/if}
    </div>
  </div>
</section>

<!-- Statistics -->
<section class="py-16 lg:py-20 bg-navy-950/50 border-y border-white/5">
  <div class="container-x">
    <div use:reveal>
      <SectionHeading eyebrow="Club Statistics" title="The Numbers" align="center" />
    </div>
    <div class="mt-10 grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6">
      {#each stats as stat, i (stat.label)}
        <div
          class="text-center card-surface p-5 sm:p-6 hover:border-blue-500/30 transition-all duration-300"
          use:reveal
        >
          <p class="heading-display text-4xl sm:text-5xl {stat.accent === 'gold' ? 'text-gold-500' : stat.accent === 'silver' ? 'text-silver-400' : stat.accent === 'white' ? 'text-white' : 'text-blue-400'}">{stat.value}</p>
          <p class="mt-2 text-xs sm:text-sm uppercase tracking-widest text-white/50">{stat.label}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Squad Preview -->
<section class="section-pad">
  <div class="container-x">
    <div class="flex items-end justify-between mb-10 flex-wrap gap-4">
      <div use:reveal>
        <SectionHeading eyebrow="The Squad" title="Meet The Kings" subtitle="The players who wear the K.O.T badge with pride." />
      </div>
      <button on:click={() => navigate('/squad')} class="btn-outline !text-xs">
        View Full Squad &rarr;
      </button>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {#each featuredPlayers as player, i (player.id)}
        <div use:reveal>
          <PlayerCard {player} />
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- News Preview -->
<section class="py-16 lg:py-24 bg-navy-950/50 border-y border-white/5">
  <div class="container-x">
    <div class="flex items-end justify-between mb-10 flex-wrap gap-4">
      <div use:reveal>
        <SectionHeading eyebrow="Latest News" title="From The Pitch" />
      </div>
      <button on:click={() => navigate('/news')} class="btn-outline !text-xs">
        All News &rarr;
      </button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
      {#each latestNews as article, i (article.slug)}
        <div use:reveal>
          <NewsCard article={article} />
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Gallery Preview -->
<section class="section-pad">
  <div class="container-x">
    <div class="flex items-end justify-between mb-10 flex-wrap gap-4">
      <div use:reveal>
        <SectionHeading eyebrow="Gallery" title="Latest Photos" />
      </div>
      {#if galleryAlbums.length > 0}
        <button on:click={() => navigate('/gallery')} class="btn-outline !text-xs">
          All Galleries &rarr;
        </button>
      {/if}
    </div>
    {#if previewAlbums.length > 0}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {#each previewAlbums as album (album.slug)}
          <div use:reveal>
            <GalleryAlbumCard {album} />
          </div>
        {/each}
      </div>
    {:else}
      <div class="card-surface p-12 text-center">
        <p class="heading-display text-lg text-white/70 mb-2">No Gallery Photos Yet</p>
        <p class="text-sm text-white/40">Match photos and club moments will appear here soon.</p>
      </div>
    {/if}
  </div>
</section>

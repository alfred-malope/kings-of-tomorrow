<script lang="ts">
  import SEO from '../lib/components/seo/SEO.svelte';
  import NewsCard from '../lib/components/news/NewsCard.svelte';
  import Badge from '../lib/components/ui/Badge.svelte';
  import { reveal } from '../lib/actions/reveal';
  import { news } from '../lib/data/news';
  import type { NewsCategory } from '../lib/data/news';

  const categories: (NewsCategory | 'All')[] = ['All', 'Match Report', 'Team News', 'Training', 'Club News', 'Announcement'];
  let activeCategory: NewsCategory | 'All' = 'All';

  $: filteredNews = activeCategory === 'All'
    ? news
    : news.filter((a) => a.category === activeCategory);

  const newsHeroImage = 'https://images.pexels.com/photos/32179165/pexels-photo-32179165.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop';
</script>

<SEO title="News | K.O.T FC" description="The latest news, match reports, and updates from Kings Of Tomorrow FC." />

<!-- Page hero -->
<section class="relative pt-24 pb-12 lg:pt-32 lg:pb-16 overflow-hidden">
  <div class="absolute inset-0 z-0">
    <img src={newsHeroImage} alt="K.O.T FC news" class="w-full h-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-b from-navy-950/90 via-navy-900/85 to-navy-950"></div>
  </div>
  <div class="container-x relative z-10">
    <div use:reveal>
      <Badge variant="blue">Latest Updates</Badge>
      <h1 class="heading-display text-4xl sm:text-5xl lg:text-7xl text-white mt-4">News</h1>
      <p class="mt-4 text-lg text-white/60 max-w-2xl">Match reports, team news, and club announcements from Kings Of Tomorrow FC.</p>
    </div>
  </div>
</section>

<!-- Category filters + News grid -->
<section class="section-pad">
  <div class="container-x">
    <!-- Category filters -->
    <div class="flex flex-wrap gap-2 mb-10">
      {#each categories as cat (cat)}
        <button
          on:click={() => (activeCategory = cat)}
          class="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 {activeCategory === cat
            ? 'bg-blue-500 text-navy-950'
            : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'}"
        >
          {cat}
        </button>
      {/each}
    </div>

    <!-- News grid -->
    {#if filteredNews.length > 0}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {#each filteredNews as article (article.slug)}
          <div use:reveal>
            <NewsCard {article} />
          </div>
        {/each}
      </div>
    {:else}
      <div class="card-surface p-12 text-center">
        <p class="heading-display text-lg text-white/70 mb-2">No Articles Found</p>
        <p class="text-sm text-white/40">There are no articles in this category yet. Check back soon.</p>
      </div>
    {/if}
  </div>
</section>

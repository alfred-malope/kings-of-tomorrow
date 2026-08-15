<script lang="ts">
  import SEO from '../lib/components/seo/SEO.svelte';
  import NewsCard from '../lib/components/news/NewsCard.svelte';
  import Badge from '../lib/components/ui/Badge.svelte';
  import Button from '../lib/components/ui/Button.svelte';
  import { reveal } from '../lib/actions/reveal';
  import { getArticle, getRelatedArticles, formatDateLong } from '../lib/data/news';
  import { router } from '../lib/router';

  export let slug: string;

  const article = getArticle(slug);
  const related = article ? getRelatedArticles(slug) : [];
</script>

{#if article}
  <SEO title={article.title} description={article.excerpt} image={article.image} type="article" />

  <!-- Article hero -->
  <section class="relative pt-24 pb-12 lg:pt-32 lg:pb-16 overflow-hidden">
    <div class="absolute inset-0 z-0">
      <img src={article.image} alt={article.title} class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-b from-navy-950/90 via-navy-900/80 to-navy-950"></div>
    </div>
    <div class="container-narrow relative z-10">
      <div use:reveal>
        <button on:click={() => router.navigate('/news')} class="text-xs text-blue-400 hover:text-blue-300 uppercase tracking-widest mb-4 inline-flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Back to News
        </button>
        <Badge variant="blue">{article.category}</Badge>
        <h1 class="heading-display text-3xl sm:text-4xl lg:text-5xl text-white mt-4 leading-tight">{article.title}</h1>
        <div class="mt-4 flex items-center gap-4 text-sm text-white/50">
          <span>{formatDateLong(article.date)}</span>
          <span>&middot;</span>
          <span>{article.readTime} min read</span>
          <span>&middot;</span>
          <span>{article.author}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Article content -->
  <section class="py-12 lg:py-20">
    <div class="container-narrow">
      <div class="prose prose-invert prose-lg max-w-none prose-p:text-white/70 prose-headings:text-white prose-a:text-blue-400" use:reveal>
        {#each article.content as paragraph}
          <p>{paragraph}</p>
        {/each}
      </div>
    </div>
  </section>

  <!-- Related news -->
  {#if related.length > 0}
    <section class="py-12 lg:py-20 bg-navy-950/50 border-t border-white/5">
      <div class="container-x">
        <h2 class="heading-display text-2xl lg:text-3xl text-white mb-8" use:reveal>Related News</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {#each related as rel (rel.slug)}
            <div use:reveal>
              <NewsCard article={rel} />
            </div>
          {/each}
        </div>
      </div>
    </section>
  {/if}
{:else}
  <SEO title="Article Not Found | K.O.T FC" description="The requested article could not be found." />
  <section class="min-h-[60vh] flex items-center justify-center pt-24">
    <div class="container-x text-center">
      <div use:reveal>
        <p class="heading-display text-6xl text-white/20 mb-4">404</p>
        <h1 class="heading-display text-2xl text-white mb-2">Article Not Found</h1>
        <p class="text-white/50 mb-8">The article you're looking for doesn't exist or has been moved.</p>
        <Button variant="primary" href="/news">Back to News</Button>
      </div>
    </div>
  </section>
{/if}

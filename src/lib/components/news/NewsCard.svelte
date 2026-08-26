<script lang="ts">
  import type { NewsArticle } from '../../data/news';
  import { formatDateLong } from '../../data/news';
  import { router } from '../../router';

  export let article: NewsArticle;
  export let featured: boolean = false;

  function openArticle() {
    router.navigate(`/news/${article.slug}`);
  }
</script>

<div
  class="group cursor-pointer {featured ? 'lg:flex lg:gap-6' : ''}"
  on:click={openArticle}
  on:keydown={(e) => e.key === 'Enter' && openArticle()}
  role="link"
  tabindex="0"
  aria-label={article.title}
>
  <div class="relative overflow-hidden rounded-xl {featured ? 'lg:w-1/2 aspect-video lg:aspect-auto' : 'aspect-video'} mb-4">
    <img
      src={article.image}
      alt={article.title}
      class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      loading="lazy"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-navy-900/60 to-transparent"></div>
    <div class="absolute top-3 left-3">
      <span class="text-[0.65rem] font-bold uppercase tracking-wider px-3 py-1.5 rounded bg-blue-500 text-navy-950">
        {article.category}
      </span>
    </div>
  </div>

  <div class="{featured ? 'lg:w-1/2 lg:flex lg:flex-col lg:justify-center' : ''}">
    <p class="text-xs text-white/40 uppercase tracking-wider mb-2">
      {formatDateLong(article.date)} &middot; {article.readTime} min read
    </p>
    <h3 class="heading-display {featured ? 'text-2xl lg:text-3xl' : 'text-lg'} text-white leading-tight group-hover:text-blue-400 transition-colors duration-200">
      {article.title}
    </h3>
    <p class="mt-3 text-sm text-white/55 leading-relaxed line-clamp-3">
      {article.excerpt}
    </p>
    <p class="mt-4 text-xs font-bold uppercase tracking-widest text-blue-400 group-hover:text-blue-300 transition-colors">
      Read More &rarr;
    </p>
  </div>
</div>

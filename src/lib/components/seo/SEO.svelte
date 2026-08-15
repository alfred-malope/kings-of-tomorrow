<script lang="ts">
  import { club } from '../../data/club';

  export let title: string;
  export let description: string = club.motto;
  export let image: string = '';
  export let type: string = 'website';

  const fullTitle = title.includes(club.shortName) ? title : `${title} | ${club.shortName}`;
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const ogImage = image || `${siteUrl}${club.logo}`;
</script>

<!-- svelte-ignore a11y-html-has-lang -->
<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={currentUrl} />

  <meta property="og:type" content={type} />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={currentUrl} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:site_name" content={club.name} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={fullTitle} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={ogImage} />
</svelte:head>

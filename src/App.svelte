<script lang="ts">
  import { router, matchRoute } from './lib/router';
  import Navbar from './lib/components/layout/Navbar.svelte';
  import MobileMenu from './lib/components/layout/MobileMenu.svelte';
  import Footer from './lib/components/layout/Footer.svelte';

  import Home from './pages/Home.svelte';
  import About from './pages/About.svelte';
  import Squad from './pages/Squad.svelte';
  import Fixtures from './pages/Fixtures.svelte';
  import News from './pages/News.svelte';
  import NewsArticle from './pages/NewsArticle.svelte';
  import Gallery from './pages/Gallery.svelte';
  import GalleryAlbum from './pages/GalleryAlbum.svelte';
  import Contact from './pages/Contact.svelte';

  let currentPath = '/';
  let params: Record<string, string> = {};

  router.subscribe((r) => {
    currentPath = r.path;
    params = r.params;
  });

  function computeRoute(path: string): { component: any; params: Record<string, string> } {
    // Check dynamic routes first
    const newsMatch = matchRoute('/news/:slug', path);
    if (newsMatch) return { component: NewsArticle, params: newsMatch };

    const galleryMatch = matchRoute('/gallery/:slug', path);
    if (galleryMatch) return { component: GalleryAlbum, params: galleryMatch };

    // Static routes
    const staticRoutes: Record<string, any> = {
      '/': Home,
      '/about': About,
      '/squad': Squad,
      '/fixtures': Fixtures,
      '/news': News,
      '/gallery': Gallery,
      '/contact': Contact,
    };

    if (staticRoutes[path]) {
      return { component: staticRoutes[path], params: {} };
    }

    return { component: null, params: {} };
  }

  $: routeResult = computeRoute(currentPath);
  $: CurrentPage = routeResult.component;
  $: routeParams = routeResult.params;
</script>

<div class="flex min-h-screen flex-col bg-navy-900">
  <Navbar />
  <MobileMenu />

  <main class="flex-1">
    {#if CurrentPage}
      {#if CurrentPage === NewsArticle}
        <svelte:component this={CurrentPage} slug={routeParams.slug} />
      {:else if CurrentPage === GalleryAlbum}
        <svelte:component this={CurrentPage} slug={routeParams.slug} />
      {:else}
        <svelte:component this={CurrentPage} />
      {/if}
    {:else}
      <section class="min-h-[70vh] flex items-center justify-center pt-24">
        <div class="container-x text-center">
          <p class="heading-display text-7xl sm:text-9xl text-white/10 mb-4">404</p>
          <h1 class="heading-display text-2xl sm:text-3xl text-white mb-3">Page Not Found</h1>
          <p class="text-white/50 mb-8 max-w-md mx-auto">The page you're looking for doesn't exist. Let's get you back to the home of the Kings.</p>
          <a href="/" class="btn-primary inline-flex">Back to Home</a>
        </div>
      </section>
    {/if}
  </main>

  <Footer />
</div>

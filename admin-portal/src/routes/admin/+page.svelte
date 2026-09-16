<script lang="ts">
  import { browser } from '$app/environment';
  import { db } from '$lib/firebase/client';
  import { getPlayers } from '$lib/repositories/players.repository';
  import { getFixtures } from '$lib/repositories/fixtures.repository';
  import { getResults } from '$lib/repositories/results.repository';
  import { getNews } from '$lib/repositories/news.repository';
  import { getAlbums } from '$lib/repositories/gallery.repository';
  import { getResultLabel, type ResultLabel } from '$lib/utils/result-label';
  import type { Fixture, NewsArticle, Result } from '$lib/types/firestore.types';
  import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';
  import ErrorState from '$lib/components/ui/ErrorState.svelte';

  /**
   * Dashboard overview (Requirement 5).
   *
   * On mount (browser-only, via `$effect`) all dashboard queries run in
   * parallel through `Promise.all`. Each of the four data sections tracks its
   * own loading/error state so a single failing query surfaces an inline
   * `<ErrorState>` with a retry button for that section only (Req 5.6, 5.7)
   * while the others keep rendering.
   */

  type SectionState<T> = {
    loading: boolean;
    error: boolean;
    data: T;
  };

  type Stats = {
    activePlayers: number;
    upcomingFixtures: number;
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    publishedNews: number;
    albums: number;
  };

  const emptyStats: Stats = {
    activePlayers: 0,
    upcomingFixtures: 0,
    matchesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    publishedNews: 0,
    albums: 0
  };

  let stats = $state<SectionState<Stats>>({ loading: true, error: false, data: emptyStats });
  let fixtures = $state<SectionState<Fixture[]>>({ loading: true, error: false, data: [] });
  let results = $state<SectionState<Result[]>>({ loading: true, error: false, data: [] });
  let news = $state<SectionState<NewsArticle[]>>({ loading: true, error: false, data: [] });

  /** Number of results fetched to compute aggregate match statistics. */
  const STATS_RESULTS_LIMIT = 20;

  /**
   * Derive Win/Draw/Loss counts from a list of results (K.O.T FC perspective).
   * Match stats are computed from the available results; with pagination this
   * reflects the most recent page rather than all-time totals.
   */
  function computeMatchStats(list: Result[]): {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
  } {
    let wins = 0;
    let draws = 0;
    let losses = 0;
    for (const r of list) {
      const label: ResultLabel = getResultLabel(
        r.homeTeam,
        r.awayTeam,
        r.homeScore,
        r.awayScore,
        r.homePenaltyScore,
        r.awayPenaltyScore
      );
      if (label === 'Win') wins++;
      else if (label === 'Draw') draws++;
      else losses++;
    }
    return { matchesPlayed: list.length, wins, draws, losses };
  }

  /**
   * Loads all dashboard data in parallel. Each section's success/failure is
   * handled independently so one failed query does not blank the whole page.
   */
  async function load(): Promise<void> {
    stats = { ...stats, loading: true, error: false };
    fixtures = { ...fixtures, loading: true, error: false };
    results = { ...results, loading: true, error: false };
    news = { ...news, loading: true, error: false };

    const [playersRes, fixturesRes, resultsRes, newsRes, albumsRes] = await Promise.allSettled([
      getPlayers(db, { status: 'active' }),
      getFixtures(db, { status: 'scheduled' }, 5),
      getResults(db, STATS_RESULTS_LIMIT),
      getNews(db, { status: 'published' }, 3),
      getAlbums(db)
    ]);

    // ── Fixtures list (next 5, date ascending — Req 5.2) ──
    if (fixturesRes.status === 'fulfilled') {
      fixtures = { loading: false, error: false, data: fixturesRes.value.fixtures.slice(0, 5) };
    } else {
      fixtures = { loading: false, error: true, data: [] };
    }

    // ── Results list (5 most recent, date descending — Req 5.3) ──
    if (resultsRes.status === 'fulfilled') {
      results = { loading: false, error: false, data: resultsRes.value.results.slice(0, 5) };
    } else {
      results = { loading: false, error: true, data: [] };
    }

    // ── News list (3 most recently published — Req 5.4) ──
    if (newsRes.status === 'fulfilled') {
      news = { loading: false, error: false, data: newsRes.value.articles.slice(0, 3) };
    } else {
      news = { loading: false, error: true, data: [] };
    }

    // ── Statistics cards (Req 5.1) ──
    // The stats card grid draws on players, fixtures, results, news, and
    // albums. It errors only if every underlying query failed; otherwise it
    // shows the counts it could compute.
    const anyStatFulfilled =
      playersRes.status === 'fulfilled' ||
      fixturesRes.status === 'fulfilled' ||
      resultsRes.status === 'fulfilled' ||
      newsRes.status === 'fulfilled' ||
      albumsRes.status === 'fulfilled';

    if (!anyStatFulfilled) {
      stats = { loading: false, error: true, data: emptyStats };
    } else {
      const matchStats =
        resultsRes.status === 'fulfilled'
          ? computeMatchStats(resultsRes.value.results)
          : { matchesPlayed: 0, wins: 0, draws: 0, losses: 0 };

      stats = {
        loading: false,
        error: false,
        data: {
          activePlayers:
            playersRes.status === 'fulfilled' ? playersRes.value.players.length : 0,
          upcomingFixtures:
            fixturesRes.status === 'fulfilled' ? fixturesRes.value.fixtures.length : 0,
          matchesPlayed: matchStats.matchesPlayed,
          wins: matchStats.wins,
          draws: matchStats.draws,
          losses: matchStats.losses,
          publishedNews: newsRes.status === 'fulfilled' ? newsRes.value.articles.length : 0,
          albums: albumsRes.status === 'fulfilled' ? albumsRes.value.length : 0
        }
      };
    }
  }

  // Kick off the data load once, in the browser only (Req 5.6).
  let started = false;
  $effect(() => {
    if (browser && !started) {
      started = true;
      void load();
    }
  });

  /** Statistics card definitions, derived from the loaded stats. */
  const statCards = $derived([
    { label: 'Active Players', value: stats.data.activePlayers },
    { label: 'Upcoming Fixtures', value: stats.data.upcomingFixtures },
    { label: 'Matches Played', value: stats.data.matchesPlayed },
    { label: 'Wins', value: stats.data.wins },
    { label: 'Draws', value: stats.data.draws },
    { label: 'Losses', value: stats.data.losses },
    { label: 'Published News', value: stats.data.publishedNews },
    { label: 'Gallery Albums', value: stats.data.albums }
  ]);

  const quickActions = [
    { label: 'Add Player', href: '/admin/players/new' },
    { label: 'Add Fixture', href: '/admin/fixtures/new' },
    { label: 'Add News', href: '/admin/news/new' },
    { label: 'Upload Photos', href: '/admin/gallery' }
  ];

  /**
   * Formats a fixture `date` (ISO string or the literal `'TBC'`) for display.
   */
  function formatFixtureDate(date: string): string {
    if (!date || date === 'TBC') return 'TBC';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Formats a Firestore timestamp-like value (`{ toDate() }`), a `Date`, an ISO
   * string, or epoch millis into a readable date. Returns an em dash when the
   * value cannot be interpreted (e.g. an unresolved `serverTimestamp()`).
   */
  function formatTimestamp(value: unknown): string {
    let date: Date | null = null;
    if (value && typeof value === 'object' && 'toDate' in value) {
      const d = (value as { toDate: () => Date }).toDate();
      date = d instanceof Date ? d : null;
    } else if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      const d = new Date(value);
      date = Number.isNaN(d.getTime()) ? null : d;
    } else if (typeof value === 'number') {
      date = new Date(value);
    }
    if (!date || Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  /** Colour treatment for a result label chip. */
  function labelClasses(label: ResultLabel): string {
    if (label === 'Win') return 'bg-blue-500/15 text-blue-400';
    if (label === 'Loss') return 'bg-red-500/15 text-red-400';
    return 'bg-silver-400/15 text-silver-200';
  }
</script>

<svelte:head>
  <title>Dashboard — K.O.T FC Admin</title>
</svelte:head>

<div class="container-x py-7 sm:py-9">
  <header class="relative mb-9 overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-[#0c2b47] via-navy-800/90 to-navy-900 p-6 shadow-2xl shadow-black/20 sm:p-8">
    <div class="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[22px] border-blue-400/10"></div>
    <div class="relative flex flex-wrap items-end justify-between gap-5">
      <div>
        <p class="text-eyebrow">Club operations</p>
        <h1 class="heading-display mt-2 text-4xl text-white sm:text-5xl">Good to see you</h1>
        <p class="mt-3 max-w-xl text-sm text-white/60">Keep the Kings Of Tomorrow FC story moving. Manage the squad, match centre, news, and gallery from one place.</p>
      </div>
      <div class="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300">
        <span class="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]"></span>
        Systems operational
      </div>
    </div>
  </header>

  <!-- ── Statistics cards (Req 5.1) ── -->
  <section class="mb-10" aria-label="Club statistics">
    {#if stats.loading}
      <SkeletonLoader variant="card" count={8} />
    {:else if stats.error}
      <ErrorState message="We couldn't load the club statistics." onRetry={load} />
    {:else}
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {#each statCards as card}
            <div class="card-surface group p-5 transition-transform duration-200 hover:-translate-y-0.5">
              <p class="text-eyebrow text-white/45">{card.label}</p>
              <p class="heading-display mt-2 text-4xl text-white group-hover:text-blue-300">{card.value}</p>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <!-- ── Quick actions (Req 5.5) ── -->
  <section class="mb-10" aria-label="Quick actions">
    <h2 class="text-eyebrow mb-4">Quick Actions</h2>
    <div class="flex flex-wrap gap-3">
      {#each quickActions as action}
        <a href={action.href} class="btn-primary">{action.label}</a>
      {/each}
    </div>
  </section>

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <!-- ── Next 5 fixtures (Req 5.2) ── -->
    <section class="card-surface p-5" aria-label="Upcoming fixtures">
      <h2 class="heading-display mb-4 text-xl">Next Fixtures</h2>
      {#if fixtures.loading}
        <SkeletonLoader variant="list" count={5} />
      {:else if fixtures.error}
        <ErrorState message="We couldn't load upcoming fixtures." onRetry={load} />
      {:else if fixtures.data.length === 0}
        <p class="text-sm text-white/60">No upcoming fixtures scheduled.</p>
      {:else}
        <ul class="divide-y divide-white/10">
          {#each fixtures.data as fixture (fixture.id)}
            <li class="py-3">
              <p class="text-sm font-semibold text-white">
                {fixture.homeTeam} <span class="text-white/40">vs</span> {fixture.awayTeam}
              </p>
              <p class="mt-1 text-xs text-white/60">
                {formatFixtureDate(fixture.date)}{fixture.venue ? ` · ${fixture.venue}` : ''}
              </p>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <!-- ── Recent 5 results (Req 5.3) ── -->
    <section class="card-surface p-5" aria-label="Recent results">
      <h2 class="heading-display mb-4 text-xl">Recent Results</h2>
      {#if results.loading}
        <SkeletonLoader variant="list" count={5} />
      {:else if results.error}
        <ErrorState message="We couldn't load recent results." onRetry={load} />
      {:else if results.data.length === 0}
        <p class="text-sm text-white/60">No results recorded yet.</p>
      {:else}
        <ul class="divide-y divide-white/10">
          {#each results.data as result (result.id)}
            {@const label = getResultLabel(
              result.homeTeam,
              result.awayTeam,
              result.homeScore,
              result.awayScore,
              result.homePenaltyScore,
              result.awayPenaltyScore
            )}
            <li class="flex items-center justify-between gap-3 py-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-white">
                  {result.homeTeam} <span class="text-white/40">vs</span> {result.awayTeam}
                </p>
                <p class="mt-1 text-xs text-white/60">
                  {result.homeScore} – {result.awayScore}
                </p>
              </div>
              <span
                class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold {labelClasses(label)}"
              >
                {label}
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <!-- ── 3 latest published news (Req 5.4) ── -->
    <section class="card-surface p-5" aria-label="Latest news">
      <h2 class="heading-display mb-4 text-xl">Latest News</h2>
      {#if news.loading}
        <SkeletonLoader variant="list" count={3} />
      {:else if news.error}
        <ErrorState message="We couldn't load the latest news." onRetry={load} />
      {:else if news.data.length === 0}
        <p class="text-sm text-white/60">No published articles yet.</p>
      {:else}
        <ul class="divide-y divide-white/10">
          {#each news.data as article (article.id)}
            <li class="py-3">
              <p class="text-sm font-semibold text-white">{article.title}</p>
              <p class="mt-1 text-xs text-white/60">
                {article.category} · {formatTimestamp(article.publishedAt ?? article.createdAt)}
              </p>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>
</div>

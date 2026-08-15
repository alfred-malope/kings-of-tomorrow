<script lang="ts">
  import SEO from '../lib/components/seo/SEO.svelte';
  import SectionHeading from '../lib/components/ui/SectionHeading.svelte';
  import Badge from '../lib/components/ui/Badge.svelte';
  import { reveal } from '../lib/actions/reveal';
  import { club, clubValues } from '../lib/data/club';

  const aboutHeroImage = 'https://images.pexels.com/photos/16499011/pexels-photo-16499011.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop';

  const valueIcons: Record<string, string> = {
    users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm14 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    target: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
    heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 0c2.5 2.5 4 5.5 4 10s-1.5 7.5-4 10c-2.5-2.5-4-5.5-4-10s1.5-7.5 4-10z',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  };
</script>

<SEO title="About K.O.T FC" description="Discover the story, vision, mission, and values of Kings Of Tomorrow FC." />

<!-- Page hero -->
<section class="relative pt-24 pb-16 lg:pt-32 lg:pb-20 overflow-hidden">
  <div class="absolute inset-0 z-0">
    <img src={aboutHeroImage} alt="K.O.T FC training" class="w-full h-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-b from-navy-950/90 via-navy-900/85 to-navy-950"></div>
  </div>
  <div class="container-x relative z-10">
    <div use:reveal>
      <Badge variant="gold">Est. {club.founded}</Badge>
      <h1 class="heading-display text-4xl sm:text-5xl lg:text-7xl text-white mt-4">About K.O.T FC</h1>
      <p class="mt-4 text-lg text-white/60 max-w-2xl">{club.motto}</p>
    </div>
  </div>
</section>

<!-- Our Story -->
<section class="section-pad">
  <div class="container-narrow">
    <div use:reveal>
      <SectionHeading eyebrow="Our Story" title="The Kings Are Here" />
    </div>
    <div class="mt-8 prose prose-invert max-w-none prose-p:text-white/60 prose-headings:text-white" use:reveal>
      <p>
        Kings Of Tomorrow FC was founded in {club.founded} with a singular vision: to build a football club
        that represents ambition, unity, and the relentless pursuit of excellence. Born from a passion for
        the beautiful game, K.O.T FC was established to give young talent a platform to shine and to bring
        professional football to the heart of the community.
      </p>
      <p>
        The club's identity is built on a deep navy foundation — representing strength and authority —
        accented with electric blue for energy, gold for ambition, and silver for the future that
        awaits. Every player who pulls on the K.O.T jersey carries the responsibility of living up to
        the name: Kings Of Tomorrow.
      </p>
      <p>
        From the first whistle, K.O.T FC has set out to play football with purpose and personality.
        The journey has only just begun, but the vision is clear — to build a club that competes at
        the highest level and inspires the next generation of footballers.
      </p>
    </div>
  </div>
</section>

<!-- Vision + Mission -->
<section class="py-16 lg:py-24 bg-navy-950/50 border-y border-white/5">
  <div class="container-x grid md:grid-cols-2 gap-8 lg:gap-12">
    <div class="card-surface p-8 lg:p-10" use:reveal>
      <Badge variant="blue">Our Vision</Badge>
      <h2 class="heading-display text-2xl lg:text-3xl text-white mt-4 mb-4">A Future Built On Football</h2>
      <p class="text-white/60 leading-relaxed">
        To become a club that competes at the highest level of the game, recognised for its
        commitment to developing young talent, playing attractive football, and uniting a community
        behind a shared dream. We envision a future where Kings Of Tomorrow FC is synonymous with
        excellence, both on and off the pitch.
      </p>
    </div>
    <div class="card-surface p-8 lg:p-10" use:reveal>
      <Badge variant="gold">Our Mission</Badge>
      <h2 class="heading-display text-2xl lg:text-3xl text-white mt-4 mb-4">Every Day, Every Game</h2>
      <p class="text-white/60 leading-relaxed">
        To create an environment where players can develop to their full potential, where teamwork
        and discipline are the foundation of everything we do, and where every match is an
        opportunity to prove that we belong among the best. We exist to win, to inspire, and to build
        the kings of tomorrow.
      </p>
    </div>
  </div>
</section>

<!-- Values -->
<section class="section-pad">
  <div class="container-x">
    <div use:reveal>
      <SectionHeading eyebrow="Our Values" title="What We Stand For" align="center" />
    </div>
    <div class="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each clubValues as value (value.title)}
        <div class="card-surface p-6 lg:p-8 hover:border-blue-500/30 transition-all duration-300" use:reveal>
          <div class="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00AEEF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d={valueIcons[value.icon]} />
            </svg>
          </div>
          <h3 class="heading-display text-lg text-white mb-2">{value.title}</h3>
          <p class="text-sm text-white/55 leading-relaxed">{value.description}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

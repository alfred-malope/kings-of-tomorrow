<script lang="ts">
  import { club } from '../../data/club';
  import { router } from '../../router';

  const heroImage = 'https://images.pexels.com/photos/32190714/pexels-photo-32190714.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop';

  function navigate(path: string) {
    router.navigate(path);
  }
</script>

<section class="relative min-h-screen flex items-center overflow-hidden">
  <!-- Background image with slow zoom -->
  <div class="absolute inset-0 z-0">
    <img
      src={heroImage}
      alt="K.O.T FC match action"
      class="w-full h-full object-cover animate-slow-zoom"
    />
    <div class="absolute inset-0 bg-gradient-to-b from-navy-950/80 via-navy-900/60 to-navy-950"></div>
    <div class="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-transparent to-navy-950/40"></div>
  </div>

  <!-- Light particles effect -->
  <div class="absolute inset-0 z-0 pointer-events-none">
    <div class="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-blue-400/40 animate-pulse-glow"></div>
    <div class="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full bg-gold-400/40 animate-pulse-glow" style="animation-delay: 1s"></div>
    <div class="absolute bottom-1/3 left-1/3 w-1 h-1 rounded-full bg-blue-400/30 animate-pulse-glow" style="animation-delay: 2s"></div>
  </div>

  <!-- Content -->
  <div class="container-x relative z-10 pt-20">
    <div class="max-w-3xl">
      <!-- Logo -->
      <div class="mb-6 animate-fade-in-down" style="animation-delay: 0.1s; opacity: 0;">
        <img src={club.logo} alt={club.name} class="h-20 w-20 sm:h-24 sm:w-24 drop-shadow-2xl" />
      </div>

      <!-- Eyebrow -->
      <p class="text-eyebrow mb-4 animate-fade-in-up" style="animation-delay: 0.3s; opacity: 0;">
        Established {club.founded} &middot; {club.location}
      </p>

      <!-- Title -->
      <h1 class="heading-display text-5xl sm:text-7xl lg:text-8xl text-white leading-[0.9] animate-fade-in-up" style="animation-delay: 0.5s; opacity: 0;">
        Kings Of<br />
        <span class="text-gradient-gold">Tomorrow</span> FC
      </h1>

      <!-- Motto -->
      <p class="mt-6 text-lg sm:text-xl text-white/70 font-medium tracking-wide animate-fade-in-up" style="animation-delay: 0.7s; opacity: 0;">
        One Team. One Vision. One Future.
      </p>

      <!-- CTAs -->
      <div class="mt-8 flex flex-col sm:flex-row gap-4 animate-fade-in-up" style="animation-delay: 0.9s; opacity: 0;">
        <button on:click={() => navigate('/fixtures')} class="btn-primary">
          View Fixtures
        </button>
        <button on:click={() => navigate('/squad')} class="btn-outline">
          Meet The Squad
        </button>
      </div>
    </div>
  </div>

  <!-- Scroll indicator -->
  <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-fade-in" style="animation-delay: 1.5s; opacity: 0;">
    <div class="flex flex-col items-center gap-2">
      <span class="text-[0.65rem] uppercase tracking-widest text-white/40">Scroll</span>
      <div class="w-px h-12 bg-gradient-to-b from-white/40 to-transparent"></div>
    </div>
  </div>
</section>

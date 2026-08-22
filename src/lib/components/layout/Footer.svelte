<script lang="ts">
  import { club } from '../../data/club';
  import { navItems } from '../../data/navigation';
  import { socialLinks } from '../../data/social';
  import { router } from '../../router';

  const year = new Date().getFullYear();

  function handleNav(path: string) {
    router.navigate(path);
  }

  const socialIconPaths: Record<string, string> = {
    instagram: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 7.38a4.62 4.62 0 1 0 0 9.24 4.62 4.62 0 0 0 0-9.24m0 7.62a3 3 0 1 1 0-6 3 3 0 0 1 0 6m4.8-7.8a1.08 1.08 0 1 0 0 2.16 1.08 1.08 0 0 0 0-2.16',
    x: 'M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.82l4.71 6.23zm-1.16 17.76h1.83L7.01 4.13H5.04z',
    facebook: 'M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8v8.44C19.61 23.08 24 18.09 24 12.07',
    youtube: 'M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2C0 8.08 0 12 0 12s0 3.92.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.8M9.6 15.6V8.4l6.2 3.6z',
    tiktok: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.73 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V8.66a8.16 8.16 0 0 0 4.77 1.52V6.69h-1.04',
  };
</script>

<footer class="bg-navy-950 border-t border-white/10 mt-auto">
  <div class="container-x py-12 lg:py-16">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
      <!-- Brand -->
      <div class="lg:col-span-2 max-w-sm">
        <div class="flex items-center gap-3 mb-4">
          <img src={club.logo} alt={club.name} class="h-14 w-14" />
          <div>
            <p class="heading-display text-xl text-white">Kings Of Tomorrow</p>
            <p class="text-xs uppercase tracking-widest text-blue-400">Football Club</p>
          </div>
        </div>
        <p class="text-sm text-white/50 leading-relaxed mb-5">
          {club.motto}
        </p>
        <div class="flex gap-3">
          {#each socialLinks as social (social.platform)}
            <a
              href={social.url}
              target="_blank"
              rel="noreferrer"
              class="w-9 h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/60 hover:text-blue-400 hover:border-blue-400/40 transition-all duration-200"
              aria-label={social.platform}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d={socialIconPaths[social.icon]} />
              </svg>
            </a>
          {/each}
        </div>
      </div>

      <!-- Navigation -->
      <div>
        <h3 class="heading-display text-sm text-white mb-4">Explore</h3>
        <ul class="space-y-2.5">
          {#each navItems as item (item.path)}
            <li>
              <button
                on:click={() => handleNav(item.path)}
                class="text-sm text-white/50 hover:text-blue-400 transition-colors duration-200"
              >
                {item.label}
              </button>
            </li>
          {/each}
        </ul>
      </div>

      <!-- Contact -->
      <div>
        <h3 class="heading-display text-sm text-white mb-4">Contact</h3>
        <ul class="space-y-2.5 text-sm text-white/50">
          <li>
            <a href="mailto:{club.email}" class="hover:text-blue-400 transition-colors duration-200">{club.email}</a>
          </li>
          <li>{club.phone}</li>
          <li>{club.location}</li>
          <!-- <li>{club.venue}</li> -->
        </ul>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p class="text-xs text-white/40 text-center sm:text-left">
        &copy; {year} {club.name}. All rights reserved. Website by
        <a href="https://365itconsultants.co.za/" target="_blank" rel="noreferrer" class="font-semibold text-blue-400 transition-colors hover:text-blue-300">
          365 IT Consultants
        </a>
      </p>
      <p class="text-xs text-white/30 uppercase tracking-widest">
        One Team. One Vision. One Future.
      </p>
    </div>
  </div>
</footer>

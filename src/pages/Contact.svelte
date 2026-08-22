<script lang="ts">
  import SEO from '../lib/components/seo/SEO.svelte';
  import Badge from '../lib/components/ui/Badge.svelte';
  import { reveal } from '../lib/actions/reveal';
  import { club } from '../lib/data/club';
  import { socialLinks } from '../lib/data/social';

  const contactHeroImage = 'https://images.pexels.com/photos/28827841/pexels-photo-28827841.jpeg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop';

  const clubPhoneHref = club.phone.replace(/\s+/g, '');

  const socialIconPaths: Record<string, string> = {
    instagram: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 7.38a4.62 4.62 0 1 0 0 9.24 4.62 4.62 0 0 0 0-9.24m0 7.62a3 3 0 1 1 0-6 3 3 0 0 1 0 6m4.8-7.8a1.08 1.08 0 1 0 0 2.16 1.08 1.08 0 0 0 0-2.16',
    x: 'M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.82l4.71 6.23zm-1.16 17.76h1.83L7.01 4.13H5.04z',
    facebook: 'M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8v8.44C19.61 23.08 24 18.09 24 12.07',
    youtube: 'M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2C0 8.08 0 12 0 12s0 3.92.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.8M9.6 15.6V8.4l6.2 3.6z',
    tiktok: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.73 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V8.66a8.16 8.16 0 0 0 4.77 1.52V6.69h-1.04',
  };

  const contactDetails = [
    {
      title: 'General Enquiries',
      value: club.email,
      href: `mailto:${club.email}`,
      icon: 'email',
    },
    {
      title: 'Call the Club',
      value: club.phone,
      href: `tel:${clubPhoneHref}`,
      icon: 'phone',
    },
    {
      title: 'Based In',
      value: club.location,
      // meta: 'South Africa',
      href: '#',
      icon: 'location',
    },
  ];
</script>

<SEO title="Contact | K.O.T FC" description="Get in touch with Kings Of Tomorrow FC." />

<section class="relative pt-24 pb-12 lg:pt-32 lg:pb-16 overflow-hidden">
  <div class="absolute inset-0 z-0">
    <img src={contactHeroImage} alt="K.O.T FC stadium" class="w-full h-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-b from-navy-950/90 via-navy-900/85 to-navy-950"></div>
  </div>
  <div class="container-x relative z-10">
    <div use:reveal>
      <Badge variant="blue">Get In Touch</Badge>
      <h1 class="heading-display text-4xl sm:text-5xl lg:text-7xl text-white mt-4">Contact</h1>
      <p class="mt-4 max-w-2xl text-lg text-white/60">Whether you’re a supporter, partner, media member, or hopeful player, we’d love to hear from you.</p>
    </div>
  </div>
</section>

<section class="section-pad">
  <div class="container-x grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
    <div use:reveal>
      <div class="mb-6">
        <p class="text-eyebrow">Club contact</p>
        <h2 class="heading-display mt-3 text-3xl text-white sm:text-4xl">Let’s talk football.</h2>
      </div>

      <p class="max-w-xl text-lg text-white/60">
        We’re proud to represent our community on and off the pitch. Reach out for club enquiries, partnerships, fan support, or anything in between.
      </p>

      <div class="mt-8 flex flex-wrap gap-4">
        <a href={`mailto:${club.email}`} class="btn-primary">Email Us</a>
        <a href={`tel:${clubPhoneHref}`} class="btn-outline">Call the Club</a>
      </div>

      <div class="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {#each contactDetails as item}
          <a
            href={item.href}
            class="group card-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-blue-400/40 hover:bg-navy-700/70"
          >
            <div class="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80 group-hover:border-blue-400/40 group-hover:text-blue-400">
              {#if item.icon === 'email'}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              {:else if item.icon === 'phone'}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              {:else}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {/if}
            </div>

            <p class="text-xs uppercase tracking-[0.2em] text-white/40">{item.title}</p>
            <p class="mt-3 text-base font-semibold text-white">{item.value}</p>
            {#if item.meta}
              <p class="mt-1 text-sm text-white/55">{item.meta}</p>
            {/if}
          </a>
        {/each}
      </div>
    </div>

    <div use:reveal>
      <div class="card-surface overflow-hidden p-6 sm:p-8">
        <div class="rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-500/12 via-navy-800 to-gold-500/10 p-6">
          <p class="text-xs uppercase tracking-[0.2em] text-blue-300">Follow K.O.T FC</p>
          <h3 class="heading-display mt-3 text-2xl text-white">Stay connected.</h3>
          <p class="mt-3 text-sm text-white/60">Get match updates, club news, and behind-the-scenes moments across our channels.</p>
        </div>

        <div class="mt-6 space-y-3">
          {#each socialLinks as social}
            <a
              href={social.url}
              target="_blank"
              rel="noreferrer"
              class="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/70 transition-all duration-200 hover:border-blue-400/40 hover:bg-blue-500/5 hover:text-white"
            >
              <div class="flex items-center gap-3">
                <span class="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-navy-900 text-blue-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d={socialIconPaths[social.icon]} />
                  </svg>
                </span>
                <div>
                  <p class="text-sm font-semibold text-white">{social.platform}</p>
                  <p class="text-xs text-white/45">{social.handle}</p>
                </div>
              </div>

              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="opacity-70">
                <path d="M5 12h14"/><path d="M13 5l7 7-7 7"/>
              </svg>
            </a>
          {/each}
        </div>
      </div>
    </div>
  </div>

</section>


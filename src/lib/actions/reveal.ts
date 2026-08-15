import { onMount } from 'svelte';

/**
 * Svelte action that adds a `visible` class when the element scrolls into view.
 * Use with the `.reveal` CSS class for scroll-triggered fade-in-up animations.
 */
export function reveal(node: HTMLElement) {
  onMount(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      node.classList.add('visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  });
}

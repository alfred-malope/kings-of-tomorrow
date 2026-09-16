import { describe, it, expect } from 'vitest';
import { slugify } from './slug';

describe('slugify', () => {
  it('slugifies a normal title with spaces', () => {
    expect(slugify('Match Report Away Day')).toBe('match-report-away-day');
  });

  it('strips special characters and collapses separators to single hyphens', () => {
    expect(slugify('K.O.T FC vs. Rivals! (2024)')).toBe('k-o-t-fc-vs-rivals-2024');
  });

  it('lowercases an all-caps title', () => {
    expect(slugify('CLUB NEWS UPDATE')).toBe('club-news-update');
  });

  it('returns an empty string for an empty title', () => {
    expect(slugify('')).toBe('');
  });

  it('returns an empty string when the title has no alphanumeric characters', () => {
    expect(slugify('!!! --- ###')).toBe('');
  });

  it('preserves numbers', () => {
    expect(slugify('Top 10 Goals of 2023')).toBe('top-10-goals-of-2023');
  });

  it('does not produce leading or trailing hyphens', () => {
    expect(slugify('  Leading and trailing  ')).toBe('leading-and-trailing');
  });
});

// ── Property-based tests ──────────────────────────────────────────────────────
import fc from 'fast-check';

describe('slugify — properties', () => {
  // Feature: kot-fc-admin-portal, Property 11: Slug generation produces URL-safe strings
  // **Validates: Requirements 9.4**
  it('produces a URL-safe slug or an empty string for any input', () => {
    const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    fc.assert(
      fc.property(fc.string(), (title) => {
        const slug = slugify(title);
        // Either empty (input had no alphanumerics) or matches the URL-safe pattern.
        expect(slug === '' || SLUG_PATTERN.test(slug)).toBe(true);
        // Never contains uppercase letters.
        expect(slug).toBe(slug.toLowerCase());
        // Never contains whitespace.
        expect(/\s/.test(slug)).toBe(false);
        // The only permitted non-alphanumeric character is the hyphen.
        expect(/[^a-z0-9-]/.test(slug)).toBe(false);
        // No leading or trailing hyphens, and no doubled hyphens.
        expect(slug.startsWith('-')).toBe(false);
        expect(slug.endsWith('-')).toBe(false);
        expect(slug.includes('--')).toBe(false);
      })
    );
  });
});

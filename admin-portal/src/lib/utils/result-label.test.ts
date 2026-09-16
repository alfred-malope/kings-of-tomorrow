import { describe, it, expect } from 'vitest';
import { getResultLabel } from './result-label';

describe('getResultLabel', () => {
  it('returns Win when KOT is home and scores more', () => {
    expect(getResultLabel('KOT FC', 'Rivals', 3, 1)).toBe('Win');
  });

  it('returns Loss when KOT is home and scores fewer', () => {
    expect(getResultLabel('KOT FC', 'Rivals', 0, 2)).toBe('Loss');
  });

  it('returns Draw when KOT is home and scores are level with no penalties', () => {
    expect(getResultLabel('KOT FC', 'Rivals', 2, 2)).toBe('Draw');
  });

  it('returns Win when KOT is away and scores more', () => {
    expect(getResultLabel('Rivals', 'K.O.T FC', 1, 4)).toBe('Win');
  });

  it('returns Loss when KOT is away and scores fewer', () => {
    expect(getResultLabel('Rivals', 'K.O.T FC', 3, 1)).toBe('Loss');
  });

  it('returns Draw when KOT is away and scores are level with no penalties', () => {
    expect(getResultLabel('Rivals', 'K.O.T FC', 1, 1)).toBe('Draw');
  });

  it('returns Win when level scores are broken by a penalty win (KOT home)', () => {
    expect(getResultLabel('KOT FC', 'Rivals', 1, 1, 5, 4)).toBe('Win');
  });

  it('returns Loss when level scores are broken by a penalty loss (KOT home)', () => {
    expect(getResultLabel('KOT FC', 'Rivals', 1, 1, 3, 5)).toBe('Loss');
  });

  it('returns Win when level scores are broken by a penalty win (KOT away)', () => {
    // KOT is away; away penalty > home penalty means KOT wins.
    expect(getResultLabel('Rivals', 'KOT FC', 2, 2, 3, 4)).toBe('Win');
  });

  it('returns Loss when level scores are broken by a penalty loss (KOT away)', () => {
    expect(getResultLabel('Rivals', 'KOT FC', 2, 2, 4, 2)).toBe('Loss');
  });

  it('returns Draw when regular and penalty scores are both level', () => {
    expect(getResultLabel('KOT FC', 'Rivals', 1, 1, 3, 3)).toBe('Draw');
  });
});

// ── Property-based tests ──────────────────────────────────────────────────────
import fc from 'fast-check';
import { getResultLabelFromPerspective, type ResultLabel } from './result-label';

/**
 * Independent reference implementation of the Win/Draw/Loss rule from a team's
 * perspective. Kept deliberately separate from the production logic so the
 * property test cross-checks behaviour rather than restating it.
 */
function referenceLabel(
  isHome: boolean,
  homeScore: number,
  awayScore: number,
  homePenalty: number | null,
  awayPenalty: number | null
): ResultLabel {
  const ourScore = isHome ? homeScore : awayScore;
  const theirScore = isHome ? awayScore : homeScore;
  if (ourScore !== theirScore) {
    return ourScore > theirScore ? 'Win' : 'Loss';
  }
  // Level on regular time — decide by penalties if both are present.
  if (homePenalty !== null && awayPenalty !== null) {
    const ourPen = isHome ? homePenalty : awayPenalty;
    const theirPen = isHome ? awayPenalty : homePenalty;
    if (ourPen !== theirPen) {
      return ourPen > theirPen ? 'Win' : 'Loss';
    }
  }
  return 'Draw';
}

describe('getResultLabelFromPerspective — properties', () => {
  const score = fc.integer({ min: 0, max: 20 });
  const penalty = fc.option(fc.integer({ min: 0, max: 20 }), { nil: null });

  // Feature: kot-fc-admin-portal, Property 12: Match result label is correctly derived from scores
  // **Validates: Requirements 8.1**
  it('matches an independent reference for all score and penalty combinations', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        score,
        score,
        penalty,
        penalty,
        (isHome, homeScore, awayScore, homePenalty, awayPenalty) => {
          const actual = getResultLabelFromPerspective(
            isHome,
            homeScore,
            awayScore,
            homePenalty,
            awayPenalty
          );
          const expected = referenceLabel(
            isHome,
            homeScore,
            awayScore,
            homePenalty,
            awayPenalty
          );
          expect(actual).toBe(expected);
        }
      )
    );
  });
});

export type ResultLabel = 'Win' | 'Draw' | 'Loss';

/**
 * Determines whether a team name refers to K.O.T FC.
 *
 * Matching is a case-insensitive substring check against the club's name and
 * common abbreviation, tolerant of the dotted ("K.O.T") and undotted ("KOT")
 * spellings.
 *
 * @param team - The team name to test.
 * @returns `true` when the name refers to K.O.T FC.
 */
export function isKotTeam(team: string): boolean {
  const normalised = team.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalised.includes('kot');
}

/**
 * Computes a Win/Draw/Loss label from the perspective of a team, given whether
 * that team is the home side.
 *
 * When regular-time scores are level and both penalty scores are provided, the
 * penalty scores decide the outcome. If the scores are level and no penalties
 * are provided, the result is a Draw.
 *
 * @param isHome - Whether the team of interest (K.O.T FC) is the home side.
 * @param homeScore - Home team's regular-time score.
 * @param awayScore - Away team's regular-time score.
 * @param homePenalty - Optional home team's penalty-shootout score.
 * @param awayPenalty - Optional away team's penalty-shootout score.
 * @returns The Win/Draw/Loss label from the team's perspective.
 */
export function getResultLabelFromPerspective(
  isHome: boolean,
  homeScore: number,
  awayScore: number,
  homePenalty?: number | null,
  awayPenalty?: number | null
): ResultLabel {
  // Scores from the perspective of the team of interest.
  const ourScore = isHome ? homeScore : awayScore;
  const theirScore = isHome ? awayScore : homeScore;

  if (ourScore > theirScore) return 'Win';
  if (ourScore < theirScore) return 'Loss';

  // Regular-time scores are level — fall back to penalties when available.
  if (homePenalty != null && awayPenalty != null) {
    const ourPenalty = isHome ? homePenalty : awayPenalty;
    const theirPenalty = isHome ? awayPenalty : homePenalty;

    if (ourPenalty > theirPenalty) return 'Win';
    if (ourPenalty < theirPenalty) return 'Loss';
  }

  return 'Draw';
}

/**
 * Computes the Win/Draw/Loss label for a result from K.O.T FC's perspective.
 *
 * K.O.T FC is identified by matching the home and away team names against the
 * club name / abbreviation. When neither side matches, the home side is assumed
 * to be K.O.T FC as a safe default.
 *
 * @param homeTeam - Home team name.
 * @param awayTeam - Away team name.
 * @param homeScore - Home team's regular-time score.
 * @param awayScore - Away team's regular-time score.
 * @param homePenalty - Optional home team's penalty-shootout score.
 * @param awayPenalty - Optional away team's penalty-shootout score.
 * @returns The Win/Draw/Loss label from K.O.T FC's perspective.
 */
export function getResultLabel(
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number,
  homePenalty?: number | null,
  awayPenalty?: number | null
): ResultLabel {
  // Determine whether K.O.T FC is the home side. If the away team matches but
  // the home team does not, KOT is away; otherwise default to home.
  const isHome = isKotTeam(homeTeam) || !isKotTeam(awayTeam);

  return getResultLabelFromPerspective(
    isHome,
    homeScore,
    awayScore,
    homePenalty,
    awayPenalty
  );
}

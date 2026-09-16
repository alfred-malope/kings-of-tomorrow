import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../firebase';

export type FixtureStatus = 'upcoming' | 'result';

export interface Fixture {
  id: string;
  date: string;
  time: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  venue: string;
  status: FixtureStatus;
  homeScore?: number;
  awayScore?: number;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  isHome: boolean;
}

const kotLogo = '/kot-logo.png';
const opponentLogo = '/opponent-default.svg';

export const fixtures: Fixture[] = [
  {
    id: 'kot-1',
    date: 'TBC',
    time: 'Kick-off TBC',
    competition: 'LTP Tournament',
    homeTeam: 'K.O.T FC',
    awayTeam: 'Opponent TBC',
    homeLogo: kotLogo,
    awayLogo: opponentLogo,
    venue: 'Nelly Primary Sports Ground',
    status: 'upcoming',
    isHome: true,
  },
  // {
  //   id: 'chiefs-vs-kot-2026-08-22',
  //   date: '2026-08-22',
  //   time: '17:30',
  //   competition: 'Premier League',
  //   homeTeam: 'Kaizer Chiefs',
  //   awayTeam: 'K.O.T FC',
  //   homeLogo: opponentLogo,
  //   awayLogo: kotLogo,
  //   venue: 'FNB Stadium',
  //   status: 'upcoming',
  //   isHome: false,
  // },
  // {
  //   id: 'kot-vs-pirates-2026-08-29',
  //   date: '2026-08-29',
  //   time: '20:00',
  //   competition: 'Nedbank Cup',
  //   homeTeam: 'K.O.T FC',
  //   awayTeam: 'Orlando Pirates',
  //   homeLogo: kotLogo,
  //   awayLogo: opponentLogo,
  //   venue: 'K.O.T Stadium',
  //   status: 'upcoming',
  //   isHome: true,
  // },
  {
    id: 'kot-vs-stellenbosch-2026-07-25',
    date: '2026-08-08',
    time: '09:30',
    competition: 'Poulos Village Market & Soccer Fastival',
    homeTeam: 'MAN United FC',
    awayTeam: 'K.O.T FC',
    homeLogo: opponentLogo,
    awayLogo: kotLogo,
    venue: 'Fast 11 Sports Ground',
    status: 'result',
    homeScore: 4,
    awayScore: 2,
    isHome: false,
  },
  {
    id: 'arrows-vs-kot-2026-07-04',
    date: '2026-07-04',
    time: '15:00',
    competition: 'Raadslid',
    homeTeam: 'Sthende FC',
    awayTeam: 'K.O.T FC',
    homeLogo: opponentLogo,
    awayLogo: kotLogo,
    venue: 'Swallow Ground',
    status: 'result',
    homeScore: 0,
    awayScore: 0,
    homePenaltyScore: 4,
    awayPenaltyScore: 3,
    isHome: false,
  },
  {
    id: 'sundowns-vs-kot-2026-07-18',
    date: '2025-12-30',
    time: '10:30',
    competition: 'LTP Tournament',
    homeTeam: 'K.O.T FC',
    awayTeam: 'Skomboys FC',
    homeLogo: kotLogo,
    awayLogo: opponentLogo,
    venue: 'Nelly Primary Sports Ground',
    status: 'result',
    homeScore: 1,
    awayScore: 2,
    isHome: true,
  },
  {
    id: 'kot-vs-amazulu-2026-07-11',
    date: '2025-12-29',
    time: '15:30',
    competition: 'LTP Tournament',
    homeTeam: 'BIG 5 FC',
    awayTeam: 'K.O.T FC',
    homeLogo: opponentLogo,
    awayLogo: kotLogo,
    venue: 'Nelly Primary Sports Ground',
    status: 'result',
    homeScore: 2,
    awayScore: 3,
    isHome: false,
  },
];

export function getUpcomingFixtures(): Fixture[] {
  return fixtures
    .filter((f) => f.status === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getResults(): Fixture[] {
  return fixtures
    .filter((f) => f.status === 'result')
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getNextFixture(): Fixture | undefined {
  return getUpcomingFixtures()[0];
}

export function getLatestResult(): Fixture | undefined {
  return getResults()[0];
}

export function formatDate(dateStr: string): string {
  if (dateStr === 'TBC') {
    return 'Date TBC';
  }

  const d = new Date(dateStr + 'T00:00:00');

  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  if (dateStr === 'TBC') {
    return 'Date TBC';
  }

  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDayMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  }).toUpperCase();
}

type AdminFixture = {
  id: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
  status: 'scheduled' | 'completed' | 'postponed' | 'cancelled' | 'tbc';
};

type AdminResult = {
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  homePenaltyScore: number | null;
  awayPenaltyScore: number | null;
};

function isKotTeam(team: string): boolean {
  return team.toLowerCase().replace(/[^a-z0-9]/g, '').includes('kot');
}

function mapFixture(fixture: AdminFixture, result?: AdminResult): Fixture {
  const isHome = isKotTeam(fixture.homeTeam) || !isKotTeam(fixture.awayTeam);
  return {
    id: fixture.id,
    date: fixture.date,
    time: fixture.time === 'TBC' ? 'Kick-off TBC' : fixture.time,
    competition: fixture.competition,
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    homeLogo: isKotTeam(fixture.homeTeam) ? kotLogo : opponentLogo,
    awayLogo: isKotTeam(fixture.awayTeam) ? kotLogo : opponentLogo,
    venue: fixture.venue,
    status: result || fixture.status === 'completed' ? 'result' : 'upcoming',
    homeScore: result?.homeScore,
    awayScore: result?.awayScore,
    homePenaltyScore: result?.homePenaltyScore ?? undefined,
    awayPenaltyScore: result?.awayPenaltyScore ?? undefined,
    isHome,
  };
}

/** Loads public fixtures and their public recorded results from Firestore. */
export async function loadPublicFixtures(): Promise<Fixture[]> {
  const [fixtureSnapshot, resultSnapshot] = await Promise.all([
    getDocs(query(collection(firestore, 'fixtures'), where('visibility', '==', 'public'))),
    getDocs(query(collection(firestore, 'results'), where('visibility', '==', 'public'))),
  ]);

  const resultsByFixture = new Map<string, AdminResult>();
  for (const resultDoc of resultSnapshot.docs) {
    const data = resultDoc.data();
    resultsByFixture.set(data.fixtureId as string, { fixtureId: data.fixtureId, ...data } as AdminResult);
  }

  return fixtureSnapshot.docs
    .map((fixtureDoc) => {
      const fixture = { id: fixtureDoc.id, ...fixtureDoc.data() } as AdminFixture;
      return mapFixture(fixture, resultsByFixture.get(fixture.id));
    })
    .filter((fixture) => fixture.status === 'upcoming' || fixture.status === 'result')
    .sort((left, right) => right.date.localeCompare(left.date));
}

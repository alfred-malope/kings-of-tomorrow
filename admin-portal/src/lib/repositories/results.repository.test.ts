import { beforeEach, describe, expect, it, vi } from 'vitest';

const getDocsMock = vi.fn();

vi.mock('$lib/firebase/client', () => ({ db: {}, auth: {}, storage: {} }));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ __type: 'collection' })),
  doc: vi.fn(() => ({ __type: 'doc' })),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn((...args: unknown[]) => ({ __type: 'query', args })),
  where: vi.fn((...args: unknown[]) => ({ __type: 'where', args })),
  orderBy: vi.fn((...args: unknown[]) => ({ __type: 'orderBy', args })),
  limit: vi.fn((n: number) => ({ __type: 'limit', n })),
  startAfter: vi.fn(() => ({ __type: 'startAfter' })),
  serverTimestamp: vi.fn(() => ({ __type: 'serverTimestamp' }))
}));

import { getResultByFixtureId } from './results.repository';

describe('results repository', () => {
  beforeEach(() => {
    getDocsMock.mockReset();
  });

  it('returns the recorded result for a fixture when one exists', async () => {
    getDocsMock.mockResolvedValue({
      empty: false,
      docs: [{
        id: 'result-123',
        data: () => ({
          fixtureId: 'fixture-1',
          homeTeam: 'KOT',
          awayTeam: 'Rivals',
          homeScore: 2,
          awayScore: 1,
          homePenaltyScore: null,
          awayPenaltyScore: null,
          visibility: 'public',
          matchReport: 'Nice game',
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-02') }
        })
      }]
    });

    const result = await getResultByFixtureId({} as never, 'fixture-1');

    expect(result).toMatchObject({ id: 'result-123', fixtureId: 'fixture-1', homeScore: 2, awayScore: 1 });
  });

  it('returns null when no result exists for a fixture', async () => {
    getDocsMock.mockResolvedValue({ empty: true, docs: [] });

    const result = await getResultByFixtureId({} as never, 'fixture-missing');

    expect(result).toBeNull();
  });
});

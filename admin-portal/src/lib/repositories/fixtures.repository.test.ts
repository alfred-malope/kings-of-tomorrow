import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import type { Fixture, FixtureStatus, Visibility } from '$lib/types/firestore.types';

// ── Firebase mocks ────────────────────────────────────────────────────────────
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

import { applyClientFilters, getFixtures, MAX_PAGE_SIZE } from './fixtures.repository';

const STATUSES: FixtureStatus[] = ['scheduled', 'completed', 'postponed', 'cancelled', 'tbc'];
const VISIBILITIES: Visibility[] = ['public', 'private'];

const fixtureArb: fc.Arbitrary<Fixture> = fc.record({
  id: fc.uuid(),
  competition: fc.string(),
  homeTeam: fc.string(),
  awayTeam: fc.string(),
  date: fc.constant('2024-01-01'),
  time: fc.constant('15:00'),
  venue: fc.string(),
  status: fc.constantFrom(...STATUSES),
  visibility: fc.constantFrom(...VISIBILITIES),
  tournamentId: fc.constant(null),
  notes: fc.string(),
  createdAt: fc.constant({} as never),
  updatedAt: fc.constant({} as never)
});

function snapshotOf(fixtures: Fixture[]) {
  const docs = fixtures.map((f) => ({
    id: f.id,
    data: () => {
      const { id: _id, ...rest } = f;
      return rest;
    }
  }));
  return { docs };
}

beforeEach(() => {
  getDocsMock.mockReset();
});

describe('fixtures repository — properties', () => {
  // Feature: kot-fc-admin-portal, Property 7: Collection filtering returns only matching documents
  // **Validates: Requirements 7.2**
  it('applyClientFilters returns only fixtures matching the status filter', () => {
    fc.assert(
      fc.property(
        fc.array(fixtureArb),
        fc.option(fc.constantFrom(...STATUSES), { nil: undefined }),
        (fixtures, status) => {
          const filtered = applyClientFilters(fixtures, { status });
          for (const f of filtered) {
            if (status !== undefined) expect(f.status).toBe(status);
          }
          expect(fixtures).toEqual(expect.arrayContaining(filtered));
        }
      )
    );
  });

  // Feature: kot-fc-admin-portal, Property 9: Repository pages never exceed the declared page size
  // **Validates: Requirements 7.8**
  it('getFixtures never returns more than MAX_PAGE_SIZE (20) fixtures', () => {
    expect(MAX_PAGE_SIZE).toBe(20);
    return fc.assert(
      fc.asyncProperty(
        fc.array(fixtureArb, { maxLength: 50 }),
        fc.integer({ min: 1, max: 200 }),
        async (fixtures, requestedPageSize) => {
          getDocsMock.mockImplementation((q: { args?: unknown[] }) => {
            // `query(collection, ...constraints)` → args = [collection, ...constraints].
            const constraints = ((q?.args ?? []).slice(1)) as Array<{ __type?: string; n?: number }>;
            const limitC = constraints.find((c) => c && c.__type === 'limit');
            const cap = limitC?.n ?? MAX_PAGE_SIZE;
            return Promise.resolve(snapshotOf(fixtures.slice(0, cap)));
          });
          const { fixtures: page } = await getFixtures({} as never, {}, requestedPageSize);
          expect(page.length).toBeLessThanOrEqual(MAX_PAGE_SIZE);
        }
      )
    );
  });
});

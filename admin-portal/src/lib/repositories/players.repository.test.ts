import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import type { Player, PlayerStatus, Position } from '$lib/types/firestore.types';

// ── Firebase mocks ────────────────────────────────────────────────────────────
// Query-builder functions are stubbed to inert markers; only getDocs/addDoc
// carry behaviour (driven per-test via the mocked implementations below).
const getDocsMock = vi.fn();
const addDocMock = vi.fn();

vi.mock('$lib/firebase/client', () => ({ db: {}, auth: {}, storage: {} }));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ __type: 'collection' })),
  doc: vi.fn(() => ({ __type: 'doc' })),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  getDoc: vi.fn(),
  addDoc: (...args: unknown[]) => addDocMock(...args),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn((...args: unknown[]) => ({ __type: 'query', args })),
  where: vi.fn((...args: unknown[]) => ({ __type: 'where', args })),
  orderBy: vi.fn((...args: unknown[]) => ({ __type: 'orderBy', args })),
  limit: vi.fn((n: number) => ({ __type: 'limit', n })),
  startAfter: vi.fn(() => ({ __type: 'startAfter' })),
  serverTimestamp: vi.fn(() => ({ __type: 'serverTimestamp' }))
}));

import {
  applyClientFilters,
  matchesSearch,
  getPlayers,
  createPlayer,
  MAX_PAGE_SIZE
} from './players.repository';
import { RepositoryError } from './repository-error';

const POSITIONS: Position[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
const STATUSES: PlayerStatus[] = ['active', 'inactive', 'injured', 'suspended'];

/** Arbitrary that generates a realistic-enough Player document. */
const playerArb: fc.Arbitrary<Player> = fc.record({
  id: fc.uuid(),
  firstName: fc.string(),
  lastName: fc.string(),
  displayName: fc.string(),
  squadNumber: fc.integer({ min: 1, max: 99 }),
  position: fc.constantFrom(...POSITIONS),
  status: fc.constantFrom(...STATUSES),
  bio: fc.string(),
  joinedDate: fc.constant('2024-01-01'),
  photoUrl: fc.constant(null),
  photoBase64: fc.constant(null),
  createdAt: fc.constant({} as never),
  updatedAt: fc.constant({} as never)
});

/** Wraps a list of players in a fake Firestore snapshot. */
function snapshotOf(players: Player[]) {
  const docs = players.map((p) => ({
    id: p.id,
    data: () => {
      const { id: _id, ...rest } = p;
      return rest;
    }
  }));
  return { docs };
}

beforeEach(() => {
  getDocsMock.mockReset();
  addDocMock.mockReset();
});

describe('players repository — properties', () => {
  // Feature: kot-fc-admin-portal, Property 7: Collection filtering returns only matching documents
  // **Validates: Requirements 6.2**
  it('applyClientFilters returns only players matching the status/position filters', () => {
    fc.assert(
      fc.property(
        fc.array(playerArb),
        fc.option(fc.constantFrom(...STATUSES), { nil: undefined }),
        fc.option(fc.constantFrom(...POSITIONS), { nil: undefined }),
        (players, status, position) => {
          const filtered = applyClientFilters(players, { status, position });
          for (const p of filtered) {
            if (status !== undefined) expect(p.status).toBe(status);
            if (position !== undefined) expect(p.position).toBe(position);
          }
          // Every returned player is present in the source list.
          expect(players).toEqual(expect.arrayContaining(filtered));
        }
      )
    );
  });

  // Feature: kot-fc-admin-portal, Property 8: Player text search returns only matching players
  // **Validates: Requirements 6.3**
  it('matchesSearch holds case-insensitively across name fields for non-empty searches', () => {
    fc.assert(
      fc.property(playerArb, fc.string({ minLength: 1 }), (player, search) => {
        const matched = matchesSearch(player, search);
        if (search.trim() === '') {
          // Whitespace-only search applies no filtering.
          expect(matched).toBe(true);
          return;
        }
        const needle = search.trim().toLowerCase();
        const haystack =
          player.firstName.toLowerCase() +
          '\u0000' +
          player.lastName.toLowerCase() +
          '\u0000' +
          player.displayName.toLowerCase();
        const expected =
          player.firstName.toLowerCase().includes(needle) ||
          player.lastName.toLowerCase().includes(needle) ||
          player.displayName.toLowerCase().includes(needle);
        expect(matched).toBe(expected);
        // Sanity: the separator never bridges a match across fields.
        void haystack;
      })
    );
  });

  // applyClientFilters + matchesSearch: every returned player actually matches.
  it('applyClientFilters search only returns players containing the search string', () => {
    fc.assert(
      fc.property(fc.array(playerArb), fc.string({ minLength: 1 }), (players, search) => {
        const filtered = applyClientFilters(players, { search });
        for (const p of filtered) {
          expect(matchesSearch(p, search)).toBe(true);
        }
      })
    );
  });

  // Feature: kot-fc-admin-portal, Property 9: Repository pages never exceed the declared page size
  // **Validates: Requirements 6.10**
  it('getPlayers never returns more than MAX_PAGE_SIZE (25) players', () => {
    expect(MAX_PAGE_SIZE).toBe(25);
    return fc.assert(
      fc.asyncProperty(
        fc.array(playerArb, { maxLength: 60 }),
        fc.integer({ min: 1, max: 200 }),
        async (players, requestedPageSize) => {
          // The repo caps the query at MAX_PAGE_SIZE; the mock honours that cap
          // by returning at most `cappedSize` docs (what Firestore's limit does).
          getDocsMock.mockImplementation((q: { args?: unknown[] }) => {
            // `query(collection, ...constraints)` → args = [collection, ...constraints].
            const constraints = ((q?.args ?? []).slice(1)) as Array<{ __type?: string; n?: number }>;
            const limitC = constraints.find((c) => c && c.__type === 'limit');
            const cap = limitC?.n ?? MAX_PAGE_SIZE;
            return Promise.resolve(snapshotOf(players.slice(0, cap)));
          });
          const { players: page } = await getPlayers({} as never, {}, requestedPageSize);
          expect(page.length).toBeLessThanOrEqual(MAX_PAGE_SIZE);
        }
      )
    );
  });

  // Feature: kot-fc-admin-portal, Property 13: Repository write failures throw RepositoryError instances
  // **Validates: Requirements 15.4**
  it('getPlayers wraps a thrown Firestore error in a RepositoryError with operation "read"', async () => {
    getDocsMock.mockRejectedValue(new Error('firestore exploded'));
    await expect(getPlayers({} as never, {})).rejects.toBeInstanceOf(RepositoryError);
    await expect(getPlayers({} as never, {})).rejects.toMatchObject({ operation: 'read' });
  });

  it('createPlayer wraps a thrown Firestore error in a RepositoryError with operation "create"', async () => {
    addDocMock.mockRejectedValue(new Error('firestore exploded'));
    const input = {
      firstName: 'A',
      lastName: 'B',
      displayName: 'A B',
      squadNumber: 7,
      position: 'Forward' as Position,
      status: 'active' as PlayerStatus,
      bio: '',
      joinedDate: '2024-01-01',
      photoUrl: null,
      photoBase64: null
    };
    await expect(createPlayer({} as never, input)).rejects.toBeInstanceOf(RepositoryError);
    await expect(createPlayer({} as never, input)).rejects.toMatchObject({ operation: 'create' });
  });
});

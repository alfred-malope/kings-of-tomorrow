// src/lib/repositories/players.repository.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  type Firestore,
  type QueryConstraint,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import type { Player, PlayerStatus, Position } from '$lib/types/firestore.types';
import { RepositoryError } from './repository-error';

/** Firestore collection name for players. */
const COLLECTION = 'players';

/** Maximum number of players returned in a single page (Req 6.10). */
export const MAX_PAGE_SIZE = 25;

/**
 * Optional filters for {@link getPlayers}.
 *
 * `status` and `position` are applied server-side via Firestore `where`
 * constraints. `search` is applied client-side as a case-insensitive
 * substring match across the player's name fields, because Firestore has no
 * native substring search.
 */
export type PlayerFilters = {
  status?: PlayerStatus;
  position?: Position;
  search?: string;
};

/** Shape accepted by {@link createPlayer} — the document minus server-managed fields. */
export type PlayerInput = Omit<Player, 'id' | 'createdAt' | 'updatedAt'>;

/** Shape accepted by {@link updatePlayer} — any subset of fields except id/createdAt. */
export type PlayerUpdate = Partial<Omit<Player, 'id' | 'createdAt'>>;

/**
 * Returns true when `player` matches the given `search` string.
 *
 * The match is a case-insensitive substring test across `firstName`,
 * `lastName`, and `displayName`. An empty or whitespace-only search string
 * matches every player (no filtering applied).
 *
 * Exported as a pure function so it can be exercised by property tests
 * without a live Firestore connection.
 */
export function matchesSearch(
  player: Pick<Player, 'firstName' | 'lastName' | 'displayName'>,
  search: string | undefined
): boolean {
  if (!search) return true;
  const needle = search.trim().toLowerCase();
  if (needle === '') return true;
  return (
    player.firstName.toLowerCase().includes(needle) ||
    player.lastName.toLowerCase().includes(needle) ||
    player.displayName.toLowerCase().includes(needle)
  );
}

/**
 * Applies the client-side portion of {@link PlayerFilters} to a list of
 * players. Currently this is limited to the `search` filter, since `status`
 * and `position` are enforced server-side by the Firestore query. Applying
 * them here as well keeps the predicate self-contained and testable, and is
 * harmless when the input already satisfies the server-side constraints.
 *
 * Exported as a pure function so it can be exercised by property tests
 * without a live Firestore connection.
 */
export function applyClientFilters(players: Player[], filters: PlayerFilters = {}): Player[] {
  return players.filter(
    (player) =>
      (filters.status === undefined || player.status === filters.status) &&
      (filters.position === undefined || player.position === filters.position) &&
      matchesSearch(player, filters.search)
  );
}

/**
 * Fetches a page of players.
 *
 * Builds a compound Firestore query applying optional `status` and `position`
 * filters (via `where`), ordered by `status` then `position`. The `search`
 * filter is applied client-side (case-insensitive substring across name
 * fields) because Firestore lacks substring search. At most `pageSize`
 * players are returned, capped at {@link MAX_PAGE_SIZE} (Req 6.10).
 *
 * @returns the matching players plus the cursor (`lastDoc`) for the next page,
 *          or `null` when there are no more pages.
 */
export async function getPlayers(
  db: Firestore,
  filters: PlayerFilters = {},
  pageSize = MAX_PAGE_SIZE,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ players: Player[]; lastDoc: QueryDocumentSnapshot | null }> {
  const cappedSize = Math.min(pageSize, MAX_PAGE_SIZE);
  try {
    const constraints: QueryConstraint[] = [];
    if (filters.status !== undefined) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters.position !== undefined) {
      constraints.push(where('position', '==', filters.position));
    }
    constraints.push(orderBy('status'), orderBy('position'));
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    constraints.push(limit(cappedSize));

    const snapshot = await getDocs(query(collection(db, COLLECTION), ...constraints));
    const players = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Player
    );

    const filtered = applyClientFilters(players, filters);
    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { players: filtered, lastDoc: newLastDoc };
  } catch (err) {
    throw new RepositoryError('Failed to load players', err, 'read');
  }
}

/**
 * Fetches a single player by id, or `null` if no such document exists.
 */
export async function getPlayer(db: Firestore, id: string): Promise<Player | null> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Player;
  } catch (err) {
    throw new RepositoryError('Failed to load player', err, 'read');
  }
}

/**
 * Creates a new player document with `createdAt`/`updatedAt` set to
 * `serverTimestamp()` (Req 6.5, 15.5). Returns the new document id.
 */
export async function createPlayer(db: Firestore, data: PlayerInput): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return ref.id;
  } catch (err) {
    throw new RepositoryError('Failed to create player', err, 'create');
  }
}

/**
 * Updates the changed fields on a player document and refreshes `updatedAt`
 * with `serverTimestamp()` (Req 6.7, 15.5).
 */
export async function updatePlayer(db: Firestore, id: string, data: PlayerUpdate): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    throw new RepositoryError('Failed to update player', err, 'update');
  }
}

/**
 * Deletes a player document. Associated Storage photo deletion is handled by
 * the calling layer (Req 6.9).
 */
export async function deletePlayer(db: Firestore, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (err) {
    throw new RepositoryError('Failed to delete player', err, 'delete');
  }
}

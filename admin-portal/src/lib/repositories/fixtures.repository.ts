// src/lib/repositories/fixtures.repository.ts
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
import type { Fixture, FixtureStatus } from '$lib/types/firestore.types';
import { RepositoryError } from './repository-error';

/** Firestore collection name for fixtures. */
const COLLECTION = 'fixtures';

/** Maximum number of fixtures returned in a single page per tab (Req 7.8). */
export const MAX_PAGE_SIZE = 20;

/**
 * Optional filters for {@link getFixtures}.
 *
 * `status` is applied server-side via a Firestore `where` constraint. This maps to the
 * tabbed views on the Fixtures page (Upcoming, Completed, TBC, Cancelled, All)
 * where each tab queries by its corresponding `status` (Req 7.1, 7.2).
 */
export type FixtureFilters = {
  status?: FixtureStatus;
};

/** Shape accepted by {@link createFixture} — the document minus server-managed fields. */
export type FixtureInput = Omit<Fixture, 'id' | 'createdAt' | 'updatedAt'>;

/** Shape accepted by {@link updateFixture} — any subset of fields except id/createdAt. */
export type FixtureUpdate = Partial<Omit<Fixture, 'id' | 'createdAt'>>;

/**
 * Applies {@link FixtureFilters} to a list of fixtures.
 *
 * The `status` filter is enforced server-side by the Firestore query; applying
 * it here as well keeps the predicate self-contained and testable, and is
 * harmless when the input already satisfies the server-side constraint. An
 * undefined `status` matches every fixture (the "All" tab).
 *
 * Exported as a pure function so it can be exercised by property tests
 * (Property 7: filtered results only contain matching statuses) without a
 * live Firestore connection.
 */
export function applyClientFilters(fixtures: Fixture[], filters: FixtureFilters = {}): Fixture[] {
  return fixtures.filter(
    (fixture) => filters.status === undefined || fixture.status === filters.status
  );
}

/**
 * Fetches a page of fixtures.
 *
 * Builds a Firestore query applying the optional `status` filter (via `where`).
 * The returned page is sorted by `date` descending locally so filtered tabs do
 * not depend on a composite Firestore index. At most `pageSize` fixtures are returned,
 * capped at {@link MAX_PAGE_SIZE} (Req 7.8).
 *
 * @returns the matching fixtures plus the cursor (`lastDoc`) for the next page,
 *          or `null` when there are no more pages.
 */
export async function getFixtures(
  db: Firestore,
  filters: FixtureFilters = {},
  pageSize = MAX_PAGE_SIZE,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ fixtures: Fixture[]; lastDoc: QueryDocumentSnapshot | null }> {
  const cappedSize = Math.min(pageSize, MAX_PAGE_SIZE);
  try {
    const constraints: QueryConstraint[] = [];
    if (filters.status !== undefined) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters.status === undefined) {
      constraints.push(orderBy('date', 'desc'));
    }
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    constraints.push(limit(cappedSize));

    const snapshot = await getDocs(query(collection(db, COLLECTION), ...constraints));
    const fixtures = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Fixture)
      .sort((left, right) => right.date.localeCompare(left.date));

    const filtered = applyClientFilters(fixtures, filters);
    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { fixtures: filtered, lastDoc: newLastDoc };
  } catch (err) {
    throw new RepositoryError('Failed to load fixtures', err, 'read');
  }
}

/**
 * Fetches a single fixture by id, or `null` if no such document exists.
 */
export async function getFixture(db: Firestore, id: string): Promise<Fixture | null> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Fixture;
  } catch (err) {
    throw new RepositoryError('Failed to load fixture', err, 'read');
  }
}

/**
 * Creates a new fixture document with `createdAt`/`updatedAt` set to
 * `serverTimestamp()` (Req 7.4, 15.5). Returns the new document id.
 */
export async function createFixture(db: Firestore, data: FixtureInput): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return ref.id;
  } catch (err) {
    throw new RepositoryError('Failed to create fixture', err, 'create');
  }
}

/**
 * Updates the changed fields on a fixture document and refreshes `updatedAt`
 * with `serverTimestamp()` (Req 7.5, 15.5).
 */
export async function updateFixture(db: Firestore, id: string, data: FixtureUpdate): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    throw new RepositoryError('Failed to update fixture', err, 'update');
  }
}

/**
 * Deletes a fixture document. Confirmation is handled by the calling layer
 * (Req 7.6).
 */
export async function deleteFixture(db: Firestore, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (err) {
    throw new RepositoryError('Failed to delete fixture', err, 'delete');
  }
}

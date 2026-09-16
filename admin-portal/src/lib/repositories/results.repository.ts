// src/lib/repositories/results.repository.ts
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
import type { Result } from '$lib/types/firestore.types';
import { RepositoryError } from './repository-error';
import { updateFixture } from './fixtures.repository';

/** Firestore collection name for results. */
const COLLECTION = 'results';

/** Maximum number of results returned in a single page (Req 8.7). */
export const MAX_PAGE_SIZE = 20;

/** Shape accepted by {@link createResult} — the document minus server-managed fields. */
export type ResultInput = Omit<Result, 'id' | 'createdAt' | 'updatedAt'>;

/** Shape accepted by {@link updateResult} — any subset of fields except id/createdAt. */
export type ResultUpdate = Partial<Omit<Result, 'id' | 'createdAt'>>;

/**
 * Fetches a page of results.
 *
 * Results are ordered by `createdAt` descending (Req 8.7) so the most recently
 * recorded results appear first. At most `pageSize` results are returned,
 * capped at {@link MAX_PAGE_SIZE} (Req 8.7).
 *
 * @returns the results plus the cursor (`lastDoc`) for the next page, or
 *          `null` when there are no more pages.
 */
export async function getResults(
  db: Firestore,
  pageSize = MAX_PAGE_SIZE,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ results: Result[]; lastDoc: QueryDocumentSnapshot | null }> {
  const cappedSize = Math.min(pageSize, MAX_PAGE_SIZE);
  try {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    constraints.push(limit(cappedSize));

    const snapshot = await getDocs(query(collection(db, COLLECTION), ...constraints));
    const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Result);

    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { results, lastDoc: newLastDoc };
  } catch (err) {
    throw new RepositoryError('Failed to load results', err, 'read');
  }
}

/**
 * Fetches a single result by id, or `null` if no such document exists.
 */
export async function getResult(db: Firestore, id: string): Promise<Result | null> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Result;
  } catch (err) {
    throw new RepositoryError('Failed to load result', err, 'read');
  }
}

/**
 * Fetches the recorded result for a specific fixture, if one exists.
 */
export async function getResultByFixtureId(db: Firestore, fixtureId: string): Promise<Result | null> {
  try {
    const snapshot = await getDocs(query(collection(db, COLLECTION), where('fixtureId', '==', fixtureId)));
    if (snapshot.empty) return null;
    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() } as Result;
  } catch (err) {
    throw new RepositoryError('Failed to load result for fixture', err, 'read');
  }
}

/**
 * Fetches all recorded results for a set of fixtures and returns them keyed by
 * fixtureId. This keeps the Fixtures page from making one query per row while
 * still allowing it to resolve whether a result already exists.
 */
export async function getResultsByFixtureIds(
  db: Firestore,
  fixtureIds: string[]
): Promise<Map<string, Result>> {
  const uniqueFixtureIds = [...new Set(fixtureIds)];
  if (uniqueFixtureIds.length === 0) return new Map();

  try {
    const snapshot = await getDocs(query(collection(db, COLLECTION), where('fixtureId', 'in', uniqueFixtureIds)));
    return new Map(snapshot.docs.map((docSnap) => {
      const result = { id: docSnap.id, ...docSnap.data() } as Result;
      return [result.fixtureId, result] as const;
    }));
  } catch (err) {
    throw new RepositoryError('Failed to load results for fixtures', err, 'read');
  }
}

/**
 * Creates a new result document with `createdAt`/`updatedAt` set to
 * `serverTimestamp()` (Req 8.4, 15.5) and marks the linked fixture as
 * `completed` via {@link updateFixture} (Req 8.4). Returns the new document id.
 */
export async function createResult(db: Firestore, data: ResultInput): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await updateFixture(db, data.fixtureId, { status: 'completed' });
    return ref.id;
  } catch (err) {
    throw new RepositoryError('Failed to create result', err, 'create');
  }
}

/**
 * Updates the changed fields on a result document and refreshes `updatedAt`
 * with `serverTimestamp()` (Req 8.5, 15.5).
 */
export async function updateResult(db: Firestore, id: string, data: ResultUpdate): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    throw new RepositoryError('Failed to update result', err, 'update');
  }
}

/**
 * Deletes a result document. Confirmation is handled by the calling layer
 * (Req 8.6).
 */
export async function deleteResult(db: Firestore, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (err) {
    throw new RepositoryError('Failed to delete result', err, 'delete');
  }
}

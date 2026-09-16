// src/lib/repositories/tournaments.repository.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  type Firestore
} from 'firebase/firestore';
import type { Tournament } from '$lib/types/firestore.types';
import { RepositoryError } from './repository-error';

/** Firestore collection name for tournaments. */
const COLLECTION = 'tournaments';

/** Shape accepted by {@link createTournament} — the document minus server-managed fields. */
export type TournamentInput = Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>;

/** Shape accepted by {@link updateTournament} — any subset of fields except id/createdAt. */
export type TournamentUpdate = Partial<Omit<Tournament, 'id' | 'createdAt'>>;

/**
 * Fetches all tournaments, ordered by `startDate` ascending (Req 11.1).
 *
 * Returns the full list as an array — the Tournaments page renders every
 * tournament (name, startDate, endDate, venue, status, visibility) without
 * pagination.
 */
export async function getTournaments(db: Firestore): Promise<Tournament[]> {
  try {
    const snapshot = await getDocs(query(collection(db, COLLECTION), orderBy('startDate', 'asc')));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Tournament);
  } catch (err) {
    throw new RepositoryError('Failed to load tournaments', err, 'read');
  }
}

/**
 * Fetches a single tournament by id, or `null` if no such document exists.
 */
export async function getTournament(db: Firestore, id: string): Promise<Tournament | null> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Tournament;
  } catch (err) {
    throw new RepositoryError('Failed to load tournament', err, 'read');
  }
}

/**
 * Creates a new tournament document with `createdAt`/`updatedAt` set to
 * `serverTimestamp()` (Req 11.3, 15.5). Returns the new document id.
 */
export async function createTournament(db: Firestore, data: TournamentInput): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return ref.id;
  } catch (err) {
    throw new RepositoryError('Failed to create tournament', err, 'create');
  }
}

/**
 * Updates the changed fields on a tournament document and refreshes `updatedAt`
 * with `serverTimestamp()` (Req 11.4, 15.5).
 */
export async function updateTournament(
  db: Firestore,
  id: string,
  data: TournamentUpdate
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    throw new RepositoryError('Failed to update tournament', err, 'update');
  }
}

/**
 * Deletes a tournament document. Confirmation is handled by the calling layer
 * (Req 11.5).
 */
export async function deleteTournament(db: Firestore, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (err) {
    throw new RepositoryError('Failed to delete tournament', err, 'delete');
  }
}

// src/lib/repositories/members.repository.ts
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
import type { Member, MemberStatus, MembershipType } from '$lib/types/firestore.types';
import { RepositoryError } from './repository-error';

/** Firestore collection name for members. */
const COLLECTION = 'members';

/** Maximum number of members returned in a single page (Req 12.8). */
export const MAX_PAGE_SIZE = 25;

/**
 * Optional filters for {@link getMembers}.
 *
 * Both `status` and `membershipType` are applied server-side via Firestore
 * `where` constraints.
 */
export type MemberFilters = {
  status?: MemberStatus;
  membershipType?: MembershipType;
};

/** Shape accepted by {@link createMember} — the document minus server-managed fields. */
export type MemberInput = Omit<Member, 'id' | 'createdAt' | 'updatedAt'>;

/** Shape accepted by {@link updateMember} — any subset of fields except id/createdAt. */
export type MemberUpdate = Partial<Omit<Member, 'id' | 'createdAt'>>;

/**
 * Applies the {@link MemberFilters} to a list of members as a pure predicate.
 *
 * The `status` and `membershipType` filters are enforced server-side by the
 * Firestore query; applying them here as well keeps the predicate
 * self-contained and testable, and is harmless when the input already
 * satisfies the server-side constraints. An undefined filter matches every
 * member (no filtering applied).
 *
 * Exported as a pure function so it can be exercised by property tests
 * without a live Firestore connection.
 */
export function applyClientFilters(members: Member[], filters: MemberFilters = {}): Member[] {
  return members.filter(
    (member) =>
      (filters.status === undefined || member.status === filters.status) &&
      (filters.membershipType === undefined || member.membershipType === filters.membershipType)
  );
}

/**
 * Fetches a page of members.
 *
 * Builds a compound Firestore query applying optional `status` and
 * `membershipType` filters (via `where`), ordered by `status` ASC then
 * `expiryDate` ASC to match the `members` composite index defined in the
 * design (`status` ASC + `expiryDate` ASC). At most `pageSize` members are
 * returned, capped at {@link MAX_PAGE_SIZE} (Req 12.8).
 *
 * @returns the matching members plus the cursor (`lastDoc`) for the next page,
 *          or `null` when there are no more pages.
 */
export async function getMembers(
  db: Firestore,
  filters: MemberFilters = {},
  pageSize = MAX_PAGE_SIZE,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ members: Member[]; lastDoc: QueryDocumentSnapshot | null }> {
  const cappedSize = Math.min(pageSize, MAX_PAGE_SIZE);
  try {
    const constraints: QueryConstraint[] = [];
    if (filters.status !== undefined) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters.membershipType !== undefined) {
      constraints.push(where('membershipType', '==', filters.membershipType));
    }
    constraints.push(orderBy('status'), orderBy('expiryDate'));
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    constraints.push(limit(cappedSize));

    const snapshot = await getDocs(query(collection(db, COLLECTION), ...constraints));
    const members = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Member);

    const filtered = applyClientFilters(members, filters);
    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { members: filtered, lastDoc: newLastDoc };
  } catch (err) {
    throw new RepositoryError('Failed to load members', err, 'read');
  }
}

/**
 * Fetches a single member by id, or `null` if no such document exists.
 */
export async function getMember(db: Firestore, id: string): Promise<Member | null> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Member;
  } catch (err) {
    throw new RepositoryError('Failed to load member', err, 'read');
  }
}

/**
 * Creates a new member document with `createdAt`/`updatedAt` set to
 * `serverTimestamp()` (Req 12.4, 15.5). Returns the new document id.
 */
export async function createMember(db: Firestore, data: MemberInput): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return ref.id;
  } catch (err) {
    throw new RepositoryError('Failed to create member', err, 'create');
  }
}

/**
 * Updates the changed fields on a member document and refreshes `updatedAt`
 * with `serverTimestamp()` (Req 12.5, 15.5).
 */
export async function updateMember(db: Firestore, id: string, data: MemberUpdate): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    throw new RepositoryError('Failed to update member', err, 'update');
  }
}

/**
 * Deletes a member document.
 */
export async function deleteMember(db: Firestore, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (err) {
    throw new RepositoryError('Failed to delete member', err, 'delete');
  }
}

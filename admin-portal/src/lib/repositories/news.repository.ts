// src/lib/repositories/news.repository.ts
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
  Timestamp,
  type Firestore,
  type QueryConstraint,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import type { NewsArticle, NewsCategory, NewsStatus } from '$lib/types/firestore.types';
import { RepositoryError } from './repository-error';

/** Firestore collection name for news articles. */
const COLLECTION = 'news';

/** Maximum number of articles returned in a single page (Req 9.9). */
export const MAX_PAGE_SIZE = 20;

/**
 * Optional filters for {@link getNews}.
 *
 * Both `status` and `category` are applied server-side via Firestore `where`
 * constraints.
 */
export type NewsFilters = {
  status?: NewsStatus;
  category?: NewsCategory;
};

/** Shape accepted by {@link createNews} — the document minus server-managed fields. */
export type NewsInput = Omit<NewsArticle, 'id' | 'createdAt' | 'updatedAt'>;

/** Shape accepted by {@link updateNews} — any subset of fields except id/createdAt. */
export type NewsUpdate = Partial<Omit<NewsArticle, 'id' | 'createdAt'>>;

/**
 * Converts a `datetime-local` form value (or any value `Date` can parse) into a
 * Firestore {@link Timestamp}, so components can supply an explicit
 * `publishedAt` without importing the Firestore SDK directly (Req 15.2).
 *
 * Returns `null` when the value is empty or cannot be parsed, matching the
 * article document's nullable `publishedAt` field (Req 9.5).
 */
export function dateToTimestamp(value: string): Timestamp | null {
  if (value.trim() === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Timestamp.fromDate(date);
}

/**
 * Builds the Firestore `where` constraints for the given filters.
 *
 * Exported as a pure helper so the filter-to-constraint mapping can be
 * exercised by tests without a live Firestore connection.
 */
export function buildNewsConstraints(filters: NewsFilters = {}): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];
  if (filters.status !== undefined) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters.category !== undefined) {
    constraints.push(where('category', '==', filters.category));
  }
  return constraints;
}

/**
 * Fetches a page of news articles.
 *
 * Applies optional `status` and `category` filters (via `where`), ordered by
 * `createdAt` descending (Req 9.9) so the most recently created articles
 * appear first. At most `pageSize` articles are returned, capped at
 * {@link MAX_PAGE_SIZE} (Req 9.9).
 *
 * @returns the matching articles plus the cursor (`lastDoc`) for the next
 *          page, or `null` when there are no more pages.
 */
export async function getNews(
  db: Firestore,
  filters: NewsFilters = {},
  pageSize = MAX_PAGE_SIZE,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ articles: NewsArticle[]; lastDoc: QueryDocumentSnapshot | null }> {
  const cappedSize = Math.min(pageSize, MAX_PAGE_SIZE);
  try {
    const constraints: QueryConstraint[] = buildNewsConstraints(filters);
    constraints.push(orderBy('createdAt', 'desc'));
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    constraints.push(limit(cappedSize));

    const snapshot = await getDocs(query(collection(db, COLLECTION), ...constraints));
    const articles = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as NewsArticle);

    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { articles, lastDoc: newLastDoc };
  } catch (err) {
    throw new RepositoryError('Failed to load news articles', err, 'read');
  }
}

/**
 * Fetches a single news article by id, or `null` if no such document exists.
 */
export async function getNewsArticle(db: Firestore, id: string): Promise<NewsArticle | null> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as NewsArticle;
  } catch (err) {
    throw new RepositoryError('Failed to load news article', err, 'read');
  }
}

/**
 * Creates a new news article with `createdAt`/`updatedAt` set to
 * `serverTimestamp()` and `authorId` taken from the supplied `data`
 * (Req 9.6, 15.5). Returns the new document id.
 */
export async function createNews(db: Firestore, data: NewsInput): Promise<string> {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return ref.id;
  } catch (err) {
    throw new RepositoryError('Failed to create news article', err, 'create');
  }
}

/**
 * Updates the changed fields on a news article and refreshes `updatedAt` with
 * `serverTimestamp()` (Req 15.5).
 *
 * When the article's status is being set to `published` and no `publishedAt`
 * value is supplied by the caller, the repository reads the current document
 * and, if its `publishedAt` is not already set (null/undefined), stamps
 * `publishedAt` with `serverTimestamp()` (Req 9.7). This preserves an existing
 * publish date on re-publish while ensuring a first publish always records
 * when it happened. Passing `publishedAt` explicitly bypasses this lookup.
 */
export async function updateNews(db: Firestore, id: string, data: NewsUpdate): Promise<void> {
  try {
    const patch: NewsUpdate = { ...data, updatedAt: serverTimestamp() };

    if (data.status === 'published' && data.publishedAt === undefined) {
      const snapshot = await getDoc(doc(db, COLLECTION, id));
      const existing = snapshot.exists()
        ? (snapshot.data() as Partial<NewsArticle>).publishedAt
        : undefined;
      if (existing === null || existing === undefined) {
        patch.publishedAt = serverTimestamp();
      }
    }

    await updateDoc(doc(db, COLLECTION, id), patch);
  } catch (err) {
    throw new RepositoryError('Failed to update news article', err, 'update');
  }
}

/**
 * Deletes a news article document. Confirmation is handled by the calling
 * layer.
 */
export async function deleteNews(db: Firestore, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (err) {
    throw new RepositoryError('Failed to delete news article', err, 'delete');
  }
}

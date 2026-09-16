// src/lib/repositories/gallery.repository.ts
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
  writeBatch,
  increment,
  type Firestore,
  type QueryConstraint,
  type QueryDocumentSnapshot
} from 'firebase/firestore';
import type { GalleryAlbum, GalleryPhoto, Visibility } from '$lib/types/firestore.types';
import { RepositoryError } from './repository-error';

/** Firestore collection name for gallery albums. */
const COLLECTION = 'gallery';

/** Subcollection name for photos nested under each album. */
const PHOTOS_SUBCOLLECTION = 'photos';

/** Maximum number of photos returned in a single page (Req 10.11). */
export const MAX_PHOTO_PAGE_SIZE = 50;

/**
 * Optional filters for {@link getAlbums}.
 *
 * `visibility` is applied server-side via a Firestore `where` constraint,
 * matching the `visibility` ASC + `createdAt` DESC composite index.
 */
export type AlbumFilters = {
  visibility?: Visibility;
};

/** Shape accepted by {@link createAlbum} — the document minus server-managed fields. `photoCount` is optional and defaults to 0. */
export type AlbumInput = Omit<GalleryAlbum, 'id' | 'createdAt' | 'updatedAt' | 'photoCount'> & {
  photoCount?: number;
};

/** Shape accepted by {@link updateAlbum} — any subset of fields except id/createdAt. */
export type AlbumUpdate = Partial<Omit<GalleryAlbum, 'id' | 'createdAt'>>;

/** Shape accepted by {@link createPhoto} — the document minus server-managed fields. */
export type PhotoInput = Omit<GalleryPhoto, 'id' | 'createdAt'>;

/** Shape accepted by {@link updatePhoto} — any subset of fields except id/createdAt. */
export type PhotoUpdate = Partial<Omit<GalleryPhoto, 'id' | 'createdAt'>>;

/**
 * Fetches gallery albums, ordered by `createdAt` descending so the most
 * recently created albums appear first (matching the `visibility` +
 * `createdAt` composite index). An optional `visibility` filter is applied
 * server-side via a `where` constraint.
 */
export async function getAlbums(
  db: Firestore,
  filters: AlbumFilters = {}
): Promise<GalleryAlbum[]> {
  try {
    const constraints: QueryConstraint[] = [];
    if (filters.visibility !== undefined) {
      constraints.push(where('visibility', '==', filters.visibility));
    }
    constraints.push(orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(query(collection(db, COLLECTION), ...constraints));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as GalleryAlbum);
  } catch (err) {
    throw new RepositoryError('Failed to load gallery albums', err, 'read');
  }
}

/**
 * Fetches a single album by id, or `null` if no such document exists.
 */
export async function getAlbum(db: Firestore, id: string): Promise<GalleryAlbum | null> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as GalleryAlbum;
  } catch (err) {
    throw new RepositoryError('Failed to load gallery album', err, 'read');
  }
}

/**
 * Creates a new album with `createdAt`/`updatedAt` set to `serverTimestamp()`
 * (Req 10.5, 15.5). `photoCount` is initialised to 0 when not supplied.
 * Returns the new document id.
 */
export async function createAlbum(db: Firestore, data: AlbumInput): Promise<string> {
  try {
    const { photoCount, ...rest } = data;
    const ref = await addDoc(collection(db, COLLECTION), {
      ...rest,
      photoCount: photoCount ?? 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return ref.id;
  } catch (err) {
    throw new RepositoryError('Failed to create gallery album', err, 'create');
  }
}

/**
 * Updates the changed fields on an album and refreshes `updatedAt` with
 * `serverTimestamp()` (Req 10.7, 15.5).
 */
export async function updateAlbum(db: Firestore, id: string, data: AlbumUpdate): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    throw new RepositoryError('Failed to update gallery album', err, 'update');
  }
}

/**
 * Deletes an album document. Deletion of nested photos and their Storage
 * objects is handled by the calling layer (Req 10.8).
 */
export async function deleteAlbum(db: Firestore, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (err) {
    throw new RepositoryError('Failed to delete gallery album', err, 'delete');
  }
}

/**
 * Fetches a page of photos from the `gallery/{albumId}/photos` subcollection,
 * ordered by `createdAt` ascending. At most `pageSize` photos are returned,
 * capped at {@link MAX_PHOTO_PAGE_SIZE} (Req 10.11).
 *
 * @returns the matching photos plus the cursor (`lastDoc`) for the next page,
 *          or `null` when there are no more pages.
 */
export async function getAlbumPhotos(
  db: Firestore,
  albumId: string,
  pageSize = MAX_PHOTO_PAGE_SIZE,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ photos: GalleryPhoto[]; lastDoc: QueryDocumentSnapshot | null }> {
  const cappedSize = Math.min(pageSize, MAX_PHOTO_PAGE_SIZE);
  try {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'asc')];
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    constraints.push(limit(cappedSize));

    const snapshot = await getDocs(
      query(collection(db, COLLECTION, albumId, PHOTOS_SUBCOLLECTION), ...constraints)
    );
    const photos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as GalleryPhoto);

    const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { photos, lastDoc: newLastDoc };
  } catch (err) {
    throw new RepositoryError('Failed to load album photos', err, 'read');
  }
}

/**
 * Adds a photo document to the `gallery/{albumId}/photos` subcollection and
 * increments the parent album's `photoCount` in a single atomic batch
 * (Req 10.5). The photo's `createdAt` is set to `serverTimestamp()`.
 *
 * Because a batch has no auto-id return like `addDoc`, the new photo id is
 * pre-generated with `doc()` on the subcollection and returned to the caller.
 *
 * @returns the new photo document id.
 */
export async function createPhoto(
  db: Firestore,
  albumId: string,
  data: PhotoInput
): Promise<string> {
  try {
    const photoRef = doc(collection(db, COLLECTION, albumId, PHOTOS_SUBCOLLECTION));
    const albumRef = doc(db, COLLECTION, albumId);

    const batch = writeBatch(db);
    batch.set(photoRef, {
      ...data,
      createdAt: serverTimestamp()
    });
    batch.update(albumRef, {
      photoCount: increment(1),
      updatedAt: serverTimestamp()
    });
    await batch.commit();

    return photoRef.id;
  } catch (err) {
    throw new RepositoryError('Failed to create album photo', err, 'create');
  }
}

/**
 * Updates the changed fields on a photo document within the album's
 * `photos` subcollection (Req 10.7). Photo documents have no `updatedAt`
 * field, so none is stamped here.
 */
export async function updatePhoto(
  db: Firestore,
  albumId: string,
  photoId: string,
  data: PhotoUpdate
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, albumId, PHOTOS_SUBCOLLECTION, photoId), {
      ...data
    });
  } catch (err) {
    throw new RepositoryError('Failed to update album photo', err, 'update');
  }
}

/**
 * Deletes a photo document from the `gallery/{albumId}/photos` subcollection
 * and decrements the parent album's `photoCount` in a single atomic batch
 * (Req 10.8). Deletion of the associated Storage object is handled by the
 * calling layer.
 */
export async function deletePhoto(db: Firestore, albumId: string, photoId: string): Promise<void> {
  try {
    const photoRef = doc(db, COLLECTION, albumId, PHOTOS_SUBCOLLECTION, photoId);
    const albumRef = doc(db, COLLECTION, albumId);

    const batch = writeBatch(db);
    batch.delete(photoRef);
    batch.update(albumRef, {
      photoCount: increment(-1),
      updatedAt: serverTimestamp()
    });
    await batch.commit();
  } catch (err) {
    throw new RepositoryError('Failed to delete album photo', err, 'delete');
  }
}

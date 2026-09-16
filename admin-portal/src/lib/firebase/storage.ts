/**
 * Storage upload helper for the Admin_Portal.
 *
 * `.svelte` components must not import the Firebase SDK directly (see
 * CONTRIBUTING.md). This module wraps the resumable Storage upload so that
 * `ImageUpload.svelte` (and any other component) can upload an image and
 * receive its download URL without importing `firebase/storage`.
 *
 * Implements the Image Upload Flow from the design document:
 * `uploadBytesResumable` → progress callback → `getDownloadURL`.
 */

import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '$lib/firebase/client';

/**
 * Uploads a file to Firebase Storage at the given path and resolves with the
 * resulting download URL.
 *
 * @param storagePath - Destination path, e.g. `players/{playerId}/photo`.
 * @param file - The file to upload (should be pre-validated by the caller).
 * @param onProgress - Optional callback invoked with upload progress as a
 *                      percentage (0–100) as bytes transfer.
 * @returns The download URL of the uploaded object.
 */
export function uploadImage(
  storagePath: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const storageRef = ref(storage, storagePath);
  const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

  return new Promise<string>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(Math.round(percent));
        }
      },
      (error) => reject(error),
      () => {
        getDownloadURL(task.snapshot.ref).then(resolve).catch(reject);
      }
    );
  });
}

/**
 * Deletes an object from Firebase Storage at the given path.
 *
 * Wraps `deleteObject` so `.svelte` components can request a Storage deletion
 * (e.g. removing a player's photo when the player is deleted) without importing
 * `firebase/storage` directly (see CONTRIBUTING.md).
 *
 * @param storagePath - Path of the object to delete, e.g. `players/{playerId}/photo`.
 */
export function deleteImage(storagePath: string): Promise<void> {
  const storageRef = ref(storage, storagePath);
  return deleteObject(storageRef);
}

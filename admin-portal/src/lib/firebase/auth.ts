import {
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  type User,
  type UserCredential
} from 'firebase/auth';
import { auth } from './client';
import type { UserRole } from '$lib/types/firestore.types';

/**
 * Sign a user in with email and password.
 *
 * Firebase Auth uses `browserLocalPersistence` by default, so the session is
 * persisted across page refreshes (Requirement 2.7). Raw Firebase errors are
 * propagated to the caller, which is responsible for mapping error codes to
 * user-readable messages via `mapAuthError`.
 */
export function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Send a password reset email for the given address.
 */
export function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email.trim());
}

/**
 * Sign the current user out.
 */
export function signOutUser(): Promise<void> {
  return signOut(auth);
}

/**
 * Read the `role` custom claim from a user's ID token.
 *
 * Forces a token refresh so newly-assigned claims are reflected immediately.
 * Returns `null` when no valid role claim is present.
 */
export async function getIdTokenRole(user: User): Promise<UserRole | null> {
  const result = await user.getIdTokenResult(true);
  const role = result.claims.role;
  if (role === 'admin' || role === 'editor' || role === 'viewer') {
    return role;
  }
  return null;
}

/**
 * Change the current user's password.
 *
 * Requires the user to re-authenticate with their current password first
 * (Firebase requires a recent sign-in for sensitive operations). Throws a
 * Firebase error if re-auth or update fails — the caller maps it via
 * `mapAuthError`.
 */
export async function changePassword(
  user: User,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const credential = EmailAuthProvider.credential(user.email!, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

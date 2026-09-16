/**
 * Server-side API endpoint for user management.
 *
 * POST /api/users — Creates a new Firebase Auth user, sets the role custom
 * claim, and writes the `users/{uid}` Firestore record. Only accessible by
 * authenticated admins (verified via the session cookie + admin role check).
 *
 * This runs server-side (SvelteKit endpoint / Netlify function), so it has
 * access to firebase-admin, which can create Auth accounts and set claims —
 * things the client SDK cannot do.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminAuth, adminDb } from '$lib/server/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const POST: RequestHandler = async ({ request, locals }) => {
  // Only admins may create users.
  if (!locals.isAuthenticated || locals.role !== 'admin') {
    throw error(403, 'Only admins can create users.');
  }

  const body = await request.json();
  const { email, password, displayName, role, active } = body as {
    email?: string;
    password?: string;
    displayName?: string;
    role?: string;
    active?: boolean;
  };

  // Validate required fields.
  if (!email || !password || !displayName || !role) {
    throw error(400, 'Missing required fields: email, password, displayName, role.');
  }
  if (!['admin', 'editor', 'viewer'].includes(role)) {
    throw error(400, 'Invalid role. Must be admin, editor, or viewer.');
  }
  if (password.length < 6) {
    throw error(400, 'Password must be at least 6 characters.');
  }

  try {
    // 1. Create the Firebase Auth account.
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: true
    });

    // 2. Set the role custom claim.
    await adminAuth.setCustomUserClaims(userRecord.uid, { role });

    // 3. Write the Firestore users/{uid} record.
    await adminDb.collection('users').doc(userRecord.uid).set({
      displayName,
      email,
      role,
      active: active ?? true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return json(
      { uid: userRecord.uid, email, displayName, role },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to create user.';
    // Firebase Admin errors have a `code` property (e.g. auth/email-already-exists).
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code: unknown }).code)
        : '';
    if (code === 'auth/email-already-exists') {
      throw error(409, 'A user with this email already exists.');
    }
    throw error(500, message);
  }
};

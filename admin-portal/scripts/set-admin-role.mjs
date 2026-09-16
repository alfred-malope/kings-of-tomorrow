/**
 * One-time admin bootstrap script for the K.O.T FC Admin Portal.
 *
 * It creates (or reuses) a Firebase Auth user, sets their `role` custom claim,
 * and writes a matching document to the `users/{uid}` Firestore collection so
 * the account shows up in the portal's User Management page.
 *
 * Usage (run from the admin-portal/ directory):
 *
 *   node scripts/set-admin-role.mjs <email> <password> [role]
 *
 *   - email    : the login email (required)
 *   - password : the login password, min 6 chars (required when creating a new user)
 *   - role     : admin | editor | viewer  (optional, defaults to "admin")
 *
 * Requires a Firebase service account key. Download it from:
 *   Firebase Console -> Project settings -> Service accounts -> Generate new private key
 * Save it as  admin-portal/scripts/service-account.json  (this path is gitignored).
 * Or point GOOGLE_APPLICATION_CREDENTIALS at your key file.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VALID_ROLES = ['admin', 'editor', 'viewer'];

function fail(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

// ── Parse arguments ──────────────────────────────────────────────────────────
const [, , email, password, roleArg] = process.argv;
const role = roleArg ?? 'admin';

if (!email) {
  fail('Missing email. Usage: node scripts/set-admin-role.mjs <email> <password> [role]');
}
if (!VALID_ROLES.includes(role)) {
  fail(`Invalid role "${role}". Must be one of: ${VALID_ROLES.join(', ')}`);
}

// ── Initialise the Admin SDK ─────────────────────────────────────────────────
const keyPath = resolve(__dirname, 'service-account.json');
let app;
if (existsSync(keyPath)) {
  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
  app = initializeApp({ credential: cert(serviceAccount) });
  console.log(`Using service account: ${keyPath}`);
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  app = initializeApp({ credential: applicationDefault() });
  console.log('Using credentials from GOOGLE_APPLICATION_CREDENTIALS');
} else {
  fail(
    'No credentials found. Save your service account key at ' +
      'admin-portal/scripts/service-account.json, or set GOOGLE_APPLICATION_CREDENTIALS.'
  );
}

const auth = getAuth(app);
const db = getFirestore(app);

// ── Create or reuse the user, then set the role claim ────────────────────────
async function main() {
  let user;
  try {
    user = await auth.getUserByEmail(email);
    console.log(`Found existing user: ${email} (uid: ${user.uid})`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      if (!password || password.length < 6) {
        fail('Creating a new user requires a password of at least 6 characters.');
      }
      user = await auth.createUser({ email, password, emailVerified: true });
      console.log(`Created new user: ${email} (uid: ${user.uid})`);
    } else {
      throw err;
    }
  }

  // Set the role custom claim — this is what the portal reads for RBAC.
  await auth.setCustomUserClaims(user.uid, { role });
  console.log(`Set custom claim { role: "${role}" } on ${email}`);

  // Mirror the account into the users/{uid} Firestore collection so it appears
  // in the portal's User Management page.
  await db
    .collection('users')
    .doc(user.uid)
    .set(
      {
        displayName: user.displayName ?? email.split('@')[0],
        email,
        role,
        active: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  console.log(`Wrote users/${user.uid} Firestore record`);

  console.log(
    `\n✅ Done. Sign in at the portal with:\n   email:    ${email}\n   role:     ${role}\n` +
      `\nNote: if this user was already signed in somewhere, they must sign out and back in\n` +
      `(or refresh their ID token) for the new role claim to take effect.\n`
  );
  process.exit(0);
}

main().catch((err) => {
  fail(err.message ?? String(err));
});

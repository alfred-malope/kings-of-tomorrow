/**
 * Firebase Admin SDK singleton for server-side operations.
 *
 * Used by API routes (e.g. user creation) that need privileges the client SDK
 * cannot provide (creating Auth accounts, setting custom claims).
 *
 * The service account is loaded from `scripts/service-account.json` during
 * development, and from `FIREBASE_SERVICE_ACCOUNT` env var in production
 * (Netlify environment variable containing the JSON string).
 */
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Try env var first (production / Netlify)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    return initializeApp({ credential: cert(serviceAccount) });
  }

  // Fallback to local file (development)
  const keyPath = resolve('scripts/service-account.json');
  if (existsSync(keyPath)) {
    const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
    return initializeApp({ credential: cert(serviceAccount) });
  }

  throw new Error(
    'Firebase Admin: no credentials found. Set FIREBASE_SERVICE_ACCOUNT env var or place scripts/service-account.json.'
  );
}

const app = getAdminApp();
export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

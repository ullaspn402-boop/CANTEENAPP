import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID || 'smart-college-canteen-bb8a7';

function formatPrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  let cleaned = key.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.replace(/\\n/g, '\n').replace(/\r/g, '');
}

if (!getApps().length) {
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();

  let initialized = false;

  if (privateKey && clientEmail) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      initialized = true;
    } catch (certErr) {
      console.error('Failed to initialize Firebase Admin with service account credentials:', certErr);
    }
  }

  if (!initialized) {
    try {
      initializeApp({
        projectId,
      });
    } catch (fallbackErr) {
      console.error('Failed to initialize fallback Firebase Admin app:', fallbackErr);
    }
  }
}

export const adminAuth = getAuth();


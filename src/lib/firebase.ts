import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDocFromServer
} from 'firebase/firestore';

// Try loading bundled firebase-applet-config.json
let appletConfig: Record<string, string> = {};
try {
  // @ts-ignore
  import('../../firebase-applet-config.json').then((module) => {
    appletConfig = module.default || module;
  }).catch(() => {
    // optional fallback
  });
} catch {
  // ignore
}

// Fallback chain: JSON config -> Vite env variables -> safe defaults
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    'AIzaSyAp4R41XoGv7BynqHeWT67c8M_ULHs_Sy4',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    'polar-drive-c6rpq.firebaseapp.com',
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    'polar-drive-c6rpq',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'polar-drive-c6rpq.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    '606041705334',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    '1:606041705334:web:4ea32d3ef3171f54d60857'
};

const databaseId =
  import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
  'ai-studio-sibersupervisiin-e85c9c5d-7154-4dfc-b7cd-825c1e32ea17';

// Initialize Firebase App
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth & Firestore with dedicated Database ID
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app, databaseId);

// Operation types for strict Firestore error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Verification function according to skill directives
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Koneksi ke Firestore berhasil.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Harap periksa konfigurasi dan koneksi Firebase Anda.');
    } else {
      console.log('[Firebase] Status verifikasi Firestore:', error instanceof Error ? error.message : error);
    }
    return false;
  }
}

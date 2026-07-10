/**
 * Inicialização do Firebase (seção 8 da especificação).
 * Config via variáveis VITE_FB_* (.env / .env.local); com VITE_USE_EMULATORS=true
 * conecta na Emulator Suite local (auth 9099 · firestore 8080 · storage 9199 · functions 5001).
 */
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const env = import.meta.env;

export const app = initializeApp({
  apiKey: env.VITE_FB_API_KEY,
  authDomain: env.VITE_FB_AUTH_DOMAIN,
  projectId: env.VITE_FB_PROJECT_ID,
  storageBucket: env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FB_MESSAGING_SENDER_ID,
  appId: env.VITE_FB_APP_ID,
});

export const auth = getAuth(app);
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
export const storage = getStorage(app);
export const functions = getFunctions(app, 'southamerica-east1');

export const googleProvider = new GoogleAuthProvider();
// dica de domínio para o seletor de contas do Workspace (a restrição real é nas regras)
googleProvider.setCustomParameters({ hd: env.VITE_FB_HD_HINT ?? 'tecnofink.com', prompt: 'select_account' });

if (env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);

  // atalhos de desenvolvimento/testes com os emuladores
  // (as contas do seed têm a senha demo1234; nunca entram no build de produção)
  if (import.meta.env.DEV) {
    void import('firebase/auth').then(({ signInWithEmailAndPassword }) => {
      (window as unknown as Record<string, unknown>).__pfDevLogin =
        (email: string, senha = 'demo1234') => signInWithEmailAndPassword(auth, email, senha);
    });
    void import('firebase/firestore').then((fs) => {
      (window as unknown as Record<string, unknown>).__pfFs = { db, ...fs };
    });
  }
}

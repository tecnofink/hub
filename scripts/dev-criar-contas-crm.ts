/** Cria no emulador as contas dos usuários reais do CRM (simula o 1º login). */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';

const CONTAS = [
  ['danielcrm', 'analista.dados1@tecnofink.com', 'Daniel Moacir', 'Analista de Dados', 'TI'],
  ['wanderson', 'wanderson.leite@tecnofink.com', 'Wanderson Leite', 'Analista', 'Operações'],
  ['gestaoctr', 'gestaocontratos@tecnofink.com', 'Gestão de Contratos', 'Equipe', 'Contratos'],
  ['marketing', 'marketing@tecnofink.com', 'Marketing Tecnofink', 'Equipe', 'Marketing'],
];

async function main() {
  const app = initializeApp({ projectId: 'demo-portal-flux' });
  const auth = getAuth(app);
  const db = getFirestore(app);
  for (const [uid, email, nome, cargo, depto] of CONTAS) {
    try {
      await auth.createUser({ uid, email, displayName: nome, emailVerified: true, password: 'demo1234' });
    } catch (e) {
      if (!String(e).includes('already exists')) throw e;
    }
    await db.doc('users/' + uid).set({
      nome, email, foto: '', cargo, depto, empresa: 'Tecnofink LTDA',
      roles: ['user'], ativo: true, apres: '', niver: '',
    }, { merge: true });
    console.log('conta pronta:', email);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

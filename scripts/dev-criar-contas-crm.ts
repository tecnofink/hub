/**
 * Cria contas de desenvolvimento no EMULADOR (simula o 1º login).
 * Personas FICTÍCIAS — nunca dados reais de funcionários (o repositório é
 * público). Para testar conciliação com e-mails reais, crie um
 * scripts/contas.local.json (ignorado pelo git) e carregue-o aqui.
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';

const CONTAS = [
  ['devadmin', 'admin@exemplo.test', 'Ana Desenvolvedora', 'Analista de Dados', 'Técnico'],
  ['devuser1', 'user1@exemplo.test', 'Bruno Teste', 'Analista', 'Comercial'],
  ['devuser2', 'user2@exemplo.test', 'Carla Exemplo', 'Coordenação', 'Administrativo'],
  ['devuser3', 'user3@exemplo.test', 'Diego Amostra', 'Analista', 'Qualidade'],
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
      nome, email, foto: '', cargo, depto, empresa: 'Tecnofink Matriz',
      roles: ['user'], ativo: true, apres: '', niver: '',
    }, { merge: true });
    console.log('conta pronta:', email);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

/**
 * Popula a Emulator Suite com os dados de demonstração (npm run seed).
 * Requer os emuladores rodando (npm run emuladores). Cria as contas no Auth
 * emulator e os documentos no Firestore — nunca aponta para produção.
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { seedState } from '../src/data/seed';

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
const projectId = process.env.GCLOUD_PROJECT ?? 'demo-portal-flux';

async function main() {
  const app = initializeApp({ projectId });
  const db = getFirestore(app);
  const auth = getAuth(app);
  const s = seedState();

  // contas no Auth emulator (uid = id do seed, para casar com os docs;
  // a senha demo1234 permite login programático em testes)
  for (const u of s.users) {
    try {
      await auth.createUser({ uid: u.id, email: u.email, displayName: u.nome, emailVerified: true, password: 'demo1234' });
    } catch (e) {
      if (!String(e).includes('already exists')) throw e;
    }
  }

  const batch = db.batch();

  batch.set(db.doc('config/portal'), { domains: s.domains });

  for (const u of s.users) {
    const { id, ...data } = u;
    batch.set(db.doc('users/' + id), { ...data, foto: '' });
  }
  for (const p of s.projects) {
    const { id, ...data } = p;
    batch.set(db.doc('projects/' + id), data);
  }
  for (const c of s.cycles) {
    const { id, ...data } = c;
    batch.set(db.doc('cycles/' + id), data);
  }
  for (const t of s.tools) {
    const { id, ...data } = t;
    batch.set(db.doc('tools/' + id), data);
  }
  for (const e of s.extraProjs) {
    const { id, ...data } = e;
    batch.set(db.doc('extraProjs/' + id), data);
  }

  // quadros de tarefas: dono + membros denormalizados (regras/consultas)
  for (const [pid, quadro] of Object.entries(s.tarefas)) {
    const flux = s.projects.find((p) => p.id === pid);
    const livre = s.extraProjs.find((e) => e.id === pid);
    const uid = flux?.uid ?? livre?.uid;
    if (!uid) continue;
    const membrosIds = livre?.membrosIds ?? [uid];
    batch.set(db.doc('tarefas/' + pid), { ...quadro, uid, membrosIds });
  }

  // comentários de demonstração no projeto compartilhado (CRM)
  const agora = Date.now();
  const comentarios = [
    { tarefaId: 'TASK-002', autorId: 'marcos', autorNome: 'Marcos Freitas', texto: 'Daniel, começa pelas áreas de Operações e Financeiro — são as mais críticas.', criadoEm: new Date(agora - 86_400_000 * 2).toISOString() },
    { tarefaId: 'TASK-002', autorId: 'daniel', autorNome: 'Daniel Rocha', texto: 'Fechado. Agenda das duas primeiras entrevistas: https://calendar.google.com/', criadoEm: new Date(agora - 86_400_000).toISOString() },
  ];
  comentarios.forEach((cm) => batch.set(db.collection('tarefas').doc('tp1').collection('comentarios').doc(), cm));

  for (const [uid, a] of Object.entries(s.access)) {
    batch.set(db.doc('access/' + uid), a);
  }

  s.logs.forEach((l, i) => {
    batch.set(db.collection('logs').doc(), { ...l, at: Timestamp.fromMillis(Date.now() - i * 60_000) });
  });

  await batch.commit();
  console.log(`Seed concluído em ${projectId}: ${s.users.length} usuários, ${s.projects.length} projetos, ${s.cycles.length} ciclos.`);
  console.log('No login do app (emulador), entre com qualquer conta listada — ex.: ana.lima@tecnofink.com.');
}

main().catch((e) => {
  console.error('Falha no seed:', e);
  process.exit(1);
});

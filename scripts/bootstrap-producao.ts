/**
 * Bootstrap do projeto Firebase de PRODUÇÃO (rodar uma única vez):
 *   1. grava config/portal com os domínios liberados iniciais;
 *   2. opcionalmente promove um e-mail a administrador (a conta precisa
 *      já ter feito o primeiro login no portal).
 *
 * Uso (com credenciais de admin do projeto):
 *   npx tsx scripts/bootstrap-producao.ts --projeto <PROJECT_ID> [--admin email@tecnofink.com]
 *
 * Credenciais: defina GOOGLE_APPLICATION_CREDENTIALS apontando para a chave
 * de uma service account do projeto (Console → IAM → Service accounts), ou
 * rode `gcloud auth application-default login`.
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DOMINIOS_INICIAIS = ['tecnofink.com', 'grupotecnofink.com.br'];

function arg(nome: string): string | null {
  const i = process.argv.indexOf('--' + nome);
  return i >= 0 ? process.argv[i + 1] ?? null : null;
}

async function main() {
  const projectId = arg('projeto');
  if (!projectId) {
    console.error('Informe o projeto: npx tsx scripts/bootstrap-producao.ts --projeto <PROJECT_ID> [--admin email]');
    process.exit(1);
  }
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.error('FIRESTORE_EMULATOR_HOST está definido — este script é para produção. Remova a variável.');
    process.exit(1);
  }

  const app = initializeApp({ projectId });
  const db = getFirestore(app);

  const cfg = db.doc('config/portal');
  const atual = await cfg.get();
  if (!atual.exists) {
    await cfg.set({ domains: DOMINIOS_INICIAIS });
    console.log('config/portal criado com domínios:', DOMINIOS_INICIAIS.join(', '));
  } else {
    console.log('config/portal já existe — domínios atuais:', (atual.data()!.domains ?? []).join(', '));
  }

  const adminEmail = arg('admin');
  if (adminEmail) {
    const q = await db.collection('users').where('email', '==', adminEmail.toLowerCase()).limit(1).get();
    if (q.empty) {
      console.error(`Nenhum usuário com e-mail ${adminEmail}. A pessoa precisa fazer o primeiro login no portal antes.`);
      process.exit(1);
    }
    const docu = q.docs[0];
    const roles: string[] = docu.data().roles ?? ['user'];
    if (!roles.includes('admin')) roles.push('admin');
    await docu.ref.update({ roles });
    console.log(`${adminEmail} agora é administrador (papéis: ${roles.join(', ')}).`);
  }

  console.log('Bootstrap concluído. Próximos passos: criar o ciclo e atribuir o papel Comitê pela UI (Admin do Flux).');
}

main().catch((e) => {
  console.error('Falha no bootstrap:', e);
  process.exit(1);
});

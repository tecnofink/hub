/**
 * Migração do Gestor de Projetos antigo (Vercel + Supabase) para o Portal Flux
 * (Firestore) — ponto P17 da especificação.
 *
 * Lê projetos, membros, tarefas, comentários e anexos via REST do Supabase
 * (service role) e grava no Firestore como projetos livres do Gestor de
 * Tarefas. Usuários são conciliados POR E-MAIL: cada membro precisa já ter
 * feito o primeiro login no portal; membros sem conta ficam de fora (aviso).
 *
 * Uso:
 *   $env:SUPABASE_URL="https://<ref>.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE="<service role key>"   # está em "Dados Supabase.txt"
 *   npx tsx scripts/migrar-crm.ts                      # → Emulator Suite (padrão)
 *   npx tsx scripts/migrar-crm.ts --producao --projeto <PROJECT_ID> [--com-anexos]
 *
 * Sem --producao, exige os emuladores rodando (npm run emuladores) e grava no
 * projeto demo. Com --com-anexos, baixa cada arquivo do Storage do Supabase e
 * o reenvia ao Storage do Firebase (senão, migra só os metadados).
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const args = process.argv.slice(2);
const producao = args.includes('--producao');
const comAnexos = args.includes('--com-anexos');
const projArg = args.indexOf('--projeto');
const projectId = projArg >= 0 ? args[projArg + 1] : producao ? null : 'demo-portal-flux';

const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE ?? '';

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE (valores em "Dados Supabase.txt").');
  process.exit(1);
}
if (!projectId) {
  console.error('Com --producao, informe também --projeto <PROJECT_ID>.');
  process.exit(1);
}
if (!producao) {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= '127.0.0.1:9199';
} else if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('FIRESTORE_EMULATOR_HOST definido junto com --producao — remova a variável.');
  process.exit(1);
}

const cab = { apikey: SERVICE_ROLE, Authorization: 'Bearer ' + SERVICE_ROLE };

async function rest<T>(caminho: string): Promise<T> {
  const r = await fetch(`${SUPABASE_URL}${caminho}`, { headers: cab });
  if (!r.ok) throw new Error(`${caminho} → HTTP ${r.status}: ${await r.text()}`);
  return r.json() as Promise<T>;
}

interface PgProjeto { id: string; nome: string; descricao: string | null; criado_por: string; criado_em: string; arquivado: boolean }
interface PgMembro { projeto_id: string; usuario_id: string; papel: 'admin' | 'editor' | 'leitor' }
interface PgTarefa { id: string; projeto_id: string; codigo: string; fase: string; titulo: string; descricao: string | null; responsavel: string | null; data_inicio: string | null; prazo: string | null; prioridade: 'Alta' | 'Média' | 'Baixa'; status: string; data_conclusao: string | null; criado_em: string }
interface PgComentario { id: string; tarefa_id: string; autor_id: string; texto: string; criado_em: string; editado_em: string | null }
interface PgAnexo { id: string; tarefa_id: string; nome_arquivo: string; storage_path: string; tamanho_bytes: number; enviado_por: string; enviado_em: string }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ST_MAP: Record<string, 'nao' | 'and' | 'rev' | 'conc'> = {
  'Não iniciada': 'nao', 'Em progresso': 'and', 'Em revisão': 'rev', 'Concluída': 'conc',
  'Atrasada': 'and', // derivada no portal (prazo vencido reaparece como atrasada)
};

async function main() {
  console.log(`Origem: ${SUPABASE_URL} · destino: ${projectId}${producao ? ' (PRODUÇÃO)' : ' (emulador)'}${comAnexos ? ' · com anexos' : ' · só metadados de anexos'}`);
  const app = initializeApp({ projectId: projectId!, storageBucket: producao ? `${projectId}.firebasestorage.app` : `${projectId}.appspot.com` });
  const db = getFirestore(app);

  // 1) contas do Supabase Auth → e-mail
  const authUsers = await rest<{ users: { id: string; email: string }[] }>('/auth/v1/admin/users?per_page=1000');
  const emailPorUuid = new Map(authUsers.users.map((u) => [u.id, (u.email ?? '').toLowerCase()]));

  // 2) contas do portal → uid por e-mail
  const portalUsers = await db.collection('users').get();
  const uidPorEmail = new Map(portalUsers.docs.map((d) => [(d.data().email as string).toLowerCase(), d.id]));
  const uidDoUuid = (uuid: string | null): string | null => {
    if (!uuid) return null;
    const email = emailPorUuid.get(uuid);
    return email ? uidPorEmail.get(email) ?? null : null;
  };

  // 3) dados do CRM
  const [projetos, membros, tarefas, comentarios, anexos] = await Promise.all([
    rest<PgProjeto[]>('/rest/v1/projetos?select=*'),
    rest<PgMembro[]>('/rest/v1/membros_projeto?select=*'),
    rest<PgTarefa[]>('/rest/v1/tarefas?select=*&order=codigo'),
    rest<PgComentario[]>('/rest/v1/comentarios?select=*&order=criado_em'),
    rest<PgAnexo[]>('/rest/v1/anexos?select=*'),
  ]);
  console.log(`Lidos: ${projetos.length} projetos · ${tarefas.length} tarefas · ${comentarios.length} comentários · ${anexos.length} anexos.`);

  for (const pj of projetos) {
    const pid = 'crm-' + pj.id.slice(0, 8);
    const membrosDoPj = membros.filter((m) => m.projeto_id === pj.id);
    const papeis: Record<string, string> = {};
    for (const m of membrosDoPj) {
      const uid = uidDoUuid(m.usuario_id);
      if (uid) papeis[uid] = m.papel;
      else console.warn(`  ! membro sem conta no portal (${emailPorUuid.get(m.usuario_id) ?? m.usuario_id}) — fora de "${pj.nome}"`);
    }
    let dono = uidDoUuid(pj.criado_por);
    if (!dono || !papeis[dono]) dono = Object.keys(papeis).find((k) => papeis[k] === 'admin') ?? Object.keys(papeis)[0] ?? null;
    if (!dono) { console.warn(`  ! "${pj.nome}" sem nenhum membro conciliável — projeto pulado.`); continue; }
    if (!Object.values(papeis).includes('admin')) papeis[dono] = 'admin';
    const membrosIds = Object.keys(papeis);

    // etapas: derivadas das fases distintas (ordem de aparição)
    const ts = tarefas.filter((t) => t.projeto_id === pj.id);
    const fases = [...new Set(ts.map((t) => t.fase))];
    const criadoDia = pj.criado_em.slice(0, 10);
    const etapas = fases.map((fase, i) => {
      const tsf = ts.filter((t) => t.fase === fase);
      const datas = tsf.flatMap((t) => [t.data_inicio, t.prazo, t.data_conclusao]).filter(Boolean) as string[];
      const inicio = datas.length ? datas.reduce((a, b) => (b < a ? b : a)) : criadoDia;
      const fim = datas.length ? datas.reduce((a, b) => (b > a ? b : a)) : criadoDia;
      return { id: 'F' + i, nome: fase, inicio, fim: fim < inicio ? inicio : fim };
    });
    const faseParaEtapa = new Map(fases.map((f, i) => ['F' + i, f] as const).map(([id, f]) => [f, id]));

    const anexosPorTarefa = new Map<string, PgAnexo[]>();
    anexos.forEach((a) => {
      const arr = anexosPorTarefa.get(a.tarefa_id) ?? [];
      arr.push(a);
      anexosPorTarefa.set(a.tarefa_id, arr);
    });

    const bucket = getStorage(app).bucket();
    const tasks = [];
    for (const t of ts) {
      const respUuid = t.responsavel && UUID_RE.test(t.responsavel) ? t.responsavel : null;
      const respId = respUuid ? uidDoUuid(respUuid) : null;
      const respNome = respId
        ? portalUsers.docs.find((d) => d.id === respId)?.data().nome ?? ''
        : respUuid
          ? emailPorUuid.get(respUuid) ?? '(usuário removido)'
          : t.responsavel ?? '';
      const etapa = etapas.find((e) => e.id === faseParaEtapa.get(t.fase))!;

      const anexosTarefa = [];
      for (const a of anexosPorTarefa.get(t.id) ?? []) {
        let url = '';
        if (comAnexos) {
          try {
            const r = await fetch(`${SUPABASE_URL}/storage/v1/object/anexos-tarefas/${a.storage_path}`, { headers: cab });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const buf = Buffer.from(await r.arrayBuffer());
            const destino = bucket.file(`anexos-tarefas/${pid}/${t.codigo}/${a.nome_arquivo}`);
            await destino.save(buf);
            const [meta] = await destino.getMetadata();
            const token = (meta.metadata as Record<string, string> | undefined)?.firebaseStorageDownloadTokens ?? '';
            url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destino.name)}?alt=media${token ? '&token=' + token : ''}`;
          } catch (e) {
            console.warn(`  ! anexo "${a.nome_arquivo}" não copiado: ${String(e)}`);
          }
        }
        anexosTarefa.push({ n: a.nome_arquivo, url, tamanho: a.tamanho_bytes, por: uidDoUuid(a.enviado_por) ?? '', em: a.enviado_em.slice(0, 10) });
      }

      tasks.push({
        id: t.codigo, et: etapa.id, ti: t.titulo,
        ...(t.descricao ? { desc: t.descricao } : {}),
        resp: respNome, ...(respId ? { respId } : {}),
        ...(t.data_inicio ? { inicio: t.data_inicio } : {}),
        prazo: t.prazo ?? etapa.fim,
        ...(t.data_conclusao ? { conclusao: t.data_conclusao } : {}),
        prio: t.prioridade, st: ST_MAP[t.status] ?? 'nao', anexos: anexosTarefa,
      });
    }

    await db.doc('extraProjs/' + pid).set({
      nome: pj.nome, descricao: pj.descricao ?? '', uid: dono, criadoEm: criadoDia,
      arquivado: pj.arquivado, membrosIds, papeis,
    });
    await db.doc('tarefas/' + pid).set({ uid: dono, membrosIds, etapas, tasks });

    // comentários (autores conciliados por e-mail; texto preservado sempre)
    const idsTarefas = new Map(ts.map((t) => [t.id, t.codigo]));
    const cms = comentarios.filter((cm) => idsTarefas.has(cm.tarefa_id));
    for (const cm of cms) {
      const autorId = uidDoUuid(cm.autor_id) ?? '';
      const autorNome = autorId
        ? portalUsers.docs.find((d) => d.id === autorId)?.data().nome ?? 'Usuário'
        : emailPorUuid.get(cm.autor_id) ?? 'Usuário do CRM';
      // id determinístico (uuid do CRM) — re-executar a migração não duplica comentários
      await db.collection('tarefas').doc(pid).collection('comentarios').doc('cm-' + cm.id).set({
        tarefaId: idsTarefas.get(cm.tarefa_id), autorId, autorNome, texto: cm.texto,
        criadoEm: cm.criado_em, ...(cm.editado_em ? { editadoEm: cm.editado_em } : {}),
      });
    }

    console.log(`  ✔ "${pj.nome}" → ${pid}: ${tasks.length} tarefas · ${etapas.length} etapas · ${cms.length} comentários · ${membrosIds.length} membros${pj.arquivado ? ' · arquivado' : ''}`);
  }

  console.log('Migração concluída.');
}

main().catch((e) => {
  console.error('Falha na migração:', e);
  process.exit(1);
});

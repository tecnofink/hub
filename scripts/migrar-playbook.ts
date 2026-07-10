/**
 * Migração do Playbook (Supabase → Firestore) — ponto P17 da especificação.
 *
 * Lê as 25 tabelas playbook_* e os buckets de arquivos do Supabase e grava:
 *   playbook/{eventos|catalogos|checklist|associacoes|prospeccao|brindes|
 *             stands2027|workshops|config}   (um doc por seção)
 *   playbookFeira/{eventoId}                 (checklist, logística, leads, portal)
 *
 * Editores são conciliados POR E-MAIL com as contas do portal.
 * Arquivos referenciados (storage_path) são copiados para o Storage do Firebase;
 * em falha, o registro mantém apenas o link externo.
 *
 * Uso (mesmo padrão do migrar-crm.ts):
 *   $env:SUPABASE_URL="https://<ref>.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE="<service role>"
 *   npx tsx scripts/migrar-playbook.ts                    # → emuladores
 *   npx tsx scripts/migrar-playbook.ts --producao --projeto <PROJECT_ID>
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const args = process.argv.slice(2);
const producao = args.includes('--producao');
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

type Linha = Record<string, unknown> & { id: string; ordem?: number };
const tabela = (t: string) => rest<Linha[]>(`/rest/v1/${t}?select=*&order=ordem`);
const porOrdem = <T extends { ordem?: number }>(a: T, b: T) => (a.ordem ?? 0) - (b.ordem ?? 0);
/** remove nulls (Firestore aceita, mas o app usa undefined/ausente) */
function limpa<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined)) as T;
}

async function main() {
  console.log(`Origem: ${SUPABASE_URL} · destino: ${projectId}${producao ? ' (PRODUÇÃO)' : ' (emulador)'}`);
  const app = initializeApp({ projectId: projectId!, storageBucket: producao ? `${projectId}.firebasestorage.app` : `${projectId}.appspot.com` });
  const db = getFirestore(app);
  const bucket = getStorage(app).bucket();

  /** copia um arquivo do Storage do Supabase para o do Firebase; devolve a URL */
  async function copiarArquivo(bucketOrigem: string, storagePath: string, destino: string): Promise<string> {
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucketOrigem}/${storagePath}`, { headers: cab });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    const f = bucket.file(destino);
    await f.save(buf);
    const [meta] = await f.getMetadata();
    const token = (meta.metadata as Record<string, string> | undefined)?.firebaseStorageDownloadTokens ?? '';
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(f.name)}?alt=media${token ? '&token=' + token : ''}`;
  }

  async function arquivoDe(linha: Linha, bucketOrigem: string, destino: string): Promise<{ n?: string; url?: string; link?: string }> {
    const out: { n?: string; url?: string; link?: string } = {};
    if (linha.nome_arquivo) out.n = String(linha.nome_arquivo);
    if (linha.link) out.link = String(linha.link);
    if (linha.storage_path) {
      try {
        out.url = await copiarArquivo(bucketOrigem, String(linha.storage_path), destino + '/' + String(linha.nome_arquivo ?? 'arquivo'));
      } catch (e) {
        console.warn(`  ! arquivo não copiado (${linha.storage_path}): ${String(e)}`);
      }
    }
    return out;
  }

  // ── editores → conciliação por e-mail ──
  const [editores, authUsers, portalUsers] = await Promise.all([
    tabela('playbook_editores').catch(() => rest<Linha[]>('/rest/v1/playbook_editores?select=*')),
    rest<{ users: { id: string; email: string }[] }>('/auth/v1/admin/users?per_page=1000'),
    db.collection('users').get(),
  ]);
  const emailPorUuid = new Map(authUsers.users.map((u) => [u.id, (u.email ?? '').toLowerCase()]));
  const uidPorEmail = new Map(portalUsers.docs.map((d) => [(d.data().email as string).toLowerCase(), d.id]));
  const editoresUids: string[] = [];
  for (const e of editores) {
    const email = emailPorUuid.get(String(e.usuario_id)) ?? '';
    const uid = uidPorEmail.get(email);
    if (uid) editoresUids.push(uid);
    else console.warn(`  ! editor sem conta no portal: ${email || e.usuario_id}`);
  }

  // ── seções ──
  const [eventos, evCat, catalogos, consumo, setores, categorias, itens, marcacoes,
    logistica, logDocs, custos, leads, leadsManuais, portais,
    associacoes, assocBenef, prospSetores, prospEventos,
    brindes, brindeUsos, stands, standDocs, workshops, wsProdutos] = await Promise.all([
    tabela('playbook_eventos'), tabela('playbook_eventos_catalogo'), tabela('playbook_catalogos'),
    rest<Linha[]>('/rest/v1/playbook_catalogo_consumo?select=*'),
    tabela('playbook_setores'), tabela('playbook_categorias'), tabela('playbook_itens'),
    rest<Linha[]>('/rest/v1/playbook_checklist_marcacoes?select=*'),
    rest<Linha[]>('/rest/v1/playbook_logistica?select=*'), tabela('playbook_logistica_docs'), tabela('playbook_custos'),
    rest<Linha[]>('/rest/v1/playbook_leads?select=*'), tabela('playbook_leads_manuais'), rest<Linha[]>('/rest/v1/playbook_portais?select=*'),
    tabela('playbook_associacoes'), tabela('playbook_associacao_beneficios'),
    tabela('playbook_prospeccao_setores'), tabela('playbook_prospeccao_eventos'),
    tabela('playbook_brindes'), tabela('playbook_brinde_usos'),
    tabela('playbook_stands2027'), rest<Linha[]>('/rest/v1/playbook_stand_docs?select=*'),
    tabela('playbook_workshops'), tabela('playbook_workshop_produtos'),
  ]);

  await db.doc('playbook/config').set({ editores: editoresUids });

  await db.doc('playbook/eventos').set({
    lista: eventos.sort(porOrdem).map((e) => limpa({
      id: e.id, slug: e.slug, nome: e.nome, local: e.local, data: e.data ?? 'A definir',
      tipo: e.tipo, status: e.status, obs: e.obs ?? '', isCustom: !!e.is_custom, ordem: e.ordem ?? 0,
    })),
  });

  const consumoMap: Record<string, Record<string, number>> = {};
  for (const c of consumo) {
    const cat = String(c.catalogo_id), ev = String(c.evento_catalogo_id);
    (consumoMap[cat] ??= {})[ev] = Number(c.qtd ?? 0);
  }
  await db.doc('playbook/catalogos').set({
    eventos: evCat.sort(porOrdem).map((e) => limpa({ id: e.id, nome: e.nome, data: e.data, ordem: e.ordem ?? 0 })),
    catalogos: catalogos.sort(porOrdem).map((c) => limpa({
      id: c.id, nome: c.nome, grupo: c.grupo, estoque: Number(c.estoque ?? 0),
      consumoAnual: Number(c.consumo_anual ?? 0), isCustom: !!c.is_custom, ordem: c.ordem ?? 0,
    })),
    consumo: consumoMap,
  });

  await db.doc('playbook/checklist').set({
    setores: setores.sort(porOrdem).map((s) => limpa({ id: s.id, nome: s.nome, ordem: s.ordem ?? 0 })),
    categorias: categorias.sort(porOrdem).map((c) => limpa({ id: c.id, slug: c.slug, nome: c.nome, setorId: c.setor_id, ordem: c.ordem ?? 0 })),
    itens: itens.sort(porOrdem).map((i) => limpa({ id: i.id, categoriaId: i.categoria_id, slug: i.slug, nome: i.nome, ordem: i.ordem ?? 0 })),
  });

  await db.doc('playbook/associacoes').set({
    lista: associacoes.sort(porOrdem).map((a) => limpa({
      id: a.id, slug: a.slug, nome: a.nome, desconto: a.desconto !== null ? Number(a.desconto) : undefined, ordem: a.ordem ?? 0,
      beneficios: assocBenef.filter((b) => b.associacao_id === a.id).sort(porOrdem)
        .map((b) => limpa({ id: b.id, texto: b.texto, ordem: b.ordem ?? 0 })),
    })),
  });

  await db.doc('playbook/prospeccao').set({
    setores: prospSetores.sort(porOrdem).map((s) => limpa({ id: s.id, slug: s.slug, nome: s.nome, ordem: s.ordem ?? 0 })),
    eventos: prospEventos.sort(porOrdem).map((e) => limpa({
      id: e.id, setorId: e.setor_id, nome: e.nome, link: e.link, participacao: e.participacao, obs: e.obs ?? '', ordem: e.ordem ?? 0,
    })),
  });

  await db.doc('playbook/brindes').set({
    lista: brindes.sort(porOrdem).map((b) => limpa({
      id: b.id, slug: b.slug, nome: b.nome, estoqueInicial: b.estoque_inicial !== null ? Number(b.estoque_inicial) : undefined, ordem: b.ordem ?? 0,
      usos: brindeUsos.filter((u) => u.brinde_id === b.id).sort(porOrdem)
        .map((u) => limpa({ id: u.id, motivo: u.motivo, qtd: Number(u.qtd ?? 0), ordem: u.ordem ?? 0 })),
    })),
  });

  const standsLista = [];
  for (const s of stands.sort(porOrdem)) {
    const docs: Record<string, unknown> = {};
    for (const d of standDocs.filter((x) => x.stand_id === s.id)) {
      docs[String(d.slot)] = limpa(await arquivoDe(d, 'playbook-publico', `playbook/stands/${s.id}/${d.slot}`));
    }
    standsLista.push(limpa({
      id: s.id, nome: s.nome, local: s.local, data: s.data, dataLimite: s.data_limite,
      status: s.status, valor: s.valor !== null ? Number(s.valor) : undefined, obs: s.obs, ordem: s.ordem ?? 0, docs,
    }));
  }
  await db.doc('playbook/stands2027').set({ lista: standsLista });

  await db.doc('playbook/workshops').set({
    lista: workshops.sort(porOrdem).map((w) => limpa({
      id: w.id, tema: w.tema ?? '', organizador: w.organizador, local: w.local, data: w.data, obs: w.obs, ordem: w.ordem ?? 0,
      produtos: wsProdutos.filter((p) => p.workshop_id === w.id).sort(porOrdem)
        .map((p) => limpa({ id: p.id, texto: p.texto, ordem: p.ordem ?? 0 })),
    })),
  });

  // ── página da feira por evento ──
  let feiras = 0;
  for (const ev of eventos) {
    const evId = String(ev.id);
    const marc = marcacoes.filter((m) => m.evento_id === evId);
    const log = logistica.find((l) => l.evento_id === evId);
    const lead = leads.find((l) => l.evento_id === evId);
    const portal = portais.find((p) => p.evento_id === evId);
    if (!marc.length && !log && !lead && !portal) continue;

    const checklist: Record<string, { marcado: boolean; qtd?: number }> = {};
    for (const m of marc) checklist[String(m.item_id)] = limpa({ marcado: !!m.marcado, qtd: m.qtd !== null ? Number(m.qtd) : undefined });

    const docs = [];
    if (log) {
      for (const d of logDocs.filter((x) => x.logistica_id === log.id).sort(porOrdem)) {
        docs.push(limpa({
          id: d.id, slot: d.slot, titulo: d.titulo, ordem: d.ordem ?? 0,
          ...(await arquivoDe(d, 'playbook-publico', `playbook/logistica/${evId}`)),
        }));
      }
    }

    const leadsOut: Record<string, unknown> = { manuais: [] };
    if (lead) {
      const planilha = limpa(await arquivoDe(
        { id: '', nome_arquivo: lead.planilha_nome, storage_path: lead.planilha_storage_path, link: lead.planilha_link },
        'playbook-leads', `playbook/leads/${evId}`,
      ));
      const manualPlanilha = limpa(await arquivoDe(
        { id: '', nome_arquivo: lead.manual_planilha_nome, storage_path: lead.manual_planilha_storage_path, link: lead.manual_planilha_link },
        'playbook-leads', `playbook/leads/${evId}`,
      ));
      if (Object.keys(planilha).length) leadsOut.planilha = planilha;
      if (Object.keys(manualPlanilha).length) leadsOut.manualPlanilha = manualPlanilha;
      leadsOut.manuais = leadsManuais.filter((m) => m.leads_id === lead.id).sort(porOrdem).map((m) => limpa({
        id: m.id, nome: m.nome, empresa: m.empresa, cargo: m.cargo, email: m.email,
        telefone: m.telefone, origem: m.origem, obs: m.obs, ordem: m.ordem ?? 0,
      }));
    }

    await db.doc('playbookFeira/' + evId).set({
      checklist,
      logistica: {
        hotel: log?.hotel ?? '', transporte: log?.transporte ?? '', obs: log?.obs ?? '',
        colaboradores: (log?.colaboradores as string[] | undefined) ?? [],
        docs,
        custos: log
          ? custos.filter((c) => c.logistica_id === log.id).sort(porOrdem).map((c) => limpa({ id: c.id, descricao: c.descricao ?? '', valor: Number(c.valor ?? 0), ordem: c.ordem ?? 0 }))
          : [],
      },
      leads: leadsOut,
      portal: { link: portal?.link ?? '', login: portal?.login ?? '', senha: portal?.senha ?? '' },
    });
    feiras++;
  }

  console.log(`Playbook migrado: ${eventos.length} eventos (${feiras} com página de feira) · ${catalogos.length} catálogos · ${itens.length} itens de checklist · ${associacoes.length} associações · ${prospSetores.length} setores de prospecção · ${brindes.length} brindes · ${stands.length} stands · ${workshops.length} workshops · editores: ${editoresUids.length}.`);
}

main().catch((e) => {
  console.error('Falha na migração do playbook:', e);
  process.exit(1);
});

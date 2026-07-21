/**
 * Cloud Functions do Portal Flux (seção 8 da especificação):
 *  - e-mails transacionais da lista RF-51 (gatilhos do Firestore);
 *  - lembretes de deadline 7 dias e 1 dia antes + alerta de atraso (agendado);
 *  - encerramento de ciclo com congelamento do ranking calculado no servidor.
 */
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated, onDocumentDeleted, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import { enviar } from './email';
import { ProjetoDoc, rankingDoCiclo } from './scoring';

initializeApp();
setGlobalOptions({ region: 'southamerica-east1', maxInstances: 10 });

const db = () => getFirestore();

function brl(v: number): string {
  return 'R$ ' + Math.round(v).toLocaleString('pt-BR');
}

function dbr(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Data de hoje (yyyy-mm-dd) no fuso de São Paulo. */
function hojeSP(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

async function usuario(uid: string): Promise<{ nome: string; email: string } | null> {
  const snap = await db().doc('users/' + uid).get();
  if (!snap.exists) return null;
  const d = snap.data()!;
  return { nome: d.nome, email: d.email };
}

async function emailsPorPapel(role: string): Promise<string[]> {
  const snap = await db().collection('users')
    .where('ativo', '==', true)
    .where('roles', 'array-contains', role)
    .get();
  return snap.docs.map((d) => d.data().email as string);
}

async function emailsPorPapeis(roles: string[]): Promise<string[]> {
  const snap = await db().collection('users')
    .where('ativo', '==', true)
    .where('roles', 'array-contains-any', roles)
    .get();
  return [...new Set(snap.docs.map((d) => d.data().email as string))];
}

function logSistema(acao: string, det: string, tipo: 'admin' | 'avaliacao' | 'flux') {
  const agora = new Date();
  const ts = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
    + ' · ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  return db().collection('logs').add({ ts, quem: 'Sistema', acao, det, tipo, at: FieldValue.serverTimestamp() });
}

/* ── RF-51 · confirmação de inscrição do pitch ─────────────────────────── */
export const aoInscreverPitch = onDocumentCreated('projects/{pid}', async (event) => {
  const p = event.data?.data();
  if (!p || p.ciclo === 'backlog') return;
  const u = await usuario(p.uid);
  if (!u) return;
  await enviar({
    para: u.email,
    assunto: 'Pitch inscrito no Flux — ' + p.nome,
    corpo: `Olá, ${u.nome}!\n\nSeu pitch "${p.nome}" foi inscrito com sucesso.\nDeadline definido: ${dbr(p.deadline)}.\n\nO comitê vai avaliar o acesso ao Claude — você recebe um aviso assim que a triagem for concluída. Um projeto com o mesmo nome já foi aberto no Gestor de Tarefas.`,
  });
});

/* ── Alerta aos admins quando uma INSCRIÇÃO de pitch FALHA no cliente ───────
   A escrita rejeitada não cria doc em projects (não há evento lá para ouvir);
   o app registra a falha em logsFalhas e este gatilho avisa fluxAdmin/hubAdmin,
   com o erro e os dados do rascunho já preservados para diagnóstico. */
export const aoFalharInscricao = onDocumentCreated('logsFalhas/{id}', async (event) => {
  const f = event.data?.data();
  if (!f || f.contexto !== 'inscricao-pitch') return;
  const destino = await emailsPorPapeis(['fluxAdmin', 'hubAdmin', 'admin']);
  if (!destino.length) return;
  // campos vêm do cliente: tira quebras de linha e neutraliza URLs (evita
  // phishing auto-linkado no cliente de e-mail) e trunca cada um
  const lim = (v: unknown, n: number) => String(v ?? '—').replace(/[\r\n\t]+/g, ' ').replace(/https?:\/\/\S+/gi, '[link]').slice(0, n);
  await enviar({
    para: destino,
    assunto: 'Falha ao inscrever pitch no Flux — ' + lim(f.pitchNome, 80),
    corpo: `Uma inscrição de pitch FALHOU e não foi salva no banco.\n\n`
      + `Colaborador: ${lim(f.quem, 120)} (${lim(f.uid, 40)})\n`
      + `Pitch: ${lim(f.pitchNome, 120)}\n`
      + `Quando: ${lim(f.ts, 40)}\n`
      + `Erro: ${lim(f.erroCodigo, 60)} — ${lim(f.erroMsg, 500)}\n`
      + `Navegador: ${lim(f.userAgent, 200)}\n\n`
      + `Os dados do rascunho ficaram guardados na coleção logsFalhas para diagnóstico e recuperação. `
      + `O app agora mantém o rascunho e mostra o erro na tela — peça ao colaborador para tentar novamente.`,
  });
  await logSistema('Falha de inscrição', lim(f.pitchNome, 80) + ' — ' + lim(f.erroCodigo || f.erroMsg, 80), 'flux');
});

/* ── RF-51 · decisão da triagem e resultado aguardando avaliação ───────── */
export const aoAtualizarProjeto = onDocumentUpdated('projects/{pid}', async (event) => {
  const antes = event.data?.before.data();
  const depois = event.data?.after.data();
  if (!antes || !depois) return;
  const u = await usuario(depois.uid);
  if (!u) return;

  // tier liberado na triagem
  if (!antes.tier && depois.tier) {
    await enviar({
      para: u.email,
      assunto: `Acesso ao Claude liberado (${depois.tier}) — ${depois.nome}`,
      corpo: `Olá, ${u.nome}!\n\nO comitê liberou o acesso ${depois.tier} do Claude para a execução do pitch "${depois.nome}".\nO acesso vale até o encerramento do ciclo. A aplicação no console é manual — o administrador confirma em seguida.\n\nBom projeto!`,
    });
  }

  // enviado ao backlog
  if (antes.ciclo !== 'backlog' && depois.ciclo === 'backlog') {
    await enviar({
      para: u.email,
      assunto: 'Seu pitch foi para o Backlog de Projetos — ' + depois.nome,
      corpo: `Olá, ${u.nome}.\n\nO comitê guardou o pitch "${depois.nome}" no Backlog de Projetos.\nQuando um novo ciclo abrir as inscrições, você poderá reativá-lo no kanban do Flux — ele passa de novo pela triagem de acesso.`,
    });
  }

  // reprovação (na triagem ou desclassificação na avaliação)
  if (!antes.reprovado && depois.reprovado) {
    await enviar({
      para: u.email,
      assunto: 'Decisão do comitê — ' + depois.nome,
      corpo: `Olá, ${u.nome}.\n\nO pitch "${depois.nome}" foi reprovado pelo comitê e não participa do ranking deste ciclo.\nO aprendizado fica registrado — uma nova ideia pode ser inscrita no próximo ciclo.`,
    });
  }

  // resultado registrado → aviso ao comitê
  if (!antes.resultado && depois.resultado) {
    const comite = await emailsPorPapel('avaliador');
    if (comite.length) {
      await enviar({
        para: comite,
        assunto: 'Resultado aguardando avaliação — ' + depois.nome,
        corpo: `O projeto "${depois.nome}" (${u.nome}) registrou resultado: ${brl(depois.resultado.tang)} por ciclo declarados.\n\nAcesse o Portal Flux → Comitê → Resultados para validar o tangível e registrar suas notas.`,
      });
    }
  }
});

/* ── RF-51 · alerta aos admins quando pitch com tier definido é excluído ── */
export const aoExcluirProjeto = onDocumentDeleted('projects/{pid}', async (event) => {
  const p = event.data?.data();
  if (!p || !p.tier) return;
  const admins = await emailsPorPapel('admin');
  if (!admins.length) return;
  await enviar({
    para: admins,
    assunto: 'Pitch com tier definido foi excluído — rever acessos ao Claude',
    corpo: `O pitch "${p.nome}" tinha acesso ${p.tier} liberado e foi excluído pelo titular.\n\nRevise os acessos em Admin do Flux → Acessos ao Claude e ajuste o console do Claude se necessário.`,
  });
});

/* ── RF-51 · lembretes de deadline (7 dias e 1 dia) + alerta de atraso ──── */
export const lembretesDeadline = onSchedule(
  { schedule: '0 8 * * *', timeZone: 'America/Sao_Paulo' },
  async () => {
    const hoje = hojeSP();
    const ciclos = await db().collection('cycles').where('status', '==', 'ativo').limit(1).get();
    if (ciclos.empty) return;
    const ciclo = ciclos.docs[0];
    const projs = await db().collection('projects').where('ciclo', '==', ciclo.id).get();

    for (const doc of projs.docs) {
      const p = doc.data();
      if (!p.tier || p.resultado || p.reprovado || !p.deadline) continue;
      const dias = Math.round((Date.parse(p.deadline) - Date.parse(hoje)) / 864e5);
      if (dias === 7 || dias === 1) {
        const u = await usuario(p.uid);
        if (u) {
          await enviar({
            para: u.email,
            assunto: `Deadline em ${dias === 1 ? '1 dia' : '7 dias'} — ${p.nome}`,
            corpo: `Olá, ${u.nome}!\n\nO deadline do projeto "${p.nome}" é ${dbr(p.deadline)}.\nRegistre o resultado no Portal Flux até lá — Pontualidade vale 10% da nota.`,
          });
        }
      }
      if (dias === -1) {
        // RF-36: sinalização de atraso, sem desclassificação automática
        await logSistema('Alerta de atraso', p.nome + ' — deadline vencido', 'flux');
      }
    }
    logger.info('lembretes processados', { ciclo: ciclo.id, projetos: projs.size });
  },
);

/* ── Zona perigosa do Gestor (CRM): excluir projeto livre em cascata ───────
   Apaga o quadro de tarefas, a thread de comentários e os anexos no Storage. */
export const aoExcluirProjetoLivre = onDocumentDeleted('extraProjs/{pid}', async (event) => {
  const pid = event.params.pid;
  // defesa em profundidade contra colisão de ID: a cascata abaixo apaga por id,
  // e o quadro de um PITCH do Flux vive em tarefas/{id} com o mesmo namespace.
  // A regra de create de extraProjs já impede a colisão; ainda assim, nunca
  // destruímos o quadro de um pitch existente.
  if ((await db().doc('projects/' + pid).get()).exists) {
    logger.warn('aoExcluirProjetoLivre: pid colide com um pitch do Flux — cascata abortada', { pid });
    await logSistema('Projeto livre excluído', pid + ' — cascata abortada (id colide com pitch do Flux)', 'admin');
    return;
  }
  const quadroRef = db().doc('tarefas/' + pid);
  // comentários (subcoleção) primeiro
  const comentarios = await quadroRef.collection('comentarios').get();
  await Promise.all(comentarios.docs.map((d) => d.ref.delete()));
  await quadroRef.delete().catch(() => { /* quadro pode não existir */ });
  try {
    const { getStorage } = await import('firebase-admin/storage');
    await getStorage().bucket().deleteFiles({ prefix: `anexos-tarefas/${pid}/` });
  } catch (e) {
    logger.warn('falha ao limpar anexos do projeto excluído', { pid, erro: String(e) });
  }
  await logSistema('Projeto livre excluído', (event.data?.data()?.nome ?? pid) + ' — dados e anexos removidos', 'admin');
});

/* ── Bootstrap do portal (primeiro acesso em produção) ─────────────────────
   O app grava bootstrap/{uid} quando config/portal ainda não existe (as
   regras garantem uid/e-mail do próprio autor). Este gatilho valida o
   domínio, cria a lista inicial e promove o PRIMEIRO colaborador do grupo a
   administrador — depois disso vira no-op. Padrão por gatilho (e não
   callable) porque a política da organização bloqueia invocação pública. */
const DOMINIOS_INICIAIS = ['tecnofink.com', 'grupotecnofink.com.br'];

/** Ferramentas nativas geridas pelo Admin do Hub (o Flux é fixo em código). */
async function criarFerramentasNativas(): Promise<void> {
  await db().doc('tools/gestor').set({
    nome: 'Produtividade', sigla: 'Pr',
    desc: 'Etapas, prazos e quadro de tarefas dos seus projetos. Pitches do Flux entram aqui automaticamente; projetos livres também.',
    rota: '/tarefas', perfis: ['user'], ativo: true, fixa: true, ordem: 1,
  });
  await db().doc('tools/playbook').set({
    nome: 'Marketing', sigla: 'Mk',
    desc: 'Padrões, guias e materiais de referência do grupo Tecnofink. Ferramenta importada de projeto existente.',
    rota: '/playbook', perfis: ['user'], ativo: true, fixa: true, importada: true, ordem: 2,
  });
}

export const aoSolicitarBootstrap = onDocumentCreated('bootstrap/{uid}', async (event) => {
  const uid = event.params.uid;
  const dados = event.data?.data();
  const email = String(dados?.email ?? '').toLowerCase();
  const limpar = () => event.data?.ref.delete().catch(() => undefined);

  const dominio = email.split('@')[1] ?? '';
  if (!DOMINIOS_INICIAIS.includes(dominio)) {
    logger.warn('bootstrap negado — domínio fora da lista inicial', { email });
    await limpar();
    return;
  }

  // promove o primeiro colaborador a administrador do hub e do Flux (antes da
  // config: quem espera a config aparecer já encontra o perfil pronto)
  const admins = await db().collection('users')
    .where('roles', 'array-contains-any', ['admin', 'hubAdmin']).limit(1).get();
  if (admins.empty) {
    await db().doc('users/' + uid).set({
      nome: String(dados?.nome ?? email.split('@')[0]),
      email, foto: String(dados?.foto ?? ''),
      cargo: '', depto: '', empresa: 'Tecnofink LTDA',
      roles: ['user', 'hubAdmin', 'fluxAdmin'], ativo: true, apres: '', niver: '',
    }, { merge: true });
    await logSistema('Bootstrap do portal', email + ' promovido a administrador do hub e do Flux (primeiro acesso)', 'admin');
  }

  // ferramentas nativas do hub (RF-10) — o Flux é fixo em código; aqui entram
  // as demais, só na primeira vez
  const tools = await db().collection('tools').limit(1).get();
  if (tools.empty) {
    await criarFerramentasNativas();
    logger.info('ferramentas nativas criadas no bootstrap');
  }

  const cfgRef = db().doc('config/portal');
  if (!(await cfgRef.get()).exists) {
    await cfgRef.set({ domains: DOMINIOS_INICIAIS });
    logger.info('config/portal criado no bootstrap', { por: email });
  }
  await limpar();
});

/* ── RF-15/RF-58 · encerrar ciclo: ranking congelado calculado no servidor.
   O admin grava um doc em comandos/ (regras: só admin, por == autor) e este
   gatilho executa — mesmo motivo do bootstrap: sem invocação pública. ── */
export const aoReceberComando = onDocumentCreated('comandos/{comandoId}', async (event) => {
  const cmd = event.data?.data();
  if (!cmd) return;
  const marcar = (resultado: Record<string, unknown>) =>
    event.data?.ref.set({ ...cmd, ...resultado, processadoEm: FieldValue.serverTimestamp() }, { merge: true });

  // defesa em profundidade: as regras já exigem admin na criação
  const autor = await db().doc('users/' + String(cmd.por ?? '')).get();
  const papeis: string[] = autor.exists ? (autor.data()!.roles as string[]) : [];
  const autorAtivo = autor.exists && autor.data()!.ativo === true;

  // comando do HUB: restaura as ferramentas nativas (limpa cadastros errados)
  if (cmd.tipo === 'restaurarFerramentas') {
    if (!autorAtivo || !(papeis.includes('hubAdmin') || papeis.includes('admin'))) {
      await marcar({ status: 'erro', erro: 'autor não é administrador do hub' });
      return;
    }
    const atuais = await db().collection('tools').get();
    await Promise.all(atuais.docs.map((d) => d.ref.delete()));
    await criarFerramentasNativas();
    await logSistema('Ferramentas do hub restauradas', 'Gestor de Tarefas e Playbook recriadas (Flux é fixo em código)', 'admin');
    await marcar({ status: 'ok', removidas: atuais.size });
    return;
  }

  if (cmd.tipo !== 'encerrarCiclo') return;
  if (!autorAtivo || !(papeis.includes('fluxAdmin') || papeis.includes('admin'))) {
    logger.warn('comando encerrarCiclo recusado — autor não é admin do Flux', { por: cmd.por });
    await marcar({ status: 'erro', erro: 'autor não é administrador do Flux' });
    return;
  }

  const cicloId = String(cmd.cicloId ?? '');
  const cicloRef = db().doc('cycles/' + cicloId);
  const ciclo = await cicloRef.get();
  if (!ciclo.exists || ciclo.data()!.status !== 'ativo') {
    await marcar({ status: 'erro', erro: 'ciclo não encontrado ou já encerrado' });
    return;
  }

  const usersSnap = await db().collection('users').get();
  const users = new Map(usersSnap.docs.map((d) => [d.id, d.data()]));
  const avaliadores = usersSnap.docs.filter((d) => (d.data().roles as string[]).includes('avaliador')).map((d) => d.id);

  const projsSnap = await db().collection('projects').where('ciclo', '==', cicloId).get();
  const projs: ProjetoDoc[] = projsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProjetoDoc, 'id'>) }));

  const frozen = rankingDoCiclo(projs, cicloId, avaliadores).map((l) => {
    const u = users.get(l.uid);
    return {
      pos: l.pos,
      nome: u?.nome ?? l.uid,
      setor: u?.depto ?? '',
      projeto: l.projeto,
      cat: l.cat,
      tangL: brl(l.tang),
      tangPts: l.tangPts,
      intg: l.intg,
      imp: l.imp,
      alc: l.alc,
      pont: l.pont,
      pts: l.pts,
    };
  });

  await cicloRef.update({ status: 'encerrado', frozen });
  await logSistema('Ciclo encerrado', ciclo.data()!.nome + ' — ranking congelado (' + frozen.length + ' projetos)', 'admin');

  // RF-51: publicação/encerramento do ranking do ciclo → todos
  const todos = usersSnap.docs.filter((d) => d.data().ativo === true).map((d) => d.data().email as string);
  const podio = frozen.slice(0, 3).map((f) => `${f.pos}º ${f.nome} — ${f.projeto} (${f.pts} pts)`).join('\n');
  await enviar({
    para: todos,
    assunto: `Ranking final do ${ciclo.data()!.nome} publicado`,
    corpo: `O ${ciclo.data()!.nome} foi encerrado e o ranking está congelado no histórico do Portal Flux.\n\n${podio || 'Nenhum projeto avaliado neste ciclo.'}\n\nObrigado a todos que participaram — o próximo ciclo vem aí!`,
  });

  await marcar({ status: 'ok', projetosCongelados: frozen.length });
});

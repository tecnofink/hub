/**
 * Estado global do portal — camada de dados sobre o Firebase (seção 8 da spec):
 * Auth (Google Workspace), Firestore em tempo real (onSnapshot) e Storage (anexos).
 * As regras de papel são impostas no backend (firestore.rules); aqui a UI apenas
 * reflete e orquestra as escritas.
 */
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  arrayRemove, arrayUnion, collection, deleteDoc, deleteField, doc, getDoc, limit,
  onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref as sRef, uploadBytes } from 'firebase/storage';
import { auth, db, googleProvider, storage } from '../lib/firebase';
import { addDias, logTimestamp, todayISO } from '../lib/dates';
import { brl, GCOLORS, num, primeiroNome } from '../lib/format';
import { isAvaliado, rankingDoCiclo, setComiteMembros, tangValidado } from '../lib/scoring';
import { ehFluxAdmin, ehHubAdmin } from '../lib/roles';
import { noticiaAcesso, noticiaEtapa, type NoticiaAxel } from '../lib/axel';
import { colunaDe } from '../pages/flux/statusProjeto';
import type {
  Anexo, AnexoTarefa, AppState, Ciclo, Comentario, Etapa, Ferramenta, LogEntry, LogTipo,
  NotaTrio, PapelProjeto, Periodicidade, Projeto, ProjetoLivre, QuadroProjeto,
  Role, Tarefa, Tier, Usuario,
} from '../lib/types';

export interface ModalDef {
  titulo: string;
  texto: string;
  cta: string;
  danger?: boolean;
  onConfirm: () => void;
}

export interface ToastDef {
  msg: string;
  /** Botão opcional no toast — ex.: "Desfazer" após mover tarefa (padrão do CRM). */
  acao?: { label: string; fn: () => void };
  /** Falha de escrita: destaque vermelho, role=alert e mais tempo em tela. */
  erro?: boolean;
}

export interface PitchDraft {
  nome: string;
  cat: string | null;
  valor: string;
  per: Periodicidade;
  intang: string[];
  deadline: string;
  just: string;
}

export const PITCH_DRAFT_VAZIO: PitchDraft = { nome: '', cat: null, valor: '', per: 'mes', intang: [], deadline: '', just: '' };

export interface ResultadoInput {
  valor: number;
  per: Periodicidade;
  tang: number;
  intang: string[];
  desc: string;
}

interface StoreApi {
  state: AppState;
  me: Usuario | null;
  cicloAtivo: Ciclo | null;
  /** Auth resolvida (logado ou não) — evita flicker de redirect. */
  authReady: boolean;
  /** Sessão Google válida com perfil autorizado (mesmo antes dos dados carregarem). */
  logado: boolean;
  /** Coleções principais carregadas para o usuário logado. */
  dataReady: boolean;
  loginErro: string | null;

  /** Notícia do Axel em exibição (popup de etapa/acesso do Flux) e avanço da fila. */
  axelNoticia: NoticiaAxel | null;
  axelProximo(): void;

  byId(id: string): Usuario | undefined;
  proj(id: string): Projeto | undefined;
  cor(uid: string): string;
  corByNome(nome: string): string;
  quadroDe(pid: string): QuadroProjeto;

  toast: ToastDef | null;
  showToast(msg: string, acao?: { label: string; fn: () => void }): void;
  fecharToast(): void;
  modal: ModalDef | null;
  confirmar(m: ModalDef): void;
  fecharModal(): void;

  pitchDraft: PitchDraft;
  setPitchDraft(d: PitchDraft): void;

  toggleTema(): void;
  loginGoogle(): Promise<void>;
  logout(): Promise<void>;
  salvarPerfil(dados: Partial<Usuario>): void;

  inscreverPitch(d: PitchDraft): Promise<Projeto>;
  excluirPitch(pid: string): void;
  reativarBacklog(pid: string, deadline: string): void;
  registrarResultado(pid: string, dados: ResultadoInput, arquivos: File[]): Promise<void>;

  definirTier(pid: string, tier: Tier): void;
  enviarBacklog(pid: string): void;
  reprovarPitch(pid: string, contexto: 'triagem' | 'avaliacao'): void;
  validarTangivel(pid: string, valor: number): void;
  salvarNotas(pid: string, notas: NotaTrio): void;

  toggleAtivo(uid: string): void;
  toggleRole(uid: string, role: Role): void;
  addDominio(d: string): string | null;
  removeDominio(d: string): void;
  salvarCiclo(dados: { nome: string; inicio: string; limite: string; fim: string }): void;
  encerrarCiclo(): void;
  criarCiclo(dados: { nome: string; inicio: string; limite: string; fim: string }): void;
  marcarAplicado(uid: string): void;
  addFerramenta(f: { nome: string; desc: string; rota: string }): void;
  toggleFerramenta(fid: string): void;
  excluirFerramenta(fid: string): void;
  /** Recria Gestor de Tarefas e Playbook nativas (comando processado por Function). */
  restaurarFerramentas(): void;
  /** Move a ferramenta uma posição para cima (-1) ou para baixo (+1) no hub. */
  moverFerramenta(fid: string, delta: -1 | 1): void;

  /* ── Gestor de Tarefas reconciliado com o CRM (P15) ── */
  criarProjetoLivre(nome: string, descricao?: string): string;
  /** Papel efetivo no projeto: dono de projeto do Flux conta como 'admin'. */
  papelNoProjeto(pid: string): PapelProjeto | null;
  addMembroPorEmail(pid: string, email: string, papel: PapelProjeto): string | null;
  alterarPapelMembro(pid: string, membroId: string, papel: PapelProjeto): string | null;
  removerMembro(pid: string, membroId: string): string | null;
  arquivarProjeto(pid: string, arquivar: boolean): void;
  excluirProjetoLivre(pid: string): void;

  addEtapa(pid: string, etapa: { id: string; nome: string; inicio: string; fim: string }): void;
  addTarefa(pid: string, t: { ti: string; et: string; prazo: string; prio: 'Alta' | 'Média' | 'Baixa'; desc?: string; inicio?: string; respId?: string; etapaNova?: { id: string; nome: string; inicio: string; fim: string } }): void;
  editarTarefa(pid: string, tid: string, patch: Partial<Tarefa>): void;
  /** Move status/etapa (drag ou modal) e devolve a função de desfazer (janela do toast). */
  moverTarefa(pid: string, tid: string, destino: { st?: TaskStatusMovel; et?: string }): (() => void) | null;
  excluirTarefa(pid: string, tid: string): void;

  observarComentarios(pid: string, tarefaId: string, cb: (cs: Comentario[]) => void): () => void;
  addComentario(pid: string, tarefaId: string, texto: string): void;
  editarComentario(pid: string, comentarioId: string, texto: string): void;
  excluirComentario(pid: string, comentarioId: string): void;

  addAnexosTarefa(pid: string, tid: string, arquivos: File[]): Promise<void>;
  removerAnexoTarefa(pid: string, tid: string, anexo: AnexoTarefa): void;
}

type TaskStatusMovel = 'nao' | 'and' | 'rev' | 'conc';

const Ctx = createContext<StoreApi | null>(null);

function temaInicial(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem('tf-theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch { /* sem storage */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function msgErro(e: unknown): string {
  const s = String((e as { message?: string })?.message ?? e);
  if (s.includes('permission') || s.includes('PERMISSION')) return 'Ação não permitida para o seu perfil.';
  return s.replace(/^Firebase(Error)?:\s*/i, '');
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [perfilOk, setPerfilOk] = useState(false);
  const [loginErro, setLoginErro] = useState<string | null>(null);
  const [primeiroLogin, setPrimeiroLogin] = useState(false);

  const [users, setUsers] = useState<Usuario[]>([]);
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [cycles, setCycles] = useState<Ciclo[]>([]);
  const [tools, setTools] = useState<Ferramenta[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [extraProjs, setExtraProjs] = useState<ProjetoLivre[]>([]);
  const [tarefas, setTarefas] = useState<Record<string, QuadroProjeto>>({});
  const [access, setAccess] = useState<Record<string, { apl: boolean }>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);

  const [tema, setTema] = useState<'light' | 'dark'>(temaInicial);
  const [toast, setToast] = useState<ToastDef | null>(null);
  const [modal, setModal] = useState<ModalDef | null>(null);
  // rascunho do pitch persiste na sessão: se a página recarregar no meio da
  // inscrição (ex.: recuperação de chunk velho após deploy), o que foi digitado
  // não se perde — o usuário não precisa refazer.
  const [pitchDraft, setPitchDraft] = useState<PitchDraft>(() => {
    try {
      const s = sessionStorage.getItem('pf-pitch-draft');
      if (s) return { ...PITCH_DRAFT_VAZIO, ...JSON.parse(s) };
    } catch { /* sem storage */ }
    return PITCH_DRAFT_VAZIO;
  });
  const [axelFila, setAxelFila] = useState<NoticiaAxel[]>([]);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      if (pitchDraft.nome && pitchDraft.nome.trim()) sessionStorage.setItem('pf-pitch-draft', JSON.stringify(pitchDraft));
      else sessionStorage.removeItem('pf-pitch-draft');
    } catch { /* sem storage */ }
  }, [pitchDraft]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    try { localStorage.setItem('tf-theme', tema); } catch { /* sem storage */ }
  }, [tema]);

  const showToast = (msg: string, acao?: { label: string; fn: () => void }) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ msg, acao });
    // janela de 5 s quando há ação de desfazer (padrão do CRM); 6 s no aviso comum
    toastTimer.current = window.setTimeout(() => setToast(null), acao ? 5000 : 6000);
  };

  // falha de escrita: destaque de erro e janela maior (o Firestore aplica a
  // mudança localmente na hora, então sem isto a rejeição passaria despercebida)
  const showErro = (msg: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ msg, erro: true });
    toastTimer.current = window.setTimeout(() => setToast(null), 10000);
  };

  /* ── Autenticação (RF-01..05): SSO Google + criação automática do perfil ── */
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setAuthUser(null); setPerfilOk(false); setAuthReady(true);
        return;
      }
      try {
        // RF-02: somente domínios liberados
        let cfg = await getDoc(doc(db, 'config', 'portal'));
        if (!cfg.exists()) {
          // primeiro acesso em produção: grava o pedido de bootstrap e a
          // Function (gatilho) cria a config inicial e promove o primeiro
          // colaborador do grupo a administrador
          try {
            await setDoc(doc(db, 'bootstrap', u.uid), {
              email: (u.email ?? '').toLowerCase(),
              nome: u.displayName ?? '',
              foto: u.photoURL ?? '',
            });
            for (let i = 0; i < 20 && !cfg.exists(); i++) {
              await new Promise((r) => setTimeout(r, 700));
              cfg = await getDoc(doc(db, 'config', 'portal'));
            }
          } catch { /* sem permissão — tratado abaixo como domínio bloqueado */ }
        }
        const doms: string[] = cfg.exists() ? (cfg.data().domains ?? []) : [];
        const dom = (u.email ?? '').split('@')[1] ?? '';
        if (!doms.includes(dom)) {
          setLoginErro('O domínio @' + dom + ' não está autorizado no portal. Use seu e-mail corporativo do grupo Tecnofink ou fale com um administrador.');
          await signOut(auth);
          setAuthReady(true);
          return;
        }
        // atualiza o perfil do Google (foto/nome) antes de sincronizar: sem
        // isto, uma foto trocada no Google só aparece quando o token renova
        try { await u.reload(); } catch { /* offline/sessão expirada: usa o cache */ }
        const uref = doc(db, 'users', u.uid);
        const snap = await getDoc(uref);
        if (!snap.exists()) {
          // RF-03: primeiro login cria a conta com nome/e-mail/foto do Google
          await setDoc(uref, {
            nome: u.displayName ?? (u.email ?? '').split('@')[0],
            email: u.email, foto: u.photoURL ?? '',
            cargo: '', depto: '', empresa: 'Tecnofink Matriz',
            roles: ['user'], ativo: true, apres: '', niver: '', perfilPendente: true,
          });
          setPrimeiroLogin(true);
        } else if (snap.data().ativo !== true) {
          // RF-04
          setLoginErro('Esta conta foi desativada. Fale com um administrador do portal.');
          await signOut(auth);
          setAuthReady(true);
          return;
        } else if (u.photoURL && snap.data().foto !== u.photoURL) {
          // RF-06: foto sincronizada do Google a cada login
          await updateDoc(uref, { foto: u.photoURL });
        }
        setLoginErro(null);
        setAuthUser(u);
        setPerfilOk(true);
        setAuthReady(true);
      } catch (e) {
        setLoginErro('Não foi possível entrar: ' + msgErro(e));
        await signOut(auth);
        setAuthReady(true);
      }
    });
  }, []);

  /* ── Assinaturas em tempo real (kanban e ranking "ao vivo" — RF-29/RF-42) ── */
  const uid = perfilOk ? authUser?.uid ?? null : null;
  useEffect(() => {
    if (!uid) {
      setUsers([]); setProjects([]); setCycles([]); setTools([]); setDomains([]);
      setExtraProjs([]); setTarefas({}); setLoadedCount(0);
      return;
    }
    const marca = () => setLoadedCount((n) => n + 1);
    // RF-04/RF-55: se o acesso for revogado com a sessão ABERTA, as regras
    // derrubam as assinaturas — encerra a sessão com mensagem orientativa.
    // No logout normal os listeners também recebem permission-denied antes do
    // teardown; auth.currentUser distingue os dois casos.
    const acessoRevogado = (e: { code?: string }) => {
      if (!auth.currentUser) return; // logout normal — ruído esperado
      if (String(e?.code ?? '').includes('permission-denied')) {
        setLoginErro('Sua sessão foi encerrada — a conta foi desativada ou perdeu o acesso. Fale com um administrador do portal.');
        void signOut(auth);
      }
    };
    const subs = [
      onSnapshot(collection(db, 'users'), (s) => {
        const list = s.docs.map((d) => ({ id: d.id, ...d.data() }) as Usuario);
        // registro síncrono dos membros do comitê antes do re-render (P13)
        setComiteMembros(list.filter((x) => x.roles.includes('avaliador')).map((x) => x.id));
        setUsers(list); marca();
      }, acessoRevogado),
      onSnapshot(collection(db, 'projects'), (s) => {
        setProjects(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Projeto)); marca();
      }, acessoRevogado),
      onSnapshot(query(collection(db, 'cycles'), orderBy('inicio', 'desc')), (s) => {
        setCycles(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Ciclo)); marca();
      }, acessoRevogado),
      onSnapshot(collection(db, 'tools'), (s) => {
        setTools(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Ferramenta)); marca();
      }, acessoRevogado),
      onSnapshot(doc(db, 'config', 'portal'), (s) => {
        setDomains((s.data()?.domains as string[]) ?? []);
      }, acessoRevogado),
      // projetos livres e quadros dos quais participo (multi-membro — CRM/P15)
      onSnapshot(query(collection(db, 'extraProjs'), where('membrosIds', 'array-contains', uid)), (s) => {
        setExtraProjs(s.docs.map((d) => ({ id: d.id, ...d.data() }) as ProjetoLivre));
      }, acessoRevogado),
      onSnapshot(query(collection(db, 'tarefas'), where('membrosIds', 'array-contains', uid)), (s) => {
        setTarefas(Object.fromEntries(s.docs.map((d) => [d.id, d.data() as QuadroProjeto])));
      }, acessoRevogado),
    ];
    return () => { subs.forEach((un) => un()); };
  }, [uid]);

  // assinaturas restritas a administradores (RF-54, RF-59)
  const me = uid ? users.find((x) => x.id === uid) ?? null : null;
  const souFluxAdmin = ehFluxAdmin(me);
  const souHubAdmin = ehHubAdmin(me);
  useEffect(() => {
    if (!uid || (!souFluxAdmin && !souHubAdmin)) { setLogs([]); setAccess({}); return; }
    const silencia = () => { /* papel removido em tempo real — assinatura cai sozinha */ };
    const subs = [
      onSnapshot(query(collection(db, 'logs'), orderBy('at', 'desc'), limit(300)), (s) => {
        setLogs(s.docs.map((d) => d.data() as LogEntry));
      }, silencia),
      ...(souFluxAdmin ? [
        onSnapshot(collection(db, 'access'), (s) => {
          setAccess(Object.fromEntries(s.docs.map((d) => [d.id, d.data() as { apl: boolean }])));
        }, silencia),
      ] : []),
    ];
    return () => { subs.forEach((un) => un()); };
  }, [uid, souFluxAdmin, souHubAdmin]);

  const dataReady = loadedCount >= 4;

  useEffect(() => {
    if (me && primeiroLogin) {
      setPrimeiroLogin(false);
      showToast('Bem-vindo(a) ao portal, ' + primeiroNome(me.nome) + '!');
    } else if (me && dataReady && sessionStorage.getItem('pf-saudou') !== me.id) {
      sessionStorage.setItem('pf-saudou', me.id);
      showToast('Bem-vindo(a), ' + primeiroNome(me.nome) + '!');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, dataReady, primeiroLogin]);

  // ── Axel: notícias de mudança de etapa e de acesso ao Claude ─────────────
  // Compara a coluna do kanban e o tier dos MEUS projetos com a última foto
  // salva no navegador (localStorage). Mudou → enfileira popup. A primeira
  // carga (sem foto anterior) só registra a base, sem disparar nada.
  useEffect(() => {
    if (!me || !dataReady) return;
    const chave = 'pf-axel-' + me.id;
    let antes: Record<string, { col: string; tier: string | null }> | null = null;
    try {
      const bruto = localStorage.getItem(chave);
      if (bruto) antes = JSON.parse(bruto);
    } catch { /* sem storage: sem notícias persistentes */ }

    const agora: Record<string, { col: string; tier: string | null }> = {};
    const novas: NoticiaAxel[] = [];
    for (const p of projects) {
      if (p.uid !== me.id) continue;
      const col = colunaDe(p);
      const tier = p.tier ?? null;
      agora[p.id] = { col, tier };
      const ant = antes?.[p.id];
      if (!ant) continue; // primeiro uso ou projeto recém-criado: só registra
      const ganhouAcesso = !ant.tier && tier ? tier : null;
      if (ganhouAcesso) novas.push(noticiaAcesso(ganhouAcesso, p.nome));
      // a entrada em "dev" causada pelo próprio acesso já está na notícia acima
      if (ant.col !== col && !(ganhouAcesso && col === 'dev')) novas.push(noticiaEtapa(col, p.nome));
    }
    try { localStorage.setItem(chave, JSON.stringify(agora)); } catch { /* ok */ }
    if (novas.length) setAxelFila((f) => [...f, ...novas]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, me?.id, dataReady]);

  const state = useMemo<AppState>(() => ({
    uid, tema, users, projects, cycles, domains, tools, extraProjs, tarefas, access, logs,
  }), [uid, tema, users, projects, cycles, domains, tools, extraProjs, tarefas, access, logs]);

  const api = useMemo<StoreApi>(() => {
    const byId = (id: string) => users.find((x) => x.id === id);
    const proj = (id: string) => projects.find((x) => x.id === id);
    const cicloAtivo = cycles.find((c) => c.status === 'ativo') ?? null;

    const falha = (e: unknown) => showErro(msgErro(e));

    const addLog = (acao: string, det: string, tipo: LogTipo) => {
      if (!me) return;
      setDoc(doc(collection(db, 'logs')), {
        ts: logTimestamp(), quem: me.nome, acao, det, tipo, at: serverTimestamp(),
      }).catch(() => { /* log nunca bloqueia o fluxo */ });
    };

    // Falha de inscrição de pitch: a escrita rejeitada não gera evento no
    // Firestore, então quem a enxerga é o cliente. Guarda o erro + o rascunho
    // completo (diagnóstico e recuperação); uma Cloud Function avisa os admins.
    const registrarFalhaInscricao = (d: PitchDraft, e: unknown) => {
      if (!me) return;
      const err = e as { code?: string; message?: string };
      setDoc(doc(collection(db, 'logsFalhas')), {
        em: serverTimestamp(), ts: logTimestamp(), quem: me.nome, uid: me.id,
        contexto: 'inscricao-pitch',
        erroCodigo: err?.code ?? '', erroMsg: String(err?.message ?? e),
        ciclo: cicloAtivo?.id ?? '',
        pitchNome: d.nome, pitchCat: d.cat ?? null, pitchValor: num(d.valor), pitchPer: d.per,
        pitchDeadline: d.deadline, pitchIntang: [...d.intang], pitchJust: d.just,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      }).catch(() => { /* registro de falha nunca bloqueia nem lança */ });
    };

    const quadroDeFn = (pid: string): QuadroProjeto => {
      const q = tarefas[pid];
      if (q) return q;
      const p = proj(pid);
      const livre = extraProjs.find((x) => x.id === pid);
      const inicio = p?.criadoEm ?? livre?.criadoEm ?? todayISO();
      const fim = p?.deadline ?? cicloAtivo?.fim ?? addDias(inicio, 60);
      // RF-45: projetos nascem com a etapa padrão "F0 · Execução do projeto"
      return { etapas: [{ id: 'F0', nome: 'Execução do projeto', inicio, fim }], tasks: [] };
    };

    /**
     * Mutação transacional do quadro: relê o doc `tarefas/{pid}` do SERVIDOR
     * dentro da transação e aplica `mut` sobre essa versão autoritativa — nunca
     * sobre o estado local, que pode estar defasado. Isso elimina o
     * last-write-wins entre membros (a transação repete em caso de conflito) e
     * impede que o quadro-padrão sobrescreva um quadro já existente quando o
     * snapshot ainda não chegou. `mut` devolve null para abortar sem gravar.
     * `opts.membrosIds` sobrepõe a denormalização (usado ao alterar membros).
     */
    const mutarQuadro = (
      pid: string,
      mut: (atual: QuadroProjeto) => QuadroProjeto | null,
      opts?: { membrosIds?: string[] },
    ): Promise<void> => {
      if (!me) return Promise.resolve();
      const flux = proj(pid);
      const livre = extraProjs.find((x) => x.id === pid);
      const dono = flux?.uid ?? livre?.uid ?? me.id;
      const ref = doc(db, 'tarefas', pid);
      return runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        const base: QuadroProjeto = snap.exists()
          ? { etapas: (snap.data().etapas ?? []) as Etapa[], tasks: (snap.data().tasks ?? []) as Tarefa[] }
          : quadroDeFn(pid);
        const novo = mut(base);
        if (!novo) return;
        // preserva a denormalização (uid/membrosIds) DO PRÓPRIO DOC no servidor;
        // só sobrescreve membrosIds quando a mutação é explicitamente de membros
        // (opts.membrosIds). Evita que uma edição de conteúdo com estado local
        // defasado apague o acesso de um membro ao quadro.
        const uidFinal = snap.exists() ? ((snap.data().uid as string) ?? dono) : dono;
        const membrosFinal = opts?.membrosIds
          ?? (snap.exists() ? ((snap.data().membrosIds as string[]) ?? [uidFinal]) : (livre?.membrosIds ?? [dono]));
        tx.set(ref, { etapas: novo.etapas, tasks: novo.tasks, uid: uidFinal, membrosIds: membrosFinal });
      });
    };

    const posicaoNoRanking = (projs: Projeto[], p: Projeto): { pos: number; pts: number } | null => {
      const rows = rankingDoCiclo(projs, p.ciclo);
      const idx = rows.findIndex((r) => r.p.id === p.id);
      return idx >= 0 ? { pos: idx + 1, pts: rows[idx].s.final } : null;
    };

    return {
      state, me, cicloAtivo, authReady, logado: !!uid, dataReady, loginErro, byId, proj,
      axelNoticia: axelFila[0] ?? null,
      axelProximo: () => setAxelFila((f) => f.slice(1)),
      cor: (id: string) => {
        const i = users.findIndex((u) => u.id === id);
        return GCOLORS[(i < 0 ? 0 : i) % GCOLORS.length];
      },
      corByNome: (nome: string) => {
        const i = users.findIndex((x) => x.nome === nome);
        return i < 0 ? 'var(--tf-accent)' : GCOLORS[i % GCOLORS.length];
      },
      quadroDe: quadroDeFn,

      toast, showToast, fecharToast: () => setToast(null),
      modal, confirmar: setModal, fecharModal: () => setModal(null),
      pitchDraft, setPitchDraft,

      toggleTema: () => setTema((t) => (t === 'dark' ? 'light' : 'dark')),

      loginGoogle: async () => {
        setLoginErro(null);
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (e) {
          const s = String((e as { code?: string })?.code ?? '');
          if (!s.includes('popup-closed') && !s.includes('cancelled')) setLoginErro(msgErro(e));
        }
      },
      logout: async () => {
        try { sessionStorage.removeItem('pf-saudou'); } catch { /* ok */ }
        await signOut(auth);
      },

      salvarPerfil: (dados) => {
        if (!me) return;
        // salvar o perfil sempre encerra a pendência de conclusão
        updateDoc(doc(db, 'users', me.id), { ...dados, perfilPendente: false } as Record<string, unknown>)
          .then(() => showToast('Perfil atualizado.'))
          .catch(falha);
      },

      /* ── Flux · pitch (RF-16..23) ── */
      inscreverPitch: (d) => {
        const c = cicloAtivo!;
        const ref = doc(collection(db, 'projects'));
        const novo: Projeto = {
          id: ref.id, uid: me!.id, ciclo: c.id, nome: d.nome.trim(), cat: d.cat as Projeto['cat'],
          estimValor: num(d.valor), estimPer: d.per, intang: [...d.intang], deadline: d.deadline,
          just: d.just.trim(), criadoEm: todayISO(), tier: null, resultado: null, notas: {},
        };
        const { id: _id, ...docData } = novo;
        // Aguarda a gravação: só confirma (log + toast + navegação no chamador)
        // se realmente persistir. Em falha, sinaliza o erro E propaga, para o
        // chamador manter o rascunho e não navegar a uma ficha inexistente —
        // assim o pitch nunca é perdido em silêncio.
        return setDoc(ref, docData).then(
          () => {
            addLog('Pitch inscrito', novo.nome, 'flux');
            showToast('Pitch enviado! O comitê vai definir o acesso ao Claude — e um projeto com o mesmo nome já foi aberto em Produtividade.');
            return novo;
          },
          (e) => { registrarFalhaInscricao(d, e); falha(e); throw e; },
        );
      },

      excluirPitch: (pid) => {
        const p = proj(pid)!;
        deleteDoc(doc(db, 'projects', pid))
          .then(() => {
            addLog('Pitch excluído', p.nome + (p.tier ? ' (administradores notificados)' : ''), p.tier ? 'admin' : 'flux');
            showToast(p.tier ? 'Pitch excluído. Os administradores vão revisar os acessos ao Claude.' : 'Pitch excluído.');
          })
          .catch(falha);
      },

      // RF-27 / P16
      reativarBacklog: (pid, deadline) => {
        const c = cicloAtivo!;
        const p = proj(pid)!;
        updateDoc(doc(db, 'projects', pid), {
          ciclo: c.id, backlogDe: deleteField(), deadline, criadoEm: todayISO(),
          tier: null, resultado: null, reprovado: false, notas: {},
        })
          .then(() => {
            addLog('Pitch reativado do backlog', p.nome + ' — ' + c.nome, 'flux');
            showToast('"' + p.nome + '" foi reinscrito no ' + c.nome + ' e entrou de novo na triagem de acesso.');
          })
          .catch(falha);
      },

      // RF-34/RF-35: upload real das evidências no Storage
      registrarResultado: async (pid, dados, arquivos) => {
        const p = proj(pid)!;
        const anexos: Anexo[] = [];
        for (const f of arquivos) {
          const r = sRef(storage, `anexos/${pid}/${Date.now()}_${f.name}`);
          await uploadBytes(r, f);
          anexos.push({ n: f.name, url: await getDownloadURL(r) });
        }
        await updateDoc(doc(db, 'projects', pid), {
          resultado: { ...dados, anexos, data: todayISO(), validacoes: {} },
        });
        addLog('Resultado registrado', p.nome, 'flux');
        showToast('Resultado enviado para validação do comitê.');
      },

      /* ── Triagem de acesso (RF-24..28) ── */
      definirTier: (pid, tier) => {
        const p = proj(pid)!;
        const u = byId(p.uid)!;
        updateDoc(doc(db, 'projects', pid), { tier })
          .then(() => {
            setDoc(doc(db, 'access', u.id), { apl: false }).catch(() => { /* admins ajustam depois */ });
            addLog('Tier definido', p.nome + ' — ' + tier, 'admin');
            showToast('Acesso ' + tier + ' liberado para ' + u.nome + ' executar o pitch — vale até o fim do ciclo. Aplique no console do Claude.');
          })
          .catch(falha);
      },

      enviarBacklog: (pid) => {
        const p = proj(pid)!;
        updateDoc(doc(db, 'projects', pid), { ciclo: 'backlog', backlogDe: p.ciclo, tier: null })
          .then(() => {
            addLog('Pitch enviado ao backlog', p.nome, 'avaliacao');
            showToast('"' + p.nome + '" foi para o Backlog de Projetos — o titular pode reativá-lo quando um novo ciclo abrir.');
          })
          .catch(falha);
      },

      reprovarPitch: (pid, contexto) => {
        const p = proj(pid)!;
        updateDoc(doc(db, 'projects', pid), { reprovado: true })
          .then(() => {
            addLog(contexto === 'triagem' ? 'Pitch reprovado na triagem' : 'Projeto desclassificado pelo comitê', p.nome, 'avaliacao');
            showToast('"' + p.nome + '" foi reprovado e está fora do ranking do ciclo.');
          })
          .catch(falha);
      },

      /* ── Avaliação do comitê (RF-37..41 / P13) ── */
      validarTangivel: (pid, valor) => {
        const p = proj(pid)!;
        const declarado = p.resultado!.tang;
        const validado = Math.min(valor, declarado); // RF-38: ajustado ≤ declarado
        const integral = validado === declarado;
        updateDoc(doc(db, 'projects', pid), { ['resultado.validacoes.' + me!.id]: validado })
          .then(() => {
            addLog(integral ? 'Tangível validado (integral)' : 'Tangível validado (ajustado)',
              p.nome + ' — ' + brl(validado) + (integral ? '' : ' (declarado: ' + brl(declarado) + ')'), 'avaliacao');
            const pNovo: Projeto = { ...p, resultado: { ...p.resultado!, validacoes: { ...p.resultado!.validacoes, [me!.id]: validado } } };
            const projsNovos = projects.map((x) => (x.id === pid ? pNovo : x));
            const tv = tangValidado(pNovo);
            if (isAvaliado(pNovo)) {
              const pos = posicaoNoRanking(projsNovos, pNovo);
              showToast('Projeto avaliado! "' + p.nome + '" entra no ranking' + (pos ? ' em ' + pos.pos + 'º lugar, com ' + pos.pts + ' pts.' : '.'));
            } else if (tv !== null) {
              showToast('Validação registrada. Os 3 membros validaram: a média de ' + brl(tv) + ' entra na normalização do ciclo.');
            } else {
              showToast('Validação registrada — aguardando os demais membros do comitê.');
            }
          })
          .catch(falha);
      },

      salvarNotas: (pid, notas) => {
        const p = proj(pid)!;
        updateDoc(doc(db, 'projects', pid), { ['notas.' + me!.id]: notas })
          .then(() => {
            addLog('Notas registradas', p.nome, 'avaliacao');
            const pNovo: Projeto = { ...p, notas: { ...p.notas, [me!.id]: notas } };
            const projsNovos = projects.map((x) => (x.id === pid ? pNovo : x));
            if (isAvaliado(pNovo)) {
              const pos = posicaoNoRanking(projsNovos, pNovo);
              showToast('Projeto avaliado! "' + p.nome + '" entra no ranking' + (pos ? ' em ' + pos.pos + 'º lugar, com ' + pos.pts + ' pts.' : '.'));
            } else {
              showToast('Notas salvas — aguardando os demais avaliadores.');
            }
          })
          .catch(falha);
      },

      /* ── Administração (RF-52..59) ── */
      toggleAtivo: (id) => {
        const u = byId(id)!;
        updateDoc(doc(db, 'users', id), { ativo: !u.ativo })
          .then(() => {
            addLog(u.ativo ? 'Conta desativada' : 'Conta reativada', u.nome, 'admin');
            showToast(u.ativo ? 'Conta de ' + u.nome + ' desativada — o acesso foi bloqueado imediatamente.' : 'Conta de ' + u.nome + ' reativada.');
          })
          .catch(falha);
      },

      toggleRole: (id, role) => {
        const u = byId(id)!;
        const tem = u.roles.includes(role);
        updateDoc(doc(db, 'users', id), { roles: tem ? arrayRemove(role) : arrayUnion(role) })
          .then(() => addLog('Papel ' + (tem ? 'removido' : 'atribuído'), u.nome + ' — ' + ({ avaliador: 'Comitê', fluxAdmin: 'Admin do Flux', hubAdmin: 'Admin do Hub', admin: 'Administrador (legado)', user: 'Usuário' }[role] ?? role), 'admin'))
          .catch(falha);
      },

      addDominio: (d) => {
        const dom = d.trim().toLowerCase().replace(/^@+/, '');
        if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dom)) return 'Informe um domínio válido, ex.: empresa.com.br';
        if (domains.includes(dom)) return 'Este domínio já está na lista.';
        updateDoc(doc(db, 'config', 'portal'), { domains: arrayUnion(dom) })
          .then(() => addLog('Domínio adicionado', dom, 'admin'))
          .catch(falha);
        return null;
      },

      removeDominio: (d) => {
        updateDoc(doc(db, 'config', 'portal'), { domains: arrayRemove(d) })
          .then(() => addLog('Domínio removido', d, 'admin'))
          .catch(falha);
      },

      salvarCiclo: (dados) => {
        if (!cicloAtivo) return;
        updateDoc(doc(db, 'cycles', cicloAtivo.id), dados)
          .then(() => {
            addLog('Ciclo atualizado', dados.nome, 'admin');
            showToast('Datas do ciclo atualizadas.');
          })
          .catch(falha);
      },

      // RF-15/RF-58: congelamento calculado no servidor — o comando é gravado
      // no Firestore e a Function processa por gatilho (sem invocação pública)
      encerrarCiclo: () => {
        if (!cicloAtivo) return;
        const nome = cicloAtivo.nome;
        const cicloId = cicloAtivo.id;
        setDoc(doc(collection(db, 'comandos')), { tipo: 'encerrarCiclo', cicloId, por: me!.id, em: serverTimestamp() })
          .then(() => {
            showToast('Encerrando o ' + nome + '…');
            // confirma pelo próprio doc do ciclo (a UI já acompanha em tempo real)
            const parar = onSnapshot(doc(db, 'cycles', cicloId), (s) => {
              if (s.data()?.status === 'encerrado') {
                showToast(nome + ' encerrado. O ranking foi congelado e está no histórico.');
                parar();
              }
            });
            window.setTimeout(parar, 30000);
          })
          .catch(falha);
      },

      criarCiclo: (dados) => {
        setDoc(doc(collection(db, 'cycles')), { ...dados, status: 'ativo', frozen: null })
          .then(() => {
            addLog('Ciclo criado', dados.nome, 'admin');
            showToast(dados.nome + ' criado e ativo. Titulares de pitches no backlog já podem reativá-los.');
          })
          .catch(falha);
      },

      marcarAplicado: (id) => {
        setDoc(doc(db, 'access', id), { apl: true })
          .then(() => addLog('Acesso aplicado', (byId(id)?.nome ?? id) + ' — console do Claude', 'admin'))
          .catch(falha);
      },

      addFerramenta: (f) => {
        const ordem = tools.reduce((a, t) => Math.max(a, t.ordem ?? 0), 0) + 1;
        setDoc(doc(collection(db, 'tools')), {
          nome: f.nome.trim(), sigla: f.nome.trim().slice(0, 2),
          // visível a todos: o controle fino de acesso é feito dentro de cada ferramenta
          desc: f.desc.trim(), rota: f.rota.trim(), perfis: ['user'], ativo: true, fixa: false, ordem,
        })
          .then(() => {
            addLog('Ferramenta cadastrada', f.nome.trim() + ' (' + f.rota.trim() + ')', 'admin');
            showToast('"' + f.nome.trim() + '" cadastrada — já aparece no hub para os perfis com acesso.');
          })
          .catch(falha);
      },

      excluirFerramenta: (fid) => {
        const f = tools.find((x) => x.id === fid);
        deleteDoc(doc(db, 'tools', fid))
          .then(() => {
            addLog('Ferramenta excluída', f?.nome ?? fid, 'admin');
            showToast('"' + (f?.nome ?? fid) + '" removida do hub.');
          })
          .catch(falha);
      },

      restaurarFerramentas: () => {
        setDoc(doc(collection(db, 'comandos')), { tipo: 'restaurarFerramentas', por: me!.id, em: serverTimestamp() })
          .then(() => showToast('Restaurando ferramentas nativas — o hub atualiza em instantes.'))
          .catch(falha);
      },

      toggleFerramenta: (fid) => {
        const f = tools.find((x) => x.id === fid)!;
        updateDoc(doc(db, 'tools', fid), { ativo: !f.ativo })
          .then(() => addLog(f.ativo ? 'Ferramenta desativada' : 'Ferramenta ativada', f.nome, 'admin'))
          .catch(falha);
      },

      moverFerramenta: (fid, delta) => {
        // normaliza a ordem pela lista atual e troca com o vizinho
        const ordenadas = [...tools].sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99) || a.nome.localeCompare(b.nome));
        const i = ordenadas.findIndex((t) => t.id === fid);
        const j = i + delta;
        if (i < 0 || j < 0 || j >= ordenadas.length) return;
        [ordenadas[i], ordenadas[j]] = [ordenadas[j], ordenadas[i]];
        ordenadas.forEach((t, idx) => {
          if (t.ordem !== idx) updateDoc(doc(db, 'tools', t.id), { ordem: idx }).catch(falha);
        });
      },

      /* ── Gestor de Tarefas (RF-44..49, reconciliado com o CRM — P15) ── */
      criarProjetoLivre: (nome, descricao) => {
        const ref = doc(collection(db, 'extraProjs'));
        // criador entra como admin do projeto (equivalente ao trigger do CRM)
        setDoc(ref, {
          nome: nome.trim(), descricao: (descricao ?? '').trim(), uid: me!.id, criadoEm: todayISO(),
          arquivado: false, membrosIds: [me!.id], papeis: { [me!.id]: 'admin' },
        })
          .then(() => showToast('"' + nome.trim() + '" criado — você é o administrador do projeto.'))
          .catch(falha);
        return ref.id;
      },

      papelNoProjeto: (pid) => {
        const flux = proj(pid);
        if (flux) return flux.uid === me?.id ? 'admin' : null;
        const p = extraProjs.find((x) => x.id === pid);
        return p ? p.papeis[me?.id ?? ''] ?? null : null;
      },

      addMembroPorEmail: (pid, email, papel) => {
        const p = extraProjs.find((x) => x.id === pid);
        if (!p) return 'Projeto não encontrado.';
        // como no CRM: a pessoa precisa já ter conta no portal
        const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (!u) return 'Nenhuma conta com este e-mail — a pessoa precisa fazer o primeiro login no portal antes.';
        if (p.membrosIds.includes(u.id)) return 'Esta pessoa já é membro do projeto.';
        const membrosIds = [...p.membrosIds, u.id];
        updateDoc(doc(db, 'extraProjs', pid), { membrosIds, ['papeis.' + u.id]: papel })
          .then(() => {
            // denormalização: o quadro reflete os membros (regras/consultas), sem
            // sobrescrever tarefas/etapas — a transação relê o quadro do servidor
            void mutarQuadro(pid, (cur) => cur, { membrosIds }).catch(falha);
            showToast(u.nome + ' agora é ' + (papel === 'admin' ? 'administrador' : papel) + ' do projeto.');
          })
          .catch(falha);
        return null;
      },

      alterarPapelMembro: (pid, membroId, papel) => {
        const p = extraProjs.find((x) => x.id === pid);
        if (!p) return 'Projeto não encontrado.';
        const admins = p.membrosIds.filter((m) => p.papeis[m] === 'admin');
        if (p.papeis[membroId] === 'admin' && papel !== 'admin' && admins.length === 1) {
          return 'O projeto precisa de ao menos um administrador.';
        }
        updateDoc(doc(db, 'extraProjs', pid), { ['papeis.' + membroId]: papel }).catch(falha);
        return null;
      },

      removerMembro: (pid, membroId) => {
        const p = extraProjs.find((x) => x.id === pid);
        if (!p) return 'Projeto não encontrado.';
        const admins = p.membrosIds.filter((m) => p.papeis[m] === 'admin');
        if (p.papeis[membroId] === 'admin' && admins.length === 1) {
          return 'O projeto precisa de ao menos um administrador.';
        }
        const membrosIds = p.membrosIds.filter((m) => m !== membroId);
        updateDoc(doc(db, 'extraProjs', pid), { membrosIds, ['papeis.' + membroId]: deleteField() })
          .then(() => {
            // ao sair de si próprio a escrita do quadro é negada (papel já removido) — silencioso
            void mutarQuadro(pid, (cur) => cur, { membrosIds }).catch(() => { /* sem acesso após sair */ });
            showToast(membroId === me!.id ? 'Você saiu do projeto.' : 'Membro removido do projeto.');
          })
          .catch(falha);
        return null;
      },

      arquivarProjeto: (pid, arquivar) => {
        const p = extraProjs.find((x) => x.id === pid);
        updateDoc(doc(db, 'extraProjs', pid), { arquivado: arquivar })
          .then(() => showToast('"' + (p?.nome ?? pid) + '" ' + (arquivar ? 'arquivado — os dados permanecem e é possível desarquivar.' : 'desarquivado.')))
          .catch(falha);
      },

      excluirProjetoLivre: (pid) => {
        const p = extraProjs.find((x) => x.id === pid);
        // a exclusão em cascata (quadro, comentários e anexos) é da Cloud Function
        deleteDoc(doc(db, 'extraProjs', pid))
          .then(() => showToast('"' + (p?.nome ?? pid) + '" excluído permanentemente.'))
          .catch(falha);
      },

      addEtapa: (pid, etapa) => {
        void mutarQuadro(pid, (cur) =>
          cur.etapas.some((e) => e.id === etapa.id) ? null : { ...cur, etapas: [...cur.etapas, etapa] },
        ).catch(falha);
      },

      addTarefa: (pid, t) => {
        void mutarQuadro(pid, (cur) => {
          // id derivado da base do SERVIDOR — adds concorrentes não colidem
          const maior = cur.tasks.reduce((a, x) => Math.max(a, parseInt(x.id.replace(/\D/g, ''), 10) || 0), 0);
          const nova: Tarefa = {
            id: 'TASK-' + String(maior + 1).padStart(3, '0'),
            et: t.et, ti: t.ti.trim(), desc: (t.desc ?? '').trim() || undefined,
            resp: t.respId ? (byId(t.respId)?.nome ?? '') : me!.nome, respId: t.respId ?? me!.id,
            inicio: t.inicio || undefined, prazo: t.prazo, prio: t.prio, st: 'nao', anexos: [],
          };
          // etapa criada junto com a tarefa entra na mesma gravação (sem corrida)
          const etapas = t.etapaNova && !cur.etapas.some((e) => e.id === t.etapaNova!.id)
            ? [...cur.etapas, t.etapaNova]
            : cur.etapas;
          return { etapas, tasks: [...cur.tasks, nova] };
        })
          .then(() => showToast('Tarefa adicionada ao quadro.'))
          .catch(falha);
      },

      editarTarefa: (pid, tid, patch) => {
        void mutarQuadro(pid, (cur) => ({
          ...cur,
          tasks: cur.tasks.map((x) => {
            if (x.id !== tid) return x;
            const nx = { ...x, ...patch };
            // CRM: concluir grava data_conclusao; reverter zera
            if (nx.st === 'conc') nx.conclusao = nx.conclusao ?? todayISO();
            else nx.conclusao = undefined;
            return nx;
          }),
        })).catch(falha);
      },

      moverTarefa: (pid, tid, destino) => {
        // checagem local só para devolver o undo de forma síncrona (UX do toast);
        // a gravação real relê o servidor na transação
        const cur = quadroDeFn(pid);
        const t = cur.tasks.find((x) => x.id === tid);
        if (!t) return null;
        const antes = { st: t.st, et: t.et, conclusao: t.conclusao };
        const aplicar = (vals: { st?: TaskStatusMovel; et?: string; conclusao?: string }) => {
          void mutarQuadro(pid, (q) => {
            if (!q.tasks.some((x) => x.id === tid)) return null; // tarefa removida por outro membro
            return {
              ...q,
              tasks: q.tasks.map((x) => {
                if (x.id !== tid) return x;
                const nx = { ...x, ...('st' in vals && vals.st ? { st: vals.st } : {}), ...('et' in vals && vals.et ? { et: vals.et } : {}) };
                if ('st' in vals) nx.conclusao = vals.st === 'conc' ? (vals.conclusao ?? todayISO()) : vals.conclusao;
                return nx;
              }),
            };
          }).catch(falha);
        };
        aplicar(destino);
        return () => aplicar(antes);
      },

      excluirTarefa: (pid, tid) => {
        void mutarQuadro(pid, (cur) => ({ ...cur, tasks: cur.tasks.filter((x) => x.id !== tid) })).catch(falha);
      },

      /* ── Comentários por tarefa (CRM) ── */
      observarComentarios: (pid, tarefaId, cb) =>
        onSnapshot(
          query(collection(db, 'tarefas', pid, 'comentarios'), where('tarefaId', '==', tarefaId)),
          (s) => {
            const cs = s.docs.map((d) => ({ id: d.id, ...d.data() }) as Comentario);
            cs.sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
            cb(cs);
          },
          () => cb([]),
        ),

      addComentario: (pid, tarefaId, texto) => {
        setDoc(doc(collection(db, 'tarefas', pid, 'comentarios')), {
          tarefaId, autorId: me!.id, autorNome: me!.nome, texto: texto.trim(),
          criadoEm: new Date().toISOString(),
        }).catch(falha);
      },

      editarComentario: (pid, comentarioId, texto) => {
        updateDoc(doc(db, 'tarefas', pid, 'comentarios', comentarioId), {
          texto: texto.trim(), editadoEm: new Date().toISOString(),
        }).catch(falha);
      },

      excluirComentario: (pid, comentarioId) => {
        deleteDoc(doc(db, 'tarefas', pid, 'comentarios', comentarioId)).catch(falha);
      },

      /* ── Anexos por tarefa (CRM: Storage + metadados na tarefa) ── */
      addAnexosTarefa: async (pid, tid, arquivos) => {
        try {
          const novos: AnexoTarefa[] = [];
          for (const f of arquivos) {
            const r = sRef(storage, `anexos-tarefas/${pid}/${tid}/${Date.now()}_${f.name}`);
            await uploadBytes(r, f);
            novos.push({ n: f.name, url: await getDownloadURL(r), tamanho: f.size, por: me!.id, em: todayISO() });
          }
          await mutarQuadro(pid, (cur) => ({ ...cur, tasks: cur.tasks.map((x) => (x.id === tid ? { ...x, anexos: [...(x.anexos ?? []), ...novos] } : x)) }));
          showToast(novos.length === 1 ? 'Anexo enviado.' : novos.length + ' anexos enviados.');
        } catch (e) {
          falha(e);
        }
      },

      removerAnexoTarefa: (pid, tid, anexo) => {
        void mutarQuadro(pid, (cur) => ({ ...cur, tasks: cur.tasks.map((x) => (x.id === tid ? { ...x, anexos: (x.anexos ?? []).filter((a) => a.url !== anexo.url) } : x)) })).catch(falha);
        // remoção do arquivo é best-effort (como no CRM)
        try {
          const path = decodeURIComponent(new URL(anexo.url).pathname.split('/o/')[1] ?? '');
          if (path) void deleteObject(sRef(storage, path)).catch(() => undefined);
        } catch { /* url sem padrão do storage */ }
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, me, authReady, dataReady, loginErro, toast, modal, pitchDraft, axelFila]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useStore(): StoreApi {
  const api = useContext(Ctx);
  if (!api) throw new Error('useStore fora do AppStoreProvider');
  return api;
}

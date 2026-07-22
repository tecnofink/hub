/**
 * Camada de dados do Playbook: assinaturas em tempo real dos documentos por
 * seção + gravação (regras do Firestore restringem escrita a editores/admins).
 */
import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref as sRef, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { useStore, useUI } from '../../store/AppStore';
import { ehHubAdmin } from '../../lib/roles';
import type {
  PbArquivo, PbAssociacao, PbBrinde, PbConfig, PbDocCatalogos, PbDocChecklist,
  PbDocProspeccao, PbEvento, PbFeira, PbStand, PbWorkshop,
} from '../../lib/playbook';
import { FEIRA_VAZIA } from '../../lib/playbook';

export interface PlaybookDocs {
  eventos: { lista: PbEvento[] };
  catalogos: PbDocCatalogos;
  checklist: PbDocChecklist;
  associacoes: { lista: PbAssociacao[] };
  prospeccao: PbDocProspeccao;
  brindes: { lista: PbBrinde[] };
  stands2027: { lista: PbStand[] };
  workshops: { lista: PbWorkshop[] };
  config: PbConfig;
}

const VAZIO: PlaybookDocs = {
  eventos: { lista: [] },
  catalogos: { eventos: [], catalogos: [], consumo: {} },
  checklist: { setores: [], categorias: [], itens: [] },
  associacoes: { lista: [] },
  prospeccao: { setores: [], eventos: [] },
  brindes: { lista: [] },
  stands2027: { lista: [] },
  workshops: { lista: [] },
  config: { editores: [], observadores: [] },
};

/** Papel do usuário no Marketing (antigo Playbook). */
export type PapelPlaybook = 'editor' | 'observador' | 'leitor';

export function pbId(): string {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : 'pb' + Date.now() + Math.floor(Math.random() * 1e6);
}

export function usePlaybook() {
  const store = useStore();
  const ui = useUI();
  const { me } = store;
  const [docs, setDocs] = useState<PlaybookDocs>(VAZIO);
  const [pronto, setPronto] = useState(false);

  // merge por seção — leitura é por DOCUMENTO (casa com as regras: seções
  // abertas para todos; checklist/stands2027 só para editor/observador)
  const setSecao = (id: string, data: object) =>
    setDocs((prev) => ({ ...prev, [id]: { ...(VAZIO as unknown as Record<string, object>)[id], ...data } } as PlaybookDocs));

  // acesso gerido na própria ferramenta (cada uma cuida do seu):
  //  · editor    — escreve o conteúdo e gere os papéis (admin do hub: socorro)
  //  · observador — somente leitura, mas vê TUDO
  //  · leitor     — somente leitura e NÃO vê Página da Feira nem Stands 2027
  const podeEditar = !!me && docs.config.editores.includes(me.id);
  const ehObservador = !!me && (docs.config.observadores ?? []).includes(me.id);
  const podeVerTudo = podeEditar || ehObservador || ehHubAdmin(me);
  const podeGerirEditores = podeEditar || ehHubAdmin(me);
  const papel: PapelPlaybook = podeEditar ? 'editor' : ehObservador ? 'observador' : 'leitor';

  // seções visíveis a todos + config
  useEffect(() => {
    const abertas = ['config', 'eventos', 'catalogos', 'associacoes', 'prospeccao', 'brindes', 'workshops'];
    const subs = abertas.map((id) => onSnapshot(
      doc(db, 'playbook', id),
      (s) => { if (s.exists()) setSecao(id, s.data()); },
      () => { /* sem acesso/erro: mantém vazio */ },
    ));
    setPronto(true);
    return () => subs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // seções restritas (Página da Feira / Stands 2027): só para quem vê tudo
  useEffect(() => {
    if (!podeVerTudo) {
      setSecao('checklist', VAZIO.checklist);
      setSecao('stands2027', VAZIO.stands2027);
      return;
    }
    const subs = ['checklist', 'stands2027'].map((id) => onSnapshot(
      doc(db, 'playbook', id),
      (s) => { if (s.exists()) setSecao(id, s.data()); },
      () => { /* mantém vazio */ },
    ));
    return () => subs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podeVerTudo]);

  return useMemo(() => ({
    docs, pronto, podeEditar, podeVerTudo, podeGerirEditores, papel,
    /** regrava o documento inteiro da seção (documentos pequenos, edição rara) */
    salvar: <K extends keyof PlaybookDocs>(secao: K, dados: PlaybookDocs[K]) => {
      setDoc(doc(db, 'playbook', secao), dados).catch((e) => ui.showToast(msg(e)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [docs, pronto, podeEditar, podeVerTudo, podeGerirEditores, papel, me?.id]);
}

/** Documento da "página da feira" de um evento (checklist/logística/leads/portal). */
export function useFeira(eventoId: string | null) {
  const ui = useUI();
  const [feira, setFeira] = useState<PbFeira>(FEIRA_VAZIA);

  useEffect(() => {
    if (!eventoId) return;
    setFeira(FEIRA_VAZIA);
    return onSnapshot(doc(db, 'playbookFeira', eventoId), (s) => {
      const d = s.data() as Partial<PbFeira> | undefined;
      setFeira({
        checklist: d?.checklist ?? {},
        logistica: { colaboradores: [], docs: [], custos: [], ...d?.logistica },
        leads: { manuais: [], ...d?.leads },
        portal: d?.portal ?? {},
      });
    });
  }, [eventoId]);

  const salvar = (nova: PbFeira) => {
    if (!eventoId) return;
    setDoc(doc(db, 'playbookFeira', eventoId), nova).catch((e) => ui.showToast(msg(e)));
  };

  return { feira, salvar };
}

function msg(e: unknown): string {
  const s = String((e as { code?: string })?.code ?? e);
  return s.includes('permission') ? 'Somente editores podem alterar o conteúdo.' : s;
}

/** Upload de documento do playbook → Storage; devolve {n, url}. */
export async function subirArquivoPb(pathPrefix: string, file: File): Promise<PbArquivo> {
  const nomeSeguro = file.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const r = sRef(storage, `playbook/${pathPrefix}/${Date.now()}_${nomeSeguro}`);
  await uploadBytes(r, file);
  return { n: file.name, url: await getDownloadURL(r) };
}

/** Remove o arquivo do Storage (best-effort — o registro some do doc de qualquer forma). */
export function removerArquivoPb(url?: string): void {
  if (!url) return;
  try {
    const path = decodeURIComponent(new URL(url).pathname.split('/o/')[1] ?? '');
    if (path) void deleteObject(sRef(storage, path)).catch(() => undefined);
  } catch { /* url externa */ }
}

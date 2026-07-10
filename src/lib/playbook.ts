/**
 * Playbook — tipos do modelo Firestore (importado do projeto Supabase, P15/P17).
 *
 * Instância global única: um documento por seção na coleção `playbook`
 * (eventos, catalogos, checklist, associacoes, prospeccao, brindes,
 * stands2027, workshops, config) + um documento por evento em `playbookFeira`
 * (checklist marcado, logística, leads e portal da feira).
 *
 * Acesso: leitura para qualquer usuário ativo do portal; escrita apenas para
 * os EDITORES do playbook (playbook/config.editores) e admins do hub — o
 * espelho do RLS de 3 níveis do Supabase (aqui não há acesso anônimo).
 */

export type PbTipoEvento = 'nacional' | 'internacional';
export type PbStatusEvento = 'NÃO INICIADO' | 'EM ANDAMENTO' | 'CONCLUÍDO';
export type PbGrupoCatalogo = 'gerais' | 'powerpoxi';
export type PbDocSlot = 'stand' | 'buffet' | 'organizacao' | 'planta' | 'outro';
export type PbLeadOrigem = 'Cartão de visita' | 'Aplicativo' | 'Outro';
export type PbParticipacao = 'A avaliar' | 'Stand' | 'Presença de equipe' | 'Stand + equipe';
export type PbStandStatus = 'A avaliar' | 'Orçamento solicitado' | 'Reservado' | 'Confirmado / Pago';

export interface PbEvento {
  id: string;
  slug?: string;
  nome: string;
  local?: string;
  data: string;          // texto livre ("A definir", "12–14/08/2026"…)
  tipo: PbTipoEvento;
  status: PbStatusEvento;
  obs?: string;
  isCustom: boolean;
  ordem: number;
}

export interface PbEventoCatalogo { id: string; nome: string; data?: string; ordem: number }

export interface PbCatalogo {
  id: string;
  nome: string;
  grupo: PbGrupoCatalogo;
  estoque: number;
  consumoAnual: number;
  isCustom: boolean;
  ordem: number;
}

export interface PbDocCatalogos {
  eventos: PbEventoCatalogo[];
  catalogos: PbCatalogo[];
  /** consumo[catalogoId][eventoCatalogoId] = quantidade */
  consumo: Record<string, Record<string, number>>;
}

export interface PbSetor { id: string; nome: string; ordem: number }
export interface PbCategoria { id: string; slug?: string; nome: string; setorId?: string; ordem: number }
export interface PbItem { id: string; categoriaId: string; slug?: string; nome: string; ordem: number }

export interface PbDocChecklist {
  setores: PbSetor[];
  categorias: PbCategoria[];
  itens: PbItem[];
}

export interface PbAssociacao {
  id: string;
  slug?: string;
  nome: string;
  desconto?: number; // %
  ordem: number;
  beneficios: { id: string; texto: string; ordem: number }[];
}

export interface PbProspeccaoEvento {
  id: string;
  setorId: string;
  nome: string;
  link?: string;
  participacao: PbParticipacao;
  obs?: string;
  ordem: number;
}

export interface PbDocProspeccao {
  setores: { id: string; slug?: string; nome: string; ordem: number }[];
  eventos: PbProspeccaoEvento[];
}

export interface PbBrinde {
  id: string;
  slug?: string;
  nome: string;
  estoqueInicial?: number;
  ordem: number;
  usos: { id: string; motivo?: string; qtd: number; ordem: number }[];
}

export interface PbArquivo { n?: string; url?: string; link?: string }

export interface PbStand {
  id: string;
  nome?: string;
  local?: string;
  data?: string;
  dataLimite?: string;
  status: PbStandStatus;
  valor?: number;
  obs?: string;
  ordem: number;
  docs: { planta?: PbArquivo; projeto?: PbArquivo };
}

export interface PbWorkshop {
  id: string;
  tema: string;
  organizador?: string;
  local?: string;
  data?: string;
  obs?: string;
  ordem: number;
  produtos: { id: string; texto: string; ordem: number }[];
}

export interface PbLogisticaDoc extends PbArquivo {
  id: string;
  slot: PbDocSlot;
  titulo?: string;
  ordem: number;
}

export interface PbLeadManual {
  id: string;
  nome?: string;
  empresa?: string;
  cargo?: string;
  email?: string;
  telefone?: string;
  origem: PbLeadOrigem;
  obs?: string;
  ordem: number;
}

/** Documento por evento em `playbookFeira/{eventoId}` — a "página da feira". */
export interface PbFeira {
  /** checklist[itemId] = marcação/quantidade */
  checklist: Record<string, { marcado: boolean; qtd?: number }>;
  logistica: {
    hotel?: string;
    transporte?: string;
    obs?: string;
    colaboradores: string[];
    docs: PbLogisticaDoc[];
    custos: { id: string; descricao: string; valor: number; ordem: number }[];
  };
  leads: {
    planilha?: PbArquivo;        // exportada do app do evento
    manualPlanilha?: PbArquivo;  // consolidada dos cartões
    manuais: PbLeadManual[];     // PII — leitura já restrita ao portal logado
  };
  portal: { link?: string; login?: string; senha?: string };
}

export const FEIRA_VAZIA: PbFeira = {
  checklist: {},
  logistica: { colaboradores: [], docs: [], custos: [] },
  leads: { manuais: [] },
  portal: {},
};

export interface PbConfig {
  editores: string[]; // uids com escrita no playbook (admins do hub também escrevem)
}

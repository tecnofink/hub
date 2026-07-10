/**
 * Papéis cumulativos por área: hubAdmin (portal), fluxAdmin + avaliador (Flux).
 * 'admin' é o valor legado do bootstrap original (equivale a hubAdmin+fluxAdmin).
 */
export type Role = 'user' | 'avaliador' | 'fluxAdmin' | 'hubAdmin' | 'admin';

/** Membros fixos do comitê (Marcos, Emilio e Thomas). */
export type MembroId = string;

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  foto?: string; // sincronizada da conta Google Workspace no login (RF-06)
  cargo: string;
  depto: string;
  empresa: string;
  roles: Role[];
  ativo: boolean;
  apres: string;
  niver: string; // dd/mm, opcional
}

export type CategoriaId = 'produtividade' | 'qualidade' | 'experiencia' | 'inovacao' | 'reducao';

export interface Categoria {
  id: CategoriaId;
  nome: string;
  desc: string;
}

export type Periodicidade = 'mes' | 'ciclo';
export type Tier = 'Basic' | 'Enterprise';

/** Anexo de evidência (RF-35) — arquivo real no Cloud Storage. */
export interface Anexo {
  n: string;   // nome do arquivo
  url: string; // download URL no Storage
}

export interface Resultado {
  valor: number;            // valor informado (na periodicidade escolhida)
  per: Periodicidade;
  tang: number;             // valor declarado, padronizado por ciclo
  intang: string[];
  desc: string;
  anexos: Anexo[];
  data: string;             // ISO — usada no cálculo da Pontualidade (RF-35)
  /**
   * Validação do tangível pelos 3 membros do comitê (RF-38 / decisão P13):
   * cada membro registra o valor que valida (integral = declarado, ou ajustado ≤ declarado).
   * O valor que entra no cálculo é a média dos três, arredondada (0,5 para cima).
   */
  validacoes: Record<MembroId, number>;
}

export interface NotaTrio { i: number; imp: number; alc: number }

export interface Projeto {
  id: string;
  uid: string;              // titular único (RF-23)
  ciclo: string;            // id do ciclo ou 'backlog'
  backlogDe?: string;       // ciclo em que foi enviado ao backlog (RF-27)
  nome: string;
  cat: CategoriaId;
  estimValor: number;
  estimPer: Periodicidade;
  intang: string[];
  deadline: string | null;  // ISO
  just: string;
  criadoEm: string;         // ISO
  tier: Tier | null;
  reprovado?: boolean;
  resultado: Resultado | null;
  notas: Record<MembroId, NotaTrio | null>;
}

export interface RankingFrozenRow {
  pos: number;
  nome: string;
  setor: string;
  projeto: string;
  cat: string;
  tangL: string;
  tangPts: number;
  intg: number;
  imp: number;
  alc: number;
  pont: string;
  pts: number;
}

export interface Ciclo {
  id: string;
  nome: string;
  inicio: string;  // ISO
  limite: string;  // ISO — data-limite de inscrições
  fim: string;     // ISO
  status: 'ativo' | 'encerrado';
  frozen: RankingFrozenRow[] | null;
}

export interface Ferramenta {
  id: string;
  nome: string;
  sigla: string;
  icone?: string;      // emoji exibido no card do hub (fallback: sigla)
  desc: string;
  rota: string;
  perfis: Role[];
  ativo: boolean;
  fixa: boolean;       // Flux e Gestor de Tarefas são nativas (RF-57)
  importada?: boolean; // Playbook (RF-10 / P15)
  ordem?: number;      // posição no hub (reordenável pela administração)
}

export type LogTipo = 'admin' | 'avaliacao' | 'flux';

export interface LogEntry {
  ts: string;   // dd/mm · hh:mm
  quem: string;
  acao: string;
  det: string;
  tipo: LogTipo;
}

/**
 * Status de tarefa — reconciliado com o gestor do CRM (P15):
 * 'rev' (Em revisão) vem do CRM; 'Atrasada' continua DERIVADA do prazo
 * vencido sem conclusão (RF-46 / decisão de design nº 6 do CRM).
 */
export type TaskStatus = 'nao' | 'and' | 'rev' | 'conc';
export type TaskStatusDerivado = TaskStatus | 'atras';
export type Prioridade = 'Alta' | 'Média' | 'Baixa';

/** Papel do membro dentro de um projeto livre (modelo do CRM). */
export type PapelProjeto = 'admin' | 'editor' | 'leitor';

export interface Etapa {
  id: string;     // F0, F1, ...
  nome: string;
  inicio: string; // ISO
  fim: string;    // ISO
}

/** Anexo de tarefa (CRM): arquivo no Storage + metadados. */
export interface AnexoTarefa {
  n: string;
  url: string;
  tamanho?: number;
  por?: string;   // uid de quem enviou
  em?: string;    // ISO
}

export interface Tarefa {
  id: string;        // TASK-001...
  et: string;        // etapa
  ti: string;
  desc?: string;     // descrição (CRM)
  /** Responsável: uid de membro (novo padrão) ou nome livre (legado da migração — CRM decisão nº 5). */
  resp: string;
  respId?: string;
  inicio?: string;   // ISO (CRM: data_inicio — usada no Gantt)
  prazo: string;     // ISO
  conclusao?: string;// ISO (CRM: data_conclusao — gravada ao concluir)
  prio: Prioridade;
  st: TaskStatus;    // 'Atrasada' é derivada (RF-46)
  anexos?: AnexoTarefa[];
}

export interface QuadroProjeto {
  etapas: Etapa[];
  tasks: Tarefa[];
}

/** Comentário de tarefa (CRM) — subcoleção tarefas/{pid}/comentarios. */
export interface Comentario {
  id: string;
  tarefaId: string;
  autorId: string;
  autorNome: string;
  texto: string;
  criadoEm: string;   // ISO com hora
  editadoEm?: string;
}

/**
 * Projeto livre do Gestor de Tarefas (RF-44), reconciliado com o CRM (P15):
 * multi-membro com papéis por projeto, descrição e arquivamento.
 */
export interface ProjetoLivre {
  id: string;
  nome: string;
  descricao?: string;
  uid: string;              // criador
  criadoEm: string;
  arquivado?: boolean;
  membrosIds: string[];     // para consultas array-contains
  papeis: Record<string, PapelProjeto>;
}

export interface AppState {
  uid: string | null;
  tema: 'light' | 'dark';
  users: Usuario[];
  projects: Projeto[];
  cycles: Ciclo[];
  domains: string[];
  tools: Ferramenta[];
  extraProjs: ProjetoLivre[];
  tarefas: Record<string, QuadroProjeto>;
  /** Status da aplicação manual do acesso no console do Claude (RF-54). */
  access: Record<string, { apl: boolean }>;
  logs: LogEntry[];
}

/** Utilitários de status de tarefa — reconciliados com o CRM (statusEfetivo). */
import { todayISO } from '../../lib/dates';
import type { Tarefa, TaskStatus, TaskStatusDerivado, Usuario } from '../../lib/types';

export const ST_LABEL: Record<TaskStatusDerivado, string> = {
  nao: 'Não iniciadas', and: 'Em andamento', rev: 'Em revisão', atras: 'Atrasadas', conc: 'Concluídas',
};

export const ST_LABEL_1: Record<TaskStatusDerivado, string> = {
  nao: 'Não iniciada', and: 'Em andamento', rev: 'Em revisão', atras: 'Atrasada', conc: 'Concluída',
};

/** Ordem das colunas do quadro "Por status" (CRM: 5 colunas; Atrasada não recebe drop). */
export const ST_COLS: TaskStatusDerivado[] = ['nao', 'and', 'rev', 'atras', 'conc'];

/** Status selecionáveis (Atrasada é derivada — nunca escolhida). */
export const ST_MOVEIS: TaskStatus[] = ['nao', 'and', 'rev', 'conc'];

export function stCor(k: TaskStatusDerivado): string {
  switch (k) {
    case 'conc': return 'var(--tf-live)';
    case 'and': return 'var(--tf-accent)';
    case 'rev': return 'var(--tf-warn)';
    case 'atras': return 'var(--tf-crit)';
    default: return 'var(--tf-ink-3)';
  }
}

/** RF-46 / CRM decisão nº 6: "Atrasada" derivada do prazo vencido sem conclusão. */
export function stDe(t: Tarefa): TaskStatusDerivado {
  if (t.st === 'conc') return 'conc';
  if (t.prazo && t.prazo < todayISO()) return 'atras';
  return t.st;
}

/**
 * Exibição do responsável (CRM decisão nº 5): uid de membro → nome atual;
 * uid órfão → "(usuário removido)"; texto livre legado → como veio.
 */
export function exibirResponsavel(t: Tarefa, users: Usuario[]): string {
  if (t.respId) {
    const u = users.find((x) => x.id === t.respId);
    return u ? u.nome : '(usuário removido)';
  }
  return t.resp || '—';
}

/** Tempo relativo curto para comentários/anexos ("há 5 min", "ontem"). */
export function tempoRelativo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ontem';
  if (d < 30) return `há ${d} dias`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function tamanhoLegivel(bytes?: number): string {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

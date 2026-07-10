/** Ciclo de vida do projeto (seção 6 da especificação) — status derivado e coluna do kanban. */
import { diasAte } from '../../lib/dates';
import { isAvaliado } from '../../lib/scoring';
import type { Projeto } from '../../lib/types';

export interface StatusInfo {
  k: 'reprovado' | 'inscrito' | 'atrasado' | 'execucao' | 'registrado' | 'avaliado';
  label: string;
  badge: 'live' | 'warn' | 'crit' | 'neutral';
  sub: string;
}

export function statusDe(p: Projeto): StatusInfo {
  if (p.reprovado) return { k: 'reprovado', label: 'REPROVADO', badge: 'crit', sub: 'Desclassificado pelo comitê — fora do ranking' };
  if (!p.tier) return { k: 'inscrito', label: 'INSCRITO', badge: 'neutral', sub: 'Aguardando definição de acesso ao Claude' };
  if (!p.resultado) {
    const d = p.deadline ? diasAte(p.deadline) : 0;
    if (d < 0) return { k: 'atrasado', label: 'ATRASADO', badge: 'crit', sub: 'Deadline vencido há ' + -d + ' dias — registre o resultado' };
    return { k: 'execucao', label: 'EM EXECUÇÃO', badge: 'warn', sub: d === 0 ? 'O deadline é hoje' : d + ' dias até o deadline' };
  }
  if (!isAvaliado(p)) return { k: 'registrado', label: 'EM AVALIAÇÃO', badge: 'neutral', sub: 'Aguardando validação e notas do comitê' };
  return { k: 'avaliado', label: 'AVALIADO', badge: 'live', sub: 'Avaliação completa do comitê' };
}

export type ColunaId = 'inscrito' | 'dev' | 'aval' | 'conc' | 'rep' | 'back';

export const KB_COLS: { id: ColunaId; label: string }[] = [
  { id: 'inscrito', label: 'Inscrito' },
  { id: 'dev', label: 'Em desenvolvimento' },
  { id: 'aval', label: 'Aguardando Avaliação' },
  { id: 'conc', label: 'Concluído' },
  { id: 'rep', label: 'Reprovado' },
  { id: 'back', label: 'Backlog de Projetos' },
];

/** RF-30: os cards avançam automaticamente conforme o pitch evolui. */
export function colunaDe(p: Projeto): ColunaId {
  if (p.ciclo === 'backlog') return 'back';
  if (p.reprovado) return 'rep';
  if (!p.tier) return 'inscrito';
  if (!p.resultado) return 'dev';
  if (!isAvaliado(p)) return 'aval';
  return 'conc';
}

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

/** Dias antes do deadline em que o card entra na "reta final" (pedido do VP). */
export const RETA_FINAL_DIAS = 30;

export interface Prazo {
  /** 'ok' | 'reta' (≤30 dias) | 'venc' (deadline passou) */
  fase: 'ok' | 'reta' | 'venc';
  dias: number;          // dias até o deadline (negativo = vencido)
  pct: number;           // 0–100 do tempo decorrido (inscrição → deadline)
  pctMarco30: number;    // posição do marco de 30 dias na régua, em %
}

/**
 * Linha do tempo do card (VP): régua da INSCRIÇÃO até o DEADLINE DO TITULAR,
 * com marco aos 30 dias do fim. Null quando não há prazo para acompanhar.
 */
export function prazoDe(p: Projeto): Prazo | null {
  if (!p.deadline || !p.criadoEm) return null;
  const ini = Date.parse(p.criadoEm);
  const fim = Date.parse(p.deadline);
  if (!Number.isFinite(ini) || !Number.isFinite(fim) || fim <= ini) return null;
  const dias = diasAte(p.deadline);
  const total = fim - ini;
  const pct = Math.min(100, Math.max(0, ((Date.now() - ini) / total) * 100));
  // o marco de 30 dias pode cair antes do início (prazo curto) — prende em 0
  const pctMarco30 = Math.min(100, Math.max(0, ((total - RETA_FINAL_DIAS * 864e5) / total) * 100));
  const fase = dias < 0 ? 'venc' : dias <= RETA_FINAL_DIAS ? 'reta' : 'ok';
  return { fase, dias, pct, pctMarco30 };
}

export type ColunaId = 'inscrito' | 'intro' | 'dev' | 'aval' | 'conc' | 'rep' | 'back';

/** Rótulos padrão — o admin do Flux pode renomeá-los (config/flux.kanban). */
export const KB_COLS: { id: ColunaId; label: string }[] = [
  { id: 'inscrito', label: 'Inscrito' },
  { id: 'intro', label: 'Introdução / Apurando ganhos' },
  { id: 'dev', label: 'Em desenvolvimento' },
  { id: 'aval', label: 'Aguardando Avaliação' },
  { id: 'conc', label: 'Concluído' },
  { id: 'rep', label: 'Reprovado' },
  { id: 'back', label: 'Backlog de Projetos' },
];

/** RF-30: os cards avançam automaticamente conforme o pitch evolui. A única
 *  transição manual é intro → dev: ao liberar o acesso o card entra em
 *  "Introdução / Apurando ganhos" e o ADMIN o move para Em desenvolvimento. */
export function colunaDe(p: Projeto): ColunaId {
  if (p.ciclo === 'backlog') return 'back';
  if (p.reprovado) return 'rep';
  if (!p.tier) return 'inscrito';
  if (!p.resultado) return p.introConcluida ? 'dev' : 'intro';
  if (!isAvaliado(p)) return 'aval';
  return 'conc';
}

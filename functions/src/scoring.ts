/**
 * Regras de pontuação (seção 5 da Especificação v2.1) — versão server-side,
 * usada no congelamento do ranking ao encerrar o ciclo (RF-15/RF-58).
 * Mantém paridade com src/lib/scoring.ts do frontend.
 */

export const MEMBROS = ['marcos', 'emilio', 'thomas'];

export interface ProjetoDoc {
  id: string;
  uid: string;
  ciclo: string;
  nome: string;
  cat: string;
  deadline: string | null;
  reprovado?: boolean;
  membros?: string[];
  resultado: null | {
    tang: number;
    data: string;
    validacoes: Record<string, number>;
  };
  notas: Record<string, { i: number; imp: number; alc: number } | null>;
}

/** Arredondamento oficial: 0,5 para cima. */
export function arred(x: number): number {
  return Math.floor(x + 0.5);
}

function membrosDe(avaliadores: string[]): string[] {
  return avaliadores.length ? avaliadores : MEMBROS;
}

export function tangValidado(p: ProjetoDoc, avaliadores: string[]): number | null {
  if (!p.resultado) return null;
  const ms = membrosDe(avaliadores);
  const vs = ms.map((m) => p.resultado!.validacoes[m]).filter((v): v is number => v !== undefined);
  if (vs.length < ms.length) return null;
  return arred(vs.reduce((a, b) => a + b, 0) / vs.length);
}

export function critNota(p: ProjetoDoc, k: 'i' | 'imp' | 'alc', avaliadores: string[]): number | null {
  const ns = membrosDe(avaliadores).map((m) => p.notas?.[m]).filter(Boolean).map((x) => x![k]);
  return ns.length ? arred(ns.reduce((a, b) => a + b, 0) / ns.length) : null;
}

export function isAvaliado(p: ProjetoDoc, avaliadores: string[]): boolean {
  const ms = membrosDe(avaliadores);
  return !p.reprovado && !!p.resultado && tangValidado(p, avaliadores) !== null && ms.every((m) => p.notas?.[m]);
}

export function pontualidade(p: ProjetoDoc): number {
  return p.resultado && p.deadline && p.resultado.data <= p.deadline ? 100 : 0;
}

export interface LinhaRanking {
  pos: number;
  uid: string;
  projeto: string;
  cat: string;
  tang: number;
  tangPts: number;
  intg: number;
  imp: number;
  alc: number;
  pont: string;
  pts: number;
}

/** Ranking do ciclo com desempate pelo tangível validado (RF-42). */
export function rankingDoCiclo(projects: ProjetoDoc[], cicloId: string, avaliadores: string[]): LinhaRanking[] {
  const avaliados = projects.filter((p) => p.ciclo === cicloId && isAvaliado(p, avaliadores));
  const mt = Math.max(0, ...projects.filter((p) => p.ciclo === cicloId && !p.reprovado).map((p) => tangValidado(p, avaliadores) ?? 0)) || 1;
  const linhas = avaliados.map((p) => {
    const tv = tangValidado(p, avaliadores)!;
    const T = (tv / mt) * 100;
    const I = critNota(p, 'i', avaliadores)! * 20;
    const Im = critNota(p, 'imp', avaliadores)! * 20;
    const Al = critNota(p, 'alc', avaliadores)! * 20;
    const P = pontualidade(p);
    return {
      pos: 0, uid: p.uid, projeto: p.nome, cat: p.cat, tang: tv, tangPts: Math.round(T),
      intg: I / 20, imp: Im / 20, alc: Al / 20, pont: P + '%',
      pts: arred(T * 0.4 + I * 0.2 + Im * 0.15 + Al * 0.15 + P * 0.1),
    };
  });
  linhas.sort((a, b) => b.pts - a.pts || b.tang - a.tang);
  linhas.forEach((l, i) => { l.pos = i + 1; });
  return linhas;
}

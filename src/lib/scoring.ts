/**
 * Regras de negócio — pontuação (seção 5 da Especificação v2.1).
 *
 * Pesos: Tangível 40% · Intangível 20% · Impacto 15% · Alcance 15% · Pontualidade 10%.
 * Tangível: (retorno validado ÷ maior retorno validado do ciclo) × 100, onde o retorno
 * validado é a MÉDIA das validações dos 3 membros do comitê (decisão P13 / RF-38).
 * Notas 0–5: média dos 3 avaliadores arredondada para inteiro (0,5 para cima) × 20.
 * Pontualidade: binária e automática (RF-41).
 */
import { arred } from './format';
import type { Projeto } from './types';

/**
 * Membros do comitê (uids dos usuários com papel 'avaliador').
 * O comitê é fixo em três pessoas (seção 3 da spec), mas os uids reais vêm do
 * Google — o store atualiza este registro sempre que a lista de usuários muda.
 */
let COMITE: string[] = [];

export function setComiteMembros(uids: string[]): void {
  COMITE = uids;
}

export function comiteMembros(): string[] {
  return COMITE;
}

export interface Score {
  T: number;
  I: number;
  Im: number;
  Al: number;
  P: number;
  final: number;
}

/** Quantidade de validações de tangível já registradas. */
export function nValidacoes(p: Projeto): number {
  if (!p.resultado) return 0;
  return comiteMembros().filter((m) => p.resultado!.validacoes[m] !== undefined).length;
}

/**
 * Valor tangível validado: média das validações dos 3 membros, arredondada
 * para o real inteiro (0,5 para cima). Null enquanto os três não validarem (RF-38).
 */
export function tangValidado(p: Projeto): number | null {
  if (!p.resultado) return null;
  const ms = comiteMembros();
  if (!ms.length) return null;
  const vs = ms.map((m) => p.resultado!.validacoes[m]).filter((v): v is number => v !== undefined);
  if (vs.length < ms.length) return null;
  return arred(vs.reduce((a, b) => a + b, 0) / vs.length);
}

export function nNotas(p: Projeto): number {
  return comiteMembros().filter((m) => p.notas[m]).length;
}

export function notasCompletas(p: Projeto): boolean {
  const ms = comiteMembros();
  return ms.length > 0 && ms.every((m) => p.notas[m]);
}

/** Projeto "Avaliado": 3 validações de tangível + 3 notas, e não reprovado (RF-40). */
export function isAvaliado(p: Projeto): boolean {
  return !p.reprovado && !!p.resultado && tangValidado(p) !== null && notasCompletas(p);
}

/** Nota agregada de um critério: média dos 3, arredondada para inteiro (0–5). */
export function critNota(p: Projeto, k: 'i' | 'imp' | 'alc'): number | null {
  const ns = comiteMembros().map((m) => p.notas[m]).filter(Boolean).map((x) => x![k]);
  return ns.length ? arred(ns.reduce((a, b) => a + b, 0) / ns.length) : null;
}

/**
 * Maior retorno validado do ciclo — base da normalização relativa do Tangível.
 * Reprovados e backlog não entram na normalização (seção 5).
 */
export function maxTang(projects: Projeto[], cicloId: string): number {
  return Math.max(
    0,
    ...projects
      .filter((p) => p.ciclo === cicloId && !p.reprovado)
      .map((p) => tangValidado(p) ?? 0),
  );
}

/** Pontualidade automática e binária (RF-41). */
export function pontualidade(p: Projeto): number {
  return p.resultado && p.deadline && p.resultado.data <= p.deadline ? 100 : 0;
}

/** Pontuação final (inteira, sem casas decimais — seção 5). */
export function score(projects: Projeto[], p: Projeto): Score | null {
  if (!isAvaliado(p)) return null;
  const tv = tangValidado(p)!;
  const mt = maxTang(projects, p.ciclo) || 1;
  const T = (tv / mt) * 100;
  const I = critNota(p, 'i')! * 20;
  const Im = critNota(p, 'imp')! * 20;
  const Al = critNota(p, 'alc')! * 20;
  const P = pontualidade(p);
  return { T, I, Im, Al, P, final: arred(T * 0.4 + I * 0.2 + Im * 0.15 + Al * 0.15 + P * 0.1) };
}

/**
 * Projetos avaliados do ciclo, ordenados por pontuação com desempate
 * pelo tangível validado (RF-42).
 */
export function rankingDoCiclo(projects: Projeto[], cicloId: string): { p: Projeto; s: Score }[] {
  const ps = projects
    .filter((p) => p.ciclo === cicloId && isAvaliado(p))
    .map((p) => ({ p, s: score(projects, p)! }));
  ps.sort((a, b) => b.s.final - a.s.final || (tangValidado(b.p) ?? 0) - (tangValidado(a.p) ?? 0));
  return ps;
}

/** Rubrica de referência (notas 0–5), exibida na tela de avaliação (RF-39). */
export const RUBRICA = [
  { n: '0', t: 'Nenhum ganho intangível identificável' },
  { n: '1', t: 'Ganho leve, pontual, difícil de perceber' },
  { n: '2', t: 'Melhoria percebida, mas não transformadora' },
  { n: '3', t: 'Impacto claro, equipe/cliente nota a diferença' },
  { n: '4', t: 'Mudança expressiva de qualidade ou cultura' },
  { n: '5', t: 'Transformação visível, referência para a empresa' },
];

/** Categorias fixas do pitch (RF-17). */
export const CATS = [
  { id: 'produtividade', nome: 'Produtividade e Eficiência', desc: 'Automação de tarefas repetitivas, aceleração de processos' },
  { id: 'qualidade', nome: 'Qualidade e Tomada de Decisão', desc: 'Análise de dados, previsões precisas, redução de erros' },
  { id: 'experiencia', nome: 'Experiência do Cliente', desc: 'Personalização em escala, respostas mais rápidas' },
  { id: 'inovacao', nome: 'Inovação e Competitividade', desc: 'Geração de conteúdo, P&D, insights de mercado' },
  { id: 'reducao', nome: 'Redução de Custos', desc: 'Menos retrabalho, otimização de recursos' },
] as const;

export function catNome(id: string): string {
  const c = CATS.find((x) => x.id === id);
  return c ? c.nome : id;
}

/** Taxonomia de ganhos intangíveis em 3 grupos (RF-17). */
export const INTANGIVEIS = [
  { g: 'Pessoas e cultura', itens: ['Satisfação da equipe', 'Aprendizado e capacitação', 'Redução de estresse', 'Cultura de inovação', 'Engajamento', 'Colaboração entre times'] },
  { g: 'Qualidade e operação', itens: ['Redução de erros', 'Agilidade nos processos', 'Consistência', 'Satisfação do cliente', 'Maturidade analítica', 'Visibilidade e transparência'] },
  { g: 'Estratégia e reputação', itens: ['Imagem da empresa', 'Vantagem competitiva', 'Replicabilidade', 'Redução de risco operacional', 'Retenção de talentos', 'Escalabilidade'] },
];

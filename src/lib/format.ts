/** Formatação e helpers de apresentação. */

export function brl(v: number): string {
  return 'R$ ' + Math.round(v).toLocaleString('pt-BR');
}

/** Moeda compacta para espaços apertados: "R$ 49 mil". */
export function brlK(v: number): string {
  return v >= 1000 ? 'R$ ' + (Math.round(v / 100) / 10).toLocaleString('pt-BR') + ' mil' : brl(v);
}

/** Converte entrada do usuário ("8.000", "8000,50") em número. */
export function num(s: string | number): number {
  if (typeof s === 'number') return isNaN(s) ? 0 : s;
  const n = parseFloat(String(s).replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

/** Arredondamento oficial do programa: 0,5 para cima (seção 5). */
export function arred(x: number): number {
  return Math.floor(x + 0.5);
}

export function iniciais(nome: string): string {
  const p = (nome ?? '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '?';
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0];
}

/** Paleta de avatares (cores estilo Google Workspace). */
export const GCOLORS = ['#D93025', '#1A73E8', '#188038', '#F9AB00', '#9334E6', '#E8710A', '#12857B', '#5F6368', '#C5221F', '#1967D2', '#B06000', '#7B1FA2'];

export function plural(n: number, s: string, p: string): string {
  return n === 1 ? s : p;
}

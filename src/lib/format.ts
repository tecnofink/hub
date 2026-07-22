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

/**
 * Ajusta a rendição da foto do Google (lh3.googleusercontent.com) ao tamanho de
 * exibição em telas retina (2×), com piso de 128px. Isso também contorna a
 * miniatura padrão `=s96-c`, que às vezes volta como monograma (a letra em
 * círculo) por cache velho depois de a pessoa trocar a foto no Google — os
 * demais tamanhos servem a foto real. URLs sem o sufixo `=sNN` ficam intactas.
 */
export function fotoNaMedida(url: string | undefined, size: number): string | undefined {
  if (!url) return url;
  const alvo = Math.max(96, Math.round(size * 2)); // 2x p/ retina; piso 96 evita o =s96 quebrado
  // troca o sufixo de tamanho onde quer que apareça (fim da URL ou antes de ?/&),
  // cobrindo tanto =sNN[-c] quanto =wNN-hNN; URLs sem esse token ficam intactas
  return url
    .replace(/=s\d+(-c)?(?=$|[?&])/, '=s' + alvo + '-c')
    .replace(/=w\d+-h\d+(-c)?(?=$|[?&])/, '=s' + alvo + '-c');
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0];
}

/** Paleta de avatares (cores estilo Google Workspace). */
export const GCOLORS = ['#D93025', '#1A73E8', '#188038', '#F9AB00', '#9334E6', '#E8710A', '#12857B', '#5F6368', '#C5221F', '#1967D2', '#B06000', '#7B1FA2'];

export function plural(n: number, s: string, p: string): string {
  return n === 1 ? s : p;
}

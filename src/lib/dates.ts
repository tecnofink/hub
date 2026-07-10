/** Utilitários de data — todas as datas do domínio são strings ISO (yyyy-mm-dd). */

export function todayISO(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function atNoon(iso: string): Date {
  return new Date(iso + 'T12:00:00');
}

/** dd/mm/aaaa */
export function dbr(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** dd/mm */
export function dbrCurto(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

/** Dias de hoje até a data (negativo se já passou). */
export function diasAte(iso: string): number {
  return Math.round((atNoon(iso).getTime() - atNoon(todayISO()).getTime()) / 864e5);
}

export function diffDias(deIso: string, ateIso: string): number {
  return Math.round((atNoon(ateIso).getTime() - atNoon(deIso).getTime()) / 864e5);
}

export function addDias(iso: string, dias: number): string {
  const d = atNoon(iso);
  d.setDate(d.getDate() + dias);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * Duração do ciclo em meses, arredondada para o meio mês mais próximo
 * (base da padronização "valores mensais × meses do ciclo" — RF-18).
 */
export function mesesDoCiclo(inicio: string, fim: string): number {
  const meses = diffDias(inicio, fim) / 30.4375;
  return Math.max(0.5, Math.round(meses * 2) / 2);
}

export function mesesLabel(m: number): string {
  return m.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + ' meses';
}

const DIAS_SEMANA = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];
const MESES_EXT = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

/** "SÁBADO · 3 DE OUTUBRO DE 2026" (saudação do hub — RF-09). */
export function hojeExtenso(): string {
  const d = new Date();
  return `${DIAS_SEMANA[d.getDay()]} · ${d.getDate()} DE ${MESES_EXT[d.getMonth()]} DE ${d.getFullYear()}`;
}

/** "MMM AAAA" para marcações de linha do tempo. */
export function mesAbrevAno(iso: string): string {
  const d = atNoon(iso);
  return `${MESES_ABREV[d.getMonth()]} ${d.getFullYear()}`;
}

/** Primeiro dia de cada mês dentro do intervalo [inicio, fim]. */
export function mesesNoIntervalo(inicio: string, fim: string): string[] {
  const out: string[] = [inicio];
  let d = atNoon(inicio);
  d = new Date(d.getFullYear(), d.getMonth() + 1, 1, 12);
  const end = atNoon(fim);
  while (d <= end) {
    out.push([d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), '01'].join('-'));
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1, 12);
  }
  return out;
}

/** "dd/mm · hh:mm" para logs de auditoria. */
export function logTimestamp(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

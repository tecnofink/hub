/**
 * Papéis por área (decisão de 09/07/2026 — supersede o papel único da spec):
 *   · hubAdmin  — administra o PORTAL: contas, domínios e ferramentas do hub
 *   · fluxAdmin — administra o FLUX: ciclos, triagem, acessos, papéis do Flux
 *   · avaliador — comitê do Flux (inalterado)
 * Cada ferramenta gere seu próprio acesso (Playbook: editores; Gestor: papéis
 * por projeto). O valor legado 'admin' vale como hubAdmin+fluxAdmin durante a
 * transição (conta criada pelo bootstrap original).
 */
import type { Usuario } from './types';

export function ehHubAdmin(u?: Usuario | null): boolean {
  return !!u && (u.roles.includes('hubAdmin') || u.roles.includes('admin'));
}

export function ehFluxAdmin(u?: Usuario | null): boolean {
  return !!u && (u.roles.includes('fluxAdmin') || u.roles.includes('admin'));
}

export function ehAvaliador(u?: Usuario | null): boolean {
  return !!u && u.roles.includes('avaliador');
}

/** Hosts do próprio portal — cadastros feitos com a URL completa valem como rota interna. */
const HOSTS_PROPRIOS = ['tecnofink-hub.web.app', 'tecnofink-hub.firebaseapp.com', 'localhost'];

/** Normaliza a rota cadastrada: URL do próprio hub vira caminho interno, sem barra final. */
export function rotaNormalizada(rota: string): string {
  const r = rota.trim();
  const m = /^https?:\/\/([^/?#]+)([^?#]*)/i.exec(r);
  if (!m) return r.length > 1 ? r.replace(/\/+$/, '') : r;
  const host = m[1].toLowerCase().split(':')[0];
  const proprio = HOSTS_PROPRIOS.includes(host)
    || (typeof window !== 'undefined' && host === window.location.hostname.toLowerCase());
  if (!proprio) return r;
  const caminho = (m[2] || '').replace(/\/+$/, '');
  return caminho === '' ? '/' : caminho;
}

/** Ícone automático de ferramenta cadastrada: favicon do site (rotas externas). */
export function faviconDe(rota: string): string | null {
  const r = rotaNormalizada(rota);
  return /^https?:\/\//.test(r)
    ? 'https://www.google.com/s2/favicons?sz=64&domain_url=' + encodeURIComponent(r)
    : null;
}

/** Logos das ferramentas nativas com rota interna (marca própria em /brand). */
export function iconeNativo(rota: string): string | null {
  const r = rotaNormalizada(rota);
  if (r === '/tarefas' || r.startsWith('/tarefas/')) return '/brand/produtividade-badge.png';
  if (r === '/playbook' || r.startsWith('/playbook/')) return '/brand/marketing-badge.png';
  return null;
}

/**
 * Opções fixas de Empresa/unidade e Departamento — fonte única usada tanto na
 * tela de Perfil quanto no modal de conclusão de perfil (primeiro acesso).
 */
import type { Usuario } from './types';

export const EMPRESAS = ['Tecnofink Matriz', 'Tecnofink Itaboraí', 'Powerpoxi'];

// ordenados alfabeticamente (pt-BR) — o .sort mantém a ordem mesmo se alguém
// acrescentar um departamento novo à lista no futuro
export const DEPTOS = [
  'Administrativo', 'Conselho Administrativo', 'Comercial', 'Diretoria Executiva',
  'Diretoria Estratégica de Mercado e Inovação', 'Monitoramento', 'Presidência',
  'Qualidade', 'Técnico',
].sort((a, b) => a.localeCompare(b, 'pt-BR'));

/** Perfil completo: cargo preenchido + empresa e departamento dentro das listas. */
export function perfilCompleto(u: Pick<Usuario, 'cargo' | 'empresa' | 'depto'>): boolean {
  return u.cargo.trim() !== '' && EMPRESAS.includes(u.empresa) && DEPTOS.includes(u.depto);
}

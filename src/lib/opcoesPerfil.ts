/**
 * Opções fixas de Empresa/unidade e Departamento — fonte única usada tanto na
 * tela de Perfil quanto no modal de conclusão de perfil (primeiro acesso).
 */
import type { Usuario } from './types';

export const EMPRESAS = ['Tecnofink Matriz', 'Tecnofink Itaboraí', 'Powerpoxi'];

export const DEPTOS = [
  'Presidência e Conselho', 'Engenharia', 'Comercial', 'Financeiro', 'Controladoria',
  'RH e DP', 'Compras', 'Inovação, Marketing e Estratégia', 'Operações', 'Qualidade e Segurança',
];

/** Perfil completo: cargo preenchido + empresa e departamento dentro das listas. */
export function perfilCompleto(u: Pick<Usuario, 'cargo' | 'empresa' | 'depto'>): boolean {
  return u.cargo.trim() !== '' && EMPRESAS.includes(u.empresa) && DEPTOS.includes(u.depto);
}

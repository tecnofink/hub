/**
 * Fase do programa Flux para o indicador do card em destaque do hub:
 *   abre        — ciclo criado com início no futuro (abertura do novo ciclo)
 *   inscricoes  — hoje dentro do período de inscrições (até a data-limite)
 *   execucao    — inscrições encerradas, ciclo em andamento (até o fim)
 *   apuracao    — passou do fim, aguardando o encerramento pelo Admin do Flux
 *   aguardando  — nenhum ciclo ativo
 */
import type { Ciclo } from './types';
import { diffDias } from './dates';

export type FaseFlux =
  | { fase: 'abre' | 'inscricoes' | 'execucao'; dias: number }
  | { fase: 'apuracao' | 'aguardando' };

export function faseDoFlux(c: Ciclo | null, hoje: string): FaseFlux {
  if (!c) return { fase: 'aguardando' };
  if (hoje < c.inicio) return { fase: 'abre', dias: diffDias(hoje, c.inicio) };
  if (hoje <= c.limite) return { fase: 'inscricoes', dias: diffDias(hoje, c.limite) };
  if (hoje <= c.fim) return { fase: 'execucao', dias: diffDias(hoje, c.fim) };
  return { fase: 'apuracao' };
}

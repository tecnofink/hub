/**
 * Axel — o mascote do Flux (artes da designer, jul/2026).
 * Fonte única: imagem de cada situação + textos das notícias (popups) de
 * mudança de etapa no kanban e de acesso ao Claude. Usado no kanban (colunas
 * vazias), nos popups globais, no ranking vazio, na home e no "Como funciona?".
 */
import type { ColunaId } from '../pages/flux/statusProjeto';
import type { Tier } from './types';

const BASE = '/brand/axel/';

export const AXEL = {
  /** 1 · sentado com o laptop — tela de inscrição de pitch */
  inscrever: BASE + 'axel-inscrever.webp',
  /** 7 · em pé, pronto — coluna Inscrito */
  inscrito: BASE + 'axel-inscrito.webp',
  /** 2 · surfando no foguete — coluna Em desenvolvimento */
  dev: BASE + 'axel-dev.webp',
  /** 8 · sentado na nuvem, aguardando — coluna Aguardando Avaliação */
  aval: BASE + 'axel-avaliacao.webp',
  /** 4 · segurando a estrela — coluna Concluído */
  conc: BASE + 'axel-concluido.webp',
  /** 10 · deitado na nuvem — coluna Reprovado */
  rep: BASE + 'axel-reprovado.webp',
  /** 3 · abraçado ao foguetinho — coluna Backlog */
  back: BASE + 'axel-backlog.webp',
  /** 5 · erguendo a bandeira do Flux — acesso Claude Enterprise */
  enterprise: BASE + 'axel-enterprise.webp',
  /** 6 · carregando a bandeira — acesso Claude Basic */
  basic: BASE + 'axel-basic.webp',
  /** 9 · voando — ciclo ativo (home) e hero do Como funciona */
  ciclo: BASE + 'axel-ciclo.webp',
  /** 11 · pódio com três Axels — ranking vazio */
  ranking: BASE + 'axel-ranking.webp',

  /* ── 2ª leva (21/07) — extras com telas definidas por nós ── */
  /** lua + violão — histórico de ciclos vazio */
  historico: BASE + 'axel-historico.webp',
  /** segurando o globo — tela de login */
  login: BASE + 'axel-login.webp',
  /** sentado no foguetinho — Flux sem ciclo ativo */
  semCiclo: BASE + 'axel-semciclo.webp',
  /** no skate — Produtividade sem projetos */
  gestor: BASE + 'axel-gestor.webp',
} as const;

/** Mascote de cada categoria de pitch (Destaques por categoria) — mapeamento
    confirmado pelo Daniel em 21/07: produtividade=yoga · qualidade=café ·
    experiência=dedão #1 · inovação=disco voador · redução=livro sobre moedas. */
export const AXEL_CATEGORIA: Record<string, string> = {
  produtividade: BASE + 'axel-cat-produtividade.webp',
  qualidade: BASE + 'axel-cat-qualidade.webp',
  experiencia: BASE + 'axel-cat-experiencia.webp',
  inovacao: BASE + 'axel-cat-inovacao.webp',
  reducao: BASE + 'axel-cat-reducao.webp',
};

/** Mascote de cada coluna do kanban — substitui o antigo [ VAZIO ]. */
export const AXEL_COLUNA: Record<ColunaId, string> = {
  inscrito: AXEL.inscrito,
  dev: AXEL.dev,
  aval: AXEL.aval,
  conc: AXEL.conc,
  rep: AXEL.rep,
  back: AXEL.back,
};

/** Notícia exibida no popup global do Axel (Shell). */
export interface NoticiaAxel {
  img: string;
  titulo: string;
  texto: string;
}

/** Popup quando o projeto do usuário muda de coluna no kanban. */
export function noticiaEtapa(col: ColunaId, projeto: string): NoticiaAxel {
  switch (col) {
    case 'inscrito':
      return { img: AXEL.inscrito, titulo: 'Pitch no jogo!', texto: `"${projeto}" está na coluna Inscrito — o comitê vai definir seu acesso ao Claude.` };
    case 'dev':
      return { img: AXEL.dev, titulo: 'Em desenvolvimento!', texto: `"${projeto}" entrou em execução. Bom trabalho — registre o resultado até o seu deadline.` };
    case 'aval':
      return { img: AXEL.aval, titulo: 'Resultado na mesa do comitê!', texto: `O resultado de "${projeto}" foi registrado e aguarda a validação e as notas do comitê.` };
    case 'conc':
      return { img: AXEL.conc, titulo: 'Projeto concluído!', texto: `A avaliação de "${projeto}" está completa. Confira sua pontuação no ranking!` };
    case 'rep':
      return { img: AXEL.rep, titulo: 'Decisão do comitê', texto: `"${projeto}" foi reprovado neste ciclo e sai do ranking. A ideia fica registrada — o aprendizado conta.` };
    case 'back':
      return { img: AXEL.back, titulo: 'Guardado no backlog', texto: `"${projeto}" foi para o Backlog de Projetos. Quando um novo ciclo abrir inscrições, você poderá reativá-lo.` };
  }
}

/** Popup quando o comitê libera o acesso ao Claude (tier definido no Flux). */
export function noticiaAcesso(tier: Tier, projeto: string): NoticiaAxel {
  return tier === 'Enterprise'
    ? { img: AXEL.enterprise, titulo: 'Acesso Claude Enterprise liberado!', texto: `O comitê liberou o Claude Enterprise para você executar "${projeto}". Aproveite todo o potencial!` }
    : { img: AXEL.basic, titulo: 'Acesso Claude Basic liberado!', texto: `O comitê liberou o Claude Basic para você executar "${projeto}". Mãos à obra!` };
}

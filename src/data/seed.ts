/**
 * Dados de demonstração (modo demo, sem backend).
 *
 * São os personagens e projetos do protótipo validado. As datas do protótipo
 * foram ancoradas em 03/10/2026; aqui todas são deslocadas pelo mesmo delta
 * para que o estado do ciclo fique coerente com a data real de hoje.
 * Na fase de infraestrutura este seed é substituído pelo Firestore.
 */
import { addDias, diffDias, todayISO, dbrCurto } from '../lib/dates';
import type { AppState, Projeto, Usuario, QuadroProjeto } from '../lib/types';

const ANCORA = '2026-10-03';
const DELTA = diffDias(ANCORA, todayISO());

/** Desloca uma data ISO do protótipo para o calendário real. */
function s(iso: string): string {
  return addDias(iso, DELTA);
}

function u(id: string, nome: string, email: string, cargo: string, depto: string, roles: Usuario['roles'], apres: string, niver: string): Usuario {
  return { id, nome, email, cargo, depto, empresa: 'Tecnofink LTDA', roles, ativo: true, apres, niver };
}

function n(i: number, imp: number, alc: number) {
  return { i, imp, alc };
}

/** Validação integral do tangível pelos 3 membros (média = valor declarado). */
function val3(tang: number): Record<string, number> {
  return { marcos: tang, emilio: tang, thomas: tang };
}

/** Anexos de demonstração (sem arquivo real no Storage). */
function ax(...nomes: string[]): { n: string; url: string }[] {
  return nomes.map((n) => ({ n, url: '' }));
}

function seedProjects(): Projeto[] {
  return [
    {
      id: 'p1', uid: 'ana', ciclo: 'c1', nome: 'Automação de relatório semanal de fechamento', cat: 'produtividade',
      estimValor: 8000, estimPer: 'mes', intang: ['Redução de estresse', 'Agilidade nos processos'], deadline: s('2026-09-30'),
      just: 'O relatório de fechamento semanal era manual e consumia cerca de 4h toda sexta-feira. Com o Claude, um agente extrai, consolida e formata os dados automaticamente em menos de 10 minutos.',
      criadoEm: s('2026-07-15'), tier: 'Enterprise',
      resultado: { valor: 14000, per: 'mes', tang: 49000, intang: ['Redução de estresse', 'Agilidade nos processos', 'Satisfação da equipe'], desc: 'Agente em produção: 4h/semana liberadas na equipe de Operações e fechamento publicado sem atrasos desde então.', anexos: ax('memoria_de_calculo.xlsx', 'antes_e_depois.png'), data: s('2026-09-25'), validacoes: val3(49000) },
      notas: { marcos: n(4, 5, 4), emilio: n(4, 4, 4), thomas: n(4, 5, 4) },
    },
    {
      id: 'p2', uid: 'rafael', ciclo: 'c1', nome: 'Painel comercial em tempo real com IA', cat: 'qualidade',
      estimValor: 7000, estimPer: 'mes', intang: ['Maturidade analítica', 'Visibilidade e transparência'], deadline: s('2026-09-20'),
      just: 'Consolidar CRM e faturamento exigia extração manual diária. A IA monta o painel e explica os desvios de meta em linguagem simples.',
      criadoEm: s('2026-07-16'), tier: 'Basic',
      resultado: { valor: 8000, per: 'mes', tang: 28000, intang: ['Maturidade analítica', 'Agilidade nos processos'], desc: 'Painel atualizado a cada hora; as reuniões comerciais deixaram de gastar tempo levantando números.', anexos: ax('painel_screenshot.png'), data: s('2026-09-18'), validacoes: val3(28000) },
      notas: { marcos: n(3, 4, 4), emilio: n(3, 4, 3), thomas: n(4, 4, 4) },
    },
    {
      id: 'p3', uid: 'julia', ciclo: 'c1', nome: 'Geração de propostas técnicas com IA', cat: 'inovacao',
      estimValor: 20000, estimPer: 'ciclo', intang: ['Vantagem competitiva', 'Imagem da empresa'], deadline: s('2026-09-15'),
      just: 'Cada proposta técnica levava até 3 dias entre levantamento e redação. Com IA, a primeira versão sai em horas, a partir do histórico de projetos.',
      criadoEm: s('2026-07-20'), tier: 'Basic',
      resultado: { valor: 22000, per: 'ciclo', tang: 22000, intang: ['Vantagem competitiva', 'Agilidade nos processos'], desc: 'Tempo médio de proposta caiu de 3 dias para 1; duas concorrências ganhas no período com resposta mais rápida.', anexos: ax('propostas_comparativo.pdf'), data: s('2026-09-12'), validacoes: val3(22000) },
      notas: { marcos: n(4, 4, 3), emilio: n(4, 3, 3), thomas: n(5, 4, 3) },
    },
    {
      id: 'p4', uid: 'pedro', ciclo: 'c1', nome: 'Chatbot interno de atendimento', cat: 'experiencia',
      estimValor: 5000, estimPer: 'mes', intang: ['Satisfação do cliente', 'Consistência'], deadline: s('2026-09-28'),
      just: 'Dúvidas internas repetidas sobrecarregavam o atendimento. Um chatbot treinado nos manuais responde na hora, 24/7.',
      criadoEm: s('2026-07-22'), tier: 'Basic',
      resultado: { valor: 6000, per: 'mes', tang: 21000, intang: ['Satisfação do cliente', 'Agilidade nos processos', 'Consistência'], desc: 'O chatbot respondeu 1.200 conversas no ciclo com 87% de resolução sem intervenção humana.', anexos: ax('metricas_chatbot.xlsx', 'fluxo_conversas.png'), data: s('2026-09-26'), validacoes: val3(21000) },
      notas: { marcos: n(3, 4, 5), emilio: n(3, 4, 4), thomas: n(3, 5, 5) },
    },
    {
      id: 'p5', uid: 'carla', ciclo: 'c1', nome: 'Conferência automática de faturas de fornecedores', cat: 'reducao',
      estimValor: 6000, estimPer: 'mes', intang: ['Redução de erros', 'Redução de risco operacional'], deadline: s('2026-09-30'),
      just: 'A conferência de faturas contra pedidos era manual e sujeita a erros. A IA cruza os documentos e aponta divergências antes do pagamento.',
      criadoEm: s('2026-07-25'), tier: 'Basic',
      resultado: { valor: 5000, per: 'mes', tang: 17500, intang: ['Redução de erros', 'Redução de risco operacional'], desc: 'R$ 17.500 em divergências evitadas no ciclo; a conferência caiu de 2 dias para 2 horas por lote.', anexos: ax('divergencias_detectadas.xlsx', 'fluxo_conferencia.pdf'), data: s('2026-09-29'), validacoes: { emilio: 17500, thomas: 16000 } },
      notas: { marcos: null, emilio: n(2, 3, 2), thomas: n(3, 3, 3) },
    },
    {
      id: 'p6', uid: 'lara', ciclo: 'c1', nome: 'Otimização de escala logística', cat: 'reducao',
      estimValor: 9000, estimPer: 'ciclo', intang: ['Redução de risco operacional', 'Agilidade nos processos'], deadline: s('2026-09-10'),
      just: 'Montar a escala de entregas manualmente gerava rotas ociosas. A IA propõe a escala ótima a partir do histórico.',
      criadoEm: s('2026-07-28'), tier: 'Basic', resultado: null, notas: { marcos: null, emilio: null, thomas: null },
    },
    {
      id: 'p7', uid: 'marcos', ciclo: 'c1', nome: 'Dashboard de indicadores em tempo real', cat: 'qualidade',
      estimValor: 4000, estimPer: 'mes', intang: ['Maturidade analítica', 'Visibilidade e transparência'], deadline: s('2026-10-20'),
      just: 'Os indicadores operacionais chegavam com uma semana de atraso. O dashboard com IA resume os dados do dia e explica desvios.',
      criadoEm: s('2026-08-02'), tier: 'Enterprise', resultado: null, notas: { marcos: null, emilio: null, thomas: null },
    },
    {
      id: 'p8', uid: 'daniel', ciclo: 'c1', nome: 'Triagem inteligente de chamados de TI', cat: 'produtividade',
      estimValor: 3500, estimPer: 'mes', intang: ['Agilidade nos processos', 'Satisfação da equipe'], deadline: s('2026-10-25'),
      just: 'Os chamados de TI chegam sem triagem e são distribuídos manualmente. A IA classifica, prioriza e sugere a resposta inicial.',
      criadoEm: s('2026-09-30'), tier: null, resultado: null, notas: { marcos: null, emilio: null, thomas: null },
    },
    {
      id: 'p9', uid: 'bruno', ciclo: 'c1', nome: 'Gerador de campanhas com IA', cat: 'inovacao',
      estimValor: 4000, estimPer: 'mes', intang: ['Imagem da empresa', 'Agilidade nos processos'], deadline: s('2026-09-05'),
      just: 'Criação de peças e textos de campanha com IA a partir do briefing, reduzindo o ciclo de produção de conteúdo.',
      criadoEm: s('2026-07-30'), tier: 'Basic', reprovado: true,
      resultado: { valor: 2000, per: 'mes', tang: 7000, intang: ['Agilidade nos processos'], desc: 'Resultado registrado três semanas após o deadline definido no pitch.', anexos: ax('pecas_geradas.zip'), data: s('2026-09-26'), validacoes: {} },
      notas: { marcos: null, emilio: null, thomas: null },
    },
    {
      id: 'p10', uid: 'rafael', ciclo: 'backlog', backlogDe: 'c1', nome: 'Assistente de follow-up comercial', cat: 'experiencia',
      estimValor: 0, estimPer: 'ciclo', intang: [], deadline: null,
      just: 'Follow-ups personalizados gerados automaticamente a partir do CRM.',
      criadoEm: s('2026-10-01'), tier: null, resultado: null, notas: {},
    },
    {
      id: 'p11', uid: 'carla', ciclo: 'backlog', backlogDe: 'c1', nome: 'Previsão de fluxo de caixa com IA', cat: 'qualidade',
      estimValor: 0, estimPer: 'ciclo', intang: [], deadline: null,
      just: 'Projeção semanal de caixa a partir dos dados do ERP.',
      criadoEm: s('2026-10-02'), tier: null, resultado: null, notas: {},
    },
  ];
}

function T(id: string, et: string, ti: string, resp: string, prazo: string, prio: 'Alta' | 'Média' | 'Baixa', st: 'nao' | 'and' | 'rev' | 'conc') {
  return { id, et, ti, resp, prazo: s(prazo), prio, st };
}

function seedTarefas(): Record<string, QuadroProjeto> {
  return {
    p7: {
      etapas: [
        { id: 'F0', nome: 'Levantamento de indicadores', inicio: s('2026-07-20'), fim: s('2026-08-20') },
        { id: 'F1', nome: 'Conexão das fontes de dados', inicio: s('2026-08-10'), fim: s('2026-09-05') },
        { id: 'F2', nome: 'Construção do painel', inicio: s('2026-09-01'), fim: s('2026-09-28') },
        { id: 'F3', nome: 'IA de resumos e desvios', inicio: s('2026-09-20'), fim: s('2026-10-12') },
        { id: 'F4', nome: 'Validação com a diretoria', inicio: s('2026-10-12'), fim: s('2026-10-18') },
      ],
      tasks: [
        T('TASK-001', 'F0', 'Mapear indicadores com cada diretoria', 'Marcos Freitas', '2026-08-05', 'Alta', 'conc'),
        T('TASK-002', 'F0', 'Definir metas e limites de alerta', 'Marcos Freitas', '2026-08-12', 'Alta', 'conc'),
        T('TASK-003', 'F0', 'Aprovar escopo do painel', 'Marcos Freitas', '2026-08-20', 'Média', 'conc'),
        T('TASK-004', 'F1', 'Acesso ao banco do ERP', 'Daniel Rocha', '2026-08-25', 'Alta', 'conc'),
        T('TASK-005', 'F1', 'Integração com planilhas de Operações', 'Marcos Freitas', '2026-09-01', 'Média', 'conc'),
        T('TASK-006', 'F1', 'Rotina de atualização horária', 'Daniel Rocha', '2026-09-05', 'Alta', 'conc'),
        T('TASK-007', 'F2', 'Estrutura das telas do painel', 'Marcos Freitas', '2026-09-12', 'Alta', 'conc'),
        T('TASK-008', 'F2', 'Gráficos de tendência por setor', 'Marcos Freitas', '2026-09-22', 'Média', 'conc'),
        T('TASK-009', 'F2', 'Filtros por empresa do grupo', 'Marcos Freitas', '2026-09-30', 'Média', 'and'),
        T('TASK-010', 'F2', 'Revisão visual no padrão Tecnofink', 'Marcos Freitas', '2026-09-28', 'Baixa', 'nao'),
        T('TASK-011', 'F3', 'Prompt de resumo diário', 'Marcos Freitas', '2026-10-06', 'Alta', 'and'),
        T('TASK-012', 'F3', 'Explicação automática de desvios', 'Marcos Freitas', '2026-10-08', 'Alta', 'nao'),
        T('TASK-013', 'F3', 'Alertas por e-mail', 'Daniel Rocha', '2026-10-10', 'Média', 'nao'),
        T('TASK-014', 'F4', 'Rodada de validação com diretores', 'Marcos Freitas', '2026-10-15', 'Alta', 'nao'),
        T('TASK-015', 'F4', 'Publicação no hub', 'Daniel Rocha', '2026-10-17', 'Alta', 'nao'),
      ],
    },
    p1: {
      etapas: [
        { id: 'F0', nome: 'Mapeamento do relatório', inicio: s('2026-07-15'), fim: s('2026-08-01') },
        { id: 'F1', nome: 'Agente de consolidação', inicio: s('2026-08-01'), fim: s('2026-09-05') },
        { id: 'F2', nome: 'Rollout e medição', inicio: s('2026-09-05'), fim: s('2026-09-25') },
      ],
      tasks: [
        T('TASK-001', 'F0', 'Levantar fontes do fechamento', 'Ana Lima', '2026-07-22', 'Alta', 'conc'),
        T('TASK-002', 'F0', 'Documentar passo a passo atual', 'Ana Lima', '2026-08-01', 'Média', 'conc'),
        T('TASK-003', 'F1', 'Prompt de extração e consolidação', 'Ana Lima', '2026-08-12', 'Alta', 'conc'),
        T('TASK-004', 'F1', 'Formatação automática do relatório', 'Ana Lima', '2026-08-20', 'Alta', 'conc'),
        T('TASK-005', 'F1', 'Validação em paralelo por 2 semanas', 'Ana Lima', '2026-09-05', 'Alta', 'conc'),
        T('TASK-006', 'F2', 'Treinar equipe de Operações', 'Ana Lima', '2026-09-12', 'Média', 'conc'),
        T('TASK-007', 'F2', 'Publicar rotina automática', 'Ana Lima', '2026-09-18', 'Alta', 'conc'),
        T('TASK-008', 'F2', 'Medir horas economizadas', 'Ana Lima', '2026-09-25', 'Média', 'conc'),
      ],
    },
    p8: {
      etapas: [
        { id: 'F0', nome: 'Descoberta', inicio: s('2026-09-30'), fim: s('2026-10-08') },
        { id: 'F1', nome: 'Protótipo de triagem', inicio: s('2026-10-06'), fim: s('2026-10-18') },
        { id: 'F2', nome: 'Go-live', inicio: s('2026-10-16'), fim: s('2026-10-24') },
      ],
      tasks: [
        T('TASK-001', 'F0', 'Levantar categorias de chamados', 'Daniel Rocha', '2026-10-06', 'Alta', 'and'),
        T('TASK-002', 'F0', 'Amostra de chamados históricos', 'Daniel Rocha', '2026-10-08', 'Média', 'nao'),
        T('TASK-003', 'F1', 'Prompt de classificação', 'Daniel Rocha', '2026-10-12', 'Alta', 'nao'),
        T('TASK-004', 'F1', 'Sugestão de resposta inicial', 'Daniel Rocha', '2026-10-15', 'Média', 'nao'),
        T('TASK-005', 'F2', 'Piloto com a equipe de TI', 'Daniel Rocha', '2026-10-20', 'Alta', 'nao'),
        T('TASK-006', 'F2', 'Ajustes e publicação', 'Daniel Rocha', '2026-10-24', 'Média', 'nao'),
      ],
    },
    tp1: {
      etapas: [
        { id: 'F0', nome: 'Mapeamento de processos', inicio: s('2026-09-15'), fim: s('2026-10-05') },
        { id: 'F1', nome: 'Plano de ação', inicio: s('2026-10-01'), fim: s('2026-10-30') },
      ],
      tasks: [
        { ...T('TASK-001', 'F0', 'Inventário dos processos críticos', 'Marcos Freitas', '2026-09-24', 'Alta', 'conc'), respId: 'marcos', inicio: s('2026-09-15'), conclusao: s('2026-09-23'), desc: 'Levantar os processos com impacto direto no cliente e classificar por criticidade.' },
        { ...T('TASK-002', 'F0', 'Entrevistas com líderes de área', 'Marcos Freitas', '2026-10-06', 'Média', 'and'), respId: 'daniel', inicio: s('2026-09-25'), desc: 'Roteiro padrão de entrevista + agenda com os 6 líderes.' },
        // status "Em revisão" (CRM) e responsável em texto livre (legado da migração)
        { ...T('TASK-003', 'F1', 'Matriz de riscos e prioridades', 'Equipe técnica', '2026-10-14', 'Alta', 'rev'), inicio: s('2026-10-01') },
        { ...T('TASK-004', 'F1', 'Apresentação à diretoria', 'Marcos Freitas', '2026-10-28', 'Média', 'nao'), respId: 'marcos' },
      ],
    },
    tp2: {
      etapas: [
        { id: 'F0', nome: 'Levantamento', inicio: s('2026-09-20'), fim: s('2026-10-02') },
        { id: 'F1', nome: 'Novos modelos', inicio: s('2026-10-01'), fim: s('2026-10-25') },
      ],
      tasks: [
        T('TASK-001', 'F0', 'Mapear planilhas em uso', 'Ana Lima', '2026-09-30', 'Média', 'conc'),
        T('TASK-002', 'F1', 'Modelo único de controle', 'Ana Lima', '2026-10-10', 'Alta', 'and'),
        T('TASK-003', 'F1', 'Treinar a equipe no modelo', 'Ana Lima', '2026-10-22', 'Média', 'nao'),
      ],
    },
    p6: {
      etapas: [
        { id: 'F0', nome: 'Modelo de rotas', inicio: s('2026-07-28'), fim: s('2026-08-25') },
        { id: 'F1', nome: 'Piloto assistido', inicio: s('2026-08-20'), fim: s('2026-09-10') },
      ],
      tasks: [
        T('TASK-001', 'F0', 'Histórico de entregas (6 meses)', 'Lara Mendes', '2026-08-08', 'Alta', 'conc'),
        T('TASK-002', 'F0', 'Modelo de escala com IA', 'Lara Mendes', '2026-08-18', 'Alta', 'conc'),
        T('TASK-003', 'F0', 'Validar custos por rota', 'Lara Mendes', '2026-08-25', 'Média', 'conc'),
        T('TASK-004', 'F1', 'Piloto em 2 rotas', 'Lara Mendes', '2026-09-03', 'Alta', 'and'),
        T('TASK-005', 'F1', 'Comparativo antes e depois', 'Lara Mendes', '2026-09-08', 'Alta', 'nao'),
        T('TASK-006', 'F1', 'Registro do resultado no Flux', 'Lara Mendes', '2026-09-10', 'Alta', 'nao'),
      ],
    },
  };
}

function logTs(iso: string, hm: string): string {
  return `${dbrCurto(s(iso))} · ${hm}`;
}

export function seedState(): AppState {
  return {
    uid: null,
    tema: 'light',
    users: [
      u('ana', 'Ana Lima', 'ana.lima@tecnofink.com', 'Analista de Operações', 'Operações', ['user'], 'Automatizo o que for repetitivo.', '12/03'),
      u('rafael', 'Rafael Costa', 'rafael.costa@tecnofink.com', 'Executivo de Contas', 'Comercial', ['user'], 'Vendas orientadas a dados.', '28/07'),
      u('julia', 'Julia Santos', 'julia.santos@tecnofink.com', 'Engenheira de Aplicações', 'Engenharia', ['user'], 'Engenharia + IA aplicada a propostas.', '05/11'),
      u('pedro', 'Pedro Melo', 'pedro.melo@tecnofink.com', 'Analista de Atendimento', 'Atendimento', ['user'], 'Atendimento que resolve na primeira mensagem.', '19/02'),
      u('carla', 'Carla Ferreira', 'carla.ferreira@tecnofink.com', 'Analista Financeira', 'Financeiro', ['user'], 'Números certos, decisões melhores.', '30/09'),
      u('lara', 'Lara Mendes', 'lara.mendes@tecnofink.com', 'Coordenadora de Logística', 'Logística', ['user'], 'Rotas otimizadas, entregas no prazo.', '14/06'),
      u('bruno', 'Bruno Alves', 'bruno.alves@tecnofink.com', 'Analista de Marketing', 'Marketing', ['user'], 'Conteúdo e campanhas com IA.', '21/12'),
      u('marcos', 'Marcos Freitas', 'marcos.freitas@tecnofink.com', 'Diretor de Operações', 'Diretoria de Operações', ['user', 'avaliador', 'admin'], 'Patrocinador do programa Flux.', '02/05'),
      u('daniel', 'Daniel Rocha', 'daniel.rocha@tecnofink.com', 'Analista de Sistemas', 'TI', ['user', 'admin'], 'Cuido do portal e dos acessos.', '23/01'),
      u('emilio', 'Emilio Duarte', 'emilio.duarte@tecnofink.com', 'Diretor Técnico', 'Diretoria Técnica', ['user', 'avaliador'], 'Comitê de avaliação do Flux.', '09/04'),
      u('thomas', 'Thomas Weber', 'thomas.weber@tecnofink.com', 'Diretor Comercial', 'Diretoria Comercial', ['user', 'avaliador'], 'Comitê de avaliação do Flux.', '17/08'),
    ],
    projects: seedProjects(),
    cycles: [
      { id: 'c1', nome: 'Ciclo 1', inicio: s('2026-07-14'), limite: s('2026-10-20'), fim: s('2026-11-01'), status: 'ativo', frozen: null },
      {
        id: 'c0', nome: 'Ciclo Piloto', inicio: s('2026-03-02'), limite: s('2026-04-10'), fim: s('2026-06-27'), status: 'encerrado', frozen: [
          { pos: 1, nome: 'Marcos Freitas', setor: 'Diretoria de Operações', projeto: 'Prova de conceito — assistente de propostas', cat: 'Inovação e Competitividade', tangL: 'R$ 31.500', tangPts: 100, intg: 4, imp: 4, alc: 4, pont: '100%', pts: 90 },
          { pos: 2, nome: 'Julia Santos', setor: 'Engenharia', projeto: 'Classificador de documentos técnicos', cat: 'Qualidade e Tomada de Decisão', tangL: 'R$ 18.000', tangPts: 57, intg: 4, imp: 5, alc: 4, pont: '100%', pts: 76 },
          { pos: 3, nome: 'Pedro Melo', setor: 'Atendimento', projeto: 'FAQ automatizada do atendimento', cat: 'Experiência do Cliente', tangL: 'R$ 9.000', tangPts: 29, intg: 3, imp: 3, alc: 4, pont: '100%', pts: 54 },
        ],
      },
    ],
    domains: ['tecnofink.com', 'grupotecnofink.com.br'],
    tools: [
      { id: 'flux', nome: 'Flux', sigla: 'Fx', desc: 'Programa de inovação com IA: inscreva seu pitch, execute com prazo definido e acompanhe o ranking do ciclo em tempo real.', rota: '/flux', perfis: ['user'], ativo: true, fixa: true, ordem: 0 },
      { id: 'gestor', nome: 'Produtividade', sigla: 'Pr', desc: 'Etapas, prazos e quadro de tarefas dos seus projetos. Pitches do Flux entram aqui automaticamente; projetos livres também.', rota: '/tarefas', perfis: ['user'], ativo: true, fixa: true, ordem: 1 },
      { id: 'playbook', nome: 'Marketing', sigla: 'Mk', desc: 'Padrões, guias e materiais de referência do grupo Tecnofink. Ferramenta importada de projeto existente.', rota: '/playbook', perfis: ['user'], ativo: true, fixa: false, importada: true, ordem: 2 },
    ],
    extraProjs: [
      {
        id: 'tp1', nome: 'Auditoria de processos 2026',
        descricao: 'Mapeamento dos processos críticos do grupo e plano de ação por área.',
        uid: 'marcos', criadoEm: s('2026-09-15'), arquivado: false,
        // projeto compartilhado (CRM): papéis por membro
        membrosIds: ['marcos', 'daniel', 'ana'],
        papeis: { marcos: 'admin', daniel: 'editor', ana: 'leitor' },
      },
      {
        id: 'tp2', nome: 'Padronização de planilhas de Operações',
        descricao: 'Modelo único de controle para as planilhas da área.',
        uid: 'ana', criadoEm: s('2026-09-20'), arquivado: false,
        membrosIds: ['ana'], papeis: { ana: 'admin' },
      },
    ],
    tarefas: seedTarefas(),
    access: { ana: { apl: true }, rafael: { apl: true }, julia: { apl: true }, pedro: { apl: true }, carla: { apl: true }, lara: { apl: true }, marcos: { apl: true }, bruno: { apl: true } },
    logs: [
      { ts: logTs('2026-10-01', '08:47'), quem: 'Sistema', acao: 'Alerta de atraso', det: 'Otimização de escala logística — deadline vencido', tipo: 'flux' },
      { ts: logTs('2026-09-29', '09:02'), quem: 'Carla Ferreira', acao: 'Resultado registrado', det: 'Conferência automática de faturas', tipo: 'flux' },
      { ts: logTs('2026-09-26', '16:20'), quem: 'Thomas Weber', acao: 'Notas registradas', det: 'Chatbot interno de atendimento', tipo: 'avaliacao' },
      { ts: logTs('2026-09-13', '11:05'), quem: 'Emilio Duarte', acao: 'Tangível validado', det: 'Geração de propostas técnicas — R$ 22.000', tipo: 'avaliacao' },
      { ts: logTs('2026-07-17', '10:40'), quem: 'Daniel Rocha', acao: 'Tier definido', det: 'Painel comercial em tempo real — Basic', tipo: 'admin' },
      { ts: logTs('2026-07-16', '14:02'), quem: 'Marcos Freitas', acao: 'Tier definido', det: 'Automação de relatório semanal — Enterprise', tipo: 'admin' },
      { ts: logTs('2026-07-01', '09:15'), quem: 'Daniel Rocha', acao: 'Domínio adicionado', det: 'grupotecnofink.com.br', tipo: 'admin' },
      { ts: logTs('2026-07-01', '09:12'), quem: 'Daniel Rocha', acao: 'Ciclo criado', det: 'Ciclo 1', tipo: 'admin' },
    ],
  };
}

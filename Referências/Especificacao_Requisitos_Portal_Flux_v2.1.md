# Especificação de Requisitos — Portal Flux

**Tecnofink · Versão 2.1 · 07/07/2026**
Status: protótipo validado (decisões P10–P16 incorporadas) · Próxima fase: Modelagem e stacks → Construção
Fontes: protótipo "Portal Flux" (Claude Design), Especificação v1.1 e pareceres da validação. A seção 10 lista as mudanças em relação à v1.1; a seção 11 registra as decisões da validação.

## 1. Visão geral

Portal web de uso exclusivo dos colaboradores da Tecnofink e empresas do grupo, funcionando como **hub de ferramentas de IA**. A versão 1 entrega **duas ferramentas nativas**: o **Flux** — programa de inovação com IA em ciclos (pitch, triagem de acesso ao Claude, execução, avaliação por comitê e ranking em tempo real) — e o **Gestor de Tarefas** — etapas, prazos e quadro de tarefas dos projetos, integrado automaticamente aos pitches do Flux e aberto a projetos livres. A v1 também incorpora o **Playbook**, ferramenta importada de projeto existente da Tecnofink. Os melhores projetos do Flux podem virar as próximas ferramentas do hub.

O acesso ao portal é feito exclusivamente com a conta **Google Workspace** corporativa. Toda a aplicação segue o design system Tecnofink, com suporte a **tema claro e escuro**.

## 2. Escopo da versão 1

1. Autenticação via Google Workspace (SSO), restrita a domínios do grupo;
2. Perfil do colaborador (foto e nome sincronizados do Google);
3. Hub com as duas ferramentas nativas, a ferramenta Playbook importada e estrutura administrável para ferramentas futuras;
4. Módulo Flux completo: ciclos, pitch, triagem de acesso (tier, backlog, reprovação), kanban do ciclo, registro de resultado, avaliação do comitê (com aprovação parcial do tangível), cálculo, rankings e histórico;
5. Gestor de Tarefas: projetos do Flux e projetos livres, etapas, tarefas, prioridades, linha do tempo e quadro;
6. Administração em duas áreas (Flux e Hub): painel, usuários, ciclos, triagem, acessos ao Claude, domínios, ferramentas e logs de auditoria;
7. Notificações in-app (toasts) e por e-mail (Google Workspace).

## 3. Atores e perfis de acesso

| Perfil | Quem (inicial) | Permissões |
|---|---|---|
| **Usuário** | Todos os colaboradores | Hub e ferramentas liberadas; inscrever pitch; acompanhar o kanban do ciclo e a ficha de qualquer projeto; registrar resultado; rankings e histórico; Gestor de Tarefas (seus projetos); perfil próprio |
| **Avaliador (Comitê)** | Marcos, Emilio e Thomas | Tudo de Usuário + triagem de acesso dos pitches (liberar Basic/Enterprise, enviar ao backlog ou reprovar); aprovar o tangível real (integral ou parcial); atribuir notas 0–5; desclassificar projetos |
| **Administrador** | Daniel (analista de sistemas) e Marcos | Tudo de Usuário + Admin do Flux (visão geral, usuários e papéis, ciclos, triagem de acesso, acessos ao Claude, logs) e Admin do Hub (domínios liberados, ferramentas) |

Observações: papéis cumulativos, atribuídos por administradores (Marcos acumula os três; Emilio e Thomas não administram o portal). O comitê é fixo. O campo "gestor do projeto" **foi removido** do pitch (mudança M3).

## 4. Requisitos funcionais

### 4.1 Autenticação e acesso

- **RF-01** — Login exclusivamente com **Google Workspace** ("Entrar com Google Workspace"); não há senha própria do portal.
- **RF-02** — Apenas contas cujos domínios estejam na **lista de domínios liberados** (mantida no banco e editável por administradores) conseguem acessar; domínios fora da lista são bloqueados com mensagem orientativa.
- **RF-03** — No primeiro login com domínio autorizado, a conta do colaborador é criada automaticamente com nome, e-mail e foto vindos do Google Workspace ; cargo e empresa do grupo são complementados depois, no Perfil (decisão P11).
- **RF-04** — Contas desativadas não acessam o portal e recebem a mensagem "Esta conta foi desativada. Fale com um administrador do portal."
- **RF-05** — Sessão autenticada segura; ação "Sair" disponível no menu do usuário.

### 4.2 Perfil

- **RF-06** — Foto e nome são sincronizados da conta Google Workspace no login.
- **RF-07** — O perfil permite editar: nome, cargo, empresa do grupo (seleção: Tecnofink LTDA, Tecnofink Engenharia, Grupo Tecnofink Participações), departamento, aniversário (dd/mm, opcional) e apresentação (opcional). O **e-mail não é editável**.
- **RF-08** — O perfil exibe os papéis do colaborador (Usuário, Comitê, Administrador) como selos informativos.

### 4.3 Hub

- **RF-09** — A home do hub exibe saudação com a data e os cards das ferramentas **ativas** cujo perfil de acesso inclua algum papel do colaborador. O card do Flux mostra o ciclo vigente e os dias restantes.
- **RF-10** — Ferramentas nativas da v1: **Flux** e **Gestor de Tarefas**, além do **Playbook** — ferramenta importada de projeto existente, com escopo funcional próprio. Ferramentas futuras são cadastráveis pela administração (RF-57) e abrem pela rota configurada; o hub exibe o aviso "Em breve: os melhores projetos do Flux podem virar as próximas ferramentas deste hub."
- **RF-11** — Tema claro/escuro alternável pelo usuário em qualquer tela, com persistência da preferência.

### 4.4 Flux — Ciclos

- **RF-12** — Existe **um ciclo ativo por vez**, com nome, data de abertura, data-limite de inscrições e data de encerramento. Somente administradores criam, editam e encerram ciclos.
- **RF-13** — A home do Flux exibe o ciclo vigente: datas, duração em meses, dias restantes, percentual decorrido e o aviso "Inscrições abertas até {data-limite}". Sem ciclo ativo, exibe o estado vazio com atalho para o histórico.
- **RF-14** — Indicadores do ciclo na home: projetos inscritos, projetos avaliados, setores participantes e retorno estimado total (projetos não reprovados, padronizado por ciclo).
- **RF-15** — Encerrar o ciclo **congela o ranking** e o arquiva no histórico; o histórico completo fica consultável por todos (somente leitura). A pontuação não acumula entre ciclos.

### 4.5 Flux — Inscrição (Pitch)

- **RF-16** — O botão "Inscrever pitch" fica disponível apenas com **inscrições abertas** (até a data-limite do ciclo).
- **RF-17** — Formulário do pitch: colaborador e setor (do perfil, somente leitura), nome do projeto, categoria (uma das 5 fixas, com descrição em cards), ganhos tangíveis estimados em R$ com periodicidade **"por mês" ou "por ciclo"**, ganhos intangíveis (multi-seleção da taxonomia em 3 grupos), deadline de entrega e justificativa ("por que a IA foi essencial?"). Todos obrigatórios (ao menos 1 intangível). **Não há campo de gestor do projeto.**
- **RF-18** — Valores mensais são convertidos automaticamente e o formulário exibe a conta ao vivo (ex.: "R$ 8.000/mês × 3,5 meses do ciclo = R$ 28.000 por ciclo"). Todos os valores do programa são padronizados por ciclo.
- **RF-19** — O deadline é definido pelo colaborador e deve estar **entre a data atual e o encerramento do ciclo**; o formulário informa que Pontualidade vale 10% da nota.
- **RF-20** — Tela de confirmação com resumo dos dados e o aviso: o pitch **não poderá ser editado** após o envio; poderá ser excluído até o fim das inscrições; o produto final pode diferir do descrito.
- **RF-21** — Ao confirmar, o pitch entra no ciclo com status **Inscrito** e um projeto com o mesmo nome é **criado automaticamente no Gestor de Tarefas** (RF-44).
- **RF-22** — O titular pode **excluir** o próprio pitch enquanto: o ciclo estiver ativo, dentro do prazo de inscrições e **sem resultado registrado**. Se o pitch já tiver tier definido, os administradores são notificados para rever os acessos ao Claude. A exclusão exige confirmação e não pode ser desfeita.
- **RF-23** — Projetos são individuais (um único titular).

### 4.6 Flux — Triagem de acesso ao Claude

- **RF-24** — Todo pitch inscrito entra na fila de **avaliação de acesso**, disponível para o **comitê** (área Comitê → "Acesso dos pitches") e para os **administradores** (Admin do Flux → "Acesso dos pitches"), com os mesmos poderes — vale a primeira decisão registrada (decisão P12).
- **RF-25** — Para cada pitch, o avaliador vê titular, setor, categoria, estimativa por ciclo, deadline e justificativa, e escolhe um desfecho: **Liberar Basic**, **Liberar Enterprise**, **Enviar para o backlog** ou **Reprovar pitch** (os dois últimos com confirmação).
- **RF-26** — O **tier é por pitch** e libera o Claude do colaborador para executar o projeto **neste ciclo, até o encerramento**. Regra do programa: todo mundo começa o ciclo sem acesso — pitch inscrito + tier definido = acesso liberado; **sem pitch, sem acesso**. A concessão e a revogação são **manuais no console do Claude**, com registro no portal (RF-54).
- **RF-27** — **Backlog de Projetos**: o pitch sai do ciclo (perde o tier) e fica guardado para uma próxima rodada; o colaborador pode inscrever um novo pitch enquanto as inscrições estiverem abertas. Quando um novo ciclo abrir as inscrições, o titular pode **reativar** o pitch do backlog (decisão P16): o pitch é reinscrito no ciclo vigente com um novo deadline e passa novamente pela triagem de acesso.
- **RF-28** — **Reprovação na triagem**: o pitch é marcado como Reprovado, não participa do ranking e a decisão fica nos logs de auditoria.

### 4.7 Flux — Kanban do ciclo

- **RF-29** — A home do Flux exibe um **kanban público** com todos os projetos do ciclo (e o backlog), em colunas: **Inscrito · Em desenvolvimento · Aguardando Avaliação · Concluído · Reprovado · Backlog de Projetos**.
- **RF-30** — Os cards **avançam automaticamente** conforme o pitch evolui (inscrição, liberação do acesso, registro de resultado, avaliação do comitê) — ninguém arrasta cards.
- **RF-31** — Cada card mostra categoria, nome, titular, metadados da coluna (ex.: deadline e dias restantes; tangível declarado; pontos quando avaliado) e selos de alerta (ATRASADO, REPROVADO). Os projetos do próprio usuário aparecem destacados e primeiro.
- **RF-32** — Clique no card: projeto **próprio** abre o Gestor de Tarefas; projeto **de terceiros** abre a ficha (RF-33). Cards do backlog não são clicáveis (a reativação pelo titular é oferecida quando um novo ciclo abre — RF-27).
- **RF-33** — **Ficha do projeto** (visível a qualquer usuário): dados do pitch, titular, tier, linha de progresso em 5 passos (Inscrito → Acesso definido → Em execução → Resultado registrado → Avaliado), resultado registrado com anexos e, quando avaliado, a pontuação final com o detalhamento por critério (notas agregadas). Aviso ao titular: notas individuais e identidade dos avaliadores não são exibidas.

### 4.8 Flux — Execução e registro de resultado

- **RF-34** — O titular pode registrar o resultado quando: o ciclo está ativo, o **tier foi definido** e ainda não há resultado registrado.
- **RF-35** — Formulário do resultado: valor tangível realizado (R$ por mês ou por ciclo, com a mesma conversão automática), intangíveis observados (≥ 1), descrição e **anexos de evidência (≥ 1)** — todos obrigatórios. A data do registro é gravada para o cálculo da Pontualidade.
- **RF-36** — Projetos com deadline vencido sem resultado são sinalizados como **Atrasados** (badge no kanban, alerta na ficha e no painel admin). **Não há desclassificação automática**: o comitê decide entre aceitar o registro tardio (Pontualidade 0) ou desclassificar.

### 4.9 Flux — Avaliação do comitê

- **RF-37** — A fila de resultados lista os projetos com resultado registrado e avaliação incompleta, com o andamento das validações e notas (ex.: "2 de 3 avaliadores") e o status das notas do próprio avaliador.
- **RF-38** — Validação do tangível: **cada um dos três membros do comitê** valida o valor realizado — aceitando o valor declarado integralmente ou informando um **valor ajustado** (menor ou igual ao declarado). O valor que entra no cálculo e na normalização é a **média dos três valores validados**, arredondada para o real inteiro (0,5 para cima) — decisão P13. Enquanto os três não validarem, o valor não pontua.
- **RF-39** — Cada membro do comitê atribui notas de **0 a 5** para Retorno Intangível, Impacto e Alcance, com dicas por critério e a **rubrica de referência** (seção 5) exibida na tela. As notas podem ser revistas até o fechamento da avaliação.
- **RF-40** — A tela mostra o andamento dos três avaliadores (ex.: "Marcos ✓ · Emilio — · Thomas —"). Quando os três avaliadores registraram a validação do tangível e as notas, o projeto passa a **Avaliado** e entra/atualiza no ranking imediatamente.
- **RF-41** — A Pontualidade é automática e binária (100% se o resultado foi registrado até o deadline; 0% caso contrário), exibida como selo na avaliação. Em caso de atraso, a tela orienta: aceitar (Pontualidade 0) ou **desclassificar** — ação disponível ao comitê, com confirmação e registro em log.

### 4.10 Flux — Cálculo, rankings e histórico

- **RF-42** — Ranking global e por categoria, **ao vivo**, atualizados a cada avaliação do comitê; a normalização relativa do Tangível pode recalcular retroativamente as notas quando um novo resultado aprovado supera o maior do ciclo (comportamento aceito). Ranking visível a todos, com destaque do top 3 (medalhas), da própria linha e desempate pelo tangível real.
- **RF-43** — Histórico: ciclos encerrados listados com datas e resumo; abrem o ranking **congelado** (somente leitura, com aviso de congelamento).

### 4.11 Gestor de Tarefas

- **RF-44** — "Meus projetos" lista os projetos do usuário com origem **[Flux · ciclo]**, **[Flux · backlog]** ou **[Projeto livre]**, o status do Flux (quando houver), o progresso de tarefas e o acesso ao quadro. Pitches do Flux criam o projeto automaticamente; **projetos livres** são criados pelo usuário informando apenas o nome.
- **RF-45** — Cada projeto tem **etapas** (F0, F1, …) com nome e período (início/fim). Projetos do Flux nascem com a etapa padrão "F0 · Execução do projeto" (da inscrição ao deadline).
- **RF-46** — **Tarefas**: código sequencial (TASK-001…), título, etapa, responsável (o próprio usuário), prazo e prioridade (Alta/Média/Baixa). Status: Não iniciada, Em andamento, Concluída — e **Atrasada**, derivada automaticamente quando o prazo vence sem conclusão.
- **RF-47** — O quadro do projeto exibe: anel de progresso (% concluído), resumo por etapa (com selos de concluída/atrasada), distribuição por status, **linha do tempo** das etapas sobre o período do ciclo com o marcador de "hoje", e o quadro de tarefas com visões **"Por etapa"** e **"Por status"**.
- **RF-48** — O card da tarefa abre um painel de detalhes para mudar o status ou excluir a tarefa; novas tarefas são criadas com título, etapa, prazo e prioridade.
- **RF-49** — Projetos do Flux exibem o atalho "Ver ficha do projeto no Flux" (RF-33). Projetos livres não têm ficha nem participam do ranking.

### 4.12 Notificações

- **RF-50** — Notificações **in-app** (toasts) confirmam as ações relevantes: pitch enviado, tier liberado, envio ao backlog, reprovação, resultado enviado, tangível validado, projeto avaliado com a posição no ranking, ciclo encerrado, conta desativada, entre outras.
- **RF-51** — Notificações por **e-mail** (Google Workspace), lista confirmada (decisão P14): confirmação de inscrição do pitch; decisão da triagem (tier liberado, backlog ou reprovação); lembretes de deadline 7 dias e 1 dia antes; aviso ao comitê de resultado aguardando avaliação; publicação/encerramento do ranking do ciclo; alerta aos administradores quando um pitch com tier definido é excluído.

### 4.13 Administração

- **RF-52** — A administração é dividida em duas áreas de navegação: **Admin do Flux** (Visão geral, Usuários, Ciclos, Acesso dos pitches, Acessos ao Claude, Logs de auditoria) e **Admin do Hub** (Domínios liberados, Ferramentas do hub).
- **RF-53** — **Visão geral**: indicadores com alerta (pitches aguardando acesso, resultados no comitê, projetos atrasados, colaboradores sem projeto), resumo do ciclo vigente e alertas com atalhos de ação.
- **RF-54** — **Acessos ao Claude**: por colaborador ativo — pitch no ciclo, tier vigente (derivado do pitch; Enterprise prevalece sobre Basic), status da aplicação manual (Pendente/Aplicado, com ação "Marcar aplicado") — e o relatório de **colaboradores sem projeto no ciclo** (que seguem sem acesso).
- **RF-55** — **Usuários**: lista com papéis (toggles Comitê/Admin), status e ativar/desativar contas; o administrador não desativa a própria conta. Desativação bloqueia o acesso imediatamente.
- **RF-56** — **Domínios liberados**: adicionar (com validação de formato) e remover domínios autorizados.
- **RF-57** — **Ferramentas do hub**: cadastrar nome, descrição, rota e perfis com acesso (Usuários/Comitê/Admins); ativar/desativar exibição no hub. Flux e Gestor de Tarefas são as ferramentas nativas.
- **RF-58** — **Ciclos**: editar as datas do ciclo vigente; encerrar ciclo (com confirmação) congelando o ranking; criar novo ciclo (nome + três datas); lista de todos os ciclos com status.
- **RF-59** — **Logs de auditoria**: trilha de quem fez o quê e quando, com filtros **Todos / Administração / Avaliação / Flux**, incluindo eventos do sistema (ex.: alerta de atraso). Registram, no mínimo: criação/edição/encerramento de ciclo, domínios, papéis e contas, definição de tier, backlog, reprovações, notas, validações de tangível (integrais e ajustadas), pitches inscritos/excluídos, resultados registrados e aplicação de acessos.

## 5. Regras de negócio — pontuação

| Critério | Peso | Fonte | Cálculo (0–100 pts) |
|---|---|---|---|
| Retorno Tangível | 40% | **Média dos valores validados** pelos 3 membros (integral ou ajustado) | (retorno validado ÷ maior retorno validado do ciclo) × 100 |
| Retorno Intangível | 20% | Notas 0–5 do comitê | média arredondada (inteiro 0–5) × 20 |
| Impacto | 15% | Notas 0–5 do comitê | média arredondada (inteiro 0–5) × 20 |
| Alcance | 15% | Notas 0–5 do comitê | média arredondada (inteiro 0–5) × 20 |
| Pontualidade | 10% | Automática (data do registro × deadline do pitch) | 100 se registrado até o deadline; 0 caso contrário |

**Nota final** = Σ (pontos do critério × peso), exibida como número inteiro, sem casas decimais, seguindo o mesmo arredondamento das médias (0,5 para cima). Desempate no ranking: maior retorno tangível aprovado.

Regras complementares: valores mensais × meses do ciclo (padronização por ciclo); o tangível considerado é a média dos três valores validados (ajustes individuais entram na média), arredondada para o real inteiro; projetos Reprovados e do Backlog não pontuam nem entram na normalização; um projeto só é "Avaliado" com as três validações de tangível + as três notas.

**Rubrica de referência (notas 0–5), exibida na tela de avaliação:**

| Nota | Interpretação |
|---|---|
| 0 | Nenhum ganho intangível identificável |
| 1 | Ganho leve, pontual, difícil de perceber |
| 2 | Melhoria percebida, mas não transformadora |
| 3 | Impacto claro, equipe/cliente nota a diferença |
| 4 | Mudança expressiva de qualidade ou cultura |
| 5 | Transformação visível, referência para a empresa |

Exemplo (projeto com o maior tangível do ciclo): Tangível 100 pts × 40% = 40 · Intangível média 4,0 → nota 4 → 80 pts × 20% = 16 · Impacto média 4,5 → nota 5 → 100 pts × 15% = 15 · Alcance média 4,0 → nota 4 → 80 pts × 15% = 12 · Pontualidade 100 × 10% = 10 → **Nota final = 93**.

## 6. Ciclo de vida do projeto

| Estado | Gatilho | Efeitos visíveis |
|---|---|---|
| Inscrito | Pitch confirmado | Coluna "Inscrito"; aguarda triagem de acesso; exclusão permitida (RF-22) |
| Acesso definido / Em desenvolvimento | Tier Basic/Enterprise liberado na triagem | Coluna "Em desenvolvimento"; contagem regressiva do deadline; registro de resultado liberado |
| Atrasado | Deadline vencido sem resultado | Selo ATRASADO; alertas na ficha e no painel admin; decisão humana (RF-36) |
| Resultado registrado (Em avaliação) | Titular envia resultado + anexos | Coluna "Aguardando Avaliação"; entra na fila do comitê |
| Avaliado (Concluído) | Validações de tangível + notas dos 3 avaliadores | Coluna "Concluído"; pontuação final; entra/atualiza no ranking ao vivo |
| Reprovado | Decisão do comitê (na triagem ou na avaliação) | Coluna "Reprovado"; fora do ranking; registrado em log |
| Backlog | Decisão da triagem | Coluna "Backlog de Projetos"; fora do ciclo; reativável pelo titular no próximo ciclo (RF-27) |
| Congelado | Encerramento do ciclo | Ranking arquivado no histórico, somente leitura |
| Excluído | Titular exclui (RF-22) | Removido do ciclo; admins notificados se já havia tier |

## 7. Requisitos não funcionais

- **Identidade visual** — Design system Tecnofink (Claude Design) em toda a aplicação, com **tema claro e escuro**.
- **Plataforma** — Desktop apenas na v1; versão mobile fora de escopo.
- **Idioma e linguagem** — Português (BR), textos simples para público não técnico.
- **Segurança** — Autenticação delegada ao Google Workspace (SSO); controle de acesso por papéis validado no backend; HTTPS; sem armazenamento de senhas no portal.
- **LGPD** — Dados pessoais mínimos (nome, e-mail e foto vêm do Workspace; aniversário e apresentação são opcionais); aviso de privacidade no primeiro acesso; retificação pelo próprio usuário e exclusão mediante solicitação aos administradores.
- **Disponibilidade e backup** — Rotina de backup de banco e arquivos (detalhada na fase de Modelagem e stacks).

## 8. Diretrizes de infraestrutura

- **Hospedagem**: Firebase com domínio próprio (plano Blaze) — Hosting, **Authentication com provedor Google Workspace** (restrição de domínio), Firestore, Storage (anexos) e Functions (cálculo, notificações, regras).
- **Repositório**: organização corporativa da Tecnofink no GitHub.
- **E-mail transacional**: Google Workspace (avaliar API/extensão dedicada na fase de stacks).

## 9. Fora de escopo da versão 1

- Login por e-mail e senha próprios do portal (fluxo removido em definitivo — decisão P10; as telas órfãs saem do protótipo na construção).
- Versão mobile da interface.
- Integração automática com o console do Claude (concessão e revogação seguem manuais).
- Edição de pitch após o envio; projetos com múltiplos titulares; atribuição de tarefas a terceiros no Gestor de Tarefas.
- Promoção de pitches do backlog pelo comitê — a reativação é feita pelo próprio titular na abertura do novo ciclo (decisão P16).

## 10. Mudanças em relação à v1.1

| # | Mudança | Antes (v1.1) | Agora (v2.0) |
|---|---|---|---|
| M1 | Autenticação | Cadastro com confirmação de e-mail + senha (links de 30 min) | Login exclusivo com Google Workspace; conta criada no primeiro acesso; sem senhas |
| M2 | Telas de senha | A2–A6 (cadastro, verificação, senha, esqueci) | Removidas do fluxo (ver P10) |
| M3 | Gestor do projeto | Campo do pitch (informativo) | Removido |
| M4 | Quem define o acesso ao Claude | Administrador, por projeto; comitê decidia tier por colaborador ao fim do ciclo | **Triagem por pitch** feita pelo comitê e pelos admins; tier vale até o fim do ciclo; "sem pitch, sem acesso"; a decisão de fim de ciclo deixou de existir |
| M5 | Desfechos da triagem | Apenas definição de tier | Basic · Enterprise · **Backlog de Projetos** · **Reprovar** |
| M6 | Validação do tangível | Aprovação do valor declarado | Validação pelos **3 membros** (integral ou valor ajustado); a **média** dos três entra na normalização |
| M7 | Desclassificação | Decisão humana, sem mecanismo definido | Ação explícita do comitê (status Reprovado), na triagem ou na avaliação, com log |
| M8 | Home do Flux | Painel do ciclo + meus projetos | **Kanban público** de todos os projetos do ciclo, com movimentação automática |
| M9 | Transparência | Titular via só a pontuação final | Ficha do projeto visível a todos; pontuação final + notas agregadas por critério |
| M10 | Ferramentas do hub | Apenas Flux | + **Gestor de Tarefas** (etapas, tarefas, linha do tempo, quadro; integração automática com pitches; projetos livres) |
| M11 | Exclusão de pitch | Até o fim das inscrições | + condição "sem resultado registrado" |
| M12 | Navegação admin | Painel único | **Admin do Flux** e **Admin do Hub** |
| M13 | Tema | Claro | Claro e escuro |
| M14 | Ranking | Ordenação pela nota | + desempate pelo tangível, medalhas top 3, destaque da própria linha |
| M15 | Rubrica 0–5 | Não especificada | Documentada e exibida na avaliação (seção 5) |
| M16 | E-mails | 7 templates (incluía verificação e senha) | Lista ajustada (RF-51), sem e-mails de senha; + decisão da triagem |
| M17 | Ferramentas importadas | — | Playbook importado de projeto existente; Gestor de Tarefas alinhado ao portal do CRM |
| M18 | Backlog | Guardado para o futuro | Reativável pelo próprio titular na abertura do novo ciclo |

## 11. Decisões da validação do protótipo

Pareceres registrados em 07/07/2026:

- **P10** — **Decidido: remover.** O fluxo e-mail+senha sai em definitivo; as telas órfãs serão eliminadas na construção. O SSO Google Workspace é o método único de acesso.
- **P11** — **Decidido:** cargo e empresa do grupo ficam para o Perfil, sem passo de boas-vindas (comportamento atual do protótipo).
- **P12** — **Decidido:** comitê e administradores com os mesmos poderes na triagem de acesso; vale a primeira decisão registrada.
- **P13** — **Decidido: sem aprovação por um único membro.** Cada um dos três avaliadores valida o tangível (integral ou ajustado) e a **média** dos três valores entra no cálculo (RF-38). O protótipo será ajustado na construção.
- **P14** — **Decidido:** vale a lista de e-mails da RF-51.
- **P15** — **Decidido:** projetos livres seguem o comportamento do portal de gestor de tarefas do **CRM** (projeto existente). Os dois projetos já criados com o Claude — **Gestor de Tarefas** e **Playbook** — serão importados para dentro do hub.
- **P16** — **Decidido:** o titular de um pitch enviado ao backlog pode **reativá-lo no próximo ciclo** (RF-27): reinscrição no ciclo vigente com novo deadline e nova triagem de acesso.
- **P17** — **Em aberto:** levantar os projetos existentes (gestor de tarefas do CRM e Playbook) na fase de Modelagem, para especificar a importação — rotas, perfis de acesso, modelo de dados e adaptações necessárias.

> Os itens **P13, P15 e P16** alteram ou estendem o protótipo atual; os ajustes serão tratados na construção (ou em uma revisão do protótipo, a critério do time).

## 12. Próximos passos

1. **Modelagem e stacks**: modelo de dados (Firestore), arquitetura Firebase (Auth com Google Workspace), fluxo de e-mails, custos e levantamento dos projetos a importar (P17);
2. **Construção** — incluindo os ajustes das decisões P13, P15 e P16 —, seguida de validação e lançamento.

## Histórico de versões

| Versão | Data | Alterações |
|---|---|---|
| 1.0 | 03/07/2026 | Emissão inicial, com notas do comitê arredondadas para inteiros (0,5 para cima). |
| 1.1 | 03/07/2026 | Decisões P1–P9 validadas. Nota final sem casas decimais (P5); escopo restrito a desktop (P8). |
| 2.0 | 07/07/2026 | Re-baseline a partir do protótipo interativo (Claude Design): SSO Google Workspace, triagem de acesso pelo comitê (tier por pitch, backlog e reprovação), aprovação parcial do tangível, kanban público do ciclo, ficha transparente, Gestor de Tarefas, admin em duas áreas, tema claro/escuro. Mudanças M1–M16; pontos P10–P16 em validação. |
| 2.1 | 07/07/2026 | Decisões P10–P16 incorporadas: SSO definitivo, cargo/empresa no Perfil, triagem compartilhada, tangível pela média das validações dos 3 membros, e-mails confirmados, importação do Gestor de Tarefas (CRM) e do Playbook, reativação de backlog pelo titular. Mudanças M17–M18; novo ponto P17 (levantamento dos projetos a importar). |

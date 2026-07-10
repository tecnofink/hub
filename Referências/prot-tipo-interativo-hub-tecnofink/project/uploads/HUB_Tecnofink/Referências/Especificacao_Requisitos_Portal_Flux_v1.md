# Especificação de Requisitos — Portal Flux

**Tecnofink · Versão 1.1 · 03/07/2026**
Status: requisitos validados · Próxima fase: Modelagem e stacks

---

## 1. Visão geral

Portal web de uso exclusivo dos colaboradores da Tecnofink e empresas do grupo, funcionando como **hub de ferramentas de IA**. A primeira e principal ferramenta é o **Flux** — programa de inovação com inteligência artificial baseado em ciclos: inscrição de projetos (pitch), execução com prazo definido pelo colaborador, avaliação por comitê e ranking por pontuação ponderada. Novas ferramentas, frutos dos próprios projetos do Flux, serão adicionadas ao hub futuramente.

Toda a aplicação segue a identidade visual do design system Tecnofink (mantido no Claude Design).

## 2. Escopo da versão 1

Inclui:

1. Cadastro autônomo com confirmação de e-mail, restrito a domínios do grupo (sem aprovação humana);
2. Perfil do colaborador;
3. Hub com acesso à ferramenta Flux e estrutura para ferramentas futuras;
4. Módulo Flux completo: ciclos, pitch, registro de resultado, avaliação do comitê, cálculo e rankings, controle de tier do Claude;
5. Administração de usuários, papéis, domínios liberados e ciclos;
6. Notificações por e-mail (Google Workspace).

O que fica fora desta versão está descrito na seção 8.

## 3. Atores e perfis de acesso

| Perfil | Quem (inicial) | Permissões |
|---|---|---|
| **Usuário** | Todos os colaboradores | Acessar o hub e as ferramentas liberadas; inscrever pitch; registrar resultado; consultar rankings e histórico; gerenciar o próprio perfil |
| **Avaliador (Comitê)** | Marcos, Emilio e Thomas | Tudo de Usuário + aprovar o retorno tangível real; atribuir notas de Intangível, Impacto e Alcance; definir o tier de Claude de cada colaborador ao fim do ciclo |
| **Administrador** | Daniel (analista de sistemas) e Marcos | Tudo de Usuário + gestão do portal: usuários e papéis, ativação/desativação de contas, domínios liberados, ciclos, ferramentas do hub, definição do limite de Claude por projeto inscrito, registro da aplicação manual dos acessos |

Observações:

- Os papéis são **cumulativos** e atribuídos por administradores. Marcos acumula Administrador + Avaliador; Emilio e Thomas são apenas Avaliadores (sem acesso à administração do portal).
- O comitê é **fixo** (não muda por ciclo).
- **Gestor do projeto**: campo informativo preenchido no pitch; qualquer usuário do portal pode ser indicado (decisão P2).

## 4. Requisitos funcionais

### 4.1 Cadastro e autenticação

- **RF-01** — Auto-cadastro no primeiro acesso com: nome, e-mail corporativo, empresa do grupo e cargo.
- **RF-02** — Apenas e-mails com domínio presente na **lista de domínios liberados**, mantida no banco de dados e editável por administradores. Domínios fora da lista têm o cadastro bloqueado.
- **RF-03** — Confirmação de e-mail obrigatória: o solicitante recebe link de verificação e criação de senha com **expiração em 30 minutos**. Não há aprovação humana no cadastro.
- **RF-04** — "Esqueci minha senha" com link de redefinição, também expirando em 30 minutos.
- **RF-05** — Login com e-mail e senha; sessão autenticada segura.
- **RF-06** — Administradores podem desativar e reativar contas (ex.: desligamento de colaborador). Conta desativada perde o acesso imediatamente.

### 4.2 Perfil

- **RF-07** — Após a criação da conta, a tela de perfil permite complementar: foto de perfil, departamento, apresentação e aniversário (todos opcionais).
- **RF-08** — Dados do cadastro podem ser editados pelo próprio usuário, **exceto o e-mail** (chave de identidade da conta).

### 4.3 Hub

- **RF-09** — A página inicial (hub) exibe as ferramentas disponíveis conforme o perfil do usuário. Na v1, a única ferramenta é o Flux.
- **RF-10** — Estrutura administrável de ferramentas: cadastro de nome, descrição, ícone, rota/URL e perfis com acesso — permitindo adicionar ferramentas futuras com nível de acesso definido caso a caso, sem alterar o código do hub.

### 4.4 Flux — Ciclos

- **RF-11** — Somente administradores criam e configuram ciclos: nome, data de abertura das inscrições, data-limite de inscrição e data de encerramento do ciclo.
- **RF-12** — Existe **um ciclo ativo por vez** (decisão P1).
- **RF-13** — O histórico de ciclos encerrados fica consultável por todos: projetos, pontuações e rankings congelados no encerramento.
- **RF-14** — A pontuação **não acumula** entre ciclos; cada ciclo recomeça do zero.

### 4.5 Flux — Inscrição (Pitch)

- **RF-15** — Formulário de pitch com: nome e setor (preenchidos do perfil), nome do projeto, categoria, gestor do projeto (seleção entre usuários do portal), ganhos tangíveis estimados (R$ por ciclo), ganhos intangíveis (seleção múltipla da taxonomia da apresentação), deadline de entrega — obrigatoriamente dentro das datas do ciclo vigente (decisão P3) — e justificativa (por que a IA foi essencial).
- **RF-16** — Categorias **fixas** (5): Produtividade e Eficiência · Qualidade e Tomada de Decisão · Experiência do Cliente · Inovação e Competitividade · Redução de Custos.
- **RF-17** — Todos os valores tangíveis são padronizados **por ciclo**. O formulário torna isso explícito e converte valores mensais automaticamente (valor mensal × meses do ciclo — decisão P6).
- **RF-18** — Tela de confirmação antes do envio, avisando que **o pitch não poderá ser editado** após enviado — sem impedir que o produto final seja um pouco diferente do descrito.
- **RF-19** — Pitch enviado não é editável.
- **RF-20** — O titular pode **excluir** o próprio pitch até a data-limite de inscrição. Se o pitch excluído já tiver passado pela avaliação de acesso (RF-21), todos os administradores são notificados para rever os acessos ao Claude.
- **RF-21** — Todo pitch inscrito passa pela **avaliação do administrador**, que define o limite/tier de Claude que o projeto receberá. A concessão do acesso é feita manualmente no console do Claude (fora do portal) e o registro é mantido no portal.
- **RF-22** — Projetos são **individuais**: um único titular, sem colaboradores registrados.

### 4.6 Flux — Execução e registro de resultado

- **RF-23** — Ao concluir o projeto, o titular registra o resultado real: valor tangível realizado (R$ por ciclo), ganhos intangíveis observados, descrição do resultado e **anexos de evidência** (planilhas, imagens, documentos).
- **RF-24** — O valor tangível declarado só entra no cálculo da pontuação após **aprovação do comitê** (RF-26).
- **RF-25** — Projetos com deadline vencido sem resultado registrado são **sinalizados** como pendentes/atrasados. **Não há desclassificação automática** — a decisão (desclassificar ou aceitar registro tardio com Pontualidade 0) é humana, do comitê/administração (decisão P9).

### 4.7 Flux — Avaliação

- **RF-26** — O comitê **aprova o valor tangível real** informado pelo titular; enquanto não aprovado, o valor não entra no cálculo nem na normalização do ciclo.
- **RF-27** — Cada membro do comitê atribui notas de **0 a 5** para Intangível, Impacto e Alcance de cada projeto concluído.
- **RF-28** — A nota de cada critério é a **média das notas dos membros do comitê, arredondada para o número inteiro mais próximo** — frações de 0,5 arredondam para cima (ex.: média 4,5 → nota 5; média 4,33 → nota 4). A nota de cada critério é sempre um inteiro de 0 a 5.
- **RF-29** — Pontualidade é calculada automaticamente e é **binária**: 100% se o resultado foi registrado até o deadline do pitch; 0% caso contrário.
- **RF-30** — O titular vê **apenas a pontuação final**; notas individuais e identidade dos avaliadores não são exibidas.

### 4.8 Flux — Cálculo e ranking

- **RF-31** — A pontuação final segue as regras de negócio da seção 5.
- **RF-32** — Rankings **global e por categoria**, atualizados em **tempo real** durante o ciclo. Como o Tangível usa normalização relativa, um novo resultado aprovado que supere o maior retorno do ciclo **recalcula retroativamente** a nota de todos os projetos — comportamento aceito por definição.
- **RF-33** — Os rankings são visíveis a **todos os usuários** do portal, inclusive quem não inscreveu projeto.
- **RF-34** — No encerramento do ciclo, o ranking é congelado e arquivado no histórico (RF-13).

### 4.9 Flux — Controle de acesso ao Claude

- **RF-35** — O portal mantém, por colaborador: tier atual (Basic / Enterprise / sem acesso), decisão de tier para o próximo ciclo (definida pelo **comitê** ao fim de cada ciclo) e status de aplicação (pendente/aplicado). A aplicação é sempre **manual**, feita pelo administrador no console do Claude e registrada no portal.
- **RF-36** — Relatório/alerta de colaboradores **sem projeto inscrito** no ciclo vigente (regra do programa: perdem o acesso no ciclo seguinte). A revogação também é manual, com registro no portal.

### 4.10 Notificações por e-mail

- **RF-37** — O sistema envia, via Google Workspace:
  1. Verificação de e-mail no cadastro (link de 30 min);
  2. Criação/redefinição de senha (link de 30 min);
  3. Confirmação de inscrição de pitch;
  4. Lembretes de deadline do projeto, enviados 7 dias e 1 dia antes da data (decisão P4);
  5. Solicitação de avaliação pendente ao comitê (quando um resultado é registrado);
  6. Publicação/encerramento do ranking do ciclo;
  7. Alerta aos administradores quando um pitch já avaliado é excluído (RF-20).

### 4.11 Administração

- **RF-38** — Painel administrativo para: usuários e papéis, ativação/desativação de contas, domínios liberados, ciclos, ferramentas do hub e registro de tiers do Claude.
- **RF-39** — Registro de auditoria (log) das ações administrativas e de avaliação: quem fez o quê e quando (decisão P7).

## 5. Regras de negócio — pontuação

| Critério | Peso | Fonte | Cálculo (0–100 pts) |
|---|---|---|---|
| Retorno Tangível | 40% | Valor real aprovado pelo comitê | (retorno do projeto ÷ maior retorno aprovado do ciclo) × 100 |
| Retorno Intangível | 20% | Notas 0–5 do comitê | média arredondada (inteiro 0–5) × 20 |
| Impacto | 15% | Notas 0–5 do comitê | média arredondada (inteiro 0–5) × 20 |
| Alcance | 15% | Notas 0–5 do comitê | média arredondada (inteiro 0–5) × 20 |
| Pontualidade | 10% | Automática | 100 se entregue até o deadline; 0 caso contrário |

**Nota final** = Σ (pontos do critério × peso), exibida como número inteiro, sem casas decimais, seguindo o mesmo arredondamento das médias — 0,5 para cima (decisão P5).

Exemplo aplicando as regras oficiais (projeto com o maior tangível do ciclo):

- Tangível: 100 pts × 40% = 40,0
- Intangível: média 4,0 → nota 4 → 80 pts × 20% = 16,0
- Impacto: média 4,5 → nota 5 → 100 pts × 15% = 15,0
- Alcance: média 4,0 → nota 4 → 80 pts × 15% = 12,0
- Pontualidade: 100 pts × 10% = 10,0
- **Nota final = 93**

*Observação: com o arredondamento para inteiros, o exemplo confere exatamente com o projeto vencedor da apresentação (93 pts) — cálculo oficial e material de divulgação alinhados.*

## 6. Requisitos não funcionais

- **Identidade visual** — Design system Tecnofink (Claude Design) aplicado a todas as telas do portal e do Flux.
- **Idioma e linguagem** — Português (BR), com textos simples e acessíveis ao público não técnico, no mesmo espírito da Política de Uso de IA.
- **Plataforma** — Interface otimizada para uso em desktop na v1; versão mobile fora de escopo (decisão P8).
- **Segurança** — Autenticação gerenciada (Firebase Authentication); links de verificação e senha com expiração de 30 minutos; controle de acesso por papéis (seção 3) validado no backend; tráfego exclusivamente HTTPS; senhas nunca armazenadas em texto claro.
- **LGPD** — Aviso de privacidade no cadastro informando finalidade dos dados; campos pessoais do perfil (foto, aniversário, apresentação) opcionais; retificação pelo próprio usuário e exclusão de dados mediante solicitação aos administradores; minimização de dados coletados.
- **Disponibilidade e backup** — Rotina de backup de banco e arquivos, a detalhar na fase de Modelagem e stacks.

## 7. Diretrizes de infraestrutura (entrada para a fase de Modelagem e stacks)

- **Hospedagem**: Firebase com domínio próprio, em plano compatível com as necessidades (armazenamento de arquivos, backend e domínio customizado apontam para o plano Blaze — validar na próxima fase).
- **Serviços previstos**: Firebase Hosting, Authentication, banco de dados (Firestore), Storage (anexos de evidência) e Functions (backend: cálculo de pontuação, notificações, regras de acesso).
- **Repositório**: organização corporativa da Tecnofink no GitHub para manutenção do código.
- **E-mail transacional**: Google Workspace — na fase de stacks, avaliar envio via API/extensão dedicada para garantir confiabilidade e respeitar limites de envio.

## 8. Fora de escopo da versão 1

- Ferramentas adicionais no hub (a estrutura de cadastro fica pronta, mas nenhuma ferramenta além do Flux é entregue).
- Integração automática com o console do Claude — concessão e revogação de acessos permanecem manuais.
- Edição de pitch após o envio e projetos com múltiplos titulares.
- Versão mobile da interface — a v1 é otimizada para desktop (decisão P8).
- Login social/SSO (ex.: entrar com conta Google Workspace) — candidato natural a evolução futura, dado o domínio corporativo.

## 9. Decisões de detalhe validadas

Pontos de detalhe levantados durante a especificação e validados em 03/07/2026:

- **P1** — Existe apenas um ciclo ativo por vez.
- **P2** — "Gestor do projeto" é campo informativo na v1: não recebe permissões nem notificações específicas.
- **P3** — O deadline definido no pitch deve estar dentro das datas do ciclo vigente.
- **P4** — Lembretes de deadline enviados 7 dias e 1 dia antes da data.
- **P5** — Nota final exibida sem casas decimais (número inteiro; arredondamento padrão, 0,5 para cima).
- **P6** — Valores mensais convertidos automaticamente no formulário (valor mensal × meses do ciclo).
- **P7** — Logs de auditoria administrativos incluídos na v1.
- **P8** — Interface apenas para desktop na v1; versão mobile fora de escopo.
- **P9** — Projeto sem resultado registrado ao fim do ciclo fica fora do ranking até decisão do comitê.

## 10. Próximos passos

1. **Modelagem e stacks**: modelo de dados (Firestore), arquitetura Firebase, fluxo de e-mails e estimativa de custos do plano;
2. **Prototipagem**: protótipo interativo do portal com o design system Tecnofink (Claude Design);
3. **Validação do protótipo**, seguida de construção, validação e lançamento.

## Histórico de versões

| Versão | Data | Alterações |
|---|---|---|
| 1.0 | 03/07/2026 | Emissão inicial, com notas do comitê arredondadas para inteiros (0,5 para cima). |
| 1.1 | 03/07/2026 | Decisões P1–P9 validadas. Nota final exibida sem casas decimais (P5); escopo da v1 restrito a desktop, com versão mobile fora de escopo (P8). |

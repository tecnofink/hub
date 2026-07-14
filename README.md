# Portal Flux — HUB Tecnofink

> Portal web interno do grupo Tecnofink que reúne, num só lugar, as **ferramentas de trabalho com Inteligência Artificial** dos colaboradores. Está em produção em **https://tecnofink-hub.web.app** e o acesso é exclusivo para contas Google Workspace dos domínios da empresa.

Esta documentação é escrita para quem **nunca viu o projeto**. Ela explica o que o sistema faz, com quais tecnologias foi construído, como os dados são guardados e protegidos, quanto custa e como o código está organizado — em linguagem simples, com os termos técnicos explicados no caminho.

---

## 1. O que é o projeto

Imagine uma "porta de entrada" única para os colaboradores da Tecnofink. Ao entrar (com o e-mail corporativo do Google), a pessoa vê um **painel com as ferramentas de IA da empresa**. Hoje são três:

| Ferramenta | Para que serve |
|---|---|
| **Flux** | Programa de inovação com IA: o colaborador inscreve um "pitch" (uma ideia de projeto usando IA), executa dentro de um prazo, registra o resultado, e um comitê avalia. Há um **ranking** por pontuação. É o Flux que decide quem ganha acesso ao Claude (a IA) e em qual nível. |
| **Produtividade** | Gestor de tarefas e projetos: quadro estilo *kanban*, etapas, prazos, responsáveis, comentários e anexos. Projetos podem ser individuais ou compartilhados com a equipe (com papéis: administrador, editor, leitor). |
| **Marketing** | Manual vivo de feiras e eventos: catálogos, brindes, checklist de cada feira, captação de leads, planejamento de stands. Substitui uma planilha/sistema antigo. |

Em resumo: **o portal não é a IA em si — ele organiza o acesso às ferramentas de IA e o trabalho ao redor delas.**

---

## 2. Tecnologias e serviços (as "stacks")

O sistema tem duas metades: o que roda **no navegador do usuário** (o *frontend*) e o que roda **nos servidores do Google** (o *backend*).

### Frontend (o que o usuário vê e usa)
- **Linguagem: TypeScript** — é o JavaScript (a linguagem dos sites) com "tipos", ou seja, com verificação automática de erros antes de o código rodar. Isso evita muitos bugs.
- **React** — biblioteca que monta a interface em "componentes" reutilizáveis (um botão, um card, uma tela).
- **Vite** — ferramenta que empacota o código para o navegador, de forma otimizada.
- **React Router** — controla a navegação entre telas (as URLs `/flux`, `/tarefas`, etc.) sem recarregar a página.
- **Design system próprio** (arquivo `src/styles/ds.css`) — o conjunto de cores, fontes e espaçamentos da identidade Tecnofink, com **tema claro e escuro**.

### Backend (Firebase — a plataforma de nuvem do Google)
Não há servidor próprio para manter; usamos serviços gerenciados do **Firebase/Google Cloud**:

| Serviço | O que faz aqui |
|---|---|
| **Hosting** | Hospeda e serve o site (os arquivos do frontend). |
| **Authentication** | Faz o login com conta Google Workspace, restrito aos domínios da empresa. |
| **Firestore** | O **banco de dados** (guarda usuários, projetos, tarefas, conteúdo do Marketing…). |
| **Storage** | Guarda os **arquivos** (anexos de tarefas, planilhas e documentos do Marketing). |
| **Cloud Functions** | Pequenos programas que rodam no servidor em reação a eventos — ex.: enviar e-mail quando um pitch é inscrito, ou lembrar de um prazo. |

Tudo hospedado na região **`southamerica-east1`** (São Paulo), para baixa latência no Brasil.

---

## 3. O banco de dados (Firestore)

O Firestore é um banco **NoSQL do tipo "documental"**. Traduzindo:
- Em vez de tabelas com linhas e colunas (como uma planilha ou um banco SQL), os dados são guardados como **documentos** (parecidos com fichas em formato JSON) organizados em **coleções** (pastas de fichas).
- Ex.: a coleção `users` guarda uma ficha por colaborador; `projects` guarda uma ficha por pitch do Flux; `tarefas` guarda o quadro de cada projeto.

Principais coleções:

| Coleção | Guarda |
|---|---|
| `users` | perfil e papéis de cada colaborador |
| `config/portal` | domínios de e-mail autorizados a entrar |
| `cycles` | os ciclos do Flux (datas, ranking congelado) |
| `projects` | os pitches do Flux |
| `tarefas` | os quadros de tarefas (etapas + tarefas) de cada projeto |
| `extraProjs` | os projetos livres da Produtividade (membros e papéis) |
| `playbook/*` e `playbookFeira/*` | o conteúdo do Marketing |
| `logs` | trilha de auditoria de ações administrativas |

Uma característica importante: o Firestore é **em tempo real**. Quando um dado muda no servidor, todas as telas abertas que o observam se atualizam sozinhas, na hora — sem a pessoa apertar "atualizar".

---

## 4. Segurança

A regra de ouro: **a segurança é imposta no servidor, não na tela.** Esconder um botão não protege nada; o que protege são as **regras do Firestore e do Storage** (arquivos `firestore.rules` e `storage.rules`), que o Google avalia a cada leitura/escrita.

O que está garantido:
- **Só entra quem é da empresa** — login apenas com Google Workspace dos domínios autorizados; a conta é criada no primeiro acesso e uma conta desativada perde o acesso imediatamente.
- **Papéis por área** (cada ferramenta cuida do seu acesso):
  - `hubAdmin` — administra o portal (contas, domínios, ferramentas);
  - `fluxAdmin` — administra o Flux (ciclos, triagem, papéis do comitê); **não** consegue se auto-promover a admin do portal;
  - `avaliador` — membro do comitê do Flux;
  - no Marketing: **editor / observador / leitor** (o leitor não vê seções sensíveis como a Página da Feira);
  - na Produtividade: **admin / editor / leitor** por projeto.
- **Cada um só mexe no que pode** — um avaliador só grava a própria nota; um usuário comum não define acesso ao Claude nem lê logs; ninguém "sequestra" o quadro de outro projeto; arquivos só são lidos/apagados por quem participa.
- **Dados sensíveis restritos** — credenciais e leads (PII) do Marketing só são visíveis a editores/observadores.

> Todas essas regras foram **testadas automaticamente** (27 verificações no emulador) antes de irem ao ar.

---

## 5. Backup e proteção dos dados

Código tem histórico (Git) e pode ser revertido; **dados apagados, não** — por isso há uma política de backup em camadas, cada uma cobrindo o que a outra não pega:

| Proteção | O que faz |
|---|---|
| **PITR** (recuperação para um instante) | permite voltar o banco a **qualquer minuto dos últimos 7 dias** — o "desfazer" para erros recentes |
| **Backup diário** | uma cópia por dia, guardada por **14 dias** |
| **Backup semanal** | uma cópia por semana, guardada por **8 semanas** (~2 meses de histórico) |
| **Proteção contra exclusão** | impede que o banco inteiro seja apagado por engano |
| **Versionamento do Storage** | guarda versões antigas de arquivos por **30 dias** (recupera arquivo sobrescrito/apagado) |

Detalhe importante: restaurar no Firestore **cria um banco novo** a partir do backup (não sobrescreve o de produção) — a recuperação é feita com calma, comparando e copiando o necessário.

---

## 6. Custos

Separam-se dois valores muito diferentes:

- **Infraestrutura do portal (Firebase/Google Cloud):** para o porte atual (dezenas de usuários internos), fica **dentro da faixa gratuita** — estimativa de **US$ 0 a ~2/mês**, e o pouco que aparece vem de detalhes técnicos (armazenamento das imagens das Cloud Functions), não do uso do portal. Há um **alerta de orçamento** configurado (R$ 50/mês, avisos em 50/90/100%) que notifica por e-mail se algo fugir do previsto — sem bloquear nada.
- **O custo que realmente pesa:** o **acesso ao Claude** que o Flux concede aos colaboradores (níveis Basic/Enterprise). Esse é o gasto de negócio, pago à Anthropic, **fora da conta do Firebase**. O portal em si custa uma fração ínfima disso.

---

## 7. Conceitos de programação usados (didático)

Alguns conceitos-chave que aparecem no código, explicados de forma simples:

- **Componentes e estado (React):** a tela é montada com "peças" (componentes). "Estado" é a memória de cada peça (ex.: se um modal está aberto). Quando o estado muda, o React redesenha só o que precisa.
- **Estado global (Context/Store):** dados usados em várias telas (usuário logado, projetos, ciclo atual) ficam num "armazém central" (`src/store/AppStore.tsx`), acessível por qualquer tela.
- **Tempo real (listeners `onSnapshot`):** em vez de "perguntar" ao banco de tempos em tempos, a tela **assina** os dados e o banco **avisa** quando muda. É o que faz o kanban e o ranking se atualizarem sozinhos.
- **Transações:** ao mover/editar tarefas, o sistema usa uma "transação" — ele relê o dado mais recente do servidor e só então grava, com nova tentativa automática em caso de conflito. Isso impede que dois usuários editando ao mesmo tempo **apaguem o trabalho um do outro**.
- **Regras de acesso declarativas:** a segurança é escrita como regras que o servidor avalia (quem pode ler/escrever o quê), separadas da lógica da tela.
- **Divisão de código por rota (*code-splitting*):** o site não baixa tudo de uma vez; cada tela é baixada só quando aberta, deixando o carregamento inicial leve.
- **Acessibilidade:** diálogos fecham com a tecla Esc e prendem o foco; ações são botões navegáveis por teclado; textos pequenos têm contraste adequado (padrão WCAG).
- **Tokens de design e temas:** cores/espaçamentos são "variáveis" de CSS, o que permite o tema claro/escuro trocar tudo de uma vez.

---

## 8. Como o código está organizado

```
src/
  main.tsx            ponto de entrada do app
  App.tsx             mapa de rotas (/flux, /tarefas, /playbook, /admin…)
  lib/                "biblioteca" — funções puras e configuração
    firebase.ts       conexão com o Firebase
    types.ts          formatos dos dados (tipos)
    scoring.ts        regras de pontuação do ranking do Flux
    dates.ts, format.ts, roles.ts, faseFlux.ts
  store/AppStore.tsx  estado global em tempo real + ações (o "cérebro" do app)
  components/         peças reutilizáveis (Shell/cabeçalho, Modal, Avatar, botões…)
  pages/              as telas, agrupadas por ferramenta:
    flux/             Flux (kanban, inscrição, ranking, comitê…)
    gestor/           Produtividade (projetos, quadro de tarefas)
    playbook/         Marketing (seções de feiras e eventos)
    admin/            administração do hub e do Flux
    comite/           avaliação do comitê
  styles/             design system (ds.css) e estilos do app (app.css)

functions/            Cloud Functions (e-mails, lembretes, encerrar ciclo…)
firestore.rules       regras de acesso do banco (segurança no servidor)
storage.rules         regras de acesso dos arquivos
scripts/              utilitários (migrações, emuladores, bootstrap)
```

As **Cloud Functions** (em `functions/`, região `southamerica-east1`) rodam em reação a eventos do banco — por exemplo: enviar e-mail ao inscrever um pitch, avisar o comitê quando um resultado é registrado, lembrar de prazos, e encerrar um ciclo congelando o ranking calculado no servidor.

---

## 9. Rodando o projeto

### Localmente (para desenvolver, sem tocar em produção)
Requisitos: **Node 20+** e **Java 11+** (ou um JRE portátil em `.tools/jre` — o script detecta).

```bash
npm install && npm --prefix functions install
npm run emuladores    # sobe cópias locais do Firebase (Auth, Firestore, Storage, Functions)
npm run seed          # popula com dados de demonstração (contas com senha demo1234)
npm run dev           # abre em http://localhost:5173, 100% offline
```

### Publicando em produção
O deploy é feito com a CLI do Firebase:
```bash
npm run build                                                   # gera a versão otimizada
npx firebase deploy --only hosting --project portal-flux-tecnofink
# regras: --only firestore:rules,storage   ·   funções: --only functions
```
O site fica em **https://tecnofink-hub.web.app**.

---

## 10. Tecnologias em uma linha

**TypeScript · React 18 · Vite · React Router** no frontend; **Firebase** (Hosting, Authentication, Firestore, Storage, Cloud Functions em Node 20) no backend; banco **Firestore** (NoSQL, tempo real); design system próprio com tema claro/escuro; **responsivo** para desktop e celular.

---

*Documentação mantida junto ao código. Dúvidas: contato de suporte no rodapé do próprio portal.*

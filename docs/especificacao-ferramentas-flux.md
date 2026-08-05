# Especificação técnica — ferramentas do Flux

**Anexo obrigatório aos prompts de construção de protótipos e aplicações do Grupo Tecnofink.**
Toda ferramenta nascida de um pitch do Flux segue esta especificação: mesma identidade visual, mesma stack, mesmo modelo de acesso. Cole este documento junto do seu pedido ao assistente de IA.

> Referência viva: o **Portal Flux** (repositório `tecnofink/hub`) já implementa tudo o que está aqui. Em caso de dúvida, olhe como o hub faz.

---

## 1. Instrução para a IA (cole no início do prompt)

> Construa a ferramenta seguindo a **Especificação técnica das ferramentas do Flux — Tecnofink**, anexa. Não escolha outra stack, outra paleta ou outro modelo de autenticação. Se algum requisito do meu pedido conflitar com a especificação, aponte o conflito antes de codificar. Comente o código em português do Brasil, explicando **por que** (não o que) quando a decisão não for óbvia.

---

## 2. Stack obrigatória

| Camada | Tecnologia | Observação |
|---|---|---|
| Linguagem | **TypeScript** (strict) | Sem `any` implícito; sem JavaScript solto |
| UI | **React 18** + **Vite 5** | Componentes funcionais e hooks; sem class components |
| Rotas | **react-router-dom v6** | Rotas lazy (`React.lazy` + `Suspense`) |
| Autenticação | **Firebase Auth** — Google Workspace | Provedor Google, restrito ao domínio (§4) |
| Banco | **Cloud Firestore** (nativo) | Região `southamerica-east1` |
| Arquivos | **Firebase Storage** | Mesma região |
| Backend | **Cloud Functions v2** (Node 22) | Só quando precisar de servidor (§6) |
| Hospedagem | **Firebase Hosting** | SPA com rewrite para `index.html` |
| Estado | Context API + hooks | Sem Redux/Zustand/MobX — o hub usa um `AppStore` com Context |
| Estilo | **CSS com tokens** (`--tf-*`) | Sem Tailwind, sem styled-components, sem Material UI |

**Proibido sem autorização**: outra nuvem (AWS/Supabase/Vercel Functions), outro banco (Postgres/Mongo), bibliotecas de UI prontas, autenticação por e-mail/senha ou por link mágico.

---

## 3. Identidade visual

### 3.1 Tokens (copie o bloco para o seu `ds.css`)

```css
:root {
  /* superfícies */
  --tf-bg: #F8F9FC; --tf-bg-pure: #FFFFFF; --tf-bg-2: #F1F2F7; --tf-bg-3: #E7E8EF;
  /* linhas */
  --tf-line: #E5E5EA; --tf-line-2: #D4D4DA;
  /* texto */
  --tf-ink: #18182A; --tf-ink-2: #3C3C4A; --tf-ink-3: #5C5C68;
  /* marca — navy Tecnofink */
  --tf-accent: #0C0059; --tf-accent-2: #1F1675; --tf-accent-deep: #08003E;
  --tf-accent-soft: rgba(12,0,89,.06); --tf-accent-glow: rgba(12,0,89,.12);
  /* status */
  --tf-warn: #E85D2E;   /* laranja — atenção / em andamento */
  --tf-live: #2DBA70;   /* verde — ativo / concluído */
  --tf-crit: #D62B2B;   /* vermelho — erro / crítico */
  /* raios e sombras */
  --tf-radius-sm: 6px; --tf-radius: 10px; --tf-radius-lg: 16px; --tf-radius-pill: 999px;
  --tf-shadow: 0 1px 2px rgba(12,0,89,.04);
  --tf-shadow-lg: 0 30px 80px -20px rgba(12,0,89,.18);
  /* fontes */
  --tf-font-display: 'Bricolage Grotesque', sans-serif;
  --tf-font-body: 'Manrope', sans-serif;
  --tf-font-mono: 'JetBrains Mono', monospace;
}
```

Fontes (Google Fonts): **Bricolage Grotesque** (títulos), **Manrope** (corpo), **JetBrains Mono** (rótulos, números, etiquetas).

### 3.2 Tema claro e escuro
Obrigatórios os dois. Os tokens são redefinidos em `[data-theme="dark"]`; **nunca** escreva cor fixa em componente — sempre `var(--tf-*)`. O botão de tema fica no cabeçalho e a escolha persiste em `localStorage`.

### 3.3 Regras visuais
- **Etiquetas em mono**: rótulos de seção em `--tf-font-mono`, caixa alta, ~0.6rem, entre colchetes — `[ ACESSO AO CLAUDE ]`.
- **Cards**: fundo `--tf-bg-pure`, borda `1px solid var(--tf-line)`, raio `--tf-radius-lg`, sombra `--tf-shadow`.
- **Botões**: `tf-btn` + variante (`tf-btn-accent` primário, `tf-btn-primary`, `tf-btn-ghost` secundário, `tf-btn-danger` destrutivo).
- **Foco visível sempre**: classe `foco-tf` (outline de 2px no accent) em todo elemento interativo.
- **Cor de status ≠ cor de marca**: verde/laranja/vermelho comunicam estado, nunca decoram.
- Idioma: **português do Brasil** em toda a interface, incluindo mensagens de erro.

---

## 4. Autenticação e controle de acesso

### 4.1 Login
Exclusivamente **Google Workspace** (`signInWithPopup` + `GoogleAuthProvider`), com dica de domínio:

```ts
googleProvider.setCustomParameters({ hd: 'tecnofink.com', prompt: 'select_account' });
```

O parâmetro `hd` é apenas conveniência visual. **A barreira real é a regra do Firestore** — qualquer conta Google consegue um token; nunca confie em `request.auth != null`.

### 4.2 Domínios autorizados
Lista em `config/portal.domains` (ex.: `tecnofink.com`, `grupotecnofink.com.br`). A criação do usuário só é permitida se o domínio do e-mail estiver na lista.

### 4.3 Papéis
Documento `users/{uid}` com `roles: string[]` **cumulativos** e `ativo: boolean`. Modelo do hub:

| Papel | Significado |
|---|---|
| `user` | Colaborador — acesso básico à ferramenta |
| `avaliador` | Perfil de análise/aprovação (no Flux: comitê) |
| `fluxAdmin` | Administra a ferramenta (regras de negócio, conteúdo) |
| `hubAdmin` | Administra o portal (contas, domínios, ferramentas) |

Adapte os nomes ao domínio da sua ferramenta, mas **mantenha o padrão**: papéis cumulativos em array + flag `ativo` + verificação no servidor. Contas desativadas perdem acesso **imediatamente** (as regras derrubam as assinaturas em tempo real).

### 4.4 Matriz de permissões
Toda ferramenta entrega uma **matriz papel × ação** (quem lê, quem escreve, quem administra) antes de codificar as regras. Serve de contrato e de roteiro de teste.

---

## 5. Firestore — modelagem e regras

### 5.1 Princípios
1. **As regras são a fronteira de segurança** — o repositório pode ser público e o cliente é hostil. Esconder um botão não é controle de acesso.
2. **Valide forma, não só permissão**: em todo `create`/`update` cheque `keys().hasOnly([...])`, tipo (`is string`, `is number`, `is bool`) e tamanho (`.size() <= N`). Campo sem limite vira payload gigante distribuído a todos os clientes.
3. **`affectedKeys().hasOnly([...])`** em updates parciais — cada papel só toca nos campos que lhe cabem.
4. **Nunca confie em campo de identidade vindo do cliente**: `autorId`/`quemUid` têm de ser `== request.auth.uid`.
5. **Transação para decisão única** (`runTransaction`): leia o estado atual e recuse se já foi decidido — evita que duas telas sobrescrevam uma à outra.

### 5.2 Helpers padrão

```js
function signedIn()  { return request.auth != null; }
function meDoc()     { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
function isActive()  { return signedIn()
  && exists(/databases/$(database)/documents/users/$(request.auth.uid))
  && meDoc().ativo == true; }
function hasRole(r)  { return isActive() && r in meDoc().roles; }
function emailDomain(){ return request.auth.token.email.split('@')[1]; }
```

### 5.3 Storage
Mesmas regras de papel, cruzando com o Firestore (`firestore.get(...)`). Teto de tamanho obrigatório (padrão: **20 MB**). **Atenção**: o cross-service exige o papel `roles/firebaserules.firestoreServiceAgent` no agente `service-*@gcp-sa-firebasestorage` — sem ele **todo** upload é negado.

### 5.4 Índices
Toda consulta composta ou `collectionGroup` precisa de índice declarado em `firestore.indexes.json`. Sem isso a consulta falha só em produção.

---

## 6. Cloud Functions (quando usar)

Use **apenas** para o que o cliente não pode fazer com segurança:
- e-mail transacional; agregações/rankings congelados; cascatas de exclusão; rotinas agendadas (retenção, lembretes); ações administrativas sensíveis.

Padrões obrigatórios:
- **Gatilho, não HTTP público** (a política da organização bloqueia invocação pública). Ação administrativa: o app grava um documento em `comandos/` e a Function o processa.
- **Idempotência**: a entrega é *at-least-once*. Reivindique o comando numa transação lendo o documento **atual** (o snapshot do evento é imutável e nunca reflete um reprocessamento).
- **Segredos só no Secret Manager** (`firebase functions:secrets:set`), **nunca** em `.env` versionado.
- **Nada de retorno silencioso**: todo caminho que desiste registra `logger.warn` com o motivo.
- **Sanitize o texto do usuário antes do e-mail** (remova quebras de linha, neutralize URLs) — evita phishing com nome/link forjado.

---

## 7. Qualidade e operação

- **Auditoria**: coleção `logs` com `quemUid == request.auth.uid` (autoria não-forjável), ação, detalhe e `at == request.time`.
- **LGPD**: inventário dos dados pessoais + retenção automática + rotina de anonimização de desligado. Documente em `docs/lgpd.md`.
- **Backup**: PITR de 7 dias + backup diário/semanal, com teste de restauração trimestral.
- **Hosting**: `index.html` e rotas com `no-cache`; assets com hash em `immutable`. Sempre com `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e CSP `frame-ancestors`.
- **Acessibilidade**: contraste AA, foco de teclado visível, `aria-label` em botão-ícone, modal com `role="dialog"` + `aria-modal` + armadilha de foco + Escape.
- **Responsivo**: funciona a partir de **375 px**; conteúdo largo (tabelas, quadros) rola no próprio contêiner.

---

## 8. Estrutura de pastas (modelo do hub)

```
src/
  components/     # primitivas compartilhadas (Modal, Avatar, Badge, Pill…)
  lib/            # firebase.ts, types.ts, roles.ts, format.ts, dates.ts
  pages/<área>/   # telas por área, com rotas lazy
  store/          # AppStore (Context) — dados/ações + UI transitória separados
  styles/         # ds.css (tokens) + app.css
functions/src/    # Cloud Functions
firestore.rules · storage.rules · firestore.indexes.json · firebase.json
docs/             # lgpd.md, runbook-backup.md, matriz de permissões
```

---

## 9. Checklist de entrega

- [ ] TypeScript sem erros (`tsc --noEmit`) e build limpo
- [ ] Login Google Workspace com restrição de domínio **na regra**
- [ ] `users/{uid}` com `roles[]` + `ativo`; conta desativada perde acesso na hora
- [ ] Matriz de permissões escrita **e** refletida em `firestore.rules`
- [ ] Regras validando forma (chaves, tipos, tamanhos), não só permissão
- [ ] Índices declarados para toda consulta composta
- [ ] Tokens `--tf-*`, temas claro e escuro, fontes da marca
- [ ] Interface e mensagens em pt-BR; foco visível; AA; 375 px
- [ ] Segredos no Secret Manager; nada sensível versionado
- [ ] `docs/` com LGPD, backup e permissões

---

_Base: Portal Flux (`tecnofink/hub`), agosto/2026. Dúvidas de arquitetura: ti@tecnofink.com._

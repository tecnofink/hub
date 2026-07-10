# Portal Flux — HUB Tecnofink

Portal web de uso exclusivo dos colaboradores do grupo Tecnofink, funcionando como **hub de ferramentas de IA**. Implementa a **Especificação de Requisitos v2.1** (07/07/2026) com o backend definido na seção 8: **Firebase** — Hosting, Authentication (Google Workspace), Firestore, Storage e Cloud Functions.

Decisões da validação já incorporadas: **P10** (login exclusivo com Google), **P13** (tangível validado pelos 3 membros do comitê; a média entra no cálculo), **P15** (Playbook no hub como ferramenta importada) e **P16** (backlog reativável pelo titular).

## Gestor de Tarefas — conciliado com o gestor do CRM (P15/P17)

O Gestor de Tarefas incorpora o comportamento do "Gestor de Projetos" anterior (Vercel + Supabase), reconstruído na stack atual e com a identidade visual do hub:

- **Projetos livres multi-membro** com papéis por projeto: *Administrador* (edita tudo + membros + zona perigosa), *Editor* (edita tarefas, comentários e anexos) e *Leitor* (somente visualiza) — impostos nas regras do Firestore, como o RLS fazia no Postgres;
- **Tarefas completas**: descrição, responsável (membro do projeto; texto livre preservado como legado da migração), data de início, prazo, prioridade, status com **Em revisão** e `data de conclusão` gravada ao concluir. "Atrasada" continua **derivada** do prazo (nunca escolhida);
- **Quadro** com visões *Por etapa* / *Por status* (preferência lembrada), **drag-and-drop** com **Desfazer de 5 s**, coluna Atrasada bloqueada para drop, "mostrar mais" a cada 10 cards e **lista de tarefas** tabular;
- **Comentários** por tarefa (thread em tempo real, editar o próprio, excluir o próprio ou por admin, links clicáveis) e **anexos** por tarefa (Storage, até 20 MB, remoção por quem enviou ou admin);
- **Alerta de atrasadas** ao abrir o projeto (uma vez por projeto/dia) e Gantt de etapas com preenchimento de progresso;
- **Gerenciar projeto** (`/tarefas/:id/admin`): membros por e-mail (a pessoa precisa já ter conta no portal), troca de papel com guarda de "último admin", sair do projeto, e **Zona Perigosa** — arquivar/desarquivar e exclusão permanente confirmada pelo nome (cascata de quadro/comentários/anexos via Cloud Function).

Projetos do Flux permanecem individuais (RF-23) e ganham os mesmos recursos de tarefa (descrição, comentários, anexos, Gantt).

**Migração dos dados reais do CRM** (`scripts/migrar-crm.ts`): lê projetos, membros, tarefas, comentários e anexos do Supabase (service role) e grava no Firestore, conciliando usuários **por e-mail** — cada membro precisa já ter feito o primeiro login no portal. Fases viram etapas; status/prioridades são mapeados; responsáveis por UUID viram contas e textos livres ficam como legado.

```powershell
$env:SUPABASE_URL="https://<ref>.supabase.co"
$env:SUPABASE_SERVICE_ROLE="<service role>"          # valores em "Dados Supabase.txt"
npx tsx scripts/migrar-crm.ts                        # ensaio nos emuladores
npx tsx scripts/migrar-crm.ts --producao --projeto <PROJECT_ID> --com-anexos   # cutover
```

## Arquitetura

```
src/
  lib/firebase.ts   inicialização do Firebase (+ Emulator Suite via VITE_USE_EMULATORS)
  lib/              tipos, datas, formatação e regras de pontuação (seção 5 da spec)
  store/            estado global em tempo real (onSnapshot) + ações de domínio
  pages/            telas — hub, perfil, flux, gestor, comitê, admin, playbook
  styles/ds.css     design system Tecnofink (tema claro/escuro)
functions/          Cloud Functions: e-mails RF-51, lembretes agendados,
                    alerta de atraso e encerramento de ciclo (ranking congelado no servidor)
firestore.rules     controle de acesso por papéis validado no backend (RNF Segurança)
storage.rules       anexos de evidência (RF-35), até 20 MB por arquivo
scripts/            seed dos emuladores, bootstrap de produção e launcher dos emuladores
```

**Segurança (imposta pelas regras, não pela UI):** usuário comum não define tier, não escreve notas/validações, não altera papéis nem ciclos e não lê logs; cada membro do comitê só grava a própria validação/notas; admin não desativa a própria conta; conta criada no primeiro login só com domínio autorizado; conta desativada perde acesso imediatamente (a sessão aberta é derrubada).

**Cloud Functions (região `southamerica-east1`):**

| Função | Gatilho | O que faz (RF-51/RF-58) |
|---|---|---|
| `aoInscreverPitch` | create em `projects` | e-mail de confirmação ao titular |
| `aoAtualizarProjeto` | update em `projects` | e-mails de decisão da triagem (tier/backlog/reprovação) e aviso ao comitê quando um resultado é registrado |
| `aoExcluirProjeto` | delete em `projects` | alerta aos admins se o pitch tinha tier definido |
| `lembretesDeadline` | agendado 08:00 (BRT) | lembretes 7 dias e 1 dia antes do deadline + log de atraso (RF-36) |
| `encerrarCiclo` | callable (admin) | congela o ranking calculado no servidor, arquiva no histórico e publica por e-mail |

## Desenvolvimento local (Emulator Suite)

Requisitos: Node 20+, Java 11+ (ou um JRE portátil extraído em `.tools\jre` — o script detecta).

```bash
npm install && npm --prefix functions install
npm run emuladores    # Auth 9099 · Firestore 8080 · Storage 9199 · Functions 5001 · UI 4000
npm run seed          # popula com os dados de demonstração (contas senha demo1234)
npm run dev           # http://localhost:5173 (usa .env.local → emuladores)
```

No login local, o seletor do Auth emulator lista as contas do seed (ana.lima@, marcos.freitas@, daniel.rocha@ etc.). O `.env.local` versionável aponta para o projeto `demo-portal-flux` — 100% offline, sem credenciais.

## Playbook — importado do Supabase (P15/P17)

O Playbook 2026 foi reconstruído dentro do hub (rota `/playbook`), com a identidade visual Tecnofink e os dados vivos do Supabase. Página única com âncoras, como o original:

- **[01] Eventos** — cards nacionais/internacionais com status ciclável (Não iniciado → Em andamento → Concluído) e eventos custom removíveis;
- **[02] Catálogos** — estoque e consumo por evento com projeção de saldo, "comprar antes de" e indicadores (estoque total, consumo previsto, necessidade de compra, críticos);
- **[03] Página da Feira** — por evento: **Logística & Stand** (4 slots de documento arquivo/link, hotel, transporte, colaboradores, custos com total), **Checklist** (árvore global setores→categorias→itens com marcações e quantidades por feira, edição da estrutura), **Captação de Leads** (planilhas + leads manuais com exportação CSV — PII restrita ao portal logado) e **Portal do Expositor** (credenciais, visíveis só logado);
- **[04–08]** Associações (descontos e benefícios), Prospecção (eventos sugeridos por setor com forma de participação), Brindes (estoque inicial/usado/saldo com saídas), Stands 2027 (status, valores, prazos, planta/projeto) e Workshops (produtos apresentados).

**Acesso** (espelho do RLS de 3 níveis, sem anônimo no hub): qualquer colaborador ativo lê tudo; a escrita é exclusiva dos **editores do Playbook** (`playbook/config.editores`, geridos pelos admins do hub no botão "editores" da própria página) — imposto nas regras do Firestore.

**Migração** (`scripts/migrar-playbook.ts`): lê as 25 tabelas `playbook_*` e os buckets do Supabase, e grava um documento por seção + um por evento (`playbookFeira/{eventoId}`), conciliando editores por e-mail e copiando arquivos para o Storage.

```powershell
npx tsx scripts/migrar-playbook.ts                                  # ensaio nos emuladores
npx tsx scripts/migrar-playbook.ts --producao --projeto <PROJECT_ID>  # cutover
```

## Lançamento em produção

1. **Criar o projeto** no [console do Firebase](https://console.firebase.google.com) (sugestão: `portal-flux-tecnofink`), plano **Blaze** (Functions exigem). Ajuste o id em `.firebaserc` se for outro.
2. **Ativar os serviços**: Authentication → provider **Google** (defina o e-mail de suporte); Firestore (modo produção, região `southamerica-east1`); Storage.
3. **Registrar o app web** (Configurações do projeto → Seus apps → Web) e copiar a config para `.env.production.local` (modelo em `.env.example`, `VITE_USE_EMULATORS=false`).
4. **Login e deploy**:
   ```bash
   npx firebase login
   npm run deploy        # build + hosting + rules + indexes + functions
   ```
5. **Bootstrap** (uma vez): faça o primeiro login no portal com sua conta e rode
   ```bash
   npx tsx scripts/bootstrap-producao.ts --projeto portal-flux-tecnofink --admin analista.dados1@tecnofink.com
   ```
   (requer `gcloud auth application-default login` ou `GOOGLE_APPLICATION_CREDENTIALS`). Isso grava os domínios liberados iniciais e promove o e-mail a administrador. Depois, pela própria UI: atribuir o papel Comitê a Marcos, Emilio e Thomas (Admin do Flux → Usuários) e criar o Ciclo 1 (Admin do Flux → Ciclos).
6. **E-mail transacional** (RF-51): configure o SMTP do Workspace nas Functions —
   ```bash
   npx firebase functions:secrets:set SMTP_PASS
   ```
   e defina `SMTP_HOST` (ex.: `smtp-relay.gmail.com`), `SMTP_USER` e `EMAIL_FROM` em `functions/.env.portal-flux-tecnofink`, seguido de novo deploy das functions. Sem configuração, os e-mails são apenas registrados nos logs.
7. **Domínio próprio**: Hosting → Adicionar domínio personalizado; inclua o domínio final em Authentication → Settings → Authorized domains.

## Fora de escopo desta versão

- Integração automática com o console do Claude (concessão/revogação manuais, com registro no portal — RF-54);
- Importação do conteúdo do Playbook e do gestor de tarefas do CRM (levantamento P17, fase de Modelagem);
- Versão mobile (decisão P8).

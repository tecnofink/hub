# LGPD — retenção e eliminação de dados pessoais

Portal Flux · projeto `portal-flux-tecnofink`. Cobre os dados pessoais tratados pelo hub e como são retidos e eliminados. Fecha o item #30 da auditoria.

## Dados pessoais tratados
| Onde | Campos pessoais | Base / finalidade |
|---|---|---|
| `users/{uid}` | nome, e-mail, foto, aniversário (`niver`), apresentação (`apres`), cargo, departamento, empresa | Execução do vínculo de trabalho / uso do hub |
| `projects/{id}` | `uid` (autor), nome e conteúdo do pitch | Legítimo interesse (gestão do programa Flux) |
| `projects/{id}/comentarios` e `tarefas/{id}/comentarios` | `autorId`, `autorNome`, texto e anexos das mensagens | Triagem do pitch / colaboração nas tarefas |
| `cycles/{id}.frozen` | nome e setor congelados no ranking | Histórico dos ciclos |
| `logs` | `quem` (nome), ação | Auditoria / segurança |
| `logsFalhas` | nome, `uid`, conteúdo do pitch, `userAgent` | Diagnóstico de falha de inscrição |
| Storage `anexos-pitches/`, `anexos-tarefas/`, `anexos/` | arquivos anexados às mensagens/tarefas | Comprovações e evidências |
| Firebase Auth | e-mail, foto (do Google Workspace) | Autenticação |

## Retenção (automática — Function `limparRetencao`, diária às 03:30 BRT)
- **`logsFalhas`**: **180 dias**. Guardam conteúdo do pitch, nome e `userAgent` — dado de diagnóstico, sem necessidade de retenção longa.
- **`logs` (auditoria)**: **365 dias**.
- Limite de 400 remoções por coleção a cada execução (converge diariamente; sem impacto em pico).
- Dados de negócio (`projects`, `cycles`, `users` ativos) **não** têm expiração automática — seguem o ciclo de vida do programa.

## Eliminação / anonimização (a pedido ou no desligamento)
Ação de **Admin do Hub** em **Admin do Hub → Usuários do portal → Anonimizar** (só aparece em contas já **desativadas**; irreversível, com confirmação). Dispara o comando `anonimizarUsuario` (coleção `comandos`), processado pela Function `aoReceberComando`, que:
1. **Cadastro (`users/{uid}`)**: zera nome, e-mail, foto, aniversário, apresentação, cargo, departamento e empresa (nome → "Usuário removido", e-mail → `removido+<uid>@tecnofink.invalid`); revoga papéis (`['user']`), marca `ativo:false` e grava `anonimizadoEm`.
2. **`logsFalhas`** do usuário: **apagados**.
3. **Rankings congelados (`cycles.frozen`)**: nome do usuário → "Usuário removido" (casado por `uid`; frozen legado sem uid, pelo nome anterior).
4. **Comentários** (chat de triagem do pitch **e** comentários de tarefa): as mensagens escritas pelo usuário têm `autorNome` → "Usuário removido", `texto` → "[removido]" e os **anexos apagados** do Storage.

O que **permanece** (pseudonimizado): os documentos de `projects` do usuário e as evidências de resultado continuam ligados ao `uid` (chave pseudônima), para não quebrar a integridade dos rankings — mas sem identificador pessoal, já que o nome exibido resolve como "Usuário removido".

**Resíduo conhecido**: a coleção `logs` (auditoria) guarda `quem` (nome) sem `uid`, então não é anonimizada por chave — some pela retenção de 365 dias. Corrigir depende de gravar `quemUid` (item #2 da auditoria, previsto).

### Passos manuais complementares (fora do app)
- **Firebase Auth**: excluir a conta do usuário no console (Authentication) para encerrar o login — o app não remove contas de Auth (ação prohibida por política; feita por pessoa autorizada).
- Confirmar que a conta Workspace foi desprovisionada pelo RH/TI.

## Direitos do titular
Pedidos de acesso, correção ou eliminação devem ser encaminhados a **ti@tecnofink.com**. Correção de dados o próprio titular faz no **Perfil**; eliminação segue o procedimento de anonimização acima.

_Referência de operação: [runbook-backup.md](runbook-backup.md) para backup/restauração._

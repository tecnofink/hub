# Runbook — Backup e Restauração (Firestore)

Portal Flux · projeto Firebase `portal-flux-tecnofink` · região `southamerica-east1`.

## Política em vigor
- **PITR** (point-in-time recovery): volta o banco a qualquer minuto dos **últimos 7 dias**.
- **Backup diário** agendado, retido por **14 dias**.
- **Backup semanal** (domingo), retido por **56 dias** (~2 meses).
- **Proteção contra exclusão** ligada no banco `(default)`.
- **Storage**: versionamento de objetos + ciclo de vida (versões antigas 30 dias).

Conferir agendamentos e backups (com token ADC — `gcloud auth application-default print-access-token`):
```
GET https://firestore.googleapis.com/v1/projects/portal-flux-tecnofink/databases/(default)/backupSchedules
GET https://firestore.googleapis.com/v1/projects/portal-flux-tecnofink/locations/southamerica-east1/backups
```

## Teste de restauração (fumaça) — validado em 21/07/2026
O Firestore **só restaura para um banco NOVO** — nunca por cima do `(default)`. Produção não é tocada.

1. **Listar backups** e escolher o mais recente `READY` (endpoint acima).
2. **Restaurar** para um banco descartável:
   ```
   POST https://firestore.googleapis.com/v1/projects/portal-flux-tecnofink/databases:restore
   { "databaseId": "teste-restauracao-AAAAMMDD", "backup": "<nome completo do backup>" }
   ```
   Leva ~10–12 min mesmo com pouco dado (provisionamento). Acompanhar a operação retornada até `operationState: SUCCESSFUL`.
3. **Verificar integridade**: contar documentos das coleções-chave (`users`, `projects`, `cycles`, `tarefas`) no banco restaurado e comparar com produção; conferir que pitches reais estão presentes; confirmar a fidelidade point-in-time (o snapshot reflete o instante do backup).
4. **Apagar o banco de teste** (a proteção contra exclusão vem ligada por herança — desligar antes):
   ```
   PATCH .../databases/teste-restauracao-AAAAMMDD?updateMask=deleteProtectionState
   { "deleteProtectionState": "DELETE_PROTECTION_DISABLED" }
   DELETE .../databases/teste-restauracao-AAAAMMDD
   ```
5. **Confirmar** que só o `(default)` restou e segue intacto.

## Recuperação real (incidente)
- **Perda parcial recente (≤ 7 dias)**: usar PITR — restaurar para um banco novo no timestamp desejado, extrair os documentos afetados e reescrevê-los no `(default)` (nunca substituir o banco inteiro em produção).
- **Perda ampla**: restaurar o backup mais próximo para um banco novo, validar, e então promover/migrar os dados. Avaliar downtime com a liderança antes.

## Cadência recomendada
Repetir o teste de fumaça **trimestralmente** e após qualquer mudança grande no modelo de dados. Registrar data, tempo de restauração e responsável.

_Última validação: 21/07/2026 — restauração + verificação de integridade OK; banco de teste removido._

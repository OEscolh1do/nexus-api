# Especificação: Integração M2M — Dados Comerciais nos Cards do ProjectExplorer

## 1. O Quê (Business Problem)
**Problema**: Os cards do ProjectExplorer mostram `— kWp` e `— kWh` porque o endpoint `GET /api/v1/designs` não retorna `targetPowerKwp` nem `averageConsumptionKwh`. Esses dados residem no Iaçã (CRM) e precisam ser injetados via comunicação M2M (Machine-to-Machine) no backend do Kurupira.

**Solução**: O backend do Kurupira, ao receber `GET /api/v1/designs`, deve:
1. Buscar os projetos no `db_kurupira`.
2. Coletar os `iacaLeadId` não-nulos.
3. Fazer uma requisição M2M ao Iaçã (`GET /api/internal/leads?ids=...`) para obter `targetPowerKwp`, `averageConsumptionKwh`, `city`, `state`.
4. Compilar tudo num único payload e devolver ao frontend.

## 2. Usuários Finais
- **Engenheiro de Dimensionamento**: Vê potência-alvo e consumo nos cards, facilitando a busca pelo projeto certo.
- **Coordenador Técnico**: Visão rápida do backlog por potência.

## 3. Critérios de Aceitação
1. Cards de projetos com `iacaLeadId` exibem `targetPowerKwp` e `averageConsumptionKwh` reais.
2. Cards standalone (sem lead) mantêm `— kWp` / `— kWh` como fallback.
3. Se o Iaçã estiver offline, o backend retorna `206 Partial Content` e o frontend exibe dados parciais sem quebrar.
4. A requisição M2M é batched (uma só chamada para N leads, não N chamadas individuais).
5. Latência percebida < 500ms para listagem com 50 projetos.

## 4. Fora de Escopo
- Edição dos dados comerciais pelo Kurupira (read-only).
- Cache persistente dos dados do Iaçã no `db_kurupira` (apenas in-memory durante o request).
- Sync bidirecional (Kurupira não notifica o Iaçã de mudanças).

## 5. Arquitetura Proposta
```
Frontend                    Kurupira Backend               Iaçã Backend
   │                              │                              │
   │ GET /api/v1/designs          │                              │
   │─────────────────────────────▶│                              │
   │                              │ SELECT * FROM TechnicalDesign│
   │                              │ (db_kurupira)                │
   │                              │                              │
   │                              │ GET /api/internal/leads      │
   │                              │ ?ids=id1,id2,id3             │
   │                              │─────────────────────────────▶│
   │                              │                              │
   │                              │◀─────────────────────────────│
   │                              │ { id1: {name, city, kwp...}} │
   │                              │                              │
   │◀─────────────────────────────│ Compiled JSON + leadContext  │
   │  ProjectCard[] com dados     │                              │
```

## 6. Pré-requisitos
- [ ] Iaçã deve expor endpoint interno `GET /api/internal/leads?ids=...` (rota M2M, sem JWT de usuário, validada por `M2M_SERVICE_TOKEN`).
- [ ] Campo `targetPowerKwp` deve existir no schema do Lead no Iaçã.

---
*Status: Aguardando endpoint M2M no Iaçã para ser iniciada.*

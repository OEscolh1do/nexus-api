# ADR 005: Protocolo Offline-First (Field Ops)

## Status

Aceito

## Contexto

A visão operacional da Neonorte envolve execução em locais remotos (Amazônia, Zonas Rurais) sem internet estável. Uma API puramente online (REST tradicional) impedirá a operação do App de Vistoria e Diário de Obras, gerando perda de dados e revolta dos times de campo.

## Decisão

O Backend deve ser agnóstico à conectividade, suportando sincronização assíncrona ("Sync Push").

### Diretrizes Técnicas

1.  **Arquitetura de Dados (Last Write Wins):**
    - O servidor é a fonte da verdade, mas aceita "pacotes" de mudanças com timestamps.
    - Em caso de conflito simples, a mudança mais recente (pelo timestamp do cliente) vence, ou gera um alerta de conflito para resolução manual.
2.  **API de Sincronização:**
    - Em vez de apenas endpoints CRUD individuais (`POST /task`), o módulo Ops deve expor endpoints de lote (`POST /ops/sync`).
    - Payload: `{ changes: { created: [], updated: [], deleted: [] }, lastPulledAt: timestamp }`
3.  **Frontend Mobile:**
    - Deve utilizar banco de dados local (SQLite/WatermelonDB) e fila de sincronização.
    - A UI deve ser "Optimistic" (assume sucesso e atualiza tela imediatamente).

## Consequências

- **Resiliência:** O App funciona 100% offline.
- **Complexidade de Backend:** Exige endpoints mais inteligentes que lidam com merge de dados e idempotência (se receber o mesmo pacote 2x, não duplica dados).

## Compliance

Novos recursos do módulo `Ops` (Vistoria, Medição) devem ser desenhados pensando "E se o celular estiver sem sinal?". Se a resposta for "o app trava", a arquitetura foi reprovada.

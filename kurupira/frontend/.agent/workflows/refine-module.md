---
description: Como refinar/adicionar features de Engenharia num Slice existente no Lumi
---

# Fluxo de Trabalho: Refinamento Seguro de Features (Zustand)

Devido à arquitetura altamente acoplada de estado no Lumi (Zustand), uma alteração de estrutura de dados pode corromper os orçamentos previamente gravados no `localStorage` do usuário.

## Etapa 1: Análise de Impacto (State Persist)
Sempre que for adicionar um novo campo num slice:
1. Revise se o novo dado exigirá valor padrão (fallback). 
2. Atualize o `Schema Zod` associado a essa ponta (ex: `settings.schemas.ts`).
3. Verifique a lista `partialize` no `solarStore.ts` se a nova chave deve ou **não deve** ser persistida. (Exemplo: "Clima em tempo real" não se persiste, pois a API externa recalcula).

## Etapa 2: Alteração Visual
1. Modifique o respectivo Widget/Tab visual em `src/modules/...`
2. Aplique Zod na validação de inputs (React Hook Form) caso for um campo de texto/número aberto. Jamais envie "letras" para um Slice de Engenharia caso ele espere `number`. 

## Etapa 3: Revisão da Calculadora Base
Se a nova métrica interferir no preço final (ex: Nova regra de Mão de Obra):
1. Altere o `SolarCalculator.ts` ou engine equivalente.
2. Certifique-se de que testes prevejam "0" ou fallback para caso a variável venha vazia por caches antigos.

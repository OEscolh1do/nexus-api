---
name: api-consistency-auditor
description: Garante a integridade e consistência entre as rotas do frontend e backend (Axios/BFF).
---

# Skill: API Consistency Auditor

## Gatilho Semântico

Ativado quando: "erro 404 na API", "rota não encontrada no frontend", "baseURL do axios", "prefixo duplicado na URL", ou quando houver refatoração de serviços de API que envolvem o backend Sumaúma/Kurupira.

## Protocolo

1. **Verificação de Base**: Identifique a `baseURL` configurada no cliente de API (geralmente em `src/lib/api.ts` ou `src/services/api.ts`).
2. **Mapeamento de Rotas**: Liste as rotas sendo chamadas no componente/hook e verifique se o primeiro segmento do path não é redundante com a `baseURL`.
3. **Cross-Check Backend**: Verifique como o roteador está montado no backend (`server.js` -> `app.use('/prefix', router)`). A rota final deve ser a soma da `baseURL` + `path` do frontend, correspondendo exatamente ao prefixo do backend + rota do roteador.
4. **Verificação de Proxy**: Verifique o `vite.config.ts` para garantir que o prefixo (ex: `/admin`) está sendo corretamente roteado para a porta do backend correspondente.
5. **Correção**: Remova prefixos redundantes ou ajuste a `baseURL` para manter a consistência.

## Limitações e Boas Práticas

- Não altere a `baseURL` sem verificar o impacto em todo o projeto. Prefira ajustar os paths individuais se o padrão já estiver estabelecido.
- Em chamadas via `fetch` nativo (sem Axios), lembre-se que a URL deve ser completa ou relativa ao root do site, exigindo o prefixo completo.

---
description: Análise de Causa Raiz e Troubleshooting de Bugs
---

# Fluxo de Trabalho: Troubleshooting de Bug 

1. **Investigação (RCA)**:
   - Leia logs do terminal de console ou browser caso existam (`ERR_CONNECTION_REFUSED`, `CORS`, `401 Unauthorized`).
   - Verifique sempre se o servidor rodando é o de Desenvolvimento (`npm run dev`) e mapeie se a VITE PORT e o Backend estão abertos (O Backend opera na `3001` localmente).

2. **Isolamento via Camadas**:
   - `HTTP Interceptors`: Olhe o arquivo `api.ts` caso haja desvios de Autorização.
   - `Router`: Valide re-rotas inesperadas no `App.tsx`.
   - `Components`: Examine renderizações baseadas no fluxo de Estado do useState.

3. **Validação Estática**:
   - Para erros sintáticos em renderização, sempre confirme qual dependência está instalada ou se o `zod` schema está lançando erro semântico.
   - Teste no navegador antes de aprovar como corrigido.

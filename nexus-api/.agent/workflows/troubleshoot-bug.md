---
description: How to scientifically troubleshoot and resolve bugs using Root Cause Analysis (RCA) without guessing
---

# Troubleshooting Científico (Root Cause Analysis)

## O Problema Crítico
Ao enfrentar um bug ("não está salvando", "a tela ficou branca"), a pior abordagem é "chutar" edições de código imediatamente. Isso gera novos bugs (efeito Hidra). Este workflow obriga o uso do Método Científico.

## Passo 1: Isolamento de Camada (Layer Isolation)
**Nunca altere o código antes de saber ONDE o fluxo quebra.**

Verifique a cadeia de custódia do dado nesta ordem estrita:

1. **Frontend State (React):**
   - O payload gerado pelo formulário (React Hook Form) está correto? O Zod do frontend aprovou?
2. **Network Layer (Axios/Browser):**
   - Inspecione a aba Network. Qual foi o HTTP Status (400? 401? 500?)
   - Qual foi o Request Payload exato enviado?
   - Qual foi o Response Body exato retornado?
3. **Backend Controller:**
   - A requisição chegou ao Controller? O middleware de Autenticação (`requireRole`) a bloqueou?
   - O log do Express mostra o parse do corpo (Zod backend)?
4. **Database (Prisma/PostgreSQL):**
   - Foi um erro P2002 (Unique Constraint)? 
   - A query violou a RLS (tentou acessar sem `withTenant` ou falhou na restrição do tenant)?

## Passo 2: Construção da Hipótese
Mapeie a anomalia explicitando a desconexão temporal ou de dados.
- *Hipótese Errada:* "O backend está quebrado."
- *Hipótese Certa:* "O Frontend envia `price: "100"`, o Zod backend espera `number`, lança erro HTTP 400, e o Frontend não trata o bloco `catch`, ficando em loading infinito."

## Passo 3: Leitura Exata (Code Audit)
Navegue para a camada exata identificada e **leia os logs ou código reais**.
Se o erro for de banco, verifique `schema.prisma`. Se for de permissão, verifique a matriz em `rbac-matrix.md`.

## Passo 4: Resolução Cirúrgica
1. **Corrige a Causa Raiz:** Modifique *apenas* a camada afetada (Ex: converter string para number antes do Axios POST).
2. **Protege o Entorno:** Adicione log ou tratamento de erro (`try/catch` + toast no front) para evitar que a UI "congele" se falhar novamente.
3. **Valide a Correção:** Rode o fluxo inteiro.

## Red Lines (O que NUNCA fazer)
- ❌ NUNCA adivinhe a causa. Leia o erro do terminal/console.
- ❌ NUNCA silencie erros usando `any`, `ts-ignore` ou removendo try/catch.
- ❌ NUNCA desative validações `Zod` para "fazer funcionar". Se o modelo mudou, atualize o Zod.
- ❌ NUNCA pule o frontend para testar no backend se o problema for na integração.

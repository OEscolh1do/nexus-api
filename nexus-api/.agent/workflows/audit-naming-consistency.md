---
description: How to audit a module for semantic drift, obsolete naming and variable clarity
---

# Auditoria Semântica e Consistência de Nomenclatura (Naming Audit)

## Quando Usar

- Quando um módulo cresceu muito e seu nome original não reflete mais seu propósito real.
- Quando a equipe relata confusão ao dar manutenção no código ("Ah, esse `User` aqui na verdade é o `TenantAdmin`, desculpe").
- Antes de grandes refatorações ou abstrações.
- Quando há mistura de idiomas na mesma função (ex: `calcularUserScore`).
- Quando variáveis têm nomes genéricos (`data`, `info`, `result`, `temp`) ou abreviações não documentadas (`usr`, `ctx`, `cfg`).

## Fase 1: Diagnóstico de Drift Semântico

### 1. Análise de Fronteiras do Módulo (Module Boundaries)
Avalie o diretório/módulo alvo:
- O nome do módulo (`ex: /modules/commercial`) condiz com as rotas exportadas?
- As tabelas que este módulo consome fazem sentido sob este domínio?
- **Sintoma de Drift:** `CommercialService.js` está calculando provisões financeiras em vez de fechamento de negócios.

### 2. Análise de Nomenclatura de Arquivos e Pastas
- As sub-pastas refletem a organização arquitetural padrão? (`/ui`, `/api`, `/services`, `/schemas`) ou foram criadas pastas ad-hoc genéricas que viraram "gavetas de bagunça"? (`/utils`, `/helpers`, `/misc`)
- Arquivos têm sufixos consistentes? (`.service.js`, `.controller.js`, `.route.ts`)
- Componentes React começam com Letra Maiúscula e indicam seu propósito? (`UserCard.tsx` vs `card.tsx`)
- **Sintoma de Drift:** Sub-pastas com nomes de domínio (`/clientes`) misturadas com pastas de camada (`/controllers`) no mesmo nível, quebrando o padrão estrutural do Monólito modular. Componente chama-se `Dashboard.tsx` mas virou uma painel de configurações.

### 3. Análise de Funções e Variáveis
Examine o código interno usando três perguntas chave:
1. **Verbo Certo?** Se a função se chama `getSomething()`, ela não deve modificar propriedades no banco. Se se chama `processData()`, o nome é genérico demais.
2. **Objeto Certo?** Se a variável é `let user = ...`, mas ela guarda os dados de uma `Company`, o nome deve mudar para `company` ou `tenant`.
3. **Plural vs Singular?** Um Array chamado `lead` em vez de `leads`.

### 4. Code Smells Semânticos Mais Comuns
- Variáveis Booleanas sem prefixo claro (`is`, `has`, `can`, `should`). Exemplo errado: `valid` ou `admin`. Exemplo certo: `isValid` ou `isAdmin`.
- Acrônimos ou abreviações obscuras. Exemplo errado: `reqTrxPnl`.
- Nomenclatura "Tuberculosa" (Múltiplas responsabilidades no nome). Exemplo: `saveUserAndSendEmailAndCreateLog()`. Isso revela que a função viola o Princípio de Responsabilidade Única (SRP).

## Output Esperado: `semantic_audit_report.md`

Gere um documento contendo:

1. **Mapa de Drift Semântico:** Lista de nomes atuais vs. O que o código de fato faz.
2. **Dicionário de Refatoração Proposal:**
   | Antes do Refactor | Depois do Refactor proposto | Motivo |
   |---|---|---|
   | `let user = data` | `let b2bClient = payload` | Escopo restrito a clientes PJe |
   | `calcularTudo()` | `generateCommercialReport()` | Nome anterior opaco |
   | `usersController.js` | `tenantAdmin.controller.js` | Reflete domínio isolado via RLS |
3. **Análise de Risco:** Quais integrações ou módulos parceiros vão quebrar se renomearmos isso?

## Fase 2: Execução de Renomeação Segura (Após Aprovação)

O ato de renomear variáveis em TypeScript/JavaScript possui riscos de quebra de contrato (API). A execução deve seguir esta ordem:

1. **Testes Base:** Garantir que o módulo compila localmente antes da mudança.
2. **Variáveis Locais:** Usar "Rename Symbol" nativo das IDEs/Grep para variáveis em escopo local e consts.
3. **Exports/Imports (Arquivos Privados):** Renomear funções auxiliares que não são exportadas para fora do módulo.
4. **Interfaces TypeScript:** Renomear chaves nos `types/*.ts`. (Isso quebrará o TS e servirá de mapa de o que corrigir).
5. **Renomear Arquivos:** Usar o sistema de versionamento (`git mv`) para não quebrar histórico de versão, sempre atualizando importações.
6. **Deploy Controlado:** Nunca faça refatoração semântica gigantesca junto com adição de novas features lógicas. Refatoração é um PR de pureza estrutural isolado.

// turbo-all
## Verificar Regressões
Após refatorar:
```bash
cd frontend && npm run build
```
```bash
cd backend && npm start
```

# ADR 003: Migração do Solar Engine

## Status

Aceito

## Contexto

O módulo de dimensionamento fotovoltaico residia em um repositório separado (`solarflow-propose-engine`). Isso causava:

1. Duplicação de tipos e lógica de cálculo entre o motor de vendas e o backend principal.
2. Complexidade no build e deploy (múltiplos artefatos).
3. Dificuldade em compartilhar componentes de UI e estilos (Neonorte UI).

## Decisão

Migrar o código fonte do `solarflow-propose-engine` diretamente para dentro do monólito `nexus-monolith`.

- **Frontend:** Componentes migrados para `frontend/src/views/SolarWizard` e `frontend/src/components/Solar`.
- **Lógica:** Motor de cálculo migrado para `frontend/src/lib/solarEngine.ts` (mantendo-se no cliente por enquanto para interatividade rápida, mas tipado com Zod).

## Consequências

### Positivas

- Single Source of Truth para tipos e regras de negócio.
- Facilidade de manutenção (um único PR atualiza tudo).
- Acesso direto ao contexto de autenticação e banco de dados do Neonorte | Nexus.

### Negativas

- Aumento do tamanho do bundle do frontend (mitigado por Code Splitting).
- Necessidade de refatoração inicial para remover dependências legadas do projeto antigo.

## Conformidade

Todos os novos desenvolvimentos solares devem ocorrer dentro de `src/modules/solar` (Backend) e `src/views/SolarWizard` (Frontend).

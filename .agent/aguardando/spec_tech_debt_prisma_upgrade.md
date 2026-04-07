# Especificação: Migração do Prisma ORM (v5 → v7)

## 1. O Quê (Business Problem)
**Problema**: Sistemas Kurupira e Iaçã utilizam Prisma ORM numa versão levemente desatualizada (v5.10).
**Solução**: Oportunidade de ganho em segurança, patches e queries performáticas no pool através do Prisma 7, unificando a release em todo o workspace.

## 2. Usuários Finais
- **Backend / DB Admin**: Estabilidade de processos de Node.

## 3. Critérios de Aceitação
1. Pacotes `@prisma/client` e `prisma` levados para stable atual v7 via `package.json`.
2. Scripts executados passando no suite de integração sem erro em M2M e referências no Tenant Filter.

## 4. Fora de Escopo
- Alterações drásticas de schema.

## 5. Detalhes Técnicos
- Refactoring `package.json` para ambas pastas isoladas.

# Especificação: Normalização da Dicotomia Views vs Modules (Iaçã Frontend)

## 1. O Quê (Business Problem)
**Problema**: A auditoria do `context.md` e do código em disco demonstrou fragmentação de papéis na UI do Iaçã ERP: `Commercial` e `Ops` existem simetricamente nos diretórios `src/views` e `src/modules`. O padrão de domínio feature-sliced está confuso.
**Solução**: Assentar em uma padronização monolítica de Feature-Slice (`modules/` centraliza a lógica, utils, hooks, componentes locais; `views`/`pages` atua apenas na orquestração de rotas externas).

## 2. Usuários Finais
- **Equipe de Engenharia Fontend**.

## 3. Critérios de Aceitação
1. Eliminar ambiguidade; se um domínio atuar no `/modules`, remover seu "fantasma" das `/views` que não tem razão de existir separada.
2. Adaptar router DOM para utilizar as raízes importadas corretas.
3. Atualizar `context.md` para refletir o status pós-limpeza.

## 4. Fora de Escopo
- Feature nova ou alteração das regras do CRM.

## 5. Detalhes Técnicos
- Mudar arquivamento das pastas, paths de imports, corrigir React Router loader se associado ao Path.

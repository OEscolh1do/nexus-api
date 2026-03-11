# Regras de Desenvolvimento - Nexus Hub (Enterprise Gold Standard)

Este projeto segue preceitos estritos para garantir manutenibilidade escalável do ponto central da Arquitetura Neonorte.

## 1. Convenções de Nomenclatura e Arquivos
- **Componentes React**: PascalCase estrito (ex: `AppSwitcher.tsx`, `LoginForm.tsx`).
- **Arquivos Utilitários (Funções Puras)**: camelCase (ex: `api.ts`, `validation.ts`).
- **Arquivos Exportados**: Preferencialmente use Exportação Nomeada `export function ComponentX()` ao invés de Exportação Padrão, exceto onde o roteador (React Router / Vite) forçar a adoção.
- **Tipos/Interfaces**: Prefixe interfaces estritas caso conflitem com namespaces globais, mas no geral prefira Type Aliases simples (ex: `type AuthResponse = {...}`).

## 2. Requisitos de Estilização (UI Premium)
- **Proibição de CSS Externo Ad-Hoc**: Tudo deve derrive das métricas utilitárias do Tailwind CSS. Use `tailwind.config.js` para expandir paletas (Ex: `colors: { neonorte: {...} }`).
- **Composições Dinâmicas de Classes**: Utilize os pacotes `clsx` e `tailwind-merge` para criar abstrações estéticas ou variantes e unir condicionalmente lógicas booleanas sem colisão de especificidade, empacotando-as preferencialmente num utilitário `cn(...)`.

## 3. Comportamento e Validação Funcional
- Formulários NUNCA usam Controlled Components puros se forem complexos. Obligatoriedade do uso do `react-hook-form` acoplado ao `zod` (`@hookform/resolvers`).
- Requisições (HTTP) não devem ficar abertas e dispersas em componentes visuais se a camada crescer. Priorize a importação e o empacotamento em serviços (ex: dentro da pasta `lib/` ou `api/`).
- O tratamento de Erros ou Exceções de HTTP deve usar o `.catch()` do Axios ou Blocos estritos `try/catch` no front-end, alertando de maneira visual se houver impeditivos (ex: Status Codes > 400).

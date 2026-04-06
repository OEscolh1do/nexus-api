# Especificação: Migração do TailwindCSS de CDN para PostCSS (Kurupira)

## 1. O Quê (Business Problem)
**Problema**: O frontend do Kurupira está operando sob TailwindCSS via CDN script inserido. Essa técnica é danosa em produção, aumentando o flash inicial estético (FOUC), impedindo treeshaking de classes e anulando integrações customizadas complexas via CSS.
**Solução**: Converter o template para uso nativo do PostCSS via Vite, compilando o `index.css`.

## 2. Usuários Finais
- **Desenvolvedor / Sistema**: Geração correta do bundle de assets UI para Deploy.

## 3. Critérios de Aceitação
1. Retirar tag do CDN no `index.html`.
2. Instalação e configuração do pacote local `tailwindcss`, `postcss`, `autoprefixer`.
3. Injeção das anotações no CSS global.
4. Temas, animações (Tailwind animations) funcionam intactas sem crash do vite dev mode.

## 4. Fora de Escopo
- Criação de novos componentes; objetivo é paridade 1:1 total visual.

## 5. Detalhes Técnicos
- `npm install -D tailwindcss postcss autoprefixer` e refatorar `tailwind.config.js`.

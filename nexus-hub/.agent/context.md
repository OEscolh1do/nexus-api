# Contexto Global do Nexus Hub

## Visão Geral do Sistema e Propósito
O `nexus-hub` atua como o **Portal Único de Lançamento (Single Sign-On)** e orquestrador raiz da arquitetura "Hub & Spoke" da Neonorte. Projetado para substituir a página de login original do ERP monolítico, e fornecer acesso transparente (SSO) às ferramentas-satélite isoladas (Gestão, Comercial, Ops, Extranets, Academy).

## Stack Tecnológica Detalhada
- **Frontend Core**: React 18, TypeScript, Vite.
- **Estilização**: Tailwind CSS (Versão Especializada 3.4.1), Radix UI (Headless UI Components), Lucide React.
- **Gerenciamento de Fluxos e Formulários**: React Router DOM (v7), React Hook Form, zod (Schema Validation).
- **Consumo de API**: Axios (Interceptadores acoplados para injeção de Headers/Token).

## Decisões Arquiteturais
1. **Hub Centralizado**: Separa a responsabilidade de Interface de Login e AppSwitcher do resto do ERP (Segurança por isolamento de domínios/portas locais).
2. **SSO e Gerenciamento de Tokens**:
   - URL JWT Trapping: Compartilhamento inicial de tokens engloba envio seguro do payload JWT pela querystring (`?session=xyz`) nos links de navegação (`AppSwitcher`). Os aplicativos-filhos capturam na renderização, setam no seu próprio Contexto e deletam o rastro da URL imediatamente.
3. **Design Premium (Glassmorphism e UI/UX)**:
   - Cores profundas (`#050510`), esferas de luz radiais em CSS Puro, e containers com fundo translúcido fosco (`backdrop-blur`).
   - Todos os painéis de serviços carregam emblemas premium unificados para preservar a coesão "Enterprise Gold Standard".

## Glossário de Domínio
- **AppSwitcher**: A grade de seleção com super-ícones lançadores que aparece logo após o login informando os aplicativos disponíveis (Módulos do ERP ou Extranets).
- **JWT (Json Web Token)**: Comprovante de sessão mestre, armazenado via `localStorage` na camada do hub.
- **Module Tile (Card de Módulo)**: Elemento interativo do AppSwitcher responsável pelo redirecionamento entre origens.
- **Monolito/Nexus ERP**: A infraestrutura legado rodando em `localhost:5173` dividida em Gestão (Executive), Operações (Ops) e Vendas (Commercial).

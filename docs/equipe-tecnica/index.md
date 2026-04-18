# Guia de Competências Técnicas — Projeto Kurupira

> Este documento descreve as habilidades, tecnologias e mentalidade necessárias para um Engenheiro de Software atuar no desenvolvimento e manutenção do ecossistema Kurupira.

---

## 🏗 Pilares de Ouro (O Canon)

Ninguém programa no Kurupira sem entender as premissas inegociáveis do **Canon Arquitetural**. O desenvolvedor deve ser capaz de seguir estes 3 princípios:

1.  **Separação de Domínios (Catálogo ≠ Inventário)**: Entender que itens do banco de dados (schema profundo) são diferentes de itens no estado da aplicação (schema plano/transacional).
2.  **Estado Normalizado (Zustand + Zundo)**: Gerenciar estados complexos sem aninhamento profundo, garantindo suporte a Undo/Redo (Ctrl+Z) e throttling de performance.
3.  **Integração WebGL + DOM**: Saber que a interface (React) e a renderização gráfica (Three.js/Leaflet) operam em canais diferentes, evitando re-renders desnecessários no canvas.

---

## 🛠 Stack Tecnológica Resumida

### Frontend
- **Framework**: React 19 (Hooks, Portals)
- **Engine Gráfica**: Leaflet.js (Mapas) + React Three Fiber (WebGL 3D Overlay)
- **Estado**: Zustand (Slices Pattern) + Zundo (Histórico)
- **Tipagem e Validação**: TypeScript + Zod

### Backend
- **Runtime**: Node.js + Express 5
- **Persistência**: Prisma ORM + MySQL
- **Segurança**: JWT, Bcrypt, Rate Limiting

---

## 📂 Estrutura da Documentação

Para aprofundar em cada área, consulte os documentos específicos:

1.  **[Habilidades Frontend](./frontend.md)**: Manipulação de mapas, 3D paramétrico e performance reativa.
2.  **[Habilidades Backend](./backend.md)**: Modelagem de dados solar-centric, APIs performantes e segurança.
3.  **[Conhecimento de Domínio](./conhecimento-dominio.md)**: O que um dev precisa entender de Engenharia Solar (Voc, Isc, PR, Irradiância).

---

## 🚀 Como começar?

Para qualquer nova funcionalidade, o desenvolvedor deve seguir o fluxo **Spec-Driven**:
1.  Ler a Spec no `.agent/aguardando/`
2.  Validar contra o código atual utilizando ferramentas de análise estática (`tsc`).
3.  Garantir que não quebra a performance de GPU do Center Canvas.

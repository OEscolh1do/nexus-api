# Planejamento: Refatoração do CustomerTab (CRM Cliente)

**Status:** Rascunho Inicial
**Origem:** Item mapeado como "Fora de Escopo" na Especificação Técnica UX-001 (Refatoração do Kurupira).
**Componente Legado:** `src/modules/engineering/tabs/CustomerTab.tsx`

## 1. Contexto
O `CustomerTab` original aglomerava as informações do cliente (nome, localização, meta energética, distribuidora, tarifa) em uma aba do módulo de Engenharia. 

Com a transição para a Arquitetura de Workspace (onde a tela inteira é dedicada ao Canvas de desenho e design do sistema), os formulários de entrada do Cliente deixam de pertencer ao escopo estrito de "Engenharia (WebGL/Leaflet)" e possivelmente devem ser movidos para uma etapa anterior (CRM / Qualificação do Projeto) ou para um painel unificado de "Propriedades do Projeto".

## 2. Perguntas em Aberto para Definição de Escopo
1. **Novo Local:** O `CustomerTab` continuará dentro do Kurupira (Engineering Workspace) como um botão acessível pela Ribbon? Ou ele subirá de nível para o Hub (`ProfileOrchestrator`), sendo preenchido antes mesmo de abrir o Canvas de Arquitetura?
2. **Distribuição do Estado:** O estado de tarifa e histórico de consumo ainda reside no `clientSlice` dentro do `solarStore`. Vamos separar o Lead/Cliente da Engenharia base?
3. **UX/UI:** Se for ficar no Kurupira, devemos criar um *Overlay Modal Dialog* (parecido com o catálogo) ou um *Bottom Panel*?

## 3. Próximos Passos
- [ ] Analisar a complexidade do componente legado (`CustomerTab.tsx`).
- [ ] Refinar as dependências de estado do `useSolarStore`.
- [ ] Elaborar a Especificação Técnica estrutural desta fatia.

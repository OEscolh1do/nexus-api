# Especificação Técnica: Fase P7 - Reintegração CRM + Proposta Visual

## 1. Visão Geral do Épico
Após a visualização ser garantida em P5 e a engenharia validada em P6, o passo final no SaaS é o modelo de negócio: converter a simulação em vendas. A Fase P7 cobre o fechamento do circuito, conectando o output do motor `SolarCalculator` com o CRM/Proposal Engine do sistema Neonorte, viabilizando o "Handover Escopo -> Venda".

---

## 2. Objetivos Principais
- Garantir que a saída (`SolarOutput`) gerada pelo Canvas sirva de insumo automático para documentos PDF e faturamento.
- Integrar a camada "Comercial" presente de forma limitada hoje no HUD aos funis de CRM.

---

## 3. Requisitos Arquiteturais
1. **Padrão Command para Exports:**
   Na `TopRibbon` atual já existe um ícone de exportar/Salvar. Este comando deve engatar uma comunicação backend via Server Actions para encapsular o Zustand JSON inteiro num Payload de `ProjectSnapshot`.
2. **Separação Estado WebGL vs Documentação:**
   Como a proposta visual depende de capturas rasterizadas do sistema Leaflet, precisamos de rotinas `canvas.toDataURL()` implementadas nativamente atreladas aos botões da Ribbon, gerando anexos base64 para PDFs automáticos.

---

## 4. Etapas de Implementação (Sub-fases P7)

### P7-1: Geração de Proposta Automática (Visual Payload)
- Criar a mecânica de "Snapshot" que extrai a visualização 3D/Map atual (foto satélite + módulos renderizados).
- Incorporar as métricas de simulação do `useTechStore` (KPIs financeiros do P2).

### P7-2: API de Persistência Backend
- Modificar o middleware `persist` atual que salva no `localStorage`, criando uma ponte REST para um banco de dados hospedado quando o "Vendedor/Engenheiro" clicar no Dropdown "Status: Aprovado" (criado no P3-1 da TopRibbon).

### P7-3: Relatórios Resumidos B2B
- Estruturar a via de relatórios, mapeando os 6 componentes (Kit, Serviço, Margens, etc.) da `ServiceComposition` do SolarCalculator em uma tabela de visualização limpa.

---

## 5. Critérios de Aceite
- [ ] Mudar aba de Rascunho para Aprovado engatilha um "Salvar no Banco".
- [ ] O sistema permite extrair um JSON blindado de Engenharia (`ProjectSnapshot` completo incluindo posições trigonométricas) para processadores de O.S (Ordem de Serviço).

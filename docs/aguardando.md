# 🕒 AGUARDANDO (Tech Debt & Roadmap)

Este documento rastreia dívidas técnicas e features pendentes de alta prioridade.

---

## 🟢 1. INTEGRAÇÕES DE DADOS (Alta Prioridade)
- [x] **1.A. Integração Completa de Radiação com Coordenadas**
    - [x] Recuperar HSP real via `clientData.weatherData` ou API de lat/lng em tempo real.
    - [x] Sincronizar com `calcKWpAlvo` para precisão no dimensionamento preliminar.
- [x] **1.B. Integração de Store em Relatórios**
    - [x] Componentes em `src/modules/documentation/components` (TechnicalMemorandum, Checklist) devem puxar dados reais da `useSolarStore`.

## 🟡 2. DOCUMENTAÇÃO E COMPLIANCE
- [x] **2.A. Exportação PDF da Documentação**
    - [x] Implementar trigger de download para o Memorial Descritivo em PDF.
- [x] **2.B. Check de Comissionamento em Campo**
    - [x] Permitir que o usuário interaja com o checklist no navegador antes de exportar.

## 🔴 3. ARQUITETURA E CLEANUP
- [x] **3.A. Refatoração PhysicalCanvasView**
    - [x] Arquivo com 900+ linhas. Separar lógica de engine Leaflet de UI Components (Anatomy, Overlays).
- [x] **3.B. Remoção de Dead Code (Cleanup v3.8)**
    - [x] Deletar `ComposerPlaceholder.tsx`.
    - [x] Limpar comentários obsoletos em `ConsumptionCanvasView`.
- [x] **3.C. Padronização de Termos (Legal/Marketing)**
    - [x] Remover referências a "CRESESB" e "NASA POWER" da interface final, substituindo por "Base de Dados Local" ou "Série Histórica".

---

## 🚀 ROADMAP FUTURO (Backlog)
- [ ] **Integração com CRM (Webhooks)**: Sincronizar status do projeto de volta para o Neonorte ERP.
- [ ] **Multiplayer Presence**: Mostrar cursores de outros engenheiros no mapa (Ably/Pusher).
- [ ] **3D Roof Analysis**: Extrusão de telhados simples via metadados de inclinação.

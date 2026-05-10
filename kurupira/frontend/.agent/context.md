# CONTEXT.md — Kurupira (Engenharia Solar SaaS)

> **Última Atualização:** 2026-05-10
> **Arquiteto:** Antigravity AI
> **Versão do Módulo:** 6.1.0 (Solar Lobby Milestone)

---

## 📋 VISÃO GERAL

**Kurupira** é o coração técnico do ecossistema Ywara. É uma plataforma B2B SaaS especializada em engenharia fotovoltaica de alta precisão, permitindo que integradores e engenheiros projetem, simulem e gerem propostas comerciais completas.

O foco é a **Experiência do Engenheiro**: densidade de dados, precisão funcional e uma estética "Industrial Engineering" que transmite confiança e rigor técnico.

| Aspecto | Detalhe |
|---------|--------|
| **Papel** | Kurupira: O Motor de Engenharia / SaaS B2B |
| **Usuários** | Integradores, Engenheiros e Projetistas (Clientes da Neonorte) |
| **Porta Backend** | 3002 |
| **Porta Frontend** | 5174 (dev - variável conforme disponibilidade) |
| **IAM (Auth)** | Logto Cloud (OIDC) |

---

## 🏗️ STACK TÉCNICO

### Frontend
- **Framework**: Vite + React 19 + TypeScript
- **State Management**: 
  - **Global**: Zustand (com persistência e middleware Zundo para Undo/Redo)
  - **Server**: React Query (NexusClient)
- **Visualização**: 
  - **2D/Cartografia**: Leaflet 1.9.4 + Geoman (Polígonos)
  - **3D/Simulação**: Three.js + React Three Fiber (R3F)
- **UI System**: Vanilla CSS + Tailwind 3.4 (rounded-sm grid)
- **Auth SDK**: @logto/react

---

## 🧩 MÓDULOS & VISÕES

| Módulo | Responsabilidade |
|--------|-----------------|
| **Lobby de Entrada** | Portal de acesso com rastreamento solar em tempo real e estética industrial. |
| **Project Explorer** | Gestão de portfólio de projetos com metadados de engenharia. |
| **Consumption Canvas** | Modelagem de carga e análise de faturas de energia. |
| **Solar Canvas** | Desenho de arranjos, sombreamento e simulação de irradiância. |
| **Electrical Canvas** | Diagramas de bloco, dimensionamento de strings e inversores. |
| **Financial Engine** | Cálculo de ROI, Payback e Fluxo de Caixa (Lei 14.300). |

---

## 🎨 PADRÕES DE DESIGN (ENGINEERING UI)

1. **Estética Industrial**: Uso de cores sóbrias (`slate-900`, `emerald-500`), bordas afiadas (`rounded-sm`) e tipografia técnica.
2. **Performance-First**: Animações processadas via GPU (`transform`/`opacity`) para garantir fluidez em viewports de desenho pesado.
3. **Ghost Scrollbars**: Barras de rolagem de 6px ocultas por padrão, visíveis no hover (padrão global Ywara).
4. **Localização**: 100% PT-BR para toda a interface visível ao integrador. Termos técnicos em inglês apenas se forem padrão de mercado (kWp, MPPT, etc).

---

## 🏛️ DECISÕES ARQUITETURAIS RECENTES

### Lobby de Engenharia (Solar Tracker)
**Data**: 2026-05-10 | **Status**: ✅ Concluído
- **Conceito**: Transformação da página de login em uma "Sala de Espera de Engenharia".
- **Lógica Solar**: Implementação de um `Solar Tracking Node` que calcula a posição real do sol baseada na hora local do navegador.
- **Sky Engine**: Fundo dinâmico que altera as cores do céu (Amanhecer, Dia, Entardecer, Noite) automaticamente.
- **Normalização Logto**: Ajuste no `signOut` para garantir redirecionamento correto para o login via `postLogoutRedirectUri`.

---

## 🔄 CHANGELOG (Módulo Kurupira)

### v6.1.0 (2026-05-10) — Solar Lobby & Precision UI
- ✅ **Lobby Refactor**: Nova interface de entrada com estética de cockpit e rastreamento solar real.
- ✅ **Telemetry UI**: Adição de etiquetas de Elevação e Posição solar no background do login.
- ✅ **Auth Stabilization**: Correção de loops de redirecionamento no logout via `AuthProvider`.
- ✅ **PT-BR 100%**: Tradução completa de toda a interface de acesso, removendo jargões desnecessários em inglês.

### v6.0.0 (2026-05-07) — Engineering Cockpit 2.0
- ✅ **Layout Unificado**: Transição para layout de coluna única com indicadores laterais.
- ✅ **Performance Tuning**: Otimização de renderização do canvas de desenho.

---

## ⏳ GAPS IDENTIFICADOS

- [ ] **Sincronização de Latitude**: Atualmente o sol usa uma parábola padrão 06h-18h. Futuro: Usar API de localização para arco astronômico exato.
- [ ] **Offline Mode**: Estratégia de Service Worker para permitir visualização de projetos sem internet.

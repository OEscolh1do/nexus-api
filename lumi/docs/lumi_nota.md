---
projeto: Lumi
tags:
  - projeto/ativo
  - area/saas
status: ativo
carga_atp: 5
prazo: 2026-02-28
---

# 🚀 Projeto: Lumi (Motor de Propostas Solares)

> [!ABSTRACT] O Gancho de Dopamina
> **Por que isso é fascinante?** Trata-se do desenvolvimento de uma plataforma SaaS (Single Page Application via Vite) escalável e modular para o setor de energia solar fotovoltaica. A arquitetura atual (V3.2 Full-Height) é um prato cheio de engenharia de software, integrando de ponta a ponta: CRM (com mapa e simulação térmica), dimensionamento técnico, elétrico, simulação de documentação, motor financeiro e geração de propostas/contratos, tudo orquestrado pelo `ProfileOrchestrator` e perfeitamente gerenciado por estado global via `Zustand` (SolarStore). É o coração comercial e técnico da operação perfeitamente integrado.

## 🗺️ Micro-Quests (Baixa Demanda)
> [!TIP] Missões minúsculas reduzem a paralisia de iniciação e o PDA.
- [x] Concluir o mapeamento e auditoria dos módulos CRM, Engenharia e Proposta.
- [x] Resolver bug crítico de formatação (Input Mask) nas abas de Precificação e Consumo (CRM).
- [x] Modularizar e documentar de acordo com Padrão V3 grandes componentes (`PricingTab`, `TechStatusBar`, `StringConfigurator`).
- [ ] O menor passo possível hoje é revisar como o `ProfileOrchestrator` faz o roteamento dos 7 domínios da aplicação.
- [ ] Seria interessante explorar como as `Settings` (Premissas Globais) agora alimentam os cálculos de módulos reativamente em toda a aplicação.

## 🔗 Conexões e Contexto
- **MOC Relacionado:** [[MOC_Energia_Solar]], [[MOC_SaaS]]
- **Pessoas Chave:** Neonorte Tecnologia, Equipe de Engenharia / Vendas.
- **Repositório Central:** `lumi`
- **Docs Importantes:** `ARCHITECTURE.md`, `MODULES_DETAIL.md`, `STATE_MANAGEMENT.md`.

## 📊 Progresso (Dataview)
```dataview
TASK
FROM "Lumi (Motor de Propostas Solares)"
WHERE !completed
```

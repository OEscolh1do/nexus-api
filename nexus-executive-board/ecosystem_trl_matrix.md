# TRL Matrix do Ecossistema: Nexus Platform
*Atualizado em: 11/03/2026*

| Módulo (Spoke) | Nível (TRL) | Status Operacional | Gargalo Crítico / Próximo Gate |
|----------------|-------------|--------------------|--------------------------------|
| **Nexus API** | TRL 8 | Operacional / Cloud (Fly.io) | Consolidação de IAM / Validação Opaque Tokens em Cross-Domain. |
| **Nexus Hub** | TRL 7 | Beta / Edge Cloud (Pages) | Resiliência de Transporte do JWT (SSO) para os apps-filhos. |
| **Nexus ERP** | TRL 7 | Beta / Edge Cloud (Pages) | UAT (User Acceptance Testing) Fim a Fim cruzando com Hub. |
| **Lumi** | TRL 7 | Beta / Edge Cloud (Pages) | Teste integral de payload com DB via API / Catálogos. |
| **Academy** | TRL 4 | Componentização UI/Mock | Ausência de Views de Player e Storage Integrado (CDN). |
| **Client Portal** | TRL 4 | Componentização UI/Mock | Dependência de mapeamento restrito de RLS na Nexus API. |
| **Vendor Portal** | TRL 4 | Componentização UI/Mock | Necessita PWA-Offline Storage para Operação Brutal. |

> **Legenda Rápida de TRL Corporativo:**
> - **TRL 1 a 3:** Pesquisa e Prova de Conceito (Arquitetônica).
> - **TRL 4 a 5:** Laboratório (Mockups de UI, Front-end isolado sem backend final).
> - **TRL 6:** Protótipo Relevante na Nuvem.
> - **TRL 7:** Demonstração do Sistema Beta em Ambiente Operacional.
> - **TRL 8:** Sistema Completamente Integrado, Qualificado (Segurança) e Operacional.
> - **TRL 9:** Missão Cumprida: Sistema escalando em Massa sem atritos com sucesso contínuo.

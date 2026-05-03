# CONTEXT.md — Ecossistema YWARA (Visão Global)

> **Última Atualização:** 2026-05-01
> **Arquiteto:** Antigravity AI
> **Versão do Ecossistema:** 4.0.0 (Era Ywara)

---

## 📋 VISÃO GERAL (O CONCEITO YWARA)

O ecossistema **Ywara** (Andar Superior na cosmologia Tupi) representa a infraestrutura celeste da Neonorte. É o hub de orquestração onde residem os heróis culturais (Sol/Guaraci) e onde são decididos os ciclos climáticos (regras de negócio e lógica de plataforma).

Este hub orquestra domínios autônomos, cada um com frontend + backend + schema MySQL dedicado:

| Módulo | Codinome | Papel | Porta BE | Porta FE |
|--------|----------|-------|----------|----------|
| **Hub / Root** | **Ywara** | Infraestrutura e orquestração celeste | - | - |
| **Admin** | **Sumaúma** | Backoffice (O pilar central que conecta e sustenta o ecossistema. **Acesso exclusivo para gestão do Ywara. Demais usuários do ecossistema NÃO devem ter acesso.**) | 3003 | 5175 |
| **Engenharia** | **Kurupira** | Motor Solar (O protetor técnico da floresta) | 3002 | 5173 |
| **ERP** | **Iaçã** | Gestão e Prosperidade (O fruto que alimenta o negócio) | 3001 | 5174 |

---

## 🏗️ INFRAESTRUTURA & STACK

| Camada | Tecnologia |
|--------|-----------|
| **Orquestração** | Docker Compose (Otimizado para VPS 2GB) |
| **Banco de Dados** | MySQL 8 (Tuning: 256MB Buffer) — schemas: `db_iaca`, `db_kurupira`, `db_sumauma` |
| **ORM** | Prisma 5.10 (um client por serviço) |
| **Auth** | Logto (Hybrid Cloud: Cloud IAM + Local Apps) |
| **Backend Pattern** | Node.js (CommonJS) + Express |
| **Frontend Pattern** | Vite + React + TypeScript + Tailwind CSS (dark-mode only) |
| **Ícones** | Lucide React |

---

## 📡 ARQUITETURA DE COMUNICAÇÃO ENTRE SERVIÇOS

```
Sumaúma (BFF / Admin)
    │
    ├── Leitura direta → Prisma read-only → db_iaca / db_kurupira
    │
    └── Mutações → M2M HTTP (Axios + X-Service-Token) → Iaçã API / Kurupira API
```

**Regra de ouro:** O `Sumaúma` **nunca** faz INSERT/UPDATE/DELETE direto nos bancos irmãos. Toda mutação passa pelo serviço dono do dado.

### Variáveis de Ambiente (Dev)

| Variável | Valor |
|----------|-------|
| `IACA_INTERNAL_URL` | `http://localhost:3001` |
| `KURUPIRA_INTERNAL_URL` | `http://localhost:3002` |
| `DATABASE_URL_IACA_RO` | `mysql://user_admin:admin_S3cur3_2026!@localhost:3306/db_iaca` |
| `DATABASE_URL_KURUPIRA_RO` | `mysql://user_admin:admin_S3cur3_2026!@localhost:3306/db_kurupira` |
| `M2M_SERVICE_TOKEN` | `m2m_guardioes_secret_2026!` |

---

## 🧩 ESTRUTURA DE AGENTE (`.agent` Hierárquico)

Este ecossistema usa uma estratégia **Híbrida em 3 Camadas** para maximizar a precisão do Antigravity:

/.agent/           ← CAMADA 1: Ywara (workflows, skills transversais)
kurupira/.agent/   ← CAMADA 2: Kurupira (Motor PV, canvas, cálculo elétrico)
sumauma/.agent/    ← CAMADA 3: Sumaúma (Backoffice, BFF, Tenants)
iaca/.agent/       ← CAMADA 3: Iaçã (ERP, CRM)

**Regra:** Skills de domínio específico **não** ficam na raiz global. A raiz contém apenas skills transversais (segurança, orquestração, arquitetura).

---

## 🔑 PADRÕES CROSS-CUTTING

### Idioma e Localização
1. **Prioridade PT-BR**: Todo texto visível ao usuário final em **Português do Brasil**.
2. **Exceções (Siglas Técnicas)**: Permitido apenas quando padrão de mercado — `kWp`, `kWh`, `V`, `A`, `MPPT`, `HSP`, `M2M`, `Webhook`.
3. **Consistência de Tradução**: `Updated At` → `Atualizado em`; `Empty State` → mensagens em PT-BR.

### Código
- **Backend**: CommonJS (`require`/`module.exports`) em todos os serviços.
- **Frontend**: ESM (`import`/`export`) + TypeScript strict.
- **Naming**: camelCase (variáveis/funções), PascalCase (componentes React), kebab-case (arquivos CSS/rotas).

### Design (Dark-Mode Only)
- `rounded-sm` (4px) é o máximo em painéis estruturais.
- `font-mono tabular-nums` em todos os valores numéricos técnicos.
- Datas em `dd/MM/yyyy HH:mm` (PT-BR).
- Sem animações de entrada desnecessárias — dados aparecem instantaneamente.

---

## 🔄 CHANGELOG DO ECOSSISTEMA

| v4.1.0 | 2026-05-02 | **Infra Otimizada**: Migração para Logto Cloud, Tuning de MySQL (256MB) e suporte a VPS 2GB |
| v4.0.0 | 2026-05-01 | **A Era Ywara**: Rebranding completo e renomeação de pastas (Hub -> Ywara, Admin -> Sumaúma) |
| v3.8.1 | 2026-04-18 | Kurupira: Refatoração Consumo + Ghost Scrollbars |
| v3.8.0 | 2026-04-16 | Kurupira: MapCore Multi-Modo + Jornada do Integrador |
| v3.7.0 | 2026-04-15 | Kurupira: Rigor Elétrico + Multi-MPPT |
| v1.0.0 | 2026-04-30 | Sumaúma: Bootstrap do Backoffice |

> Para o changelog detalhado de cada serviço, consulte o `context.md` local do respectivo módulo.

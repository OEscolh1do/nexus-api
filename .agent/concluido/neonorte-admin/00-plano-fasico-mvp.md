# Neonorte Admin — Plano Fásico MVP

> **Objetivo:** Entregar um painel de gestão operacional funcional (God-Mode) para administrar tenants, usuários, catálogo FV e auditoria da plataforma Neonorte.

---

## Estado de Partida (2026-05-01)

A infraestrutura está **100% scaffolded** e funcional:
- Backend BFF (Express + Prisma) rodando na porta 3003 ✅
- Frontend (Vite + React + Tailwind v4) rodando na porta 5175 ✅
- Autenticação JWT (`PLATFORM_ADMIN`) funcionando ✅
- Dashboard com KPIs reais do banco ✅
- MySQL local (Docker) com `db_iaca` e `db_kurupira` sincronizados ✅

**Pendente:** As 5 páginas de gestão ainda são "stubs" (empty state). O MVP é preencher cada uma.

---

## Arquitetura de Referência

```
Frontend (5175)  →  BFF (3003)  →  db_iaca (READ-ONLY via user_admin)
                             →  db_kurupira (READ-ONLY via user_admin)
                             →  Iaçã (3001) via M2M Token (mutações)
                             →  Kurupira (3002) via M2M Token (mutações)
```

**Regra de Ouro:** O Admin BFF **nunca escreve diretamente** nos bancos dos produtos. Toda mutação é delegada via chamada HTTP M2M ao serviço dono dos dados.

---

## Fases do MVP

### Fase 1 — Core de Gestão (Semana 1)
**Critério de sucesso:** Operador consegue ver, filtrar, bloquear/desbloquear tenants e usuários.

| # | Módulo | Spec |
|:---|:---|:---|
| 1.1 | Tenants (Organizações) | `01-tenants.md` |
| 1.2 | Usuários | `02-users.md` |

### Fase 2 — Catálogo Global (Semana 2)
**Critério de sucesso:** Operador consegue gerenciar o inventário de módulos FV e inversores (upload .pan/.ond, ativar/desativar).

| # | Módulo | Spec |
|:---|:---|:---|
| 2.1 | Catálogo FV | `03-catalog.md` |

### Fase 3 — Rastreabilidade (Semana 3)
**Critério de sucesso:** Operador consegue auditar qualquer ação da plataforma com filtros e exportação.

| # | Módulo | Spec |
|:---|:---|:---|
| 3.1 | Auditoria | `04-audit.md` |

### Fase 4 — Observabilidade (Semana 4)
**Critério de sucesso:** Operador consegue monitorar saúde dos serviços e gerenciar sessões ativas.

| # | Módulo | Spec |
|:---|:---|:---|
| 4.1 | Sistema / Healthcheck | `05-system.md` |

---

## Definição de MVP Completo

O serviço é considerado **MVP** quando:
- [ ] Fase 1 concluída e testada
- [ ] Fase 2 concluída e testada
- [ ] Fase 3 concluída e testada
- [ ] Fase 4 concluída e testada
- [ ] Login funcional com `PLATFORM_ADMIN`
- [ ] Dashboard com KPIs reais
- [ ] Nenhum dado sensível exposto no console/rede
- [ ] README.md na raiz do `neonorte-admin/` com instruções de setup

---

## Padrões de UI (Design System)

- **Dark-mode obrigatório** — `bg-slate-950` base
- **DataGrid padrão:** tabela com colunas ordenáveis, paginação de 20 linhas, busca inline
- **Ações:** botões `icon + label` em hover de linha (não em coluna fixa)
- **Confirmação destrutiva:** modal com texto de confirmação digitado pelo operador
- **Badges:** usar as classes `.badge-active`, `.badge-blocked`, `.badge-pending` do `index.css`
- **Tipografia tabular:** usar classe `.font-tabular` para números e IDs
- **Feedback de ação:** Toast (top-right, 3s) para sucesso e erro de mutações M2M

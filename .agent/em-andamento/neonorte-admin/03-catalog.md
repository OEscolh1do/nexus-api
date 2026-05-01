# Spec — Módulo 03: Catálogo FV

> **Fase:** 2 (Catálogo Global)  
> **Prioridade:** Alta  
> **Estimativa:** 2–3 dias

---

## 1. Problema de Negócio

A plataforma Kurupira usa um catálogo global de módulos fotovoltaicos e inversores. O operador da Neonorte precisa gerenciar este catálogo: importar novos equipamentos via arquivos `.pan` e `.ond` do PVSyst, ativar/desativar equipamentos e garantir a integridade dos dados técnicos.

## 2. Usuário Final

Operador da Neonorte com role `PLATFORM_ADMIN`.

---

## 3. Critérios de Aceitação (Definition of Done)

### 3.1 Layout — Split View (Módulos / Inversores)
- [ ] Duas abas ou painéis lado a lado: **Módulos FV** e **Inversores**
- [ ] Cada painel tem seu próprio DataGrid independente

### 3.2 Módulos FV (`ModuleCatalog`)
- [ ] Colunas: **Fabricante**, **Modelo**, **Potência (Wp)**, **Tecnologia**, **Status** (Ativo/Inativo), **Cadastrado em**, **Ações**
- [ ] Busca por fabricante ou modelo
- [ ] Filtro por Status e Tecnologia (Mono/Poli/Bifacial)
- [ ] Upload de arquivo `.pan` → validação + criação via M2M ao Kurupira
- [ ] Ativar / Desativar via toggle inline
- [ ] Drawer de detalhe com todos os parâmetros técnicos (Pmax, Voc, Isc, Vmp, Imp, coeficientes térmicos)

### 3.3 Inversores (`InverterCatalog`)
- [ ] Colunas: **Fabricante**, **Modelo**, **Potência AC (kW)**, **Tensão MPPT**, **Fases**, **Status**, **Cadastrado em**, **Ações**
- [ ] Busca por fabricante ou modelo
- [ ] Filtro por Status e Fases (1F / 3F)
- [ ] Upload de arquivo `.ond` → validação + criação via M2M ao Kurupira
- [ ] Ativar / Desativar via toggle inline
- [ ] Drawer de detalhe com parâmetros elétricos (Vmax, Vmin MPPT, Vmax MPPT, Imax, Pnom)

### 3.4 Upload de Arquivo
- [ ] Drag & drop + seleção de arquivo
- [ ] Validação de extensão (.pan / .ond) no frontend antes do envio
- [ ] Preview dos campos principais extraídos antes de confirmar o cadastro
- [ ] Feedback de sucesso/erro com nome do equipamento cadastrado

---

## 4. Fora do Escopo

- Edição manual dos parâmetros técnicos (apenas upload de arquivo)
- Deleção permanente de equipamentos (apenas desativação)
- Gerenciamento de equipamentos por tenant específico

---

## 5. Interfaces de Dados

### Leitura (Prisma Read-Only → `db_kurupira`)
```typescript
// ModuleCatalog
{
  id: string
  manufacturer: string
  model: string
  powerWp: number
  technology: string
  isActive: boolean
  createdAt: Date
  // Parâmetros técnicos do drawer:
  voc: number
  isc: number
  vmp: number
  imp: number
  tempCoeffPmax: number
  tempCoeffVoc: number
}

// InverterCatalog
{
  id: string
  manufacturer: string
  model: string
  nominalPowerAC: number
  phases: number
  isActive: boolean
  createdAt: Date
  // Parâmetros técnicos do drawer:
  vMaxDC: number
  vMinMPP: number
  vMaxMPP: number
  iMaxDC: number
}
```

### Mutações (M2M → Kurupira)
```
POST /kurupira/admin/catalog/modules     (upload .pan)
POST /kurupira/admin/catalog/inverters   (upload .ond)
PATCH /kurupira/admin/catalog/modules/:id    { "isActive": boolean }
PATCH /kurupira/admin/catalog/inverters/:id  { "isActive": boolean }
```

---

## 6. Rotas Backend (BFF) a Implementar/Verificar

| Método | Rota | Descrição |
|:---|:---|:---|
| `GET` | `/admin/catalog/modules` | Lista módulos com filtros |
| `GET` | `/admin/catalog/inverters` | Lista inversores com filtros |
| `POST` | `/admin/catalog/modules` | Upload .pan → proxy M2M |
| `POST` | `/admin/catalog/inverters` | Upload .ond → proxy M2M |
| `PATCH` | `/admin/catalog/modules/:id` | Ativar/desativar via M2M |
| `PATCH` | `/admin/catalog/inverters/:id` | Ativar/desativar via M2M |

---

## 7. Componentes Frontend a Criar

| Arquivo | Descrição |
|:---|:---|
| `src/pages/CatalogPage.tsx` | Página com abas Módulos / Inversores |
| `src/components/catalog/ModulesDataGrid.tsx` | Grid de módulos |
| `src/components/catalog/InvertersDataGrid.tsx` | Grid de inversores |
| `src/components/catalog/EquipmentUploadZone.tsx` | Drop zone reutilizável |
| `src/components/catalog/ModuleDrawer.tsx` | Drawer de detalhe técnico |
| `src/components/catalog/InverterDrawer.tsx` | Drawer de detalhe técnico |
| `src/hooks/useCatalog.ts` | Hook de dados para módulos e inversores |

---

## 8. Riscos e Alertas

> [!WARNING]
> O parsing de arquivos `.pan` e `.ond` deve ocorrer **no Kurupira** (que já tem a skill `parser-panond`), não no Admin BFF. O BFF apenas faz proxy do arquivo multipart para o Kurupira.

> [!IMPORTANT]
> Antes de implementar, verificar se o Kurupira já expõe endpoints `PATCH` para ativar/desativar equipamentos do catálogo com autenticação M2M. Se não, o endpoint M2M precisa ser criado no Kurupira primeiro.

> [!NOTE]
> O skill `validador-pan` e `validador-ond` devem ser usados ao implementar o preview de confirmação para garantir que parâmetros inválidos sejam rejeitados antes do cadastro.

---
name: catalog-backoffice
description: Especialista na gestão do Catálogo Global de equipamentos fotovoltaicos (ModuleCatalog e InverterCatalog) via neonorte-admin. Ative ao implementar listagem, adição, edição, ativação/desativação ou upload de arquivos .pan/.ond no contexto do backoffice. Cobre a orquestração entre o Admin BFF e o Kurupira API para validação técnica dos parâmetros elétricos antes da persistência.
---

# Skill: Catalog Backoffice

## Gatilho Semântico

Ativado quando:
- O agente precisa implementar gestão de `ModuleCatalog` ou `InverterCatalog` no Admin
- A tarefa envolve upload/importação de arquivos `.pan` (módulos) ou `.ond` (inversores) pelo backoffice
- É necessário ativar/desativar equipamentos do catálogo global
- Qualquer menção a: `catálogo`, `inventário de equipamentos`, `módulos FV`, `inversores`, `.pan`, `.ond`, `catalog-backoffice`, `neonorte-admin/catalog`
- Alterações nas rotas `/admin/catalog/*` do BFF

## Protocolo

### 1. Modelo de Dados (Referência — db_kurupira)

O Admin BFF **lê** diretamente estes modelos do `db_kurupira`:

```
ModuleCatalog
├── id, manufacturer, model (unique)
├── powerWp, efficiency, dimensions, weight
├── bifacial, bifacialityFactor, noct
├── tempCoeffVoc, tempCoeffPmax, cellSizeClass
├── degradacaoAnual, datasheet, imageUrl
├── isActive, electricalData (JSON)
└── unifilarSymbolRef

InverterCatalog
├── id, manufacturer, model (unique)
├── nominalPowerW, maxInputV, mpptCount, efficiency
├── Voc_max_hardware, Isc_max_hardware
├── coolingType, afci, rsd, portaria515Compliant
├── isActive, electricalData (JSON)
└── datasheet, imageUrl, unifilarSymbolRef
```

### 2. Operações por Tipo

#### Leituras (via Prisma READ-ONLY → db_kurupira)

| Operação | Endpoint | Detalhes |
|:---|:---|:---|
| Listar módulos | `GET /admin/catalog/modules` | Paginado, filtro por manufacturer, powerWp range, isActive |
| Listar inversores | `GET /admin/catalog/inverters` | Paginado, filtro por manufacturer, nominalPowerW range, isActive |
| Detalhar módulo | `GET /admin/catalog/modules/:id` | Include `electricalData` completo |
| Detalhar inversor | `GET /admin/catalog/inverters/:id` | Include `electricalData` completo |
| Estatísticas | `GET /admin/catalog/stats` | Count por manufacturer, média de powerWp, itens ativos vs inativos |

#### Escritas (via M2M HTTP → Kurupira API)

| Operação | Endpoint Admin | Rota Kurupira (interna) | Observações |
|:---|:---|:---|:---|
| Adicionar módulo | `POST /admin/catalog/modules` | `POST /internal/catalog/modules` | Kurupira faz parse do .pan e valida parâmetros |
| Editar módulo | `PUT /admin/catalog/modules/:id` | `PUT /internal/catalog/modules/:id` | Atualizar specs, datasheet URL |
| Ativar/Desativar | `PATCH /admin/catalog/modules/:id` | `PATCH /internal/catalog/modules/:id` | Toggle `isActive` |
| Adicionar inversor | `POST /admin/catalog/inverters` | `POST /internal/catalog/inverters` | Kurupira faz parse do .ond e valida |
| Editar inversor | `PUT /admin/catalog/inverters/:id` | `PUT /internal/catalog/inverters/:id` | Atualizar specs |
| Ativar/Desativar | `PATCH /admin/catalog/inverters/:id` | `PATCH /internal/catalog/inverters/:id` | Toggle `isActive` |

### 3. Fluxo de Upload de Arquivo .pan/.ond

```
1. Operador seleciona arquivo .pan no frontend Admin
2. Admin Frontend envia POST /admin/catalog/modules (multipart/form-data)
3. Admin BFF recebe o arquivo
4. Admin BFF faz POST /internal/catalog/modules para o Kurupira API
   → Header: X-Service-Token (M2M)
   → Body: multipart com o arquivo
5. Kurupira API:
   a. Faz parse do .pan (skill: parser-panond)
   b. Valida parâmetros elétricos (skill: validador-pan)
   c. Se válido → salva no ModuleCatalog → retorna 201 com o objeto criado
   d. Se inválido → retorna 422 com lista de erros de validação
6. Admin BFF propaga resposta para o frontend
7. Frontend exibe toast de sucesso ou painel de erros de validação
```

### 4. Exibição de Dados no Frontend

#### Colunas da DataGrid de Módulos

| Coluna | Tipo | Largura |
|:---|:---|:---|
| Status | Badge (Active/Inactive) | 80px |
| Fabricante | Text | 160px |
| Modelo | Text (mono) | 200px |
| Potência (Wp) | Number (mono, 0 decimais) | 100px |
| Eficiência (%) | Number (mono, 1 decimal) | 100px |
| Bifacial | Boolean (ícone) | 80px |
| NOCT (°C) | Number (mono) | 80px |
| Coef. Voc (%/°C) | Number (mono, 3 decimais) | 120px |
| Ações | Buttons | 120px |

#### Colunas da DataGrid de Inversores

| Coluna | Tipo | Largura |
|:---|:---|:---|
| Status | Badge (Active/Inactive) | 80px |
| Fabricante | Text | 160px |
| Modelo | Text (mono) | 200px |
| Potência Nom. (W) | Number (mono) | 120px |
| Vmax Entrada (V) | Number (mono) | 120px |
| MPPTs | Number | 60px |
| AFCI | Boolean (ícone) | 60px |
| Port. 515 | Boolean (ícone) | 80px |
| Ações | Buttons | 120px |

### 5. Correlação com Skills Existentes

O catálogo do backoffice é o **ponto de entrada** para os dados que as skills de engenharia do Kurupira consomem:

| Skill Existente | Relação com catalog-backoffice |
|:---|:---|
| `parser-panond` | O Kurupira usa esta skill para fazer parse dos arquivos que o Admin envia |
| `validador-pan` | Valida os parâmetros do módulo antes de aceitar no catálogo |
| `validador-ond` | Valida os parâmetros do inversor antes de aceitar no catálogo |
| `compatibilidade-modulos-inversor` | Consome os dados do catálogo para verificar compatibilidade |
| `dimensionamento-string` | Usa tempCoeffVoc e electricalData do catálogo para cálculos |

## Limitações e Boas Práticas

### Hard Boundaries
- ❌ Esta skill NÃO faz parsing de `.pan`/`.ond` — isso é responsabilidade do Kurupira backend (skills `parser-panond`, `validador-pan`, `validador-ond`).
- ❌ Esta skill NÃO modifica o schema Prisma do Kurupira.
- ❌ Esta skill NÃO implementa lógica de dimensionamento elétrico — ela apenas gerencia o catálogo.
- ❌ Esta skill NÃO define estética de componentes — delegue ao `ui-backoffice`.

### Boas Práticas
- ✅ Ao desativar um equipamento, alertar o operador sobre quantos projetos em andamento usam esse modelo.
- ✅ Nunca permitir DELETE hard — apenas toggle `isActive`. Projetos históricos dependem dos dados.
- ✅ Exibir preview dos dados parseados antes de confirmar a adição (ex: "Este .pan contém: JA Solar 550W, bifacial, NOCT 43°C").
- ✅ Validar duplicidade de `model` (unique) no frontend antes de enviar para o Kurupira.
- ✅ Manter filtro rápido por fabricante como primeiro critério de busca — operadores procuram por marca na maioria dos casos.

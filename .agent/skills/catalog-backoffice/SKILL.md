---
name: catalog-backoffice
description: Especialista na gestão do Catálogo Global de equipamentos fotovoltaicos (ModuleCatalog e InverterCatalog) via Sumaúma. Ative ao implementar listagem, adição, edição, ativação/desativação ou upload de arquivos .pan/.ond no contexto do backoffice. Orquestra o Sumaúma BFF → Kurupira API (OAuth2 Bearer M2M) para validação técnica antes da persistência.
---

# Skill: Catalog Backoffice

## Gatilho Semântico

Ativado quando:
- O agente precisa implementar gestão de `ModuleCatalog` ou `InverterCatalog` no Sumaúma
- A tarefa envolve upload/importação de arquivos `.pan` (módulos) ou `.ond` (inversores) pelo operador
- É necessário ativar/desativar equipamentos do catálogo global
- Qualquer menção a: `catálogo`, `ModuleCatalog`, `InverterCatalog`, `.pan`, `.ond`, `catalog-backoffice`
- Alterações nas rotas `/admin/catalog/*` do BFF

## Protocolo

### 1. Modelo de Dados (Referência — db_kurupira, leitura apenas)

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

#### Leituras — Prisma READ-ONLY → db_kurupira

| Operação | Endpoint | Detalhes |
|:---|:---|:---|
| Listar módulos | `GET /admin/catalog/modules` | Paginado; filtros: manufacturer, powerWp range, isActive |
| Listar inversores | `GET /admin/catalog/inverters` | Paginado; filtros: manufacturer, nominalPowerW range, isActive |
| Detalhar módulo | `GET /admin/catalog/modules/:id` | Include `electricalData` completo |
| Detalhar inversor | `GET /admin/catalog/inverters/:id` | Include `electricalData` completo |
| Estatísticas | `GET /admin/catalog/stats` | Count por manufacturer, ativos vs inativos |

#### Escritas — OAuth2 Bearer M2M → Kurupira API

| Operação | Endpoint Sumaúma | Rota Kurupira (interna) | Observações |
|:---|:---|:---|:---|
| Adicionar módulo | `POST /admin/catalog/modules` | `POST /internal/catalog/modules` | Kurupira faz parse do .pan e valida parâmetros |
| Editar módulo | `PUT /admin/catalog/modules/:id` | `PUT /internal/catalog/modules/:id` | Atualizar specs, datasheet URL |
| Toggle ativo | `PATCH /admin/catalog/modules/:id` | `PATCH /internal/catalog/modules/:id` | `{ isActive: true/false }` |
| Adicionar inversor | `POST /admin/catalog/inverters` | `POST /internal/catalog/inverters` | Kurupira faz parse do .ond e valida |
| Editar inversor | `PUT /admin/catalog/inverters/:id` | `PUT /internal/catalog/inverters/:id` | Atualizar specs |
| Toggle ativo | `PATCH /admin/catalog/inverters/:id` | `PATCH /internal/catalog/inverters/:id` | `{ isActive: true/false }` |

> Nunca hard-delete de itens do catálogo — apenas toggle `isActive`. Projetos históricos dependem dos dados.

### 3. Fluxo de Upload de Arquivo .pan/.ond

```
1. Operador seleciona arquivo no frontend Sumaúma
2. Frontend → POST /admin/catalog/modules (multipart/form-data)
3. BFF Sumaúma recebe o arquivo em memória (multer)
4. BFF → kurupiraClient.post('/internal/catalog/modules', formData, {
             headers: { ...formData.getHeaders(), Authorization: 'Bearer <token>' }
           })
5. Kurupira:
   a. Parse do .pan (skill: parser-panond)
   b. Validação dos parâmetros elétricos (skill: validador-pan)
   c. Válido → salva no ModuleCatalog → retorna 201 com objeto criado
   d. Inválido → retorna 422 com lista de erros de validação
6. BFF propaga resposta para o frontend
7. Frontend exibe toast de sucesso ou painel de erros de validação
```

#### Passagem de arquivo multipart para o Kurupira

```javascript
// routes/catalog.js
const multer = require('multer');
const FormData = require('form-data');
const { kurupiraClient } = require('../lib/m2mClient');
const logger = require('../lib/logger');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/modules', upload.single('file'), async (req, res) => {
  const form = new FormData();
  form.append('file', req.file.buffer, { filename: req.file.originalname });

  try {
    const { data } = await kurupiraClient.post('/internal/catalog/modules', form, {
      headers: form.getHeaders(),
    });
    await auditLog({ ...ctx(req), action: 'ADMIN_CREATE_CATALOG_ITEM', entity: 'ModuleCatalog', resourceId: data.id });
    res.status(201).json(data);
  } catch (err) {
    const status = err.response?.status ?? 500;
    const body   = err.response?.data ?? { error: 'Erro interno ao comunicar com Kurupira' };
    logger.error('catalog: falha ao criar módulo', { err: err.message, status });
    res.status(status).json(body);
  }
});
```

### 4. DataGrid — Colunas Padrão

#### Módulos

| Coluna | Tipo | Largura |
|:---|:---|:---|
| Status | Badge `ATIVO/INATIVO` | 80px |
| Fabricante | Texto | 160px |
| Modelo | Texto mono | 200px |
| Potência (Wp) | Número mono | 100px |
| Eficiência (%) | Número mono 1 decimal | 100px |
| Bifacial | Ícone booleano | 80px |
| NOCT (°C) | Número mono | 80px |
| Coef. Voc (%/°C) | Número mono 3 decimais | 120px |
| Ações | Botões (editar, toggle ativo) | 120px |

#### Inversores

| Coluna | Tipo | Largura |
|:---|:---|:---|
| Status | Badge `ATIVO/INATIVO` | 80px |
| Fabricante | Texto | 160px |
| Modelo | Texto mono | 200px |
| Potência Nom. (W) | Número mono | 120px |
| Vmax Entrada (V) | Número mono | 120px |
| MPPTs | Número | 60px |
| AFCI | Ícone booleano | 60px |
| Port. 515 | Ícone booleano | 80px |
| Ações | Botões | 120px |

### 5. Correlação com Skills de Engenharia

| Skill | Relação com catalog-backoffice |
|:---|:---|
| `parser-panond` | Kurupira usa para parse dos arquivos enviados pelo Sumaúma |
| `validador-pan` | Valida parâmetros do módulo antes de aceitar no catálogo |
| `validador-ond` | Valida parâmetros do inversor antes de aceitar no catálogo |
| `compatibilidade-modulos-inversor` | Consome dados do catálogo para compatibilidade |
| `dimensionamento-string` | Usa tempCoeffVoc e electricalData do catálogo |

## Limitações e Boas Práticas

### Hard Boundaries
- ❌ Esta skill NÃO faz parsing de `.pan`/`.ond` — responsabilidade do Kurupira.
- ❌ Esta skill NÃO modifica o schema Prisma do Kurupira.
- ❌ Nunca hard-delete — apenas toggle `isActive`.
- ❌ Esta skill NÃO define estética de componentes — delegue ao `ui-backoffice`.

### Boas Práticas
- ✅ Exibir preview dos dados parseados antes de confirmar adição ("Este .pan contém: JA Solar 550W, bifacial, NOCT 43°C").
- ✅ Ao desativar, alertar quantos projetos em andamento usam esse modelo.
- ✅ Validar duplicidade de `model` (unique constraint) no frontend antes de enviar.
- ✅ Filtro rápido por fabricante como critério primário de busca.
- ✅ Propagar status 422 do Kurupira integralmente — o frontend exibe os erros de validação estruturados.

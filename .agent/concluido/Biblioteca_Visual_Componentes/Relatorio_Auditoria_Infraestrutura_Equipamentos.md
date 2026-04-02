# Relatório de Auditoria: Catálogo de Equipamentos e Infraestrutura (Revisão R2)

**Data:** 23 de Março de 2026
**Objetivo:** Mapear gaps infraestruturais profundos entre a base de dados existente, interfaces e orquestração de stores do Kurupira.

---

## Bloco 1 — Infraestrutura de Dados e Schemas Fatais

### 1.1 O Colapso de Mapeamento do `InMemoryEquipmentRepo.ts`
- **Status da Infraestrutura:** **Fatalmente Quebrada para Módulos**.
- **O Desvio da Realidade:** A função `mapModuleToSpec` tenta converter uma string bruta no padrão CSV legado (ex: `data["Modelo"]`, `data["Potência"]`, `data["ƞ Módulo"]`).
- **O Fato:** O banco de dados real em `src/data/equipment/modules.ts` já completou a sua migração para um formato JSON moderno, fortemente tipado e com aninhamentos semânticos (`electrical: { pmax, vmp... }` e `physical: { widthMm, cells... }`).
- **Consequência Imediata:** Se o repositório fosse consumido agora, todo o catálogo de módulos dispararia erros fatais ou injetaria componentes `undefined` com atributos zerados no motor de engenharia.

### 1.2 O Conflito de Tipagens Base
- **A Omissão de Domínio:** O projeto atualmente possui "duas fontes de verdade" não resolvidas para o mesmo componente:
    1. O banco `MODULE_DB` valida-se contra o esquema legado em `src/core/schemas/moduleSchema.ts` (esquema aninhado).
    2. O `InMemoryEquipmentRepo` e o resto da arquitetura exigem `ModuleSpecs`, declarado em `src/core/schemas/equipment.schemas.ts` (esquema achatado).
- **Ação Necessária (P4-2):** Estas tipagens deverão convergir. A nova tipagem final precisa incorporar _todas_ as métricas elétricas *e* a propriedade obrigatória de Área (footprint 2D) para a compatibilidade com a engine Leaflet.

### 1.3 `MODULE_DB` e `INVERTER_DB`
- **Módulos:** Contém 28 painéis variados.
  - **GAP:** O catálogo **Canadian Solar**, planejado desde a fundação inicial do projeto, continua **ausente** dos dados mockados.
- **Inversores:** O `INVERTER_DB` detém um formato ainda parcialmente rudimentar e achatado (chaves mistas como `"Ligação": "MONOFÁSICO"`), necessitando normalização de suas strings de metadados durante o parsing.

---

## Bloco 2 — Estado do Store e Componentes de Diálogo

### 2.1 Desconexão Absoluta das Camadas de UI
- Tanto o `InverterCatalogDialog.tsx` quanto o `ModuleCatalogDialog.tsx` utilizam hardcodes provisórios (`catalogInverters: any[] = []`, `availableModules: PVModule[] = []`). 
- As tipologias locais de arquivos legados (como o hook genérico `PVModule`) resistem nos imports, poluindo a coesão da UI com o Store central.

### 2.2 O Vácuo de Estado no Workspace
- **A Lacuna do Catalog:** O `useTechStore.ts` não engloba um "Repositório Mestre". Atualmente ele armazena passivamente as "instâncias selecionadas" (`inverters: NormalizedCollection<InverterState>`), mas não há de onde "beber" as fontes.
- **Isolamento de Memória Transacional:** O novo Repositório Histórico e Paramétrico da camada Leaflet/WebGL do aplicativo deverá segregar explicitamente os catálogos (filtros, pesquisas e listas) num domínio `catalogSlice` munido de chaves de suspensão de Histórico (`partialize` do *Zundo*). Interagir numa busca não pode gerar logs no histórico de projetos.

---

## Bloco 3 — Capacidades Tecnológicas Instaladas

### 3.1 Vácuo de Componentes de Alta Precisão Gráfica
- **Status WebGL:** Inexistente. Não fomos além de divs; bibliotecas requeridas como `@react-three/fiber` e utilitários da `@react-three/drei` (mandatórios para o Scissor Testing do catálogo Grid 3D) sequer habitam o `package.json`.

### 3.2 Threading e Trabalhadores de Fundo (Off-Main-Thread)
- **Status Paralelismo:** Zero. A totalidade das validações matemáticas (Strings per Inverter/Tensão Mínima de Placas) é resolvida processualmente na própria Thread de visualização do usuário. 
- O próximo épico P4 trará a implantação fundadora do **Primeiro Web Worker** escalável do Neonorte para aliviar os testes cruzados no evento Hover do catálogo.

---

## Próximos Passos (Plano de Resolução P4)
As frentes de correção detectadas por esta Auditoria Profunda foram integralmente planificadas para a Fase "Refatoração dos Catálogos" (**Fase P4**):

* **[P4-1]** Setup Tecnológico Estrutural (R3F + Configuração Vite Worker)
* **[P4-2]** Consertar o Mapeamento e Unir Tipagens (`moduleSchema` vs `equipment.schemas`)
* **[P4-3]** Inicializar a População Lógica do Menu (Catalog Slice + repo Data Isolation).
* **[P4-4 / P4-5]** Reconstruir Visual da Grelha.
* **[P4-6]** Habilitar Lógicas Assíncronas Offline no Worker.

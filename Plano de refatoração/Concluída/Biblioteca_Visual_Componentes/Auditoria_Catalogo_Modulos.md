# Auditoria Técnica: Catálogo de Módulos Fotovoltaicos Vazio

**Status:** Crítico / Desconectado
**Componente:** `src/modules/engineering/components/ModuleCatalogDialog.tsx`
**Data:** 23 de março de 2026

## 1. Diagnóstico do Problema
O "Catálogo de Módulos Fotovoltaicos" não exibe nenhum equipamento porque o array de dados no componente `ModuleCatalogDialog.tsx` está deliberadamente vazio (hardcoded).

### Evidência no Código:
No arquivo `ModuleCatalogDialog.tsx`, linhas 27-29:
```tsx
27:     // Store mock
28:     const availableModules: PVModule[] = [];
29:     const isLoading = false;
```

Este estado é um placeholder que não foi conectado ao repositório de dados real durante a refatoração da UX-001.

---

## 2. Rastreamento da Origem dos Dados
A infraestrutura de dados para equipamentos solares existe no sistema, mas está desacoplada deste diálogo específico.

- **Base de Dados Real:** `src/data/equipment/modules.ts` (contém `MODULE_DB`).
- **Repositório de Acesso:** `src/services/adapters/InMemoryEquipmentRepo.ts` (Implementa `getModules()`).
- **Esquemas de Dados:** `src/core/schemas/equipment.schemas.ts`.

---

## 3. Incompatibilidades Identificadas (Riscos)
- **Divergência de Tipos:** O componente usa a interface `PVModule` (definida em um hook local), enquanto o repositório usa `ModuleSpecs`. É necessário unificar ou mapear essas interfaces para garantir que campos como `pmax`, `voc` e `dimensions` sejam lidos corretamente.
- **Ciclo de Vida:** O diálogo é um componente de UI puro e não deve buscar dados diretamente. A recomendação é que o `activeModule` ou o `useTechStore` forneça essa lista via injeção de dependência ou Store global.

---

## 4. Plano de Ação Recomendado (Sem Execução)
1. **Unificação de Tipos:** Mover a definição de `PVModule` para um local centralizado ou adotar `ModuleSpecs` globalmente.
2. **Conexão via Store:** Atualizar o `useTechStore.ts` para carregar o catálogo de módulos no `initialState` usando o `InMemoryEquipmentRepo`.
3. **Consumo no componente:** Substituir o array vazio por uma chamada ao store:
   ```tsx
   const availableModules = useTechStore(state => state.catalog.modules);
   ```

---
*Relatório de Auditoria arquivado na Biblioteca Visual de Componentes para fins de planejamento de correção.*

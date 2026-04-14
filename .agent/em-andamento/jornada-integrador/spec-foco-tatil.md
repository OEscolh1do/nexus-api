# SPEC — Operação Foco Tátil (Lego v3.7)

> **Status**: 🟢 Aguardando Implementação (Eletiva)  
> **Épico**: Jornada do Integrador  
> **Data de Criação**: 2026-04-14

## 1. OBJETIVO
Transformar os blocos do Compositor Lego (Left Outliner) em elementos interativos "táteis" que controlam o foco da aplicação e o painel de propriedades, reforçando a metáfora de manipulação física de componentes.

---

## 2. REQUISITOS DE INTERFACE (DESIGN LEAD)

### 2.1 Maquete de Estados Visuais
| Estado | Estilo CSS | Feedback Visual |
|--------|------------|-----------------|
| **Focado** | `ring-2`, `shadow-[glow]`, `opacity-100` | Brilho intenso na cor do bloco (Âmbar/Ciano/Esmeralda) |
| **Desfocado** | `opacity-50`, `grayscale-[0.2]` | Bloco "recua" visualmente para dar destaque ao foco |
| **Click (Haptic)** | `active:scale-95` | Simula compressão física ao clicar |

### 2.2 Cores de Glow (Tokens)
- **Consumo**: `rgba(245, 158, 11, 0.4)` (Amber)
- **Módulos**: `rgba(14, 165, 233, 0.4)` (Sky)
- **Inversor**: `rgba(16, 185, 129, 0.4)` (Emerald)

---

## 3. ARQUITETURA TÉCNICA (THE BUILDER)

### 3.1 Alterações no `uiStore.ts`
- Adicionar `'consumption'` ao tipo `EntityType`.
- O estado `selectedEntity` deve ser o driver único para o brilho dos blocos.

### 3.2 Mapeamento de Foco → Propriedades
| Bloco Clicado | Ação `selectEntity` | Painel no Inspector |
|---------------|-------------------|----------------------|
| **Consumo** | `type: 'consumption'` | `ConsumptionProperties.tsx` (Novo) |
| **Módulos** | `type: 'module', id: 'global'` | `ModuleProperties.tsx` |
| **Inversor** | `type: 'inverter', id: tech.id` | `InverterProperties.tsx` |

---

## 4. PLANO DE EXECUÇÃO (CASCATA)

1.  **Fundação**: Criar `ConsumptionProperties.tsx` e registrar no `PropertiesGroup.tsx`.
2.  **Estado**: Atualizar `uiStore.ts` com o novo tipo.
3.  **UI**: Refatorar `ConsumptionBlock`, `ComposerBlockModule` e `ComposerBlockInverter` para aceitarem a prop `isSelected` derivada do store.
4.  **Haptic**: Aplicar transições de opacidade e escala no container principal dos blocos.

---

## 5. CRITÉRIOS DE ACEITE
- Apenas um bloco pode ter o brilho ativo por vez.
- Clicar no espaço vazio do mapa deve limpar a seleção do Lego (voltar todos para `opacity-100` sem brilho).
- A transição entre estados de foco deve ser suave (`duration-300`).

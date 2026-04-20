---
name: interface-refiner
description: Arquiteto de Interface especializado em benchmark de ferramentas de alta performance (Blender, AutoCAD, VS Code). Analisa componentes de UI do Kurupira e propõe refatorações de estrutura e ergonomia contextualizadas ao workflow do engenheiro projetista.
---

# Skill: Interface Refiner

## Gatilho Semântico

Ativado quando o desenvolvedor menciona:
- Atrito de uso em um componente de interface ("essa barra está atrapalhando", "esse painel ocupa espaço demais")
- Comparação com ferramenta de referência ("como no Blender", "tipo o CAD", "como o Figma faz")
- Solicitação de proposta de refatoração de UX/ergonomia ("como melhoraria essa toolbar?", "ideia melhor para esse painel?")
- Revisão de layout de viewport, barra de ferramentas, painel lateral ou modal

## Benchmarks de Referência

Esta skill opera exclusivamente sobre padrões extraídos de ferramentas de engenharia e design de alta performance:

| Ferramenta | Padrão de Referência | Princípio Central |
|---|---|---|
| **Blender** | Painéis flutuantes (`N-Panel`), Pie Menus (radiais), Properties Sidebar colapsável | **Máxima área de viewport** em detrimento de UI fixa |
| **AutoCAD / FreeCAD** | Command line dock, Ribbon colapsável, drag de painéis por zona | **Eficiência operacional** — usuário experiente não usa mouse para comandos |
| **VS Code** | Activity Bar icon-only, Panels redimensionáveis, Split View, Quick Open | **Contexto-first** — UI emerge apenas quando necessária |
| **Unreal Engine** | Outliner flutuante, Details panel contextual, viewport fullscreen por hotkey | **Dados surgem sob demanda**, canvas é sagrado |
| **Figma** | Left Rail hambúrguer, inspect panel contextual, toolbar mínima | **Zero UI** quando nada está selecionado |

## Protocolo

### Passo 1 — Diagnóstico de Atrito

Mapear o componente atual de acordo com os seguintes vetores:

```markdown
## Análise de Atrito: [Nome do Componente]

### Situação Atual
- **Tipo**: [Sidebar estática | Toolbar fixa | Modal | Painel flutuante]
- **Posicionamento**: [Esquerda/Direita/Topo/Baixo, fixo ou absoluto]
- **Área subtraída do canvas**: [estimativa em % da viewport horizontal/vertical]
- **Frequência de uso**: [Sempre visível | Só durante criação | Só durante seleção | Raramente]

### Fricção Identificada
- [ ] Ocupa área permanente do canvas sem necessidade contínua
- [ ] Redundante com outro painel (sobreposição de informação)
- [ ] Força o usuário a desviar o olhar do ponto de trabalho
- [ ] Dificulta o foco quando não há objeto selecionado
- [ ] Estrutura rígida que não se adapta ao contexto da tarefa
```

### Passo 2 — Mapeamento de Padrão de Referência

Identificar o padrão de ferramenta de referência mais adequado para o caso:

| Caso de Uso | Padrão Recomendado | Ferramenta de Origem |
|---|---|---|
| Painel sempre visível com muitas opções | `N-Panel` retrátil (toggle via ícone ou tab) | Blender |
| Ações rápidas sem seleção de objeto | Pie Menu radial (clique direito ou atalho) | Blender |
| Propriedades dependentes de seleção | Painel contextual flutuante, aparece ao selecionar | Figma / Unreal |
| Paleta de ferramentas de criação | Toolbar vertical icon-only colapsável | AutoCAD / Blender |
| Navegação entre módulos/modos | Activity Bar icon-only (sidebar fixa minimalista) | VS Code |
| Comandos avançados esporádicos | Quick Input / Command Palette | VS Code |

### Passo 3 — Proposta Técnica Contextualizada ao Kurupira

Gerar a proposta no formato abaixo, **sem escrever código**:

```markdown
## Proposta: [Título da Refatoração]

**Componente afetado:** [nome exato do arquivo .tsx]
**Padrão de referência:** [Blender N-Panel / Figma Inspect / etc.]
**Ganho de viewport:** [estimativa em % de área recuperada]

### Comportamento Proposto
[Descrição clara do novo comportamento: como abre, como fecha, o que dispara a abertura,
o que é visível no estado "recolhido" vs "expandido"]

### Estado Recolhido (Padrão)
[O que o usuário vê quando o componente está no estado mínimo]

### Estado Expandido (Ativado)
[O que aparece ao interagir — clique, hover, seleção de objeto, etc.]

### Gatilho de Abertura
[O que dispara a expansão: clique em ícone? Seleção de elemento no canvas?
Hover sobre zona? Comando explícito?]

### Impacto em Outros Componentes
[Se a refatoração afeta a posição ou lógica de outros painéis adjacentes]

### Arquivos Afetados (estimativa)
- `[MODIFY]` caminho/do/componente.tsx
- `[NEW]` caminho/do/novocomponente.tsx — se necessário criar novo wrapper
- `[MODIFY]` store relevante — se estado de open/close precisa ser persistido

### Critérios de Aceitação
- [ ] Canvas recupera X% de área horizontal/vertical
- [ ] Estado do painel (aberto/fechado) persiste entre sessões (Zustand)
- [ ] Comportamento responsivo: em telas < 1280px, painel vira overlay ao invés de push
- [ ] Nenhum dado crítico fica oculto no estado recolhido — apenas acessível via expand
```

### Passo 4 — Validação com Princípios do Kurupira Canon

Antes de entregar a proposta, verificar:

- [ ] **Canvas é sagrado**: a refatoração aumenta ou mantém a área de viewport disponível?
- [ ] **Density-first**: o novo padrão mantém a densidade de informação quando expandido?
- [ ] **Zero surpresa**: o comportamento é previsível para um usuário de Blender ou CAD?
- [ ] **Sem gloss**: a solução não introduz animações pesadas ou efeitos desnecessários?
- [ ] **Estado persistido**: uso de Zustand para lembrar posição/estado do painel entre sessões?

## ⛔ Hard Boundaries (O que esta Skill NÃO faz)

- ❌ **Não escreve código** — propõe o spec técnico; a implementação é delegada ao `design-lead` (visual) e `the-builder` (lógica/estado)
- ❌ **Não sugere atalhos de teclado** — escopo é estrutura e ergonomia visual
- ❌ **Não avalia cálculos de engenharia** — qualquer dado exibido no painel é uma questão para `engenheiro-eletricista-pv`
- ❌ **Não refatora lógica de negócio** — se o painel exibe dados errados, o problema não é de UX
- ❌ **Não propõe sistemas de design completos** — uma proposta por componente por vez
- ❌ **Não referencia ferramentas SaaS de solar** (Helioscope, PVSyst) — benchmark é exclusivamente de ferramentas de alta performance de engenharia e design

## Saída Esperada

Ao final do protocolo, entregar:

1. **Análise de Atrito** preenchida (Passo 1)
2. **Proposta Técnica** no formato padronizado (Passo 3)
3. **Recomendação de skills** para implementação:
   - `design-lead` → tokens visuais, animações, estados hover/focus do novo padrão
   - `the-builder` → lógica de estado, persistência Zustand, responsividade

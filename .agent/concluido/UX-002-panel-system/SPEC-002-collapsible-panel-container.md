# SPEC-002 — Container de Painel Colapsável (PanelGroup)

**Épico**: UX-002 Panel System  
**Fase**: 1 (Organizacional)  
**Prioridade**: P0 (Fundação)  
**Dependências**: SPEC-001 (grupos devem existir)  

---

## Problema de Negócio

Os painéis do dock lateral não possuem mecanismo de colapso. Em telas menores 
ou quando o engenheiro não precisa de uma seção, ela ocupa espaço visual sem 
oferecer valor. No Adobe Illustrator, cada painel pode ser colapsado 
individualmente com um clique no header.

## Usuário Final

Engenheiro solar trabalhando em monitores de 14"–27".

## Escopo

### ✅ Incluso
- Criar componente `PanelGroup` que wrappeia qualquer grupo (SPEC-001)
- Header com ícone, label e chevron de colapso (▼/▶)
- Animação suave de expansão/colapso (max-height transition)
- Placeholder para botão de maximize (↗) — renderizado mas desabilitado na Fase 1

### ❌ Excluso
- Lógica de swap com o center (Fase 2)
- Persistência de estado de colapso em localStorage (decisão pendente Q2)
- Drag & drop de painéis para reordenar

## Especificação Técnica

### Arquivo a Criar

```
kurupira/frontend/src/modules/engineering/ui/panels/groups/PanelGroup.tsx
```

### Interface do Componente

```tsx
interface PanelGroupProps {
  id: string;                    // Identificador único do grupo
  label: string;                 // Texto do header (ex: "Site", "Simulação")
  icon: React.ReactNode;         // Ícone Lucide no header
  defaultCollapsed?: boolean;    // Estado inicial (default: false = expandido)
  accentColor?: string;          // Tailwind class para cor de destaque (ex: "text-emerald-400")
  badge?: React.ReactNode;       // Badge opcional ao lado do label (ex: PR badge)
  onMaximize?: () => void;       // Callback para swap ao center (Fase 2, null na Fase 1)
  children: React.ReactNode;     // Conteúdo do painel (o grupo específico)
}
```

### Comportamento

1. **Header clicável**: Click no header inteiro togga o estado collapsed/expanded
2. **Chevron animado**: Rotação suave de 0° → -90° quando colapsa
3. **Conteúdo**: Transição CSS `max-height` + `overflow: hidden` para animar
4. **Botão Maximize**: Ícone `Maximize2` no canto direito do header
   - Fase 1: Renderizado com `opacity-30 cursor-not-allowed` (desabilitado)
   - Fase 2: Ativado com `onMaximize` callback
5. **Acessibilidade**: `aria-expanded`, `aria-controls`, `role="region"`

### Estilo Visual

- Header: `bg-slate-900/50 border border-slate-800 rounded-t-lg`
- Label: `text-[10px] font-bold uppercase tracking-wider text-slate-400`
- Quando colapsado: Apenas o header visível, `rounded-lg` (sem rounded-t)
- Separação entre grupos: `gap-2` no container pai

### Critérios de Aceitação (Definition of Done)

- [ ] Componente `PanelGroup` criado e exportado
- [ ] Header clicável com chevron animado
- [ ] Transição suave de expansão/colapso
- [ ] Botão maximize renderizado (desabilitado na Fase 1)
- [ ] Props `badge` e `accentColor` funcionais
- [ ] Compila sem erros TypeScript

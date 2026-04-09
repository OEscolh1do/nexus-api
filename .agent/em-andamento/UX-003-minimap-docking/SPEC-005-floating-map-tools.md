# SPEC-005 — Floating Map Tools & Header Cleanup

**Épico**: UX-003 Minimap Docking  

## Problema
Dois resquícios arquiteturais do layout monolítico persistem:
1. **O Badge `Mapa → Dock` no Header**: Introduzido no UX-002, perdeu sua função. Agora que o minimapa possui sua própria moldura visual no Dock (SPEC-004) com ícones nativos de restauração, manter esse botão duplicado no `TopRibbon` apenas polui o cérebro do usuário.
2. **A Paleta de Ferramentas Deslocada**: Ícones de desenho e polígono moram globalmente no Header (`TopRibbon`). Quando o mapa é reduzido ao Dock e a tela exibe gráficos de simulação, as ferramentas de desenho vetorial continuam no topo, permitindo cliques inválidos, desvinculados de um contexto onde farpariam sentido (não se desenha polígono num gráfico Módulo x Potência).

## O Objetivo
1. **Pugnar Elementos Órfãos**: Deletar o `CenterContentBadge` e a importação acoplada do Ribbon.
2. **Refatoração Espacial das Tools**: Extrair a Paleta de Ferramentas de engenharia (Cursor, Polígono, Régua) e movê-la para *dentro do VirtualDOM do mapa* no `CenterCanvas`. 

### A Estética "Illustrator / AutoCad"
Ao invés de uma barra chata no topo, formataremos um **Floating Toolbar** vertical do lado esquerdo do Canvas, ancorado ao viewport do Leaflet. Assim, quando o mapa "sair da tela" ou for docado, a barra some interativamente junto.

---

## Escopo Técnico

### Tratamento do Header (`TopRibbon.tsx`)
- Copiar a array estática `TOOLS` (`{id: 'SELECT', icon: ...}`) para uso no canvas.
- Deletar a array `TOOLS` de dentro do arquivo.
- Remover o JSX referente a `{/* ── CENTER: Tool Palette ── */}` (aprox. Linha 141-163).
- Deletar fisicamente o componente funcional `CenterContentBadge` (linhas ~519 a ~543).

### Criação Flutuante (`CenterCanvas.tsx`)
1. Importar nativamente os ícones esquecidos da paleta de ferramentas e a interface `ToolConfig`.
2. Substituir o antigo `Tool indicator (bottom-left)` (que era apenas passivo *pointer-events-none*) por um **Toolbar Interativo** dinâmico:
```tsx
{/* Floating Vertical Toolbar (Style AutoCAD) */}
<div className="absolute top-4 left-4 z-[1000] flex flex-col gap-1.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl">
  {TOOLS.map((tool) => (
    <button
      key={tool.id}
      onClick={() => setActiveTool(tool.id)}
      title={`${tool.label} (${tool.shortcut})`}
      className={cn(
        "p-2 rounded-lg transition-all flex items-center justify-center",
        activeTool === tool.id
          ? "bg-emerald-500 text-slate-900 shadow-md scale-105"
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      )}
    >
      <tool.icon size={16} />
    </button>
  ))}
</div>
```
- Estando este bloco encapsulado dentro da condicional `isMapVisible`, a barra morrerá esteticamente sempre que o hub/gráfico dominar a tela, não causando "botões fantasmas" no modo Simulação.

# SPEC-003 — RightInspector como Orquestrador de Grupos

**Épico**: UX-002 Panel System  
**Fase**: 1 (Organizacional)  
**Prioridade**: P0 (Finalização da Fase 1)  
**Dependências**: SPEC-001, SPEC-002  

---

## Problema de Negócio

Após a decomposição (SPEC-001) e criação do container (SPEC-002), o 
`RightInspector.tsx` precisa ser refatorado de monólito (627 linhas) 
para orquestrador leve (~50 linhas) que monta os `PanelGroup`s em 
sequência vertical.

## Usuário Final

Mesmo do SPEC-001 — engenheiro solar.

## Escopo

### ✅ Incluso
- Reescrever `RightInspector.tsx` como orquestrador
- Wrappear cada grupo extraído (SPEC-001) dentro de um `PanelGroup` (SPEC-002)
- Mesclar o `PropertiesGroup` como o **4º grupo no dock** (desaparece o PropertiesDrawer separado)
- Manter o header "Inspector" no topo

### ❌ Excluso
- Lógica de swap com center (Fase 2)
- Mudanças no conteúdo interno dos grupos
- Reordenação de painéis por drag

## Especificação Técnica

### Arquivo a Modificar

```
kurupira/frontend/src/modules/engineering/ui/panels/RightInspector.tsx
```

### Estrutura Alvo (~50 linhas)

```tsx
export const RightInspector: React.FC = () => {
  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-3 py-2.5 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <Info size={12} className="text-slate-500" />
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Inspector
          </h3>
        </div>
      </div>

      {/* Panel Groups Stack */}
      <div className="flex-1 overflow-y-auto space-y-2 p-2">
        <PanelGroup id="site" label="Site" icon={<MapPin size={10} />}>
          <SiteContextGroup />
        </PanelGroup>

        <PanelGroup id="simulation" label="Simulação" icon={<BarChart3 size={10} />}>
          <SimulationGroup />
        </PanelGroup>

        <PanelGroup id="electrical" label="Elétrico" icon={<Activity size={10} />} defaultCollapsed>
          <ElectricalGroup />
        </PanelGroup>

        {/* Auto-expande quando há seleção */}
        <PropertiesGroup />
      </div>
    </div>
  );
};
```

### Regras de Composição

1. **Ordem dos grupos**: Site → Simulação → Elétrico → Propriedades
2. **PropertiesGroup** NÃO usa `PanelGroup` wrapper — tem seu próprio header com botão ✕
3. **PropertiesGroup** aparece automaticamente quando `selectedEntity.type !== 'none'`
4. O grupo **Elétrico** começa colapsado por default (é o mais longo e menos consultado continuamente)
5. O scroll é no container `.overflow-y-auto`, não dentro de cada grupo individual

### Critérios de Aceitação (Definition of Done)

- [ ] `RightInspector.tsx` reduzido para ≤60 linhas
- [ ] 4 grupos renderizados em sequência vertical
- [ ] Cada grupo colapsável individualmente via header click
- [ ] PropertiesGroup aparece/desaparece com seleção de entidade
- [ ] Scroll vertical funciona em telas pequenas (overflow-y-auto)
- [ ] Zero mudanças visuais no conteúdo interno dos painéis
- [ ] Compila sem erros TypeScript

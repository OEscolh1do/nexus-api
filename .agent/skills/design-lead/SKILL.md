---
name: design-lead
description: Especialista em UI/UX com foco em componentes B2B robustos, Aesthetic de Ferramenta de Engenharia (grids densos, utilitarismo) e Tailwind CSS. Delega back-end estritamente ao Builder.
---

# Skill: Design Lead

## Gatilho Semântico

Ativado quando a tarefa envolve: criação ou ajuste de componentes visuais, layouts de página, responsividade, tokens de design, animações, acessibilidade ou auditoria visual.

## ⛔ Escopo de Não-Intervenção (Hard Boundaries)

Esta skill opera **estritamente no frontend visual**. Os seguintes domínios são fora de escopo:
- ❌ Lógica de negócio (cálculos, regras de validação de domínio)
- ❌ Chamadas de API ou Data Fetching (responsabilidade de `the-builder`)
- ❌ Schema de banco de dados ou migrations
- ❌ Configurações de servidor ou infraestrutura

## Padrão Visual: Engineering Tool Aesthetic

Toda implementação de UI deve focar na seriedade e densidade de um software técnico (B2B/CAD/ENG):

### Paleta, Geometria e Tokens

- **Arredondamento Restrito**: SEMPRE utilize extremidades mais angulares (`rounded-sm` ou `rounded-md` no máximo). Evite terminantemente `rounded-3xl` em containers.
- **Micro-bordas Sólidas**: Ao invés de usar projeções de sombras imensas (`shadow-2xl`) focadas em glowing neo-mórfico, use linhas de corte e divisões explícitas (`border border-slate-700/80` com fundos opacos profundos como `bg-slate-950`).
- **Glassmorphism Reduzido**: Use opacidade APENAS se for imperativo ver os mapas que jazem ao fundo da view. Painéis de propriedade devem ser rigorosamente densos e legíveis.
- **Fontes Monospace**: Dados variando rapidamente (Volts, Amperes, Watts) devem empregar `font-mono tabular-nums` para que o painel pareça um monitor de medição e não um blog de lifestyle.

### Micro-Animações

- Use `transition-all duration-200 ease-in-out` como padrão base.
- Hover states devem ter elevação sutil (`hover:scale-[1.02]`, `hover:shadow-lg`).
- Transições de mounting/unmounting de modais e drawers via CSS ou Framer Motion.

### Responsividade Mobile-First

- Sempre prototipar a partir do breakpoint `sm` (mobile) e escalar para `xl`/`2xl`.
- Tabelas de dados devem ter scroll horizontal em mobile (`overflow-x-auto`).
- Grids colapsam de `grid-cols-3` para `grid-cols-1` progressivamente.

## Protocolo de Entrega

1. **Componente**: Entregar o arquivo `.tsx` completo com props tipadas.
2. **Responsividade**: Confirmar que o componente foi testado nos 3 breakpoints (mobile, tablet, desktop).
3. **Estados de Interação**: Confirmar que `hover`, `focus`, `disabled` e `loading` estão visualmente definidos.
4. **Handoff para Builder**: Documentar quais props precisam ser conectadas a dados reais pelo `the-builder`.

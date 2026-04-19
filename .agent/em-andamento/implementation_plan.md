# Proposta de Refatoração: Layout de SiteCanvasView (Engineering Precision)

## Contexto
O ajuste anterior de 55/45 resultou em um painel esquerdo excessivamente largo para os dados contidos, causando o alongamento desnecessário de campos curtos (CEP, Tarifa, UF). Isso prejudica a estética de ferramenta técnica e a eficiência visual.

## Mudanças Propostas

1. **Estrutura de Cockpit Revisada**:
   - **Painel Esquerdo (Formulário)**: Transição de `lg:w-[55%]` para `lg:w-[400px]` (fixo). Isso estabiliza a UI em diferentes resoluções.
   - **Painel Direito (Mapa)**: Mudança para `flex-1`, priorizando a área visual do local.

2. **Grid de 12 Colunas**:
   - Abordagem mais granular para evitar "campos esticados":
     - `CEP`: 4/12
     - `UF`: 2/12
     - `Cidade`: 6/12
     - `Logradouro`: 9/12
     - `Nº`: 3/12
     - `Tarifa`: 5/12
   - Isso garante que o tamanho do input corresponda à magnitude do dado esperado.

3. **Refinamento de Primitivas**:
   - Ajustar `FieldCell` para suportar composições densas sem quebra de labels.

## Arquivos Afetados

### [MODIFY] [SiteCanvasView.tsx](file:///d:/Reposit%C3%B3rio_Pessoal/SaaS%20Projects/Neonorte/Kurupira-Iaca/kurupira/frontend/src/modules/engineering/ui/panels/canvas-views/SiteCanvasView.tsx)
- Reorganização total das classes de grid.
- Ajuste das proporções flex-row.

## Plano de Verificação
- Validar se campos como CEP e UF mantêm larguras proporcionais ao conteúdo.
- Confirmar responsividade em resoluções Desktop variadas.
- `tsc --noEmit` para integridade de tipos.


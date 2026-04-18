# Proposta: Redesign Industrial "Project Dossier"

## Contexto
O layout atual de "Thumbnail Superior" é comum em apps de consumo, mas em ferramentas de engenharia, a densidade de dados deve preceder a imagem. Propomos um redesign térmico inspirado em etiquetas de identificação industrial e painéis de telemetria (SCADA).

## User Review Required
> [!IMPORTANT]
> Mudaremos o layout de vertical (Capa -> Info) para horizontal/híbrido (Telemetria -> Mapa/Ações), priorizando a leitura rápida de parâmetros técnicos.

## Mudanças Propostas

### 1. Novo Layout "Dossier"
#### [MODIFY] `kurupira/frontend/src/modules/engineering/ui/ProjectExplorer.tsx`
- **Estrutura**:
    - **Esquerda (HUD)**: Uma coluna densa com kWp (X-Large), Consumo e Tensão.
    - **Direita (Media)**: Uma área quadrada para o mapa de satélite e contagem de módulos.
    - **Rodapé**: Nome do cliente e localização em uma faixa horizontal.
- **Geometria**: Borda sólida `border-slate-800` com cantos `rounded-sm` (Padrão de Painel Elétrico).

### 2. Nova Paleta "Steel & Glow"
- **Base**: `bg-slate-950` (Fundo extra profundo).
- **Linhas**: Subdivide o card com `border-slate-900` para criar sub-painéis internos.
- **Destaques**: 
    - **Indigo Glow**: Apenas para os valores numéricos principais.
    - **Muted Slate**: Para todos os rótulos descriptivos.
- **Hover**: Ao invés de sombra, o card ganha um contorno `outline-1 outline-indigo-500/30`.

### 3. Micro-interações
- O mapa de satélite terá um filtro `grayscale` que se torna colorido apenas no hover.
- Os botões de Arquivar/Deletar serão movidos para um "Menu de Comando" compacto.

## Plano de Verificação
- [ ] Validar leitura em telas de 13" (baixa resolução).
- [ ] Confirmar que o layout não quebra com nomes de clientes longos.
- [ ] Verificar persistência da paleta escura em ambientes de alta luminosidade (contraste).

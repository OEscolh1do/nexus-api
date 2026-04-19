# Spec — Physical Canvas (Arranjo Físico & Instalação Operacional)

**Arquivo alvo:** `canvas-views/PhysicalCanvas.tsx` (Antigo `MapCore`)
**Tipo:** Refatoração de Rigor Técnico, Integração de Dados & Otimização do Fluxo de Instalação  
**Módulo:** `engineering` — Arranjo Físico  
**Responsável:** `design-lead` / `the-builder`  
**Revisor de Engenharia:** `engenheiro-eletricista-pv`

---

## 1. Propósito: De Mapa Geográfico a Cockpit de Execução (Blueprint)

A visão do Arranjo Físico abandona a lógica superficial de "clicar e soltar retângulos em um mapa" para adotar uma postura de **Ferramenta de Dimensionamento e Execução B2B** focado na realidade bruta do telhado. 

Os projetistas desenham polígonos que representam áreas úteis reais. O sistema reage validando as bordas, ancoramento e passagem técnica, garantindo que a equipe de campo receba um **Croqui Instaurável**, e não um delírio geométrico impraticável.

---

## 2. Gaps Operacionais Endereçados e Soluções Pragmáticas

A física da instalação prevalece sobre o capricho milimétrico algorítmico, guiadas pela filosofia de *Medir Duas Vezes, Cortar Uma*.

### 2.1 Ancoragem Estrutural (The Croqui Mode)
- **Problema**: O engenheiro no escritório não enxerga os caibros ou as terças do telhado via imagem de satélite. Tentar adivinhar graus exatos de instalação leva a erros no campo.
- **Solução (Pragmática)**: Ao invés de forçar sliders de graus, trabalhamos com a **Intenção da Estrutura**. O usuário seleciona o **Tipo de Suporte** (`Telha Cerâmica`, `Fibrocimento`, `Mini-trilho Trapezoidal`). No Modo Prancheta, o sistema renderiza hastes paralelepipédicas ou traços de montagem subjacentes aos módulos cruzando a linha do arranjo (Retrato/Paisagem). 
- **Resultado Operacional**: O instalador recebe um diagrama de intenção explícito da estrutura (trilhos horizontais vs módulos em retrato).

### 2.2 Zonas de Vento (Safe Edge Offset)
- **Problema**: Modulos encostados nas tesouras e beirais são arrancados pelo vento ou impedem acesso de limpeza.
- **Solução (Ray-Casting Padding)**: A criação de polígonos mantém uma matemática imutável e leve `O(N)`. Não utilizaremos recortes booleanos sub-geométricos (shrink polygon genéricos que geram distorções no JS). Ao invés disso, o validador interno de preenchimento incha uma *"Aura Geométrica"* nos módulos (ex: padding visual +40cm de contenção) no momento de colidir com as arestas. Fica o alerta fixo na UI (linha tracejada amarela) sobre as Zonas de Borda.

### 2.3 Corredores Técnicos 
- **O Problema**: Mar de módulos de ponta a ponta que força o sujeito a pisar nas células para aplicar água desmineralizada 3 meses depois.
- **Solução**: Ferramenta Subtract na UI de criação, permitindo a demarcação reta de um **"Corredor"**. Atua apagando a validação nos cruzamentos ou criando retângulos avermelhados de exclusão `O(1)` na matriz de ocupação (CSG Layout simplificado).

### 2.4 Ponto de Transporte (Drop Point)
- Indicações topológicas puras. Um pino adicionado na UI marcando o *“Ponto de Saída dos Cabos Tensão CC”*, útil para estimativas de conduítes.

---

## 3. O Modo Prancheta (Blueprint Mode)

A funcionalidade chave desta refatoração é o estado transitório interativo.

- **Fase 1: Reconhecimento** (Mapa Satélite em evidência 100%).
- **Fase 2: The Lock-In** (Toggle "Focar no Arranjo").
  - O Layer do Satélite sofre um filtro saturado `brightness-50 saturate-0`.
  - O Pan geográfico flutua para a área focalizada do telhado limitando seu raio.
  - O fundo assume um visual de Grid Blueprint. Os limites de estrutura (trilhos hipotéticos e arestas cortantes) se acendem. O ambiente vira um Laboratório CAD livre do ruído visual.

---

## 4. Integração de Catálogo (Gêmeos Digitais)

O componente extingue qualquer hardcode. 
- O projeto assina as dimensões do banco: `ModulePhysicalSchema.widthMm` x `ModulePhysicalSchema.heightMm`.
- Estes módulos são rebaixados ou alterados dinamicamente, mantendo sempre a Escala Real `1:1`.

---

## 5. UI: O Engineering HUD & Ferramentas Cad

### The Structural Toolbar (Left Ribbon)
Vertical, densa, Glassmorpismo escuro industrial:
- Seletor Geométrico Mestre (Polígono) com sub-funções paramétricas (*Ortho-Snap ativo via SHIFT* a 0º, 45º, 90º da aresta originária).
- Ferramenta de Corredor (Subtração Retangular).
- Pin de Conduíte (Drop Point).
- Seletor de Direcionalidade de Montagem (Retrato/Paisagem associado à base).

### Status Ribbon On-The-Fly (Bottom)
Uma régua basal de monitoramento vivo:
- `Cursor (Lat/Lng | Y/X)` com tipografia tabular `font-mono`.
- Dimensionamento de Aresta ao vivo (Draw in Progress - Ex: `4.57m`).
- KPIs Sumários Rápidos de Execução: `Área Útil Ocupada`, `Trilhos Lineares Estimados`.

---

## 6. Critérios de Aceitação da Refatoração
- [ ] Remoção da nomenclatura `MapCore` substituída por Componentes Lógicos representativos do Arranjo (`PhysicalCanvas`).
- [ ] A ferramenta visual permite trocar entre Modo Satélite e Modo Prancheta (Blueprint).
- [ ] O algoritmo `autoLayoutArea` deve respeitar as bordas encolhidas pelas margens via checagem ampliada dos módulos e respeitar os Corredores.
- [ ] Propriedades operacionais (Tipo de Fixação, Safe Edge) estão controláveis do lado esquerdo do app nas propriedades da Área.
- [ ] Ortho-snap responsivo e intuitivo enquanto o projetista demarca o telhado.

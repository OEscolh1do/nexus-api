---
description: Documento Épico Mestre catalogando todas as sub-especificações (Fases) do UX-004 Center Canvas Promotions. Funciona como a base do roteiro de execução do speckit.
---

# ÉPICO UX-004: Center Canvas Promotions (The "Big Brother" Views)

## Visão Geral do Épico

A arquitetura do Workspace do Kurupira estabelece que o **Dock (`RightInspector`) é a versão simplificada e resumida** de inserção de parâmetros vitais ("irmão mais novo"). Por sua vez, ao expandir (promover) um desses módulos para ocupar a área central (`CenterCanvas`), renderizaremos uma **interface construída absolutamente do zero**, rica e exaustiva voltada quase exclusivamente para dashboards avançados e configurações profundas de engenharia ("irmão mais velho"). 

O esforço de implementação deste paradigma é colossal e imbuído de altos riscos de UX/UI se lançado em apenas um bloco. Portanto, a engenharia foi segregada estrategicamente em **4 Fases Sequenciais**, documentadas nos SPECs abaixo.

---

## [SPEC-001] Fase 1: Roteamento Polimórfico e Infraestrutura

**O Quê (Specify)**
O mecanismo atual promove literalmente o exato mesmo container (`SiteContextGroup`, por exemplo) estendido num layout max-w-4xl vazio. A Fase 1 foca estritamente em **desconectar** a exportação entre Dock e Canvas. 

**Características da Entrega:**
- Criação dos componentes puramente visuais e inertes (Hooks e Skeletons) denominados `*CanvasView.tsx`.
- Refatoração do `CenterCanvas.tsx` para interceptar a flag de *promoted* e acoplar a View Polimórfica C-Level correspondente (o *CanvasView* em branco) sem matar o `Leaflet`.
- **Risco**: Quebra de roteamento do layout. Manteremos os artefatos isolados para certificar transições `Fade-in` limpas e blindar o DOM.

---

## [SPEC-002] Fase 2: Site Context Canvas View (O Dossiê da Implantação)

**O Quê (Specify)**
A visão do Sítio se eleva de "Nome e Coordenada" para o **Dossiê Definitivo da Instalação**. 

**Características da Entrega (O Como):**
- **Climatologia Premium**: Um quadrante meteorológico expondo com ícones de estado os dados do `weatherData`, temperatura anual, radiação difusa local.
- **Relatório de Ligação**: Layout em Grid contendo detalhes profundos sobre a Medição (Tensão, Ramal, Distância do Relógio, Subestação associada).
- **Checklist Físico**: Áreas para assinalar Tipo de Telhado (Cerâmico, Fibrocimento) e restrições infra-estruturais georreferenciadas. Tudo hospedado puramente em layout de Glassmorphism.

---

## [SPEC-003] Fase 3: Electrical Canvas View (Hardware Topology)

**O Quê (Specify)**
No Dock, o engenheiro mexe em 5 sliders de Perdas de Eficiência (PR) de forma abstrata. No Center Canvas, a parte Elétrica exibe o "Como" a usina está mecanicamente costurada.

**Características da Entrega (O Como):**
- **Árvore Topológica Unifilar**: Componente relacional que mapeia hierarquicamente: `Inversor Principal -> Qtd MPs -> Strings Relativizadas -> Quantidade de Módulos`.
- **Dimensionador de Cabeamento (Dropy)**: Interface com inputs estendidos para inserir lances de cabos (Distâncias CA, DC) que calculam em tempo real a *% Queda de Tensão* teórica baseados nas predições resistivas do sistema principal.
- **Micro-Dashboards Físicos**: Gráficos I-V estáticos (Curva Tensão-Corrente) sofrendo clipagens ilustrativas guiadas pelas variáveis de *Mismatch* / *Soiling* operadas no menu dockeado.

---

## [SPEC-004] Fase 4: Simulation Canvas View (O Motor Paramétrico Energético)

**O Quê (Specify)**
O coração da refatoração UX-004. O gráfico minimalista sai de cena. Entra a suite hard-core de testes de performance focada em geração explodida e antecipação de hábitos enérgeticos.

**Características da Entrega (O Como):**
- **Load Simulator (Carrinho de Cargas Futuras)**: UI permitindo ao engenheiro arrastar (ou inputar) cargas futuras (Carro Elétrico de 90kg, Ar-Condicionado diário, etc). Criaremos uma Store Local Transitória (`useVirtualLoad`) para que essas injeções distorçam o Gráfico de Sobrevivência (Coverage) sem jamais poluir o "Consumo Oficial" no BD.
- **Gráficos de Perfil Diário e Campânula**: Migrar do BarChart mensal para gráficos de area da `Recharts` englobando O Perfil Teórico Horário/Diário para constatações de picos baseados no Tracking do sol e limites de inversor local.
- **Tuning Grid Paralelo**: Apresentação Lado-a-Lado de Irradiação e Consumo, viabilizando ajustes em massa sem rolagem com readequação imediata da cobertura energética.

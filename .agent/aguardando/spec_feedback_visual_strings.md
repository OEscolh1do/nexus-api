# Especificação: Pauta - Feedback Visual de Strings e Módulos Energizados

## 1. O Quê (Business Problem)
**Problema**: Atualmente, na visualização 2D/3D (WebGL), todos os módulos fotovoltaicos instalados (`PlacedModule`) parecem exatamente iguais. O engenheiro possui dificuldade de ver geograficamente onde cada *String* elétrica está conectada, dificultando a revisão, documentação e identificação de cabos longos desnecessários entre os módulos.
**Solução**: Implementar um sistema de código de cores dinâmico. Um módulo "livre" terá a aparência base escura. Um módulo "conectado" a uma string será colorido (nas bordas ou no interior da malha 3D/2D) com a cor da respectiva string, e uma **linha visual (Cabo/Fio)** conectará sequencialmente o centro de todos os módulos energizados na mesma sub-rede.

## 2. Usuários Finais
- **Engenheiro de Dimensionamento**: Ganha a habilidade de conferir no olho o "caminho da fiação" e ver se não colocou painéis muito isolados na mesma string elétrica, visualizando a topologia 3D perfeitamente.

## 3. Critérios de Aceitação (Definition of Done)
1. **Identidade Visual de String**: Cada String de MPPT recém-criada deve gerar ou possuir uma "Cor de Identificação" (ex: `#FF5733`, `#33FFA1`).
2. **Mudança de Estado do Módulo**: Em `ModuleMeshes.tsx` ou similar, se o painel `pm.stringData.inverterId` for assinado, a cor base (ou *wireframe*) do painel muda para a cor do seu circuito.
3. **Fio Encadeado (Cabling)**: O sistema deve rastrear e criar um render de linha (`Line` do Drei ou `BufferGeometry`) ligando o `[x, y, z]` central dos painéis pertencentes à mesma `stringData`, na ordem em que foram anexados ao arranjo.
4. **Resiliência de Performance**: Renderizar as linhas/fios como DrawCalls únicas (Instanced Mesh ou LineSegments) para que 300 fios não joguem o FPS para menos de 60 na Viewport.

## 4. Fora de Escopo
- Não faremos cálculos pesados de resistividade/queda de tensão baseados na *distância real* exata desse fio. O foco desta pauta é puramente o **feedback visual/estético do roteamento geográfico**, sem influenciar ainda o motor da `electricalMath`. 
- Não renderizaremos o fio até o local físico do Inversor (o Inversor ainda é lógico no Outliner e não tem posição no mapa). Os fios ligarão apenas as placas entre si.

---
*Status: Pauta suspensa em `/aguardando` para ser puxada no próximo ciclo ativo de refatoração do Motor 3D.*

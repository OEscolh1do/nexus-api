# Especificação: Integração do Unifilar com Símbolos de Equipamento

## 1. O Quê (Business Problem)
**Problema**: O campo `unifilarSymbolRef` existe nos schemas Zod dos equipamentos (`inverterSchema`, `moduleSchema`) mas não está conectado a nenhum motor de renderização. O diagrama unifilar — documento obrigatório para homologação de sistemas fotovoltaicos — ainda não é gerado automaticamente pelo Kurupira.

**Solução**: Conectar os `unifilarSymbolRef` dos equipamentos cadastrados no catálogo a um motor de renderização SVG/Canvas que gere automaticamente o diagrama unifilar do sistema dimensionado, com os símbolos corretos para cada componente.

## 2. Usuários Finais
- **Engenheiro de Dimensionamento**: Gera o unifilar automaticamente ao finalizar o dimensionamento.
- **Documentação Técnica**: O módulo `/documentation` pode consumir o SVG para embarcação no Memorial Descritivo PDF.

## 3. Critérios de Aceitação
1. Cada equipamento do catálogo possui um `unifilarSymbolRef` que aponta para um template SVG pré-definido.
2. O motor de unifilar lê a topologia elétrica do projeto (inversores → MPPTs → strings → módulos) e renderiza o diagrama.
3. O diagrama respeita a norma ABNT NBR 5410 / NBR 16690 (simbologia padrão).
4. O resultado é exportável como SVG e PNG.
5. Módulos em série numa string são representados como um único bloco com indicação de quantidade.

## 4. Fora de Escopo
- Geração automática de ART (Anotação de Responsabilidade Técnica).
- Cálculos de queda de tensão representados no unifilar (visual only).
- Editor manual de unifilar (drag-and-drop de componentes) — apenas auto-geração.

## 5. Dependências
- **P6 (Dimensionamento Elétrico Avançado)**: A topologia de strings/MPPTs precisa estar funcional para alimentar o unifilar.
- **Biblioteca de Símbolos SVG**: Criar sprites para: módulo PV, inversor, string box, disjuntor CC/CA, DPS, medidor, rede.

## 6. Arquitetura Proposta
```
useTechStore (topologia elétrica)
       │
       ▼
UnifilarEngine.ts (lê inversores → MPPTs → strings → módulos)
       │
       ▼
SVG Renderer (símbolos posicionados em árvore hierárquica)
       │
       ▼
UnifilarPreview.tsx (react component renderiza SVG inline)
       │
       ▼
Export: SVG / PNG / embed no PDF (DocumentationModule)
```

---
*Status: Aguardando conclusão do P6 (topologia elétrica funcional) para ser iniciada.*

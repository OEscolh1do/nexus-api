---
description: Metodologia obrigatória para debugar falhas silenciosas de UI e Estado (Zustand/React).
---

# /trace: Data Flow Analysis (Trace de Fluxo de Dados)

O comando `/trace` força o agente a abandonar tentativas de "força bruta" ou palpites arquiteturais e assumir uma postura clínica de inspeção de dados ao lidar com falhas silenciosas no frontend (onde não há erros explodindo no console, mas a UI não reflete a ação do usuário).

## Quando Usar
Sempre que o desenvolvedor relatar: "O botão não faz nada", "A lista não atualiza", "O estado não salva" ou "A tela congela numa ação específica" e os logs no console estiverem limpos.

## Protocolo de Execução Obrigatório

### 1. Mapeamento da Cadeia (Pipeline Mapping)
O agente deve primeiro descrever no chat a cadeia teórica de execução:
1. **Origem:** Onde a ação do usuário nasce (Ex: componente do botão, arquivo XYZ.tsx).
2. **Transporte:** Como a ação viaja (Ex: Prop drilling, UseContext, chamada de action do Zustand).
3. **Barreiras Condicionais:** Listar todos os `if`, `return` e `try/catch` que ficam no caminho entre a Origem e o Destino.
4. **Destino:** Onde o dado deveria repousar (Ex: mutation no backend local, alteração na store do Zustand).

### 2. Injeção de Sondas (Log Injection)
O agente deve utilizar `multi_replace_file_content` para injetar `console.log()` cirúrgicos:
- **Sonda Alpha:** No evento imediato do usuário (Ex: `onClick`, `handleMapClick`). Para provar que o listener foi engatilhado.
- **Sondas Beta:** Logo após cada barreira condicional mapeada no passo 1.
- **Sonda Ômega:** Na função mutadora final (ex: dento do `set()` do Zustand ou antes do `fetch` da API) exibindo o payload exato que chegou lá.

### 3. Execução e Diagnóstico
O agente deve solicitar que o desenvolvedor execute a ação na UI e cole os logs retornados pelo console.
Com base nos logs, o agente identifica exatamente em qual "Barreira" o dado morreu (o último `console.log` impresso).

### 4. Limpeza (Cleanup)
Assim que o problema for diagnosticado e corrigido, o agente deve **obrigatoriamente** varrer os arquivos e remover todos os `console.log` puramente de debug que ele mesmo injetou no Passo 2.

# Especificação: Refatoração dos Catálogos (Inversores e Módulos)

## 1. Problema de Negócio
A interface atual de seleção de equipamentos do catálogo possui duas limitações principais que reduzem a produtividade do engenheiro:
1. **Filtros Ineficientes:** Os painéis de filtro possuem muitos campos manuais (Min kW, Max kW, Fases, etc.) que poluem a UI e muitas vezes não são usados ou são lentos de preencher.
2. **Inserção em Lote Ausente:** Para adicionar 10 inversores iguais, o usuário precisa clicar no botão "Adicionar" 10 vezes (ou adicionar 1 e depois ir no inventário subir a quantidade). Não há campo de quantidade prévia no ato da inserção no catálogo.

## 2. O Que Será Construído (Escopo)

### 2.1 Refatoração Inteligente de Filtros
- **Remoção dos Inputs Manuais:** Remover os campos de Min kW, Max kW e Min MPPTs.
- **Busca Omnitext (Smart Search):** Turbinar o campo de busca principal. Ele deverá ser capaz de pesquisar por modelo **e** marca simultaneamente (ex: pesquisar "Growatt 50" deverá listar os inversores Growatt de 50kW).
- **Categorias Prontas (Chips/Tabs):** Substituir as caixas de seleção por "Chips" rápidos de clique único para faixas de potência ou aplicação e conexões:
  - Para Inversores: *Monofásico, Trifásico* | *Residencial (<10kW), Comercial (10-50kW), Usina (>50kW)*.
  - Para Módulos: *Tier 1, Bifacial* | *Até 400W, 400-550W, >550W*.

### 2.2 Inserção em Lote (Quantidade)
- O `InverterInventoryItem` e `ModuleInventoryItem` (quando exibidos no modo catálogo `mode="catalog"`) passarão a exibir um seletor de quantidade numérico `[ - | 1 | + ]` adjacente ao botão de **Adicionar**.
- O botão **Adicionar** enviará a quantidade selecionada de uma vez para o inventário do projeto.

## 3. Critérios de Aceitação (Definition of Done)
1. O painel superior de filtros (InverterFilterPanel / ModuleFilterPanel) deve ser mais limpo (apenas Smart Search e Chips Categorizados).
2. O filtro de busca em texto deve casar Manufacturer + Model + Potência.
3. Deve ser possível selecionar quantidade = 5 no card do catálogo e clicar em "Adicionar", e o inventário do projeto deve receber os 5 itens instantaneamente.
4. Ao adicionar, o modal deve permanecer aberto para permitir adicionar outros tipos (caso o usuário queira) ou exibir um Toast indicando sucesso.

## 4. Fora de Escopo
- Alterações no CRUD do catálogo (CatalogEditor / persistência no banco de dados TiDB) continuam como estão; essa refatoração é apenas na tela de busca do Workspace de Engenharia.

---
*Status: Especificação — Aguardando sua revisão e aprovação. Deseja ajustar algo nesta spec ou podemos ir para a Etapa 2 (Plano de Implementação)?*

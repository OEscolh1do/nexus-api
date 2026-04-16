# Parecer Técnico — Auditoria e Orientação de Execução (Jornada do Integrador)
**Data:** 2026-04-15
**Revisor:** Eng. Vítor Ramos (Persona — engenheiro-eletricista-pv)
**Escopo:** Avaliação da coerência arquitetural e ordenação de dependências na nova Jornada de Dimensionamento.

---

## Sumário Executivo

A refatoração da arquitetura proposta na v2.0 para um modelo de "Bloco ↔ View" aproxima o software da forma real como o projetista elétrico pensa: o dimensionamento não é linear, é um ciclo iterativo guiado por restrições operacionais (HSP vs. Consumo → Área Física vs. Strings → Inversor vs. Proteções). A mudança do stepper impositivo para um **LeftOutliner paramétrico sincronizado** traz a flexibilidade necessária em escopos reais de engenharia.

A sequência de execução foi renomeada nos arquivos para prover o melhor encaixe estrutural entre as dependências (Estado global → Componentes de UI → Modelagem profunda → Lógica de aprovação). Abaixo apresento a justificativa técnica para a hierarquia de execução recomendada.

---

## Ordenação Estrutural e Justificativa (Prefixos Aplicados)

| Ordem | Arquivo/Spec | Justificativa de Engenharia |
|-------|-------------|----------------------------|
| **00** | `scope-jornada-integrador...` | Cimento comum. O contrato arquitetural final. |
| **01** | `spec-sincronia-bloco-canvas...` | (Zustand: `uiStore`) Estabelece a artéria principal: a garantia de que, ao tocar num equipamento (Bloco), o contexto de projeto (Canvas View) mude instantaneamente. Sem isso não existe "Jornada". |
| **02** | `spec-jornada-integrador...` | Roteia a lógica termodinâmica de base (Consumo kWh → Radiação → PR → kWp Alvo). A entrada de dados que restringe o restante do dimensionamento. |
| **03** | `spec-compositor-blocos...` | UI que exibe os alarmes e os chips do resultado computado nas etapas prévias (ex: checkup do Mismatch DC/AC e limites de string). |
| **04** | `spec-foco-tatil...` | Ergonomia essencial do painel de engenharia (foco e atenção visual imediata sobre itens de desbalanceamento). |
| **05** | `spec-edicao-inline-blocos...` | Ferramenta anti-fricção essencial: evitar que o engenheiro perca a visão macro da planta ao ter que alterar uma premissa simples (como um % excedente). |
| **06** | `spec-guardiao-aprovacao...` | Cumpriu ABNT/NBR, não há sobrecarga (FDI/Overload OK)? A planta é então validada. Funciona como a restrição final para emissão da ART/Proposta. |
| **07** | `spec-multiplas-propostas...` | Controle de variante para "Proposta Limite vs Econômica", uma prática comercial ubíqua para gerenciar paybacks que precisa ser espelhada na arquitetura (DB Variants). |
| **08** | `spec-left-outliner-flat-tree...` | **Crítico**. O modelo abstrato antigo falhava em análises profundas. Substituindo multiplicadores genéricos por UUIDs reais preparamos a engine para identificar mismatch específico e modelagem em árvore precisa para strings vs telhado. |
| **09** | `spec-bloco-arranjo-fisico...` | Etapa downstream ligada ao posicionamento 3D/MapCore (depende do total calculado no passo 02 e módulos do passo 03). |
| **10** | `spec-multi-inversor...` | O mais complexo do fluxo, dependente de toda fundação do estado paramétrico sólido (quando o Oversize e perdas escalam por Arrays em paralelo). |

---

## Parecer Técnico: Limpeza de Arquitetura

**Status:** ✅ Aprovado com Louvor

Considerações cruciais sobre as modelagens finais:

1.  **Guardião de Aprovação (Item 06):** O fato de o bloqueio ser um **"Soft Block"** (permite forçar com *Warning*, caso a simulação preveja algum limite elétrico proposital de *clipping* que o engenheiro deseja testar na ponta) reflete uma compreensão perfeita da Engenharia. Em campo, há cenários onde propositalmente violamos regras leves de manual do fabricante (sujeito à análise empírica).
2.  **Modelagem `LeftOutliner Flat Tree` (Item 08):** Esta é a "joia da coroa" do motor de dimensionamento do Kurupira para alcançar um nível de software robusto como o PVsyst. Abandonar a lógica de "N unid." por instâncias individuais é o pré-requisito funcional de que precisávamos para gerar relatórios de sombreamento críveis e balanço por MPPT simétrico/assimétrico em strings divididas.

Todos os documentos foram lidos e prefixados de `00` a `10` nos respectivos nomes de arquivos no diretório em andamento, respeitando o empilhamento das "Fundações de Estado" antes da "Modelagem Elétrica". Seu repositório agora está indexado e pode ser seguido linearmente pelo desenvolvedor.

# Escopo — Jornada Completa do Integrador

**Tipo:** Épico de Experiência (orquestra specs existentes)
**Módulo:** Transversal — `engineering` + `proposal` + `documentation`
**Prioridade:** P0 — Bloqueante
**Responsável (impl.):** `the-builder`
**Revisor (aceitação):** `engenheiro-eletricista-pv` + `design-lead`
**Data de criação:** 2026-04-14
**Versão:** 1.0
**Origem:** consolidação das specs do Compositor de Blocos + TRL 7-8

---

## 1. O que é este documento

Este escopo não introduz código novo. Ele define a **experiência completa do integrador**
como uma narrativa com começo, meio e fim — e mapeia cada momento dessa narrativa a uma
spec técnica já escrita ou ao componente já existente que o sustenta.

O propósito é duplo: garantir que as specs individuais (Compositor, Blocos, Edição Inline,
Arranjo Físico) se encaixem como uma jornada coerente; e expor as lacunas que ainda não
têm spec — os momentos em que a narrativa quebra e o integrador fica sem saber o que fazer.

**Critério de conclusão deste épico:**

> O integrador abre o Kurupira, cria um projeto para um cliente real em Parauapebas-PA,
> dimensiona o sistema usando o Compositor de Blocos, valida a elétrica, posiciona os
> módulos no telhado, aprova o sistema e gera a proposta — do zero à entrega, sem
> planilha paralela e sem consultar um colega sobre o que fazer a seguir.

---

## 2. A Jornada em 6 Atos

```
Ato 1 — Entrada        Ato 2 — Consumo       Ato 3 — Dimensionamento
  Criar projeto    →     Inserir faturas   →     Compositor de Blocos
  Hub → Workspace        + localização           (Módulo + Arranjo + Inversor)

Ato 4 — Posicionamento  Ato 5 — Aprovação     Ato 6 — Saída
  Canvas Leaflet    →     Todos os chips   →     Proposta + Documentação
  telhado + módulos       verdes → Aprovar
```

Cada ato tem: um objetivo claro para o integrador, os componentes que o servem, e a
lacuna atual (o que falta para o ato ser fluido).

---

## 3. Ato 1 — Entrada: Criar ou Abrir Projeto

### O que o integrador quer fazer
Chegar ao workspace de dimensionamento de um projeto específico, sem fricção.

### Dois caminhos de entrada

**Caminho A — via Iaçã (CRM):** lead qualificado no pipeline → botão "Dimensionar"
→ deep link com `?leadId=X&token=JWT` → Kurupira abre com dados do cliente pré-carregados
(nome, cidade, tarifa, consumo se disponível).

**Caminho B — standalone (Eng-First):** integrador abre o Kurupira diretamente →
Hub de Projetos → "+ Novo Projeto" → `ProjectInitWizardModal` (3 passos: cliente,
localização, conexão) → workspace abre.

### Estado atual
✅ Ambos os caminhos existem e funcionam (`v3.2.0`).
✅ Bootstrap de equipamentos default ao abrir projeto vazio (`MODULE_CATALOG[0]` + `INVERTER_CATALOG[0]`).
⚠️ Ao abrir o workspace, o integrador cai diretamente no canvas Leaflet vazio, sem
orientação de onde começar.

### Lacuna — ponto de entrada no Compositor
Ao abrir um projeto novo, o workspace deveria abrir automaticamente na
`ComposerCanvasView` (não no canvas Leaflet), com os 4 blocos visíveis. O integrador
vê imediatamente onde está e o que falta — os placeholders comunicam a próxima ação.

**Spec responsável:** `spec-compositor-blocos-2026-04-14` — comportamento de abertura
padrão. Adicionar ao critério de aceite: projeto novo → `activeCanvasView = 'composer'`.

---

## 4. Ato 2 — Consumo: Inserir Dados do Cliente

### O que o integrador quer fazer
Informar o consumo histórico do cliente e os dados da instalação para que o sistema
calcule o `kWp alvo` automaticamente.

### Fluxo esperado

1. No Compositor, o Bloco Consumo está em placeholder (cinza, tracejado).
2. O integrador clica no bloco → abre em modo edição inline.
3. Insere o consumo médio mensal (ou abre as 12 faturas via "Mais opções →").
4. Insere a tarifa e confirma a cidade (pré-carregada do wizard de criação).
5. O campo `fator de crescimento` é opcional — default 0%.
6. O conector `Consumo → Módulo` passa a exibir `kWp alvo: X.XX kWp`.
7. O Bloco Consumo fica verde.

### Estado atual
⚠️ `ConsumptionCanvasView` (Etapa 1 da spec anterior) ainda não existe como view
completa. O `CustomerTab` está desplugado.
✅ Os campos de consumo existem no `clientData` do `solarStore`.
✅ Cálculo de `kWpAlvo` especificado na `spec-jornada-integrador-2026-04-14` §2.3.

### Lacuna — Bloco Consumo editável
O Bloco Consumo no Compositor precisa dos campos inline definidos na
`spec-edicao-inline-blocos-2026-04-14` §3.1. Sem eles, o integrador cai de volta
para um fluxo sem orientação.

**Entrada de dados obrigatória para continuar:** consumo médio > 0 && cidade preenchida.

**Specs responsáveis:**
- `spec-compositor-blocos-2026-04-14` — Bloco Consumo com placeholder
- `spec-edicao-inline-blocos-2026-04-14` §3.1 — campos inline do Bloco Consumo

---

## 5. Ato 3 — Dimensionamento: Compositor de Blocos

### O que o integrador quer fazer
Escolher os equipamentos, ver o sistema se montar e validar que está coerente —
sem precisar entender a árvore elétrica para isso.

### Fluxo esperado — caminho rápido (Dimensionamento Inteligente)

1. Bloco Consumo verde → botão "Dimensionamento Inteligente" no TopRibbon fica ativo.
2. Integrador clica → animação: Bloco Módulo materializa com modelo sugerido e
   quantidade calculada → Bloco Arranjo mostra placeholder aguardando posicionamento →
   Bloco Inversor materializa com modelo compatível.
3. Todos os chips verdes? Sistema está dimensionado. Segue para o Ato 4.
4. Algum chip vermelho ou âmbar? O integrador clica no bloco problemático,
   edita inline, e o chip atualiza em tempo real.

### Fluxo esperado — caminho manual

1. Bloco Módulo: integrador clica → modo edição → campo "Modelo" abre
   `ModuleCatalogDialog` → seleciona → campo quantidade é sugerido automaticamente
   com base no `kWp alvo`.
2. Bloco Inversor: integrador clica → modo edição → campo "Modelo" abre
   `InverterCatalogDialog` → seleciona → chips de validação aparecem imediatamente.
3. Ajustes: integrador edita strings por MPPT e módulos por string inline até
   todos os chips ficarem verdes.

### Regras de validação visível nos chips (Bloco Inversor)

| Chip | Verde | Âmbar | Vermelho |
|------|-------|-------|---------|
| Ratio DC/AC | 1.10–1.25 | 1.05–1.09 ou 1.26–1.35 | < 1.05 ou > 1.35 |
| Voc máx | ≤ 95% do V\_max inversor | 95–100% | > 100% |
| Isc MPPT | ≤ I\_max MPPT | — | > I\_max MPPT |

### Estado atual
✅ `useAutoSizing.ts` e `SolarCalculator.ts` existem e funcionam.
✅ `ModuleCatalogDialog` e `InverterCatalogDialog` operacionais (v3.3.0).
✅ `calculateStringMetrics()` calcula Voc, Isc por string.
⚠️ `ComposerCanvasView` não existe ainda (Fase B da spec do Compositor).
⚠️ Edição inline não existe ainda.
⚠️ Animação do Dimensionamento Inteligente não existe.

**Specs responsáveis:**
- `spec-compositor-blocos-2026-04-14` — Compositor completo com todos os blocos
- `spec-edicao-inline-blocos-2026-04-14` — edição inline nos blocos Módulo e Inversor
- `spec-compositor-blocos-2026-04-14` §2.3 — animação do Dimensionamento Inteligente

---

## 6. Ato 4 — Posicionamento: Módulos no Telhado

### O que o integrador quer fazer
Posicionar os módulos fisicamente no telhado do cliente, usando a imagem de satélite
como referência, e confirmar que a quantidade física bate com a topologia elétrica.

### Fluxo esperado

1. No Compositor, o Bloco Arranjo está com placeholder "Nenhuma área desenhada".
2. Integrador clica em "Abrir canvas para desenhar →" → navega para `MapCore`.
3. Seleciona ferramenta "Desenhar Área" → desenha o polígono do telhado.
4. Clica em "Preencher (Auto-Layout)" → módulos são posicionados automaticamente.
5. Retorna ao Compositor → Bloco Arranjo agora exibe: área total, FDI, e o chip
   de consistência.
6. Chip de consistência verde = `physicalCount === logicalCount`. Se divergir, o
   chip mostra o delta e o integrador ajusta (adiciona módulos no canvas ou ajusta
   a topologia no Bloco Inversor).

### Estado atual
✅ `InstallationArea` freeform completa (v3.1.0 + P10/P10.1).
✅ Auto-Layout com otimização Portrait/Landscape implementado.
✅ Cruzamento físico-lógico especificado no `HealthCheckWidget`.
⚠️ Bloco de Arranjo no Compositor não existe ainda.
⚠️ Chip de consistência no Compositor não existe.
⚠️ Navegação "Abrir canvas para desenhar" não existe.

**Spec responsável:** `spec-bloco-arranjo-fisico-2026-04-14` — Bloco de Arranjo completo
com placeholder, chips e navegação bidirecional.

---

## 7. Ato 5 — Aprovação: Sistema Validado

### O que o integrador quer fazer
Confirmar que o sistema está pronto para virar proposta e travá-lo para evitar
edições acidentais.

### Fluxo esperado

1. Compositor com 4 blocos: todos verdes.
2. Botão "Aprovar sistema" fica ativo na `TopRibbon` (hoje existe como dropdown
   `Rascunho → Aprovado`).
3. Integrador clica → projeto muda para estado `APPROVED` → campos travados.
4. Botão "Gerar Proposta" aparece proeminente no Compositor.

### Estado atual
✅ Estados `DRAFT` e `APPROVED` existem no backend.
✅ Dropdown de aprovação no `TopRibbon` existe.
⚠️ O botão de aprovação não está vinculado ao estado dos chips do Compositor —
   o integrador pode aprovar um sistema com chips vermelhos.
⚠️ Botão "Gerar Proposta" a partir do Compositor não existe.

### Lacuna — Guardião de aprovação

A aprovação deve ser condicionada ao estado do `systemCompositionSlice`: só é
permitida quando `consumptionBlock.status === 'complete'` &&
`moduleBlock.status === 'complete'` && `arrangementBlock.status !== 'error'` &&
`inverterBlock.status === 'complete'`.

Se o integrador tentar aprovar com blocos incompletos, o botão exibe um tooltip
listando os blocos que precisam de atenção. Não é um bloqueio duro — o integrador
pode forçar com confirmação — mas o padrão é guiar, não obstruir.

**Spec nova necessária:** `spec-guardiao-aprovacao` — conectar o estado do Compositor
ao botão de aprovação no `TopRibbon` e expor o botão "Gerar Proposta" no Compositor
após aprovação.

---

## 8. Ato 6 — Saída: Proposta e Documentação

### O que o integrador quer fazer
Gerar a proposta para o cliente (PDF com simulação financeira, lista de materiais,
e especificações técnicas) e o memorial descritivo para homologação na distribuidora.

### Fluxo esperado

1. Projeto aprovado → botão "Gerar Proposta" no Compositor.
2. Kurupira redireciona para o módulo de Proposta (`proposal/`) com os dados do
   dimensionamento já preenchidos.
3. Integrador revisa e ajusta preços, margens e condições comerciais.
4. Gera PDF com: simulação de geração vs consumo (12 meses), economia anual em R$,
   payback estimado, lista de materiais com quantidades e modelos, especificação
   técnica resumida.
5. Memorial descritivo disponível separadamente via módulo `documentation/`.

### Estado atual
✅ Módulo `proposal/` existe com `useProposalCalculator`.
✅ Módulo `documentation/` existe.
⚠️ Motor de geração usa 30 dias fixos/mês (Gap G1 do TRL 7-8) — economia em R$
   calculada com dado incorreto.
⚠️ Sem tradução monetária kWh → R$ com Custo de Disponibilidade ANEEL (Gap G2).
⚠️ Conexão Compositor → Proposta não existe (botão "Gerar Proposta" ausente).
⚠️ Payback não calculado automaticamente.

**Specs responsáveis:**
- `spec-motor-analitico-faturado` (em `.agent/aguardando`) — corrigir 30 dias fixos
- `spec-monetizacao-banco-creditos` (em `.agent/aguardando`) — kWh → R$ + ANEEL
- `spec-guardiao-aprovacao` (nova, §7) — botão "Gerar Proposta" no Compositor

---

## 9. Mapa de Dependências entre Specs

As specs do Compositor formam uma cadeia de dependências. A ordem de implementação
é definida por essa cadeia — não por prioridade arbitrária.

```
spec-compositor-blocos (Fase A: systemCompositionSlice)
  └── spec-compositor-blocos (Fase B: ComposerCanvasView estática)
        ├── spec-bloco-arranjo-fisico (Bloco de Arranjo)
        ├── spec-edicao-inline-blocos (Fase 1: extrair PropRowEditable)
        │     └── spec-edicao-inline-blocos (Fase 2-5: campos por bloco)
        └── spec-compositor-blocos (Fase D: animação Dimensionamento Inteligente)
              └── spec-guardiao-aprovacao (nova — conecta Compositor à aprovação)
                    └── Ato 6 desbloqueado (Proposta + Documentação)
```

Specs em `.agent/aguardando` que bloqueiam o Ato 6:
- `spec-motor-analitico-faturado` — sem isso, a economia em R$ está errada
- `spec-monetizacao-banco-creditos` — sem isso, não há payback

Essas duas podem ser implementadas em paralelo com o Compositor (não dependem da
`ComposerCanvasView`) mas precisam estar concluídas antes que o Ato 6 seja entregue.

---

## 10. Lacunas sem spec (trabalho novo identificado)

### Lacuna A — `spec-guardiao-aprovacao`

O botão de aprovação no `TopRibbon` precisa ser conectado ao estado do
`systemCompositionSlice`. Sem isso, o integrador pode gerar uma proposta de um sistema
com chips vermelhos. Escopo pequeno — modificação no `TopRibbon.tsx` + exposição do
botão "Gerar Proposta" no `ComposerCanvasView`.

### Lacuna B — Abertura padrão no Compositor

Projeto novo → `activeCanvasView = 'composer'`. Uma linha de código, mas precisa
estar explicitamente especificada para não ser esquecida na implementação.

### Lacuna C — Feedback do Dimensionamento Inteligente no estado vazio

Quando o integrador está no Compositor com o Bloco Consumo ainda em placeholder
(Ato 2 incompleto), o botão "Dimensionamento Inteligente" no `TopRibbon` deve
estar desabilitado com tooltip explicativo: "Insira o consumo do cliente primeiro".
Hoje o botão existe mas não valida pré-condições.

---

## 11. Tabela de rastreabilidade: momento da jornada → spec → estado

| Momento | Spec responsável | Estado |
|---------|-----------------|--------|
| Criar projeto (Hub → Workspace) | Implementado v3.2.0 | ✅ |
| Bootstrap de equipamentos default | Implementado v3.1.0 | ✅ |
| Abertura padrão no Compositor | spec-compositor-blocos + Lacuna B | ⚠️ Falta |
| Bloco Consumo placeholder | spec-compositor-blocos Fase B | ⚠️ Falta |
| Bloco Consumo edição inline | spec-edicao-inline-blocos §3.1 | ⚠️ Falta |
| Cálculo kWp alvo em tempo real | spec-compositor-blocos §2.2 | ⚠️ Falta |
| Dimensionamento Inteligente animado | spec-compositor-blocos §2.3 | ⚠️ Falta |
| Bloco Módulo FV chips de status | spec-compositor-blocos Fase B | ⚠️ Falta |
| Bloco Módulo FV edição inline | spec-edicao-inline-blocos §3.2 | ⚠️ Falta |
| Bloco Inversor chips de validação | spec-compositor-blocos Fase B | ⚠️ Falta |
| Bloco Inversor edição inline | spec-edicao-inline-blocos §3.4 | ⚠️ Falta |
| Bloco Arranjo físico | spec-bloco-arranjo-fisico | ⚠️ Falta |
| Navegação Compositor → canvas Leaflet | spec-bloco-arranjo-fisico §2.6 | ⚠️ Falta |
| Chip de consistência físico-lógico | spec-bloco-arranjo-fisico §2.3 | ⚠️ Falta |
| Aprovação condicionada ao Compositor | spec-guardiao-aprovacao (nova) | ❌ Sem spec |
| Botão "Gerar Proposta" no Compositor | spec-guardiao-aprovacao (nova) | ❌ Sem spec |
| Economia em R$ no módulo Proposta | spec-monetizacao-banco-creditos | ⚠️ Aguardando |
| Payback calculado automaticamente | spec-monetizacao-banco-creditos | ⚠️ Aguardando |
| Motor de geração correto (dias reais) | spec-motor-analitico-faturado | ⚠️ Aguardando |

---

## 12. Critérios de Aceitação do Épico

O épico está concluído quando o seguinte fluxo for executável sem interrupção:

- [ ] Integrador cria projeto no Hub → workspace abre no Compositor
- [ ] Compositor mostra 4 blocos (3 placeholders + Consumo editável)
- [ ] Integrador insere consumo médio → `kWp alvo` aparece no conector
- [ ] Integrador clica "Dimensionamento Inteligente" → 3 blocos materializam com animação
- [ ] Pelo menos um chip aparece não-verde → integrador edita inline → chip fica verde
- [ ] Integrador clica "Abrir canvas" no Bloco Arranjo → desenha área → Auto-Layout preenche
- [ ] Retorna ao Compositor → chip de consistência mostra estado correto
- [ ] Todos os chips verdes → botão "Aprovar sistema" ativa sem tooltip de aviso
- [ ] Integrador aprova → botão "Gerar Proposta" aparece
- [ ] Proposta gerada mostra economia em R$ e payback com valores corretos

---

## 13. Fora do escopo deste épico

- **Módulo BOS (cabos, proteções)** — desbloqueado pelo épico mas não contido nele
- **Diagrama unifilar automático** — `spec-integracao-unifilar-simbolos` (aguardando topologia P6)
- **Multi-inversor no Compositor** — fase futura; este épico assume 1 inversor por projeto
- **App mobile** — o Compositor é responsivo por design mas otimização mobile é épico separado
- **Integração com distribuidoras (AcessoNet/GD)** — documentação para homologação é gerada mas
  o envio eletrônico está fora do escopo

---

## Referências

- Compositor de Blocos: `spec-compositor-blocos-2026-04-14.md`
- Bloco de Arranjo Físico: `spec-bloco-arranjo-fisico-2026-04-14.md`
- Edição Inline: `spec-edicao-inline-blocos-2026-04-14.md`
- Motor analítico: `.agent/aguardando/spec-motor-analitico-faturado`
- Monetização: `.agent/aguardando/spec-monetizacao-banco-creditos`
- TRL 7-8 definitivo: `.agent/concluidos/Epic-TRL8-Workspace/SCOPE-TRL8-DEFINITIVO.md`
- Mapa de interface: `docs/interface/mapa-dimensionamento.md`

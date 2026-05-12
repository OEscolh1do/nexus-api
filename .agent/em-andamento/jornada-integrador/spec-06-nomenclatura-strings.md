# SPEC-06 — Nomenclatura Alfanumérica e UI Orientada a Strings

> **Gap:** `#6 — Nomenclatura de Anilhas e Gestão de Strings`
> **Criticidade:** 🔴 Crítico (Requisito Normativo para Diagramas Unifilares e Usabilidade Executiva)
> **Norma:** Práticas de Projeto Executivo Fotovoltaico

---

## Problema

Atualmente, o sistema trata a configuração de arranjos no inversor como variáveis agregadas (`modulesPerString` e `stringsCount`) dentro do `MPPTConfig`. Além disso, a `LogicalString` gera nomes vagos como `String 1`. Isso inviabiliza projetos detalhados onde cada string pode ter distâncias de cabeamento (Spec-04) diferentes, além de dificultar o rastreio visual do usuário no diagrama unifilar.

**Consequência prática:** O usuário não consegue configurar um cabo de 4mm² para a string A e 6mm² para a string B no mesmo MPPT. Além disso, se houver um erro de fusível ou queda de tensão, o alerta será genérico ("MPPT 1") em vez de pontual ("INV-01.M1.S2").

**Código afetado:**
- `useTechStore.ts` — Interface `LogicalString` e métodos de criação.
- `MPPTConfigStrip.tsx` — UI do Card de MPPT.

---

## Usuário

**Integrador** e **Instalador de Campo** que precisam ler a anilha do cabo no momento da montagem e conferir a tensão exata projetada para aquela ramificação.

---

## Definition of Done

1. **Nomenclatura Padrão**: As strings criadas no motor elétrico devem seguir o padrão `INV-XX.MY.SZ` (Ex: `INV-01.M1.S1`).
   - `XX`: Índice do Inversor (01, 02...).
   - `Y`: Índice do MPPT (1, 2...).
   - `Z`: Índice da String dentro do MPPT.
2. **Card MPPT Orientado a Strings**: A UI `MPPTConfigStrip` deve abandonar os steppers genéricos. No lugar, deve existir um botão `+ Adicionar String`.
3. **Inputs por String**: Cada string renderizada dentro do card deve possuir seus inputs individuais:
   - Quantidade de Módulos
   - Comprimento do Cabo (m)
   - Seção do Cabo (mm²)
4. **Remoção de String**: Cada string individual pode ser excluída via ícone de lixeira.
5. **Migração Transparente**: O `techStore` deve suportar e salvar esses inputs individuais associados ao ID da string lógica, em vez do MPPT global.

---

## Fora do Escopo

- ❌ Geração automática de etiquetas para impressão Dymo.
- ❌ Representação 3D das anilhas no telhado (apenas aba elétrica).

---

## Dike — Análise Estática de Riscos

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Quebra de compatibilidade com projetos legados que usavam `stringsCount` | Alta | Migração progressiva: tratar `stringsCount` legado gerando N instâncias de `LogicalString` ao carregar, ou adotar um padrão de fallback visual. |
| Altura do card MPPT crescer excessivamente | Média | Usar UI condensada (flex row) para os 3 inputs (Módulos, Comprimento, Seção). |

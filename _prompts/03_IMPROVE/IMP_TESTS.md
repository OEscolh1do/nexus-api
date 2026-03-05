# 🧪 TEMPLATE 06: O TESTADOR (Unit Tests)

> **📍 VOCÊ ESTÁ AQUI:** 🏠 [Início](./) > 🛠️ Templates > 🧪 Template 06 - Testes  
> **🎯 OBJETIVO:** Criar testes automatizados para código crítico  
> **⏱️ TEMPO:** 2min preencher | 3-7min IA escrever testes  
> **🛠️ PRÉ-REQUISITO:** Código funcional que precisa de cobertura de teste

---

> **💡 PARA QUE SERVE?**
>
> **O Cenário:** Você escreveu uma lógica complexa (um cálculo, um parser) e quer garantir que ela não quebre.
>
> **A Abordagem:** Peça para a IA agir como QA. Ela vai pensar em "Edge Cases" (casos de borda) que você nem imaginou.

## ✅ Checklist Antes de Testar

- [ ] O código a ser testado **está funcionando** (não teste código bugado!)
- [ ] Sei qual **framework de teste** usar (Jest? Vitest? Cypress?)
- [ ] Identifiquei **funções críticas** (cálculos, validações, transformações)

**💡 Priorize:** Teste primeiro as funções que mais causariam dano se quebrassem.

---

## ✂️ COPIE ISSO AQUI:

```xml
<system_role>
  Atue como Engenheiro de QA (Quality Assurance).
  Ferramenta: {{EX: JEST / VITEST / CYPRESS}}.
</system_role>

<mission>
  Criar cobertura de testes para o arquivo: "{{NOME_DO_ARQUIVO}}".
</mission>

<source_code>
  <file path="{{CAMINHO_DO_ARQUIVO_PARA_TESTAR}}" />
</source_code>

<test_strategy>
  1. Crie o arquivo de teste `{{NOME_DO_ARQUIVO}}.test.ts`.
  2. Cubra o "Caminho Feliz" (Happy Path) - O uso normal.
  3. Cubra os "Casos de Borda" (Edge Cases):
     - Inputs nulos ou undefined.
     - Arrays vazios.
     - Datas inválidas.
     - Erros de API.
</test_strategy>

<output_format>
  Forneça apenas o código do arquivo de teste completo.
</output_format>
```

---

## ✅ Checkpoint de Cobertura

Depois que a IA gerar os testes:

- [ ] **Testes cobrem o "Happy Path"** (caso de uso normal)
- [ ] **Testes cobrem Edge Cases** (nulo, vazio, inválido)
- [ ] **Rodei os testes e todos passaram** (`npm test`)

**Se algum teste falhou:** Ou o teste está errado, ou descobrimos um bug!

---

## ✅ Resumo em 3 Frases

1. **Testes = Seguro de vida do código** → Refatorações ficam seguras
2. **Edge Cases são onde bugs se escondem** → undefined, null, array vazio
3. **Teste o que importa** → 80% de cobertura no crítico > 100% no trivial

## 🔗 Próximos Passos

**Se todos os testes passaram:**
→ Commit e celebrate! 🎉 Você tem código protegido.

**Se descobriu bugs nos testes:**
→ Use [TEMPLATE_04_DEBUG](./TEMPLATE_04_DEBUG.md) para corrigir

**Se precisa documentar os testes:**
→ Use [TEMPLATE_05_DOCS](./TEMPLATE_05_DOCS.md)

---

[🔝 Voltar ao topo](#-template-06-o-testador-unit-tests)

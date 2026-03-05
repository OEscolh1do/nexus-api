# 🩺 TEMPLATE 03: O CIRURGIÃO (Refatoração)

> **📍 VOCÊ ESTÁ AQUI:** 🏠 [Início](./) > 🛠️ Templates > 🩺 Template 03 - Refatoração  
> **🎯 OBJETIVO:** Limpar código feio/complexo SEM quebrar funcionalidades  
> **⏱️ TEMPO:** 2min preencher | 3-7min IA refatorar  
> **🛠️ PRÉ-REQUISITO:** Código funciona, mas está difícil de ler/manter

---

> **💡 PARA QUE SERVE?**
>
> **O Cenário:** O código funciona, mas está feio, lento ou ilegível. Você quer limpar a casa sem demolir a estrutura.
>
> **A Regra de Ouro:** "Mude a estrutura interna sem alterar o comportamento externo."

## ✅ Checklist Antes de Refatorar

- [ ] O código atual **funciona** (não refatore código bugado!)
- [ ] Sei especificamente **o que** incomoda (lentidão? código duplicado? nomes ruins?)
- [ ] Tenho como **testar** depois (manual ou testes automatizados)

**⚠️ Se marcou tudo:** Continue. Senão, resolva os problemas básicos primeiro.

---

## ✂️ COPIE ISSO AQUI:

```xml
<system_role>
  Atue como Especialista em Clean Code e Performance.
  Stack: React, Node.js, Typescript.
  Mantra: "Legibilidade conta. Performance importa."
</system_role>

<mission>
  Refatorar o arquivo/componente: "{{NOME_DO_ARQUIVO}}".
  Objetivo Principal: {{EX: MELHORAR LEITURA / REMOVER DUPLICACAO / OTIMIZAR RENDERIZACAO}}.
</mission>

<input_context>
  <target_file>
    <file path="{{CAMINHO_DO_ARQUIVO_ALVO}}" />
  </target_file>

  <dependencies>
    <!-- Arquivos que usam ou são usados pelo alvo (opcional mas bom para evitar quebra) -->
    <file path="{{CAMINHO_DEPENDENCIA_1}}" />
  </dependencies>
</input_context>

<refactoring_goals>
  <!-- O QUE DEVE MELHORAR (Aplicável a qualquer linguagem) -->
  - [ ] Extrair lógica complexa para funções/módulos reutilizáveis.
  - [ ] Aplicar tipagem forte (TypeScript, Python type hints, Java generics, Go interfaces).
  - [ ] Melhorar nomes de variáveis/funções para serem auto-explicativos.
  - [ ] Remover código morto (comentários obsoletos, imports não usados).
  - [ ] Aplicar princípios SOLID (Single Responsibility, Open/Closed, etc).
  - [ ] Reduzir complexidade ciclomática (simplificar condicionais aninhados).
  - {{OUTRO_OBJETIVO}}
</refactoring_goals>

<safety_protocols>
  <!-- O QUE NÃO PODE MUDAR -->
  - NENHUMA funcionalidade existente pode ser perdida.
  - A assinatura das funções públicas (props/exports) DEVE permanecer a mesma.
  - Teste mentalmente: "Se eu rodar isso agora, vai quebrar quem consome esse arquivo?"
</safety_protocols>

<output_format>
  1. Explique brevemente o plano de refatoração.
  2. Forneça o código COMPLETO refatorado (não apenas snippets).
</output_format>
```

---

## ✅ Checkpoint Pós-Refatoração

Depois que a IA entregar o código, valide:

- [ ] O código ficou **mais legível** (nomes melhores, funções menores)
- [ ] **Não tem erros de sintaxe** (copie e teste!)
- [ ] A **funcionalidade original** permanece intacta

**Se algo quebrou:** Reverta e ajuste os `<refactoring_goals>`

---

## ✅ Resumo em 3 Frases

1. **Refatorar = Limpar SEM quebrar** → Estrutura muda, comportamento não
2. **Use `<safety_protocols>`** para proteger funcionalidades críticas
3. **Teste imediatamente** após refatorar (não acumule mudanças)

## 🔗 Próximos Passos

**Se a refatoração foi bem:**
→ Considere adicionar testes com [TEMPLATE_06_TESTS](./TEMPLATE_06_TESTS.md)

**Se ainda está complexo:**
→ Rode o Template 03 novamente focando em outra área

**Se quer documentar as melhorias:**
→ Use [TEMPLATE_05_DOCS](./TEMPLATE_05_DOCS.md)

---

[🔝 Voltar ao topo](#-template-03-o-cirurgião-refatoração)

# 📜 TEMPLATE 05: O ESCRIBA (Documentação)

> **📍 VOCÊ ESTÁ AQUI:** 🏠 [Início](./) > 🛠️ Templates > 📜 Template 05 - Documentação  
> **🎯 OBJETIVO:** Gerar documentação clara e útil para código existente  
> **⏱️ TEMPO:** 2min preencher | 2-5min IA escrever  
> **🛠️ PRÉ-REQUISITO:** Código funcional que precisa ser explicado

---

> **💡 PARA QUE SERVE?**
>
> **O Cenário:** O código está pronto, mas ninguém sabe como usar. Ou você precisa explicar uma arquitetura complexa para outro dev (ou para você mesmo no futuro).
>
> **A Ajuda da IA:** A IA é ótima em resumir. Use isso para gerar Readmes, Docs de API ou diagramas.

## ✅ Checklist de Qualidade

Antes de documentar, defina:

- [ ] **Quem vai ler?** (Dev iniciante? Gerente? Usuário final?)
- [ ] **Qual o objetivo?** (Ensinar a usar? Explicar arquitetura? Referência de API?)
- [ ] **Qual o formato?** (README? Wiki? Comentários inline?)

**💡 Documentação direcionada > Documentação genérica**

---

## ✂️ COPIE ISSO AQUI:

```xml
<mission>
  Gerar documentação técnica para: "{{NOME_DO_MODULO_OU_FEATURE}}".
  Público Alvo: {{EX: DESENVOLVEDORES NOVOS / GERENTE DE PROJETO / USUARIO FINAL}}.
</mission>

<source_material>
  <!-- Leia o código para entender o que documentar -->
  <file path="{{ARQUIVO_PRINCIPAL}}" />
  <file path="{{ARQUIVO_DE_TIPOS}}" />
</source_material>

<output_requirements>
  Formato: Markdown (.md).

  <sections_required>
    - [ ] **Visão Geral:** O que é e para que serve.
    - [ ] **Como Usar:** Exemplo de código ou fluxo de uso.
    - [ ] **Estrutura de Dados:** Tabela explicando os campos principais.
    - [ ] **Diagrama Mermaid (Opcional):** Se houver fluxo complexo, desenhe um diagrama.
  </sections_required>

  <tone>
    Claro, Conciso e Profissional.
    Use emojis com moderação para facilitar a leitura visual.
  </tone>
</output_requirements>
```

---

## ✅ Checkpoint de Qualidade

Depois que a IA gerar a documentação:

- [ ] **Está em português claro** (sem jargões desnecessários)
- [ ] **Tem exemplos práticos** (não só teoria)
- [ ] **Alguém que não escreveu o código conseguiria entender?**

**Se ficou confuso:** Peça para a IA "Simplifique a seção X"

---

## ✅ Resumo em 3 Frases

1. **Documentação = Interface humana do código** → Tão importante quanto o código
2. **Defina o público-alvo** → Tom e profundidade mudam completamente
3. **Exemplos valem mais que parágrafos** → Mostre, não só conte

## 🔗 Próximos Passos

**Se a documentação ficou boa:**
→ Adicione ao repositório e compartilhe com o time

**Se precisa de diagramas mais complexos:**
→ Peça para a IA gerar diagramas Mermaid específicos

**Se quer melhorar o código documentado:**
→ Use [TEMPLATE_03_REFACTOR](./TEMPLATE_03_REFACTOR.md)

---

[🔝 Voltar ao topo](#-template-05-o-escriba-documentação)

# 🧠 TEMPLATE 01: O ARQUITETO (Planejamento)

> **📍 VOCÊ ESTÁ AQUI:** 🏠 [Início](./) > 🛠️ Templates > 📋 Template 01 - Arquiteto  
> **🎯 OBJETIVO:** Gerar um plano técnico ANTES de codar (evita 90% dos erros)  
> **⏱️ TEMPO:** 2-3min preencher | 1-2min IA responder  
> **🛠️ PRÉ-REQUISITO:** Você tem uma ideia nova de feature/módulo

---

> **💡 PARA O SEU CÉREBRO (ADHD FRIENDLY)**
>
> **O Problema:** Você tem uma ideia brilhante, joga no chat, a IA começa a codar feito louca, erra arquivos, quebra o que já funcionava e você perde o foco tentando consertar. 🤯
>
> **A Solução:** Use este template **ANTES** de pedir código. Ele obriga a IA a respirar, ler os arquivos e montar um plano. É como fazer um esboço antes de pintar o quadro.

## ✅ Checklist Antes de Começar

- [ ] Sei qual feature/módulo quero implementar
- [ ] Conheço os arquivos que precisam ser modificados (ou pelo menos 1-2)
- [ ] Tenho 3-5 minutos livres para preencher o template

**💡 Se marcou tudo:** Você está pronto! Role para baixo. ⬇️

---

## 📋 Como Usar (3 Passos)

1. **Copie** o bloco XML abaixo
2. **Substitua** as `{{CHAVES}}` pelos seus dados
3. **Envie** para o chat e aguarde o plano

---

## ✂️ COPIE ISSO AQUI:

```xml
<system_role>
  <!-- QUEM É A IA? -->
  Atue como Arquiteto de Software Senior (Neonorte | Nexus Monolith).
  Stack: React (Vite), Node.js, Prisma, SQL Server.
  Princípios: Clean Code, SOLID, "Paranoia Ativa" (Segurança).
</system_role>

<mission>
  <!-- O QUE VAMOS FAZER? (Seja breve) -->
  Planejar a implementação da feature: "{{NOME_DA_FEATURE}}".
  Objetivo: {{DESCREVA_O_OBJETIVO_EM_UMA_FRASE}}.
</mission>

<input_context>
  <!-- ONDE A IA DEVE OLHAR? (Evita alucinação) -->
  <critical_files>
    <file path="{{CAMINHO_DO_ARQUIVO_1}}" />
    <file path="{{CAMINHO_DO_ARQUIVO_2}}" />
    <!-- Adicione mais se precisar, mas mantenha o foco -->
  </critical_files>

  <user_requirements>
    <!-- O QUE VOCÊ PRECISA? (Lista de desejos) -->
    <frontend>
      - {{REQUISITO_VISUAL_1}}
      - {{REQUISITO_VISUAL_2}}
    </frontend>

    <backend>
      - {{REQUISITO_LOGICA_1}}
      - {{REQUISITO_BANCO_DE_DADOS}}
    </backend>

    <!-- O QUE É PROIBIDO? (Cercas elétricas) -->
    <constraints>
      - NÃO quebre a segurança existente.
      - {{OUTRA_REGRA_IMPORTANTE}}
    </constraints>
  </user_requirements>
</input_context>

<output_instruction>
  <!-- O RESULTADO ESPERADO -->
  NÃO ESCREVA CÓDIGO AINDA.
  1. Leia os arquivos listados acima.
  2. Analise se isso vai quebrar alguma coisa.
  3. Gere um artefato chamado `implementation_plan.md` com:
     - Mudanças no Banco de Dados (se houver).
     - Estrutura de dados (Interfaces).
     - Lista passo-a-passo do que você vai editar.
</output_instruction>
```

---

## ✅ Checkpoint de Validação

Depois que a IA responder, verifique se o plano tem:

- [ ] Lista clara de arquivos que serão modificados/criados
- [ ] Estrutura de dados (interfaces/tipos) definida
- [ ] Nenhuma menção a "quebrar código existente"

**Se algo estiver faltando:** Peça "Detalhe mais a seção X do plano"

---

## ✅ Resumo em 3 Frases

1. **Template 01 = Planejamento** → Evita código caótico
2. **Substitua as {{CHAVES}}** com informações específicas do SEU projeto
3. **NÃO pule esta etapa** mesmo que pareça "perda de tempo" (economiza horas de debug)

## 🔗 Próximos Passos

**Depois que o plano for aprovado:**
→ Use [TEMPLATE_02_ENGINEER](./TEMPLATE_02_ENGINEER.md) para executar

**Se o plano ficou confuso:**
→ Releia [GUIDE_AI_MASTERY](./GUIDE_AI_MASTERY.md) sobre como dar contexto

**Se esqueceu qual template usar:**
→ Volte ao [GUIDE_TDAH_QUICKSTART](./GUIDE_TDAH_QUICKSTART.md)

---

[🔝 Voltar ao topo](#-template-01-o-arquiteto-planejamento)

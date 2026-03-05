# 🕵️ TEMPLATE 04: O DETETIVE (Debugging)

> **📍 VOCÊ ESTÁ AQUI:** 🏠 [Início](./) > 🛠️ Templates > 🕵️ Template 04 - Debug  
> **🎯 OBJETIVO:** Encontrar causa raiz de bugs e gerar correção segura  
> **⏱️ TEMPO:** 2-3min preencher | 2-5min IA investigar  
> **🛠️ PRÉ-REQUISITO:** Você tem um erro/bug específico

---

> **💡 PARA QUE SERVE?**
>
> **O Cenário:** Algo quebrou. Você tem um erro 500, uma tela branca ou um comportamento bizarro.
>
> **A Abordagem:** Em vez de pedir "arruma isso", você dá as pistas (logs, contexto) e pede para a IA investigar a cena do crime.

## ✅ Checklist de Informações

Antes de pedir ajuda, colete:

- [ ] **Mensagem de erro completa** (do console/terminal/network)
- [ ] **O que você fez** quando o erro aconteceu
- [ ] **Arquivos suspeitos** (onde você acha que está o problema)
- [ ] **Mudanças recentes** (o que você alterou nos últimos commits?)

**💡 Quanto mais pistas, mais rápido o diagnóstico!**

---

## ✂️ COPIE ISSO AQUI:

````xml
<system_role>
  Atue como Engenheiro de Confiabilidade de Site (SRE) e Especialista em Debugging.
  Método: Análise de Causa Raiz (RCA).
</system_role>

<incident_report>
  <symptoms>
    Descreva o erro: "{{EX: TELA FICA BRANCA AO CLICAR EM SALVAR}}"
    Mensagem de Erro (se houver):
    ```
    {{COLE_O_ERRO_DO_CONSOLE_OU_TERMINAL_AQUI}}
    ```
  </symptoms>

  <suspected_files>
    <file path="{{ONDE_VOCE_ACHA_QUE_ESTA_O_ERRO}}" />
    <file path="{{ARQUIVO_RELACIONADO}}" />
  </suspected_files>

  <recent_changes>
    <!-- O que mudou recentemente? Bugs geralmente nascem aqui. -->
    - Implementamos a feature X.
    - Atualizamos a lib Y.
  </recent_changes>
</incident_report>

<investigation_protocol>
  1. ANALISE: Explique por que o erro está acontecendo (Raciocínio lógico).
  2. HIPÓTESE: Qual a provável causa raiz?
  3. CORREÇÃO: Forneça o código corrigido.
  4. PREVENÇÃO: Como evitar que isso aconteça de novo? (Ex: Adicionar um try/catch, validação Zod extra).
</investigation_protocol>
````

---

## ✅ Checkpoint Pós-Correção

Depois que a IA fornecer a correção:

- [ ] **Entendi a causa raiz** (não só copiei a correção)
- [ ] **Testei e o erro sumiu** (não aparece mais)
- [ ] **Apliquei a prevenção sugerida** (ex: validação extra)

**Se o erro voltou:** Houve diagnóstico errado. Adicione mais pistas ao template.

---

## ✅ Resumo em 3 Frases

1. **Debugging = Método científico** → Hipótese → Teste → Conclusão
2. **Cole o erro COMPLETO** → Mensagens parciais geram diagnósticos errados
3. **Prevenir > Corrigir** → Aplique as sugestões de prevenção da IA

## 🔗 Próximos Passos

**Se o bug foi corrigido:**
→ Considere adicionar testes com [TEMPLATE_06_TESTS](./TEMPLATE_06_TESTS.md) para evitar regressão

**Se o código ficou com gambiarras:**
→ Use [TEMPLATE_03_REFACTOR](./TEMPLATE_03_REFACTOR.md) para limpar

**Se precisa documentar o bug:**
→ Crie uma entrada no [FAQ_ERROS_COMUNS](./FAQ_ERROS_COMUNS.md)

---

[🔝 Voltar ao topo](#-template-04-o-detetive-debugging)

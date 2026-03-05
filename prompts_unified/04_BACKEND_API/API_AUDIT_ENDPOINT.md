# 🛡️ Auditoria de Backend API & Segurança - Neonorte | Nexus 2.0

> **🎯 Cenário de Uso**
>
> Você tem um Controller ou Service que cresceu desordenadamente, tem lógica vazando, validação fraca ou suspeita de falhas de segurança.
>
> **⏱️ Tempo Estimado:** 20-30 minutos (Code Review + Relatório)

---

## 🔍 Quando Usar Este Template?

- ✅ Controller com mais de 200 linhas
- ✅ Lógica de negócio misturada com HTTP (req/res) no Controller
- ✅ Dúvida se a validação Zod cobre todos os casos
- ✅ Endpoint crítico (pagamento, permissões) precisando de revisão
- ✅ Código legado sem tipagem estrita

---

## 🔄 Abordagem em 2 Fases

### Fase 1: API Audit (Code Review)

- Análise estática de segurança e arquitetura
- Verificação de SOLID e Clean Code
- Identificação de débitos técnicos
- **Output:** `api_audit_report.md`

### Fase 2: Refactoring (Correção)

- Extração de Service Layer
- Implementação de Zod Schemas
- Blindagem de segurança
- Testes unitários

---

## 📋 FASE 1: API AUDIT (Copie este prompt)

```xml
<system_role>
  Atue como **Staff Software Engineer** e Especialista em Segurança (AppSec).
  Especialidade: Node.js, Clean Architecture, OWASP Top 10 e Hardening.
</system_role>

<mission>
  Auditar o arquivo/endpoint "{{NOME_DO_ARQUIVO}}" sob a ótica de Segurança e Arquitetura.

  Contexto: {{EXPLIQUE_O_CONTEXTO_DO_CODIGO}}
</mission>

<input_context>
  <critical_files>
    <file path="{{CAMINHO_DO_CONTROLLER}}" description="Controller a ser auditado" />
    <file path="{{CAMINHO_DO_SERVICE}}" description="Service relacionado (se houver)" />
  </critical_files>

  <constraints>
    - Padrão arquitetural: Universal CRUD (Controller magro, Service rico)
    - Validação: Zod Obrigatório
    - Tratamento de erro: Centralizado (AppError)
  </constraints>
</input_context>

<audit_framework_backend>
  Analise o código usando os **Princípios de Robustez do Neonorte | Nexus**:

  1. **Fronteira de Confiança (Defense in Depth)**
     - Todo input (body, params, query) passa por `z.parse()`?
     - A validação é estrita (`.strict()`)? Rejeita campos extras?
     - O Zod Schema está reutilizável ou hardcoded?

  2. **Isolamento de Responsabilidade (SRP)**
     - O Controller tem lógica de negócio "If this then that"? (Proibido)
     - O Service acessa objetos HTTP (`req`, `res`)? (Proibido)
     - Queries SQL/Prisma estão espalhadas ou encapsuladas?

  3. **Tratamento de Erros & Atomicidade**
     - O "Caminho Feliz" está protegido? E os "Sad Paths"?
     - Operações de escrita múltiplas estão em `$transaction`?
     - Erros expõem stack traces ou infos internas para o cliente?

  4. **Segurança (OWASP)**
     - Há verificação de autorização (quem pode ver este ID)?
     - Proteção contra IDOR (Insecure Direct Object Reference)?
     - Proteção contra Mass Assignment (via Zod)?
     - Proteção contra CVE-2025-55182 (React2Shell)?

  5. **Manutenibilidade & Tipagem**
     - Uso de `any` ou `as unknown`? (Code Smell)
     - Nomes de variáveis expressam intenção ou implementação?
</audit_framework_backend>

<output_instruction>
  NÃO REESCREVA O CÓDIGO AINDA.

  Gere um artefato `api_audit_report.md` contendo:

  ## 1. Resumo Executivo
  - Nota de Segurança (0-10)
  - Nota de Arquitetura (0-10)
  - Veredito: (Aprovado / Requer Refatoração / Crítico)

  ## 2. Análise de Vulnerabilidades & Smells
  Para cada violação encontrada:
  - Linha(s) aproximada(s) do código original
  - Princípio violado (ex: SRP, Segurança)
  - Explicação do risco (ex: "Permite que usuário A veja dados de B")

  ## 3. Plano de Refatoração
  - Lista de ações para corrigir (passo a passo)
  - Novos schemas Zod necessários
  - Métodos a extrair para o Service

  ## 4. Desafio Socrático
  - Uma pergunta que faça o desenvolvedor refletir sobre um edge case não tratado.
</output_instruction>
```

---

## 📝 Exemplo Real: Auditoria de Update User

### Problema

Controller de atualização de perfil recebia `req.body` direto e salvava no banco.

### API Audit Report Gerado

```markdown
# API Audit Report: UserController.update

## 1. Resumo

- **Segurança:** 2/10 (CRÍTICO)
- **Veredito:** Bloquear deploy. Risco de Mass Assignment e IDOR.

## 2. Análise

### ❌ Violação: Fronteira de Confiança (Pilar 1)

**Risco:** O código faz `DB.User.update({ where: { id }, data: req.body })`.
**Impacto:** Usuário pode enviar `{ "isAdmin": true }` no JSON e virar admin (Mass Assignment).

### ❌ Violação: Segurança/IDOR (Pilar 4)

**Risco:** Pega o `id` da URL (`req.params.id`) sem verificar se bate com o `req.user.id` do token.
**Impacto:** Qualquer usuário logado pode alterar o perfil de qualquer outro usuário.

## 3. Plano de Refatoração

1. Criar `UpdateUserSchema` com Zod (whitelist apenas de campos permitidos: `name`, `bio`).
2. No Controller, verificar `if (id !== req.user.id) throw new ForbiddenError()`.
3. Passar para o Service apenas o objeto parseado pelo Zod.
```

---

## 🔧 FASE 2: REFACTORING (Copie após aprovar audit)

```xml
<mission>
  Executar plano de refatoração conforme `api_audit_report.md`.
</mission>

<execution_protocol>
  <step_1>
    Criar/Atualizar Zod Schemas.
  </step_1>

  <step_2>
    Blindar Controller (Validar Input + Checar Permissões).
  </step_2>

  <step_3>
    Mover lógica de negócio para o Service (se houver).
  </step_3>

  <step_4>
    Revisar tratamento de erros (try/catch/AppError).
  </step_4>
</execution_protocol>
```

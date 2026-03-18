---
name: security-auditor
description: Transforma o agente em assistente de Red Team. Executa varredura completa de vulnerabilidades OWASP Top 10 no código gerado — injeção SQL, XSS, autenticação quebrada, exposição de dados sensíveis e falhas de controle de acesso. Ativado antes de qualquer deploy ou quando código de autenticação/inputs é modificado.
---

# Skill: Security Auditor (Red Team Assistant)

## Gatilho Semântico

Ativado por: "faça uma auditoria de segurança", "esse código é seguro?", "verifique vulnerabilidades", ou automaticamente quando detectar modificações em arquivos de autenticação, interceptors HTTP, formulários com inputs de usuário ou endpoints de API.

## Scripts de Varredura

### Script 1: Busca por Injeção (A03)

```bash
# SQL Injection — concatenação de strings em queries
rg --type ts "query.*\+.*req\.|\"SELECT.*\+|`SELECT.*\${" src/ backend/

# XSS — uso perigoso de innerHTML no React
rg --type tsx "dangerouslySetInnerHTML" src/

# Command Injection — exec/spawn com entrada de usuário
rg --type ts "exec\(|spawn\(" backend/src/
```

### Script 2: Autenticação e Secrets (A02, A07)

```bash
# Tokens em localStorage (inseguro)
rg "localStorage.set.*token|localStorage.set.*jwt" src/

# Hardcoded secrets
rg --type ts "password\s*=\s*['\"]|secret\s*=\s*['\"]|apiKey\s*=\s*['\"]" src/ backend/

# console.log de dados sensíveis
rg "console\.log.*token|console\.log.*password|console\.log.*user" src/ backend/src/
```

### Script 3: Controle de Acesso (A01)

```bash
# Rotas sem middleware de autenticação no backend
rg --type ts "router\.(get|post|put|delete)\(" backend/src/routes/

# Verificação de role apenas no frontend (não suficiente)
rg "role.*===|userRole.*===" src/
```

## Classificação de Severidade e Saída

Para cada achado, classifique e documente:

```markdown
## Relatório de Auditoria de Segurança — [Data]

### 🔴 Crítico
- **[OWASP A0X]** [Arquivo:Linha] — [Descrição]
  - Impacto: [O que pode ser explorado]
  - Correção: [Solução exata]

### 🟠 Alto
...

### 🟡 Médio
...
```

Nenhum item **Crítico** ou **Alto** deve ser ignorado antes do deploy.

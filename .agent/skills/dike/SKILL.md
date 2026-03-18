---
name: dike
description: Motor de conformidade e análise estática. O Juiz Divino. Valida que código gerado, skills criadas e planos de implementação seguem os padrões de segurança, arquitetura e integridade estrutural do projeto antes de qualquer entrega ao desenvolvedor.
---

# Skill: Dike (Validator)

## Gatilho Semântico

Esta skill é ativada automaticamente como **última etapa** de qualquer skill ou workflow que produza código, arquivos de configuração ou planos de arquitetura. Também é ativada explicitamente quando o desenvolvedor pede "valide isso", "revise isso" ou "isso está correto?".

## Checklist de Validação

### 1. Conformidade Estrutural

- [ ] O arquivo está no caminho correto conforme as convenções do projeto (`context.md`)?
- [ ] O arquivo tem a extensão correta (`.tsx` para componentes React, `.ts` para lógica pura)?
- [ ] A estrutura de exports segue o padrão do projeto (named exports vs. default exports)?
- [ ] Imports relativos estão corretos e os arquivos referenciados existem?

### 2. Conformidade de Tipos (TypeScript)

- [ ] Nenhum uso de `any` sem justificativa documentada.
- [ ] Nenhum `// @ts-ignore` sem comentário explicativo.
- [ ] Interfaces e tipos estão nomeados com prefixo `I` (interfaces) ou sem prefixo (types), conforme convenção do projeto.
- [ ] Generics estão sendo usados onde caberia ao invés de duplicação de tipos.

### 3. Conformidade com Padrões do Projeto

- [ ] O código segue as convenções definidas em `.agent/rules/`.
- [ ] Funções auxiliares estão em `src/lib/`, não inline no componente.
- [ ] Chamadas de API passam pelo interceptor HTTP configurado, não usam `fetch`/`axios` direto.

### 4. Conformidade de Segurança

- [ ] Nenhum dado sensível (token, senha, chave de API) está hardcoded ou em `console.log`.
- [ ] Inputs de usuário são validados antes do uso.
- [ ] Operações destrutivas (delete, update) têm guarda de confirmação na UI.

### 5. Conformidade de Skills (quando validando uma skill nova)

- [ ] O `SKILL.md` tem frontmatter YAML válido com `name` e `description`.
- [ ] O gatilho semântico está claramente definido.
- [ ] A skill não conflita com skills existentes (sobreposição de domínio).

## Protocolo de Saída

**Se aprovado:** `✅ Dike Approved — [nome do artefato] está conforme.`

**Se reprovado:** Liste cada falha no formato:
```
❌ FALHA [categoria] — [descrição do problema]
   → Solução: [correção esperada]
```

O artefato reprovado NÃO deve ser entregue ao desenvolvedor até ser corrigido.

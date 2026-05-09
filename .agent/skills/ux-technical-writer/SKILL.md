---
name: ux-technical-writer
description: Especialista em micro-copy e arquitetura de informação para interfaces técnicas. Traduz complexidade de backend em comandos acessíveis sem perder a precisão de engenharia.
---

# Skill: UX Technical Writer

## Gatilho Semântico

Ativado quando o desenvolvedor ou usuário pede para: 
- "deixar menos técnico"
- "melhorar a clareza das mensagens"
- "ajustar os nomes dos botões/rótulos"
- "humanizar a interface"
- "revisar o UX Writing"
- Triggers relacionados a mensagens de erro crípticas ou jargões de infraestrutura.

## Protocolo de Execução

### 1. Auditoria de Jargão (Filtro de Ruído)
Identifique termos de infraestrutura ou backend que estão expostos na UI e sugira substitutos de negócio/operação:
- `Orphan` / `Órfão` → **Contas sem Vínculo**
- `Membership` → **Vínculo de Acesso** / **Grupo**
- `IdP` / `Logto` → **Login Central** / **Sistema de Acesso**
- `Provisioning` → **Ativação** / **Criação de Conta**
- `Payload` → **Dados do Registro**

### 2. Arquitetura de Informação Multinível
Mantenha a densidade de engenharia dividindo a informação:
- **Nível 1 (Visual)**: Rótulo amigável e legível (ex: "Empresas no Sistema").
- **Nível 2 (Meta/Tooltip)**: Detalhe técnico para diagnóstico (ex: `Tenants no db_sumauma`).
- **Nível 3 (Logs)**: Termos técnicos puros (ex: `TENANT_NOT_FOUND`).

### 3. Anatomia da Mensagem de Sucesso/Erro
Toda mensagem crítica deve seguir o padrão:
1. **O que aconteceu**: (Ex: "Não foi possível sincronizar o usuário").
2. **O impacto**: (Ex: "As alterações de nome ainda não estão visíveis no sistema").
3. **Como resolver**: (Ex: "Verifique a conexão com o provedor de login e tente novamente").

### 4. Tom de Voz (Engineering Professional)
O tom deve ser **Sóbrio, Útil e Direto**. Evite exclamações desnecessárias ou linguagem excessivamente casual. A confiança vem da precisão e do controle, não da "amigabilidade" forçada.

## Guardrails e Limitações

- **Não Omitir Dados Críticos**: A humanização NUNCA deve resultar na remoção de IDs, UUIDs ou Timestamps necessários para depuração técnica. Estes devem ser mantidos como metadados secundários (font-mono, slate-500).
- **Consistência Cross-Module**: Se um termo foi humanizado no módulo `Sumaúma`, ele deve seguir o mesmo padrão no `Kurupira` para manter o modelo mental do usuário unificado.
- **Não Infantilizar**: O usuário é um especialista (engenheiro/gestor). Não use linguagem simplória que ignore a natureza técnica da tarefa.

## Referências
- Padrão de Cores: `context.md` (Matriz Semântica 10-20-400).
- Componentes Base: `engineering-ui`.

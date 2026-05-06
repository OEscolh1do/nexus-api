---
description: Sincronização obrigatória de contextos globais e locais após marcos técnicos
---

# Workflow `sync-context` — Guardião da Memória do Ecossistema

Execute este workflow sempre que uma tarefa resultar em mudanças de arquitetura, novos padrões de dados, correções de bugs estruturais ou deploys. Ele garante a sincronia entre a **Visão Global (Ywara)** e a **Visão de Módulo (Sumaúma/Kurupira)**.

## Passo 1: Levantamento de Impacto (Survey)

Identifique o que mudou na sessão atual:
- **Arquitetura**: Novas relações de DB, middlewares ou fluxos de Auth?
- **Padrões**: Novos Poka-Yokes ou convenções de código?
- **Versão**: Qual o próximo incremento semântico (Patch, Minor ou Major)?

## Passo 2: Sincronização Local (Módulo Específico)

Atualize o `context.md` do diretório do módulo afetado (ex: `sumauma/.agent/context.md`):
1. **Status**: Atualize datas e versões.
2. **Decisões**: Registre novas especificações (SPEC) e justificativas técnicas.
3. **Roadmap**: Marque pendências como concluídas ou adicione novos gaps identificados.
4. **Changelog**: Adicione uma entrada detalhada para os desenvolvedores.

## Passo 3: Sincronização Global (Raiz do Ecossistema)

Atualize o `.agent/context.md` na raiz do projeto:
1. **Versão Global**: Incremente a versão do Ecossistema.
2. **Padrões Cross-Cutting**: Adicione novos protocolos que afetam todos os serviços (ex: Protocolo de Integridade).
3. **Changelog Global**: Resuma o milestone para a visão de negócio/infraestrutura.

## Passo 4: Verificação (CoVe)

Antes de salvar, valide:
- [ ] As datas de atualização conferem com o calendário atual?
- [ ] O número da versão segue o Versionamento Semântico (SemVer)?
- [ ] Os links para arquivos e especificações citados estão corretos?
- [ ] O tom de voz é técnico, direto e em PT-BR?

---

## Gatilhos de Execução Obrigatória

- Após qualquer `prisma migrate`.
- Após a remediação de um bug que causava crash sistêmico.
- Após mudanças em variáveis de ambiente `.env`.
- Antes de finalizar a jornada de trabalho do dia.

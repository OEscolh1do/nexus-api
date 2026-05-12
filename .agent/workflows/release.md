# Workflow `/release` — Ciclo de Lançamento e Patch Logs

Este workflow unifica o versionamento semântico com a comunicação de novidades para o usuário final, garantindo que cada atualização seja documentada e visível.

---

## Gatilho
- Quando o usuário diz "/release" ou pede para "finalizar a versão e documentar".

---

## Passo 1: Versionamento (SemVer)
O agente deve invocar a skill `semver-release-manager` para:
1. Identificar se as mudanças da sessão foram PATCH, MINOR ou MAJOR.
2. Sugerir a nova versão (ex: `0.9.0-beta.2` -> `0.9.0-beta.3`).
3. Atualizar os `package.json` (FE e BE).

## Passo 2: Curadoria de Notas (Patch Logs)
Invocação da skill `release-notes-curator`:
1. Resumir as alterações técnicas em linguagem de engenheiro.
2. Gerar o payload JSON para o `changelog.json`.

## Passo 3: Persistência de Dados
1. **Frontend**: Adicionar a nova entrada no topo do array em `src/assets/changelog.json`.
2. **Contexto**: Atualizar o changelog interno do `.agent/context.md`.

## Passo 4: Sincronização e Git
1. Executar `/sync-context` para alinhar a memória do agente.
2. Executar `/sync-github` para criar o ponto de restauração com a mensagem: `release: vX.Y.Z - [Resumo do Log]`.

---

## Exemplo de Execução
> **User**: /release  
> **Agent**: Entendido. Analisando mudanças...  
> 1. Versionamento: Detectado melhorias no MPPT (PATCH). Nova versão sugerida: `0.9.0-beta.3`.  
> 2. Patch Logs: Criando resumo para o integrador...  
> 3. Atualizando `changelog.json` e `package.json`.  
> 4. Sincronizando GitHub.

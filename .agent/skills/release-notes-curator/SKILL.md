---
name: release-notes-curator
description: Transforma alterações técnicas em Patch Logs amigáveis para o usuário e gerencia o arquivo central de changelog.
---

# Skill: Release Notes Curator

## Gatilho Semântico
Ativado quando:
- O usuário pede para "gerar patch logs", "escrever o que mudou" ou "fazer o release".
- Após um bump de versão via `semver-release-manager`.
- Ao preparar o `LoginPage.tsx` para exibir novidades.

## Protocolo de Redação (Neurodesign)

Ao redigir um Patch Log, siga estas regras:
1. **Tom de Voz**: Profissional, técnico e focado em benefícios ("Cálculos 30% mais rápidos" em vez de "Refatorado loop no motor").
2. **Categorização**:
    - 🚀 **Features**: Novas funcionalidades.
    - 🛠️ **Melhorias**: Refinamentos em algo existente.
    - 🐛 **Correções**: Bugfixes.
    - ⚡ **Performance**: Otimizações de velocidade.
    - 🔒 **Segurança**: Ajustes de proteção de dados.
3. **Estrutura do JSON**:
   Os logs devem ser salvos em `src/assets/changelog.json` no formato:
   ```json
   {
     "version": "0.9.0-beta.2",
     "date": "2026-05-12",
     "logs": [
       { "type": "feature", "text": "Suporte a múltiplos modelos de módulos por MPPT." },
       { "type": "improvement", "text": "Visual do MPPT card refinado com telemetria Twin Engines." }
     ]
   }
   ```

## Protocolo de Execução
1. **Analise o Histórico**: Leia os últimos `summary` do `context.md` e os arquivos editados recentemente.
2. **Sugerir Rascunho**: Apresente ao usuário os pontos principais categorizados.
3. **Confirmar Versão**: Garanta que a versão do log bate com o `package.json`.
4. **Persistir**: Escreva no `changelog.json` da aplicação afetada.

## Limitações
- NÃO use linguagem infantilizada. O usuário é um engenheiro.
- NÃO exponha nomes de arquivos ou classes internas no log público, a menos que seja uma API para desenvolvedores.
- NÃO invente melhorias. Se foi apenas um ajuste de import, use "Melhorias internas de estabilidade".

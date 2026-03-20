---
description: Auditoria Diária/Semanal de Dependências (NPM)
---

# Fluxo de Trabalho: Auditoria de Dependências

Mantenha a saúde das packages do projeto atualizada e segura contra vulnerabilidades publicadas (CVEs).

1. **Auditoria de Segurança Semanal**:
   - Execute o comando: `npm audit`.
   - Resolva vulnerabilidades críticas primeiro verificando compatibilidade.
   - Utilize `npm audit fix` ou consertando bibliotecas manualmente no `package.json`.

2. **Limpeza de Pacotes Desnecessários**:
   - Inspecione arquivos inativos ou bibliotecas instaladas de prototipagem que não foram pro código final (analise imports).
   - Remova bibliotecas desusadas com `npm uninstall <pacote>`.

3. **Atualização Segura de Dependências (Minor V. / Patches)**:
   - O pacote `npm-check-updates` (ncu) pode ajudar.
   - Mantenha bibliotecas core (ex: `react`, `react-router-dom`, `vite`, `tailwindcss`) alinhadas com as versões de LTS suportadas pela Stack descritas no `.agent/CONTEXT.md`.

4. **Prevenção de Quebras de Versão (Peer Dependencies)**:
   - Cuidado ao usar a flag `--legacy-peer-deps`. Anote em comentários ou Docs quaisquer pacotes sendo subornados devido à falta da versão atualizada, para refatoração futura técnica.

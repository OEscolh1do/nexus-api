---
description: Refinamento seguro de modulos existentes
---

# Fluxo de Trabalho: Refinar/Modificar Módulo ou Componente Existente

1. **Análise de Impacto Prévia**:
   - Analise os arquivos e rotas `import` de quem depende do local a ser modificado. O AppSwitcher é vital e não deve ser quebrado.
   - Sempre certifique as dependências locais no arquivo `package.json` antes de decidir instalar uma nova pacote.

2. **Isolamento e Segurança (No Quebrar o SSO)**:
   - Toda feature alterada que tocar no mecanismo de SSO (`localStorage.setItem/getItem("token")` ou URL Parametrizada) deve ser estritamente validada. Não altere chaves de Auth levianamente.

3. **Validação de Inputs**:
   - Se for adicionar formulário ou requisição HTTP, instancie um Schema local com o pacote `zod` e alimente ele para a configuração inicial do `react-hook-form`. Formulários nativos do React são estritamente desencorajados.

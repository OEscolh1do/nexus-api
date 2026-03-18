---
description: Identificação e Expurgamento de Código Inativo
---

# Fluxo de Trabalho: Auditoria de Código Morto e Vestígios

Módulos desativados ou refatorações constantes tendem a acumular lixo no bundle. Execute esta auditoria periodicamente ou após grandes remoções de features (ex: exclusão de um módulo inteiro).

1. **Análise de Rotas (Router)**:
   - Abra o arquivo de roteamento (`App.tsx` ou similar).
   - Procure por rotas comentadas, rotas sem permissionamento mapeado ou arquivos de View que não são mais importados.
   - Remova a declaração da Rota e o componente View correspondente.

2. **Detecção de Imports Órfãos e Componentes Sem Uso**:
   - Faça uma busca global na pasta `src/` por componentes que foram substituídos e não são referenciados. Você pode ajudar-se com plugins da IDE ou comandos como `npx knip` (se configurado).
   - Estilize o sumário: Arquivos em `src/components/` ou `src/ui/` que têm zero importações no projeto devem ser deletados, a não ser que sejam do Design System base pendentes de adoção.

3. **Limpeza de Serviços (API) e Tipagens**:
   - Endpoints na pasta `src/api` ou `src/lib` vinculados à view deletada devem ser excluídos.
   - Apague interfaces/types Zod (`schema.ts`) correspondentes aos payloads antigos.
   - Remova do `.env` quaisquer tokens específicos da feature removida.

4. **Remoção Segura de Dependências (Package.json)**:
   - Se a feature removida era a única que usava uma biblioteca pesada (ex: `pdfmake`, `chart.js`), não se esqueça de rodar `npm uninstall <nome-da-lib>` em vez de apenas apagar a importação no código.

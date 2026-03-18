---
description: Auditoria de Classes Tailwind Condicionais e Padronização de Estilo
---

# Fluxo de Trabalho: Auditoria de Clean Styling (Tailwind)

Tailwind é altamente produtivo, mas classes condicionais acumuladas sem organização criam CSS espaguete impossível de manter. Este workflow padroniza como gerenciar a variação de estilos no Nexus ERP.

1. **Identificação de Strings de Classe Condicionais Caóticas**:
   - Busque por template literals concatenando classes Tailwind com ternários aninhados.
   - Padrão problemático: `` className={`btn ${condition ? 'bg-blue-500' : 'bg-gray-500'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'} px-4 py-2`} ``
   - **Solução**: Utilize a biblioteca **`clsx`** ou **`tailwind-merge`** (instale se ausente) para compor classes de forma legível e sem colisões de utilitários.

2. **Componentização de Variantes com CVA**:
   - Componentes com múltiplas variações visuais (ex: `Button` com `variant: primary | secondary | danger` e `size: sm | md | lg`) devem usar **`cva`** (Class Variance Authority).
   - Crie o componente base em `src/ui/Button.tsx` com todas as variantes mapeadas, eliminando condicionais inline nas Views.

3. **Eliminação de Magic Numbers de Estilo**:
   - Varredura do código em busca de valores inline como `style={{ width: '340px' }}` ou classes arbitrárias Tailwind sem padrão (ex: `w-[347px]`).
   - **Solução**: Mapeie esses valores no `tailwind.config.js` sob `theme.extend` (ex: `sidebar: '340px'`) para que sejam referenciáveis como `w-sidebar`.

4. **Auditoria de Classes Duplicadas ou Conflitantes**:
   - Identifique componentes que aplicam `p-4` no wrapper e `p-2` no filho, criando espaçamentos inconsistentes.
   - Use **`tailwind-merge`** para garantir que a última classe de uma mesma propriedade CSS sempre vença, sem duplicações.

5. **Aderência ao Padrão Neonorte**:
   - Confirme que os novos componentes usam apenas as cores mapeadas no `tailwind.config.js` (ex: `neon-primary`, `neon-surface`) e não as cores padrão do Tailwind (ex: `blue-500`, `gray-700`) diretamente.

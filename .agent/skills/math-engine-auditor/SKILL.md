---
name: math-engine-auditor
description: Audita funções matemáticas puras e engines de cálculo do Kurupira para garantir tipagem estrita, ausência de casts inseguros e integridade algorítmica.
---

# Skill: Math Engine Auditor

## Gatilho Semântico

Ativado quando:
- Trabalhar em arquivos com sufixo `*Math.ts`, `*Engine.ts` ou calculadoras (ex: `electricalMath.ts`, `roiEngine.ts`, `SolarCalculator.ts`).
- Houver suspeita de "The 0.00 kWp Trap", bugs silenciosos de dimensionamento (variáveis retornando `NaN`, `Infinity` ou zero incorretamente).
- Revisar a Cadeia da Verdade entre o Schema de entrada e a saída matemática.
- Refatorar fórmulas de engenharia elétrica ou financeira no ecossistema Ywara.

## Protocolo

O Math Engine Auditor deve verificar rigorosamente as seguintes restrições:

1. **Varredura de Any Casts:**
   - Faça grep por `as any` ou declarações do tipo genérico em arquivos de engine matemático.
   - Qualquer cast `(obj as any).prop` dentro de uma função matemática indica um "Lossy Flattening" nas camadas superiores. O motor matemático não deve compensar falhas de mapeamento.
   - **Correção:** Force a tipagem exata e exija que as camadas superiores (Mappers/Adapters) passem a variável correta pelo Schema de Entrada.

2. **Isolamento de Estado (Pureza):**
   - As funções de engenharia devem ser **puras**. Não podem acessar o Zustand, dependências React (`useQuery`, `useState`) nem ler diretamente do LocalStorage.
   - Elas precisam operar apenas sobre seus argumentos tipados, viabilizando execução em Web Workers.

3. **Prevenção de Falso Zero e Fallbacks Perigosos:**
   - Busque por lógicas defensivas como `?? 0`, `|| 0`, ou `?? '—'` no núcleo das fórmulas.
   - Em matemática elétrica (como tensão, corrente ou resistência shunt), um fallback de zero pode quebrar todo o modelo PVSyst (ex: divisão por zero ou curto-circuito ilusório).
   - **Correção:** Garanta valores de fallback de engenharia reais no mapeador, e não na equação final. O motor matemático deve confiar nos parâmetros (ou falhar explicitamente se obrigatórios).

4. **Tratamento de Edge Cases Numéricos:**
   - Identifique divisões suscetíveis a divisão por zero.
   - Verifique como `NaN` e `Infinity` são propagados ou neutralizados, em especial quando parâmetros são zerados em inicializações limpas da UI (ex: remover todas as strings de um arranjo).

## Limitações e Boas Práticas

- **Não altera Mappers:** Esta skill aponta onde a matemática está quebrando, mas os mappers (ex: `panToModuleMapper.ts`) são domínio da skill de integridade ou do `parser-panond`.
- **Não altera UI:** O engine matemático é invisível. Se houver falha na exibição, isso deve ser tratado pelos formatadores do frontend, não mascarando valores no núcleo.
- O auditor exige a remoção de "gambiarras matemáticas" inseridas apressadamente e promove que o dado seja limpo na entrada (shift-left na sanitização).

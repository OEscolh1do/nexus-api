---
description: Prevenção de Inconsistências Críticas e Erros Silenciosos
---

# Fluxo de Trabalho: Auditoria Preventiva de Bugs

Atue defensivamente para impedir o colapso do app para o usuário e estancar comportamentos imprevisíveis.

1. **Auditoria de `try/catch` Ocos**:
   - Faça uma busca global por blocos `catch (error)`. 
   - Se o bloco contiver apenas um `console.log` e nenhum aviso ao usuário, isso é um "Bug Silencioso". Retornos da API que falharem (como `500 Internal Server Error`) deixarão a UI inerte (botões de "salvando..." pra sempre).
   - **Solução**: Adicione um `toast.error("Mensagem amigável")` ou manipule adequadamente um estado local de erro `setError(true)`.

2. **Proteção de Submits Duplos (Formulários)**:
   - Audite funções assíncronas ligadas a eventos `onClick` ou `onSubmit`.
   - Enquanto `isLoading === true`, o botão de submit deve estar `disabled` ou mudado visualmente para evitar cliques acidentais simultâneos que duplicam registros no banco de dados.

3. **Implementação de Error Boundaries**:
   - Quando ocorrer um Type Error crítico num filho (ex: usar `.map` em uma variável do backend que veio indefinida), todo o sistema React não pode sofrer um *White Screen of Death*. 
   - Verifique onde `ErrorBoundaries` estão implementadas para "prender" a falha restrita àquela View específica, apresentando um *Fallback UI* com um botão de "Tentar Novamente".

4. **Tratamento de Dados Indefinidos (Optional Chaining)**:
   - Em mapeamentos densos e renders de objetos aninhados (ex: `user.company.address.street`), assegure que Optional Chaining (`user?.company?.address?.street`) está sendo usado se os valores forem opcionais e puderem resultar na página em branco caso quebrem.

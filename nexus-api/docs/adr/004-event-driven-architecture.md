# ADR 004: Arquitetura Orientada a Eventos (Sinergia)

## Status

Aceito

## Contexto

O Neonorte | Nexus visa criar sinergia entre Unidades de Negócio (ex: Alunos da Academy tornam-se Leads de Engenharia). Fazer chamadas diretas entre Services (ex: `AcademyService` chamando `CommercialService`) cria acoplamento rígido ("Monólito Espaguete") e dificulta a manutenção e extração futura de microsserviços.

## Decisão

Adotar um padrão de **Event-Driven Architecture (EDA)** para comunicação entre módulos.

### Diretrizes Técnicas

1.  **Decoupling:** Módulos nunca devem importar Services uns dos outros para operações de escrita (efeitos colaterais).
2.  **Event Bus:** Utilizar um `EventEmitter` central (neste estágio, interno do Node.js) para despachar eventos de domínio.
    - _Exemplo:_ `Events.emit('academy.student.certified', payload)`
3.  **Listeners:** O módulo interessado registra um Listener.
    - _Exemplo:_ `CommercialListeners.on('academy.student.certified', createLeadFromStudent)`

### Cenários de Uso Obrigatório

- **Cross-Module Side Effects:** Quando uma ação no Módulo A deve disparar uma consequência no Módulo B.
  - _Lead Won (Commercial)_ -> _Create Project (Ops)_
  - _Invoice Paid (Finance)_ -> _Unlock Feature (SaaS)_

### Cenários de Uso Proibido

- **Fluxo Síncrono Crítico:** Se a resposta do Módulo B for necessária para responder ao usuário no Módulo A (Request/Response), use chamadas de Service diretas (apenas Leitura).

## Consequências

- **Manutenibilidade:** Módulos permanecem isolados. Se mudarmos o módulo Comercial, a Academy não quebra.
- **Observabilidade:** Torna o fluxo mais difícil de rastrear sem logs adequados. Exige logging robusto dos eventos emitidos.

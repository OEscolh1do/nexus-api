# ADR 002: Padronização da Stack do Módulo de Operações (Ops)

## Status

Aceito

## Contexto

O Módulo de Operações (Gestão de Projetos, Cronogramas) requer alta interatividade no Frontend e consistência rígida no Backend. A implementação anterior sofria de validação fragmentada e componentes de UI genéricos que não atendiam à complexidade de um Gantt/Kanban.

## Decisão

Padronizar a stack técnica do módulo `ops` com os seguintes pilares:

### 1. Backend: Validação e Serviços

- **Zod:** Obrigatório para todos os DTOs (Data Transfer Objects). Nenhum dado entra no `OpsService` sem passar por um schema Zod.
- **Service Layer Pattern:** `OpsController` apenas orquestra HTTP. Toda lógica reside em `OpsService`.
- **Typing:** Uso estrito de JSDoc/TypeScript interfaces para garantir contratos entre Frontend e Backend.

### 2. Frontend: Componentes Especializados

- **Frappe Gantt:** Adotado como engine de cronograma.
  - _Wrapper:_ Criamos um wrapper React (`FrappeGantt.tsx`) para isolar a biblioteca legada e prover tipagem moderna (`GanttInstance`).
- **Kanban View:** Implementação customizada (não biblioteca) para controle total sobre DnD (Drag and Drop) e estados de tarefas.
- **Zod no Frontend:** Reutilização (onde possível) dos schemas para validação de formulários (`TaskFormModal`).

## Consequências

### Positivas

- **Segurança:** Impossível persistir tarefas com datas inválidas ou status inexistentes.
- **UX:** Gantt e Kanban oferecem interfaces ricas e familiares para gestores de projeto.
- **Manutenibilidade:** O wrapper do Gantt isola o código "feio" da biblioteca externa.

### Riscos

- **Dependência Externa:** `frappe-gantt` é uma lib antiga. O wrapper deve mitigar mudanças, mas bugs na lib podem exigir forks.
- **Duplicação de Tipos:** Em alguns casos, tipos precisam ser declarados no `types.ts` do frontend para espelhar o Zod do backend. Requer disciplina para manter sincronia.

## Compliance

Refatorações futuras no módulo Ops devem manter o padrão: Controller Magro -> Zod -> Service Gordo.
Novas Views devem utilizar os componentes base (`KanbanView`, `GanttMatrixView`) em vez de criar novos do zero.

# PROTOCOLO DE REFATORAÇÃO: NEONORTE SAAS

## Objetivo Deste Diretório
Esta pasta (`Plano de refatoração`) é o cérebro arquitetural do frontend **Kurupira** (Módulo de Engenharia e Gestão do Neonorte). Ela orquestra a execução contínua de grandes Fases (Épicos), blindando a aplicação contra regressões estruturais e de tipagem (TypeScript).

---

## 📂 Ciclo de Vida dos Épicos (Estrutura de Pastas)

Qualquer Inteligência Artificial ou Desenvolvedor assumindo uma tarefa neste repositório **deve** seguir o fluxo das três pastas raízes:

1. **`Aguardando`**: 
   - Contém as **Especificações Técnicas** (Markdowns detalhados) das próximas fases (ex: Frente P5, P6, P7). 
   - **Regra:** Nunca altere código do projeto real (src/) baseado numa especificação que está nesta pasta sem antes o desenvolvedor líder autorizar a transferência do Épico para a pasta `Em Andamento`.

2. **`Em Andamento`**:
   - É o **Silo de Batalha**. O Épico atual reside aqui enquanto está sendo programado no repositório.
   - **Regra de Sucesso:** Um Épico só sai desta pasta se o console retornar **EXIT CODE 0** no comando `npx tsc --noEmit`. Não é permitida a persistência de novos erros TS/TSX.

3. **`Concluída`**:
   - Arquivo morto e **Histórico de Decisões Práticas**. 
   - Contém os **Relatórios de Execução** (ex: P0 a P4 da HUD, Dockerização, Dimensionamento original). 
   - As soluções consolidadas (mutações de `solarStore`, integrações Leaflet baseline) documentadas nestas pastas ditam o que é "Verdade Canônica" na aplicação. Se o seu novo raciocínio entra em conflito com as arquiteturas listadas em `Concluída`, **o seu raciocínio está errado e você deve adaptá-lo ao sistema existente**.

---

## 🏛️ Premissas Arquiteturais Inegociáveis

Todas as futuras sessões de código devem seguir estritamente estas fundações consolidadas nas Fases Pré até P4:

### 1. Separação de Domínios (O Maior Bug Passado)
- **Data do Catálogo (`ModuleCatalogItem`)**: Representa o objeto no banco de dados. Contém propriedades profundas (`electrical.pmax`, `physical.widthMm`). **NÃO POSSUI** `quantity` ou `price`. É estritamente para leitura.
- **Data do Projeto/Inventário (`ModuleSpecs`)**: O objeto instanciado dentro do `solarStore.ts` quando o usuário o seleciona. Possui esquema chato com propriedades transacionais (`quantity`, `power` isolado) criados na hora via função utilitária `mapCatalogToSpecs()`.
- **Jamais tente forçar um único schema Zod a atender simultaneamente a listagem do Catálogo (BD) e o Inventário (Frontend)**. Isso gerou 138 erros na Fase P4 e causou rollback total.

### 2. Estado Normalizado (Zustand + Zundo)
- **Nunca use árvores JSON profundas** aninhadas e interativas. O `solarStore` é estruturado em dicionários rastreados por Zundo (Undo/Redo).
- **Throttling e Debouncing**: Elementos contínuos na HUD (como sliders visuais) não disparam `setState` a cada pixel arrastado, senão o Zundo acumulará bilhões de patches irreversíveis. O Commit do array ocorre no evento `onPointerUp`.

### 3. Integração WebGL + DOM = Água e Óleo
- O DOM Reativo (RightInspector, LeftOutliner) orquestra a interface. O WebGL (`@react-three/fiber` sobre Leaflet) consome os dados em background.
- **Evite props no Canvas:** Alterações paramétricas (ex: mudar rotação de um painel 3D deslizando um mouse no Inspector) não devem acionar re-renderização JSX via React State. Use referências mútuas `useRef` e colete o valor transiente dentro do render loop `useFrame` via `api.getState().entities[id]`.
- **Renderização Sob Demanda (Eco-Friendly Mode)**: A tela roda em `frameloop="demand"`. Se nada reativo mudar no `solarStore.modules/placed`, a GPU do usuário dorme operando a 0% de uso de CPU. Forçar `invalidate()` cirurgicamente apenas quando há mutações explícitas no Zustand.

---

> **Checklist para iniciar nova sessão:**
> 1. Leia o arquivo `.agent/context.md` atualizado na raiz para pegar a visão holística (versão atual v3.1.0).
> 2. Puxe uma Especificação de `Aguardando` para `Em Andamento`.
> 3. Atualize o seu loop de reflexão (`task.md`). Trabalhe modularmente. Mantenha os erros de tipagem em **Zero**.

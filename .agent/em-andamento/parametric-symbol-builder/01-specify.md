# Spec 01: O Quê — Parametric Symbol Builder

## 1. Problema de Negócio
Atualmente, o Kurupira utiliza símbolos fixos da norma IEC 60617 para renderizar a Layer 2 (Diagrama de Blocos) e a Layer 3 (Esquema Unifilar). No entanto, inversores modernos possuem múltiplos MPPTs (frequentemente >6). Um símbolo genérico não consegue representar adequadamente as portas lógicas CC e CA desses equipamentos de alta capacidade. A ausência de uma definição de portas por equipamento inviabiliza o roteamento preciso automático (Sugiyama) das strings FV para os canais MPPT específicos do inversor.

## 2. Usuário Final
- **Gestor do Catálogo (Admin Sumaúma):** Acessará o "Parametric Symbol Builder" para definir as entradas/saídas ao cadastrar ou editar um inversor.
- **Engenheiro Projetista (Kurupira):** Usuário indireto. Apenas visualizará o resultado no unifilar (Layer 2/3), não terá que desenhar pinos manualmente.

## 3. Critérios de Aceitação (Definition of Done)
- [ ] O banco de dados `db_sumauma` (`schema.prisma`) suporta o armazenamento de metadados visuais (`symbolConfig` via JSONB) no catálogo de inversores.
- [ ] Existe uma interface no Sumaúma onde o gestor pode configurar a "Carenagem Lógica" (ex: formato do bloco) e as portas (`PortPosition`) para um Inversor.
- [ ] A ferramenta de configuração trava as conexões CC no lado esquerdo (`side: 'left'`) e as CA no lado direito/fundo (`side: 'right'` ou `'bottom'`), distribuindo os `offsets` matematicamente.
- [ ] O Kurupira (Engineering Cockpit) lê o `symbolConfig` do estado global (`useSolarStore`) e, caso exista, sobrepõe o símbolo genérico do IEC no `symbols/registry.ts` da Layer 3.
- [ ] O algoritmo `Sugiyama` é capaz de traçar as rotas (`StringEdge`) em cima desses terminais dinâmicos sem estourar erros de `UNCONNECTED_MODULE`.

## 4. Fora de Escopo (Explicit Exclusions)
- ❌ **Canvas de Desenho Livre (Freehand SVG):** O Sumaúma não deve ter uma ferramenta de pincel ou desenho vetorial arbitrário, pois a topologia exige normalização matemática (`side` e `offset`).
- ❌ **Integração com Layer 0 / 1 (Mundo 3D):** O símbolo paramétrico 2D **não** deve afetar ou substituir a malha física 3D do inversor (`.glb`), mantendo o princípio de isolamento geométrico.
- ❌ **Alteração no fluxo do Kurupira UI:** O engenheiro no Kurupira não edita o símbolo. Se o símbolo estiver errado, deve ser consertado no Backoffice (Sumaúma).

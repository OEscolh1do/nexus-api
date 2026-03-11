# Workflow de Atualização de Documentação (DOCS_WORKFLOW)

Este documento define o protocolo padrão para manter a documentação sincronizada com a evolução do código, garantindo que a base de conhecimento reflita a realidade arquitetural do projeto.

## Ciclo de Vida da Documentação

Para qualquer PR ou Commit que altere a arquitetura, estrutura ou lógica de negócio, o seguinte ciclo de 4 etapas deve ser seguido VIGO:

### 1. Audit (Auditoria)

Antes de documentar, identifique o escopo da mudança.

- **Pergunta:** Quais arquivos `.tsx` ou `.ts` foram criados, modificados ou deletados?
- **Ação:** Liste os componentes afetados.
- **Exemplo:** "Refatoração do `ClientModule` afetou `InputForm` e criou `CustomerIdentity`."

### 2. Deprecate (Depreciação)

Nunca apague documentação de código legado imediatamente se o código ainda existir (mesmo que não usado).

- **Ação:** Marque seções antigas nos Markdowns com tags de alerta.
- **Tag Padrão:**
  > [!WARNING]
  > **DEPRECATED (v2.1):** Este componente foi substituído por [NovoComponente] e será removido na versão v3.0.

### 3. Map (Mapeamento)

Crie uma clara relação "De -> Para" para guiar desenvolvedores na transição.

- **Ação:** Atualize diagramas e tabelas de componentes.
- **Tabela Modelo:**
  | Legado (V1) | Novo (V2.1) | Motivo |
  |-------------|-------------|--------|
  | `InputForm` | `ClientModule` (Orchestrator) | Decomposição em átomos para manutenibilidade. |

### 4. Publish (Publicação)

Efetive as mudanças nos arquivos `.md`.

- **Ação:** Atualize o Header dos arquivos com a nova versão e data.
- **Checklist de Publicação:**
  - [ ] `ARCHITECTURE.md`: Reflete o diagrama de alto nível?
  - [ ] `COMPONENTS.md`: Novos componentes e átomos catalogados?
  - [ ] `MODULES_DETAIL.md`: Detalhes dos módulos V3 atualizados?
  - [ ] `STATE_MANAGEMENT.md`: Mudanças no store ou slices documentadas?
  - [ ] `API.md`: Interfaces e Contratos (Zod) atualizados?
  - [ ] `UI_UX_MAP.md`: Sitemap atualizado?
  - [ ] `INTERFACE_MAP_DETAILED.md`: Interface detalhada atualizada?
  - [ ] `TESTING_GUIDE.md`: Novos casos de teste considerados?

---

## Protocolo de Versionamento de Docs

- **Major (1.0 -> 2.0):** Mudança arquitetural completa (ex: Monólito -> Módulos).
- **Minor (2.1 -> 2.2):** Adição de novos módulos ou componentes atômicos.
- **Patch (2.1.1 -> 2.1.2):** Correções de texto ou diagramas.

---

## Checklist para o Desenvolvedor (Definition of Done)

Ao finalizar uma tarefa de código, verifique:

- [ ] Executei a **Auditoria** de impacto?
- [ ] Marquei componentes antigos como **Deprecated** no `COMPONENTS.md`?
- [ ] Adicionei os novos componentes ao **Catálogo** (`COMPONENTS.md`)?
- [ ] Atualizei a árvore de arquivos no `DEVELOPER_GUIDE.md`?
- [ ] O `ARCHITECTURE.md` ainda é verdadeiro?

---

**Autor**: Neonorte Tecnologia  
**Versão**: 1.0.1 (Auditoria V3.4)  
**Última Atualização**: 2026-03-02

# 🗄️ TEMPLATE: ARCH_DB_SCHEMA (O DBA)

> **💡 PARA QUE SERVE?**
>
> **O Cenário:** Você precisa adicionar novas tabelas, relacionamentos complexos ou mudar a estrutura do banco de dados sem perder dados ou criar inconsistências.
>
> **A Abordagem:** Peça para a IA analisar o impacto no banco de dados e planejar a migração de forma segura.

---

## ✂️ COPIE ISSO AQUI:

```xml
<system_role>
  Atue como Database Architect & DBA Expert.
  Stack: PostgreSQL / SQL Server + Prisma ORM.
</system_role>

<mission>
  Planejar alteração/criação de Schema para: "{{NOME_DA_ENTIDADE}}".
</mission>

<data_requirements>
  <!-- Quais dados vamos armazenar? -->
  - {{EX: RELACIONAMENTO N:N ENTRE USUÁRIOS E PROJETOS}}
  - {{EX: LOG DE AUDITORIA PARA CADA ALTERAÇÃO}}
</data_requirements>

<constraints>
  - Integridade Referencial é prioridade.
  - Otimize para performance de leitura (Índices).
  - Evite dados duplicados (Normalização).
</constraints>

<output_instruction>
  NÃO EXECUTE MIGRATIONS AINDA.
  Gere um artefato `db_planning.md` contendo:
  1. **ERD (Mermaid):** Diagrama Entidade-Relacionamento.
  2. **Prisma Schema Snippet:** O código exato para colar no `schema.prisma`.
  3. **Data Safety:** Análise de como essa mudança afeta os dados existentes.
</output_instruction>
```

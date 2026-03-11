# ADR 001: Adoção do Monólito Modular

## Status

Aceito

## Contexto

O projeto Neonorte | Nexus iniciou como uma aplicação monolítica flat, onde controllers, services e rotas estavam misturados em pastas globais (`src/controllers`, `src/services`). Com o crescimento para múltiplos domínios (Comercial, Operações, Financeiro, Estratégia), essa estrutura tornou-se insustentável ("Ball of Mud"), dificultando a manutenção e o on-boarding de novos desenvolvedores.

## Decisão

Adotar a arquitetura de **Monólito Modular**.
O código será reorganizado em **Módulos de Domínio** auto-contidos dentro de `src/modules`.

### Estrutura do Módulo

Cada módulo (ex: `commercial`, `ops`) deve seguir estritamente esta estrutura:

```
src/modules/{domain}/
├── controllers/       # Lógica de recebimento HTTP
├── services/          # Regras de Negócio e Banco de Dados (Prisma)
├── schemas/           # Validação Zod (Input/Output)
├── types/             # Tipagem TypeScript (Compartilhada com Frontend)
├── middleware/        # Policiais de Fronteira (Auth especifico)
└── ui/                # (Frontend) Componentes e Views exclusivas
```

## Consequências

### Positivas

- **Coesão Alta:** Tudo relacionado a "Vendas" está em um único lugar.
- **Acoplamento Baixo:** Módulos se comunicam via Service Interface, não importando arquivos internos arbitrariamente.
- **Cognição:** Desenvolvedor pode focar em um único domínio sem entender o sistema todo.

### Negativas

- **Boilerplate:** Criação de novos módulos exige estrutura inicial.
- **Refatoração:** Migrar código legado exige esforço manual intensivo (Fase "The Purge").

## Compliance

Qualquer nova funcionalidade deve nascer dentro de um módulo. Pastas globais (`src/utils`, `src/lib`) são permitidas apenas para infraestrutura genérica (Logging, Database Client).

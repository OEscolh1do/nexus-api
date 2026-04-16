---
name: path-finder
description: Skill antiburrice focada em prevenir a criação de "Shadow Copies" (Alucinação de Diretório). Mapeia sistematicamente se o arquivo já existe e onde ele é importado antes de assumir caminhos como verdade absoluta.
---

# Skill: Path Finder (Anti-Shadow Copy)

## Gatilho Semântico

Ativada compulsoriamente na etapa inicial de **Research (Medir Duas Vezes)** do workflow `/planning` ou quando o desenvolvedor pedir: "refatore esse arquivo", "crie isso aqui" utilizando caminhos que possam ser ambíguos na arquitetura.

## Protocolo Antiburrice

Sempre que a tarefa englobar uma arquitetura onde se substitue componentes, reconstrua-os do zero ou edite estruturas modulares:

1. **Extração de Assinatura**: Identifique o nome do componente alvo principal que o usuário quer trabalhar (ex: `MeuComponenteCard`).
2. **Scan Global de Existência**: Use a ferramenta `grep_search` com a query focada na definição do Componente e no nome do arquivo para encontrar TODOS os lugares no repositório onde um arquivo com aquele nome ou finalidade pode estar.
3. **Traceability (O Local Real)**: Faça outro `grep_search` procurando explicitamente por `import { MeuComponenteCard }` no projeto (idealmente no repositório frontend/src inteiro). O lugar da onde ele for de fato instanciado/importado revela o caminho real e a verdadeira intenção arquitetural.
4. **Resolução de Conflito**:
   - Se o usuário sugerir a criação no caminho `src/a/b/c/` mas o `grep_search` provar que o container importa algo chamado igual que vive dentro de `src/a/z/`, a verdade que impera é a **do compilador/import**. 
   - Apenas neste cenário desconsidere o caminho do prompt do usuário como fonte única de verdade ou informe-o da divergência de imediato antes de escrever ou criar.

## Limitações e Boas Práticas

- Esta skill visa abolir arquivos órfãos não-importados (Shadow Copies).
- Foco em frontend React onde a nested architecture de importação relativa tende a gerar confusões semânticas entre pastas como `containers`, `views` e `panels`.
- Nunca edite ou crie usando o `write_to_file` se o passo de *Traceability* não tiver sido garantido para componentes estruturais chaves.

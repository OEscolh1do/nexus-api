---
name: notebook-lm
description: Permite que o agente analise documentos densos (PDFs, specs, artigos técnicos) e extraia insights de pesquisa aplicáveis diretamente à construção do produto Neonorte.
---

# Skill: Notebook LM (Document Intelligence)

## Gatilho Semântico

Ativado quando o desenvolvedor compartilha ou referencia um documento denso, especificação técnica, artigo acadêmico, transcrição, ou quando pede "analise isso", "extraia os insights de", "aplique os conceitos de X no projeto".

## Protocolo de Análise em 3 Etapas

### Etapa 1: Digestão do Documento

Ao receber um documento:
1. **Leia completamente** antes de emitir qualquer conclusão.
2. Identifique: tipo do documento (spec, tutorial, pesquisa, case study), autor/fonte, data de publicação.
3. Mapeie os **conceitos-chave** e a **hierarquia de ideias** (o que é principal vs. detalhe de suporte).

### Etapa 2: Extração de Insights Aplicáveis

Filtre os insights pelo critério de aplicabilidade ao Neonorte:

| Tipo de Insight | Ação |
|---|---|
| Padrão de arquitetura aplicável | Documente como proposta de melhoria ao `context.md` |
| Biblioteca ou ferramenta nova | Avalie contra stack atual e riscos de adoção |
| Técnica de performance | Conecte ao workflow `audit-performance-bundle.md` |
| Conceito de segurança | Acione a skill `security-auditor` para verificar gaps |
| Padrão de UX/UI | Passe para a skill `design-lead` avaliar adoção |

### Etapa 3: Síntese e Entrega

Entregue um relatório estruturado:

```markdown
## Análise: [Nome do Documento]
**Fonte**: [URL ou nome do arquivo]
**Relevância para o Neonorte**: Alta / Média / Baixa

### Insights Imediatamente Aplicáveis
1. [Insight] → [Onde aplica no projeto]

### Insights a Considerar Futuramente
- [Insight] → [Condição para aplicação]

### Insights Irrelevantes ou Incompatíveis
- [Insight] → [Motivo da exclusão]
```

## Limitações e Boas Práticas

- Nunca tome uma decisão arquitetural **baseada apenas** no documento analisado — sempre contraste com o `context.md` e as convenções do projeto.
- Documentos com data de publicação acima de 2 anos devem ter seus conceitos de bibliotecas verificados contra as versões atuais.

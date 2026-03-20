---
description: Avaliação heurística e completude do módulo
---

# Fluxo de Trabalho: Auditoria de Novo Módulo (Auditoria de Completude)

Sempre que a construção de um módulo UI ou componente for dada como "Concluída", rode este mini checklist mental/auditório:

1. **UX/UI Consistência**: O componente utiliza o Glassmorphism do "Padrão Neonorte"? Usa a paleta utilitária do Tailwind mapeada em `tailwind.config.js`?
2. **SSO Constraints**: Se o card adicionado no Hub for direcionar o usuário para fora (`nexus-erp`, `lumi`), ele manda o parâmetro `?session=TOKEN` de forma envelopada para o Single Sign-on fluir?
3. **Escala**: Variáveis hardcoded devem ser isoladas e colocadas em `.env` se for um projeto ou URL nova.
4. **Clean Code**: As funções auxiliares foram adequadamente tiradas do Componente React e levadas à arquivos `lib/`?

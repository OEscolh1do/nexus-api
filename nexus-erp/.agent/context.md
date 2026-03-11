# Contexto: Neonorte ERP (Core Business)
**Propósito:** Este diretório é o cérebro (Frontend React) da gestão diária da Neonorte. Aqui rodam os módulos de Gestão Executiva (BI/Financeiro), Mission Control (Comercial) e Fábrica de Projetos (Ops/Obras).
**Setup Arquitetural:** React + Vite + TailwindCSS.
**Importante:** A autenticação (Login) NÃO OCORRE AQUI. Ela vem do \
exus-hub\ via URL parameter JWT (\?session=\). Nunca crie fluxos de login neste repositório.

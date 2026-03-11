# Regras de Desenvolvimento - Lumi (Enterprise Gold Standard)

## 📌 1. Regras de Estado & Orquestração (Critical Rule)
No Lumi, **jamais utilize estados locais (`useState`) para dados que compõem a Proposta Fotovoltaica (Inputs do Cliente, Escolha de Inversores, Dados de Engenharia)**. 
Toda informação de negócio deve ser obrigatoriamente despachada (dispatched) para o **Zustand (`solarStore`)** e dividida em seu respectivo slice. `useState` é permitido apenas para estados voláteis de Interface (ex: `isOpen` num modal, `isLoading` em um botão de envio).

## 🧩 2. Convenções de Componentes e Nomenclatura
- **Vistas Superiores (Orquestradores):** Devem terminar em `Module` (ex: `ClientModule.tsx`, `EngineeringModule.tsx`) caso controlem a renderização do layout inteiro.
- **Abas Internas:** Se o componente é um passo de um wizard gerenciado por estado, sufixe com `Tab` (ex: `SurveyTab.tsx`, `AnalysisTab.tsx`).
- **Nomenclatura Estrita:** Utilize UpperCamelCase para componentes React e Arquivos. Para utilitários e lógicas, snake_case (`solar_calculator.ts`) ou camelCase (`generatePDF.ts`) é aceitável, mas prefira a coerência do ecossistema. Tipos TypeScript devem terminar com props/types ou representar as Entidades.

## 🛠️ 3. Interface Visual e Componentes (Dense UI)
O Lumi adota uma estética "Premium Glassmorphism" para interfaces B2B de alta tecnologia técnica. 
Sempre que for construir UI:
- Reutilize os helpers do Tailwind (`min-h-screen`, gradients absolutos) já presentes no `App.tsx` global.
- Use os Mock Components já existentes na plataforma quando for simular botões e cards de entrada primários.
- Para alertas que paralisem o fluxo de preenchimento (ex: Inversor incompatível com a tensão dos Strings), use tratamento visual claro (ex: contornos vermelhos brilhantes).

## 🔒 4. Validação e Segurança Contatual
A responsabilidade de gerar valores é do Motor Fotovoltaico. O Componente Visual só renderiza os números.
- **Zod como Guardião:** Todas as estruturas passadas para as classes de negócio DEVEM ser pré-validadas por um Schema Zod (ex: `EngineeringSettingsSchema.parse()`) na beirada, evitando que `NaN` ou dependências ausentes quebrem a árvore de cálculo.
- Cálculos financeiros (`Payback`, `TIR`) não devem residir em arquivos `.tsx`. Envie tudo para libs abstratas puras (`lib/finance_math.ts`).

## 📞 5. Integração Nexus
Toda vez que uma comunicação com a API do Nexus for concebida (`/api/v1/integrations/lumi`), abstraia essa chamada no diretório `src/services/NexusClient.ts` em vez de espalhar hooks `fetch()` pelo código de UI.

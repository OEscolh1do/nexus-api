# Especificação: Integração M2M de Consumo (targetPowerKwp & avgConsumption)

## 1. O Quê (Business Problem)
**Problema**: Na tela do `ProjectExplorer` (Kurupira), métricas chaves (`targetPowerKwp` e `avgConsumption`) utilizam fallbacks porque não há integração efetiva de listagem que desça essa informação do Iaçã ERP para todos os cartões simultaneamente.
**Solução**: Fazer cache via desnormalização no database M2M ou via API call estendida do Kurupira ao Iaçã para povoar os sumarios correntos no card.

## 2. Usuários Finais
- **Engenheiro Sênior**: Para visualizar logo de cara no dashboard se o projeto atende a métrica base.

## 3. Critérios de Aceitação
1. Kurupira extrai ou armazena o status real na listagem para cada Lead através do `iacaLeadId`.
2. Componentes visuais do `ProjectExplorer` renderizam dados verídicos.
3. Se modo `standalone` sem Lead, busca dados gravados localmente do `ProjectInitWizardModal`.

## 4. Fora de Escopo
- Recalcular potência de todo o catálogo. Apenas recuperar do Lead/Contexto Comercial.

## 5. Detalhes Técnicos
- Endpoint M2M do Iaçã ou Prisma Model do Kurupira precisa registrar `targetPower` cacheado.

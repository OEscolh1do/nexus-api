# Conhecimento de Domínio — Engenharia Solar

Ter sucesso programando o Kurupira exige mais do que apenas código; exige entender a física e a engenharia por trás dos dados.

## ⚡ Elétrica Fotovoltaica Básica
- **Parâmetros de Módulos**: Voc (Tensão de Circuito Aberto), Isc (Corrente de Curto-Circuito), Pmax (Potência Máxima), Coeficientes de Temperatura.
- **Topologia de Strings**: Saber o que acontece quando módulos são ligados em série vs paralelo.
- **Inversores & MPPTs**: Entender a função do inversor e como múltiplos rastreadores de ponto de máxima potência (MPPT) influenciam o design.
- **FDI (Fator de Dimensionamento)**: Ratio total DC (módulos) / total AC (inversores).

## 🌍 Geometria Solar e Localização
- **Irradiância (HSP)**: Entender as Horas de Sol Pleno e como os dados do CRESESB são consultados.
- **Azimute e Inclinação**: Como a orientação física dos painéis afeta a curva de geração.
- **Sombreamento**: Noções básicas de como obstáculos reduzem a eficiência sistêmica.

## 📊 Indicadores de Performance (KPIs)
- **Performance Ratio (PR)**: Saber que a eficiência global não é 100% e que perdas térmicas, de cabeamento e de inversor devem ser consideradas.
- **Geração Estocástica**: Entender que a geração é uma estimativa baseada em dados meteorológicos históricos (TMY).

## 🗺 Normas e Padrões
- **ABNT/ANEEL**: Estar ciente de que existem limites técnicos impostos por normas brasileiras que o software deve validar (ex: limites de tensão de string).

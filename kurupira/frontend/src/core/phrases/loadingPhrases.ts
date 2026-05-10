/**
 * =============================================================================
 * LOADING PHRASES — Catálogo KSP-Style do Kurupira
 * =============================================================================
 *
 * Frases organizadas por LoadingContext. Inspiradas no Kerbal Space Program:
 * técnicas, situacionais e ácidas — nunca genéricas.
 *
 * Padrão editorial (ver docs/loading-screen-phrases.md):
 * ✅ Ação técnica (consequência cômica)
 * ✅ Situação real da obra, exagerada
 * ✅ Burocracia ácida
 * ✅ Absurdo coerente com o domínio solar
 * ❌ Referências externas ao universo solar
 * =============================================================================
 */

import { type LoadingContext } from '../state/uiStore';

// =============================================================================
// CATÁLOGO POR CONTEXTO
// =============================================================================

/** Frases para 'catalog' — carregamento do catálogo de módulos/inversores */
const CATALOG_PHRASES = [
  'Localizando o ponto de máxima potência (MPPT)...',
  'Calculando perdas por mismatch...',
  'Dimensionando condutores para evitar churrasco...',
  'Ajustando o ângulo azimutal para o Norte Geográfico...',
  'Verificando o clipping do inversor...',
  'Calculando Voc na temperatura mínima da madrugada...',
  'Checando se o Isc não passa do limite do hardware...',
  'Verificando a janela MPPT com margem de segurança...',
  'Ajustando o MPPT para extrair até o último raio de sol...',
  'Aplicando coeficiente de temperatura do fabricante...',
  'Validando conformidade com a NBR 16690...',
  'Aplicando modelo de Perez para irradiância em superfície inclinada...',
  'Recalibrando o modelo de céu de Ineichen...',
  'Convertendo DNI em GTI com muito cuidado...',
  'Verificando a compatibilidade módulo × inversor...',
  'Validando o dimensionamento das strings (sem nós de marinheiro)...',
  'Verificando a integridade estrutural do seu ROI...',
  'Recalculando o LCOE para sistemas bifaciais...',
  'Simulando 30 anos de sol em 3 segundos...',
  'Calibrando o algoritmo de irradiância global...',
  'Adicionando mais baterias para compensar o otimismo...',
  'Preparando ambiente de engenharia...',
] as const;

/** Frases para 'project-hub' — lista de projetos e operações de projeto */
const PROJECT_HUB_PHRASES = [
  'Sincronizando com a nuvem (a de dados, não a de chuva)...',
  'Aquecendo os micro-serviços solares...',
  'Compilando dados meteorológicos de última hora...',
  'Validando coordenadas GPS (não queremos painéis no oceano)...',
  'Verificando se o endereço existe (não queremos instalar no vizinho)...',
  'Confirmando a orientação dos módulos (não queremos gerar energia à noite)...',
  'Validando a inclinação (não queremos coletar mais poeira que sol)...',
  'Calculando a carga estrutural (não queremos reformar o telhado junto com o projeto)...',
  'Calculando o Voc máximo (para não explodir o inversor)...',
  'Organizando a String Box para não parecer um ninho de ratos...',
  'Consultando o oráculo das normas técnicas...',
  'Sincronizando estado do projeto com o servidor...',
  'Verificando integridade do payload de simulação...',
  'Verificando se o estagiário apertou os conectores MC4...',
  'Tentando encaixar mais um módulo no telhado...',
  'Contando módulos em série com os dedos (e depois com a fórmula)...',
  'Verificando se o cliente quer geração ou estética...',
  'Procurando o cabo de aterramento que sumiu na obra...',
  'Adicionando mais módulos (apenas por garantia)...',
  'Verificando se o inversor está de cabeça para baixo (de novo)...',
] as const;

/** Frases para 'map-tiles' — carregamento de mapa/tiles Leaflet */
const MAP_TILES_PHRASES = [
  'Validando coordenadas GPS (não queremos painéis no oceano)...',
  'Caçando a árvore do vizinho que não estava no Google Maps...',
  'Renderizando sombras projetadas (e evitando as indesejadas)...',
  'Calculando a sombra da caixa d\'água às 14h do solstício...',
  'Verificando sombreamento de chaminés inexistentes...',
  'Alinhando as strings com a bússola descalibrada do celular...',
  'Verificando se o endereço existe (não queremos instalar no vizinho)...',
  'Calculando a carga estrutural (não queremos reformar o telhado junto com o projeto)...',
  'Ignorando a nuvem que acabou de estacionar em cima da obra...',
  'Detectando mismatch de orientação no MPPT 1...',
  'Calculando o espaçamento entre fileiras (não queremos sombra das 9h)...',
  'Ajustando a inclinação para maximizar geração anual...',
  'Otimizando o posicionamento dos fótons...',
] as const;

/** Frases para 'site-context' — dados do projeto no modal de contexto */
const SITE_CONTEXT_PHRASES = [
  'Consultando o TMY de Belém...',
  'Aplicando modelo de Perez para irradiância em superfície inclinada...',
  'Simulando albedo do solo (com 99% de confiança)...',
  'Calculando Voc na temperatura mínima da madrugada...',
  'Hidratando o grafo de arranjo elétrico...',
  'Calculando queda de tensão no cabo CC...',
  'Ajustando a curva de degradação para 25 anos...',
  'Aplicando inflação tarifária sobre o fluxo de caixa...',
  'Contabilizando a isenção de ICMS até 2045...',
  'Incluindo o TUSD Fio B no fluxo de caixa pós-2028...',
  'Calculando o payback descontado (é menos do que parece)...',
  'Calculando o ROI (considerando que o Sol não peça demissão)...',
  'Subtraindo o clipping das receitas projetadas...',
  'Buscando contexto do projeto...',
] as const;

/** Easter eggs — aparecem com ~5% de probabilidade em qualquer contexto */
export const EASTER_EGG_PHRASES = [
  'Localizando o Jebediah Kerman na curva de retorno do inversor...',
  'Reticulando Splines Solares™...',
  'Assando biscoitos durante a simulação Monte Carlo...',
  'Adicionando K a tudo que não tem K ainda...',
  'Perguntando ao Jeb o que ele acha do layout...',
  'Aguardando vistoria agendada para o próximo trimestre...',
  'Verificando se o parecer de acesso chegou (spoiler: não chegou)...',
  'Negociando com a concessionária (isso pode demorar)...',
  'Expulsando nuvens passageiras com pensamento positivo...',
  'Polindo cristais de silício manualmente...',
] as const;

// =============================================================================
// MAPA DE CONTEXTO → FRASES
// =============================================================================

export type PhraseArray = readonly string[];

export const PHRASES_BY_CONTEXT: Record<NonNullable<LoadingContext>, PhraseArray> = {
  'catalog':      CATALOG_PHRASES,
  'project-hub':  PROJECT_HUB_PHRASES,
  'map-tiles':    MAP_TILES_PHRASES,
  'site-context': SITE_CONTEXT_PHRASES,
};

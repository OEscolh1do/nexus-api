/**
 * =============================================================================
 * useLoadingPhrase — Hook de Seleção de Frases KSP-Style
 * =============================================================================
 *
 * Retorna um GETTER de frase para um dado LoadingContext.
 * O getter deve ser chamado no momento do setAppLoading(), não no render.
 *
 * Comportamento:
 * - Seleciona aleatoriamente entre as frases do contexto.
 * - Evita repetir as últimas HISTORY_SIZE frases do contexto.
 * - Com probabilidade EASTER_EGG_PROB, retorna um easter egg.
 * - O histórico é compartilhado em nível de módulo — todos os call-sites
 *   do mesmo contexto contribuem para o mesmo histórico.
 *
 * Uso:
 * ```tsx
 * const getPhrase = useLoadingPhrase('project-hub');
 *
 * const handleLoad = async () => {
 *   setAppLoading('project-hub', getPhrase()); // ✅ getter chamado no callback
 *   const data = await fetchProjects();
 *   clearAppLoading();
 * };
 * ```
 *
 * ❌ NÃO FAÇA:
 * ```tsx
 * const phrase = useLoadingPhrase('project-hub'); // retorna getter, não string
 * setAppLoading('project-hub', phrase);           // passa a função, não o resultado
 * ```
 * =============================================================================
 */

import { useCallback, useRef } from 'react';
import { type LoadingContext } from '../state/uiStore';
import { PHRASES_BY_CONTEXT, EASTER_EGG_PHRASES } from './loadingPhrases';

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

/** Quantas frases recentes evitar repetir por contexto */
const HISTORY_SIZE = 5;

/** Probabilidade de aparecer um easter egg (0–1) */
const EASTER_EGG_PROB = 0.05;

// =============================================================================
// HISTÓRICO EM NÍVEL DE MÓDULO
// Compartilhado por todos os call-sites do mesmo contexto.
// Garante anti-repetição mesmo quando múltiplos componentes usam o mesmo contexto.
// =============================================================================

const phraseHistory = new Map<NonNullable<LoadingContext>, string[]>();

function getHistory(context: NonNullable<LoadingContext>): string[] {
  if (!phraseHistory.has(context)) {
    phraseHistory.set(context, []);
  }
  return phraseHistory.get(context)!;
}

function pushToHistory(context: NonNullable<LoadingContext>, phrase: string): void {
  const history = getHistory(context);
  history.push(phrase);
  if (history.length > HISTORY_SIZE) {
    history.shift(); // mantém apenas as últimas HISTORY_SIZE
  }
}

// =============================================================================
// SELEÇÃO ALEATÓRIA PURA (fora do hook — testável isoladamente)
// =============================================================================

/**
 * Seleciona uma frase para o contexto dado.
 * Lógica pura sem React — pode ser chamada de qualquer lugar.
 */
export function pickPhrase(context: NonNullable<LoadingContext>): string {
  // 5% de chance de easter egg
  if (Math.random() < EASTER_EGG_PROB) {
    const idx = Math.floor(Math.random() * EASTER_EGG_PHRASES.length);
    return EASTER_EGG_PHRASES[idx];
  }

  const pool = PHRASES_BY_CONTEXT[context];
  const history = getHistory(context);

  // Filtra frases já exibidas recentemente
  const available = pool.filter(p => !history.includes(p));

  // Se todas já foram exibidas (pool pequeno), reseta o histórico
  const candidates = available.length > 0 ? available : [...pool];

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  pushToHistory(context, chosen);

  return chosen;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Retorna um getter estável (via useCallback) que produz uma frase
 * rotativa para o contexto informado.
 *
 * O getter é memoizado — não muda entre renders, seguro para usar em
 * closures de useEffect e event handlers.
 *
 * @param context - O LoadingContext que determina o pool de frases.
 *                  Passa `null` para retornar uma string vazia (loading desabilitado).
 */
export function useLoadingPhrase(context: LoadingContext): () => string {
  // Ref para manter o contexto atual sem re-criar o getter ao mudar
  const contextRef = useRef(context);
  contextRef.current = context;

  return useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx) return '';
    return pickPhrase(ctx);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Intencionalmente sem deps — o getter deve ser estável.
  // O contextRef.current captura o valor correto no momento da chamada.
}

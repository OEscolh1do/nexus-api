/**
 * =============================================================================
 * useCountUp — Hook de Animação de Contador Ascendente
 * =============================================================================
 * Anima um número de 0 até `target` em `duration` ms com easing personalizado.
 *
 * Design choices:
 * - Usa requestAnimationFrame + useRef (não useState em loop) para 60fps sem jank
 * - Easing `easeOut` por padrão: aceleração inicial, desaceleração final
 * - Re-anima automaticamente quando `target` muda (ex: tarifa interativa)
 * - Expõe `isComplete` para coordenar entradas de outros elementos
 *
 * Neurociência: contador ascendente ativa o sistema dopaminérgico
 * (Schultz, 1997) — o cérebro interpreta números crescentes como ganho.
 * =============================================================================
 */

import { useEffect, useRef, useState, useCallback } from 'react';

type EasingFn = (t: number) => number;

const EASINGS: Record<string, EasingFn> = {
  /** Desacelera no final — ideal para contadores de valor */
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  /** Acelera e desacelera — ideal para tickers animados */
  easeInOut: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  /** Linear — para referência/testes */
  linear: (t) => t,
};

interface UseCountUpOptions {
  /** Valor final a atingir */
  target: number;
  /** Duração da animação em ms (padrão: 1200) */
  duration?: number;
  /** Função de easing (padrão: 'easeOut') */
  easing?: keyof typeof EASINGS;
  /** Delay antes de iniciar a animação em ms (padrão: 0) */
  delay?: number;
  /** Número de casas decimais no resultado (padrão: 0) */
  decimals?: number;
}

interface UseCountUpResult {
  /** Valor atual animado */
  value: number;
  /** true quando a animação terminou */
  isComplete: boolean;
  /** Reinicia a animação do zero */
  restart: () => void;
}

export function useCountUp({
  target,
  duration = 1200,
  easing  = 'easeOut',
  delay   = 0,
  decimals = 0,
}: UseCountUpOptions): UseCountUpResult {
  const [value,      setValue]      = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const rafRef       = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startValRef  = useRef(0);
  const easingFn     = EASINGS[easing] ?? EASINGS.easeOut;

  const animate = useCallback((timestamp: number) => {
    if (startTimeRef.current === null) startTimeRef.current = timestamp;
    const elapsed  = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = easingFn(progress);
    const current  = startValRef.current + (target - startValRef.current) * eased;

    const rounded = parseFloat(current.toFixed(decimals));
    setValue(rounded);

    if (progress < 1) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      setValue(parseFloat(target.toFixed(decimals)));
      setIsComplete(true);
    }
  }, [target, duration, easingFn, decimals]);

  const start = useCallback(() => {
    // Cancela animação anterior
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    startTimeRef.current = null;
    setIsComplete(false);

    const delayTimer = setTimeout(() => {
      rafRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(delayTimer);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [animate, delay]);

  useEffect(() => {
    const cleanup = start();
    return cleanup;
  }, [target, start]);

  const restart = useCallback(() => {
    setValue(0);
    startValRef.current = 0;
    start();
  }, [start]);

  return { value, isComplete, restart };
}

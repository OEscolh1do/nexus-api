import { useState, useEffect } from 'react';

/**
 * useDebounce — adia a propagação de um valor por `delay` ms.
 *
 * Útil para evitar cálculos pesados em resposta a cada keystroke.
 * O valor retornado só se atualiza após `delay` ms sem nova mudança.
 *
 * @param value - Valor a ser debounced
 * @param delay - Tempo de espera em ms (default: 300)
 * @returns Valor debounced
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

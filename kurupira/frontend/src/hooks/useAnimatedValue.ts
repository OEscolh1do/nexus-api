import { useState, useEffect, useRef } from 'react';

/**
 * Animates a numeric value from its previous state to a new target using
 * requestAnimationFrame with cubic ease-out. Respects prefers-reduced-motion.
 *
 * @param target  - The target numeric value to animate towards
 * @param duration - Animation duration in ms (default: 400)
 * @returns The current interpolated display value
 */
export function useAnimatedValue(target: number, duration = 400): number {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef({ value: target, time: 0 });
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip animation on first render — show value immediately
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplay(target);
      return;
    }

    // Respect prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(target);
      return;
    }

    // Don't animate if the change is negligible (< 0.5)
    if (Math.abs(target - display) < 0.5) {
      setDisplay(target);
      return;
    }

    startRef.current = { value: display, time: performance.now() };

    const animate = (now: number) => {
      const elapsed = now - startRef.current.time;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      const interpolated = startRef.current.value + (target - startRef.current.value) * eased;

      setDisplay(interpolated);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

import { useState, useEffect, useRef } from 'react';
import type { SimulationPayload, SimulationResponse } from '@/core/workers/simulation.worker';

// Helper for debounce tracking
type Timeout = ReturnType<typeof setTimeout>;

export function useSimulationWorker(payload: SimulationPayload, debounceMs = 500) {
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const workerRef = useRef<Worker | null>(null);
  const debounceTimerRef = useRef<Timeout | null>(null);

  // Initialize Worker
  useEffect(() => {
    // Instantiate module worker pointing to our file
    workerRef.current = new Worker(
      new URL('../../core/workers/simulation.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e: MessageEvent) => {
      const data = e.data;
      if (data.success) {
        setResult(data.result);
        setError(null);
      } else {
        setError(data.error);
      }
      setIsCalculating(false);
    };

    workerRef.current.onerror = (e: ErrorEvent) => {
      setError(e.message);
      setIsCalculating(false);
    };

    return () => {
      workerRef.current?.terminate();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Post messages to worker with debounce
  useEffect(() => {
    if (!workerRef.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsCalculating(true);
    
    debounceTimerRef.current = setTimeout(() => {
      // Send cloneable payload
      workerRef.current?.postMessage(payload);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [
      // Dependency array representing the payload changes
      // Using JSON.stringify ensures we only react to deep equivalency changes
      JSON.stringify(payload)
  ]);

  return { result, isCalculating, error };
}

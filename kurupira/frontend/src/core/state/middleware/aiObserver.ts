
import { SolarState } from '../solarStore';

/**
 * AI Mediator Middleware
 * Intercepts state changes to perform "intelligent" side-effects.
 * 
 * Example:
 * - When Client Location changes, it could pre-fetch competitors in that area.
 * - When Tech Config changes, it could suggest optimizations.
 */

export const aiObserver = (config: any) => (set: any, get: any, api: any) => config(
  (...args: any[]) => {
    // 1. Execute the action
    set(...args);
    
    // 2. Observe the new state
    const newState = get() as SolarState;
    console.log('[AI Mediator] Observed State Change', newState);

    // 3. Logic for AI Triggers (Mock)
    // if (newState.clientData.city !== oldState.clientData.city) { ... }
  },
  get,
  api
);

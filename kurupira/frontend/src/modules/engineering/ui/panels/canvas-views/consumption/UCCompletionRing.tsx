import React, { useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface UCCompletionRingProps {
  /** Monthly history array (12 values) */
  monthlyHistory?: number[];
  /** Connection type (monofasico, bifasico, trifasico) */
  connectionType?: string;
  /** Voltage (127, 220, 380) */
  voltage?: string;
  /** Tariff rate (R$/kWh) */
  tariffRate?: number;
  /** Installation number */
  installationNumber?: string;
  /** Ring diameter in px */
  size?: number;
}

interface CompletionResult {
  score: number;
  label: string;
  color: string;
}

/**
 * Calculates the completion percentage of a UC based on weighted field presence.
 */
function calcCompletion(props: UCCompletionRingProps): CompletionResult {
  const { monthlyHistory, connectionType, voltage, tariffRate, installationNumber } = props;

  let score = 0;

  // Consumption data (40%) — at least one month > 0
  if (monthlyHistory && monthlyHistory.some(v => v > 0)) score += 40;

  // Connection type (15%)
  if (connectionType) score += 15;

  // Voltage (15%)
  if (voltage) score += 15;

  // Tariff (15%)
  if (tariffRate && tariffRate > 0) score += 15;

  // Installation number (15%)
  if (installationNumber && installationNumber.trim().length > 0) score += 15;

  if (score >= 100) return { score: 100, label: 'Completo', color: '#34d399' }; // emerald-400
  if (score > 0)    return { score, label: `${score}%`, color: '#38bdf8' };     // sky-400
  return { score: 0, label: '0%', color: '#475569' };                           // slate-600
}

export const UCCompletionRing: React.FC<UCCompletionRingProps> = (props) => {
  const size = props.size ?? 22;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const completion = useMemo(() => calcCompletion(props), [
    props.monthlyHistory,
    props.connectionType,
    props.voltage,
    props.tariffRate,
    props.installationNumber,
  ]);

  const dashOffset = circumference - (completion.score / 100) * circumference;
  const isComplete = completion.score >= 100;

  if (isComplete) {
    return (
      <div
        className="flex items-center justify-center shrink-0 transition-all duration-300"
        style={{ width: size, height: size }}
        title="UC totalmente configurada"
      >
        <CheckCircle2
          size={size * 0.7}
          className="text-emerald-500"
          strokeWidth={2.5}
        />
      </div>
    );
  }

  return (
    <div
      className="relative shrink-0 transition-all duration-300"
      style={{ width: size, height: size }}
      title={`Progresso sugerido: ${completion.label}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        {completion.score > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={completion.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        )}
      </svg>
      {/* Center percentage (only if size allows) */}
      {size >= 24 && (
        <span
          className="absolute inset-0 flex items-center justify-center text-[7px] font-mono font-bold tabular-nums"
          style={{ color: completion.color }}
        >
          {completion.score}
        </span>
      )}
    </div>
  );
};

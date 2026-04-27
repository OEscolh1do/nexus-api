// StringWireHUD.tsx — implementação sem guia de skill
// Versão genérica sem os tokens de cor e terminologia específica da spec

import React from 'react';

interface StringWireHUDProps {
  connectedModules: number;
  voltage: number;
  maxVoltage: number;
  isOverLimit: boolean;
  isNearLimit: boolean;
  canFinish: boolean;
  onFinish: () => void;
  onCancel: () => void;
}

export const StringWireHUD: React.FC<StringWireHUDProps> = ({
  connectedModules,
  voltage,
  maxVoltage,
  isOverLimit,
  isNearLimit,
  canFinish,
  onFinish,
  onCancel,
}) => {
  const voltageColor = isOverLimit
    ? '#ef4444'
    : isNearLimit
    ? '#f59e0b'
    : '#22c55e';

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 1000,
        width: 240,
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(100, 116, 139, 0.4)',
        borderRadius: 8,
        padding: 12,
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#cbd5e1',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8, color: '#e2e8f0' }}>
        Wire Connection
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#94a3b8' }}>Modules:</span>
        <span>{connectedModules}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#94a3b8' }}>Voltage:</span>
        <span style={{ color: voltageColor }}>
          {voltage.toFixed(1)} V
          {isOverLimit && ' ⚠ OVER LIMIT'}
          {!isOverLimit && isNearLimit && ' ⚠ Near limit'}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: '#94a3b8' }}>Max allowed:</span>
        <span>{maxVoltage.toFixed(0)} V</span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onFinish}
          disabled={!canFinish}
          style={{
            flex: 1,
            padding: '6px 0',
            background: canFinish ? '#4f46e5' : '#334155',
            color: canFinish ? '#fff' : '#64748b',
            border: 'none',
            borderRadius: 4,
            cursor: canFinish ? 'pointer' : 'not-allowed',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          Finish
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '6px 0',
            background: '#1e293b',
            color: '#94a3b8',
            border: '1px solid #334155',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default StringWireHUD;

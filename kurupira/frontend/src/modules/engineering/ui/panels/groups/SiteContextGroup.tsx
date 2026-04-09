/**
 * =============================================================================
 * SITE CONTEXT GROUP — Dados do Cliente, Localização e Clima (UX-002)
 * =============================================================================
 *
 * Grupo extraído do RightInspector (linhas 85-135).
 * Auto-suficiente: consome suas próprias stores e hooks.
 * Renderizado dentro de PanelGroup no dock ou PromotedPanelView no center.
 * =============================================================================
 */

import React from 'react';
import { User, MapPin, Thermometer, CloudOff } from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';
import { SectionHeader, PropRow } from '../properties/shared';

// =============================================================================
// COMPONENT
// =============================================================================

export const SiteContextGroup: React.FC = () => {
  const clientData = useSolarStore((state) => state.clientData);
  const weatherData = useSolarStore((state) => state.weatherData);

  const hasClientData = !!clientData.clientName;

  return (
    <div className="p-3 space-y-3">
      {/* Client Info */}
      <section>
        <SectionHeader icon={<User size={10} />} label="Cliente" />
        {hasClientData ? (
          <div className="space-y-1.5 mt-2">
            <PropRow label="Nome" value={clientData.clientName || '—'} />
            <PropRow label="Cidade" value={`${clientData.city || '—'}, ${clientData.state || '—'}`} />
            <PropRow label="Endereço" value={clientData.street || '—'} />
            <PropRow
              label="Conexão"
              value={
                clientData.connectionType === 'trifasico'
                  ? 'Trifásico'
                  : clientData.connectionType === 'bifasico'
                    ? 'Bifásico'
                    : clientData.connectionType === 'monofasico'
                      ? 'Monofásico'
                      : clientData.connectionType || '—'
              }
            />
          </div>
        ) : (
          <div className="mt-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
            <p className="text-[10px] text-slate-600">Dados do cliente serão exibidos aqui quando carregados.</p>
          </div>
        )}
      </section>

      {/* Location */}
      <section>
        <SectionHeader icon={<MapPin size={10} />} label="Localização" />
        <div className="mt-2 space-y-1.5">
          <PropRow label="Latitude" value={clientData.lat ? `${clientData.lat.toFixed(4)}°` : '—'} />
          <PropRow label="Longitude" value={clientData.lng ? `${clientData.lng.toFixed(4)}°` : '—'} />
          <PropRow label="Área Disponível" value={clientData.availableArea ? `${clientData.availableArea} m²` : '—'} />
        </div>
      </section>

      {/* Weather */}
      <section>
        <SectionHeader icon={<Thermometer size={10} />} label="Clima" />
        <div className="mt-2 space-y-1.5">
          {weatherData ? (
            <>
              <PropRow label="Temp. Média" value={`${weatherData.ambient_temp_avg.toFixed(1)}°C`} />
              <PropRow label="Fonte" value={weatherData.irradiation_source} />
              <PropRow label="Local" value={weatherData.location_name} />
            </>
          ) : (
            <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-center gap-2">
              <CloudOff size={12} className="text-amber-500/50 shrink-0" />
              <p className="text-[9px] text-amber-500/60">
                Dados climáticos não disponíveis. Configure a localização para obter dados automáticos.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

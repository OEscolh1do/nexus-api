/**
 * =============================================================================
 * RIGHT INSPECTOR — Motor Polimórfico (UX-001 Fase 3)
 * =============================================================================
 *
 * O coração da reintegração CRM no workspace.
 * Painel POLIMÓRFICO que metamorfoseia suas propriedades:
 *
 * - Se NADA selecionado → Exibe Contexto Comercial (CRM Técnico)
 *   Nome do cliente, clima, consumo, gráfico de barras dos últimos 12 meses.
 *
 * - Se MÓDULO selecionado → Exibe parâmetros do módulo
 *   Modelo, potência, azimute, inclinação, perdas.
 *
 * - Se INVERSOR selecionado → Exibe parâmetros do inversor
 *   Modelo, tensão, correntes, strings.
 *
 * Degradação Graciosa: Se a chamada M2M falhar, exibe aviso contido
 * no painel sem bloquear o Canvas central.
 *
 * =============================================================================
 */

import React, { useMemo } from 'react';
import {
  User, MapPin, BarChart3, Thermometer, Zap,
  Sun, Cpu, Cable, Info, CloudOff
} from 'lucide-react';
import type { SelectedEntity } from '../layout/WorkspaceLayout';
import { useSolarStore } from '@/core/state/solarStore';

// =============================================================================
// MONTHS
// =============================================================================

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// =============================================================================
// PROPS
// =============================================================================

interface RightInspectorProps {
  selectedEntity: SelectedEntity;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const RightInspector: React.FC<RightInspectorProps> = ({ selectedEntity }) => {
  return (
    <div className="h-full bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-3 py-2.5 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <Info size={12} className="text-slate-500" />
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Inspector
          </h3>
        </div>
      </div>

      {/* Content — Polymorphic rendering based on selection */}
      <div className="flex-1 overflow-y-auto">
        {selectedEntity.type === 'none' && <CommercialContextView />}
        {selectedEntity.type === 'module' && <ModuleInspector entity={selectedEntity} />}
        {selectedEntity.type === 'inverter' && <InverterInspector entity={selectedEntity} />}
        {selectedEntity.type === 'string' && <StringInspector entity={selectedEntity} />}
      </div>
    </div>
  );
};

// =============================================================================
// VIEW: CONTEXTO COMERCIAL (CRM TÉCNICO — quando nada selecionado)
// =============================================================================

const CommercialContextView: React.FC = () => {
  const clientData = useSolarStore(state => state.clientData);
  const weatherData = useSolarStore(state => state.weatherData);

  // Mock consumption data quando o store está vazio
  const monthlyConsumption = useMemo(() => {
    const invoices = clientData.invoices;
    if (invoices && invoices.length > 0 && invoices[0].monthlyHistory) {
      return invoices[0].monthlyHistory;
    }
    // Mock data for visual
    return [400, 420, 480, 500, 490, 410, 380, 390, 450, 520, 540, 480];
  }, [clientData.invoices]);

  const maxConsumption = Math.max(...monthlyConsumption, 1);
  const avgConsumption = Math.round(monthlyConsumption.reduce((a, b) => a + b, 0) / 12);

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

      {/* Consumption Chart (Mini) */}
      <section>
        <SectionHeader icon={<BarChart3 size={10} />} label="Perfil de Carga" />
        <div className="mt-2 bg-slate-900 rounded-lg border border-slate-800 p-3">
          {/* Bar chart */}
          <div className="flex items-end gap-0.5 h-16 mb-2">
            {monthlyConsumption.map((val, i) => {
              const height = (val / maxConsumption) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-emerald-600/50 to-emerald-400/50 rounded-t-sm hover:from-emerald-500 hover:to-emerald-300 transition-all cursor-default"
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={`${MONTHS[i]}: ${val} kWh`}
                />
              );
            })}
          </div>
          <div className="flex gap-0.5">
            {MONTHS.map(m => (
              <span key={m} className="flex-1 text-[7px] text-slate-600 text-center">{m}</span>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
            <span className="text-[9px] text-slate-500">Média mensal</span>
            <span className="text-xs font-bold text-emerald-400">{avgConsumption.toLocaleString('pt-BR')} kWh</span>
          </div>
        </div>
      </section>

      {/* Tariff */}
      <section>
        <SectionHeader icon={<Zap size={10} />} label="Tarifa" />
        <div className="mt-2">
          <PropRow label="R$/kWh" value={clientData.tariffRate ? `R$ ${clientData.tariffRate.toFixed(2)}` : '—'} accent />
        </div>
      </section>
    </div>
  );
};

// =============================================================================
// VIEW: MODULE INSPECTOR (quando um módulo FV está selecionado)
// =============================================================================

const ModuleInspector: React.FC<{ entity: SelectedEntity }> = ({ entity }) => {
  const modules = useSolarStore(state => state.modules);
  const engineering = useSolarStore(state => state.engineeringData);

  const primaryModule = modules[0];

  return (
    <div className="p-3 space-y-3">
      <div className="px-2 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-2 mb-2">
        <Sun size={12} className="text-emerald-400" />
        <span className="text-[10px] font-bold text-emerald-400 truncate">{entity.label}</span>
      </div>

      <section>
        <SectionHeader icon={<Sun size={10} />} label="Parâmetros do Módulo" />
        <div className="mt-2 space-y-1.5">
          <PropRow label="Fabricante" value={primaryModule?.manufacturer || '—'} />
          <PropRow label="Potência" value={primaryModule ? `${primaryModule.power}W` : '—'} />
          <PropRow label="Azimute" value={engineering?.azimuth != null ? `${engineering.azimuth}°` : '—'} />
          <PropRow label="Inclinação" value={engineering?.tilt != null ? `${engineering.tilt}°` : '—'} />
          <PropRow label="Orientação" value={engineering?.orientation || '—'} />
        </div>
      </section>

      <section>
        <SectionHeader icon={<Zap size={10} />} label="Perdas Estimadas" />
        <div className="mt-2 space-y-1.5">
          <PropRow label="Sujidade" value="2.0%" />
          <PropRow label="Temperatura" value="3.5%" />
          <PropRow label="Sombreamento" value="1.0%" />
        </div>
      </section>
    </div>
  );
};

// =============================================================================
// VIEW: INVERTER INSPECTOR (quando um inversor está selecionado)
// =============================================================================

const InverterInspector: React.FC<{ entity: SelectedEntity }> = ({ entity }) => {
  const inverters = useSolarStore(state => state.inverters);
  const primaryInverter = inverters[0];

  return (
    <div className="p-3 space-y-3">
      <div className="px-2 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/20 flex items-center gap-2 mb-2">
        <Cpu size={12} className="text-blue-400" />
        <span className="text-[10px] font-bold text-blue-400 truncate">{entity.label}</span>
      </div>

      <section>
        <SectionHeader icon={<Cpu size={10} />} label="Parâmetros do Inversor" />
        <div className="mt-2 space-y-1.5">
          <PropRow label="Fabricante" value={primaryInverter?.manufacturer || '—'} />
          <PropRow label="Potência" value={primaryInverter ? `${primaryInverter.power}W` : '—'} />
          <PropRow label="MPPT" value={primaryInverter?.mpptCount ? `${primaryInverter.mpptCount}` : '—'} />
          <PropRow label="Vmax MPPT" value={primaryInverter?.maxVoltage ? `${primaryInverter.maxVoltage}V` : '—'} />
        </div>
      </section>
    </div>
  );
};

// =============================================================================
// VIEW: STRING INSPECTOR (quando uma string está selecionada)
// =============================================================================

const StringInspector: React.FC<{ entity: SelectedEntity }> = ({ entity }) => (
  <div className="p-3 space-y-3">
    <div className="px-2 py-1.5 rounded-lg bg-purple-500/5 border border-purple-500/20 flex items-center gap-2 mb-2">
      <Cable size={12} className="text-purple-400" />
      <span className="text-[10px] font-bold text-purple-400 truncate">{entity.label}</span>
    </div>

    <section>
      <SectionHeader icon={<Cable size={10} />} label="Parâmetros da String" />
      <div className="mt-2 space-y-1.5">
        <PropRow label="Módulos" value="12" />
        <PropRow label="Tensão Total" value="—" />
        <PropRow label="Corrente" value="—" />
      </div>
    </section>
  </div>
);

// =============================================================================
// SHARED SUB-COMPONENTS
// =============================================================================

const SectionHeader: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-slate-600">{icon}</span>
    <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</h4>
  </div>
);

const PropRow: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/50">
    <span className="text-[10px] text-slate-500">{label}</span>
    <span className={`text-[10px] font-bold ${accent ? 'text-emerald-400' : 'text-slate-300'}`}>{value}</span>
  </div>
);

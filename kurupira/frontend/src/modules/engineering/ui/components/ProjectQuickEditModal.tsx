import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';
import { KurupiraClient } from '@/services/NexusClient';

interface ProjectQuickEditModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export const ProjectQuickEditModal: React.FC<ProjectQuickEditModalProps> = ({
  projectId,
  isOpen,
  onClose,
  onSaveSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [city, setCity] = useState('');
  const [stateUF, setStateUF] = useState('');
  const [consumption, setConsumption] = useState<number>(0);
  const [connectionType, setConnectionType] = useState('monofasico');

  // Payload original para patch
  const [rawDesignData, setRawDesignData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && projectId) {
      loadProjectData();
    }
  }, [isOpen, projectId]);

  const loadProjectData = async () => {
    setLoading(true);
    setError(null);
    try {
      const design = await KurupiraClient.designs.get(projectId);
      const dd = design.designData;
      setRawDesignData(dd);

      setProjectName(design.name || '');
      setClientName(design.leadContext?.name || dd?.solar?.clientData?.clientName || '');
      setCity(dd?.solar?.clientData?.city || design.leadContext?.city || '');
      setStateUF(dd?.solar?.clientData?.state || design.leadContext?.state || '');
      setConsumption(dd?.solar?.clientData?.averageConsumption || 0);
      setConnectionType(dd?.solar?.clientData?.connectionType || 'monofasico');
    } catch (err: any) {
      console.error(err);
      setError('Falha ao carregar os dados do projeto.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!rawDesignData) return;
    setSaving(true);
    setError(null);

    try {
      // Patching the designData specifically in the clientData space
      const updatedDesignData = { ...rawDesignData };
      if (!updatedDesignData.solar) updatedDesignData.solar = {};
      if (!updatedDesignData.solar.clientData) updatedDesignData.solar.clientData = {};

      updatedDesignData.solar.clientData = {
        ...updatedDesignData.solar.clientData,
        clientName,
        city,
        state: stateUF,
        averageConsumption: consumption,
        connectionType,
      };

      // Recalcular as invoices (faturas) usando média simples e distribuída (linear fallback default do Kurupira)
      let newInvoices = updatedDesignData.solar.clientData.invoices || [];
      if (newInvoices.length === 0) {
        newInvoices.push({
          id: 'default',
          name: 'Instalação Principal',
          installationNumber: '',
          concessionaire: '',
          rateGroup: 'B',
          connectionType: connectionType,
          voltage: '220',
          breakerCurrent: 50,
          monthlyHistory: Array(12).fill(consumption),
        });
      } else {
        newInvoices[0] = {
          ...newInvoices[0],
          connectionType,
          monthlyHistory: Array(12).fill(consumption),
        };
      }
      updatedDesignData.solar.clientData.invoices = newInvoices;

      await KurupiraClient.designs.update(projectId, {
        name: projectName,
        designData: updatedDesignData,
      });

      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Falha ao salvar as alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-800/50">
          <h2 className="text-sm font-bold text-white">Edição Rápida do Projeto</h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-xs font-semibold">Carregando contexto...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nome do Projeto (Interno)
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    value={stateUF}
                    maxLength={2}
                    onChange={(e) => setStateUF(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 justify-between items-center bg-slate-950/50 p-3 rounded-lg border border-slate-800/50 mt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Consumo (kWh/mês)
                  </label>
                  <input
                    type="number"
                    value={consumption}
                    onChange={(e) => setConsumption(Number(e.target.value))}
                    min={0}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Conexão Nominal
                  </label>
                  <select
                    value={connectionType}
                    onChange={(e) => setConnectionType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="monofasico">Monofásico</option>
                    <option value="bifasico">Bifásico</option>
                    <option value="trifasico">Trifásico</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving || loading}
            className="px-4 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(5,150,105,0.3)]"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Gravando...' : 'Gravar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};

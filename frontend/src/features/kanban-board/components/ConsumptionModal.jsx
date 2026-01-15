// /frontend/src/features/kanban-board/components/ConsumptionModal.jsx
import { useState, useEffect } from 'react';

function ConsumptionModal({ isOpen, onClose, onConfirm, initialData, average }) {
  // Estado para os 12 meses. Inicia com a média se não tiver dados.
  const [months, setMonths] = useState(Array(12).fill(''));

  useEffect(() => {
    if (isOpen) {
      if (initialData && initialData.length === 12) {
        setMonths(initialData);
      } else if (average) {
        // Se não tem histórico, preenche tudo com a média para facilitar
        setMonths(Array(12).fill(average));
      }
    }
  }, [isOpen, initialData, average]);

  if (!isOpen) return null;

  const handleChange = (index, value) => {
    const newMonths = [...months];
    newMonths[index] = value;
    setMonths(newMonths);
  };

  const handleConfirm = () => {
    // Converte tudo para número antes de enviar, garantindo que não vá string vazia
    const numericData = months.map(m => parseFloat(m) || 0);
    onConfirm(numericData);
    onClose();
  };

  const monthLabels = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-4">
      <div className="bg-neo-bg-main w-full max-w-2xl rounded-2xl border border-neo-green-main/50 shadow-2xl animate-scale-in overflow-hidden">
        
        <div className="bg-neo-surface-1 p-6 border-b border-neo-surface-2/30">
          <h3 className="text-xl font-bold text-neo-white flex items-center gap-2">
            <svg className="w-6 h-6 text-neo-green-main" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"></path></svg>
            Detalhamento de Consumo Mensal (kWh)
          </h3>
          <p className="text-neo-text-sec text-sm mt-1">Insira o consumo mês a mês para um gráfico preciso na proposta.</p>
        </div>

        <div className="p-6 grid grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {monthLabels.map((label, i) => (
            <div key={i}>
              <label className="text-[11px] text-neo-text-sec uppercase font-bold mb-1 block">{label}</label>
              <input
                type="number"
                value={months[i]}
                onChange={(e) => handleChange(i, e.target.value)}
                className="w-full bg-neo-surface-1 border border-neo-surface-2 rounded-lg px-3 py-2 text-neo-white focus:border-neo-green-main focus:ring-1 focus:ring-neo-green-main outline-none transition-all font-mono text-center"
                placeholder="0"
              />
            </div>
          ))}
        </div>

        <div className="bg-neo-surface-1 p-4 flex justify-end gap-3 border-t border-neo-surface-2/30">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-neo-text-sec hover:text-neo-white transition-colors">Cancelar</button>
          <button onClick={handleConfirm} className="px-6 py-2 rounded-lg bg-neo-green-main text-neo-bg-main font-bold hover:bg-neo-green-light transition-colors">
            Confirmar e Gerar PDF
          </button>
        </div>

      </div>
    </div>
  );
}

export default ConsumptionModal;
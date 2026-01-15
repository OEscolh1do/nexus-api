// /frontend/src/features/kanban-board/components/DraggableCard.jsx
import { User, Zap, Calendar, AlertTriangle, AlignLeft } from 'lucide-react';

function DraggableCard({ project, onClick, isDragging }) {
  
  // Estilos Base
  const baseClasses = `
    relative group rounded-lg mb-2 transition-all duration-200 ease-out
    select-none touch-none overflow-hidden cursor-grab active:cursor-grabbing
    border
    ${isDragging 
        ? 'bg-white dark:bg-neo-surface-2 shadow-2xl scale-105 z-50 rotate-2 border-neo-green-main ring-2 ring-neo-green-main/20' 
        : 'bg-white dark:bg-[#2D243A] border-gray-200 dark:border-neo-surface-2 hover:border-neo-purple-light dark:hover:border-neo-purple-light hover:shadow-lg hover:-translate-y-0.5'
    }
  `;

  // Formatação
  const formattedPrice = project.price 
      ? project.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) 
      : null;
  
  const dateObj = new Date(project.createdAt);
  const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;

  return (
    <div className={baseClasses} onClick={onClick}>
      
      {/* Barra Lateral (Status Line) - Roxo padrão, Verde no Hover */}
      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-neo-purple-main group-hover:bg-neo-green-main transition-colors duration-200 z-10"></div>
      
      {/* Conteúdo */}
      <div className="pl-3.5 p-2.5 flex flex-col gap-2 relative z-0">
            
            {/* 1. TOPO: Cliente (Limpo, sem fundo) */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                    <User size={11} className="text-gray-400 dark:text-neo-text-sec" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-neo-text-sec truncate max-w-[140px]">
                        {project.client?.name || 'Sem Cliente'}
                    </span>
                </div>
                {project.status === 'LEAD' && (
                    <div className="animate-pulse text-yellow-500" title="Status Antigo">
                        <AlertTriangle size={12} />
                    </div>
                )}
            </div>

            {/* 2. TÍTULO */}
            <h4 className="text-[13px] font-bold text-gray-800 dark:text-white leading-tight tracking-tight line-clamp-2">
                {project.title.replace('Projeto Lead - ', '')}
            </h4>

            {/* Divisor Sutil */}
            <div className="h-px w-full bg-gray-100 dark:bg-white/5"></div>

            {/* 3. RODAPÉ (LINHA ÚNICA: Potência | Valor | Data) */}
            <div className="flex items-center justify-between text-[10px]">
                
                {/* Esquerda: Potência (Sem fundo, texto verde) */}
                <div className="flex items-center gap-1 font-bold text-green-600 dark:text-neo-green-main w-1/3">
                    <Zap size={10} fill="currentColor" />
                    <span>{project.systemSize ? `${project.systemSize} kWp` : '--'}</span>
                </div>

                {/* Centro: Preço */}
                <div className="font-bold text-gray-700 dark:text-white text-center w-1/3">
                    {formattedPrice || '--'}
                </div>

                {/* Direita: Data */}
                <div className="flex items-center justify-end gap-1 text-gray-400 dark:text-neo-text-sec/50 font-mono w-1/3">
                    <Calendar size={9} />
                    {formattedDate}
                </div>

            </div>
      </div>
    </div>
  );
}

export default DraggableCard;
import React from 'react';
import { DenseCard } from '@/components/ui/dense-form';
import { useTechStore } from '../store/useTechStore';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface FDIDashboardProps {
    totalModulePowerW: number; // Watts
}

export const FDIDashboard: React.FC<FDIDashboardProps> = ({ totalModulePowerW }) => {
    // We get the ratio from the store selector we created
    const dcAcRatio = useTechStore(state => state.getDCACRatio(totalModulePowerW));
    const percentage = (dcAcRatio * 100);
    
    // Determine Status
    let status: 'optimum' | 'low' | 'high' = 'optimum';
    let color = 'text-green-500';
    let message = 'Dimensionamento Ideal';
    let Icon = CheckCircle2;

    if (percentage < 75) {
        status = 'low';
        color = 'text-yellow-500';
        message = 'Subdimensionado (ROI Baixo)';
        Icon = AlertTriangle;
    } else if (percentage > 130) {
        status = 'high';
        color = 'text-red-500';
        message = 'Sobrecarga (Clipping Provável)';
        Icon = Activity;
    }

    return (
        <DenseCard className="h-full flex flex-col justify-center relative overflow-hidden" colSpan={12}>
            {/* Background Glow based on status */}
            <div className={`absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-current opacity-5 pointer-events-none ${color}`} />

            <div className="flex items-center justify-between px-2">
                
                {/* Main Metric: FDI % */}
                <div className="flex flex-col">
                    <span className="text-xs uppercase text-slate-400 font-bold tracking-wider mb-1">Fator de Dimensionamento (FDI)</span>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-black ${color}`}>
                            {percentage.toFixed(1)}%
                        </span>
                        <span className="text-sm font-medium text-slate-500">
                            DC/AC
                        </span>
                    </div>
                </div>

                {/* Status Badge & Icon */}
                <div className="flex flex-col items-end text-right">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border ${status === 'high' ? 'border-red-200' : 'border-slate-200'}`}>
                        <Icon size={16} className={color} />
                        <span className={`text-xs font-bold ${color}`}>{message}</span>
                    </div>
                    
                    <div className="mt-2 text-[10px] text-slate-400 max-w-[150px]">
                        {status === 'optimum' && "O inversor está operando na faixa de máxima eficiência de conversão."}
                        {status === 'low' && "Sistema caro para a geração entregue. Considere inversores menores."}
                        {status === 'high' && "Verifique se o clipping anual compensa a economia no inversor."}
                    </div>
                </div>
            
            </div>
            
            {/* Progress Bar Visual */}
            <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                {/* Zones */}
                <div className="absolute left-[75%] w-[1px] h-full bg-white z-10" title="Min 75%" />
                <div className="absolute left-[120%] w-[1px] h-full bg-white z-10" title="Max 120%" />
                
                <div 
                    className={`h-full transition-all duration-500 ease-out ${
                        status === 'optimum' ? 'bg-green-500' : 
                        status === 'high' ? 'bg-red-500' : 'bg-yellow-400'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }} // Cap visual at 100% just for bar? No, maybe scale it.
                />
            </div>
        </DenseCard>
    );
};

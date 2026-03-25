import React from 'react';
import { DenseCard } from '@/components/ui/dense-form';
import { Camera, MapPin } from 'lucide-react';
import { useSolarStore, selectClientData } from '@/core/state/solarStore';

interface ViewportSnapshotCardProps {
    dataUrl: string | null;
}

export const ViewportSnapshotCard: React.FC<ViewportSnapshotCardProps> = ({ dataUrl }) => {
    const clientData = useSolarStore(selectClientData);

    return (
        <DenseCard className="w-full bg-white border-slate-200 p-0 overflow-hidden relative">
            <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg border border-slate-700">
                <MapPin size={14} className="text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                    {clientData.city || 'Local de Instalação'} 
                    {clientData.state ? ` - ${clientData.state}` : ''}
                </span>
            </div>
            
            <div className="w-full h-[400px] bg-slate-100 flex items-center justify-center relative">
                {dataUrl ? (
                    <img 
                        src={dataUrl} 
                        alt="Projeto 3D Top-Down" 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                        <Camera size={48} className="mb-2 opacity-50" />
                        <span className="text-sm font-medium">Imagem do Projeto de Engenharia não capturada</span>
                    </div>
                )}
            </div>
        </DenseCard>
    );
};

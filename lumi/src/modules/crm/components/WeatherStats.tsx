import React, { useEffect, useState } from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { DenseCard } from '@/components/ui/dense-form';
import { fetchCresesbHSP, CresesbResponse } from '@/services/cresesbService';
import { IrradiationCard } from './IrradiationCard';
import { TemperatureCard } from './TemperatureCard';

export const WeatherStats: React.FC = () => {
    // Acesso ao store global
    const clientData = useSolarStore(state => state.clientData);
    
    // Estado local para dados do serviço
    const [cresesbData, setCresesbData] = useState<CresesbResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Efeito para buscar dados sempre que a latitude mudar
    useEffect(() => {
        let isMounted = true;
        
        const loadData = async () => {
            // Se não tiver latitude válida, usar default ou não carregar
            // Aqui usamos um default seguro (-10) caso seja 0 para demonstração
            const lat = clientData.lat === 0 ? -10 : (clientData.lat || -10);
            const lng = clientData.lng || -40;

            setIsLoading(true);

            try {
                // Busca dinâmica baseda na latitude
                const data = await fetchCresesbHSP(lat, lng, 'N');
                
                if (isMounted) {
                    setCresesbData(data);
                }
            } catch (error) {
                console.error("Failed to load CRESESB data", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadData();

        return () => { isMounted = false; };
    }, [clientData.lat, clientData.lng]);

    return (
        <div className="w-full flex flex-col gap-4">
             {/* BLOCO 1: Irradiação Solar (HSP) */}
             <DenseCard className="w-full h-auto min-h-[220px] bg-white border-slate-100 relative overflow-hidden shadow-sm">
                <IrradiationCard 
                    monthly={cresesbData?.irradiation.monthly || []}
                    isLoading={isLoading}
                />
             </DenseCard>

             {/* BLOCO 2: Temperatura */}
             <DenseCard className="w-full h-40 bg-white border-slate-100 relative overflow-hidden shadow-sm">
                <TemperatureCard 
                    monthly={cresesbData?.temperature.monthly || []}
                    annualAverage={cresesbData?.temperature.annualAverage || 0}
                    min={cresesbData?.temperature.min || 0}
                    max={cresesbData?.temperature.max || 0}
                    isLoading={isLoading}
                />
             </DenseCard>
        </div>
    );
};

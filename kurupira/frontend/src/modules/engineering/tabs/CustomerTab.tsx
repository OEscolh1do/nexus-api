import React from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { InputForm } from '@/components/forms/InputForm';
import { InputData, WeatherAnalysis } from '@/core/types';

export const CustomerTab: React.FC = () => {
    const clientData = useSolarStore(state => state.clientData);
    const updateClientData = useSolarStore(state => state.updateClientData);
    const setWeatherData = useSolarStore(state => state.setWeatherData);

    const handleInputSubmit = (data: InputData, weather?: WeatherAnalysis) => {
        updateClientData(data);
        if (weather) {
            setWeatherData(weather);
        }
        // Feedback visual ou navegação automática opcional
        console.log("Dados do cliente atualizados:", data);
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Dados do Cliente & Localização</h2>
                    <p className="text-sm text-slate-500">
                        Preencha as informações básicas do cliente e localize o ponto de instalação no mapa para obter dados climáticos precisos.
                    </p>
                </div>

                <InputForm 
                    initialData={clientData} 
                    onSubmit={handleInputSubmit} 
                />
            </div>
        </div>
    );
};

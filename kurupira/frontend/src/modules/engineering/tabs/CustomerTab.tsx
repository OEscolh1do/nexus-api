import React from 'react';
import { useSolarStore } from '@/core/state/solarStore';
import { InputForm } from '@/components/forms/InputForm';
import { InputData, WeatherAnalysis } from '@/core/types';

interface Props {
  onConfirm?: () => void;
}

export const CustomerTab: React.FC<Props> = ({ onConfirm }) => {
    const clientData = useSolarStore(state => state.clientData);
    const updateClientData = useSolarStore(state => state.updateClientData);
    const setWeatherData = useSolarStore(state => state.setWeatherData);

    const handleInputSubmit = (data: InputData, weather?: WeatherAnalysis) => {
        updateClientData(data);
        if (weather) {
            setWeatherData(weather);
        }
        onConfirm?.();
    };

    return (
        <InputForm
            initialData={clientData}
            onSubmit={handleInputSubmit}
        />
    );
};

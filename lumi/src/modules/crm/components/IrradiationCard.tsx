import React, { useState, useEffect, useMemo } from 'react';
import { Sun, ExternalLink, ArrowDown, ArrowUp, Save, MapPin } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { Tooltip as ShadTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    calculateAnnualAverage,
    isValidIrradiationValue,
    SOLAR_SOURCES,
    getSavedCities,
    saveCity,
    CityPreset
} from '@/services/solarDataService';

interface IrradiationCardProps {
    monthly?: number[]; // Opcional, inicial
    onDataChange?: (monthly: number[], average: number) => void;
    isLoading?: boolean;
}

import { useSolarStore } from '@/core/state/solarStore';

export const IrradiationCard: React.FC<IrradiationCardProps> = ({
    monthly: initialMonthly = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    onDataChange,
    isLoading
}) => {
    // Acesso ao Store Global
    const setIrradiationData = useSolarStore(state => state.setIrradiationData);
    const persistedIrradiation = useSolarStore(state => state.clientData.monthlyIrradiation);
    const persistedCity = useSolarStore(state => state.clientData.irradiationCity);

    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

    // Estado local para dados e lista de cidades
    const [data, setData] = useState<number[]>(() => {
        // Prioridade 1: Dados já persistidos no Global Store (se válidos/não zerados)
        const hasPersisted = persistedIrradiation && persistedIrradiation.some(v => v > 0);
        if (hasPersisted) return persistedIrradiation!;

        // Prioridade 2: Props iniciais (Cache API)
        if (Array.isArray(initialMonthly) && initialMonthly.length === 12) return initialMonthly;

        return Array(12).fill(0);
    });

    const [savedCities, setSavedCities] = useState<CityPreset[]>([]);
    // Inicializa cidade selecionada do store se existir
    const [selectedCityId, setSelectedCityId] = useState<string>(() => {
        if (persistedCity) {
            // Tenta encontrar ID correspondente ao nome se possível, ou deixa vazio se for custom
            // Mas aqui armazenamos o NOME na store e ID no select. 
            // UX Simplification: Se tem nome salvo, tentamos achar nos presets depois.
            // Por enquanto iniciamos vazio e deixamos useEffect resolver ou mantemos vazio.
            return '';
        }
        return '';
    });

    // Carrega cidades salvas e tenta sincronizar seleção visual
    useEffect(() => {
        try {
            const cities = getSavedCities();
            const list = Array.isArray(cities) ? cities : [];
            setSavedCities(list);

            // Tenta restaurar seleção visual baseada no nome salvo no store
            if (persistedCity && !selectedCityId) {
                const match = list.find(c => c.name === persistedCity);
                if (match) setSelectedCityId(match.id);
            }
        } catch (e) {
            setSavedCities([]);
        }
    }, [persistedCity]);

    // Sincroniza se props mudarem externamente (ex: fetch do serviço)
    // Mas SÓ se o usuário não tiver selecionado um preset manual recentemente
    useEffect(() => {
        if (!selectedCityId && Array.isArray(initialMonthly) && initialMonthly.length === 12) {
            // Verifica se mudou de fato para evitar loops
            if (JSON.stringify(initialMonthly) !== JSON.stringify(data)) {
                setData(initialMonthly);
            }
        }
    }, [initialMonthly, selectedCityId]); // Removido 'data' da dependência se possível, mas aqui usamos para check. 
    // Na verdade, para evitar warning de deps, podemos usar ref ou manter. 
    // Melhor: comparar com data no setState funcional se necessário, ou confiar na prop.

    // Cálculos derivados (Blindados)
    const annualAverage = useMemo(() => calculateAnnualAverage(data || []), [data]);
    const min = Math.min(...(data || []));
    const max = Math.max(...(data || []));
    const chartData = useMemo(() => {
        const safeData = data || Array(12).fill(0);
        return safeData.map((val, i) => ({
            month: i,
            value: (typeof val === 'number' && !isNaN(val)) ? val : 0
        }));
    }, [data]);

    // Cores Gráfico
    const colors = {
        main: '#f97316', // orange-500
        dark: '#c2410c', // orange-700
    };

    const handleInputChange = (index: number, valueStr: string) => {
        // Ao editar, limpa a seleção de cidade pois virou "custom"
        if (selectedCityId) setSelectedCityId('');

        // Normaliza input (permite digitar "4,5" ou "4.5")
        const normalized = valueStr.replace(',', '.');
        const val = parseFloat(normalized);

        const newData = [...data];

        // Se for número válido, atribui. 
        // Se for string vazia (""), atribui 0 para evitar NaN no estado.
        // Se for inválido (texto), ignora ou trata.
        if (isValidIrradiationValue(val)) {
            newData[index] = val;
        } else if (valueStr === '') {
            newData[index] = 0;
        }

        setData(newData);

        // Persistência Global (Custom Mode)
        // Debounce idealmente, mas aqui faremos direto conforme requisito crítico
        setIrradiationData(newData, "Personalizado");

        if (onDataChange) {
            onDataChange(newData, calculateAnnualAverage(newData));
        }
    };

    const handleCitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedCityId(id);

        if (!id) return; // Selecionou "Custom" ou vazio

        const city = savedCities.find(c => c.id === id);
        if (city) {
            setData(city.data);

            // Persistência Global Imediata
            setIrradiationData(city.data, city.name);

            if (onDataChange) {
                onDataChange(city.data, calculateAnnualAverage(city.data));
            }
        }
    };

    const handleSaveCity = () => {
        // Validação básica
        if (annualAverage === 0) {
            alert("Preencha os dados de irradiação antes de salvar.");
            return;
        }

        const name = prompt("Nome da Cidade para Salvar:");
        if (name) {
            const newList = saveCity(name, data);
            setSavedCities(newList);
            // Seleciona a cidade recém criada (a última da lista)
            const newCity = newList[newList.length - 1];
            setSelectedCityId(newCity.id);
        }
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/90 text-white text-[10px] p-1.5 rounded shadow-xl border border-slate-700 backdrop-blur-sm z-50">
                    <p className="font-bold mb-0.5">{payload[0].value.toFixed(2)}</p>
                    <p className="text-slate-400 text-[9px] uppercase">Mês {months[payload[0].payload.month]}</p>
                </div>
            );
        }
        return null;
    };

    if (isLoading && !selectedCityId) {
        return (
            <div className="flex-1 flex items-center justify-center p-4 bg-orange-50/10">
                <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="h-6 w-16 bg-orange-200 rounded" />
                    <div className="h-32 w-full bg-orange-100 rounded" />
                </div>
            </div>
        );
    }

    return (
        <TooltipProvider delayDuration={200}>
            <div className="flex-1 flex flex-col min-w-0 relative group h-full bg-gradient-to-b from-orange-50/30 to-white">

                {/* Header com Seletor de Cidades */}
                <div className="px-3 pt-2 pb-2 flex flex-col gap-2 shrink-0 border-b border-orange-100/50 bg-orange-50/30">

                    {/* Linha 1: Título e Links Externos */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            <span className="text-orange-600"><Sun size={14} /></span>
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-orange-700">
                                Irradiação (HSP)
                            </h4>
                        </div>
                        <div className="flex gap-1">
                            <ShadTooltip>
                                <TooltipTrigger asChild>
                                    <a href={SOLAR_SOURCES.CRESESB.url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-medium text-orange-700 bg-white border border-orange-200 rounded hover:bg-orange-100 transition-colors">
                                        CRESESB <ExternalLink size={8} />
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">Consultar CRESESB</TooltipContent>
                            </ShadTooltip>
                            <ShadTooltip>
                                <TooltipTrigger asChild>
                                    <a href={SOLAR_SOURCES.INPE.url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors">
                                        INPE <ExternalLink size={8} />
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">Consultar INPE</TooltipContent>
                            </ShadTooltip>
                        </div>
                    </div>

                    {/* Linha 2: Seletor de Cidades */}
                    <div className="flex gap-1 w-full">
                        <div className="relative flex-1">
                            <MapPin size={10} className="absolute left-2 top-1.5 text-slate-400 pointer-events-none" />
                            <select
                                value={selectedCityId}
                                onChange={handleCitySelect}
                                className="w-full text-[10px] h-6 pl-5 pr-2 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-100 appearance-none cursor-pointer hover:bg-slate-50 transition-colors"
                            >
                                <option value="" className="text-slate-400">Personalizado / Manual</option>
                                <optgroup label="Cidades Salvas">
                                    {savedCities.map(city => (
                                        <option key={city.id} value={city.id}>{city.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        <ShadTooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleSaveCity}
                                    className="h-6 w-6 flex items-center justify-center bg-white border border-slate-200 text-slate-500 rounded hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
                                >
                                    <Save size={12} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">Salvar predefinição atual</TooltipContent>
                        </ShadTooltip>
                    </div>
                </div>

                {/* Main Stats Display */}
                <div className="px-3 py-1 flex justify-between items-end">
                    <div className="flex items-baseline gap-1">
                        <span className={cn(
                            "text-2xl font-black tracking-tight leading-none transition-all",
                            annualAverage > 0 ? "text-slate-800" : "text-slate-300"
                        )}>
                            {annualAverage > 0 ? annualAverage.toFixed(2) : '--'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">kWh/m²</span>
                    </div>

                    {/* Min/Max indicators */}
                    <div className="flex gap-2">
                        {annualAverage > 0 && (
                            <>
                                <div className="flex items-center gap-0.5 text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100/50" title="Pior Mês (Crítico)">
                                    <ArrowDown size={8} /> {min.toFixed(1)}
                                </div>
                                <div className="flex items-center gap-0.5 text-[9px] font-medium text-rose-600 bg-rose-50 px-1 rounded border border-rose-100/50" title="Melhor Mês">
                                    <ArrowUp size={8} /> {max.toFixed(1)}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Content Area: Chart + Manual Input Grid */}
                <div className="flex-1 flex flex-col justify-end min-h-[100px] w-full relative">

                    {/* Chart */}
                    <div className="w-full min-h-[50px] flex-1 opacity-60 mb-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.value === max ? colors.dark : colors.main} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Editable Grid */}
                    <div className="px-2 pb-2 pt-1 border-t border-dashed border-slate-200/50 bg-white/50 z-20">
                        <div className="grid grid-cols-6 gap-1">
                            {data.map((val, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <label className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter leading-none mb-0.5">
                                        {months[i]}
                                    </label>
                                    <input
                                        type="text"
                                        value={val === 0 ? '' : val.toFixed(2)} // Mostra formatado para facilitar leitura
                                        onChange={(e) => handleInputChange(i, e.target.value)}
                                        // Remove formatação ao focar para facilitar edição (mostrou-se melhor em testes de UX)
                                        onFocus={(e) => e.target.select()}
                                        placeholder="-"
                                        className={cn(
                                            "w-full h-5 text-center text-[10px] font-mono font-medium rounded border focus:outline-none focus:ring-1 focus:ring-orange-200 transition-colors",
                                            val === 0 ? "bg-slate-50 border-slate-100 text-slate-300" : "bg-white border-slate-200 text-slate-700",
                                            val === min && val > 0 ? "border-red-200 bg-red-50 text-red-700 font-bold" : "",
                                            val === max && val > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700 font-bold" : ""
                                        )}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};

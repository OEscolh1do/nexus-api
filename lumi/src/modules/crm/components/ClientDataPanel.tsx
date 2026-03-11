import React, { useState } from 'react';
import { User, MapPin, Search, Map as MapIcon, Phone, FileText, DownloadCloud } from 'lucide-react';
import { useSolarStore } from '@/core/state/solarStore';
import { NexusClient, NexusClientData } from '@/services/NexusClient';

export const ClientDataPanel: React.FC = () => {
    const clientData = useSolarStore(state => state.clientData);
    const updateClientData = useSolarStore(state => state.updateClientData);
    const [isSearchingCep, setIsSearchingCep] = useState(false);
    
    // Nexus Integration State
    const [nexusClients, setNexusClients] = useState<NexusClientData[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [showClientDropdown, setShowClientDropdown] = useState(false);

    const handleChange = (field: keyof typeof clientData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        updateClientData({ [field]: e.target.value });
    };

    const handleCepSearch = () => {
        setIsSearchingCep(true);
        setTimeout(() => setIsSearchingCep(false), 800);
    };

    const fetchNexusClients = async () => {
        try {
            setIsLoadingClients(true);
            const clients = await NexusClient.getClients();
            setNexusClients(clients);
            setShowClientDropdown(true);
        } catch (error) {
            console.error(error);
            alert("Erro ao buscar clientes do Nexus. Verifique se o backend local está rodando.");
        } finally {
            setIsLoadingClients(false);
        }
    };

    const handleSelectNexusClient = (client: NexusClientData) => {
        updateClientData({
            clientName: client.name,
            // You can map other fields here if the Nexus DB expands its Lead schema to include Address
        });
        setShowClientDropdown(false);
    };

    return (
        <div className="flex flex-col h-full bg-white/60 backdrop-blur-sm rounded-xl p-3 gap-3 border border-slate-100 shadow-sm relative overflow-visible">

            {/* 1. Identity Block (High Hierarchy) */}
            <div className="flex flex-col gap-2 pb-2 border-b border-slate-100">
                {/* Header Label */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <User size={12} strokeWidth={2.5} />
                        </div>
                        <label className="text-[10px] uppercase font-bold tracking-wider">Identidade do Cliente</label>
                    </div>
                    
                    {/* Botão de Integração Nexus */}
                    <button 
                        onClick={fetchNexusClients}
                        className="flex items-center gap-1.5 text-[9px] font-bold bg-neonorte-deepPurple text-white px-2 py-1 rounded hover:bg-neonorte-deepPurple/90 transition-colors"
                    >
                        {isLoadingClients ? <span className="animate-spin w-3 h-3 border-2 border-t-transparent border-white rounded-full"></span> : <DownloadCloud size={10} />}
                        IMPORTAR DO NEXUS
                    </button>
                </div>

                {/* Project Name Input (New field for custom project naming) */}
                <div className="pl-6 mb-2">
                    <input
                        className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-neonorte-purple/50 focus:ring-2 focus:ring-neonorte-purple/10 transition-all px-3 shadow-sm"
                        value={clientData.projectName || ''}
                        onChange={handleChange('projectName')}
                        placeholder="Nome da Oportunidade / Projeto (Opcional)"
                        title="Se vazio, o nome do cliente será usado como título do projeto."
                    />
                </div>

                {/* Main Name Input & Dropdown */}
                <div className="pl-8 relative">
                    <input
                        className="w-full h-8 bg-transparent text-sm font-bold text-slate-800 placeholder:text-slate-300 outline-none border-b border-transparent focus:border-neonorte-purple/30 transition-all p-0 focus:ring-0 leading-tight"
                        value={clientData.clientName}
                        onChange={handleChange('clientName')}
                        placeholder="Nome do Cliente ou Empresa"
                    />
                    
                    {/* Dropdown de Clientes Nexus */}
                    {showClientDropdown && nexusClients.length > 0 && (
                        <div className="absolute top-full left-8 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                            <div className="text-[10px] px-3 py-1.5 bg-slate-50 text-slate-500 font-bold border-b border-slate-100 flex justify-between">
                                <span>SELECIONE UM CLIENTE:</span>
                                <button onClick={() => setShowClientDropdown(false)} className="text-red-400 hover:text-red-600">Fechar</button>
                            </div>
                            {nexusClients.map(client => (
                                <div 
                                    key={client.id}
                                    onClick={() => handleSelectNexusClient(client)}
                                    className="p-2 border-b border-slate-100 hover:bg-neonorte-purple/5 cursor-pointer transition-colors"
                                >
                                    <p className="text-xs font-bold text-slate-800">{client.name}</p>
                                    <p className="text-[10px] text-slate-500">{client.company || 'Pessoa Física'} • {client.status}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Secondary Grid (CPF & Contact) - Fixed Overflow */}
                <div className="grid grid-cols-2 gap-3 pl-8 w-full">
                    <div className="relative group w-full min-w-0">
                        <FileText size={10} className="absolute top-1/2 -translate-y-1/2 left-0 text-slate-300 group-focus-within:text-neonorte-purple transition-colors shrink-0" />
                        <input
                            className="w-full h-7 pl-4 bg-transparent border-b border-slate-100 text-[11px] font-medium text-slate-600 focus:bg-slate-50 focus:border-neonorte-purple/50 outline-none transition-all placeholder:text-slate-300 truncate"
                            placeholder="CPF/CNPJ (Opcional)"
                            onChange={() => { }}
                        />
                    </div>
                    <div className="relative group w-full min-w-0">
                        <Phone size={10} className="absolute top-1/2 -translate-y-1/2 left-0 text-slate-300 group-focus-within:text-neonorte-purple transition-colors shrink-0" />
                        <input
                            className="w-full h-7 pl-4 bg-transparent border-b border-slate-100 text-[11px] font-medium text-slate-600 focus:bg-slate-50 focus:border-neonorte-purple/50 outline-none transition-all placeholder:text-slate-300 truncate"
                            placeholder="Telefone (Opcional)"
                            onChange={() => { }}
                        />
                    </div>
                </div>
            </div>

            {/* 2. Location Block (Dense Grid) */}
            <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                        <MapPin size={10} className="text-neonorte-green" />
                        Localização da Unidade
                    </h4>
                    {clientData.availableArea ? (
                        <span className="text-[9px] font-bold bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 flex items-center gap-1">
                            <MapIcon size={8} />
                            {clientData.availableArea} m²
                        </span>
                    ) : null}
                </div>

                {/* Grid Container */}
                <div className="grid grid-cols-12 gap-2">

                    {/* Row 1: CEP (7) + UF (5) */}
                    <div className="col-span-7 relative group">
                        <div className="absolute top-1/2 -translate-y-1/2 right-2 text-slate-400 cursor-pointer hover:text-neonorte-purple transition-colors" onClick={handleCepSearch}>
                            {isSearchingCep ? <span className="animate-spin text-neonorte-purple block w-3 h-3 border-2 border-t-transparent rounded-full" /> : <Search size={12} />}
                        </div>
                        <input
                            className="w-full h-8 px-2 bg-slate-50/50 border border-slate-200 rounded text-xs font-semibold text-slate-700 focus:bg-white focus:border-neonorte-purple/50 focus:ring-2 focus:ring-neonorte-purple/10 transition-all outline-none placeholder:text-slate-400"
                            placeholder="CEP"
                            value={clientData.zipCode}
                            onChange={handleChange('zipCode')}
                            onKeyDown={e => e.key === 'Enter' && handleCepSearch()}
                        />
                    </div>
                    <div className="col-span-5">
                        <input
                            className="w-full h-8 px-2 text-center bg-slate-50/50 border border-slate-200 rounded text-xs font-bold text-slate-700 uppercase focus:bg-white focus:border-neonorte-purple/50 focus:ring-2 focus:ring-neonorte-purple/10 transition-all outline-none placeholder:text-slate-400"
                            placeholder="UF"
                            maxLength={2}
                            value={clientData.state}
                            onChange={handleChange('state')}
                        />
                    </div>

                    {/* Row 2: City (Full) */}
                    <div className="col-span-12">
                        <input
                            className="w-full h-8 px-2 bg-slate-50/50 border border-slate-200 rounded text-xs font-semibold text-slate-700 focus:bg-white focus:border-neonorte-purple/50 focus:ring-2 focus:ring-neonorte-purple/10 transition-all outline-none placeholder:text-slate-400"
                            placeholder="Cidade"
                            value={clientData.city}
                            onChange={handleChange('city')}
                        />
                    </div>

                    {/* Row 3: Neighborhood (6) + Number (6) */}
                    <div className="col-span-6">
                        <input
                            className="w-full h-8 px-2 bg-slate-50/50 border border-slate-200 rounded text-xs font-medium text-slate-700 focus:bg-white focus:border-neonorte-purple/50 focus:ring-2 focus:ring-neonorte-purple/10 transition-all outline-none placeholder:text-slate-400"
                            placeholder="Bairro"
                            value={clientData.neighborhood}
                            onChange={handleChange('neighborhood')}
                        />
                    </div>
                    <div className="col-span-6 relative">
                        <input
                            className="w-full h-8 px-2 bg-slate-50/50 border border-slate-200 rounded text-xs font-medium text-slate-700 focus:bg-white focus:border-neonorte-purple/50 focus:ring-2 focus:ring-neonorte-purple/10 transition-all outline-none placeholder:text-slate-400"
                            placeholder="Número"
                            value={clientData.number}
                            onChange={handleChange('number')}
                        />
                    </div>

                    {/* Row 4: Street (Full) */}
                    <div className="col-span-12">
                        <input
                            className="w-full h-8 px-2 bg-slate-50/50 border border-slate-200 rounded text-xs font-medium text-slate-700 focus:bg-white focus:border-neonorte-purple/50 focus:ring-2 focus:ring-neonorte-purple/10 transition-all outline-none placeholder:text-slate-400"
                            placeholder="Logradouro (Rua, Av...)"
                            value={clientData.street}
                            onChange={handleChange('street')}
                        />
                    </div>

                </div>
            </div>

            {/* ID Footer */}
            <div className="mt-auto pt-2 grid grid-cols-2 gap-2 opacity-50">
                <div className="text-[8px] text-slate-400 font-mono">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</div>
            </div>

        </div>
    );
};

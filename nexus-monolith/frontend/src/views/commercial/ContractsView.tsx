import { useState, useEffect } from "react";
import { Building2, FileText, Plus, Search, MoreHorizontal, CalendarDays, DollarSign, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/mock-components";
import { useDebounce } from "@/hooks/useDebounce";
import { api } from "@/lib/api";
import clsx from "clsx";

interface Contract {
    id: string;
    title: string;
    value: number;
    startDate: string | null;
    endDate: string | null;
    status: string;
    vendor: { name: string };
    project: { title: string };
}

export function ContractsView() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 400);

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                const response = await api.get('/api/v2/commercial/contracts');
                if (response.data.success) {
                    setContracts(response.data.data);
                }
            } catch (err) {
                console.error("Erro ao puxar contratos", err);
            } finally {
                setLoading(false);
            }
        };
        fetchContracts();
    }, []);

    const filteredContracts = contracts.filter(c => {
        if (!debouncedSearchTerm) return true;
        const lowerSearch = debouncedSearchTerm.toLowerCase();
        return (
            c.title.toLowerCase().includes(lowerSearch) ||
            c.vendor.name.toLowerCase().includes(lowerSearch) ||
            c.project.title.toLowerCase().includes(lowerSearch) ||
            c.status.toLowerCase().includes(lowerSearch)
        );
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'DRAFT': return { label: 'Rascunho', cls: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200/80' };
            case 'ACTIVE': return { label: 'Vigente', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80' };
            case 'EXPIRED': return { label: 'Expirado', cls: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/80' };
            case 'COMPLETED': return { label: 'Concluído', cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/80' };
            default: return { label: status, cls: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200/80' };
        }
    };

    return (
        <div className="flex flex-col space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestão de Contratos</h1>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-full">
                            <FileText className="w-3 h-3 text-blue-500" />
                            <span className="text-[11px] font-bold text-blue-600">{contracts.length} contratos</span>
                        </div>
                    </div>
                    <p className="text-slate-500 text-[14px]">Administração de contratos comerciais e prestadores B2B</p>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-sm gap-2 rounded-lg">
                    <Plus size={16} /> Novo Contrato
                </Button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por título, fornecedor ou projeto..."
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 w-full transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden divide-y divide-slate-50">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="px-5 py-4 flex gap-6 animate-pulse">
                            <div className="h-5 w-1/4 bg-slate-100 rounded"></div>
                            <div className="h-5 w-1/5 bg-slate-100 rounded"></div>
                            <div className="h-5 w-1/6 bg-slate-100 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : filteredContracts.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200/60 p-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-slate-300" />
                        </div>
                        <div>
                            <h3 className="text-[15px] font-semibold text-slate-700">Nenhum contrato encontrado</h3>
                            <p className="text-[13px] text-slate-400 mt-1">Nenhum contrato corresponde aos filtros ou base vazia.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200/60 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[11px] text-slate-400 uppercase bg-slate-50/50 border-b border-slate-100 tracking-wider font-semibold">
                            <tr>
                                <th className="px-5 py-3">Contrato</th>
                                <th className="px-5 py-3">Prestador / Fornecedor</th>
                                <th className="px-5 py-3">Valor</th>
                                <th className="px-5 py-3">Período</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredContracts.map(contract => {
                                const config = getStatusConfig(contract.status);
                                return (
                                    <tr key={contract.id} className="hover:bg-blue-50/30 transition-colors duration-200 group">
                                        <td className="px-5 py-3.5">
                                            <p className="font-semibold text-[13px] text-slate-800">{contract.title}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">{contract.project.title}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                                                    <Building2 size={12} className="text-slate-400" />
                                                </div>
                                                <span className="text-[13px] text-slate-700 font-medium">{contract.vendor?.name || 'Não atribuído'}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1.5 font-semibold text-[13px] text-slate-800">
                                                <DollarSign size={13} className="text-slate-400" />
                                                {contract.value ? contract.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1.5 text-[12px] text-slate-600 font-mono">
                                                <CalendarDays size={13} className="text-slate-400" />
                                                {contract.startDate ? new Date(contract.startDate).toLocaleDateString('pt-BR') : '--'} a {contract.endDate ? new Date(contract.endDate).toLocaleDateString('pt-BR') : '--'}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider", config.cls)}>
                                                {config.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

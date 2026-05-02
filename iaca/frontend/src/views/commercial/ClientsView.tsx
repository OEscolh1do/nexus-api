import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Users, Plus, Search, MapPin, Edit, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/mock-components';
import { ClientDrawer } from '../../modules/commercial/ui/ClientDrawer';

interface Client {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    city: string | null;
    state: string | null;
    createdAt: string;
    status: string;
    engagementScore: number;
}

export function ClientsView() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const fetchClients = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/commercial/leads?status=CONVERTED');
            setClients(data.data || []);
        } catch (error) {
            console.error('Failed to fetch clients:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleOpenNew = () => { setSelectedClient(null); setIsDrawerOpen(true); };
    const handleOpenEdit = (client: Client) => { setSelectedClient(client); setIsDrawerOpen(true); };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Clientes</h1>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                            <Users className="w-3 h-3 text-blue-500" />
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{clients.length} ativos</span>
                        </div>
                    </div>
                    <p className="text-slate-500 text-[14px]">Gerenciamento da base de clientes ativos.</p>
                </div>
                <Button onClick={handleOpenNew} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white gap-2 flex items-center rounded-lg shadow-sm">
                    <Plus size={16} /> Novo Cliente
                </Button>
            </div>

            {/* Search Bar */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 p-3 rounded-xl">
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou e-mail..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 dark:focus:border-blue-500/50 dark:text-slate-200 placeholder:text-slate-400 transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <span className="text-[12px] font-semibold text-slate-400">{filteredClients.length} resultados</span>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="px-5 py-3">Nome</th>
                                <th className="px-5 py-3">Contato</th>
                                <th className="px-5 py-3">Localização</th>
                                <th className="px-5 py-3">Data Registro</th>
                                <th className="px-5 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-5 py-3.5"><div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                                        <td className="px-5 py-3.5"><div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                                        <td className="px-5 py-3.5"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                                        <td className="px-5 py-3.5"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                                        <td className="px-5 py-3.5"></td>
                                    </tr>
                                ))
                            ) : filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                                                <AlertCircle className="w-5 h-5 text-slate-300 dark:text-slate-500" />
                                            </div>
                                            <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400">Nenhum cliente encontrado.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map(client => (
                                    <tr key={client.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors duration-200 group">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-400">
                                                    {client.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                </div>
                                                <span className="font-semibold text-[13px] text-slate-800 dark:text-slate-200">{client.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] text-slate-700 dark:text-slate-300">{client.phone}</span>
                                                <span className="text-[11px] text-slate-400">{client.email || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 text-[13px]">
                                            {client.city ? (
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin size={13} className="text-slate-400" /> {client.city}/{client.state || ''}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="px-5 py-3.5 text-[13px] text-slate-500 font-mono">
                                            {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-opacity duration-200"
                                                onClick={() => handleOpenEdit(client)}
                                            >
                                                <Edit size={14} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ClientDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSuccess={fetchClients}
                client={selectedClient}
            />
        </div>
    );
}

export default ClientsView;

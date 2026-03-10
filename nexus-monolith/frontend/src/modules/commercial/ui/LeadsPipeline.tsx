import { useState, useEffect } from "react";
import { Button } from "@/components/ui/mock-components";
import { Plus, Search, Filter } from "lucide-react";
import axios from "axios";

import { ClientDrawer } from './ClientDrawer';

import { useDebounce } from '@/hooks/useDebounce';

import { Lead, LeadStatus } from '../types';

export function LeadsPipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/v2/commercial/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setLeads(response.data.data);
      }
    } catch (err) {
      setError("Erro ao carregar leads. Verifique a conexão.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleQualify = async (leadId: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/v2/commercial/leads/${leadId}`,
        { status: "QUALIFIED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchLeads(); // Refresh list after qualification
    } catch (err) {
      alert("Erro ao qualificar lead. Verifique o console.");
      console.error(err);
    }
  };

  const handleOpenNew = () => {
    setSelectedLead(null);
    setIsDrawerOpen(true);
  };

  const filteredLeads = leads.filter(l => {
    if (!debouncedSearchTerm) return true;
    const lowerSearch = debouncedSearchTerm.toLowerCase();
    return (
      l.name.toLowerCase().includes(lowerSearch) ||
      (l.phone && l.phone.includes(debouncedSearchTerm)) ||
      (l.email && l.email.toLowerCase().includes(lowerSearch))
    );
  });

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case "NEW": return "bg-blue-100 text-blue-800";
      case "CONTACTED": return "bg-yellow-100 text-yellow-800";
      case "QUALIFIED": return "bg-green-100 text-green-800";
      case "LOST": return "bg-red-100 text-red-800";
      case "CONVERTED": return "bg-purple-100 text-purple-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Triagem SDR (Leads)</h1>
        <Button onClick={handleOpenNew} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="mr-2 h-4 w-4" /> Cadastrar Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar pelo nome, email ou telefone..."
            className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm pl-10 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filtros Avançados</Button>
      </div>

      {/* SDR Triage Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando leads para triagem...</div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 border-b border-red-100">{error}</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Nenhum lead encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Lead / Empresa</th>
                  <th className="px-4 py-3">Contato</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Status SDR</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/25 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{lead.name}</div>
                      <div className="text-xs text-slate-400">Criado em {new Date(lead.createdAt).toLocaleDateString('pt-BR')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-600 dark:text-slate-400">{lead.phone}</div>
                      <div className="text-xs text-slate-400 truncate max-w-[150px]">{lead.email || "Sem e-mail"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${lead.engagementScore > 50 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'}`}>
                        {lead.engagementScore} pt
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {lead.source || "Geral"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {lead.status === 'NEW' || lead.status === 'CONTACTED' ? (
                        <Button
                          onClick={() => handleQualify(lead.id)}
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          Qualificar
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Qualificado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ClientDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={fetchLeads}
        client={selectedLead}
        defaultStatus="NEW"
        title="Cadastrar Novo Lead"
      />
    </div>
  );
}

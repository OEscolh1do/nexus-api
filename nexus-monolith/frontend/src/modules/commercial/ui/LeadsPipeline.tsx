import { useState, useEffect } from "react";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/mock-components";
import { Plus, Search, Filter } from "lucide-react";
import axios from "axios";

// Types derived from Backend Schema (Lead)
interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" | "CONVERTED";
  source: string;
  createdAt: string;
}

export function LeadsPipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW": return "bg-blue-100 text-blue-800";
      case "CONTACTED": return "bg-yellow-100 text-yellow-800";
      case "QUALIFIED": return "bg-green-100 text-green-800";
      case "LOST": return "bg-red-100 text-red-800";
      case "CONVERTED": return "bg-purple-100 text-purple-800";
      default: return "bg-slate-100";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold tracking-tight">Pipeline de Leads</h1>
         <Button onClick={() => window.location.href = "/commercial/quotes"}>
            <Plus className="mr-2 h-4 w-4" /> Novo Orçamento (Solar)
         </Button>
      </div>

      {/* Filters (Mock) */}
      <div className="flex space-x-2">
         <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
               type="text" 
               placeholder="Buscar leads..." 
               className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9"
            />
         </div>
         <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filtros</Button>
      </div>

      {/* Kanban Board (Simplified List for MVP) */}
      <div className="space-y-4">
         {loading ? (
             <p>Carregando pipeline...</p>
         ) : error ? (
             <div className="p-4 bg-red-50 text-red-600 rounded">{error}</div>
         ) : leads.length === 0 ? (
             <div className="p-12 text-center border-2 border-dashed rounded-lg text-slate-400">
                 Nenhum lead encontrado. Crie o primeiro!
             </div>
         ) : (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 {leads.map(lead => (
                     <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                         <CardHeader className="pb-2">
                             <div className="flex justify-between items-start">
                                 <CardTitle className="text-base">{lead.name}</CardTitle>
                                 <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(lead.status)}`}>
                                     {lead.status}
                                 </span>
                             </div>
                         </CardHeader>
                         <CardContent>
                             <div className="text-sm text-slate-500 space-y-1">
                                 <p>{lead.email || "Sem email"}</p>
                                 <p>{lead.phone}</p>
                                 <p className="text-xs pt-2 border-t mt-2">Origem: {lead.source}</p>
                             </div>
                         </CardContent>
                     </Card>
                 ))}
             </div>
         )}
      </div>
    </div>
  );
}

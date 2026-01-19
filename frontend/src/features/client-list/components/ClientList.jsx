// /frontend/src/features/client-list/components/ClientList.jsx
import { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import { 
    CheckCircle, 
    Plus, 
    Users, 
    Search, 
    Clock, 
    AlertCircle, 
    Trash2, 
    RefreshCw, 
    Mail,
    Folder
} from 'lucide-react';
import CreateLeadModal from './CreateLeadModal';
import ClientDetailModal from './ClientDetailModal';
import useAuthStore from '../../../store/useAuthStore';



function ClientList() {
  const { user } = useAuthStore();
  
  const [clients, setClients] = useState([]); // Lista direta de clientes
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClients = () => {
    setIsLoading(true);
    // BUSCA CLIENTES DIRETO
    api.get('/clients')
      .then(res => {
          // Processa os dados para facilitar a exibição
          console.log("DADOS RECEBIDOS DA API:", res.data);
          const processed = res.data.map(client => {
              const projects = client.projects || [];
              const latest = projects.length > 0 ? projects[0] : null;
              
              return {
                  ...client,
                  projectsCount: projects.length,
                  latestProject: latest,
                  // Se tiver projeto, usa a data do projeto. Se não, usa data de cadastro do cliente.
                  displayDate: latest ? latest.createdAt : client.createdAt
              };
          });
          
          // Reordena pela data de atividade mais recente
          setClients(processed.sort((a,b) => new Date(b.displayDate) - new Date(a.displayDate)));
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchClients(); }, []);

  const handleDelete = async (e, clientId) => {
      e.stopPropagation();
      if (!window.confirm("ATENÇÃO: Ao excluir o Cliente, TODOS os projetos dele também serão apagados. Deseja continuar?")) return;

      try {
          await api.delete(`/clients/${clientId}`);
          alert("Cliente e projetos excluídos com sucesso.");
          fetchClients();
      } catch (error) {
          console.error(error);
          alert(error.response?.data?.error || "Erro ao excluir cliente.");
      }
  };

  const filteredClients = clients.filter(c =>
    (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (c.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm)
  );

  const getDaysInfo = (dateString) => {
      const created = new Date(dateString);
      const now = new Date();
      created.setHours(0,0,0,0);
      now.setHours(0,0,0,0);
      const diffTime = Math.abs(now - created);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let label = `${diffDays}d`;
      if (diffDays === 0) label = 'Hoje';
      if (diffDays === 1) label = 'Ontem';

      let colorClass = 'text-neo-text-sec'; 
      if (diffDays === 0) colorClass = 'text-neo-green-main font-bold';
      if (diffDays > 30) colorClass = 'text-red-400 font-bold';

      return { label, colorClass };
  };

const handleOpenDetail = (client) => {
    // Passamos o CLIENTE inteiro. O modal agora sabe lidar com isso.
    setSelectedProjectForDetail(client); 
    setIsDetailModalOpen(true);
};

  if (isLoading) return <div className="p-8 text-neo-text-sec animate-pulse text-xs">Carregando lista...</div>;

  return (
    <div className="p-8 bg-neo-bg-main min-h-screen text-neo-white font-sans animate-fade-in-up">
      
      {/* CABEÇALHO PADRONIZADO */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div>
            <h1 className="text-xl font-bold text-neo-white flex items-center gap-2">
                <Users size={20} className="text-neo-purple-light" />
                Base de Clientes
            </h1>
            <p className="text-xs text-neo-text-sec mt-0.5 ml-7">Gerencie sua carteira de clientes.</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
                onClick={fetchClients} 
                className="p-1.5 bg-neo-surface-1 border border-neo-surface-2 rounded-lg text-neo-text-sec hover:text-white transition-all" 
                title="Atualizar"
            >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>

            <div className="relative group">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neo-text-sec w-3.5 h-3.5 group-focus-within:text-neo-purple-light transition-colors" />
                <input 
                    type="text" 
                    placeholder="Buscar cliente..." 
                    className="pl-8 pr-3 py-1.5 bg-neo-surface-1 border border-neo-surface-2 rounded-lg text-xs text-neo-white focus:border-neo-purple-light focus:ring-1 focus:ring-neo-purple-light/50 outline-none w-48 transition-all placeholder:text-neo-text-sec/50"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-neo-green-main hover:bg-neo-green-light text-neo-bg-main font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs shadow-md shadow-neo-green-main/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
                <Plus size={14} /> Novo Lead
            </button>
        </div>
      </div>

      {/* TABELA PADRONIZADA */}
      <div className="bg-neo-surface-1 rounded-xl border border-neo-surface-2/50 overflow-hidden shadow-xl backdrop-blur-sm">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-neo-text-sec uppercase bg-neo-surface-2/50 border-b border-neo-surface-2">
            <tr>
              <th className="px-4 py-3 font-bold">Cliente</th>
              <th className="px-4 py-3 font-bold">Contato</th>
              <th className="px-4 py-3 font-bold">Última Atividade</th>
              <th className="px-4 py-3 font-bold text-center">Tempo</th>
              <th className="px-4 py-3 font-bold text-center">Qtd. Projetos</th>
              <th className="px-4 py-3 font-bold text-center">Cadastro</th>
              <th className="px-4 py-3 font-bold text-right w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neo-surface-2/30">
            {filteredClients.map((client, index) => {
              const daysInfo = getDaysInfo(client.displayDate);
              const hasFullData = client.cpf_cnpj && client.city;
              const isMeAdmin = user?.role === 'ADMIN';

              return (
                <tr 
                  key={client.id} 
                  className="hover:bg-neo-surface-2/20 transition-all duration-200 cursor-pointer group hover:scale-[1.002] origin-left"
                  onClick={() => handleOpenDetail(client)}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Nome e Referência */}
                  <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-neo-white text-sm group-hover:text-neo-purple-light transition-colors">
                            {client.name}
                        </span>
                        <span className="text-[9px] text-neo-text-sec truncate max-w-[150px] opacity-70">
                            {client.latestProject 
                                ? `Ref: ${client.latestProject.title.replace('Projeto Lead - ', '')}`
                                : 'Sem projetos ativos'
                            }
                        </span>
                      </div>
                  </td>

                  {/* Contato */}
                  <td className="px-4 py-2.5 text-neo-text-sec text-xs">
                      <div className="flex items-center gap-1.5 opacity-80">
                         <Mail size={10} className="text-neo-purple-light"/> 
                         {client.email || client.phone || '-'}
                      </div>
                  </td>

                  {/* Data */}
                  <td className="px-4 py-2.5 text-neo-text-sec font-mono text-[10px] opacity-60">
                      {new Date(client.displayDate).toLocaleDateString('pt-BR')}
                  </td>

                  {/* Tempo */}
                  <td className="px-4 py-2.5 text-center">
                      <div className={`inline-flex items-center justify-center gap-1 text-[10px] ${daysInfo.colorClass}`}>
                          <Clock size={10} />
                          {daysInfo.label}
                      </div>
                  </td>

                  {/* QTD PROJETOS (Design Padronizado w-[110px]) */}
                  <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center justify-center gap-1.5 w-[110px] py-1 rounded-full text-[9px] font-bold uppercase tracking-wide border border-neo-purple-light/20 bg-neo-purple-light/10 text-neo-purple-light shadow-sm">
                          <Folder size={10} />
                          {client.projectsCount} {client.projectsCount === 1 ? 'Projeto' : 'Projetos'}
                      </span>
                  </td>

                  {/* STATUS CADASTRO (Design Padronizado w-[110px]) */}
                  <td className="px-4 py-2.5 text-center">
                      {hasFullData ? (
                          <span className="inline-flex items-center justify-center gap-1.5 w-[110px] py-1 rounded-full text-[9px] font-bold uppercase tracking-wide border bg-green-500/10 text-green-400 border-green-500/20 shadow-sm">
                              <CheckCircle size={10} /> Completo
                          </span>
                      ) : (
                          <span className="inline-flex items-center justify-center gap-1.5 w-[110px] py-1 rounded-full text-[9px] font-bold uppercase tracking-wide border bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-sm">
                              <AlertCircle size={10} /> Pendente
                          </span>
                      )}
                  </td>
                  
                  {/* Botão de Excluir */}
                  <td className="px-4 py-2.5 text-right">
                      {isMeAdmin && (
                          <button 
                              onClick={(e) => handleDelete(e, client.id)}
                              className="p-1.5 text-neo-text-sec/30 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                              title="Excluir Cliente (e todos projetos)"
                          >
                              <Trash2 size={14} />
                          </button>
                      )}
                  </td>
                </tr>
              );
            })}
            {filteredClients.length === 0 && !isLoading && (
              <tr><td colSpan="7" className="p-8 text-center text-xs text-neo-text-sec italic">Nenhum cliente encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isCreateModalOpen && <CreateLeadModal onClose={() => setIsCreateModalOpen(false)} onSuccess={fetchClients} />}
      
      {isDetailModalOpen && selectedProjectForDetail && (
          <ClientDetailModal 
            project={selectedProjectForDetail}
            onClose={() => setIsDetailModalOpen(false)}
            onSuccess={fetchClients}
          />
      )}
    </div>
  );
}

export default ClientList;
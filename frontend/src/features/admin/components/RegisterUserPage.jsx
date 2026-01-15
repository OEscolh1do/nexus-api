// /frontend/src/features/admin/components/RegisterUserPage.jsx
import { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import { UserPlus, Users, Search, ShieldAlert, Briefcase, Wrench, Mail, Calendar, RefreshCw, Trash2 } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';



const ROLE_MAP = {
    'ADMIN': { label: 'Admin', color: 'bg-red-500/10 text-red-400 border border-red-500/20', icon: ShieldAlert },
    'SALES': { label: 'Vendedor', color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', icon: Briefcase },
    'ENGINEER': { label: 'Engenheiro', color: 'bg-orange-500/10 text-orange-400 border border-orange-500/20', icon: Wrench }
};

function RegisterUserPage() {
  const { user: currentUser, token } = useAuthStore(state => state);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  const fetchUsers = async () => {
    setErrorMsg(null);
    setIsLoading(true);

    if (!token) { setIsLoading(false); return; }

    try {
      const res = await api.get('/auth/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      if (error.response?.status === 403) {
          setErrorMsg("Sessão expirada.");
      } else {
          setErrorMsg("Erro de conexão.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') fetchUsers();
    else setIsLoading(false);
  }, [currentUser, token]);

  const handleDelete = async (e, userId) => {
      e.stopPropagation();
      if (!window.confirm("Excluir este usuário permanentemente?")) return;

      try {
          await api.delete(`/auth/users/${userId}`);
          fetchUsers();
      } catch (error) {
          alert(error.response?.data?.error || "Erro ao excluir.");
      }
  };

  const handleRowClick = (user) => {
      setUserToEdit(user);
      setIsEditOpen(true);
  };

  if (currentUser?.role !== 'ADMIN') {
    return <div className="h-full flex items-center justify-center text-neo-text-sec opacity-50"><ShieldAlert size={48} /> Acesso Negado</div>;
  }

  const filteredUsers = users.filter(u => 
    (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-neo-bg-main min-h-screen text-neo-white font-sans animate-fade-in-up">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div>
            <h1 className="text-xl font-bold text-neo-white flex items-center gap-2">
                <Users size={20} className="text-neo-green-main"/>
                Gestão de Equipe
            </h1>
            <p className="text-xs text-neo-text-sec mt-0.5 ml-7">Controle de acesso e funções.</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
            <button onClick={fetchUsers} className="p-1.5 bg-neo-surface-1 border border-neo-surface-2 rounded-lg text-neo-text-sec hover:text-white transition-all" title="Atualizar">
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>

            <div className="relative group">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neo-text-sec w-3.5 h-3.5 group-focus-within:text-neo-purple-light transition-colors" />
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    className="pl-8 pr-3 py-1.5 bg-neo-surface-1 border border-neo-surface-2 rounded-lg text-xs text-neo-white focus:border-neo-purple-light focus:ring-1 focus:ring-neo-purple-light/50 outline-none w-48 transition-all placeholder:text-neo-text-sec/50"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <button 
                onClick={() => setIsCreateOpen(true)}
                className="bg-neo-green-main hover:bg-neo-green-light text-neo-bg-main font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs shadow-md shadow-neo-green-main/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
                <UserPlus size={14} /> Novo
            </button>
        </div>
      </div>

      {errorMsg && <div className="mb-4 text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">{errorMsg}</div>}

      {/* TABELA PADRONIZADA */}
      <div className="bg-neo-surface-1 rounded-xl border border-neo-surface-2/50 overflow-hidden shadow-xl backdrop-blur-sm">
        <table className="w-full text-left text-sm">
            <thead className="text-[10px] text-neo-text-sec uppercase bg-neo-surface-2/50 border-b border-neo-surface-2">
                <tr>
                    <th className="px-4 py-3 font-bold">Colaborador</th>
                    <th className="px-4 py-3 font-bold">Acesso</th>
                    <th className="px-4 py-3 font-bold text-center">Cargo</th>
                    <th className="px-4 py-3 font-bold text-center">Cadastro</th>
                    <th className="px-4 py-3 font-bold text-right w-10"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-neo-surface-2/30">
                {isLoading ? (
                    <tr><td colSpan="5" className="p-6 text-center text-xs text-neo-text-sec animate-pulse">Carregando...</td></tr>
                ) : filteredUsers.map((user, index) => {
                    const RoleIcon = ROLE_MAP[user.role]?.icon || Users;
                    const isMe = currentUser.id === user.id;
                    
                    return (
                        <tr 
                            key={user.id} 
                            onClick={() => handleRowClick(user)}
                            className="group cursor-pointer hover:bg-neo-surface-2/30 transition-all duration-200 hover:scale-[1.002] origin-left relative"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <td className="px-4 py-2.5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-neo-surface-2 border border-neo-surface-2 flex items-center justify-center text-neo-white font-bold text-xs overflow-hidden shrink-0 shadow-sm">
                                        {user.avatar ? (
                                            <img src={`${api.defaults.baseURL.replace('/api', '')}/${user.avatar}`} className="w-full h-full object-cover"/>
                                        ) : (
                                            (user.name || 'U').charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-neo-white text-sm group-hover:text-neo-purple-light transition-colors">{user.name}</span>
                                        {isMe && <span className="text-[9px] text-neo-green-main font-bold uppercase">Você</span>}
                                    </div>
                                </div>
                            </td>
                            
                            <td className="px-4 py-2.5 text-neo-text-sec text-xs">
                                <div className="flex items-center gap-1.5 opacity-80">
                                    <Mail size={10} className="text-neo-purple-light"/> {user.email}
                                </div>
                            </td>

                            {/* BADGE PADRONIZADA (Mesmo tamanho visual da lista de clientes) */}
                            <td className="px-4 py-2.5 text-center">
                                <div className={`inline-flex items-center justify-center w-[110px] py-1 gap-1.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${ROLE_MAP[user.role]?.color || 'bg-gray-500/10 text-gray-400'}`}>
                                    <RoleIcon size={10} />
                                    {ROLE_MAP[user.role]?.label}
                                </div>
                            </td>

                            <td className="px-4 py-2.5 text-center text-[10px] text-neo-text-sec font-mono opacity-60">
                                {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                            </td>

                            <td className="px-4 py-2.5 text-right">
                                {!isMe && (
                                    <button 
                                        onClick={(e) => handleDelete(e, user.id)}
                                        className="p-1.5 text-neo-text-sec/30 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                        title="Excluir Usuário"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </td>
                        </tr>
                    );
                })}
                {filteredUsers.length === 0 && !isLoading && <tr><td colSpan="5" className="p-8 text-center text-xs text-neo-text-sec italic">Nenhum usuário encontrado.</td></tr>}
            </tbody>
        </table>
      </div>

      {isCreateOpen && <CreateUserModal onClose={() => setIsCreateOpen(false)} onSuccess={fetchUsers} />}
      {isEditOpen && userToEdit && <EditUserModal user={userToEdit} onClose={() => setIsEditOpen(false)} onSuccess={fetchUsers} />}

    </div>
  );
}

export default RegisterUserPage;
// /frontend/src/components/Layout/Sidebar.jsx
import { useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  SunMedium, 
  UserPlus, 
  Package, 
  PieChart, 
  X
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore'; 
import logo from '../../assets/logo.png'; 

function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuthStore(); 
  const location = useLocation();

  useEffect(() => {
    const html = document.documentElement;
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || !savedTheme) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  useEffect(() => {
    if (window.innerWidth < 768 && onClose) {
       onClose();
    }
  }, [location.pathname]);
  
  const baseLinkStyle = "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all font-medium w-full text-left text-sm";
  
  const linkClass = ({ isActive }) => 
    `${baseLinkStyle} ${
      isActive 
        ? 'bg-neo-surface-2 text-neo-white border-l-4 border-neo-green-main' 
        : 'text-neo-text-sec hover:bg-neo-surface-1 hover:text-neo-white'
    }`;

  const isProfileActive = location.pathname === '/profile';

  return (
    <>
        {isOpen && (
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
                onClick={onClose}
            ></div>
        )}

        <aside className={`
            fixed md:static inset-y-0 left-0 z-40
            w-64 bg-neo-bg-main border-r border-neo-surface-2/50 h-screen 
            flex flex-col shrink-0 transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:shadow-none'}
        `}>
          
          <div className="p-4 md:p-6 flex items-center justify-between mb-2">
            <img src={logo} alt="NEXUS" className="h-7 md:h-9 w-auto object-contain" />
            <button 
                onClick={onClose} 
                className="md:hidden text-neo-text-sec hover:text-neo-white p-2 rounded-lg hover:bg-neo-surface-1"
            >
                <X size={24} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">

            <p className="px-4 py-2 text-[10px] uppercase font-bold text-neo-text-sec/50 mt-2">Visão Geral</p>

            {/* KANBAN (PRIORIDADE - AGORA EM CIMA) */}
            <NavLink to="/kanban" className={linkClass}>
              <LayoutDashboard size={18} />
              Quadro Kanban
            </NavLink>

            {/* DASHBOARD (ABAIXO) */}
            <NavLink to="/dashboard" className={linkClass}>
              <PieChart size={18} />
              Dashboard
            </NavLink>
            
            <NavLink to="/clients" className={linkClass}>
              <Users size={18} />
              Base de Clientes
            </NavLink>

            {/* SEÇÃO ADMIN (Só aparece se for ADMIN) */}
            {user?.role === 'ADMIN' && (
             <div className="pt-2 mt-2">
                <p className="px-4 py-2 text-[10px] uppercase font-bold text-neo-text-sec/50 mt-2">Administração</p>
                

                <NavLink to="/admin/users" className={linkClass}>
                    <UserPlus size={18} />
                    Gestão de Equipe
                </NavLink>
             </div>
           )}

           <div className="pt-4 mt-2 border-t border-neo-surface-2/30">
              <p className="px-4 text-[10px] font-bold text-neo-text-sec uppercase mb-2">Sistema</p>
              <button onClick={toggleTheme} className={`${baseLinkStyle} text-neo-text-sec hover:bg-neo-surface-1 hover:text-neo-white`}>
                <SunMedium size={18} /> 
                <span>Alternar Tema</span>
              </button>
           </div>

          </nav>

          {/* RODAPÉ DO USUÁRIO */}
          <div className="p-4 border-t border-neo-surface-2 mt-auto bg-neo-surface-1/10">
            <Link 
                to="/profile" 
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all group mb-2 ${
                    isProfileActive 
                    ? 'bg-neo-surface-2 shadow-inner' 
                    : 'hover:bg-neo-surface-1'
                }`}
            >
              <div className="w-9 h-9 rounded-full bg-neo-surface-2 flex items-center justify-center font-bold text-neo-white border border-neo-surface-2 overflow-hidden shrink-0">
                {user?.avatar ? (
                    <img src={`http://localhost:3001/${user.avatar}`} alt="Avatar" className="w-full h-full object-cover"/>
                ) : (
                    user?.name?.[0]?.toUpperCase() || <Users size={16}/>
                )}
              </div>
              
              <div className='flex-1 min-w-0'>
                <p className="text-sm font-bold text-neo-white truncate">
                    {user?.name || 'Usuário'}
                </p>
                <p className="text-[10px] text-neo-text-sec truncate uppercase tracking-wider">
                    {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'SALES' ? 'Vendedor' : 'Engenheiro'}
                </p>
              </div>
            </Link>
            
                {/*
            <button 
                onClick={logout} 
                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
            >
                <LogOut size={14} /> Sair
            </button>
            */}
          </div>
        </aside>
    </>
  );
}

export default Sidebar;


import React, { useEffect, useState } from 'react';
import type { OrgTreeDTO } from '../types';
import { AlertOctagon, CheckCircle2 } from 'lucide-react';

export const OrgTreeChart: React.FC = () => {
  const [treeData, setTreeData] = useState<OrgTreeDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const apiCall = async (url: string) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api${url}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
  };

  useEffect(() => {
    apiCall('/team/hierarchy').then(res => { // Endpoint assumes backend migration
      if (res.success && res.data) {
        setTreeData(res.data);
      } else {
          setTreeData([]);
      }
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const renderNode = (node: OrgTreeDTO) => {
    const isUnavailable = node.status === 'UNAVAILABLE';

    return (
      <div className="flex flex-col items-center mx-4" key={node.id}>
        {/* Card */}
        <div className={`
            relative p-3.5 rounded-xl border shadow-sm w-48 transition-all flex flex-col items-center text-center z-10
            ${isUnavailable 
                ? 'bg-slate-50/80 dark:bg-slate-900/50 border-rose-200/50 dark:border-rose-900/40 opacity-80' 
                : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-500/50'}
        `}>
            {/* Status Indicator */}
            <div className={`absolute -top-2 -right-2 rounded-full p-1 border shadow-sm bg-white dark:bg-slate-800 ${isUnavailable ? 'text-rose-500 border-rose-200 dark:border-rose-800' : 'text-emerald-500 border-emerald-200 dark:border-emerald-800'}`}>
               {isUnavailable ? <AlertOctagon size={13} /> : <CheckCircle2 size={13} />}
            </div>

            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-bold mb-2 ${isUnavailable ? 'bg-slate-100 border border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700' : 'bg-gradient-to-br from-purple-100 to-indigo-50 border border-purple-200/50 text-purple-700 dark:from-purple-900/30 dark:to-indigo-900/30 dark:border-purple-500/20 dark:text-purple-300'} shadow-inner`}>
                {node.user.fullName.substring(0, 2).toUpperCase()}
            </div>
            
            <h4 className={`text-[13px] font-semibold tracking-tight leading-tight ${isUnavailable ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                {node.user.fullName}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase truncate max-w-full tracking-wider font-medium">
                {node.user.jobTitle}
            </p>
        </div>

        {/* Children (Recursion) */}
        {node.children && node.children.length > 0 && (
          <>
             {/* Connector Vertical Line from Parent to Children Bar */}
             <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
             
             {/* Children Container */}
             <div className="flex relative">
                {/* Horizontal Bar connecting all children */}
                {node.children.length > 1 && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-slate-200 dark:bg-slate-700 w-[calc(100%-12rem)]" />
                )}
                
                {node.children.map((child) => (
                    <div key={child.id} className="flex flex-col items-center relative">
                        {/* Connector from Horizontal Bar to Child */}
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                        {renderNode(child)}
                    </div>
                ))}
             </div>
          </>
        )}
      </div>
    );
  };

  if (isLoading) return <div className="p-12 text-center text-slate-400">Carregando estrutura...</div>;

  return (
    <div className="overflow-auto p-12 flex justify-center min-h-[500px] bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 custom-scrollbar relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="flex gap-8 z-10">
        {treeData.map(root => renderNode(root))}
      </div>
    </div>
  );
};

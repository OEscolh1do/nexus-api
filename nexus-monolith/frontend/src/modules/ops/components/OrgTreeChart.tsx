
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
            relative p-3 rounded-lg border shadow-sm w-48 transition-all flex flex-col items-center text-center z-10
            ${isUnavailable 
                ? 'bg-slate-100 dark:bg-slate-900/50 border-red-200 dark:border-red-900/50 opacity-80' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300'}
        `}>
            {/* Status Indicator */}
            <div className={`absolute -top-2 -right-2 rounded-full p-1 border bg-white dark:bg-slate-800 ${isUnavailable ? 'text-red-500 border-red-200' : 'text-emerald-500 border-emerald-200'}`}>
               {isUnavailable ? <AlertOctagon size={14} /> : <CheckCircle2 size={14} />}
            </div>

            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 ${isUnavailable ? 'bg-slate-200 text-slate-500' : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'}`}>
                {node.user.fullName.substring(0, 2).toUpperCase()}
            </div>
            
            <h4 className={`text-xs font-bold leading-tight ${isUnavailable ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                {node.user.fullName}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 uppercase truncate max-w-full">
                {node.user.jobTitle}
            </p>
        </div>

        {/* Children (Recursion) */}
        {node.children && node.children.length > 0 && (
          <>
             {/* Connector Vertical Line from Parent to Children Bar */}
             <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>
             
             {/* Children Container */}
             <div className="flex relative">
                {/* Horizontal Bar connecting all children */}
                {node.children.length > 1 && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-slate-300 dark:bg-slate-600 w-[calc(100%-12rem)]" />
                )}
                
                {node.children.map((child) => (
                    <div key={child.id} className="flex flex-col items-center relative">
                        {/* Connector from Horizontal Bar to Child */}
                        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>
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
    <div className="overflow-auto p-8 flex justify-center min-h-[500px] bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 custom-scrollbar">
      <div className="flex gap-8">
        {treeData.map(root => renderNode(root))}
      </div>
    </div>
  );
};

import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface EnvInspectorProps {
  envs: { name: string; present: boolean }[];
}

export default function EnvInspector({ envs }: EnvInspectorProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
      <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-800">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Variáveis de Ambiente Críticas</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-800">
        {envs.map((env) => (
          <div key={env.name} className="flex items-center justify-between p-3 bg-slate-900">
            <span className="text-[11px] font-mono text-slate-400">{env.name}</span>
            {env.present ? (
              <div className="flex items-center gap-1 text-emerald-500">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold">OK</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-500">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold">AUSENTE</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

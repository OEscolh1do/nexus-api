import { usePermissions, type Permission } from '@/hooks/usePermissions';
import { ShieldAlert, Check } from 'lucide-react';

interface RoleBuilderMatrixProps {
  selectedPermissionIds: string[];
  onChange: (newIds: string[]) => void;
}

export default function RoleBuilderMatrix({ selectedPermissionIds, onChange }: RoleBuilderMatrixProps) {
  const { groupedPermissions, loading, error } = usePermissions();

  if (loading) {
    return <div className="animate-pulse h-32 bg-slate-800 rounded-sm"></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border border-red-900/50 bg-red-900/10 rounded-sm">
        <ShieldAlert className="h-6 w-6 text-red-500 mb-2" />
        <p className="text-xs text-red-400">Erro ao carregar permissões: {error}</p>
      </div>
    );
  }

  const handleToggle = (permissionId: string) => {
    if (selectedPermissionIds.includes(permissionId)) {
      onChange(selectedPermissionIds.filter(id => id !== permissionId));
    } else {
      onChange([...selectedPermissionIds, permissionId]);
    }
  };

  const handleToggleGroup = (permissions: Permission[]) => {
    const allSelected = permissions.every(p => selectedPermissionIds.includes(p.id));
    
    if (allSelected) {
      // Remove all in this group
      const groupIds = permissions.map(p => p.id);
      onChange(selectedPermissionIds.filter(id => !groupIds.includes(id)));
    } else {
      // Add all missing in this group
      const newIds = new Set(selectedPermissionIds);
      permissions.forEach(p => newIds.add(p.id));
      onChange(Array.from(newIds));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(groupedPermissions).map(([moduleName, permissions]) => {
        // Mapear actions (read, write, delete, manage, etc)
        // Isso ajuda a ordenar visualmente se necessário. No momento renderizamos como vêm
        
        const allSelected = (permissions as Permission[]).every((p: Permission) => selectedPermissionIds.includes(p.id));

        return (
          <div key={moduleName} className="flex flex-col rounded-sm border border-slate-800 overflow-hidden bg-slate-900/50">
            <div className="flex items-center justify-between bg-slate-800/80 px-4 py-2 border-b border-slate-800">
              <h4 className="text-xs font-semibold text-slate-200 capitalize tracking-wide">
                Módulo: {moduleName}
              </h4>
              <button
                type="button"
                onClick={() => handleToggleGroup(permissions as Permission[])}
                className="text-[10px] uppercase font-bold tracking-wider text-sky-400 hover:text-sky-300 transition-colors"
              >
                {allSelected ? 'Desmarcar Todos' : 'Marcar Todos'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-slate-800">
              {(permissions as Permission[]).map((p: Permission) => {
                const isSelected = selectedPermissionIds.includes(p.id);
                // Extrair a action do slug, ex: "catalog:write" -> "write"
                const action = p.slug.split(':')[1] || p.slug;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleToggle(p.id)}
                    className={`flex items-center gap-3 p-3 bg-slate-900 text-left transition-colors hover:bg-slate-800 focus:outline-none ${
                      isSelected ? 'bg-sky-500/5' : ''
                    }`}
                  >
                    <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-sm border transition-colors ${
                      isSelected 
                        ? 'border-sky-500 bg-sky-500 text-slate-950' 
                        : 'border-slate-600 bg-slate-800 text-transparent'
                    }`}>
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[11px] font-medium uppercase tracking-wide ${isSelected ? 'text-sky-400' : 'text-slate-400'}`}>
                        {action}
                      </span>
                      {p.description && (
                        <span className="text-[9px] text-slate-600 leading-tight mt-0.5">
                          {p.description}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

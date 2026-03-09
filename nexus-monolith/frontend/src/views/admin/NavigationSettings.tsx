import { useState, useEffect, useCallback } from "react";
import { fetchNavigation, updateNavigation } from "@/lib/navigation";
// import { Button } from "@/components/ui/mock-components"; // Unused
import type { NavigationGroup } from "@/types/navigation";
import { Save, AlertTriangle, Plus, Trash } from "lucide-react";

const MODULES = ["OPS", "COMMERCIAL", "EXECUTIVE"];

export default function NavigationSettings() {
  const [selectedModule, setSelectedModule] = useState("OPS");
  const [groups, setGroups] = useState<NavigationGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadNavigation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNavigation(selectedModule);
      setGroups(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Falha ao carregar");
      } else {
        setError("Erro desconhecido");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedModule]);

  useEffect(() => {
    loadNavigation();
  }, [loadNavigation]);

  async function handleSave() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await updateNavigation(selectedModule, groups);
      setSuccess("Navegação atualizada com sucesso!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Falha ao salvar");
      } else {
        setError("Erro desconhecido");
      }
    } finally {
      setLoading(false);
    }
  }

  const handleGroupChange = (index: number, field: keyof NavigationGroup, value: string | number) => {
    const newGroups = [...groups];
    newGroups[index] = { ...newGroups[index], [field]: value };
    setGroups(newGroups);
  };

  const handleItemChange = (gIndex: number, iIndex: number, field: string, value: string | number) => {
    const newGroups = [...groups];
    newGroups[gIndex].items[iIndex] = { ...newGroups[gIndex].items[iIndex], [field]: value };
    setGroups(newGroups);
  };

  // Simple add/remove logic
  const addGroup = () => {
    setGroups([...groups, {
      title: "Novo Grupo",
      order: groups.length + 1,
      items: []
    }]);
  };

  const removeGroup = (index: number) => {
    if (!confirm("Excluir grupo e todos os itens?")) return;
    const newGroups = groups.filter((_, i) => i !== index);
    setGroups(newGroups);
  };

  const addItem = (gIndex: number) => {
    const newGroups = [...groups];
    newGroups[gIndex].items.push({
      label: "Novo Item",
      path: "/path",
      icon: "Target",
      order: newGroups[gIndex].items.length + 1
    });
    setGroups(newGroups);
  };

  const removeItem = (gIndex: number, iIndex: number) => {
    const newGroups = [...groups];
    newGroups[gIndex].items = newGroups[gIndex].items.filter((_, i) => i !== iIndex);
    setGroups(newGroups);
  };


  return (
    <div className="p-8 max-w-5xl mx-auto bg-slate-50 min-h-screen">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gerenciador de Navegação</h1>
          <p className="text-slate-500">Personalize os menus dos módulos</p>
        </div>
        <div className="flex gap-2">
          {MODULES.map(m => (
            <button
              key={m}
              onClick={() => setSelectedModule(m)}
              className={`px-4 py-2 rounded font-medium ${selectedModule === m ? 'bg-orange-600 text-white' : 'bg-white text-slate-600 border'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded mb-4 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-800 p-4 rounded mb-4">
          {success}
        </div>
      )}

      {loading && <p>Carregando...</p>}

      <div className="space-y-6">
        {groups.sort((a, b) => a.order - b.order).map((group, gIndex) => (
          <div key={gIndex} className="bg-white p-6 rounded shadow border border-slate-200">
            <div className="flex gap-4 mb-4 items-center bg-slate-50 p-3 rounded">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Título do Grupo</label>
                <input
                  value={group.title}
                  onChange={e => handleGroupChange(gIndex, 'title', e.target.value)}
                  className="w-full border p-1 rounded"
                />
              </div>
              <div className="w-20">
                <label className="text-xs font-bold text-slate-500 uppercase">Ordem</label>
                <input
                  type="number"
                  value={group.order}
                  onChange={e => handleGroupChange(gIndex, 'order', parseInt(e.target.value))}
                  className="w-full border p-1 rounded"
                />
              </div>
              <div className="pt-4">
                <button onClick={() => removeGroup(gIndex)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                  <Trash size={16} />
                </button>
              </div>
            </div>

            <div className="pl-6 border-l-2 border-slate-100 space-y-3">
              {group.items.sort((a, b) => a.order - b.order).map((item, iIndex) => (
                <div key={iIndex} className="flex gap-3 items-center">
                  <input
                    value={item.label}
                    placeholder="Rótulo"
                    onChange={e => handleItemChange(gIndex, iIndex, 'label', e.target.value)}
                    className="border p-1 rounded flex-1"
                  />
                  <input
                    value={item.path}
                    placeholder="Caminho"
                    onChange={e => handleItemChange(gIndex, iIndex, 'path', e.target.value)}
                    className="border p-1 rounded flex-1"
                  />
                  <input
                    value={item.icon}
                    placeholder="Ícone (Lucide)"
                    onChange={e => handleItemChange(gIndex, iIndex, 'icon', e.target.value)}
                    className="border p-1 rounded w-32"
                  />
                  <input
                    type="number"
                    value={item.order}
                    onChange={e => handleItemChange(gIndex, iIndex, 'order', parseInt(e.target.value))}
                    className="border p-1 rounded w-16"
                  />
                  <button onClick={() => removeItem(gIndex, iIndex)} className="text-red-400">
                    <Trash size={14} />
                  </button>
                </div>
              ))}
              <button onClick={() => addItem(gIndex)} className="text-sm text-blue-600 flex items-center gap-1 mt-2">
                <Plus size={14} /> Adicionar Item
              </button>
            </div>
          </div>
        ))}

        <button onClick={addGroup} className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 rounded hover:bg-slate-50 font-medium">
          + Adicionar Grupo
        </button>
      </div>

      <div className="sticky bottom-4 mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded shadow-lg hover:bg-slate-800 disabled:opacity-50"
        >
          <Save size={18} /> Salvar Alterações
        </button>
      </div>

    </div>
  );
}

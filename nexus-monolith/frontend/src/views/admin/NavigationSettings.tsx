import { useState, useEffect, useCallback } from "react";
import { fetchNavigation, updateNavigation } from "@/lib/navigation";
import type { NavigationGroup } from "@/types/navigation";
import { Save, AlertTriangle, Plus, Trash, Settings, CheckCircle2, GripVertical } from "lucide-react";
import clsx from "clsx";

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
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [selectedModule]);

  useEffect(() => { loadNavigation(); }, [loadNavigation]);

  async function handleSave() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await updateNavigation(selectedModule, groups);
      setSuccess("Navegação atualizada com sucesso!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
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

  const addGroup = () => {
    setGroups([...groups, { title: "Novo Grupo", order: groups.length + 1, items: [] }]);
  };

  const removeGroup = (index: number) => {
    if (!confirm("Excluir grupo e todos os itens?")) return;
    setGroups(groups.filter((_, i) => i !== index));
  };

  const addItem = (gIndex: number) => {
    const newGroups = [...groups];
    newGroups[gIndex].items.push({ label: "Novo Item", path: "/path", icon: "Target", order: newGroups[gIndex].items.length + 1 });
    setGroups(newGroups);
  };

  const removeItem = (gIndex: number, iIndex: number) => {
    const newGroups = [...groups];
    newGroups[gIndex].items = newGroups[gIndex].items.filter((_, i) => i !== iIndex);
    setGroups(newGroups);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Gerenciador de Navegação</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
              <Settings className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">Editor</span>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[14px]">Personalize os menus dos módulos</p>
        </div>
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
          {MODULES.map(m => (
            <button
              key={m}
              onClick={() => setSelectedModule(m)}
              className={clsx(
                "px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200",
                selectedModule === m
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200/80 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-xl flex items-center gap-2.5 text-[13px] font-medium">
          <AlertTriangle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center gap-2.5 text-[13px] font-medium">
          <CheckCircle2 size={16} className="shrink-0" /> {success}
        </div>
      )}

      {loading && (
        <div className="space-y-4 mb-4">
          {[1, 2].map(i => <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 animate-pulse"></div>)}
        </div>
      )}

      <div className="space-y-5">
        {groups.sort((a, b) => a.order - b.order).map((group, gIndex) => (
          <div key={gIndex} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 overflow-hidden">
            {/* Group header */}
            <div className="flex gap-4 items-center bg-slate-50/80 dark:bg-slate-800/50 p-4 border-b border-slate-100 dark:border-slate-800">
              <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 cursor-grab" />
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Título do Grupo</label>
                <input
                  value={group.title}
                  onChange={e => handleGroupChange(gIndex, 'title', e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-[13px] mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 dark:focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="w-20">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ordem</label>
                <input
                  type="number"
                  value={group.order}
                  onChange={e => handleGroupChange(gIndex, 'order', parseInt(e.target.value))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 text-[13px] mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 dark:focus:border-indigo-500 transition-all"
                />
              </div>
              <button onClick={() => removeGroup(gIndex)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 p-2 rounded-lg transition-all duration-200 mt-4">
                <Trash size={14} />
              </button>
            </div>

            {/* Items */}
            <div className="p-4 pl-8 border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-2">
              {group.items.sort((a, b) => a.order - b.order).map((item, iIndex) => (
                <div key={iIndex} className="flex gap-2.5 items-center group">
                  <input
                    value={item.label}
                    placeholder="Rótulo"
                    onChange={e => handleItemChange(gIndex, iIndex, 'label', e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 flex-1 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 dark:focus:border-indigo-500 transition-all"
                  />
                  <input
                    value={item.path}
                    placeholder="Caminho"
                    onChange={e => handleItemChange(gIndex, iIndex, 'path', e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 flex-1 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 dark:focus:border-indigo-500 transition-all"
                  />
                  <input
                    value={item.icon}
                    placeholder="Ícone (Lucide)"
                    onChange={e => handleItemChange(gIndex, iIndex, 'icon', e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 w-28 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 dark:focus:border-indigo-500 transition-all"
                  />
                  <input
                    type="number"
                    value={item.order}
                    onChange={e => handleItemChange(gIndex, iIndex, 'order', parseInt(e.target.value))}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-1.5 w-14 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 dark:focus:border-indigo-500 transition-all"
                  />
                  <button onClick={() => removeItem(gIndex, iIndex)} className="text-slate-300 dark:text-slate-600 hover:text-rose-500 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                    <Trash size={13} />
                  </button>
                </div>
              ))}
              <button onClick={() => addItem(gIndex)} className="text-[12px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 mt-2 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 py-1 rounded-lg transition-all">
                <Plus size={13} /> Adicionar Item
              </button>
            </div>
          </div>
        ))}

        <button onClick={addGroup} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-500 dark:hover:text-slate-400 font-medium text-[13px] transition-all duration-200">
          + Adicionar Grupo
        </button>
      </div>

      <div className="sticky bottom-4 mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-slate-900 hover:to-slate-950 disabled:opacity-50 text-[13px] font-semibold transition-all duration-200"
        >
          <Save size={16} /> Salvar Alterações
        </button>
      </div>
    </div>
  );
}

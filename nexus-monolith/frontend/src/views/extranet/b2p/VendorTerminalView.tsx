import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { ClipboardList, Navigation, AlertCircle, FilePlus2 } from "lucide-react"

export default function VendorTerminalView() {
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchVendorTasks = async () => {
            try {
                // Fetch tasks assigned specifically to the contractor's Vendor ID
                const response = await api.get("/api/v2/extranet/b2p/tasks")
                if (response.data?.success) {
                    setTasks(response.data.data)
                }
            } catch (error) {
                console.error("Failed to load B2P Vendor Tasks:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchVendorTasks()
    }, [])

    if (loading) {
        // Mobile-friendly loader
        return (
            <div className="flex items-center justify-center p-12 text-blue-600 animate-pulse flex-col gap-3">
                <Navigation size={32} className="animate-bounce" />
                <span className="text-sm font-medium">Sincronizando Ordens de Serviço...</span>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sticky top-16 z-40 bg-opacity-95 backdrop-blur">
                <h1 className="text-lg font-extrabold text-blue-950 flex items-center justify-between">
                    Ordens de Serviço
                    <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-xs font-bold leading-none">
                        {tasks.length} Ativas
                    </span>
                </h1>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Painel de execução. Anexe RDOs diários fotográficos nas ordens alocadas à sua empreiteira.</p>
            </div>

            {tasks.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center mt-8">
                    <ClipboardList className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p className="font-semibold text-slate-800">Sua via limpa.</p>
                    <p className="text-xs text-slate-500 mt-1">Sua empreiteira não possui obras ou pendências em andamento no momento.</p>
                </div>
            ) : (
                <div className="space-y-4 pb-4">
                    {tasks.map(task => (
                        <div key={task.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm active:scale-[0.98] transition-all">
                            <div className="p-4 bg-gradient-to-br from-white to-blue-50/30">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="pr-4">
                                        <p className="text-[10px] uppercase font-bold text-blue-500 tracking-wider mb-1">{task.project?.title || "Sem Vínculo"}</p>
                                        <h3 className="font-bold text-[15px] text-slate-800 leading-tight">{task.title}</h3>
                                    </div>
                                    {task.status === 'LATE' || task.status === 'BLOCKED' ? (
                                        <div className="bg-red-100 p-1.5 rounded text-red-600 shrink-0">
                                            <AlertCircle size={16} />
                                        </div>
                                    ) : (
                                        <div className="bg-opacity-20 border border-slate-200 px-2 py-1 rounded text-xs font-semibold text-slate-600 shrink-0">
                                            {task.status}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                                    <div className="text-xs text-slate-500">
                                        Prazo: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Em Aberto'}
                                    </div>
                                    <button className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors">
                                        <FilePlus2 size={14} /> Novo RDO
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

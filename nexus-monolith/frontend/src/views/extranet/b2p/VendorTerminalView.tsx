import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { ClipboardList, AlertCircle, FilePlus2 } from "lucide-react"
import clsx from "clsx"

export default function VendorTerminalView() {
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchVendorTasks = async () => {
            try {
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
        return (
            <div className="p-4 space-y-4">
                <div className="h-20 bg-white rounded-xl border border-slate-200/60 animate-pulse"></div>
                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-xl border border-slate-200/60 animate-pulse"></div>)}
            </div>
        )
    }

    return (
        <div className="p-4 space-y-4">
            {/* Sticky header */}
            <div className="backdrop-blur-xl bg-white/90 rounded-xl border border-slate-200/60 p-4 sticky top-16 z-40">
                <h1 className="text-lg font-bold text-slate-900 flex items-center justify-between">
                    Ordens de Serviço
                    <span className="bg-blue-50 text-blue-700 ring-1 ring-blue-200/80 py-1 px-3 rounded-full text-[11px] font-bold leading-none">
                        {tasks.length} Ativas
                    </span>
                </h1>
                <p className="text-[12px] text-slate-400 mt-1 leading-relaxed">Painel de execução. Anexe RDOs diários fotográficos nas ordens alocadas à sua empreiteira.</p>
            </div>

            {tasks.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center mt-4">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
                            <ClipboardList className="w-6 h-6 text-slate-300" />
                        </div>
                        <div>
                            <p className="text-[15px] font-semibold text-slate-700">Sua via limpa.</p>
                            <p className="text-[12px] text-slate-400 mt-1">Sua empreiteira não possui obras ou pendências em andamento.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3 pb-4">
                    {tasks.map(task => {
                        const isLate = task.status === 'LATE' || task.status === 'BLOCKED';
                        return (
                            <div key={task.id} className="bg-white rounded-xl border border-slate-200/60 overflow-hidden active:scale-[0.98] transition-all duration-200 hover:shadow-md hover:border-blue-200/60">
                                {/* Colored top accent */}
                                <div className={clsx("h-0.5", isLate ? "bg-gradient-to-r from-rose-500 to-rose-400" : "bg-gradient-to-r from-blue-500 to-blue-400")}></div>

                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2.5">
                                        <div className="pr-4">
                                            <p className="text-[10px] uppercase font-bold text-blue-500 tracking-[0.15em] mb-1">{task.project?.title || "Sem Vínculo"}</p>
                                            <h3 className="font-bold text-[15px] text-slate-800 leading-tight">{task.title}</h3>
                                        </div>
                                        {isLate ? (
                                            <div className="bg-rose-50 p-1.5 rounded-lg text-rose-500 ring-1 ring-rose-200/50 shrink-0 animate-pulse">
                                                <AlertCircle size={15} />
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 ring-1 ring-slate-200/80 tracking-wider shrink-0">
                                                {task.status}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                                        <span className="text-[12px] text-slate-400 font-medium">
                                            Prazo: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Em Aberto'}
                                        </span>
                                        <button className="flex items-center gap-1.5 text-[12px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 ring-1 ring-blue-200/50 px-3 py-1.5 rounded-lg transition-all duration-200">
                                            <FilePlus2 size={13} /> Novo RDO
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

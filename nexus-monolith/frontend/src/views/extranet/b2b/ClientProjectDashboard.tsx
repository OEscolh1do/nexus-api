import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Building2, Briefcase, Clock, CalendarDays, ExternalLink, Activity, AlertCircle } from "lucide-react"

export default function ClientProjectDashboard() {
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchExternalProjects = async () => {
            try {
                const response = await api.get("/api/v2/extranet/b2b/projects")
                if (response.data?.success) {
                    setProjects(response.data.data)
                }
            } catch (error) {
                console.error("Failed to load B2B Projects:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchExternalProjects()
    }, [])

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="h-7 w-64 bg-slate-200 rounded-lg animate-pulse"></div>
                    <div className="h-4 w-96 bg-slate-100 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2].map(i => <div key={i} className="h-[280px] bg-white rounded-xl border border-slate-200/60 animate-pulse"></div>)}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2.5 mb-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Visão Executiva de Obras</h1>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 rounded-full">
                        <Building2 className="w-3 h-3 text-orange-500" />
                        <span className="text-[11px] font-bold text-orange-600">{projects.length} obras</span>
                    </div>
                </div>
                <p className="text-slate-500 text-[14px]">Acompanhamento de transparência e evolução das medições.</p>
            </div>

            {projects.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200/60 p-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-slate-300" />
                        </div>
                        <div>
                            <p className="text-[15px] font-semibold text-slate-700">Nenhuma obra localizada</p>
                            <p className="text-[13px] text-slate-400 mt-1">Não constam projetos atrelados à sua carteira no momento.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {projects.map(proj => (
                        <div key={proj.id} className="bg-white rounded-xl border border-slate-200/60 overflow-hidden hover:shadow-lg hover:border-orange-200/60 transition-all duration-300 group">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                            <Briefcase className="text-orange-600" size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-[15px] text-slate-800 leading-tight">{proj.title}</h3>
                                            <span className="inline-flex items-center rounded-md bg-slate-50 ring-1 ring-slate-200/80 px-2 py-0.5 mt-1 text-[10px] font-bold text-slate-600 tracking-wider">
                                                {proj.status}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="text-slate-400 hover:text-orange-600 transition-colors p-2 rounded-lg hover:bg-orange-50">
                                        <ExternalLink size={16} />
                                    </button>
                                </div>

                                <div className="mb-5">
                                    <div className="flex justify-between text-[12px] mb-1.5">
                                        <span className="text-slate-500 font-medium flex items-center gap-1.5"><Activity size={13} /> Avanço Físico (Curva S)</span>
                                        <span className="font-bold text-slate-800">{proj.progressPercentage}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-full rounded-full transition-all duration-1000" style={{ width: `${proj.progressPercentage}%` }}></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1 font-bold uppercase tracking-wider"><CalendarDays size={11} /> Início</div>
                                        <div className="text-[13px] font-semibold text-slate-800">{proj.startDate ? new Date(proj.startDate).toLocaleDateString('pt-BR') : 'A definir'}</div>
                                    </div>
                                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1 font-bold uppercase tracking-wider"><Clock size={11} /> Entrega</div>
                                        <div className="text-[13px] font-semibold text-slate-800">{proj.endDate ? new Date(proj.endDate).toLocaleDateString('pt-BR') : 'A definir'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50/50 px-5 py-3.5 border-t border-slate-100">
                                <div className="flex justify-between items-center text-[12px]">
                                    <span className="text-slate-400 font-medium">Orçamento Consolidado (B2B)</span>
                                    {proj.Budget ? (
                                        <span className="font-bold text-slate-700">{proj.Budget.currency} {proj.Budget.totalPlanned?.toLocaleString('pt-BR')}</span>
                                    ) : (
                                        <span className="text-slate-300 italic text-[11px]">Planilha de custos oculta</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

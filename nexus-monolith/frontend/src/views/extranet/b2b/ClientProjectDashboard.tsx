import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Building2, Briefcase, Clock, CalendarDays, ExternalLink, Activity } from "lucide-react"

export default function ClientProjectDashboard() {
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchExternalProjects = async () => {
            try {
                // Calls the isolated extranet logic
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
        return <div className="p-12 text-center text-slate-500 animate-pulse">Carregando painel de transparência B2B...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Visão Executiva de Obras</h1>
                    <p className="text-slate-500 mt-1">Acompanhamento de transparência e evolução das medições.</p>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
                    <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <p className="font-medium text-slate-900">Nenhuma obra localizada</p>
                    <p className="text-sm mt-1">Não constam projetos atrelados à sua carteira (Client ID) no momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {projects.map(proj => (
                        <div key={proj.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                            <Briefcase className="text-orange-600" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-slate-900 leading-tight">{proj.title}</h3>
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 mt-1 text-xs font-medium text-slate-800">
                                                {proj.status}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="text-slate-400 hover:text-blue-600 transition-colors p-2" title="Portfólio Detalhado">
                                        <ExternalLink size={18} />
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="text-slate-500 font-medium flex items-center gap-1.5"><Activity size={14} /> Avanço Físico (Curva S)</span>
                                        <span className="font-bold text-slate-900">{proj.progressPercentage}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                        <div className="bg-orange-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${proj.progressPercentage}%` }}></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="text-xs text-slate-500 flex items-center gap-1 mb-1"><CalendarDays size={12} /> Início Acordado</div>
                                        <div className="font-medium text-slate-800">{proj.startDate ? new Date(proj.startDate).toLocaleDateString() : 'A definir'}</div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="text-xs text-slate-500 flex items-center gap-1 mb-1"><Clock size={12} /> Previsão de Entrega</div>
                                        <div className="font-medium text-slate-800">{proj.endDate ? new Date(proj.endDate).toLocaleDateString() : 'A definir'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Orçamento Consolidado (B2B)</span>
                                    {proj.Budget ? (
                                        <div className="font-semibold text-slate-900">
                                            {proj.Budget.currency} {proj.Budget.totalPlanned?.toLocaleString()}
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 italic">Planilha de custos oculta</span>
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

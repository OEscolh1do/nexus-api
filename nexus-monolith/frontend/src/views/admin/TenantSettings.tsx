import { ShieldCheck, Coins, Key, Network } from "lucide-react"
import { Card } from "@/components/ui/mock-components"

export default function TenantSettings() {

    // In a real app, these values would be fetched from: /api/v2/tenant/me (connected to Prisma's Tenant API fields)
    const tenantMock = {
        name: "Construtora Horizonte (Demonstração)",
        ssoEnforced: true,
        ssoDomain: "horizonte.eng.br",
        ssoProvider: "ENTRA_ID",
        apiPlan: "ENTERPRISE",
        apiMonthlyQuota: 500000,
        apiCurrentUsage: 142050
    }

    const usagePercent = Math.round((tenantMock.apiCurrentUsage / tenantMock.apiMonthlyQuota) * 100);

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header Module */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Governança Enterprise & API</h1>
                        <p className="text-slate-500 mt-1 text-lg">Painel de governança corporativa, monetização e políticas de acesso (SSO).</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* SSO Configuration Card */}
                    <Card className="p-6 border-t-4 border-t-blue-600 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-blue-100 p-3 rounded-xl text-blue-700">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Single Sign-On (SSO)</h2>
                                <p className="text-sm text-slate-500">Delegação de Identidade Corporativa</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div>
                                    <p className="font-semibold text-slate-700">Interceptação de Domínio</p>
                                    <p className="text-sm text-slate-500">Forçar login via Portal Corporativo</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${tenantMock.ssoEnforced ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {tenantMock.ssoEnforced ? 'ATIVO' : 'INATIVO'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Domínio Gatilho</p>
                                    <div className="font-medium text-slate-800 bg-white border border-slate-200 p-2.5 rounded-md">
                                        @{tenantMock.ssoDomain || 'Não configurado'}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Provedor de Identidade (IdP)</p>
                                    <div className="font-medium text-slate-800 bg-white border border-slate-200 p-2.5 rounded-md flex items-center gap-2">
                                        <Network size={16} className="text-blue-500" />
                                        {tenantMock.ssoProvider || 'Nenhum'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* API Monetization Card */}
                    <Card className="p-6 border-t-4 border-t-emerald-500 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                                <Coins size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">API Gateway & Consumo</h2>
                                <p className="text-sm text-slate-500">Monetização de Tráfego M2M (Machine-to-Machine)</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Plano de Assinatura</p>
                                    <div className="text-2xl font-black text-slate-800 tracking-tight">
                                        NEXUS <span className="text-emerald-500">{tenantMock.apiPlan}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Integrações Ativas</p>
                                    <div className="flex items-center justify-end gap-1 font-medium text-slate-700">
                                        <Key size={16} className="text-slate-400" /> 2 Chaves
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-semibold text-slate-700">Consumo de Franquia Mês Atual</span>
                                    <span className="font-bold text-slate-900">{tenantMock.apiCurrentUsage.toLocaleString()} / {tenantMock.apiMonthlyQuota.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                    <div className={`h-3 rounded-full transition-all duration-1000 ${usagePercent > 85 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${usagePercent}%` }}></div>
                                </div>
                                <div className="text-right text-xs text-slate-500">
                                    {usagePercent}% da franquia processada
                                </div>
                            </div>
                        </div>
                    </Card>

                </div>

            </div>
        </div>
    )
}

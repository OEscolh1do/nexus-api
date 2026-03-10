import { ShieldCheck, Coins, Key, Network, Settings } from "lucide-react"
import { Card } from "@/components/ui/mock-components"
import clsx from "clsx"

export default function TenantSettings() {
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
        <div className="min-h-screen bg-slate-50/50 p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-end justify-between">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Governança Enterprise & API</h1>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-full">
                                <Settings className="w-3 h-3 text-indigo-500" />
                                <span className="text-[11px] font-bold text-indigo-600">Admin</span>
                            </div>
                        </div>
                        <p className="text-slate-500 text-[14px]">Painel de governança corporativa, monetização e políticas de acesso (SSO).</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* SSO Configuration Card */}
                    <Card className="overflow-hidden border-slate-200/60">
                        <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                    <ShieldCheck size={22} />
                                </div>
                                <div>
                                    <h2 className="text-[15px] font-bold text-slate-800">Single Sign-On (SSO)</h2>
                                    <p className="text-[12px] text-slate-400 font-medium">Delegação de Identidade Corporativa</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
                                    <div>
                                        <p className="text-[13px] font-semibold text-slate-700">Interceptação de Domínio</p>
                                        <p className="text-[11px] text-slate-400">Forçar login via Portal Corporativo</p>
                                    </div>
                                    <span className={clsx(
                                        "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider",
                                        tenantMock.ssoEnforced ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80' : 'bg-slate-100 text-slate-500'
                                    )}>
                                        {tenantMock.ssoEnforced ? 'ATIVO' : 'INATIVO'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Domínio Gatilho</p>
                                        <div className="text-[13px] font-semibold text-slate-800 font-mono">
                                            @{tenantMock.ssoDomain || 'Não configurado'}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Provedor de Identidade</p>
                                        <div className="text-[13px] font-semibold text-slate-800 flex items-center gap-2">
                                            <Network size={14} className="text-blue-500" />
                                            {tenantMock.ssoProvider || 'Nenhum'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* API Monetization Card */}
                    <Card className="overflow-hidden border-slate-200/60">
                        <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                    <Coins size={22} />
                                </div>
                                <div>
                                    <h2 className="text-[15px] font-bold text-slate-800">API Gateway & Consumo</h2>
                                    <p className="text-[12px] text-slate-400 font-medium">Monetização de Tráfego M2M (Machine-to-Machine)</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plano de Assinatura</p>
                                        <div className="text-[22px] font-black text-slate-800 tracking-tight">
                                            NEXUS <span className="text-emerald-500">{tenantMock.apiPlan}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Integrações Ativas</p>
                                        <div className="flex items-center justify-end gap-1.5 text-[13px] font-semibold text-slate-700">
                                            <Key size={14} className="text-slate-400" /> 2 Chaves
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[13px]">
                                        <span className="font-semibold text-slate-600">Consumo de Franquia Mês Atual</span>
                                        <span className="font-bold text-slate-800">{tenantMock.apiCurrentUsage.toLocaleString()} / {tenantMock.apiMonthlyQuota.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={clsx(
                                                "h-full rounded-full transition-all duration-1000",
                                                usagePercent > 85 ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                                            )}
                                            style={{ width: `${usagePercent}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-right text-[11px] text-slate-400 font-medium">{usagePercent}% da franquia processada</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/mock-components";
import clsx from "clsx";

interface RiskItem {
    id: string;
    title: string;
    level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    trend?: "UP" | "DOWN" | "STABLE";
}

interface RiskAlertProps {
    risks: RiskItem[];
}

export function RiskAlert({ risks }: RiskAlertProps) {
    const getLevelConfig = (level: string) => {
        switch (level) {
            case "CRITICAL": return {
                badge: "bg-rose-500 text-white",
                border: "border-l-rose-500",
                dot: "bg-rose-500 animate-pulse",
            };
            case "HIGH": return {
                badge: "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
                border: "border-l-orange-400",
                dot: "bg-orange-400",
            };
            case "MEDIUM": return {
                badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
                border: "border-l-amber-400",
                dot: "bg-amber-400",
            };
            default: return {
                badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
                border: "border-l-slate-300",
                dot: "bg-slate-400",
            };
        }
    };

    const getTrendIcon = (trend?: string) => {
        switch (trend) {
            case "UP": return <TrendingUp className="w-3.5 h-3.5 text-rose-500" />;
            case "DOWN": return <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />;
            case "STABLE": return <Minus className="w-3.5 h-3.5 text-slate-400" />;
            default: return null;
        }
    };

    return (
        <Card className="h-full border-slate-200/60 overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-gradient-to-r from-rose-50/50 to-transparent">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-[13px] font-semibold flex items-center gap-2 text-slate-700">
                        <div className="h-7 w-7 rounded-lg bg-rose-100 flex items-center justify-center">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        </div>
                        Radar de Riscos
                    </CardTitle>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                        <span className="text-[10px] font-bold text-rose-600">{risks.filter(r => r.level === 'CRITICAL').length} críticos</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {risks.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                            <span className="text-emerald-500 text-lg">✓</span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Nenhum risco crítico detectado</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100/80">
                        {risks.map(risk => {
                            const config = getLevelConfig(risk.level);
                            return (
                                <div
                                    key={risk.id}
                                    className={clsx(
                                        "px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors duration-200 border-l-[3px]",
                                        config.border
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={clsx("px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider shrink-0", config.badge)}>
                                            {risk.level}
                                        </span>
                                        <span className="text-[13px] text-slate-700 font-medium truncate">{risk.title}</span>
                                    </div>
                                    <div className="shrink-0 ml-2">
                                        {getTrendIcon(risk.trend)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

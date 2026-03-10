import React from "react";
import { Card, CardContent } from "@/components/ui/mock-components";
import clsx from "clsx";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: number;
    formatter?: (val: string | number) => string;
}

export function MetricCard({ title, value, icon, trend, formatter }: MetricCardProps) {
    const isPositive = trend && trend > 0;
    const isNegative = trend && trend < 0;

    const formattedValue = formatter ? formatter(value) : value;

    return (
        <Card className="group relative overflow-hidden border-slate-200/60 bg-gradient-to-br from-white via-white to-slate-50/80 hover:shadow-lg hover:shadow-purple-500/5 hover:border-purple-200/60 transition-all duration-300">
            {/* Subtle top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500/0 via-purple-500/40 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <CardContent className="px-5 pt-5 pb-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-2.5">
                        <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
                        <p className="text-[26px] font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                            {formattedValue}
                        </p>
                    </div>
                    {icon && (
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/80 flex items-center justify-center text-purple-500 shrink-0 group-hover:scale-105 transition-transform duration-300">
                            <div className="[&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</div>
                        </div>
                    )}
                </div>

                {trend !== undefined && (
                    <div className="mt-3 flex items-center gap-1.5">
                        <div
                            className={clsx(
                                "flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full",
                                isPositive && "bg-emerald-50 text-emerald-600",
                                isNegative && "bg-rose-50 text-rose-600",
                                !isPositive && !isNegative && "bg-slate-50 text-slate-500"
                            )}
                        >
                            {isPositive ? <TrendingUp className="w-3 h-3" /> :
                                isNegative ? <TrendingDown className="w-3 h-3" /> :
                                    <Minus className="w-3 h-3" />}
                            {isPositive ? "+" : ""}{trend}%
                        </div>
                        <span className="text-[11px] text-slate-400">vs mês anterior</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

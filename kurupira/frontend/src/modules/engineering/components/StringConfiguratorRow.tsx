import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useStringValidation } from '../hooks/useStringValidation';

export const MPPTCompactRow: React.FC<{
    mpptId: number,
    config: { stringsCount: number, modulesPerString: number },
    spec: any,
    moduleSpecs: any,
    onChange: (c: any) => void
}> = ({ mpptId, config, spec, moduleSpecs, onChange }) => {

    const validation = useStringValidation(
        moduleSpecs,
        spec,
        config.modulesPerString,
        config.stringsCount
    );

    const hasError = validation && !validation.isValid;

    return (
        <div className={cn(
            "rounded border p-2 transition-colors",
            hasError ? "bg-red-50/50 border-red-100" : "bg-slate-50/50 border-slate-100"
        )}>
            <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase bg-white border border-slate-200 px-1 rounded">
                    MPPT {mpptId}
                </span>

                {/* Validation Status Icons (Compact) */}
                <div className="flex-1 flex justify-end gap-1">
                    {validation && (
                        <>
                            <ValidationIcon status={validation.vocMax.status} label="Voc" value={`${validation.vocMax.value.toFixed(0)}V`} />
                            <ValidationIcon status={validation.vmpRange.status} label="Vmp" value={`${validation.vmpRange.value.toFixed(0)}V`} />
                            <ValidationIcon status={validation.iscMax.status} label="Isc" value={`${validation.iscMax.value.toFixed(1)}A`} />
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Inputs */}
                <div className="flex items-center gap-1 flex-1">
                    <div className="relative flex-1">
                        <input
                            type="number"
                            min={0}
                            className={cn(
                                "w-full h-7 text-xs font-mono font-bold px-1 text-center bg-white border rounded focus:ring-1 outline-none",
                                config.stringsCount === 0 ? "text-slate-300" : "text-slate-700 border-slate-300"
                            )}
                            placeholder="Str"
                            value={config.stringsCount}
                            onChange={e => onChange({ stringsCount: parseInt(e.target.value) || 0 })}
                        />
                        <span className="absolute -bottom-3 left-0 w-full text-[8px] text-center text-slate-400">Strings</span>
                    </div>
                    <span className="text-slate-300 font-bold mb-2">x</span>
                    <div className="relative flex-1">
                        <input
                            type="number"
                            min={0}
                            className={cn(
                                "w-full h-7 text-xs font-mono font-bold px-1 text-center bg-white border rounded focus:ring-1 outline-none",
                                config.modulesPerString === 0 ? "text-slate-300" : "text-slate-700 border-slate-300"
                            )}
                            placeholder="Mods"
                            value={config.modulesPerString}
                            onChange={e => onChange({ modulesPerString: parseInt(e.target.value) || 0 })}
                        />
                        <span className="absolute -bottom-3 left-0 w-full text-[8px] text-center text-slate-400">Módulos</span>
                    </div>
                </div>
            </div>

            {/* Error Message Only */}
            {hasError && (
                <div className="mt-4 pt-1 border-t border-red-200 flex flex-col gap-0.5">
                    {validation.vocMax.status === 'error' && <ErrorLine msg={validation.vocMax.message || ''} />}
                    {validation.vmpRange.status === 'error' && <ErrorLine msg={validation.vmpRange.message || ''} />}
                    {validation.iscMax.status === 'error' && <ErrorLine msg={validation.iscMax.message || ''} />}
                </div>
            )}
        </div>
    );
};

const ErrorLine = ({ msg }: { msg: string }) => (
    <span className="text-[9px] font-medium text-red-600 flex items-center gap-1">
        <AlertCircle size={8} /> {msg}
    </span>
);

const ValidationIcon = ({ status, label, value }: { status: 'ok' | 'warning' | 'error', label: string, value: string }) => {
    const colors = {
        ok: "text-emerald-500 bg-emerald-50 border-emerald-100",
        warning: "text-amber-500 bg-amber-50 border-amber-100",
        error: "text-red-500 bg-red-50 border-red-100"
    };

    const StatusIcon = status === 'ok' ? CheckCircle2 : status === 'warning' ? AlertTriangle : AlertCircle;

    return (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <div className={cn("flex items-center gap-0.5 px-1 py-0.5 rounded border cursor-help text-[9px] font-mono", colors[status])}>
                        <StatusIcon size={8} />
                        <span>{label}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                    <b>{label}:</b> {value} ({status === 'ok' ? 'OK' : status === 'warning' ? 'Atenção' : 'ERRO'})
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

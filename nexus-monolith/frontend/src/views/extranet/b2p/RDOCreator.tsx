import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const schema = z.object({
    taskId: z.string().min(1, "Selecione a Tarefa (OS) vinculada"),
    reportDate: z.string().min(1, "A data do RDO é obrigatória"),
    weather: z.string().optional(),
    laborCount: z.string().optional(),
    progressNotes: z.string().min(10, "Descreva o avanço físico do dia detalhadamente (min 10 caracteres)."),
    incidentNotes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function RDOCreator() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [serverError, setServerError] = useState("");

    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { reportDate: new Date().toISOString().split('T')[0] }
    });

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await api.get('/api/v2/extranet/b2p/tasks');
                if (response.data.success) { setTasks(response.data.data); }
            } catch (err) { console.error("Erro ao puxar tarefas", err); }
            finally { setLoadingTasks(false); }
        };
        fetchTasks();
    }, []);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        setServerError("");
        try {
            const response = await api.post('/api/v2/extranet/b2p/rdos', data);
            if (response.data.success) { setSubmitSuccess(true); reset(); }
        } catch (err: any) {
            setServerError(err.response?.data?.error || "Erro ao salvar RDO. Verifique a conexão.");
        } finally { setIsSubmitting(false); }
    };

    // --- Success State ---
    if (submitSuccess) {
        return (
            <div className="max-w-2xl mx-auto mt-12 p-10 text-center bg-white border border-slate-200/60 rounded-2xl">
                <div className="relative inline-block mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    </div>
                    <div className="absolute -inset-2 bg-emerald-200/20 rounded-3xl blur-xl -z-10"></div>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">RDO Emitido com Sucesso!</h2>
                <p className="text-[14px] text-slate-500 mb-8 max-w-md mx-auto">Seu relatório diário de obra foi registrado e enviado para a fiscalização da gerenciadora.</p>
                <button
                    onClick={() => setSubmitSuccess(false)}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-[13px]"
                >
                    Elaborar Novo RDO
                </button>
            </div>
        );
    }

    const inputStyle = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 bg-white transition-all";

    return (
        <div className="max-w-3xl mx-auto pb-12 px-4">
            <div className="mb-6 mt-4">
                <div className="flex items-center gap-2.5 mb-1">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Emissor de RDO</h1>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-full">
                        <FileText className="w-3 h-3 text-blue-500" />
                        <span className="text-[11px] font-bold text-blue-600">B2P</span>
                    </div>
                </div>
                <p className="text-slate-500 text-[13px]">Relatório Diário de Obra - Portal B2P</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
                {/* Top accent */}
                <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>

                <div className="p-5 md:p-7">
                    {serverError && (
                        <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200/80 text-rose-700 rounded-xl flex items-start gap-2.5 text-[13px]">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <p className="font-medium">{serverError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Section 1: Meta */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-6 border-b border-slate-100">
                            <div>
                                <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Frente de Serviço (Ordem Associada)</label>
                                {loadingTasks ? (
                                    <div className="h-10 bg-slate-100 animate-pulse rounded-xl" />
                                ) : (
                                    <select {...register("taskId")} className={inputStyle}>
                                        <option value="">-- Selecionar Atividade --</option>
                                        {tasks.map(t => (
                                            <option key={t.id} value={t.id}>{t.project?.title || 'Projeto Não Nomeado'} - {t.title}</option>
                                        ))}
                                    </select>
                                )}
                                {errors.taskId && <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.taskId.message}</p>}
                            </div>

                            <div>
                                <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data de Referência</label>
                                <input type="date" {...register("reportDate")} className={inputStyle} />
                                {errors.reportDate && <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.reportDate.message}</p>}
                            </div>
                        </div>

                        {/* Section 2: Environment & Labor */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-6 border-b border-slate-100">
                            <div>
                                <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Condições Climáticas</label>
                                <select {...register("weather")} className={inputStyle}>
                                    <option value="">Não Informado</option>
                                    <option value="BOM">Bom / Limpo</option>
                                    <option value="CHUVOSO">Chuvoso (Com paralização)</option>
                                    <option value="NUBLADO">Nublado</option>
                                    <option value="IMPRATICAVEL">Impraticável (Sem operação)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mão de Obra Empregada (Qtd)</label>
                                <input type="number" {...register("laborCount")} placeholder="Ex: 5" min={0} className={inputStyle} />
                            </div>
                        </div>

                        {/* Section 3: Notes */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Serviços Executados (Avanço Físico) *</label>
                                <textarea {...register("progressNotes")} rows={4} placeholder="Detalhe o que foi construído ou avançado hoje..." className={`${inputStyle} resize-y`} />
                                {errors.progressNotes && <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.progressNotes.message}</p>}
                            </div>

                            <div>
                                <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ocorrências / Anormalidades / Interferências</label>
                                <textarea {...register("incidentNotes")} rows={2} placeholder="Houve falta de material, problemas técnicos, acidentes?" className={`${inputStyle} resize-y`} />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="animate-spin h-4 w-4" /> Transitando...</>
                                ) : (
                                    <><CheckCircle2 className="h-4 w-4" /> Emitir Diário Técnico</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

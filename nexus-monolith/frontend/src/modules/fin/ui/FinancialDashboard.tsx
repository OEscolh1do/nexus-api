import { useEffect, useState, useCallback } from "react";
import { FinService, type Transaction, type BalanceSummary } from "../fin.service";
import { Card, Button, Input, Badge } from "@/components/ui/mock-components";
import { ArrowUpCircle, ArrowDownCircle, Wallet, Plus, Loader2, TrendingUp, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

export function FinancialDashboard() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [balance, setBalance] = useState<BalanceSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form
    const { register, handleSubmit, reset } = useForm();

    const loadData = useCallback(async () => {
        try {
            // Nota: loading deve ser setado por quem chama, se desejado
            const [txs, bal] = await Promise.all([
                FinService.getLedger(),
                FinService.getBalance()
            ]);
            setTransactions(txs);
            setBalance(bal);
        } catch (err) {
            console.error("Failed to load financial data", err);
        }
    }, []);

    useEffect(() => {
        // Initial fetch (loading is true by default)
        loadData().finally(() => setLoading(false));
    }, [loadData]);

    // Mock EVM Data (Should be calculated from Backend in production)
    const evmData = [
        { name: 'Mês 1', PV: 10000, EV: 8000, AC: 9500 },
        { name: 'Mês 2', PV: 25000, EV: 22000, AC: 24000 },
        { name: 'Mês 3', PV: 45000, EV: 40000, AC: 48000 },
        { name: 'Mês 4', PV: 70000, EV: 68000, AC: 82000 }, // Overbudget!
        { name: 'Mês 5', PV: 90000, EV: 85000, AC: 98000 },
        { name: 'Mês 6', PV: 120000, EV: 110000, AC: 130000 },
    ];

    // Calculate SPI & CPI from latest mock data point
    const currentEVM = evmData[evmData.length - 1];
    const SPI = currentEVM.EV / currentEVM.PV; // Schedule Performance Index
    const CPI = currentEVM.EV / currentEVM.AC; // Cost Performance Index

    interface TransactionData {
        type: 'CREDIT' | 'DEBIT';
        amount: number;
        category: string;
        description: string;
    }

    const onAddTransaction = async (data: any) => {
        // Cast data from form
        const tx = data as TransactionData;
        try {
            // Opcional: setLoading(true) aqui se quiser feedback visual
            await FinService.addTransaction(tx);
            reset();
            setShowForm(false);
            await loadData(); // Refresh silencioso ou wrap com loading se preferir
        } catch {
            alert("Erro ao adicionar transação");
        }
    }

    if (loading && !balance) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Financeiro 💰</h1>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="mr-2 h-4 w-4" /> Nova Transação
                </Button>
            </div>

            {/* KPI CARDS */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="p-6">
                    <div className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">Saldo de Caixa</h3>
                    </div>
                    <div className={`text-2xl font-bold mt-2 ${balance?.total && balance.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {balance?.total?.toFixed(2) || '0.00'}
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center space-x-2">
                        <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                        <h3 className="text-sm font-medium">Receitas</h3>
                    </div>
                    <div className="text-2xl font-bold mt-2 text-emerald-600">
                        R$ {balance?.income?.toFixed(2) || '0.00'}
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center space-x-2">
                        <ArrowDownCircle className="h-4 w-4 text-red-500" />
                        <h3 className="text-sm font-medium">Despesas</h3>
                    </div>
                    <div className="text-2xl font-bold mt-2 text-red-600">
                        R$ {balance?.expenses?.toFixed(2) || '0.00'}
                    </div>
                </Card>

                {/* EVM HEALTH VITAL */}
                <Card className={`p-6 border-l-4 ${CPI < 1 ? 'border-red-500' : 'border-green-500'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className={`h-4 w-4 ${CPI < 1 ? 'text-red-500' : 'text-green-500'}`} />
                            <h3 className="text-sm font-medium">Saúde Financeira (CPI)</h3>
                        </div>
                        {CPI < 1 && <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />}
                    </div>
                    <div className="text-2xl font-bold mt-2">
                        {CPI.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {CPI < 1 ? 'Atenção: Custo acima do valor agregado (Estouro de Orçamento)' : 'Saudável: Entregando valor abaixo do custo'}
                    </p>
                </Card>
            </div>

            {/* S-CURVE EVM CHART */}
            <Card className="p-6 border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Curva S - Earned Value Management (EVM) Corporativo</h3>
                        <p className="text-sm text-slate-500">Acompanhamento consolidado do custo planejado, físico agregado e custo real incorrido.</p>
                    </div>
                    <div className="flex gap-4 text-sm font-medium">
                        <div className="flex flex-col"><span className="text-slate-500">SPI (Cronograma)</span><span className={SPI >= 1 ? 'text-green-600' : 'text-amber-500'}>{SPI.toFixed(2)} {SPI < 1 && "▼ Atrasado"}</span></div>
                        <div className="flex flex-col"><span className="text-slate-500">CPI (Custo)</span><span className={CPI >= 1 ? 'text-green-600' : 'text-red-500'}>{CPI.toFixed(2)} {CPI < 1 && "▼ Estourado"}</span></div>
                    </div>
                </div>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={evmData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorPV" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorEV" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorAC" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickMargin={10} />
                            <YAxis
                                stroke="#64748b"
                                fontSize={12}
                                tickFormatter={(value) => `R$${value / 1000}k`}
                                width={80}
                            />
                            <Tooltip
                                formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="top" height={36} />
                            <Area
                                type="monotone"
                                dataKey="PV"
                                name="Valor Planejado (PV)"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorPV)"
                            />
                            <Area
                                type="monotone"
                                dataKey="EV"
                                name="Valor Agregado (EV)"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorEV)"
                            />
                            <Area
                                type="monotone"
                                dataKey="AC"
                                name="Custo Real (AC)"
                                stroke="#ef4444"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorAC)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* TRANSACTION FORM */}
            {showForm && (
                <Card className="p-6 bg-slate-50 dark:bg-slate-900 border-dashed">
                    <h3 className="font-semibold mb-4">Adicionar Lançamento</h3>
                    <form onSubmit={handleSubmit(onAddTransaction)} className="grid gap-4 md:grid-cols-5 items-end">
                        <div className="md:col-span-1">
                            <label className="text-xs font-medium">Tipo</label>
                            <select {...register("type")} className="w-full border rounded p-2 text-sm bg-background">
                                <option value="CREDIT">Receita (Crédito)</option>
                                <option value="DEBIT">Despesa (Débito)</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-xs font-medium">Valor (R$)</label>
                            <Input type="number" step="0.01" {...register("amount")} placeholder="0.00" required />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-xs font-medium">Categoria</label>
                            <Input {...register("category")} placeholder="Ex: Venda, Luz..." required />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-xs font-medium">Descrição</label>
                            <Input {...register("description")} placeholder="Detalhes..." />
                        </div>
                        <div className="md:col-span-1">
                            <Button type="submit" className="w-full">Salvar</Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* LEDGER TABLE */}
            <Card className="overflow-hidden">
                <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="font-semibold">Extrato (Ledger Imutável)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="h-10 px-4 text-left align-middle font-medium">Data</th>
                                <th className="h-10 px-4 text-left align-middle font-medium">Descrição</th>
                                <th className="h-10 px-4 text-left align-middle font-medium">Categoria</th>
                                <th className="h-10 px-4 text-right align-middle font-medium">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Nenhuma transação encontrada.</td></tr>
                            ) : (
                                transactions.map(t => (
                                    <tr key={t.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className="p-4 align-middle">{t.description}</td>
                                        <td className="p-4 align-middle"><Badge variant="outline">{t.category}</Badge></td>
                                        <td className={`p-4 align-middle text-right font-medium ${t.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'CREDIT' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

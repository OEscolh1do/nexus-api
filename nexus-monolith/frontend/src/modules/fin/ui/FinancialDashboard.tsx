import { useEffect, useState, useCallback } from "react";
import { FinService, type Transaction, type BalanceSummary } from "../fin.service";
import { Card, Button, Input, Badge } from "@/components/ui/mock-components";
import { ArrowUpCircle, ArrowDownCircle, Wallet, Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

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
      return <div className="p-8 flex justify-center"><Loader2 className="animate-spin"/></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Financeiro 💰</h1>
            <Button onClick={() => setShowForm(!showForm)}>
                <Plus className="mr-2 h-4 w-4"/> Nova Transação
            </Button>
      </div>

      {/* KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
            <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Saldo Total</h3>
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
      </div>

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

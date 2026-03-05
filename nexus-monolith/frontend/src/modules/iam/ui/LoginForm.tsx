import { useState } from "react";
import { api } from "../../../lib/api";
import { Card, Button, Input } from "../../../components/ui/mock-components";
import { AlertCircle, Lock } from "lucide-react";

export function LoginForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Usar a nova rota IAM
      const res = await api.post("/iam/login", { username, password });

      const { token, user } = res.data.data;

      // Persistir Sessão
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      onLoginSuccess();
    } catch {
      setError("Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold">Neonorte | Nexus</h1>
          <p className="text-muted-foreground">Login Corporativo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Usuário</label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Ex: admin"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium">Senha</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>

          {error && (
            <div className="flex items-center text-sm text-red-500 bg-red-50 p-3 rounded-md">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Acessar Sistema"}
          </Button>

          <div className="text-center text-xs text-muted-foreground mt-4">
            Credenciais padrão: admin / 123
          </div>
        </form>
      </Card>
    </div>
  );
}

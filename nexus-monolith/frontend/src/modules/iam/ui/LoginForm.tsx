import { useState } from "react";
import { api } from "../../../lib/api";
import { Card, Button, Input } from "../../../components/ui/mock-components";
import { AlertCircle, Lock } from "lucide-react";

export function LoginForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Phase 3: SSO State
  const [isSsoFlow, setIsSsoFlow] = useState(false);
  const [ssoProvider, setSsoProvider] = useState<string | null>(null);
  const [ssoMessage, setSsoMessage] = useState("");

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
    } catch (err: any) {
      // Phase 3: Handle SSO Intercept (401 with specific payload)
      if (err.response?.status === 401 && err.response?.data?.isSSO) {
        setIsSsoFlow(true);
        setSsoProvider(err.response.data.ssoProvider);
        setSsoMessage(err.response.data.message);
        return;
      }

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

        {isSsoFlow ? (
          <div className="space-y-6 text-center">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg text-sm font-medium">
              {ssoMessage}
            </div>
            <Button
              onClick={() => alert(`Redirecting to SAML 2.0 Identity Provider (${ssoProvider})...`)}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
            >
              Autenticar via {ssoProvider === 'ENTRA_ID' ? 'Microsoft Entra ID' : ssoProvider === 'GOOGLE_WORKSPACE' ? 'Google Workspace' : 'Portal Corporativo'}
            </Button>
            <button type="button" onClick={() => setIsSsoFlow(false)} className="text-sm text-slate-500 hover:text-slate-700 underline mt-4 block mx-auto">
              Tentar outro E-mail
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Usuário / E-mail Corporativo</label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Ex: @suaempresa.com.br"
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
        )}
      </Card>
    </div>
  );
}

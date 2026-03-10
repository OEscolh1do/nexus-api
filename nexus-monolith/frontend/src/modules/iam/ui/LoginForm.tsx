import { useState } from "react";
import { api } from "../../../lib/api";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "O usuário ou e-mail é obrigatório"),
  password: z.string().min(1, "A senha é obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Phase 3: SSO State
  const [isSsoFlow, setIsSsoFlow] = useState(false);
  const [ssoProvider, setSsoProvider] = useState<string | null>(null);
  const [ssoMessage, setSsoMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/iam/login", data);
      const { token, user } = res.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      onLoginSuccess();
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err
      ) {
        const errorResponse = (err as { response: { status: number; data: { isSSO?: boolean; ssoProvider?: string; message?: string } } }).response;
        if (errorResponse?.status === 401 && errorResponse?.data?.isSSO) {
          setIsSsoFlow(true);
          setSsoProvider(errorResponse.data.ssoProvider ?? null);
          setSsoMessage(errorResponse.data.message ?? "");
          return;
        }
      }

      setError("Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050510] relative overflow-hidden font-sans">
      {/* Ambient Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-80 h-80 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-10%] w-96 h-96 bg-blue-600/15 rounded-full blur-[140px] animate-pulse [animation-delay:2s]" />
        <div className="absolute top-[50%] left-[60%] w-48 h-48 bg-violet-500/10 rounded-full blur-[80px]" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-[#0a0a16]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)]">

          {/* Header with Logo */}
          <div className="text-center mb-8">
            <img
              src="/assets/logos/NEONORTE ASS VERT - 01 - ROXO.png"
              alt="Neonorte"
              className="h-20 mx-auto mb-5 drop-shadow-[0_0_24px_rgba(147,51,234,0.3)]"
            />
            <h1
              className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-400 tracking-tight"
              style={{ fontFamily: "'Grammatika', sans-serif" }}
            >
              Nexus Platform
            </h1>
            <p className="text-slate-500 text-sm mt-1">Acesso Corporativo Seguro</p>
          </div>

          {isSsoFlow ? (
            /* ── SSO Flow ── */
            <div className="space-y-5 text-center">
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 p-4 rounded-xl text-sm font-medium">
                {ssoMessage}
              </div>
              <Button
                onClick={() => alert(`Redirecting to SAML 2.0 Identity Provider (${ssoProvider})...`)}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border-0 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:shadow-blue-500/30 hover:scale-[1.02] cursor-pointer"
              >
                Autenticar via {ssoProvider === 'ENTRA_ID' ? 'Microsoft Entra ID' : ssoProvider === 'GOOGLE_WORKSPACE' ? 'Google Workspace' : 'Portal Corporativo'}
              </Button>
              <button
                type="button"
                onClick={() => setIsSsoFlow(false)}
                className="text-sm text-slate-500 hover:text-slate-300 underline underline-offset-4 mt-2 block mx-auto transition-colors duration-200 cursor-pointer"
              >
                Tentar outro E-mail
              </button>
            </div>
          ) : (
            /* ── Login Form ── */
            <form onSubmit={handleSubmit(handleLogin)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-slate-300 text-sm font-medium">
                  Usuário / E-mail Corporativo
                </Label>
                <Input
                  id="username"
                  {...register("username")}
                  placeholder="Ex: @suaempresa.com.br"
                  autoFocus
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-11 rounded-xl focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-300"
                />
                {errors.username && (
                  <p className="text-xs text-rose-400 mt-1">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-11 rounded-xl focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-300"
                />
                {errors.password && (
                  <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 border-0 text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-purple-500/30 hover:scale-[1.02] rounded-xl mt-2 cursor-pointer disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Autenticando...
                  </span>
                ) : (
                  "Acessar Sistema"
                )}
              </Button>

              <div className="text-center text-xs text-slate-600 mt-4">
                Credenciais padrão: admin / 123
              </div>
            </form>
          )}
        </div>

        {/* Bottom Branding */}
        <p className="text-center text-[11px] text-slate-700 mt-6 tracking-wide">
          Powered by <span className="text-slate-500 font-medium">Neonorte</span> &middot; Plataforma Nexus
        </p>
      </div>
    </div>
  );
}


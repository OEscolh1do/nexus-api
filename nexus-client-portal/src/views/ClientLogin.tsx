import { useState } from 'react';
import { Lock, Search } from 'lucide-react';

interface ClientLoginProps {
    onLoginSuccess: (token: string, tenantId: string) => void;
}

export function ClientLogin({ onLoginSuccess }: ClientLoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Simulador estrito de Hashes Criptográficos para evitar envio de plain-text no client
    const hashPassword = async (pwd: string) => {
        const msgBuffer = new TextEncoder().encode(pwd);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Produz o digest seguro da senha submetida antes de enviar
            const pwdHash = await hashPassword(password);

            // Mock Client Auth flow conectando ao "Backend"
            setTimeout(() => {
                // Hash esperado para '123'
                const expectedClientHash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

                // Compara com a assinatura digital resgatada do Banco de Dados
                if (email === 'cliente@exemplo.com' && pwdHash === expectedClientHash) {
                    onLoginSuccess('mock-client-jwt-999', 'tenant_xyz_cliente_omega');
                } else {
                    setError('Credenciais inválidas.');
                    setLoading(false);
                }
            }, 1000);

        } catch (err) {
            setError('Falha de conexão com o servidor Nexus.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center flex-col items-center">
                    <div className="h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Search className="text-white w-8 h-8" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                        Portal do Cliente
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600">
                        Acompanhe o progresso do seu projeto - Neonorte Group
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-slate-100 relative overflow-hidden">

                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-blue-500"></div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                E-mail Corporativo
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                Senha de Acesso
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full pl-10 px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-100">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Acessando...' : 'Acessar Painel'}
                            </button>
                        </div>
                    </form>

                </div>
            </div>

            {/* Dev Hint */}
            <div className="text-center mt-8 text-xs text-slate-400">
                [Modo Dev] E-mail: cliente@exemplo.com / Senha: 123 (Em formato Hash)
            </div>
        </div>
    );
}

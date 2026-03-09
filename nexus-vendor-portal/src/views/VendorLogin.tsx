import { useState } from 'react';
import { Lock, ShieldCheck, Building2 } from 'lucide-react';

interface VendorLoginProps {
    onLoginSuccess: (token: string, vendorId: string) => void;
}

export function VendorLogin({ onLoginSuccess }: VendorLoginProps) {
    const [cnpj, setCnpj] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Simulador de criptografia (O backend Node.js usaria bcrypt/argon2 no banco)
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
            // Criptografa a senha antes de enviar para a API
            const pwdHash = await hashPassword(password);

            // In production, this points to the master Nexus API (e.g. api.nexus.neonorte.com/v1/vendor/auth)
            // Here doing a mock auth flow strictly for B2P
            setTimeout(() => {
                // Hash SHA-256 esperado no banco de dados para a senha '123'
                const expectedVendorHash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';

                // A verificação compara Hashes pelo backend, e nunca a senha real plain-text
                if (cnpj === '123' && pwdHash === expectedVendorHash) {
                    // Success: Pass token & vendor id up
                    onLoginSuccess('mock-vendor-jwt-777', 'v_777_empreiteira_alpha');
                } else {
                    setError('CNPJ ou senha inválida.');
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
                    <div className="h-16 w-16 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                        <Building2 className="text-white w-8 h-8" />
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                        Portal do Parceiro
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-600">
                        Acesso Restrito - Neonorte Group
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-slate-100 relative overflow-hidden">

                    {/* Security Banner */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="cnpj" className="block text-sm font-medium text-slate-700">
                                CNPJ da Empresa
                            </label>
                            <div className="mt-1">
                                <input
                                    id="cnpj"
                                    name="cnpj"
                                    type="text"
                                    required
                                    value={cnpj}
                                    onChange={(e) => setCnpj(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="00.000.000/0001-00"
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
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Autenticando...' : 'Entrar no Portal'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-slate-500 flex items-center gap-1">
                                    <ShieldCheck className="w-4 h-4 text-green-600" /> Conexão Segura B2B
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Dev Hint */}
            <div className="text-center mt-8 text-xs text-slate-400">
                [Modo Dev] CNPJ: 123 / Senha: 123
            </div>
        </div>
    );
}

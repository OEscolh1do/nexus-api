import React, { useEffect, useRef } from 'react';
import { useLogto } from '@logto/react';
import { useNavigate } from 'react-router-dom';
import { PatchLogBulletin } from '../components/PatchLogBulletin';
import changelogData from '../assets/changelog.json';

const LoginPage: React.FC = () => {
  const { signIn, isAuthenticated, isLoading, error } = useLogto();
  const navigate = useNavigate();
  const redirected = useRef(false);

  // ── Lógica Solar em Tempo Real ───────────────────────────────────────────
  const [timeState, setTimeState] = React.useState(() => {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;
    return { hours };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = now.getHours() + now.getMinutes() / 60;
      setTimeState({ hours });
    }, 60000); // Atualiza a cada minuto
    return () => clearInterval(timer);
  }, []);

  // Cálculo da Posição do Sol (Arco Parabólico)
  // 06:00 (Nascer) -> 18:00 (Pôr)
  const isDaylight = timeState.hours >= 6 && timeState.hours <= 18;
  const sunProgress = isDaylight ? (timeState.hours - 6) / 12 : 0;
  
  // Coordenadas para o arco (0% a 100% da largura, altura em parábola)
  const sunX = isDaylight ? sunProgress * 100 : -20; // Fora da tela à noite
  const sunY = isDaylight ? (1 - Math.sin(sunProgress * Math.PI)) * 50 + 10 : 120;

  // Definição de cores do céu baseado na hora
  const getSkyColors = () => {
    const h = timeState.hours;
    if (h >= 5 && h < 8) return { a: 'bg-orange-500/20', b: 'bg-indigo-900/40', c: 'bg-amber-500/10' }; // Amanhecer
    if (h >= 8 && h < 16) return { a: 'bg-emerald-600/20', b: 'bg-sky-500/15', c: 'bg-teal-500/10' };   // Dia
    if (h >= 16 && h < 19) return { a: 'bg-orange-600/25', b: 'bg-purple-900/30', c: 'bg-red-500/10' }; // Entardecer
    return { a: 'bg-slate-900/40', b: 'bg-indigo-950/50', c: 'bg-blue-900/20' };                      // Noite
  };
  const colors = getSkyColors();

  const isLogout = sessionStorage.getItem('just_logged_out') === 'true';

  useEffect(() => {
    if (isAuthenticated && !isLogout) {
      sessionStorage.removeItem('just_logged_out');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate, isLogout]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !error && !redirected.current && !isLogout) {
      redirected.current = true;
      signIn(`${window.location.origin}/callback`);
    }
  }, [isLoading, isAuthenticated, error, signIn, isLogout]);

  const handleSignIn = () => {
    sessionStorage.removeItem('just_logged_out');
    redirected.current = true;
    signIn(`${window.location.origin}/callback`);
  };

  const showActionScreen = error || isLogout;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#020617] selection:bg-emerald-500/30">

      {/* ── Sistema Solar Dinâmico ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        
        {/* Arco do Percurso (Linha Guia Sutil) */}
        <div className="absolute top-[10%] left-[-10%] w-[120%] h-[80%] border-t border-dashed border-white/5 rounded-[50%] opacity-20" />

        {/* O Sol — Monitoramento de Irradiância */}
        {isDaylight && (
          <div 
            className="absolute transition-all duration-[60000ms] ease-linear will-change-transform group/sun"
            style={{ left: `${sunX}%`, top: `${sunY}%`, transform: 'translate(-50%, -50%)' }}
          >
            {/* Brilho Atmosférico (Sutil) */}
            <div className="absolute w-48 h-48 bg-amber-500/5 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2 animate-pulse-slow" />
            
            {/* Interface de Monitoramento (Minimalista) */}
            <div className="relative flex items-center justify-center">
              {/* Círculo de Foco Sutil */}
              <div className="absolute w-16 h-16 border border-white/5 rounded-full opacity-40 group-hover/sun:opacity-100 transition-all duration-700" />
              
              {/* Núcleo Solar Refinado */}
              <div className="relative w-7 h-7 flex items-center justify-center">
                <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping opacity-10" style={{ animationDuration: '4s' }} />
                <div className="w-4 h-4 bg-gradient-to-br from-amber-200 to-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)] z-10" />
              </div>

              {/* Informações em Português */}
              <div className="absolute left-12 top-0 flex flex-col gap-0.5 whitespace-nowrap pointer-events-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-[7px] font-black text-amber-500/60 uppercase tracking-widest">Elevação:</span>
                  <span className="text-[8px] font-mono font-bold text-slate-300">{(90 - sunY).toFixed(0)}°</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[7px] font-black text-amber-500/60 uppercase tracking-widest">Posição:</span>
                  <span className="text-[8px] font-mono font-bold text-slate-300">{(sunX * 1.8).toFixed(0)}°</span>
                </div>
                <div className="mt-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-[1px]">
                  <span className="text-[6px] font-black text-emerald-400 uppercase tracking-[0.2em]">Irradiância Ativa</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Fundo: Orbs que mudam de cor conforme a hora ── */}
        <div
          className={`absolute rounded-full ${colors.a} blur-[160px] will-change-transform animate-orb-a transition-colors duration-1000`}
          style={{ width: '55vw', height: '55vw', top: '-15%', left: '-10%' }}
        />
        <div
          className={`absolute rounded-full ${colors.b} blur-[180px] will-change-transform animate-orb-b transition-colors duration-1000`}
          style={{ width: '65vw', height: '65vw', bottom: '-20%', right: '-15%' }}
        />
        <div
          className={`absolute rounded-full ${colors.c} blur-[140px] will-change-transform animate-orb-c transition-colors duration-1000`}
          style={{ width: '45vw', height: '45vw', top: '15%', left: '55%' }}
        />
      </div>
      {/* ── Grid de pontos ultra-sutil ── */}
      <div
        className="absolute inset-0 opacity-[0.018] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />

      {/* ── Cartão Central (Industrial Glass — Alinhado com Project Cards) ── */}
      <div className="z-10 flex flex-col items-center w-full max-w-sm mx-4 rounded-sm bg-[#0B0D13] border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-700 ease-out">
        
        {/* Header Decorativo (Estilo Industrial) */}
        <div className="w-full px-4 py-2 border-b border-slate-800/50 bg-slate-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-emerald-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Portal de Acesso // v{changelogData[0]?.version || '0.9.0'}</span>
          </div>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-slate-700" />
            <div className="w-1 h-1 bg-slate-700" />
          </div>
        </div>

        <div className="flex flex-col items-center w-full px-10 py-12">
          {/* Núcleo: Logo + Shockwaves de Respiração (Geometria Industrial) */}
          <div className="relative mb-10 flex items-center justify-center">

            {/* Shockwave externa — Quadrada, escala e opacidade (GPU only) */}
            <div
              className="absolute rounded-sm bg-emerald-500/10 will-change-transform animate-halo-outer"
              style={{ width: '130px', height: '130px' }}
            />
            {/* Shockwave interna — Quadrada, defasada */}
            <div
              className="absolute rounded-sm bg-emerald-400/15 will-change-transform animate-halo-inner"
              style={{ width: '100px', height: '100px' }}
            />

            {/* Casca da Logo (Industrial Shape) */}
            <div className="relative z-10 flex h-[72px] w-[72px] items-center justify-center rounded-sm bg-slate-950 border border-slate-800 shadow-xl group">
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <img
                src="/logos/simbolo-verde.png"
                alt="Neonorte"
                className="w-9 h-9 object-contain will-change-transform animate-logo-breathe"
              />
            </div>
          </div>

          {/* Texto */}
          <div className="text-center mb-10 w-full">
            <h1 className="text-[1.5rem] font-bold tracking-tight text-white mb-2 uppercase font-display">
              Bem-vindo ao{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">
                Kurupira
              </span>
            </h1>
            <div className="flex items-center justify-center gap-3 mt-1">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-800" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                Inteligência Solar
              </p>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-800" />
            </div>
          </div>

          {/* Área de Status */}
          <div className="w-full min-h-[130px] flex flex-col justify-center items-center">

            {!showActionScreen ? (
              <div className="flex flex-col items-center gap-5">
                {/* Spinner minimalista industrial */}
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 border border-slate-800" />
                  <div className="absolute inset-0 border-2 border-emerald-500 border-t-transparent animate-spin" style={{ animationDuration: '1s' }} />
                </div>
                <p className="text-[10px] font-black text-emerald-500/70 uppercase tracking-[0.3em] animate-pulse">
                  Inicializando ambiente...
                </p>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-5">

                {error && (
                  <div className="w-full rounded-sm bg-red-950/20 border border-red-500/30 px-5 py-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-3 bg-red-500" />
                      <span className="text-[9px] text-red-400 font-black tracking-widest uppercase">Falha de Sistema</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                      Não foi possível sincronizar sua identidade.
                    </p>
                    <p className="text-[9px] text-red-400/50 font-mono truncate border-t border-red-500/10 pt-2 mt-1">{error.message}</p>
                  </div>
                )}

                {isLogout && !error && (
                  <div className="w-full min-h-[40px]" />
                )}

                <button
                  onClick={handleSignIn}
                  className="group relative w-full overflow-hidden rounded-sm bg-emerald-600 text-slate-950 font-black text-[11px] uppercase tracking-[0.2em] py-4 transition-all duration-300 hover:bg-emerald-500 hover:shadow-[0_0_30_rgba(16,185,129,0.3)] active:scale-[0.98]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLogout ? 'Acessar Sistema' : 'Tentar Novamente'}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="transition-transform duration-300 group-hover:translate-x-1">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="absolute bottom-6 opacity-20">
        <span className="text-[10px] font-mono text-slate-400">
          Sistemas Neonorte © {new Date().getFullYear()}
        </span>
      </div>

      {/*
        ── Keyframes ──────────────────────────────────────────────────────────
        REGRA: apenas transform e opacity nos keyframes.
        Nenhuma propriedade que cause layout ou paint.
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Orbs de fundo — translação lentíssima, "flutuando" */
        @keyframes orb-a {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.7; }
          50%       { transform: translate(40px, -60px) scale(1.08); opacity: 1; }
        }
        @keyframes orb-b {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          50%       { transform: translate(-50px, 40px) scale(1.05); opacity: 0.9; }
        }
        @keyframes orb-c {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50%       { transform: translate(30px, 50px) scale(1.1); opacity: 0.8; }
        }
        .animate-orb-a { animation: orb-a 22s ease-in-out infinite; }
        .animate-orb-b { animation: orb-b 28s ease-in-out infinite; }
        .animate-orb-c { animation: orb-c 19s ease-in-out infinite; }

        /* Halo externo — bate devagar, como pressão se espalhando */
        @keyframes halo-outer {
          0%, 100% { transform: scale(0.82); opacity: 0; }
          40%, 60% { transform: scale(1.18); opacity: 1; }
        }
        .animate-halo-outer { animation: halo-outer 6s ease-in-out infinite; }

        /* Halo interno — defasado, respira junto mas com ritmo diferente */
        @keyframes halo-inner {
          0%, 100% { transform: scale(0.88); opacity: 0.3; }
          50%       { transform: scale(1.12); opacity: 0.8; }
        }
        .animate-halo-inner { animation: halo-inner 6s ease-in-out infinite -2s; }

        /* Logo — respira suavemente, acompanha os halos */
        @keyframes logo-breathe {
          0%, 100% { transform: scale(0.94); opacity: 0.85; }
          50%       { transform: scale(1.06); opacity: 1; }
        }
        .animate-logo-breathe { animation: logo-breathe 6s ease-in-out infinite; }

        /* Brilho Solar — pulsação lenta e atmosférica */
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          50%       { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
        }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
      `}} />

      {/* Engineering Bulletin (Patch Logs) */}
      <PatchLogBulletin />
    </div>
  );
};

export default LoginPage;

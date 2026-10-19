'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Phone, Lock, User, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

type AuthMode = 'login' | 'activate' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Activation step state
  const [activationStep, setActivationStep] = useState<1 | 2>(1);
  const [invitedUser, setInvitedUser] = useState<{
    name: string;
    groups: string[];
    organizers: string[];
    isActivated: boolean;
  } | null>(null);

  const handleLoginOrRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const body = mode === 'register' ? { phone, name, password } : { phone, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ocurrió un error al verificar credenciales.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Error de conexión con la estafeta central.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1 of activation: lookup invitation
  const handleCheckInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, action: 'check' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se localizó invitación para este teléfono.');
      } else {
        setInvitedUser(data);
        setActivationStep(2);
      }
    } catch {
      setError('Error de conexión al verificar el teléfono.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 of activation: set own password
  const handleConfirmActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, action: 'activate' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al guardar tu contraseña.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Error de conexión al activar tu cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setActivationStep(1);
    setInvitedUser(null);
  };

  return (
    <div
      className="min-h-dvh min-h-screen relative flex flex-col justify-center py-6 sm:py-12 px-3 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat overflow-x-hidden"
      style={{ backgroundImage: "url('/login-bg.webp')" }}
    >
      {/* Atmospheric vignette & dark overlay to ensure readability */}
      <div className="absolute inset-0 bg-[#07100d]/75 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(7,16,13,0.35)_0%,rgba(5,11,9,0.85)_100%)] pointer-events-none" />

      <div className="relative z-10 w-full sm:mx-auto sm:max-w-md">
        {/* Header emblem */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex w-20 h-20 sm:w-24 sm:h-24 rounded-2xl items-center justify-center shadow-2xl bg-[#12201b]/90 border border-[#2e4d3c] mb-3 sm:mb-4 animate-in zoom-in-75 duration-300 p-2 group hover:border-[#e4be77]/60 transition-all">
            <Image src="/logo-icon.svg" alt="Amigo Invisible Mascot" width={96} height={96} className="w-full h-full object-contain filter drop-shadow-lg" priority />
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#f5f2eb] tracking-tight drop-shadow-md">
            Amigo Secreto
          </h1>
          <p className="font-mono text-[10px] sm:text-xs text-[#a0b5a9] tracking-widest uppercase mt-1 sm:mt-1.5 drop-shadow-sm font-semibold">
            ESTAFETA CENTRAL DE CORREOS CONFIDENCIALES
          </p>
        </div>

        {/* Ledger Card */}
        <div className="bg-[#12201b]/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border-2 border-[#2b4437] shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-5 sm:p-9 relative overflow-hidden">
          {/* Subtle top brass accent line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#d4a359]/60 to-transparent" />

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-3 bg-[#0a1310] p-1 rounded-xl mb-6 border border-[#1b2f26] gap-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2 px-1 font-mono text-[10px] sm:text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center leading-tight ${
                mode === 'login'
                  ? 'bg-[#1b2f26] text-[#e4be77] shadow-sm border border-[#304d3f]'
                  : 'text-[#6e8477] hover:text-[#ded8cb]'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => switchMode('activate')}
              className={`py-2 px-1 font-mono text-[10px] sm:text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center leading-tight ${
                mode === 'activate'
                  ? 'bg-[#1b2f26] text-[#e4be77] shadow-sm border border-[#304d3f]'
                  : 'text-[#6e8477] hover:text-[#ded8cb]'
              }`}
            >
              Activar Cuenta
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-2 px-1 font-mono text-[10px] sm:text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center leading-tight ${
                mode === 'register'
                  ? 'bg-[#1b2f26] text-[#e4be77] shadow-sm border border-[#304d3f]'
                  : 'text-[#6e8477] hover:text-[#ded8cb]'
              }`}
            >
              Nuevo Registro
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-[#2a1315] border border-[#7f1d1d] text-xs font-mono text-rose-300">
              {error}
            </div>
          )}

          {/* 1. LOGIN / REGISTER FORM */}
          {(mode === 'login' || mode === 'register') && (
            <form onSubmit={handleLoginOrRegister} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-[#9db2a6] mb-1.5">
                    Nombre o Identificador
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5e7769]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Carlos García"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0a1310] border border-[#21372c] rounded-xl text-base sm:text-sm text-[#f2efe9] placeholder-[#4d6356] focus:outline-hidden focus:border-[#d4a359] focus:ring-1 focus:ring-[#d4a359]/30 transition-all font-sans"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#9db2a6] mb-1.5">
                  Número de Teléfono
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5e7769]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej. 612345678"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0a1310] border border-[#21372c] rounded-xl text-base sm:text-sm text-[#f2efe9] placeholder-[#4d6356] focus:outline-hidden focus:border-[#d4a359] focus:ring-1 focus:ring-[#d4a359]/30 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#9db2a6] mb-1.5">
                  Contraseña Secreta
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5e7769]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0a1310] border border-[#21372c] rounded-xl text-base sm:text-sm text-[#f2efe9] placeholder-[#4d6356] focus:outline-hidden focus:border-[#d4a359] focus:ring-1 focus:ring-[#d4a359]/30 transition-all font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 bg-[#b91c1c] hover:bg-[#a11818] text-[#fef2f2] font-mono text-xs uppercase tracking-widest font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-red-950/40 border border-red-400/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {loading
                    ? 'Verificando...'
                    : mode === 'register'
                    ? 'Confirmar Registro'
                    : 'Acceder al Gabinete'}
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {mode === 'login' && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => switchMode('activate')}
                    className="font-mono text-xs text-[#d4a359] hover:underline cursor-pointer"
                  >
                    ¿Te ha añadido un organizador? Activa tu cuenta aquí →
                  </button>
                </div>
              )}
            </form>
          )}

          {/* 2. ACTIVATION FORM (FOR PRE-REGISTERED INVITEES) */}
          {mode === 'activate' && (
            <div>
              {activationStep === 1 ? (
                <form onSubmit={handleCheckInvitation} className="space-y-4">
                  <div className="bg-[#182a22] border border-[#2d4d3d] rounded-2xl p-4 text-xs font-mono text-[#ded8cb] leading-relaxed">
                    <p className="flex items-center gap-1.5 font-bold text-[#e4be77] mb-1">
                      <Sparkles className="w-4 h-4 text-[#d4a359]" />
                      Activación para Invitados
                    </p>
                    <p className="text-[#8ba395]">
                      Si tu organizador te dio de alta con tu teléfono y nombre, introduce tu número para reclamar tu despacho y elegir tu propia contraseña.
                    </p>
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-[#9db2a6] mb-1.5">
                      Tu Número de Teléfono
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5e7769]">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej. 612345678"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0a1310] border border-[#21372c] rounded-xl text-base sm:text-sm text-[#f2efe9] placeholder-[#4d6356] focus:outline-hidden focus:border-[#d4a359] font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !phone.trim()}
                    className="w-full mt-2 bg-[#1c3328] hover:bg-[#254234] text-[#e4be77] font-mono text-xs uppercase tracking-widest font-bold py-3.5 px-4 rounded-xl border border-[#375a47] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    <span>{loading ? 'Consultando Censo...' : 'Comprobar mi Invitación'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* Step 2: Found! Now set own password */
                <form onSubmit={handleConfirmActivation} className="space-y-4 animate-in fade-in zoom-in-95">
                  <div className="bg-[#153427] border border-[#235840] rounded-2xl p-4 text-xs font-mono text-emerald-200 leading-relaxed">
                    <p className="flex items-center gap-1.5 font-bold text-emerald-300 text-sm mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      ¡Ficha localizada, {invitedUser?.name}!
                    </p>
                    <p className="text-emerald-100/80">
                      Has sido invitado a:{' '}
                      <strong className="text-white">
                        {invitedUser?.groups.join(', ') || 'tu grupo'}
                      </strong>
                      . Define ahora tu contraseña secreta para entrar.
                    </p>
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-[#9db2a6] mb-1.5">
                      Crea tu Contraseña Secreta
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5e7769]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0a1310] border border-[#21372c] rounded-xl text-base sm:text-sm text-[#f2efe9] placeholder-[#4d6356] focus:outline-hidden focus:border-[#d4a359] font-sans"
                      />
                    </div>
                    <span className="font-mono text-[10px] text-[#6e877a] mt-1 block">
                      Mínimo 4 caracteres. La usarás para entrar siempre que quieras.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || password.length < 4}
                    className="w-full mt-2 bg-[#b91c1c] hover:bg-[#a11818] text-[#fef2f2] font-mono text-xs uppercase tracking-widest font-bold py-3.5 px-4 rounded-xl shadow-lg border border-red-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    <span>{loading ? 'Activando...' : 'Establecer Contraseña y Entrar'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivationStep(1)}
                    className="w-full text-center font-mono text-xs text-[#7e978b] hover:text-[#ded8cb] pt-1 cursor-pointer"
                  >
                    ← Cambiar de número
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Archival guarantee note */}
          <div className="mt-6 pt-5 border-t border-[#1b2f26] text-center">
            <p className="font-mono text-[10px] text-[#698073] flex items-center justify-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#d4a359]" />
              Canales sellados · Sorteos matemáticos sin filtraciones
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

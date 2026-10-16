import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ClubCategory, CLUB_CATEGORIES } from '../../types/football';
import { UserRole } from '../../types/auth';
import { 
  Shield, 
  LogIn, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Mail, 
  User, 
  Briefcase, 
  FolderGit2,
  ChevronRight,
  Sparkles,
  Lock
} from 'lucide-react';

const ROLE_OPTIONS: UserRole[] = [
  'Director Técnico',
  'Ayudante Técnico',
  'Preparador Físico',
  'Preparador de Arqueros',
  'Kinesiólogo',
  'Coordinador General',
  'Analista Táctico'
];

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-amber-500',
  'bg-blue-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-orange-600'
];

interface LoginScreenProps {
  onLoginSuccess?: (category?: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { login, registerUser, quickLogin, users } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Director Técnico');
  const [regCategory, setRegCategory] = useState<ClubCategory | 'Todas'>('Sub 14');
  const [regPhone, setRegPhone] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = login(identifier, password);
    if (!res.success) {
      setError(res.error || 'Credenciales inválidas');
      return;
    }

    const matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === identifier.trim().toLowerCase() ||
        u.name.toLowerCase() === identifier.trim().toLowerCase()
    );

    if (onLoginSuccess && matchedUser) {
      onLoginSuccess(matchedUser.category);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const res = registerUser({
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      category: regCategory,
      avatarColor: randomColor,
      phone: regPhone
    });

    if (!res.success) {
      setError(res.error || 'Error al crear la cuenta');
      return;
    }

    if (onLoginSuccess) {
      onLoginSuccess(regCategory);
    }
  };

  const handleQuickLogin = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    quickLogin(userId);
    if (onLoginSuccess && user) {
      onLoginSuccess(user.category);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="w-full max-w-md text-center mb-6 z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/20 ring-4 ring-amber-300/30 border-2 border-slate-950 mb-4 transition-transform hover:scale-105 duration-200">
          SLQ
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          San Luis de Quillota
        </h1>
        <p className="text-sm font-semibold text-amber-400 mt-1 uppercase tracking-wider">
          Fútbol Joven y Formativo
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Sistema de Planillas, Pizarra Táctica y Base de Datos por Categoría
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 z-10">
        {/* Toggle Mode Tabs */}
        <div className="flex bg-slate-950/70 p-1 rounded-xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Ingresar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Crear Usuario
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Usuario o Correo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ej: dt.sub14@sanluis.cl o Marcelo Bravo"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer hover:scale-[1.01]"
            >
              <LogIn className="w-4 h-4" />
              Entrar al Sistema
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Nombre y Apellido
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="ej: Prof. Carlos Muñoz"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Cargo / Rol
                </label>
                <div className="relative">
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full py-2 px-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1 uppercase tracking-wider">
                  Categoría
                </label>
                <select
                  value={regCategory}
                  onChange={(e) => setRegCategory(e.target.value as ClubCategory | 'Todas')}
                  className="w-full py-2 px-3 bg-slate-950 border border-amber-400/50 rounded-xl text-xs font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="Todas">Todas (Coordinador)</option>
                  {CLUB_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Correo o Nombre de Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ej: dt.sub15@sanluis.cl o cmunoz"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Crea una contraseña"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer hover:scale-[1.01]"
            >
              <UserPlus className="w-4 h-4" />
              Crear Cuenta y Entrar
            </button>
          </form>
        )}

        {/* QUICK ACCESS BAR FOR COACHES */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Acceso Rápido por Técnico
            </span>
            <span className="text-[10px] text-slate-500">1-clic directo</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {users.slice(0, 6).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickLogin(u.id)}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800/80 hover:border-amber-400/40 text-left transition-all cursor-pointer group"
              >
                <div className={`w-7 h-7 rounded-lg ${u.avatarColor} text-white font-black text-xs flex items-center justify-center shrink-0`}>
                  {u.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate group-hover:text-amber-300">
                    {u.name}
                  </p>
                  <p className="text-[10px] text-amber-400 font-semibold truncate">
                    {u.category !== 'Todas' ? u.category : u.role}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Preset hint footer */}
          <div className="mt-3.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 text-[11px] text-slate-400 flex items-start gap-2">
            <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-300 font-medium">Cuentas creadas: </span>
              <span className="text-amber-300 font-mono">dt.sub14@sanluis.cl</span> (clave: <span className="font-mono">sub14</span>), 
              <span className="text-amber-300 font-mono"> dt.sub16@sanluis.cl</span> (clave: <span className="font-mono">sub16</span>), 
              <span className="text-amber-300 font-mono"> coordinacion@sanluis.cl</span> (clave: <span className="font-mono">sanluis2026</span>).
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-6 text-center text-xs text-slate-600 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-amber-500/60" />
        <span>San Luis de Quillota S.A.D.P. • Cantera Canaria 2026</span>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CategoryGroup, UserRole } from '../../types/auth';
import { SanLuisLogo } from '../Common/SanLuisLogo';
import { 
  Shield, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  Mail, 
  User, 
  Briefcase, 
  Lock,
  Sparkles
} from 'lucide-react';

const ROLE_OPTIONS: UserRole[] = [
  'Coordinador General',
  'Director Técnico',
  'Ayudante Técnico',
  'Preparador Físico',
  'Preparador de Arqueros',
  'Kinesiólogo',
  'Analista Táctico'
];

interface LoginScreenProps {
  onLoginSuccess?: (category?: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { login, registerUser, users, isAuthReady } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Coordinador General');
  const [regCategory, setRegCategory] = useState<CategoryGroup>('Todas');
  const [regPhone, setRegPhone] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await login(identifier, password);
      if (!res.success) {
        setError(res.error || 'Credenciales inválidas');
        return;
      }

      const cleanId = identifier.trim().toLowerCase();
      const foundUser = users.find(
        (u) =>
          u.email.toLowerCase() === cleanId ||
          u.name.toLowerCase() === cleanId ||
          u.id.toLowerCase() === cleanId
      );

      if (onLoginSuccess && foundUser) {
        onLoginSuccess(foundUser.category);
      }
    } catch (err: any) {
      setError(err?.message || 'Error de conexión al ingresar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regPassword) {
      setError('Por favor define una contraseña para la cuenta');
      return;
    }

    setIsSubmitting(true);
    try {
      const colors = ['bg-amber-500', 'bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-rose-600', 'bg-teal-600'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const res = await registerUser({
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
    } catch (err: any) {
      setError(err?.message || 'Error al registrar el usuario en la nube');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header with Official Club Emblem */}
      <div className="w-full max-w-md text-center mb-6 z-10 flex flex-col items-center">
        <SanLuisLogo className="w-24 h-28 mb-3 hover:scale-105 transition-transform duration-200" />
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
          San Luis de Quillota
        </h1>
        <p className="text-xs sm:text-sm font-bold text-amber-400 mt-1 uppercase tracking-wider">
          Fútbol Joven y Formativo • Temporada 2026
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Plataforma de Planillas Oficiales, Planificación y Estadísticas
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

        {/* First User Welcome Hint */}
        {users.length === 0 && (
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold">Comienza desde cero:</p>
              <p className="text-slate-300 text-[11px] mt-0.5">
                Crea tu primera cuenta de Coordinador General o Director Técnico para acceder al sistema.
              </p>
            </div>
          </div>
        )}

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
                  placeholder="Tu correo o nombre de usuario"
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
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer hover:scale-[1.01]"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Verificando con la nube...' : 'Entrar al Sistema'}</span>
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
                  placeholder="ej: Juan Pérez"
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
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setRegRole(newRole);
                      if (newRole === 'Coordinador General') {
                        setRegCategory('Todas');
                      }
                    }}
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
                  onChange={(e) => setRegCategory(e.target.value as CategoryGroup)}
                  className="w-full py-2 px-3 bg-slate-950 border border-amber-400/50 rounded-xl text-xs font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="Todas">Todas (Coordinador General)</option>
                  <option value="Sub 11-12">Sub 11 - 12 (Infantil Inicial)</option>
                  <option value="Sub 13-14">Sub 13 - 14 (Infantil / Formativa)</option>
                  <option value="Sub 15-16">Sub 15 - 16 (Cadetes / Juvenil Inicial)</option>
                  <option value="Sub 18">Sub 18 (Proyección)</option>
                  <option value="Sub 20">Sub 20 (Reserva / Proyección)</option>
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
                  placeholder="ej: dt.infantil@sanluis.cl o jperez"
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
                  placeholder="Define tu contraseña"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Teléfono de Contacto (opcional)
              </label>
              <input
                type="text"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="+56 9 ..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer hover:scale-[1.01]"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando en la nube...' : 'Crear Cuenta e Iniciar'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Footer Branding */}
      <div className="mt-6 text-center text-xs text-slate-600 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-amber-500/60" />
        <span>San Luis de Quillota S.A.D.P. • Cantera Canaria 2026</span>
      </div>
    </div>
  );
};

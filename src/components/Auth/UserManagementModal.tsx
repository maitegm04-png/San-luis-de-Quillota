import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFootball } from '../../context/FootballContext';
import { CLUB_CATEGORIES, ClubCategory } from '../../types/football';
import { UserRole } from '../../types/auth';
import { 
  X, 
  Users, 
  UserPlus, 
  Trash2, 
  Check, 
  LogOut, 
  Shield, 
  UserCheck, 
  Mail, 
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface UserManagementModalProps {
  onClose: () => void;
}

const ROLE_OPTIONS: UserRole[] = [
  'Director Técnico',
  'Ayudante Técnico',
  'Preparador Físico',
  'Preparador de Arqueros',
  'Kinesiólogo',
  'Coordinador General',
  'Analista Táctico'
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ onClose }) => {
  const { currentUser, users, quickLogin, registerUser, deleteUser, logout } = useAuth();
  const { setActiveCategory } = useFootball();

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Director Técnico');
  const [category, setCategory] = useState<ClubCategory | 'Todas'>('Sub 14');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSwitchUser = (userId: string, userCat: string) => {
    quickLogin(userId);
    if (userCat && userCat !== 'Todas') {
      setActiveCategory(userCat);
    } else {
      setActiveCategory('all');
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const colors = ['bg-emerald-600', 'bg-blue-600', 'bg-amber-500', 'bg-purple-600', 'bg-rose-600', 'bg-teal-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const res = registerUser({
      name,
      email,
      password,
      role,
      category,
      avatarColor: randomColor,
      phone
    });

    if (!res.success) {
      setError(res.error || 'Error al crear usuario');
      return;
    }

    if (category !== 'Todas') {
      setActiveCategory(category);
    }

    setIsAdding(false);
    setName('');
    setEmail('');
    setPassword('');
  };

  const handleDelete = (userId: string, userName: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el usuario de ${userName}?`)) {
      const res = deleteUser(userId);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Gestión de Usuarios y Cuerpos Técnicos
              </h2>
              <p className="text-xs text-slate-400">
                Usuarios con acceso a las planillas y bases de datos del club
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Active User Card */}
          {currentUser && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-800/60 to-slate-800/40 border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${currentUser.avatarColor} text-white font-black text-lg flex items-center justify-center shadow-md`}>
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Sesión Activa
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {currentUser.role} • Categoría: <strong className="text-amber-400">{currentUser.category}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400">{currentUser.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer self-start sm:self-center"
              >
                <LogOut className="w-3.5 h-3.5" />
                Cerrar Sesión
              </button>
            </div>
          )}

          {/* Add User Toggle & Form */}
          {!isAdding ? (
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Usuarios Registrados ({users.length})
              </h3>
              <button
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors cursor-pointer shadow-md"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Crear Nuevo Usuario
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateUser} className="p-4 rounded-xl bg-slate-950 border border-amber-400/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  Nuevo Usuario del Cuerpo Técnico
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej: Juan Pérez"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Cargo / Rol</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ClubCategory | 'Todas')}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-amber-400 font-bold"
                  >
                    <option value="Todas">Todas (Coordinador)</option>
                    {CLUB_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Correo / Usuario</label>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ej: dt.sub15@sanluis.cl"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Clave de acceso"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Teléfono (opcional)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+56 9 ..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg cursor-pointer"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          )}

          {/* Users List */}
          <div className="space-y-2">
            {users.map((u) => {
              const isCurrent = currentUser?.id === u.id;
              return (
                <div
                  key={u.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    isCurrent
                      ? 'bg-slate-800/80 border-amber-400/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl ${u.avatarColor} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                      {u.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white truncate">
                          {u.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                          {u.category}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-black text-emerald-400">
                            (Actual)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{u.role}</span>
                        <span>•</span>
                        <span className="truncate">{u.email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleSwitchUser(u.id, u.category)}
                        className="px-2.5 py-1 text-[11px] font-bold text-amber-400 hover:text-slate-950 bg-amber-400/10 hover:bg-amber-400 border border-amber-400/30 rounded-lg transition-colors cursor-pointer"
                      >
                        Cambiar a este DT
                      </button>
                    )}
                    {users.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDelete(u.id, u.name)}
                        title="Eliminar usuario"
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs text-slate-400">
          <span>Cada usuario puede entrar directamente y filtrar su categoría.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

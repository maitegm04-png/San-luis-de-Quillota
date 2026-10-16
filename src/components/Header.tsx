import React from 'react';
import { useFootball } from '../context/FootballContext';
import { 
  Users, 
  FileSpreadsheet, 
  Trophy, 
  LayoutDashboard, 
  Plus, 
  Settings, 
  Shield, 
  Download,
  Upload,
  Calendar,
  LogOut,
  UserCheck,
  Cloud
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllowedCategories } from '../types/auth';
import { SanLuisLogo } from './Common/SanLuisLogo';
import { FirebaseQuotaBadge } from './Common/FirebaseQuotaBadge';

export type ActiveTab = 'matches' | 'players' | 'tactics' | 'stats' | 'planning';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewMatch: () => void;
  onOpenNewPlayer: () => void;
  onOpenSettings: () => void;
  onOpenUsers?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewMatch,
  onOpenNewPlayer,
  onOpenSettings,
  onOpenUsers,
}) => {
  const { clubInfo, exportDatabaseJson, importDatabaseJson, matches, activeCategory, setActiveCategory, getCategoryStaff } = useFootball();
  const { currentUser, logout } = useAuth();

  const isCoordinator = currentUser?.role === 'Coordinador General' || currentUser?.category === 'Todas';
  const allowedCategories = getAllowedCategories(currentUser?.category);

  // If regular DT and active category is not in their allowed scope, reset to their assigned group
  React.useEffect(() => {
    if (!isCoordinator && currentUser?.category) {
      const isAllowed = allowedCategories.includes(activeCategory as any) || activeCategory === currentUser.category;
      if (!isAllowed) {
        setActiveCategory(currentUser.category);
      }
    }
  }, [currentUser?.category, activeCategory, isCoordinator, allowedCategories, setActiveCategory]);

  const categoryOptions = React.useMemo(() => {
    if (isCoordinator) {
      return [
        { id: 'all', label: 'Ver Todas' },
        { id: 'Sub 11-12', label: 'Sub 11-12' },
        { id: 'Sub 11', label: 'Sub 11' },
        { id: 'Sub 12', label: 'Sub 12' },
        { id: 'Sub 13-14', label: 'Sub 13-14' },
        { id: 'Sub 13', label: 'Sub 13' },
        { id: 'Sub 14', label: 'Sub 14' },
        { id: 'Sub 15-16', label: 'Sub 15-16' },
        { id: 'Sub 15', label: 'Sub 15' },
        { id: 'Sub 16', label: 'Sub 16' },
        { id: 'Sub 18', label: 'Sub 18' },
        { id: 'Sub 20', label: 'Sub 20' },
      ];
    }

    if (currentUser?.category === 'Sub 11-12') {
      return [
        { id: 'Sub 11-12', label: 'Ambas (Sub 11-12)' },
        { id: 'Sub 11', label: 'Sub 11' },
        { id: 'Sub 12', label: 'Sub 12' },
      ];
    }
    if (currentUser?.category === 'Sub 13-14') {
      return [
        { id: 'Sub 13-14', label: 'Ambas (Sub 13-14)' },
        { id: 'Sub 13', label: 'Sub 13' },
        { id: 'Sub 14', label: 'Sub 14' },
      ];
    }
    if (currentUser?.category === 'Sub 15-16') {
      return [
        { id: 'Sub 15-16', label: 'Ambas (Sub 15-16)' },
        { id: 'Sub 15', label: 'Sub 15' },
        { id: 'Sub 16', label: 'Sub 16' },
      ];
    }
    if (currentUser?.category === 'Sub 18') {
      return [
        { id: 'Sub 18', label: 'Categoría Sub 18' },
      ];
    }
    if (currentUser?.category === 'Sub 20') {
      return [
        { id: 'Sub 20', label: 'Categoría Sub 20' },
      ];
    }

    return allowedCategories.map((c) => ({ id: c, label: c }));
  }, [isCoordinator, currentUser?.category, allowedCategories]);

  const nextMatch = matches.find((m) => m.status === 'scheduled');
  const liveMatch = matches.find((m) => m.status === 'live');
  const activeStaff = getCategoryStaff(activeCategory);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-xl">
      {/* Top Banner / Club Profile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Club Identity */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-950 p-1 flex items-center justify-center shadow-lg ring-2 ring-amber-400/50 border border-slate-800">
              <SanLuisLogo className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  {clubInfo.name}
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  {activeCategory !== 'all' ? activeCategory : clubInfo.category}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Cloud className="w-3 h-3 text-emerald-400" />
                  Nube Firebase
                </span>
                {liveMatch && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    En Directo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                <span>
                  DT {activeCategory !== 'all' ? activeCategory : ''}: <strong className="text-amber-300">{activeStaff.coach}</strong>
                </span>
                <span>•</span>
                <span>Ayudante: <strong className="text-slate-300">{activeStaff.assistantCoach}</strong></span>
                <span>•</span>
                <span>Temporada: <strong className="text-slate-300">{clubInfo.season}</strong></span>
                <span>•</span>
                <span className="text-slate-400 hidden lg:inline">{clubInfo.stadium}</span>
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <FirebaseQuotaBadge compact />

            {/* Respaldar JSON */}
            <button
              onClick={exportDatabaseJson}
              title="Descargar copia de seguridad en JSON para transferir a otra URL o usuario"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Respaldar</span>
            </button>

            {/* Importar JSON */}
            <label
              title="Cargar archivo JSON de respaldo para actualizar jugadores y planillas en esta URL"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 hover:text-white bg-amber-400/10 hover:bg-amber-400/20 rounded-lg border border-amber-400/40 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Importar</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const content = event.target?.result as string;
                    if (content) {
                      const success = importDatabaseJson(content);
                      if (success) {
                        alert('¡Datos transferidos con éxito! Los futbolistas, planillas y configuraciones se actualizaron en esta URL.');
                      } else {
                        alert('El archivo no tiene el formato JSON válido.');
                      }
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
            </label>

            <button
              onClick={onOpenSettings}
              title="Configuración del Club"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Club</span>
            </button>

            <button
              onClick={onOpenNewPlayer}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 rounded-lg border border-emerald-800/80 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Jugador</span>
            </button>

            <button
              onClick={onOpenNewMatch}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md shadow-amber-950/40 transition-colors cursor-pointer font-black"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Planilla</span>
            </button>

            {/* User Profile & Switcher */}
            {currentUser && (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
                <button
                  type="button"
                  onClick={onOpenUsers}
                  title={`Usuario activo: ${currentUser.name} (${currentUser.category}) - Clic para cambiar de técnico o crear usuario`}
                  className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 rounded-lg text-white transition-colors cursor-pointer group"
                >
                  <div className={`w-5 h-5 rounded-md ${currentUser.avatarColor} text-white font-black text-[10px] flex items-center justify-center shrink-0`}>
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block max-w-[110px]">
                    <div className="text-[11px] font-bold leading-tight truncate text-amber-300 group-hover:text-amber-200">
                      {currentUser.name.split(' ')[0]}
                    </div>
                    <div className="text-[9px] text-slate-400 leading-tight truncate">
                      {currentUser.category !== 'Todas' ? currentUser.category : currentUser.role}
                    </div>
                  </div>
                  <Users className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={logout}
                  title="Cerrar Sesión"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Global Category Selector Bar */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                Categoría:
              </span>
            </div>
            {categoryOptions.map((opt) => {
              const isCurrent = activeCategory === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setActiveCategory(opt.id)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-950/50 ring-1 ring-amber-300 scale-105'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/90'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="text-slate-500">Filtrando:</span>
            <span className="font-extrabold text-amber-300">
              {activeCategory === 'all' ? 'Todas las series' : `Categoría ${activeCategory}`}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 truncate max-w-xs">
              DT: <span className="text-slate-200 font-semibold">{activeStaff.coach}</span>
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 mt-3 pt-2 border-t border-slate-800/80 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'matches'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Planillas de Partido</span>
            {matches.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'matches' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-800 text-slate-300'
              }`}>
                {matches.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'players'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Base de Datos Jugadores</span>
          </button>

          <button
            onClick={() => setActiveTab('tactics')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'tactics'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Pizarra Táctica</span>
          </button>

          <button
            onClick={() => setActiveTab('planning')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'planning'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Planificación por Categorías</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
              Áreas
            </span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Estadísticas del Club</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

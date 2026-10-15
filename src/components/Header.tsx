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
  Calendar
} from 'lucide-react';

export type ActiveTab = 'matches' | 'players' | 'tactics' | 'stats';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewMatch: () => void;
  onOpenNewPlayer: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewMatch,
  onOpenNewPlayer,
  onOpenSettings,
}) => {
  const { clubInfo, exportDatabaseJson, matches } = useFootball();

  const nextMatch = matches.find((m) => m.status === 'scheduled');
  const liveMatch = matches.find((m) => m.status === 'live');

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-xl">
      {/* Top Banner / Club Profile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Club Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg ring-2 ring-amber-300/40 border border-slate-950">
              SLQ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  {clubInfo.name}
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  {clubInfo.category}
                </span>
                {liveMatch && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    En Directo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                <span>DT: <strong className="text-amber-300">{clubInfo.coachStaff?.coach || 'Cuerpo Técnico'}</strong></span>
                <span>•</span>
                <span>Temporada: <strong className="text-slate-300">{clubInfo.season}</strong></span>
                <span>•</span>
                <span className="text-slate-400">{clubInfo.stadium}</span>
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <button
              onClick={exportDatabaseJson}
              title="Descargar copia de seguridad en JSON"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Respaldar</span>
            </button>

            <button
              onClick={onOpenSettings}
              title="Configuración del Club"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Club</span>
            </button>

            <button
              onClick={onOpenNewPlayer}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 rounded-lg border border-emerald-800/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Jugador</span>
            </button>

            <button
              onClick={onOpenNewMatch}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md shadow-emerald-900/40 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Planilla</span>
            </button>
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

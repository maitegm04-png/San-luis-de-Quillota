import React, { useState } from 'react';
import { MatchCompetition, MatchSheet, MatchStatus } from '../../types/football';
import { useFootball } from '../../context/FootballContext';
import { MatchDetail } from './MatchDetail';
import { 
  FileSpreadsheet, 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Shield, 
  ChevronRight, 
  Trophy,
  Activity,
  CheckCircle2
} from 'lucide-react';

interface MatchListProps {
  onOpenNewMatch: () => void;
}

export const MatchList: React.FC<MatchListProps> = ({ onOpenNewMatch }) => {
  const { matches, selectedMatchId, setSelectedMatchId, clubInfo } = useFootball();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [competitionFilter, setCompetitionFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredMatches = matches.filter((m) => {
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesComp = competitionFilter === 'all' || m.competition === competitionFilter;
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesStatus && matchesComp && matchesCategory;
  });

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-400" />
              Gestión de Planillas y Actas de Partido
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              San Luis de Quillota • Control de partidos, alineaciones, actas oficiales y estadísticas colectivas para Fútbol Joven.
            </p>
          </div>

          <button
            onClick={onOpenNewMatch}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950/40 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Planilla</span>
          </button>
        </div>

        {/* Filter buttons */}
        <div className="space-y-2 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-bold mr-1">Categoría:</span>
            {['all', 'Sub 11', 'Sub 12', 'Sub 13', 'Sub 14', 'Sub 15', 'Sub 16', 'Sub 18', 'Sub 20'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  categoryFilter === cat
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat === 'all' ? 'Todas las Categorías' : cat}
              </button>
            ))}
          </div>

          {/* Status & Competition Filter */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-slate-500 font-semibold mr-1">Estado:</span>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'scheduled', label: 'Próximos' },
              { id: 'live', label: 'En Directo' },
              { id: 'finished', label: 'Finalizados' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setStatusFilter(item.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  statusFilter === item.id
                    ? 'bg-slate-200 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}

            <span className="text-slate-500 font-semibold ml-2 mr-1">Competición:</span>
            {['all', 'Liga', 'Copa', 'Amistoso'].map((comp) => (
              <button
                key={comp}
                onClick={() => setCompetitionFilter(comp)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  competitionFilter === comp
                    ? 'bg-slate-200 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {comp === 'all' ? 'Todas' : comp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Matches list on left / Selected Match Sheet on Right (or full responsive view) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Matches Selector Column (4 cols on wide screens) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Partidos Registrados ({filteredMatches.length})
          </h3>

          {filteredMatches.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-xs text-slate-400">
              No hay partidos con los filtros seleccionados.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredMatches.map((m) => {
                const isSelected = selectedMatch?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMatchId(m.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-slate-900 border-emerald-500/80 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {m.competition} • {m.matchDay}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.2 rounded-full ${
                        m.status === 'live'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                          : m.status === 'finished'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}>
                        {m.status === 'live' ? 'En Directo' : m.status === 'finished' ? 'Finalizado' : 'Programado'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-sm">
                        {m.isHome ? clubInfo.shortName : m.opponent}
                        <span className="text-slate-500 mx-1.5">vs</span>
                        {m.isHome ? m.opponent : clubInfo.shortName}
                      </div>

                      {/* Score badge */}
                      {m.status !== 'scheduled' ? (
                        <span className="font-black text-sm text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {m.homeScore} - {m.awayScore}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {m.time}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-400" />
                        {m.date}
                      </span>
                      <span className="text-slate-400">
                        {m.startingEleven.length}/11 Titulares ({m.formation})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Match Sheet Detail (8 cols on wide screens) */}
        <div className="lg:col-span-8">
          {selectedMatch ? (
            <MatchDetail match={selectedMatch} />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
              <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Selecciona una planilla</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Elige un partido de la lista o crea uno nuevo para empezar a rellenar la alineación y el acta.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

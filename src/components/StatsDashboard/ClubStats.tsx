import React, { useState, useMemo, useEffect } from 'react';
import { useFootball } from '../../context/FootballContext';
import { useAuth } from '../../context/AuthContext';
import { getAllowedCategories } from '../../types/auth';
import { matchesCategoryFilter } from '../../types/football';
import { CategoryStatsPdfModal } from './CategoryStatsPdfModal';
import { 
  Trophy, 
  Award, 
  TrendingUp, 
  Clock, 
  Shield, 
  Star, 
  Activity, 
  Flame,
  CheckCircle2,
  Download,
  Printer,
  FileText
} from 'lucide-react';
import { POSITION_LABELS } from '../../data/mockData';

export const ClubStats: React.FC = () => {
  const { players, matches, clubInfo, getCategoryStaff, activeCategory } = useFootball();
  const { currentUser } = useAuth();

  const isCoordinator = currentUser?.role === 'Coordinador General' || currentUser?.category === 'Todas';
  const allowedCategories = getAllowedCategories(currentUser?.category);

  // Initialize selectedCategory to user's assigned category or activeCategory
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (isCoordinator) return activeCategory || 'all';
    return currentUser?.category || allowedCategories[0] || 'Sub 13-14';
  });

  const [showPdfModal, setShowPdfModal] = useState(false);

  // Keep selected category synchronized if activeCategory changes
  useEffect(() => {
    if (isCoordinator) {
      if (activeCategory) setSelectedCategory(activeCategory);
    } else {
      if (currentUser?.category) {
        const isAllowed = allowedCategories.includes(activeCategory as any) || activeCategory === currentUser.category;
        setSelectedCategory(isAllowed ? activeCategory : currentUser.category);
      }
    }
  }, [activeCategory, currentUser?.category, isCoordinator]);

  // Category filter options allowed for this user
  const categoryOptions = useMemo(() => {
    if (isCoordinator) {
      return [
        { id: 'all', label: 'Todas las Categorías' },
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

  // Filtered dataset respecting role permissions & category
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (!isCoordinator && !allowedCategories.includes(m.category as any)) return false;
      return matchesCategoryFilter(m.category, selectedCategory);
    });
  }, [matches, isCoordinator, allowedCategories, selectedCategory]);

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (!isCoordinator && !allowedCategories.includes(p.category as any)) return false;
      return matchesCategoryFilter(p.category, selectedCategory);
    });
  }, [players, isCoordinator, allowedCategories, selectedCategory]);

  const finishedMatches = filteredMatches.filter((m) => m.status === 'finished');

  // Overall record
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  finishedMatches.forEach((m) => {
    const ourGoals = m.isHome ? m.homeScore : m.awayScore;
    const opponentGoals = m.isHome ? m.awayScore : m.homeScore;

    goalsFor += ourGoals;
    goalsAgainst += opponentGoals;

    if (ourGoals > opponentGoals) wins++;
    else if (ourGoals === opponentGoals) draws++;
    else losses++;
  });

  const totalPlayed = finishedMatches.length;
  const winRate = totalPlayed > 0 ? Math.round((wins / totalPlayed) * 100) : 0;
  const goalDiff = goalsFor - goalsAgainst;

  // Leaderboards
  const topScorers = [...filteredPlayers]
    .filter((p) => p.stats.goals > 0)
    .sort((a, b) => b.stats.goals - a.stats.goals)
    .slice(0, 5);

  const topAssists = [...filteredPlayers]
    .filter((p) => p.stats.assists > 0)
    .sort((a, b) => b.stats.assists - a.stats.assists)
    .slice(0, 5);

  const mostMinutes = [...filteredPlayers]
    .sort((a, b) => b.stats.minutesPlayed - a.stats.minutesPlayed)
    .slice(0, 5);

  const topRatings = [...filteredPlayers]
    .filter((p) => p.stats.matchesPlayed >= 1 && p.stats.avgRating > 0)
    .sort((a, b) => b.stats.avgRating - a.stats.avgRating)
    .slice(0, 5);

  const disciplinary = [...filteredPlayers]
    .filter((p) => p.stats.yellowCards > 0 || p.stats.redCards > 0)
    .sort((a, b) => (b.stats.redCards * 3 + b.stats.yellowCards) - (a.stats.redCards * 3 + a.stats.yellowCards))
    .slice(0, 5);

  const currentCategoryStaff = getCategoryStaff(selectedCategory !== 'all' ? selectedCategory : 'Sub 14');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="w-6 h-6 rounded-md bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                SLQ
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                {clubInfo.name} • Temporada {clubInfo.season}
              </span>
              {!isCoordinator && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Acceso exclusivo: {currentUser?.category}
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Estadísticas y Rendimiento por Categoría
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Métricas consolidadas de partidos oficiales, goleadores, asistentes y regularidad de la cantera canaria.
            </p>
          </div>

          {/* Report Actions: Download PDF & Print */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
            <button
              onClick={() => setShowPdfModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/40 transition-all cursor-pointer hover:scale-[1.02]"
              title="Descargar informe completo en archivo PDF"
            >
              <Download className="w-4 h-4" />
              <span>Descargar PDF</span>
            </button>

            <button
              onClick={() => setShowPdfModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
              title="Imprimir informe oficial para la categoría"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills (Scoped per user role) */}
        <div className="flex items-center gap-1.5 flex-wrap mt-4 pt-3 border-t border-slate-800/80 text-xs">
          <span className="text-amber-400 font-bold mr-1">Filtrar Categoría:</span>
          {categoryOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedCategory(opt.id)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                selectedCategory === opt.id
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Big Record Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Partidos Jugados</span>
            <span className="text-2xl font-black text-white">{totalPlayed}</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Balance (V - E - D)</span>
            <span className="text-xl font-black text-white">
              <span className="text-emerald-400">{wins}</span> - <span className="text-amber-400">{draws}</span> - <span className="text-rose-400">{losses}</span>
            </span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">% Victoria</span>
            <span className="text-2xl font-black text-emerald-400">{winRate}%</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Goles a Favor</span>
            <span className="text-2xl font-black text-emerald-400">+{goalsFor}</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Goles Encajados</span>
            <span className="text-2xl font-black text-rose-400">{goalsAgainst}</span>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Diferencia Gol</span>
            <span className={`text-2xl font-black ${goalDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Scorers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Máximos Goleadores</h3>
                <p className="text-[11px] text-slate-400">Goles anotados en partidos oficiales</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/50">
              Top 5
            </span>
          </div>

          {topScorers.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No hay goles registrados en esta selección.</p>
          ) : (
            <div className="space-y-2.5">
              {topScorers.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-xs font-black text-slate-500 text-center">{idx + 1}</span>
                    <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                      #{p.squadNumber}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{p.firstName} {p.lastName}</p>
                      <p className="text-[10px] text-slate-400">{p.category} • {p.primaryPosition}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-amber-400">{p.stats.goals}</span>
                    <span className="text-[10px] text-slate-500 block">goles</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Assists */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Máximos Asistentes</h3>
                <p className="text-[11px] text-slate-400">Pases clave y asistencias de gol</p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-800/50">
              Top 5
            </span>
          </div>

          {topAssists.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No hay asistencias registradas.</p>
          ) : (
            <div className="space-y-2.5">
              {topAssists.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-xs font-black text-slate-500 text-center">{idx + 1}</span>
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      #{p.squadNumber}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{p.firstName} {p.lastName}</p>
                      <p className="text-[10px] text-slate-400">{p.category} • {p.primaryPosition}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-blue-400">{p.stats.assists}</span>
                    <span className="text-[10px] text-slate-500 block">asist.</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Regularity / Most Minutes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Minutos Jugados</h3>
                <p className="text-[11px] text-slate-400">Regularidad y participación en cancha</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/50">
              Top 5
            </span>
          </div>

          <div className="space-y-2.5">
            {mostMinutes.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-xs font-black text-slate-500 text-center">{idx + 1}</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    #{p.squadNumber}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{p.firstName} {p.lastName}</p>
                    <p className="text-[10px] text-slate-400">{p.category} • {p.stats.starts} titularidades</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-black text-emerald-400 font-mono">{p.stats.minutesPlayed}'</span>
                  <span className="text-[10px] text-slate-500 block">{p.stats.matchesPlayed} part.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disciplinary & Top Ratings Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Ratings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Star className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Mejores Promedios de Rendimiento</h3>
                <p className="text-[11px] text-slate-400">Calificación media del cuerpo técnico (escala 1 a 10)</p>
              </div>
            </div>
          </div>

          {topRatings.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No hay calificaciones de partidos cerrados aún.</p>
          ) : (
            <div className="space-y-2.5">
              {topRatings.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 text-xs font-black text-slate-500 text-center">{idx + 1}</span>
                    <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                      #{p.squadNumber}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{p.firstName} {p.lastName}</p>
                      <p className="text-[10px] text-slate-400">{p.category} • {p.primaryPosition}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/30">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-black text-amber-300 font-mono">
                      {p.stats.avgRating.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Disciplinary record */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Registro Disciplinario</h3>
                <p className="text-[11px] text-slate-400">Control de amonestaciones y expulsiones</p>
              </div>
            </div>
          </div>

          {disciplinary.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Excelente disciplina: sin tarjetas registradas.</p>
          ) : (
            <div className="space-y-2.5">
              {disciplinary.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                      #{p.squadNumber}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{p.firstName} {p.lastName}</p>
                      <p className="text-[10px] text-slate-400">{p.category} • {p.primaryPosition}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.stats.yellowCards > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                        <span className="w-2.5 h-3.5 bg-amber-400 rounded-xs inline-block" />
                        {p.stats.yellowCards}
                      </span>
                    )}
                    {p.stats.redCards > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
                        <span className="w-2.5 h-3.5 bg-rose-500 rounded-xs inline-block" />
                        {p.stats.redCards}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PDF and Printable Modal */}
      {showPdfModal && (
        <CategoryStatsPdfModal
          category={selectedCategory}
          clubInfo={clubInfo}
          coachStaff={currentCategoryStaff}
          players={filteredPlayers}
          matches={filteredMatches}
          onClose={() => setShowPdfModal(false)}
        />
      )}
    </div>
  );
};

import React from 'react';
import { useFootball } from '../../context/FootballContext';
import { 
  Trophy, 
  Award, 
  TrendingUp, 
  Clock, 
  Shield, 
  Star, 
  Activity, 
  Flame,
  CheckCircle2
} from 'lucide-react';
import { POSITION_LABELS } from '../../data/mockData';

export const ClubStats: React.FC = () => {
  const { players, matches, clubInfo } = useFootball();
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  const filteredMatches = matches.filter((m) => {
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesCat;
  });

  const filteredPlayers = players.filter((p) => {
    return selectedCategory === 'all' || p.category === selectedCategory;
  });

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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-md bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                SLQ
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                {clubInfo.name} • Temporada {clubInfo.season}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Estadísticas Globales y Rendimiento por Categoría
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Métricas consolidadas de partidos oficiales, goleadores, asistentes y regularidad de la cantera canaria.
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap mt-4 pt-3 border-t border-slate-800/80 text-xs">
          <span className="text-amber-400 font-bold mr-1">Filtrar Categoría:</span>
          {['all', 'Sub 11', 'Sub 12', 'Sub 13', 'Sub 14', 'Sub 15', 'Sub 16', 'Sub 18', 'Sub 20'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat === 'all' ? 'Todas las Categorías' : cat}
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
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Diferencia de Goles</span>
            <span className={`text-2xl font-black ${goalDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Scorers (Pichichi) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-400" />
              Máximos Goleadores (Pichichi)
            </h3>
            <span className="text-xs text-slate-400">Total: {goalsFor}</span>
          </div>

          {topScorers.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-4 text-center">Sin goles registrados aún.</p>
          ) : (
            <div className="space-y-2">
              {topScorers.map((p, idx) => {
                const pos = POSITION_LABELS[p.primaryPosition] || POSITION_LABELS['MC'];
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                        idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-slate-300 text-slate-900' : 'bg-amber-800/80 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-white">#{p.squadNumber} {p.nickname || p.lastName}</p>
                        <span className="text-[10px] text-slate-400">{pos.full}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-emerald-400 text-base">{p.stats.goals}</span>
                      <span className="text-[10px] text-slate-400 block">goles ({p.stats.matchesPlayed} PJ)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Assists */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-400" />
              Máximos Asistentes
            </h3>
          </div>

          {topAssists.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-4 text-center">Sin asistencias registradas aún.</p>
          ) : (
            <div className="space-y-2">
              {topAssists.map((p, idx) => {
                const pos = POSITION_LABELS[p.primaryPosition] || POSITION_LABELS['MC'];
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-white">#{p.squadNumber} {p.nickname || p.lastName}</p>
                        <span className="text-[10px] text-slate-400">{pos.full}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-blue-400 text-base">{p.stats.assists}</span>
                      <span className="text-[10px] text-slate-400 block">asistencias</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Most Minutes Played */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Más Minutos Jugados
            </h3>
          </div>

          <div className="space-y-2">
            {mostMinutes.map((p, idx) => {
              const pos = POSITION_LABELS[p.primaryPosition] || POSITION_LABELS['MC'];
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-white">#{p.squadNumber} {p.nickname || p.lastName}</p>
                      <span className="text-[10px] text-slate-400">{p.stats.starts} titularidades</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-purple-300 text-sm">{p.stats.minutesPlayed}'</span>
                    <span className="text-[10px] text-slate-400 block">minutos</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Best Rated Players */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              Mejor Valoración Media
            </h3>
            <span className="text-xs text-slate-400">Min. 2 partidos</span>
          </div>

          {topRatings.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-4 text-center">Sin puntuaciones registradas aún.</p>
          ) : (
            <div className="space-y-2">
              {topRatings.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-white">#{p.squadNumber} {p.nickname || p.lastName}</p>
                      <span className="text-[10px] text-slate-400">{p.primaryPosition}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-amber-300 text-base">★ {p.stats.avgRating}</span>
                    <span className="text-[10px] text-slate-400 block">{p.stats.matchesPlayed} PJ</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Disciplinary (Cards) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl md:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Control Disciplinario y Fair Play
            </h3>
            <span className="text-xs text-slate-400">Tarjetas de la plantilla</span>
          </div>

          {disciplinary.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-4 text-center">La plantilla no registra amonestaciones.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {disciplinary.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">#{p.squadNumber} {p.nickname || p.lastName}</span>
                    <span className="text-[10px] text-slate-400 uppercase">({p.primaryPosition})</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      🟨 {p.stats.yellowCards}
                    </span>
                    <span className="text-rose-500 font-bold flex items-center gap-1">
                      🟥 {p.stats.redCards}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Player, PositionGroup, PlayerStatus } from '../../types/football';
import { useFootball } from '../../context/FootballContext';
import { PlayerCard } from './PlayerCard';
import { PlayerModal } from './PlayerModal';
import { PlayerFormModal } from './PlayerFormModal';
import { 
  Search, 
  UserPlus, 
  Filter, 
  ArrowUpDown, 
  LayoutGrid, 
  Table as TableIcon, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Activity,
  Shield
} from 'lucide-react';
import { POSITION_LABELS } from '../../data/mockData';

interface PlayerListProps {
  onOpenNewPlayer: () => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({ onOpenNewPlayer }) => {
  const { players } = useFootball();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dorsal' | 'name' | 'minutes' | 'goals' | 'rating'>('dorsal');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [selectedPlayerForView, setSelectedPlayerForView] = useState<Player | null>(null);
  const [selectedPlayerForEdit, setSelectedPlayerForEdit] = useState<Player | null>(null);

  // Available categories
  const categories = useMemo(() => {
    const cats = new Set(players.map((p) => p.category));
    return Array.from(cats);
  }, [players]);

  // Filtered & Sorted players
  const filteredPlayers = useMemo(() => {
    return players
      .filter((player) => {
        // Search query
        const query = searchQuery.toLowerCase().trim();
        const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
        const nickname = (player.nickname || '').toLowerCase();
        const dorsal = String(player.squadNumber);
        const dni = (player.idCard || '').toLowerCase();

        const matchesSearch = !query || 
          fullName.includes(query) || 
          nickname.includes(query) || 
          dorsal.includes(query) ||
          dni.includes(query);

        // Position Group
        const posInfo = POSITION_LABELS[player.primaryPosition];
        const matchesGroup = selectedGroup === 'all' || posInfo?.group === selectedGroup;

        // Status
        const matchesStatus = selectedStatus === 'all' || player.status === selectedStatus;

        // Category
        const matchesCategory = selectedCategory === 'all' || player.category === selectedCategory;

        return matchesSearch && matchesGroup && matchesStatus && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'dorsal') return a.squadNumber - b.squadNumber;
        if (sortBy === 'name') return a.lastName.localeCompare(b.lastName);
        if (sortBy === 'minutes') return b.stats.minutesPlayed - a.stats.minutesPlayed;
        if (sortBy === 'goals') return b.stats.goals - a.stats.goals;
        if (sortBy === 'rating') return (b.stats.avgRating || 0) - (a.stats.avgRating || 0);
        return 0;
      });
  }, [players, searchQuery, selectedGroup, selectedStatus, selectedCategory, sortBy]);

  // Squad counters
  const totalCount = players.length;
  const availableCount = players.filter((p) => p.status === 'Disponible').length;
  const injuredCount = players.filter((p) => p.status === 'Lesionado').length;
  const suspendedCount = players.filter((p) => p.status === 'Sancionado').length;
  const doubtfulCount = players.filter((p) => p.status === 'Duda').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Counters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              Base de Datos y Plantilla Oficial
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Fichas técnicas completas, historial deportivo, perfil físico y disponibilidad médica para el cuerpo técnico.
            </p>
          </div>

          <button
            onClick={onOpenNewPlayer}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-colors self-start md:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Inscribir Jugador</span>
          </button>
        </div>

        {/* Status Pills Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Total Plantilla:</span>
            <span className="font-extrabold text-white text-sm">{totalCount}</span>
          </div>
          <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/60 flex items-center justify-between">
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Aptos:
            </span>
            <span className="font-extrabold text-emerald-300 text-sm">{availableCount}</span>
          </div>
          <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/60 flex items-center justify-between">
            <span className="text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Lesionados:
            </span>
            <span className="font-extrabold text-rose-300 text-sm">{injuredCount}</span>
          </div>
          <div className="bg-amber-950/40 p-2.5 rounded-xl border border-amber-900/60 flex items-center justify-between">
            <span className="text-amber-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Sancionados:
            </span>
            <span className="font-extrabold text-amber-300 text-sm">{suspendedCount}</span>
          </div>
          <div className="bg-yellow-950/40 p-2.5 rounded-xl border border-yellow-900/60 flex items-center justify-between col-span-2 sm:col-span-1">
            <span className="text-yellow-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Duda:
            </span>
            <span className="font-extrabold text-yellow-300 text-sm">{doubtfulCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, dorsal (#), apodo o DNI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-emerald-500"
            />
          </div>

          {/* Sort & View Mode Switcher */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="dorsal" className="bg-slate-900">Por Dorsal (#)</option>
                <option value="name" className="bg-slate-900">Por Nombre</option>
                <option value="minutes" className="bg-slate-900">Más Minutos</option>
                <option value="goals" className="bg-slate-900">Máximos Goleadores</option>
                <option value="rating" className="bg-slate-900">Mejor Puntuación</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista en tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista en tabla"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-500 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Posición:
          </span>
          {['all', 'Porteros', 'Defensas', 'Centrocampistas', 'Delanteros'].map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedGroup === group
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {group === 'all' ? 'Todas' : group}
            </button>
          ))}

          <span className="text-slate-500 font-semibold ml-3 mr-1">Estado:</span>
          {['all', 'Disponible', 'Duda', 'Lesionado', 'Sancionado'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedStatus === st
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st === 'all' ? 'Todos' : st}
            </button>
          ))}

        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-amber-400 font-bold mr-1">Categoría Canarios:</span>
          {['all', 'Sub 11', 'Sub 12', 'Sub 13', 'Sub 14', 'Sub 15', 'Sub 16', 'Sub 18', 'Sub 20'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat === 'all' ? 'Todas las Categorías' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Players Grid or Table */}
      {filteredPlayers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No se encontraron jugadores</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Ningún jugador coincide con los filtros de búsqueda aplicados. Prueba a cambiar los filtros o inscribe a un nuevo miembro en la plantilla.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onClick={() => setSelectedPlayerForView(player)}
              onEdit={(e) => {
                e.stopPropagation();
                setSelectedPlayerForEdit(player);
              }}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Dorsal</th>
                  <th className="py-3 px-4">Jugador</th>
                  <th className="py-3 px-4">Posición</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">PJ</th>
                  <th className="py-3 px-4 text-center">Minutos</th>
                  <th className="py-3 px-4 text-center">Goles</th>
                  <th className="py-3 px-4 text-center">Asist.</th>
                  <th className="py-3 px-4 text-center">Tarjetas</th>
                  <th className="py-3 px-4 text-center">Nota</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredPlayers.map((p) => {
                  const posConfig = POSITION_LABELS[p.primaryPosition] || POSITION_LABELS['MC'];
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPlayerForView(p)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-black text-white text-sm">
                        #{p.squadNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {p.nickname || `${p.firstName} ${p.lastName}`}
                        {p.nickname && <span className="block font-normal text-slate-400 text-[11px]">{p.firstName} {p.lastName}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${posConfig.color}`}>
                          {p.primaryPosition}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{p.category}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.status === 'Disponible' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          p.status === 'Lesionado' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                          p.status === 'Sancionado' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-yellow-950 text-yellow-400 border border-yellow-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-white">{p.stats.matchesPlayed}</td>
                      <td className="py-3 px-4 text-center">{p.stats.minutesPlayed}'</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400">{p.stats.goals}</td>
                      <td className="py-3 px-4 text-center text-blue-400">{p.stats.assists}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-amber-400 font-bold">{p.stats.yellowCards}</span> / <span className="text-rose-500 font-bold">{p.stats.redCards}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-300">
                        {p.stats.avgRating || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlayerForEdit(p);
                          }}
                          className="text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedPlayerForView && (
        <PlayerModal
          player={selectedPlayerForView}
          onClose={() => setSelectedPlayerForView(null)}
          onEdit={(player) => {
            setSelectedPlayerForView(null);
            setSelectedPlayerForEdit(player);
          }}
        />
      )}

      {selectedPlayerForEdit && (
        <PlayerFormModal
          playerToEdit={selectedPlayerForEdit}
          onClose={() => setSelectedPlayerForEdit(null)}
        />
      )}
    </div>
  );
};

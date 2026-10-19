import React, { useState } from 'react';
import { useFootball } from '../../context/FootballContext';
import { PlayerInjury, matchesCategoryFilter, Player } from '../../types/football';
import { InjuryFormModal } from './InjuryFormModal';
import { PlayerModal } from '../PlayerDatabase/PlayerModal';
import { PlayerFormModal } from '../PlayerDatabase/PlayerFormModal';
import { POSITION_LABELS } from '../../data/mockData';
import { 
  Activity, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Search, 
  User, 
  FileText, 
  Trash2, 
  Edit, 
  HeartPulse, 
  ArrowRight,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

export const InjuriesDashboard: React.FC = () => {
  const { 
    injuries, 
    players, 
    deleteInjury, 
    dischargeInjury, 
    activeCategory, 
    setActiveCategory 
  } = useFootball();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Lesionado' | 'En Recuperación' | 'En Reintegro Deportivo' | 'Alta Médica'>('all');
  const [injuryToEdit, setInjuryToEdit] = useState<PlayerInjury | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPlayerForModal, setSelectedPlayerForModal] = useState<Player | null>(null);
  const [playerToEditInModal, setPlayerToEditInModal] = useState<Player | null>(null);

  // Filter injuries by category and status
  const filteredInjuries = injuries.filter((inj) => {
    const matchesCategory = matchesCategoryFilter(inj.category, activeCategory);
    if (!matchesCategory) return false;

    if (statusFilter !== 'all') {
      if (statusFilter === 'Lesionado') {
        if (inj.status !== 'Lesionado' && inj.status !== 'Activa') return false;
      } else if (statusFilter === 'En Reintegro Deportivo') {
        if (inj.status !== 'En Reintegro Deportivo' && inj.status !== 'En Reintegro') return false;
      } else if (inj.status !== statusFilter) {
        return false;
      }
    }

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const playerName = inj.playerName?.toLowerCase() || '';
    const type = inj.injuryType.toLowerCase();
    const zone = inj.bodyZone.toLowerCase();
    const diag = (inj.diagnosis || '').toLowerCase();
    const desc = (inj.description || '').toLowerCase();
    return playerName.includes(term) || type.includes(term) || zone.includes(term) || diag.includes(term) || desc.includes(term);
  });

  // Category stats
  const categoryInjuries = injuries.filter((i) => matchesCategoryFilter(i.category, activeCategory));
  const activeBajasCount = categoryInjuries.filter((i) => i.status === 'Lesionado' || i.status === 'Activa').length;
  const enRecuperacionCount = categoryInjuries.filter((i) => i.status === 'En Recuperación').length;
  const reintegroCount = categoryInjuries.filter((i) => i.status === 'En Reintegro Deportivo' || i.status === 'En Reintegro').length;
  const altasCount = categoryInjuries.filter((i) => i.status === 'Alta Médica').length;

  // Helper to calculate days out
  const calculateDaysOut = (dateInjured: string, actualReturnDate?: string): number => {
    const start = new Date(dateInjured);
    const end = actualReturnDate ? new Date(actualReturnDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleDischarge = (injury: PlayerInjury) => {
    if (confirm(`¿Confirmar Alta Médica para ${injury.playerName}?\nEl futbolista pasará automáticamente al estado "Disponible" y podrá ser citado en los próximos partidos.`)) {
      dischargeInjury(injury.id);
    }
  };

  const handleDelete = (injury: PlayerInjury) => {
    if (confirm(`¿Eliminar el registro médico de ${injury.injuryType} de ${injury.playerName}?`)) {
      deleteInjury(injury.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black shadow-lg shadow-rose-950/50">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                Parte Médico y Registro de Lesionados
              </h2>
              <span className="text-xs bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                {activeCategory === 'all' ? 'Todas las series' : activeCategory}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Control clínico en todas las categorías. Toda lesión activa bloquea automáticamente la citación del futbolista a los partidos y se refleja en su ficha oficial.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setInjuryToEdit(null);
            setIsFormOpen(true);
          }}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-950/50 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nueva Lesión</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-rose-900/50 p-4 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-300 uppercase">Bajas Médicas Activas</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">{activeBajasCount}</span>
            <span className="text-xs text-rose-300/80">no convocables</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-amber-900/50 p-4 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-300 uppercase">En Reintegro Deportivo</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{reintegroCount}</span>
            <span className="text-xs text-amber-300/80">con PF / Kinesiólogo</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-900/50 p-4 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-300 uppercase">Altas Médicas Otorgadas</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{altasCount}</span>
            <span className="text-xs text-emerald-300/80">recuperados</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Lesiones Año</span>
            <HeartPulse className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{categoryInjuries.length}</span>
            <span className="text-xs text-slate-400">en temporada</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 mr-1 shrink-0">Filtrar Estado:</span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-amber-400 text-slate-950 font-black shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todas ({categoryInjuries.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Lesionado')}
            className={`px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'Lesionado'
                ? 'bg-rose-600 text-white font-black shadow'
                : 'bg-slate-950 text-slate-400 hover:text-rose-300 border border-slate-800'
            }`}
          >
            🚫 Lesionado ({activeBajasCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('En Recuperación')}
            className={`px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'En Recuperación'
                ? 'bg-orange-600 text-white font-black shadow'
                : 'bg-slate-950 text-slate-400 hover:text-orange-300 border border-slate-800'
            }`}
          >
            🩹 En Recuperación ({enRecuperacionCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('En Reintegro Deportivo')}
            className={`px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'En Reintegro Deportivo'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'bg-slate-950 text-slate-400 hover:text-amber-300 border border-slate-800'
            }`}
          >
            🏃 En Reintegro ({reintegroCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Alta Médica')}
            className={`px-3 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'Alta Médica'
                ? 'bg-emerald-600 text-white font-black shadow'
                : 'bg-slate-950 text-slate-400 hover:text-emerald-300 border border-slate-800'
            }`}
          >
            ✅ Altas Médicas ({altasCount})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por jugador, lesión, zona..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Injuries List Cards */}
      {filteredInjuries.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-500/80 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-200">
            No se registran lesiones bajo los filtros seleccionados
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            El plantel de la {activeCategory === 'all' ? 'institución' : activeCategory} no presenta registros médicos pendientes con estos criterios.
          </p>
          <button
            type="button"
            onClick={() => {
              setInjuryToEdit(null);
              setIsFormOpen(true);
            }}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ingresar Nueva Lesión</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInjuries.map((injury) => {
            const playerObj = players.find((p) => p.id === injury.playerId);
            const daysOut = calculateDaysOut(injury.dateInjured, injury.actualReturnDate);
            const posConfig = playerObj ? (POSITION_LABELS[playerObj.primaryPosition] || POSITION_LABELS['MC']) : null;

            return (
              <div
                key={injury.id}
                className={`bg-slate-900 rounded-2xl p-5 shadow-lg border transition-all flex flex-col justify-between ${
                  injury.status === 'Activa'
                    ? 'border-rose-900/80 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/20'
                    : injury.status === 'En Reintegro'
                    ? 'border-amber-900/60 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20'
                    : 'border-slate-800 bg-slate-900/90'
                }`}
              >
                <div>
                  {/* Card Header: Player Info & Status Badge */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      {playerObj?.photoUrl ? (
                        <img
                          src={playerObj.photoUrl}
                          alt={injury.playerName}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-black text-amber-400 text-base border border-slate-700 shrink-0">
                          #{injury.playerSquadNumber || playerObj?.squadNumber || '-'}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-black text-white hover:text-amber-300 transition-colors cursor-pointer"
                              onClick={() => playerObj && setSelectedPlayerForModal(playerObj)}
                          >
                            {injury.playerName}
                          </h3>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {injury.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {playerObj?.primaryPosition && (
                            <span className="text-amber-400 font-bold mr-1.5">[{playerObj.primaryPosition}]</span>
                          )}
                          Ficha: <span className="text-slate-300 font-mono">{playerObj?.idCard || 'No reg.'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {(injury.status === 'Lesionado' || injury.status === 'Activa') && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                          🚫 Lesionado
                        </span>
                      )}
                      {injury.status === 'En Recuperación' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                          🩹 En Recuperación
                        </span>
                      )}
                      {(injury.status === 'En Reintegro Deportivo' || injury.status === 'En Reintegro') && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <Clock className="w-3 h-3 text-amber-400" />
                          🏃 En Reintegro
                        </span>
                      )}
                      {injury.status === 'Alta Médica' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ✅ Alta Médica
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Injury Clinical Details (All 10 requested fields) */}
                  <div className="py-3 space-y-2.5 text-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-white">{injury.injuryType}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          injury.severity === 'Leve' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                          injury.severity === 'Moderada' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          Gravedad: {injury.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-400 font-semibold mt-0.5">
                        📍 Zona afectada: <strong className="text-white">{injury.bodyZone}</strong>
                      </p>
                    </div>

                    {/* Descripción de la lesión */}
                    {injury.description && (
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
                        <strong className="text-slate-400 block text-[10px] uppercase font-bold">
                          Descripción de la Lesión:
                        </strong>
                        <p className="mt-0.5 leading-relaxed">{injury.description}</p>
                      </div>
                    )}

                    {/* Diagnóstico médico */}
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                      <strong className="text-rose-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-rose-400" />
                        <span>Diagnóstico Médico:</span>
                      </strong>
                      <p className="mt-0.5 leading-relaxed text-slate-200">
                        {injury.diagnosis || 'Pendiente de confirmación imagenológica / clínica.'}
                      </p>
                    </div>

                    {/* Profesional responsable o Centro médico */}
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between">
                      <span className="text-slate-400">Profesional / Centro Médico:</span>
                      <strong className="text-white">{injury.medicalStaffOrClinic || injury.medicalStaff || 'Kinesiología San Luis'}</strong>
                    </div>

                    {/* Timeline & Fechas de regreso / alta */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                      <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Fecha Lesión</span>
                        <span className="font-bold text-white font-mono">{injury.dateInjured}</span>
                      </div>
                      <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Retorno Estimado</span>
                        <span className="font-bold text-amber-300 font-mono">
                          {injury.expectedReturnDate || 'En evaluación'}
                        </span>
                      </div>
                      <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Alta Médica Efectiva</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {injury.actualReturnDate || (injury.status === 'Alta Médica' ? 'Concedida' : 'Pendiente')}
                        </span>
                      </div>
                    </div>

                    {/* Observaciones y evolución de la recuperación */}
                    {(injury.evolutionNotes || injury.notes) && (
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300">
                        <strong className="text-amber-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                          <HeartPulse className="w-3 h-3 text-amber-400" />
                          <span>Observaciones y Evolución de la Recuperación:</span>
                        </strong>
                        <p className="mt-0.5 leading-relaxed text-slate-300">
                          {injury.evolutionNotes || injury.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {injury.status !== 'Alta Médica' && (
                      <button
                        type="button"
                        onClick={() => handleDischarge(injury)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-lg shadow transition-all cursor-pointer"
                        title="Otorgar alta médica y habilitar para citaciones"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Dar Alta Médica</span>
                      </button>
                    )}

                    {playerObj && (
                      <button
                        type="button"
                        onClick={() => setSelectedPlayerForModal(playerObj)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        title="Ver ficha completa del jugador"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ficha</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setInjuryToEdit(injury);
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                      title="Editar registro"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(injury)}
                      className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar de historial"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Injury Modal */}
      {isFormOpen && (
        <InjuryFormModal
          injuryToEdit={injuryToEdit}
          onClose={() => {
            setIsFormOpen(false);
            setInjuryToEdit(null);
          }}
        />
      )}

      {/* Player Dossier Modal */}
      {selectedPlayerForModal && (
        <PlayerModal
          player={selectedPlayerForModal}
          onClose={() => setSelectedPlayerForModal(null)}
          onEdit={(player) => {
            setSelectedPlayerForModal(null);
            setPlayerToEditInModal(player);
          }}
        />
      )}

      {/* Player Form Modal */}
      {playerToEditInModal && (
        <PlayerFormModal
          playerToEdit={playerToEditInModal}
          onClose={() => setPlayerToEditInModal(null)}
        />
      )}
    </div>
  );
};

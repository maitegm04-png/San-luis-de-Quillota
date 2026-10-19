import React, { useState } from 'react';
import { Player, PlayerInjury } from '../../types/football';
import { useFootball } from '../../context/FootballContext';
import { POSITION_LABELS } from '../../data/mockData';
import { 
  X, 
  Calendar, 
  Phone, 
  Mail, 
  FileText, 
  Award, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Edit, 
  Trash2,
  Trophy,
  Plus,
  Stethoscope
} from 'lucide-react';
import { PlayerFichaPdfModal } from './PlayerFichaPdfModal';
import { InjuryFormModal } from '../Injuries/InjuryFormModal';

interface PlayerModalProps {
  player: Player | null;
  onClose: () => void;
  onEdit: (player: Player) => void;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({ player, onClose, onEdit }) => {
  const { deletePlayer, matches, injuries, dischargeInjury } = useFootball();
  const [showFichaPdf, setShowFichaPdf] = useState(false);
  const [isInjuryFormOpen, setIsInjuryFormOpen] = useState(false);
  const [injuryToEdit, setInjuryToEdit] = useState<PlayerInjury | null>(null);

  if (!player) return null;

  const rawInjuries = [
    ...injuries.filter((i) => i.playerId === player.id),
    ...(player.injuries || [])
  ];
  const seenIds = new Set<string>();
  const playerInjuries = rawInjuries
    .filter((inj) => {
      const key = inj.id || `${inj.dateInjured}-${inj.injuryType}`;
      if (seenIds.has(key)) return false;
      seenIds.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.dateInjured).getTime() - new Date(a.dateInjured).getTime());

  const activeInjury = playerInjuries.find(
    (i) => i.status === 'Lesionado' || i.status === 'En Recuperación' || i.status === 'Activa'
  );

  const posConfig = POSITION_LABELS[player.primaryPosition] || POSITION_LABELS['MC'];

  // Calculate age
  const calculateAge = (birthDateString: string) => {
    const birth = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(player.birthDate);

  // Player matches history
  const playerMatches = matches.filter((m) =>
    m.startingEleven.some((s) => s.playerId === player.id) ||
    m.events.some((e) => e.playerId === player.id || e.assistPlayerId === player.id) ||
    (m.playerRatings && m.playerRatings[player.id])
  );

  const handleDelete = () => {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${player.firstName} ${player.lastName} del club?`)) {
      deletePlayer(player.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header with Player Jersey & Big Name */}
        <div className="relative p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Player Photo or Squad number circle */}
              <div className="relative shrink-0">
                {player.photoUrl ? (
                  <div className="relative">
                    <img
                      src={player.photoUrl}
                      alt={`${player.firstName} ${player.lastName}`}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-xl"
                    />
                    <span className="absolute -bottom-1.5 -right-1.5 bg-slate-950 text-amber-400 font-black text-xs px-1.5 py-0.5 rounded-md border border-amber-400/50 shadow">
                      #{player.squadNumber}
                    </span>
                  </div>
                ) : (
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl border-2 ${
                      player.primaryPosition === 'POR'
                        ? 'bg-amber-500 text-slate-950 border-amber-300'
                        : 'text-white border-white/20'
                    }`}
                    style={
                      player.avatarColor && player.primaryPosition !== 'POR'
                        ? { backgroundColor: player.avatarColor }
                        : player.primaryPosition !== 'POR'
                        ? { backgroundColor: '#10b981' }
                        : undefined
                    }
                  >
                    #{player.squadNumber}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase border ${posConfig.color}`}>
                    {posConfig.full} ({posConfig.label})
                  </span>
                  {player.secondaryPosition && (
                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      Secundaria: {player.secondaryPosition}
                    </span>
                  )}
                  <span className="text-xs text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {player.category}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {player.nickname ? `${player.nickname} (${player.firstName} ${player.lastName})` : `${player.firstName} ${player.lastName}`}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ficha Federativa / DNI: <strong className="text-slate-200">{player.idCard || 'No registrado'}</strong>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => setShowFichaPdf(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow transition-all hover:scale-105 cursor-pointer"
                title="Generar e imprimir Ficha Oficial del Jugador"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ficha PDF / Imprimir</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(player);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 rounded-lg border border-rose-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Alert (With detailed medical info and quick discharge if injured) */}
          {player.status === 'Lesionado' ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm text-white">🚫 JUGADOR LESIONADO (Baja Médica Activa)</p>
                    <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded">
                      No Convocable
                    </span>
                  </div>
                  <p className="text-rose-300 font-medium mt-0.5">
                    {player.statusReason || (activeInjury ? `${activeInjury.injuryType} (${activeInjury.bodyZone})` : 'Lesión en tratamiento')}
                  </p>
                  {activeInjury?.diagnosis && (
                    <p className="text-[11px] text-rose-300/80 mt-1 italic">
                      "{activeInjury.diagnosis}" • {activeInjury.medicalStaff}
                    </p>
                  )}
                </div>
              </div>

              {activeInjury && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`¿Dar Alta Médica a ${player.firstName} ${player.lastName}?\nEl jugador volverá a quedar Disponible para partidos y entrenamientos.`)) {
                      dischargeInjury(activeInjury.id);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow transition-colors cursor-pointer shrink-0 self-end sm:self-auto"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Dar Alta Médica</span>
                </button>
              )}
            </div>
          ) : player.status !== 'Disponible' ? (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 flex items-start gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Estado del jugador: {player.status}</p>
                {player.statusReason && <p className="text-xs text-amber-300/90 mt-0.5">{player.statusReason}</p>}
              </div>
            </div>
          ) : null}

          {/* Personal Info & Physical Profile */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Edad / Nacimiento</span>
              <span className="text-sm font-bold text-white">
                {age} años <span className="text-xs text-slate-400 font-normal">({player.birthDate})</span>
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Pie Hábil</span>
              <span className="text-sm font-bold text-white">{player.dominantFoot}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Altura</span>
              <span className="text-sm font-bold text-white">{player.heightCm} cm</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">Peso</span>
              <span className="text-sm font-bold text-white">{player.weightKg} kg</span>
            </div>
          </div>

          {/* Season Stats Cards */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              Estadísticas Temporada Oficial
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Partidos (Titular)</span>
                <span className="text-lg font-black text-white">
                  {player.stats.matchesPlayed} <span className="text-xs text-slate-400 font-medium">({player.stats.starts})</span>
                </span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Minutos Jugados</span>
                <span className="text-lg font-black text-white">{player.stats.minutesPlayed}'</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Goles</span>
                <span className="text-lg font-black text-emerald-400">{player.stats.goals}</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Asistencias</span>
                <span className="text-lg font-black text-blue-400">{player.stats.assists}</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Tarjetas (A/R)</span>
                <span className="text-lg font-black text-amber-400">
                  {player.stats.yellowCards} <span className="text-xs text-rose-500">/ {player.stats.redCards}</span>
                </span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Nota Media</span>
                <span className="text-lg font-black text-amber-300">
                  {player.stats.avgRating || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Technical Attributes Progress Bars */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Valoración de Habilidades Tácticas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <AttributeBar label="Ritmo / Velocidad" value={player.attributes.pace} />
              <AttributeBar label="Disparo / Definición" value={player.attributes.shooting} />
              <AttributeBar label="Pase / Visión" value={player.attributes.passing} />
              <AttributeBar label="Regate / Control" value={player.attributes.dribbling} />
              <AttributeBar label="Defensa / Recuperación" value={player.attributes.defending} />
              <AttributeBar label="Físico / Resistencia" value={player.attributes.physical} />
              {player.primaryPosition === 'POR' && player.attributes.goalkeeping && (
                <AttributeBar label="Habilidad Portería / Reflejos" value={player.attributes.goalkeeping} colorClass="bg-amber-400" />
              )}
            </div>
          </div>

          {/* Contact Details & Coach Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Datos de Contacto
              </h4>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{player.phone || 'Teléfono no indicado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{player.email || 'Correo no registrado'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                Informe del Entrenador
              </h4>
              <p className="text-sm text-slate-300 italic">
                {player.notes || 'Sin observaciones técnicas añadidas todavía.'}
              </p>
            </div>
          </div>

          {/* Recent Match Appearances */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Historial de Partidos Jugados ({playerMatches.length})
            </h3>
            {playerMatches.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No ha participado en actas registradas todavía.</p>
            ) : (
              <div className="space-y-1.5">
                {playerMatches.map((m) => {
                  const ratingInfo = m.playerRatings?.[player.id];
                  const isStarter = m.startingEleven.some((s) => s.playerId === player.id);
                  const playerGoalsInMatch = m.events.filter((e) => e.playerId === player.id && (e.type === 'goal' || e.type === 'penalty_scored')).length;

                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{m.matchDay}</span>
                        <span className="text-slate-400">vs {m.opponent}</span>
                        <span className="text-slate-500 font-mono">({m.homeScore} - {m.awayScore})</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded ${isStarter ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
                          {isStarter ? 'Titular' : 'Suplente'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {playerGoalsInMatch > 0 && (
                          <span className="font-bold text-emerald-400">
                            ⚽ {playerGoalsInMatch} gol{playerGoalsInMatch > 1 ? 'es' : ''}
                          </span>
                        )}
                        {ratingInfo?.rating && (
                          <span className="font-bold text-amber-400">
                            ★ {ratingInfo.rating}/10
                          </span>
                        )}
                        <span className="text-slate-400">{m.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MEDICAL & INJURY HISTORY SECTION ("que se reflejen en su ficha") */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-rose-400" />
                <span>Historial de Lesiones y Parte Médico ({playerInjuries.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setInjuryToEdit(null);
                  setIsInjuryFormOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Lesión</span>
              </button>
            </div>

            {playerInjuries.length === 0 ? (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-500 text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Sin lesiones registradas en la temporada oficial actual. Futbolista en óptimas condiciones.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {playerInjuries.map((inj) => (
                  <div
                    key={inj.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                      inj.status === 'Lesionado' || inj.status === 'Activa'
                        ? 'bg-rose-950/25 border-rose-900/80 text-rose-200'
                        : inj.status === 'En Recuperación'
                        ? 'bg-orange-950/25 border-orange-900/80 text-orange-200'
                        : inj.status === 'En Reintegro Deportivo' || inj.status === 'En Reintegro'
                        ? 'bg-amber-950/25 border-amber-900/80 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-white text-sm">{inj.injuryType}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                          inj.status === 'Lesionado' || inj.status === 'Activa' ? 'bg-rose-600 text-white' :
                          inj.status === 'En Recuperación' ? 'bg-orange-600 text-white' :
                          inj.status === 'En Reintegro Deportivo' || inj.status === 'En Reintegro' ? 'bg-amber-500 text-slate-950 font-black' :
                          'bg-emerald-600 text-white'
                        }`}>
                          {inj.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          📅 {inj.dateInjured}
                        </span>
                        {inj.category && (
                          <span className="text-[9px] text-amber-400 font-bold bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/60">
                            Serie: {inj.category}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        {inj.status !== 'Alta Médica' && (
                          <button
                            type="button"
                            onClick={() => dischargeInjury(inj.id)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Otorgar alta médica oficial"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Dar Alta</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setInjuryToEdit(inj);
                            setIsInjuryFormOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar registro de lesión"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">Zona Anatómica:</span>
                        <p className="text-white font-medium">📍 {inj.bodyZone}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">Profesional / Centro:</span>
                        <p className="text-slate-200 font-medium">🏥 {inj.medicalStaffOrClinic || inj.medicalStaff || 'Kinesiología San Luis'}</p>
                      </div>
                    </div>

                    {inj.description && (
                      <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]">
                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Descripción y Mecanismo:</span>
                        <p className="text-slate-300 mt-0.5 leading-relaxed">{inj.description}</p>
                      </div>
                    )}

                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]">
                      <span className="text-rose-400 font-bold block text-[10px] uppercase flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-rose-400" />
                        <span>Diagnóstico Médico:</span>
                      </span>
                      <p className="text-slate-200 mt-0.5">{inj.diagnosis}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/50 p-2 rounded-lg border border-slate-800/80">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Retorno Estimado:</span>
                        <strong className="text-amber-300 font-mono">{inj.expectedReturnDate || 'En evaluación'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Alta Médica Efectiva:</span>
                        <strong className="text-emerald-400 font-mono">{inj.actualReturnDate || (inj.status === 'Alta Médica' ? 'Concedida' : 'Pendiente')}</strong>
                      </div>
                    </div>

                    {(inj.evolutionNotes || inj.notes) && (
                      <div className="text-[11px] text-slate-300 pt-1">
                        <span className="text-amber-400 font-bold text-[10px] uppercase block">Evolución y Observaciones:</span>
                        <p className="italic text-slate-300 mt-0.5">{inj.evolutionNotes || inj.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showFichaPdf && (
        <PlayerFichaPdfModal
          player={player}
          onClose={() => setShowFichaPdf(false)}
        />
      )}

      {isInjuryFormOpen && (
        <InjuryFormModal
          injuryToEdit={injuryToEdit}
          defaultPlayerId={player.id}
          onClose={() => {
            setIsInjuryFormOpen(false);
            setInjuryToEdit(null);
          }}
        />
      )}
    </div>
  );
};

const AttributeBar: React.FC<{ label: string; value: number; colorClass?: string }> = ({
  label,
  value,
  colorClass = 'bg-emerald-500',
}) => {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="font-bold text-white">{value} / 99</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${Math.min(100, Math.max(10, value))}%` }}
        />
      </div>
    </div>
  );
};

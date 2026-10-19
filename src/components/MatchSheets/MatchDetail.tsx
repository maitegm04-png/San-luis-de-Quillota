import React, { useState } from 'react';
import { MatchCompetition, MatchEventType, MatchSheet, Player, TacticalFormation } from '../../types/football';
import { useFootball } from '../../context/FootballContext';
import { PitchView } from '../PitchView';
import { PrintableMatchSheet } from './PrintableMatchSheet';
import { MatchFormModal } from './MatchFormModal';
import { MatchPhysicalReportTab } from '../PhysicalArea/MatchPhysicalReportTab';
import { Sub20GpsReportTab } from '../PhysicalArea/Sub20GpsReportTab';
import { 
  Trophy, 
  Users, 
  FileSpreadsheet, 
  Clock, 
  Star, 
  Calendar, 
  MapPin, 
  Edit, 
  Trash2, 
  Plus, 
  Award, 
  CheckCircle2, 
  Play, 
  Pause, 
  RotateCcw,
  Shield,
  X,
  ChevronRight,
  ClipboardCheck,
  FileDown,
  Flame,
  Activity,
  Save,
  Dumbbell,
  Zap
} from 'lucide-react';
import { POSITION_LABELS } from '../../data/mockData';

interface MatchDetailProps {
  match: MatchSheet;
  onBackToList?: () => void;
}

type DetailTab = 'lineup' | 'manual_entry' | 'physical_area' | 'gps_sub20' | 'sheet' | 'live' | 'ratings';

export const MatchDetail: React.FC<MatchDetailProps> = ({ match, onBackToList }) => {
  const { 
    players, 
    clubInfo, 
    updateMatch, 
    deleteMatch, 
    changeFormation, 
    assignPlayerToSlot, 
    removePlayerFromStartingEleven, 
    toggleSubstitute, 
    setMatchSpecialRole, 
    addMatchEvent, 
    removeMatchEvent, 
    updatePlayerRating, 
    updateMatchScore, 
    finishMatch,
    recordMatchInjury,
    removeMatchInjury
  } = useFootball();

  const [activeTab, setActiveTab] = useState<DetailTab>('manual_entry');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Coaching Staff local state for this specific match
  const [staffCoach, setStaffCoach] = useState<string>(match.coachStaff?.coach || '');
  const [staffAT, setStaffAT] = useState<string>(match.coachStaff?.assistantCoach || '');
  const [staffPF, setStaffPF] = useState<string>(match.coachStaff?.physicalTrainer || '');
  const [staffPA, setStaffPA] = useState<string>(match.coachStaff?.goalkeeperCoach || '');
  const [staffKIN, setStaffKIN] = useState<string>(match.coachStaff?.kinesiologist || '');
  const [staffUT, setStaffUT] = useState<string>(match.coachStaff?.kitManager || '');
  const [staffCOORD, setStaffCOORD] = useState<string>(match.coachStaff?.coordinator || '');
  const [staffSaveMsg, setStaffSaveMsg] = useState<string | null>(null);

  // Coaching Staff local state for this specific match

  // Sync staff when match changes
  React.useEffect(() => {
    if (match.coachStaff) {
      setStaffCoach(match.coachStaff.coach || '');
      setStaffAT(match.coachStaff.assistantCoach || '');
      setStaffPF(match.coachStaff.physicalTrainer || '');
      setStaffPA(match.coachStaff.goalkeeperCoach || '');
      setStaffKIN(match.coachStaff.kinesiologist || '');
      setStaffUT(match.coachStaff.kitManager || '');
      setStaffCOORD(match.coachStaff.coordinator || '');
    }
  }, [match.id, match.coachStaff]);

  const handleSaveStaff = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateMatch(match.id, {
      coachStaff: {
        coach: staffCoach.trim(),
        assistantCoach: staffAT.trim(),
        physicalTrainer: staffPF.trim(),
        goalkeeperCoach: staffPA.trim(),
        kinesiologist: staffKIN.trim(),
        kitManager: staffUT.trim(),
        coordinator: staffCOORD.trim(),
      }
    });
    setStaffSaveMsg('¡Cuerpo Técnico del partido guardado!');
    setTimeout(() => setStaffSaveMsg(null), 2500);
  };

  const handleLoadClubStaff = () => {
    setStaffCoach(clubInfo.coachStaff.coach);
    setStaffAT(clubInfo.coachStaff.assistantCoach);
    setStaffPF(clubInfo.coachStaff.physicalTrainer);
    setStaffPA(clubInfo.coachStaff.goalkeeperCoach);
    setStaffKIN(clubInfo.coachStaff.kinesiologist);
    setStaffUT(clubInfo.coachStaff.kitManager);
    setStaffCOORD(clubInfo.coachStaff.coordinator);
  };

  // Slot Assignment Modal state
  const [activeSlotIdForAssign, setActiveSlotIdForAssign] = useState<string | null>(null);

  // Manual Event entry state (for non-live filling)
  const [mEventType, setMEventType] = useState<MatchEventType>('goal');
  const [mEventMinute, setMEventMinute] = useState<number>(10);
  const [mEventPlayerId, setMEventPlayerId] = useState<string>('');
  const [mEventAssistId, setMEventAssistId] = useState<string>('');
  const [mEventSubOutId, setMEventSubOutId] = useState<string>('');
  const [mEventRivalName, setMEventRivalName] = useState<string>('');
  const [mEventDetail, setMEventDetail] = useState<string>('');

  // Injury event state for match sheet
  const [mEventInjuryDesc, setMEventInjuryDesc] = useState<string>('');
  const [mEventInjuryType, setMEventInjuryType] = useState<string>('Traumatismo / Dolor en Partido');
  const [mEventBodyZone, setMEventBodyZone] = useState<string>('Tobillo derecho');
  const [mEventSeverity, setMEventSeverity] = useState<'Leve' | 'Moderada' | 'Grave' | 'Muy Grave'>('Moderada');
  const [mEventSyncMedical, setMEventSyncMedical] = useState<boolean>(true);

  // Quick report injury modal
  const [isQuickInjuryModalOpen, setIsQuickInjuryModalOpen] = useState(false);
  const [quickInjuryPlayerId, setQuickInjuryPlayerId] = useState<string>('');
  const [quickInjuryMinute, setQuickInjuryMinute] = useState<number>(45);
  const [quickInjuryDesc, setQuickInjuryDesc] = useState<string>('');
  const [quickInjuryType, setQuickInjuryType] = useState<string>('Traumatismo en Partido');
  const [quickInjuryZone, setQuickInjuryZone] = useState<string>('Rodilla');
  const [quickInjurySeverity, setQuickInjurySeverity] = useState<'Leve' | 'Moderada' | 'Grave' | 'Muy Grave'>('Moderada');
  const [quickInjurySyncMedical, setQuickInjurySyncMedical] = useState<boolean>(true);

  // Live Event modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [liveEventType, setLiveEventType] = useState<MatchEventType>('goal');
  const [liveEventMinute, setLiveEventMinute] = useState<number>(45);
  const [liveEventPlayerId, setLiveEventPlayerId] = useState<string>('');
  const [liveEventAssistId, setLiveEventAssistId] = useState<string>('');
  const [liveEventSubOutId, setLiveEventSubOutId] = useState<string>('');
  const [liveEventRivalName, setLiveEventRivalName] = useState<string>('');
  const [liveEventDetail, setLiveEventDetail] = useState<string>('');

  // Live Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [matchMinutes, setMatchMinutes] = useState(
    match.events.length > 0 ? Math.max(...match.events.map((e) => e.minute), 1) : 1
  );

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setMatchMinutes((prev) => (prev >= 90 ? prev + 1 : prev + 1));
      }, 2500); // 2.5 seconds = 1 minute of simulation
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  const getPlayer = (id?: string): Player | undefined => {
    if (!id) return undefined;
    return players.find((p) => p.id === id);
  };

  const starterPlayerIds = match.startingEleven.map((s) => s.playerId);
  const starterPlayers = starterPlayerIds.map((id) => getPlayer(id)).filter((p): p is Player => p !== undefined);

  const substitutePlayers = match.substitutes
    .map((id) => getPlayer(id))
    .filter((p): p is Player => p !== undefined);

  const reservePlayers = players.filter(
    (p) => !starterPlayerIds.includes(p.id) && !match.substitutes.includes(p.id)
  );

  const allSquadPlayers = [...starterPlayers, ...substitutePlayers];

  const handleDeleteMatch = () => {
    if (confirm(`¿Estás seguro de que deseas eliminar la planilla de "${match.title}"?`)) {
      deleteMatch(match.id);
      if (onBackToList) onBackToList();
    }
  };

  const handleOpenAssignModal = (slotId: string) => {
    setActiveSlotIdForAssign(slotId);
  };

  const handleSelectPlayerForSlot = (playerId: string) => {
    if (activeSlotIdForAssign) {
      assignPlayerToSlot(match.id, activeSlotIdForAssign, playerId);
      setActiveSlotIdForAssign(null);
    }
  };

  // Submit manual event (non-live)
  const handleAddManualEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (mEventType === 'injury') {
      if (!mEventPlayerId) {
        alert('Por favor selecciona al futbolista que salió lesionado.');
        return;
      }
      if (!mEventInjuryDesc.trim()) {
        alert('Por favor describe qué le pasó al jugador lesionado.');
        return;
      }
      const targetP = getPlayer(mEventPlayerId);
      recordMatchInjury(
        match.id,
        {
          playerId: mEventPlayerId,
          playerName: targetP ? (targetP.nickname || `${targetP.firstName} ${targetP.lastName}`) : 'Futbolista',
          playerSquadNumber: targetP?.squadNumber,
          minute: Number(mEventMinute),
          description: mEventInjuryDesc.trim(),
          injuryType: mEventInjuryType.trim() || 'Lesión en Partido Oficial',
          bodyZone: mEventBodyZone.trim() || 'Por evaluar en kinesiología',
          severity: mEventSeverity,
        },
        mEventSyncMedical
      );
      setMEventInjuryDesc('');
      return;
    }

    addMatchEvent(match.id, {
      minute: Number(mEventMinute),
      type: mEventType,
      playerId: mEventPlayerId || undefined,
      assistPlayerId: mEventAssistId || undefined,
      subOutPlayerId: mEventSubOutId || undefined,
      opponentPlayerName: mEventRivalName.trim() || undefined,
      detail: mEventDetail.trim() || undefined,
    });
    // Reset inputs
    setMEventDetail('');
    setMEventRivalName('');
    setMEventAssistId('');
    setMEventSubOutId('');
  };

  // Submit quick injury from match sheet
  const handleQuickRecordInjury = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInjuryPlayerId) {
      alert('Por favor selecciona al futbolista que salió lesionado.');
      return;
    }
    if (!quickInjuryDesc.trim()) {
      alert('Por favor indica qué le pasó al futbolista.');
      return;
    }
    const targetP = getPlayer(quickInjuryPlayerId);
    recordMatchInjury(
      match.id,
      {
        playerId: quickInjuryPlayerId,
        playerName: targetP ? (targetP.nickname || `${targetP.firstName} ${targetP.lastName}`) : 'Futbolista',
        playerSquadNumber: targetP?.squadNumber,
        minute: Number(quickInjuryMinute),
        description: quickInjuryDesc.trim(),
        injuryType: quickInjuryType.trim() || 'Lesión en Partido Oficial',
        bodyZone: quickInjuryZone.trim() || 'Por evaluar en kinesiología',
        severity: quickInjurySeverity,
      },
      quickInjurySyncMedical
    );
    setIsQuickInjuryModalOpen(false);
    setQuickInjuryDesc('');
  };

  // Submit live event
  const handleSaveLiveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (liveEventType === 'injury') {
      if (!liveEventPlayerId) {
        alert('Por favor selecciona al futbolista lesionado.');
        return;
      }
      const targetP = getPlayer(liveEventPlayerId);
      recordMatchInjury(
        match.id,
        {
          playerId: liveEventPlayerId,
          playerName: targetP ? (targetP.nickname || `${targetP.firstName} ${targetP.lastName}`) : 'Futbolista',
          playerSquadNumber: targetP?.squadNumber,
          minute: Number(liveEventMinute),
          description: liveEventDetail.trim() || 'Salió con dolor / traumatismo durante el partido en juego.',
          injuryType: 'Lesión en Partido Oficial',
          bodyZone: 'Por evaluar',
          severity: 'Moderada',
        },
        true
      );
      setIsEventModalOpen(false);
      setLiveEventDetail('');
      return;
    }

    addMatchEvent(match.id, {
      minute: Number(liveEventMinute),
      type: liveEventType,
      playerId: liveEventPlayerId || undefined,
      assistPlayerId: liveEventAssistId || undefined,
      subOutPlayerId: liveEventSubOutId || undefined,
      opponentPlayerName: liveEventRivalName.trim() || undefined,
      detail: liveEventDetail.trim() || undefined,
    });
    setIsEventModalOpen(false);
    setLiveEventDetail('');
    setLiveEventRivalName('');
    setLiveEventAssistId('');
    setLiveEventSubOutId('');
  };

  // Handle finalize from manual entry
  const handleSaveAndFinalizeManual = () => {
    finishMatch(match.id);
    alert('¡Acta de partido guardada y estadísticas de la plantilla actualizadas con éxito!');
    setActiveTab('sheet');
  };

  return (
    <div className="space-y-6">
      {/* Match Header Hero Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none ${
          match.status === 'live' ? 'bg-rose-500' : match.status === 'finished' ? 'bg-emerald-500' : 'bg-blue-500'
        }`} />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {match.competition} • {match.matchDay}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                match.status === 'live'
                  ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                  : match.status === 'finished'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-blue-950 text-blue-400 border border-blue-800'
              }`}>
                {match.status === 'live' ? '● En Directo' : match.status === 'finished' ? 'Finalizado' : 'Programado'}
              </span>
              <span className="text-xs text-slate-400">
                {match.isHome ? '🏠 Local' : '🚌 Visitante'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {match.isHome ? clubInfo.name : match.opponent} 
              <span className="text-emerald-400 mx-2">vs</span> 
              {match.isHome ? match.opponent : clubInfo.name}
            </h1>

            <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                {match.date} • {match.time} h
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {match.venue} ({match.pitchType})
              </span>
              {match.referee && (
                <span>Árbitro: <strong className="text-slate-300">{match.referee}</strong></span>
              )}
            </div>
          </div>

          {/* Scoreboard display */}
          <div className="flex items-center gap-4 bg-slate-950/80 px-5 py-3 rounded-2xl border border-slate-800/80 self-stretch sm:self-auto justify-center">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                {match.isHome ? clubInfo.shortName : match.opponent}
              </span>
              <span className="text-3xl sm:text-4xl font-black text-white">
                {match.status === 'scheduled' ? '-' : match.homeScore}
              </span>
            </div>

            <span className="text-xl font-bold text-slate-600">:</span>

            <div className="text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                {match.isHome ? match.opponent : clubInfo.shortName}
              </span>
              <span className="text-3xl sm:text-4xl font-black text-white">
                {match.status === 'scheduled' ? '-' : match.awayScore}
              </span>
            </div>

            {/* Actions */}
            <div className="ml-3 pl-3 border-l border-slate-800 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Editar datos del partido"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDeleteMatch}
                className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-400 hover:text-white transition-colors"
                title="Eliminar planilla"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('manual_entry')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'manual_entry'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Rellenar Acta (Manual / No en directo)</span>
          </button>

          <button
            onClick={() => setActiveTab('physical_area')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'physical_area'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Área Física (P.F.)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
              activeTab === 'physical_area' ? 'bg-amber-950 text-amber-200' : 'bg-slate-800 text-amber-400'
            }`}>
              Sub 14-20
            </span>
          </button>

          {match.category === 'Sub 20' && (
            <button
              onClick={() => setActiveTab('gps_sub20')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'gps_sub20'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-950/40'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Métricas GPS & PSE</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                activeTab === 'gps_sub20' ? 'bg-cyan-950 text-cyan-200' : 'bg-slate-800 text-cyan-400'
              }`}>
                Sub-20
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('lineup')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'lineup'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Convocatoria & Alineación ({starterPlayers.length}/11)</span>
          </button>

          <button
            onClick={() => setActiveTab('sheet')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'sheet'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Planilla Oficial & Exportar PDF</span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'live'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Control en Directo</span>
            {match.events.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300">
                {match.events.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ratings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'ratings'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Puntuaciones & Conclusiones</span>
          </button>
        </div>
      </div>

      {/* TAB: RELLENAR ACTA MANUAL (NO EN DIRECTO) */}
      {activeTab === 'manual_entry' && (
        <div className="space-y-6">
          {/* Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-emerald-400" />
                  Carga Manual del Acta de Partido (No en Directo)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rellena con tranquilidad el resultado final, las incidencias (goles, tarjetas y cambios con su minuto), estadísticas y notas del partido ya finalizado.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveAndFinalizeManual}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-colors self-start sm:self-auto"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Acta y Finalizar Partido</span>
              </button>
            </div>

            {/* Score & Match Status Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-800 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <label className="block text-slate-400 font-bold mb-1">
                  Goles {match.isHome ? clubInfo.name : match.opponent} (Local)
                </label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={match.homeScore}
                  onChange={(e) => updateMatch(match.id, { homeScore: Math.max(0, Number(e.target.value)) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xl font-black text-white text-center focus:outline-emerald-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <label className="block text-slate-400 font-bold mb-1">
                  Goles {match.isHome ? match.opponent : clubInfo.name} (Visitante)
                </label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={match.awayScore}
                  onChange={(e) => updateMatch(match.id, { awayScore: Math.max(0, Number(e.target.value)) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xl font-black text-white text-center focus:outline-emerald-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <label className="block text-slate-400 font-bold mb-1">
                  Estado del Encuentro
                </label>
                <select
                  value={match.status}
                  onChange={(e) => updateMatch(match.id, { status: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm font-bold text-white focus:outline-emerald-500"
                >
                  <option value="finished">Finalizado (Jugado)</option>
                  <option value="scheduled">Programado (Por disputar)</option>
                  <option value="live">En Directo (En juego)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form to add an incident manually */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Añadir Incidencia al Acta (Gol, Tarjeta o Cambio)
            </h3>

            <form onSubmit={handleAddManualEvent} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-300 mb-1">Tipo de Evento</label>
                <select
                  value={mEventType}
                  onChange={(e) => setMEventType(e.target.value as MatchEventType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                >
                  <option value="goal">⚽ Gol a Favor (Nuestro)</option>
                  <option value="goal_conceded">❌ Gol Rival (En contra)</option>
                  <option value="yellow_card">🟨 Tarjeta Amarilla</option>
                  <option value="red_card">🟥 Tarjeta Roja</option>
                  <option value="sub_in_out">🔄 Sustitución / Cambio</option>
                  <option value="injury">🚑 Futbolista que Salió Lesionado</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">Minuto</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={mEventMinute}
                  onChange={(e) => setMEventMinute(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  placeholder="ej. 34"
                />
              </div>

              {/* Sub-inputs depending on event type */}
              {mEventType === 'goal' && (
                <>
                  <div className="sm:col-span-4">
                    <label className="block font-semibold text-slate-300 mb-1">Anotador (Nuestro)</label>
                    <select
                      value={mEventPlayerId}
                      onChange={(e) => setMEventPlayerId(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option value="">Seleccionar goleador...</option>
                      {allSquadPlayers.map((p) => (
                        <option key={p.id} value={p.id}>#{p.squadNumber} {p.nickname || `${p.firstName} ${p.lastName}`}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-slate-300 mb-1">Asistencia (Opcional)</label>
                    <select
                      value={mEventAssistId}
                      onChange={(e) => setMEventAssistId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option value="">Sin asistencia</option>
                      {allSquadPlayers.map((p) => (
                        <option key={p.id} value={p.id}>#{p.squadNumber} {p.nickname || p.lastName}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {mEventType === 'goal_conceded' && (
                <div className="sm:col-span-7">
                  <label className="block font-semibold text-slate-300 mb-1">Anotador Rival (Opcional)</label>
                  <input
                    type="text"
                    placeholder="ej. #9 García o jugada a balón parado"
                    value={mEventRivalName}
                    onChange={(e) => setMEventRivalName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              )}

              {(mEventType === 'yellow_card' || mEventType === 'red_card') && (
                <div className="sm:col-span-7">
                  <label className="block font-semibold text-slate-300 mb-1">Jugador Amonestado</label>
                  <select
                    value={mEventPlayerId}
                    onChange={(e) => setMEventPlayerId(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="">Seleccionar jugador...</option>
                    {allSquadPlayers.map((p) => (
                      <option key={p.id} value={p.id}>#{p.squadNumber} {p.nickname || `${p.firstName} ${p.lastName}`}</option>
                    ))}
                  </select>
                </div>
              )}

              {mEventType === 'injury' && (
                <>
                  <div className="sm:col-span-4">
                    <label className="block font-semibold text-rose-400 mb-1">Futbolista que Salió Lesionado</label>
                    <select
                      value={mEventPlayerId}
                      onChange={(e) => setMEventPlayerId(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                    >
                      <option value="">Seleccionar lesionado...</option>
                      {allSquadPlayers.map((p) => (
                        <option key={p.id} value={p.id}>#{p.squadNumber} {p.nickname || `${p.firstName} ${p.lastName}`} ({p.primaryPosition})</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block font-semibold text-slate-300 mb-1">Tipo de Lesión Sospechada</label>
                    <input
                      type="text"
                      value={mEventInjuryType}
                      onChange={(e) => setMEventInjuryType(e.target.value)}
                      placeholder="ej: Desgarro, Esguince de tobillo, Golpe..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block font-semibold text-slate-300 mb-1">Zona Corporal Afectada</label>
                    <input
                      type="text"
                      value={mEventBodyZone}
                      onChange={(e) => setMEventBodyZone(e.target.value)}
                      placeholder="ej: Muslo posterior, Tobillo, Rodilla..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div className="sm:col-span-8">
                    <label className="block font-bold text-amber-400 mb-1">
                      ¿Qué le pasó al jugador? (Mecanismo / Incidente) *
                    </label>
                    <input
                      type="text"
                      required
                      value={mEventInjuryDesc}
                      onChange={(e) => setMEventInjuryDesc(e.target.value)}
                      placeholder="ej: Choque con defensor al disputar balón aéreo, traumatismo en tobillo sin poder pisar..."
                      className="w-full bg-slate-900 border border-rose-800 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block font-semibold text-slate-300 mb-1">Gravedad Estimada</label>
                    <select
                      value={mEventSeverity}
                      onChange={(e) => setMEventSeverity(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option value="Leve">Leve (días de descanso)</option>
                      <option value="Moderada">Moderada (1-3 semanas)</option>
                      <option value="Grave">Grave (1-2 meses)</option>
                      <option value="Muy Grave">Muy Grave (&gt;2 meses)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-12 flex items-center gap-2 p-2.5 bg-rose-950/30 border border-rose-900/60 rounded-xl">
                    <input
                      type="checkbox"
                      id="mEventSyncMedical"
                      checked={mEventSyncMedical}
                      onChange={(e) => setMEventSyncMedical(e.target.checked)}
                      className="accent-rose-500 rounded cursor-pointer w-4 h-4"
                    />
                    <label htmlFor="mEventSyncMedical" className="text-xs text-rose-200 cursor-pointer">
                      <strong>Registrar automáticamente en el Módulo Médico y Ficha:</strong> el futbolista pasará a estado <strong>Lesionado</strong> y quedará protegido frente a nuevas citaciones hasta su alta médica oficial.
                    </label>
                  </div>
                </>
              )}

              {mEventType !== 'injury' && (
                <div className="sm:col-span-9">
                  <label className="block font-semibold text-slate-300 mb-1">Detalle o Descripción de la Jugada</label>
                  <input
                    type="text"
                    placeholder="ej. Remate de cabeza tras centro lateral, falta táctica..."
                    value={mEventDetail}
                    onChange={(e) => setMEventDetail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              )}

              <div className="sm:col-span-3 flex items-end">
                <button
                  type="submit"
                  className={`w-full py-2 text-white font-bold rounded-lg transition-colors cursor-pointer ${
                    mEventType === 'injury' ? 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950/40' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {mEventType === 'injury' ? '🚑 Registrar Lesionado' : '+ Añadir al Acta'}
                </button>
              </div>
            </form>

            {/* List of current events in match */}
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Incidencias Registradas ({match.events.length})
              </h4>
              {match.events.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-lg border border-slate-800">
                  Sin incidencias añadidas aún. Usa el formulario de arriba para cargar los goles, tarjetas y cambios del partido.
                </p>
              ) : (
                match.events.map((ev) => {
                  const p = getPlayer(ev.playerId);
                  const ast = getPlayer(ev.assistPlayerId);
                  const subOut = getPlayer(ev.subOutPlayerId);

                  return (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {ev.minute}'
                        </span>
                        <div>
                          <p className="font-bold text-white">
                            {ev.type === 'goal' && `⚽ Gol: #${p?.squadNumber} ${p?.nickname || p?.lastName}`}
                            {ev.type === 'goal_conceded' && `❌ Gol rival ${ev.opponentPlayerName ? `(${ev.opponentPlayerName})` : ''}`}
                            {ev.type === 'yellow_card' && `🟨 Tarjeta Amarilla: #${p?.squadNumber} ${p?.nickname || p?.lastName}`}
                            {ev.type === 'red_card' && `🟥 Tarjeta Roja: #${p?.squadNumber} ${p?.nickname || p?.lastName}`}
                            {ev.type === 'sub_in_out' && `🔄 Cambio: Entra #${p?.squadNumber} ${p?.lastName} por #${subOut?.squadNumber} ${subOut?.lastName}`}
                            {ev.type === 'injury' && `🚑 Salió Lesionado: #${p?.squadNumber} ${p?.nickname || p?.lastName}`}
                          </p>
                          {ev.type === 'injury' ? (
                            <p className="text-[11px] text-rose-300 mt-0.5">
                              <strong className="text-amber-400">¿Qué le pasó?:</strong> {ev.injuryIncident?.description || ev.detail}
                            </p>
                          ) : (ast || ev.detail) ? (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {ast && `Asistencia: #${ast.squadNumber} ${ast.lastName} • `}
                              {ev.detail}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeMatchEvent(match.id, ev.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-900"
                        title="Eliminar incidencia"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* DEDICATED SECTION: JUGADORES LESIONADOS EN ESTE PARTIDO */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black shadow-md shadow-rose-950/50">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Futbolistas Lesionados en el Encuentro</span>
                      <span className="text-[10px] bg-rose-950 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-800">
                        {(match.injuryIncidents?.length || 0)} registrado(s)
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Reporte de quién salió lesionado y qué le pasó. Se sincroniza automáticamente con la ficha y parte médico.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setQuickInjuryPlayerId(allSquadPlayers[0]?.id || '');
                    setQuickInjuryMinute(45);
                    setQuickInjuryDesc('');
                    setIsQuickInjuryModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-950/40 transition-all hover:scale-[1.02] cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Reportar Jugador Lesionado</span>
                </button>
              </div>

              {(!match.injuryIncidents || match.injuryIncidents.length === 0) ? (
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No hay futbolistas lesionados reportados en este partido. Puedes usar el botón de arriba si alguien sufrió un golpe, traumatismo o lesión.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {match.injuryIncidents.map((inc) => {
                    const p = getPlayer(inc.playerId);
                    return (
                      <div
                        key={inc.id}
                        className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/25 via-slate-950 to-slate-950 border border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-3">
                          {p?.photoUrl ? (
                            <img src={p.photoUrl} alt={inc.playerName} className="w-11 h-11 rounded-xl object-cover border-2 border-rose-500/60 shadow-md shrink-0" />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-rose-950 text-rose-300 flex items-center justify-center font-black text-xs border border-rose-800 shrink-0">
                              #{inc.playerSquadNumber || p?.squadNumber || '-'}
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                                Minuto {inc.minute}'
                              </span>
                              <strong className="text-white text-sm">
                                #{inc.playerSquadNumber || p?.squadNumber} {inc.playerName}
                              </strong>
                              {p?.primaryPosition && (
                                <span className="text-[10px] text-amber-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                  [{p.primaryPosition}]
                                </span>
                              )}
                              <span className="text-[9px] bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-800">
                                ✓ En Ficha y Módulo Médico
                              </span>
                            </div>

                            <div className="text-slate-200 text-xs">
                              <strong className="text-amber-400">¿Qué le pasó?:</strong> {inc.description}
                            </div>

                            {(inc.injuryType || inc.bodyZone) && (
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                                <span>Diagnóstico: <strong className="text-white">{inc.injuryType}</strong></span>
                                <span>•</span>
                                <span>Zona: <strong className="text-amber-300">{inc.bodyZone}</strong></span>
                                <span>•</span>
                                <span>Gravedad: <strong className="text-rose-300">{inc.severity || 'Moderada'}</strong></span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => removeMatchInjury(match.id, inc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                            title="Eliminar reporte de lesionado"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section: Coaching Staff for this match */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  Cuerpo Técnico Oficial del Partido (7 Cargos)
                </h3>
                <p className="text-xs text-slate-400">
                  Ingresa o edita los nombres de los 7 oficiales para este partido de {match.category}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadClubStaff}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  Cargar Oficiales del Club
                </button>
                <button
                  type="button"
                  onClick={handleSaveStaff}
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition-colors cursor-pointer"
                >
                  Guardar Cuerpo Técnico
                </button>
              </div>
            </div>

            {staffSaveMsg && (
              <div className="mb-3 p-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{staffSaveMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Entrenador (D.T.)</label>
                <input
                  type="text"
                  value={staffCoach}
                  onChange={(e) => setStaffCoach(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Ayudante Técnico (A.T.)</label>
                <input
                  type="text"
                  value={staffAT}
                  onChange={(e) => setStaffAT(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">PF (Preparador Físico)</label>
                <input
                  type="text"
                  value={staffPF}
                  onChange={(e) => setStaffPF(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">PA (Preparador de Arqueros)</label>
                <input
                  type="text"
                  value={staffPA}
                  onChange={(e) => setStaffPA(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">KIN (Kinesiólogo)</label>
                <input
                  type="text"
                  value={staffKIN}
                  onChange={(e) => setStaffKIN(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">UT (Utilero)</label>
                <input
                  type="text"
                  value={staffUT}
                  onChange={(e) => setStaffUT(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">COORD (Coordinador)</label>
                <input
                  type="text"
                  value={staffCOORD}
                  onChange={(e) => setStaffCOORD(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section: Player Minutes & Ratings Quick Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                Minutos y Calificación de los Jugadores
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">MVP del Partido:</span>
                <select
                  value={match.mvpPlayerId || ''}
                  onChange={(e) => updateMatch(match.id, { mvpPlayerId: e.target.value || undefined })}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-amber-300 font-bold"
                >
                  <option value="">Seleccionar MVP...</option>
                  {allSquadPlayers.map((p) => (
                    <option key={p.id} value={p.id}>#{p.squadNumber} {p.nickname || p.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Dorsal / Jugador</th>
                    <th className="py-2.5 px-3">Rol</th>
                    <th className="py-2.5 px-3 text-center">Minutos Jugados</th>
                    <th className="py-2.5 px-3 text-center">Nota (1 - 10)</th>
                    <th className="py-2.5 px-3">Comentario Técnico del Partido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {allSquadPlayers.map((p) => {
                    const isStarter = starterPlayerIds.includes(p.id);
                    const currentRating = match.playerRatings[p.id]?.rating ?? 7;
                    const currentMinutes = match.playerRatings[p.id]?.minutes ?? (isStarter ? 90 : 0);
                    const currentNotes = match.playerRatings[p.id]?.notes || '';
                    const isMvp = match.mvpPlayerId === p.id;

                    return (
                      <tr key={p.id} className={isMvp ? 'bg-amber-950/20' : undefined}>
                        <td className="py-2 px-3">
                          <span className="font-bold text-white mr-2">#{p.squadNumber}</span>
                          <span>{p.nickname || `${p.firstName} ${p.lastName}`}</span>
                          <span className="text-[10px] text-slate-400 ml-1">({p.primaryPosition})</span>
                          {isMvp && (
                            <span className="ml-2 text-[9px] font-black text-amber-400 bg-amber-950 px-1 py-0.2 rounded border border-amber-800">
                              ★ MVP
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded ${isStarter ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                            {isStarter ? 'Titular' : 'Suplente'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={120}
                            value={currentMinutes}
                            onChange={(e) => updatePlayerRating(match.id, p.id, currentRating, Number(e.target.value), currentNotes)}
                            className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center font-bold text-white"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              step={0.5}
                              value={currentRating}
                              onChange={(e) => updatePlayerRating(match.id, p.id, Number(e.target.value), currentMinutes, currentNotes)}
                              className="w-14 bg-slate-950 border border-slate-700 rounded px-1 py-1 text-center font-black text-amber-300"
                            />
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="Feedback técnico..."
                            value={currentNotes}
                            onChange={(e) => updatePlayerRating(match.id, p.id, currentRating, currentMinutes, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-emerald-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Coach Conclusions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-white text-sm mb-2">
              Conclusiones del Entrenador (Para el archivo y los próximos entrenamientos)
            </h3>
            <textarea
              rows={3}
              value={match.tacticalNotesPost || ''}
              onChange={(e) => updateMatch(match.id, { tacticalNotesPost: e.target.value })}
              placeholder="Aspectos positivos del equipo, errores tácticos a corregir, rendimiento físico..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-emerald-500"
            />

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('sheet')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <span>Ver Planilla Lista para Imprimir / Exportar PDF →</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndFinalizeManual}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Acta y Calcular Estadísticas de Temporada</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CONVOCATORIA & ALINEACIÓN */}
      {activeTab === 'lineup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tactical Pitch Visualizer (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Alineación Titular en el Campo
                </h3>
                <p className="text-xs text-slate-400">
                  Pulsa en los círculos para asignar o cambiar posiciones tácticas.
                </p>
              </div>

              {/* Formation switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Esquema:</span>
                <select
                  value={match.formation}
                  onChange={(e) => changeFormation(match.id, e.target.value as TacticalFormation)}
                  className="bg-slate-950 border border-slate-800 text-emerald-400 font-black rounded-lg px-2.5 py-1 text-xs focus:outline-emerald-500 cursor-pointer"
                >
                  <option value="4-3-3">4-3-3</option>
                  <option value="4-4-2">4-4-2</option>
                  <option value="4-2-3-1">4-2-3-1</option>
                  <option value="3-5-2">3-5-2</option>
                  <option value="3-4-3">3-4-3</option>
                  <option value="5-3-2">5-3-2</option>
                  <option value="4-1-4-1">4-1-4-1</option>
                </select>
              </div>
            </div>

            <PitchView
              formation={match.formation}
              startingEleven={match.startingEleven}
              players={players}
              captainId={match.captainId}
              viceCaptainId={match.viceCaptainId}
              penaltyTakerId={match.penaltyTakerId}
              freeKickTakerId={match.freeKickTakerId}
              cornerTakerId={match.cornerTakerId}
              onSlotClick={handleOpenAssignModal}
              onRemovePlayer={(playerId) => removePlayerFromStartingEleven(match.id, playerId)}
              isEditable={true}
            />

            {/* Quick pre-match instructions */}
            <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Consignas del Entrenador para el Partido:
              </label>
              <textarea
                rows={2}
                value={match.tacticalNotesPre || ''}
                onChange={(e) => updateMatch(match.id, { tacticalNotesPre: e.target.value })}
                placeholder="Presión alta, salida de balón, marcas en saques de esquina..."
                className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Squad Roster & Roles (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Roles Bar (Capitán, Penaltis, Faltas) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Roles y Especialistas
              </h3>
              <div className="space-y-2 text-xs">
                {/* Capitán */}
                <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300">Capitán (C):</span>
                  <select
                    value={match.captainId || ''}
                    onChange={(e) => setMatchSpecialRole(match.id, 'captain', e.target.value || undefined)}
                    className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:outline-none max-w-[160px]"
                  >
                    <option value="">Sin asignar</option>
                    {starterPlayers.map((p) => (
                      <option key={p.id} value={p.id}>#{p.squadNumber} {p.nickname || p.lastName}</option>
                    ))}
                  </select>
                </div>

                {/* Subcapitán */}
                <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300">2º Capitán:</span>
                  <select
                    value={match.viceCaptainId || ''}
                    onChange={(e) => setMatchSpecialRole(match.id, 'viceCaptain', e.target.value || undefined)}
                    className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:outline-none max-w-[160px]"
                  >
                    <option value="">Sin asignar</option>
                    {starterPlayers.map((p) => (
                      <option key={p.id} value={p.id}>#{p.squadNumber} {p.nickname || p.lastName}</option>
                    ))}
                  </select>
                </div>

                {/* Penaltis */}
                <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300">Penaltis:</span>
                  <select
                    value={match.penaltyTakerId || ''}
                    onChange={(e) => setMatchSpecialRole(match.id, 'penalty', e.target.value || undefined)}
                    className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:outline-none max-w-[160px]"
                  >
                    <option value="">Sin asignar</option>
                    {starterPlayers.map((p) => (
                      <option key={p.id} value={p.id}>#{p.squadNumber} {p.nickname || p.lastName}</option>
                    ))}
                  </select>
                </div>

                {/* Faltas directas */}
                <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-300">Faltas Directas:</span>
                  <select
                    value={match.freeKickTakerId || ''}
                    onChange={(e) => setMatchSpecialRole(match.id, 'freeKick', e.target.value || undefined)}
                    className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:outline-none max-w-[160px]"
                  >
                    <option value="">Sin asignar</option>
                    {starterPlayers.map((p) => (
                      <option key={p.id} value={p.id}>#{p.squadNumber} {p.nickname || p.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Substitutes Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  Banquillo / Suplentes ({substitutePlayers.length})
                </h3>
                <span className="text-[10px] text-slate-400">Pulsa para mover</span>
              </div>

              {substitutePlayers.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500 italic">
                  No hay jugadores en el banquillo. Añade desde los no convocados.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {substitutePlayers.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[11px] text-white">
                          #{player.squadNumber}
                        </span>
                        <span className="font-bold text-white">{player.nickname || player.lastName}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 uppercase">
                          {player.primaryPosition}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleSubstitute(match.id, player.id)}
                          className="text-[10px] text-rose-400 hover:text-white px-2 py-0.5 rounded hover:bg-rose-950 transition-colors"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reserves / Not called up */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                No Convocados / Reservas ({reservePlayers.length})
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {reservePlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-bold">#{player.squadNumber}</span>
                      <span className="text-slate-300">{player.lastName}, {player.firstName}</span>
                      {player.status !== 'Disponible' && (
                        <span className={`text-[9px] px-1 py-0.2 rounded ${
                          player.status === 'Lesionado' ? 'bg-rose-950 text-rose-400' :
                          player.status === 'Sancionado' ? 'bg-amber-950 text-amber-400' : 'bg-yellow-950 text-yellow-400'
                        }`}>
                          {player.status}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSubstitute(match.id, player.id)}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold px-2 py-0.5 rounded hover:bg-emerald-950 transition-colors"
                    >
                      + Al Banquillo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PLANILLA OFICIAL & EXPORTAR PDF */}
      {activeTab === 'sheet' && (
        <PrintableMatchSheet match={match} />
      )}

      {/* TAB: CONTROL EN DIRECTO (CON CRONÓMETRO) */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Score Adjuster */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                    {match.isHome ? clubInfo.shortName : match.opponent} (Local)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateMatchScore(match.id, Math.max(0, match.homeScore - 1), match.awayScore)}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                    >
                      -
                    </button>
                    <span className="text-4xl font-black text-white w-12 text-center">
                      {match.homeScore}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateMatchScore(match.id, match.homeScore + 1, match.awayScore)}
                      className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <span className="text-3xl font-black text-slate-600">:</span>

                <div className="text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
                    {match.isHome ? match.opponent : clubInfo.shortName} (Visitante)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateMatchScore(match.id, match.homeScore, Math.max(0, match.awayScore - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                    >
                      -
                    </button>
                    <span className="text-4xl font-black text-white w-12 text-center">
                      {match.awayScore}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateMatchScore(match.id, match.homeScore, match.awayScore + 1)}
                      className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Match Timer & Status */}
              <div className="flex flex-col items-center gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Cronómetro de Partido
                </span>
                <div className="text-3xl font-black text-emerald-400 font-mono">
                  {matchMinutes}' <span className="text-xs text-slate-500">min</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning(!timerRunning);
                      if (match.status === 'scheduled') {
                        updateMatch(match.id, { status: 'live' });
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      timerRunning
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{timerRunning ? 'Pausar' : 'Iniciar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMatchMinutes(45)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                  >
                    Descanso (45')
                  </button>
                </div>
              </div>

              {/* Finish match button */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('¿Finalizar este partido? Se actualizarán las estadísticas de los jugadores en la temporada.')) {
                      finishMatch(match.id);
                      setTimerRunning(false);
                      setActiveTab('ratings');
                    }
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finalizar Partido y Guardar Acta</span>
                </button>
              </div>
            </div>

            {/* Quick Event Buttons */}
            <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-6 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setLiveEventType('goal');
                  setLiveEventMinute(matchMinutes);
                  setIsEventModalOpen(true);
                }}
                className="p-3 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-800 text-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>⚽</span>
                <span>+ Gol Nuestro</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLiveEventType('goal_conceded');
                  setLiveEventMinute(matchMinutes);
                  setIsEventModalOpen(true);
                }}
                className="p-3 bg-rose-950/70 hover:bg-rose-900/80 border border-rose-800 text-rose-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>❌</span>
                <span>+ Gol Rival</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLiveEventType('yellow_card');
                  setLiveEventMinute(matchMinutes);
                  setIsEventModalOpen(true);
                }}
                className="p-3 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-800 text-amber-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>🟨</span>
                <span>+ Amarilla</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLiveEventType('red_card');
                  setLiveEventMinute(matchMinutes);
                  setIsEventModalOpen(true);
                }}
                className="p-3 bg-red-950/70 hover:bg-red-900/80 border border-red-800 text-red-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>🟥</span>
                <span>+ Roja</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLiveEventType('sub_in_out');
                  setLiveEventMinute(matchMinutes);
                  setIsEventModalOpen(true);
                }}
                className="p-3 bg-blue-950/70 hover:bg-blue-900/80 border border-blue-800 text-blue-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>🔄</span>
                <span>+ Sustitución</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuickInjuryPlayerId(starterPlayers[0]?.id || allSquadPlayers[0]?.id || '');
                  setQuickInjuryMinute(matchMinutes);
                  setQuickInjuryDesc('');
                  setIsQuickInjuryModalOpen(true);
                }}
                className="p-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>🚑</span>
                <span>+ Lesionado</span>
              </button>
            </div>
          </div>

          {/* Timeline of Match Events */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Cronología de Incidencias ({match.events.length})
            </h3>

            {match.events.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 italic bg-slate-950/40 rounded-xl border border-slate-800">
                Aún no hay incidencias registradas. Utiliza los botones de arriba durante el partido para anotar goles, tarjetas o cambios en tiempo real.
              </div>
            ) : (
              <div className="space-y-2">
                {match.events.map((ev) => {
                  const p = getPlayer(ev.playerId);
                  const assistP = getPlayer(ev.assistPlayerId);
                  const subOutP = getPlayer(ev.subOutPlayerId);

                  return (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-emerald-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 text-sm">
                          {ev.minute}'
                        </span>

                        <div className="flex items-center gap-2">
                          {ev.type === 'goal' && <span className="text-lg">⚽</span>}
                          {ev.type === 'goal_conceded' && <span className="text-lg">❌</span>}
                          {ev.type === 'yellow_card' && <span className="text-lg">🟨</span>}
                          {ev.type === 'red_card' && <span className="text-lg">🟥</span>}
                          {ev.type === 'sub_in_out' && <span className="text-lg">🔄</span>}

                          <div>
                            <p className="font-bold text-white">
                              {ev.type === 'goal' && (
                                <span>Gol de <strong>{p?.nickname || `${p?.firstName} ${p?.lastName}`}</strong></span>
                              )}
                              {ev.type === 'goal_conceded' && (
                                <span>Gol del rival {ev.opponentPlayerName ? `(${ev.opponentPlayerName})` : ''}</span>
                              )}
                              {ev.type === 'yellow_card' && (
                                <span>Tarjeta amarilla para <strong>{p?.nickname || p?.lastName}</strong></span>
                              )}
                              {ev.type === 'red_card' && (
                                <span>Tarjeta roja para <strong>{p?.nickname || p?.lastName}</strong></span>
                              )}
                              {ev.type === 'sub_in_out' && (
                                <span>
                                  Entra <strong className="text-emerald-400">{p?.lastName}</strong> por <strong className="text-rose-400">{subOutP?.lastName}</strong>
                                </span>
                              )}
                            </p>

                            {(ev.assistPlayerId || ev.detail) && (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {ev.assistPlayerId && `Asistencia: ${assistP?.nickname || assistP?.lastName} • `}
                                {ev.detail}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeMatchEvent(match.id, ev.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                        title="Eliminar evento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: PUNTUACIONES & TÁCTICA */}
      {activeTab === 'ratings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                Mejor Jugador del Partido (MVP)
              </h3>
              <select
                value={match.mvpPlayerId || ''}
                onChange={(e) => updateMatch(match.id, { mvpPlayerId: e.target.value || undefined })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-amber-300 font-bold focus:outline-emerald-500"
              >
                <option value="">Seleccionar MVP...</option>
                {allSquadPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.squadNumber} {p.nickname || `${p.firstName} ${p.lastName}`} ({p.primaryPosition})
                  </option>
                ))}
              </select>

              <div className="mt-4">
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Ajustes en el Descanso:
                </label>
                <textarea
                  rows={2}
                  value={match.tacticalNotesHalf || ''}
                  onChange={(e) => updateMatch(match.id, { tacticalNotesHalf: e.target.value })}
                  placeholder="Correcciones de posicionamiento, cambios tácticos al descanso..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-emerald-500"
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="font-bold text-white text-sm mb-3">
                Conclusiones e Informe del Entrenador
              </h3>
              <textarea
                rows={5}
                value={match.tacticalNotesPost || ''}
                onChange={(e) => updateMatch(match.id, { tacticalNotesPost: e.target.value })}
                placeholder="Rendimiento del equipo, aspectos positivos a consolidar, errores a corregir en los entrenamientos de la semana..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-emerald-500"
              />
            </div>
          </div>

          {/* Player Ratings Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-white text-base mb-1 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              Calificación Individual de Jugadores (1 - 10)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Puntúa a los futbolistas para el seguimiento técnico y la retroalimentación semanal.
            </p>

            <div className="space-y-3">
              {allSquadPlayers.map((p) => {
                const currentRating = match.playerRatings[p.id]?.rating || 7;
                const currentMinutes = match.playerRatings[p.id]?.minutes ?? (starterPlayerIds.includes(p.id) ? 90 : 20);
                const currentNotes = match.playerRatings[p.id]?.notes || '';
                const isMvp = match.mvpPlayerId === p.id;

                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-xl border text-xs transition-colors ${
                      isMvp ? 'bg-amber-950/20 border-amber-600/50' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                          #{p.squadNumber}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm">{p.nickname || `${p.firstName} ${p.lastName}`}</span>
                            <span className="text-[10px] text-slate-400 px-1 py-0.2 rounded bg-slate-900 border border-slate-800 uppercase">
                              {p.primaryPosition}
                            </span>
                            {isMvp && (
                              <span className="text-[10px] font-black text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800">
                                ★ MVP
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {starterPlayerIds.includes(p.id) ? 'Titular' : 'Suplente'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Minutes Played */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[11px]">Minutos:</span>
                          <input
                            type="number"
                            min={0}
                            max={120}
                            value={currentMinutes}
                            onChange={(e) => updatePlayerRating(match.id, p.id, currentRating, Number(e.target.value), currentNotes)}
                            className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white"
                          />
                        </div>

                        {/* Rating Slider & Badge */}
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[11px]">Nota:</span>
                          <input
                            type="range"
                            min={1}
                            max={10}
                            step={0.5}
                            value={currentRating}
                            onChange={(e) => updatePlayerRating(match.id, p.id, Number(e.target.value), currentMinutes, currentNotes)}
                            className="accent-amber-400 cursor-pointer w-20"
                          />
                          <span className="font-black text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 min-w-[36px] text-center">
                            {currentRating}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Feedback Note Input */}
                    <div className="mt-2.5">
                      <input
                        type="text"
                        placeholder="Comentario técnico o recomendación para este jugador..."
                        value={currentNotes}
                        onChange={(e) => updatePlayerRating(match.id, p.id, currentRating, currentMinutes, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1 text-xs text-slate-300 placeholder-slate-600 focus:outline-emerald-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: ÁREA FÍSICA (P.F.) - Sub 14 a Sub 20 */}
      {activeTab === 'physical_area' && (
        <MatchPhysicalReportTab match={match} />
      )}

      {/* TAB: MÉTRICAS GPS & PSE (EXCLUSIVO SUB-20) */}
      {activeTab === 'gps_sub20' && (
        <Sub20GpsReportTab match={match} />
      )}

      {/* SLOT ASSIGNMENT MODAL (Select player for starting slot) */}
      {activeSlotIdForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-white text-base">Asignar Jugador al 11 Titular</h3>
                <p className="text-xs text-slate-400">Selecciona el jugador para esta posición táctica</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSlotIdForAssign(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {players.map((p) => {
                const isAlreadyStarting = starterPlayerIds.includes(p.id);
                const posConfig = POSITION_LABELS[p.primaryPosition] || POSITION_LABELS['MC'];
                const isInjured = p.status === 'Lesionado';

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isInjured}
                    onClick={() => handleSelectPlayerForSlot(p.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors ${
                      isInjured
                        ? 'opacity-40 cursor-not-allowed bg-rose-950/20 border-rose-900/60'
                        : 'bg-slate-950 hover:bg-emerald-950/40 border-slate-800 hover:border-emerald-600 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                        isInjured ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-white'
                      }`}>
                        #{p.squadNumber}
                      </span>
                      <div>
                        <p className={`font-bold text-xs ${isInjured ? 'text-rose-300' : 'text-white'}`}>
                          {p.nickname || `${p.firstName} ${p.lastName}`}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] font-bold px-1 rounded uppercase ${posConfig.color}`}>
                            {p.primaryPosition}
                          </span>
                          {isInjured ? (
                            <span className="text-[9px] text-rose-400 font-bold bg-rose-950 px-1 py-0.2 rounded border border-rose-800">
                              🚫 Lesionado (Baja médica)
                            </span>
                          ) : p.status !== 'Disponible' ? (
                            <span className="text-[9px] text-amber-400 font-semibold">({p.status})</span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {isInjured ? (
                      <span className="text-[10px] text-rose-400 font-bold">No convocable</span>
                    ) : isAlreadyStarting ? (
                      <span className="text-[10px] text-slate-400 font-medium">Reubicar</span>
                    ) : (
                      <span className="text-xs text-emerald-400 font-bold">+ Seleccionar</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LIVE EVENT LOGGING MODAL */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-white text-base">
                Registrar Incidencia de Partido
              </h3>
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLiveEvent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tipo de Evento</label>
                  <select
                    value={liveEventType}
                    onChange={(e) => setLiveEventType(e.target.value as MatchEventType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                  >
                    <option value="goal">⚽ Gol a Favor</option>
                    <option value="goal_conceded">❌ Gol Rival</option>
                    <option value="yellow_card">🟨 Tarjeta Amarilla</option>
                    <option value="red_card">🟥 Tarjeta Roja</option>
                    <option value="sub_in_out">🔄 Sustitución</option>
                    <option value="injury">🚑 Lesión / Salida por Lesión</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Minuto</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={liveEventMinute}
                    onChange={(e) => setLiveEventMinute(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                  />
                </div>
              </div>

              {liveEventType === 'injury' && (
                <div>
                  <label className="block font-semibold text-rose-400 mb-1">Futbolista que Salió Lesionado</label>
                  <select
                    value={liveEventPlayerId}
                    onChange={(e) => setLiveEventPlayerId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                  >
                    <option value="">Selecciona lesionado...</option>
                    {allSquadPlayers.map((p) => (
                      <option key={p.id} value={p.id}>#{p.squadNumber} {p.nickname || `${p.firstName} ${p.lastName}`} ({p.primaryPosition})</option>
                    ))}
                  </select>
                </div>
              )}

              {liveEventType === 'goal' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Anotador (Nuestro Jugador)</label>
                    <select
                      value={liveEventPlayerId}
                      onChange={(e) => setLiveEventPlayerId(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    >
                      <option value="">Selecciona anotador...</option>
                      {allSquadPlayers.map((p) => (
                        <option key={p.id} value={p.id}>#{p.squadNumber} {p.nickname || `${p.firstName} ${p.lastName}`}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Asistencia (Opcional)</label>
                    <select
                      value={liveEventAssistId}
                      onChange={(e) => setLiveEventAssistId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    >
                      <option value="">Sin asistencia</option>
                      {allSquadPlayers.map((p) => (
                        <option key={p.id} value={p.id}>#{p.squadNumber} {p.nickname || `${p.firstName} ${p.lastName}`}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {liveEventType === 'goal_conceded' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Anotador Rival (Opcional)</label>
                  <input
                    type="text"
                    placeholder="ej. Delantero #9 Martínez"
                    value={liveEventRivalName}
                    onChange={(e) => setLiveEventRivalName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              )}

              {(liveEventType === 'yellow_card' || liveEventType === 'red_card') && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Jugador Amonestado</label>
                  <select
                    value={liveEventPlayerId}
                    onChange={(e) => setLiveEventPlayerId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="">Selecciona jugador...</option>
                    {allSquadPlayers.map((p) => (
                      <option key={p.id} value={p.id}>#{p.squadNumber} {p.nickname || `${p.firstName} ${p.lastName}`}</option>
                    ))}
                  </select>
                </div>
              )}

              {liveEventType === 'sub_in_out' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-emerald-400 mb-1">Entra al campo</label>
                    <select
                      value={liveEventPlayerId}
                      onChange={(e) => setLiveEventPlayerId(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    >
                      <option value="">Seleccionar suplente...</option>
                      {substitutePlayers.map((p) => (
                        <option key={p.id} value={p.id}>#{p.squadNumber} {p.nickname || p.lastName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-rose-400 mb-1">Sale del campo</label>
                    <select
                      value={liveEventSubOutId}
                      onChange={(e) => setLiveEventSubOutId(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    >
                      <option value="">Seleccionar titular...</option>
                      {starterPlayers.map((p) => (
                        <option key={p.id} value={p.id}>#{p.squadNumber} {p.nickname || p.lastName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {liveEventType === 'injury' ? '¿Qué le pasó al futbolista? (Mecanismo / Incidente)' : 'Detalle o Descripción de la Jugada'}
                </label>
                <input
                  type="text"
                  placeholder={liveEventType === 'injury' ? 'ej. Choque con rival, dolor agudo en rodilla y no puede apoyar' : 'ej. Cabezazo al segundo palo, falta táctica...'}
                  value={liveEventDetail}
                  onChange={(e) => setLiveEventDetail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-white font-bold rounded-lg shadow cursor-pointer ${
                    liveEventType === 'injury' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {liveEventType === 'injury' ? '🚑 Registrar Lesión' : 'Añadir al Acta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK REPORT INJURY MODAL (Directly from Match Sheet) */}
      {isQuickInjuryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Reportar Jugador Lesionado en este Partido
                  </h3>
                  <p className="text-xs text-slate-400">
                    Se añade al acta del partido y se guarda en la ficha del jugador
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickInjuryModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickRecordInjury} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-rose-400 mb-1">Futbolista que Salió Lesionado *</label>
                  <select
                    value={quickInjuryPlayerId}
                    onChange={(e) => setQuickInjuryPlayerId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                  >
                    <option value="">Seleccionar futbolista...</option>
                    {allSquadPlayers.map((p) => (
                      <option key={p.id} value={p.id}>#{p.squadNumber} {p.nickname || `${p.firstName} ${p.lastName}`} ({p.primaryPosition})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Minuto *</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={quickInjuryMinute}
                    onChange={(e) => setQuickInjuryMinute(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-400 mb-1">
                  ¿Qué le pasó al jugador? (Mecanismo del trauma / Dolor) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={quickInjuryDesc}
                  onChange={(e) => setQuickInjuryDesc(e.target.value)}
                  placeholder="Detalla qué ocurrió (ej: Choque con rival en disputa aérea, dolor agudo e inflamación en rodilla derecha sin poder continuar)..."
                  className="w-full bg-slate-950 border border-rose-800/80 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tipo de Lesión Sospechada</label>
                  <input
                    type="text"
                    value={quickInjuryType}
                    onChange={(e) => setQuickInjuryType(e.target.value)}
                    placeholder="ej: Desgarro, Esguince..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Zona Corporal Afectada</label>
                  <input
                    type="text"
                    value={quickInjuryZone}
                    onChange={(e) => setQuickInjuryZone(e.target.value)}
                    placeholder="ej: Rodilla, Tobillo..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Gravedad Estimada</label>
                <select
                  value={quickInjurySeverity}
                  onChange={(e) => setQuickInjurySeverity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="Leve">Leve (días de baja)</option>
                  <option value="Moderada">Moderada (1-3 semanas de baja)</option>
                  <option value="Grave">Grave (1-2 meses de baja)</option>
                  <option value="Muy Grave">Muy Grave (&gt; 2 meses de baja)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-rose-950/20 border border-rose-900/40 rounded-xl">
                <input
                  type="checkbox"
                  id="quickInjurySyncMedical"
                  checked={quickInjurySyncMedical}
                  onChange={(e) => setQuickInjurySyncMedical(e.target.checked)}
                  className="accent-rose-500 rounded cursor-pointer w-4 h-4"
                />
                <label htmlFor="quickInjurySyncMedical" className="text-xs text-rose-200 cursor-pointer">
                  <strong>Guardar en el Módulo Médico y Ficha del Jugador</strong> (bloqueará automáticamente futuras citaciones hasta el alta médica).
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickInjuryModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-md shadow-rose-950/50 cursor-pointer"
                >
                  Guardar Lesionado en Planilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Match Details Modal */}
      {isEditModalOpen && (
        <MatchFormModal
          matchToEdit={match}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Player, PlayerFirstTeamProjection, PlayerProjectionHistoryEntry, ProjectionLevelId } from '../../types/football';
import { useFootball } from '../../context/FootballContext';
import { useAuth } from '../../context/AuthContext';
import { PROJECTION_LEVELS, PROJECTION_LEVEL_MAP, DEFAULT_EVALUATORS, getPlayerProjection } from '../../data/projectionData';
import { POSITION_LABELS } from '../../data/mockData';
import { X, TrendingUp, Save, Calendar, UserCheck, Target, FileText, Clock, AlertCircle, Shield } from 'lucide-react';

interface PlayerProjectionModalProps {
  player: Player;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PlayerProjectionModal: React.FC<PlayerProjectionModalProps> = ({ player, onClose, onSuccess }) => {
  const { updatePlayer } = useFootball();
  const { currentUser } = useAuth();

  const currentProjection = getPlayerProjection(player);

  const [selectedLevelId, setSelectedLevelId] = useState<ProjectionLevelId>(
    currentProjection.currentLevelId || 'nivel_4'
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultNextReview = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [evaluationDate, setEvaluationDate] = useState<string>(todayStr);
  const [evaluatorName, setEvaluatorName] = useState<string>(
    currentUser?.name ? `${currentUser.name} (${currentUser.role || 'Cuerpo Técnico'})` : 'Fernando Guajardo (Jefe Técnico)'
  );
  const [nextReviewDate, setNextReviewDate] = useState<string>(
    currentProjection.nextReviewDate || defaultNextReview
  );
  const [technicalObservations, setTechnicalObservations] = useState<string>(
    currentProjection.technicalObservations || ''
  );
  const [individualImprovementObjectives, setIndividualImprovementObjectives] = useState<string>(
    currentProjection.individualImprovementObjectives || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  const selectedLevelDef = PROJECTION_LEVEL_MAP[selectedLevelId];
  const posConfig = POSITION_LABELS[player.primaryPosition] || POSITION_LABELS['MC'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const isLevelChanged = currentProjection.currentLevelId !== selectedLevelId;
      const historyEntry: PlayerProjectionHistoryEntry = {
        id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        previousLevelId: currentProjection.currentLevelId,
        previousLevelLabel: currentProjection.currentLevelLabel,
        newLevelId: selectedLevelId,
        newLevelLabel: selectedLevelDef.fullLabel,
        date: evaluationDate,
        evaluatorName,
        evaluatorRole: evaluatorName.includes('Jefe Técnico') ? 'Jefatura Fútbol Formativo' : 'Cuerpo Técnico',
        technicalObservations: technicalObservations.trim(),
        individualImprovementObjectives: individualImprovementObjectives.trim(),
        nextReviewDate,
        createdAt: new Date().toISOString(),
      };

      const updatedProjection: PlayerFirstTeamProjection = {
        currentLevelId: selectedLevelId,
        currentLevelLabel: selectedLevelDef.fullLabel,
        timeframe: selectedLevelDef.timeframe,
        evaluationDate,
        evaluatorName,
        evaluatorRole: evaluatorName.includes('Jefe Técnico') ? 'Jefatura Fútbol Formativo' : 'Cuerpo Técnico',
        nextReviewDate,
        technicalObservations: technicalObservations.trim(),
        individualImprovementObjectives: individualImprovementObjectives.trim(),
        history: [historyEntry, ...(currentProjection.history || [])],
      };

      updatePlayer(player.id, {
        firstTeamProjection: updatedProjection,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error guardando proyección:', err);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                Nivel de Proyección al Primer Equipo
              </h2>
              <p className="text-xs text-slate-400">
                Clasificación deportiva y seguimiento formativo • San Luis de Quillota
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Snapshot Banner */}
        <div className="px-5 py-3.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            {player.photoUrl ? (
              <img
                src={player.photoUrl}
                alt=""
                className="w-10 h-10 rounded-xl object-cover border border-amber-400/50 shadow"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs border border-white/20"
                style={{ backgroundColor: player.avatarColor || '#eab308' }}
              >
                #{player.squadNumber}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {player.firstName} {player.lastName}
                </span>
                <span className="text-[10px] bg-slate-800 text-amber-300 font-black px-1.5 py-0.5 rounded border border-slate-700">
                  #{player.squadNumber}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5">
                <span>{player.category}</span>
                <span>•</span>
                <span className="text-slate-300 font-semibold">{posConfig.label} - {posConfig.full}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Nivel Actual
            </span>
            <span className={`inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded-md border ${PROJECTION_LEVEL_MAP[currentProjection.currentLevelId]?.badgeBg} ${PROJECTION_LEVEL_MAP[currentProjection.currentLevelId]?.badgeText} ${PROJECTION_LEVEL_MAP[currentProjection.currentLevelId]?.borderColor}`}>
              {PROJECTION_LEVEL_MAP[currentProjection.currentLevelId]?.code}
            </span>
          </div>
        </div>

        {/* Evaluation Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Level Dropdown */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Clasificación del Nivel de Proyección (Obligatorio)</span>
            </label>
            <select
              value={selectedLevelId}
              onChange={(e) => setSelectedLevelId(e.target.value as ProjectionLevelId)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-semibold text-xs focus:outline-emerald-500 cursor-pointer"
            >
              {PROJECTION_LEVELS.map((lvl) => (
                <option key={lvl.id} value={lvl.id} className="bg-slate-900 text-white">
                  {lvl.fullLabel} — (Plazo: {lvl.timeframe})
                </option>
              ))}
            </select>
          </div>

          {/* Detailed Criteria Box of Selected Level */}
          <div className={`p-3.5 rounded-xl border ${selectedLevelDef.chipBg} ${selectedLevelDef.borderColor} space-y-1.5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${selectedLevelDef.dotColor}`} />
                <strong className={`text-xs uppercase font-extrabold ${selectedLevelDef.badgeText}`}>
                  {selectedLevelDef.code} — {selectedLevelDef.title}
                </strong>
              </div>
              <span className="text-[11px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">
                Plazo: {selectedLevelDef.timeframe}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {selectedLevelDef.description}
            </p>
          </div>

          {/* Technical Observations */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Observaciones Técnicas (Justificación de la clasificación)</span>
            </label>
            <textarea
              rows={3}
              required
              value={technicalObservations}
              onChange={(e) => setTechnicalObservations(e.target.value)}
              placeholder="Detalle los fundamentos técnicos, tácticos, actitudinales o biométricos que justifican el nivel asignado..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 text-xs focus:outline-emerald-500 resize-none leading-relaxed"
            />
          </div>

          {/* Individual Improvement Objectives */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>Objetivos de Mejora Individuales (Técnicos, Tácticos, Físicos, Nutricionales o Psicológicos)</span>
            </label>
            <textarea
              rows={3}
              required
              value={individualImprovementObjectives}
              onChange={(e) => setIndividualImprovementObjectives(e.target.value)}
              placeholder="Especifique los aspectos concretos a potenciar: ej. juego aéreo, toma de decisiones bajo presión, ganancia de masa muscular, velocidad en repliegue..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 text-xs focus:outline-emerald-500 resize-none leading-relaxed"
            />
          </div>

          {/* Dates and Evaluator Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] font-semibold block flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>Fecha de Evaluación</span>
              </label>
              <input
                type="date"
                required
                value={evaluationDate}
                onChange={(e) => setEvaluationDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] font-semibold block flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-slate-500" />
                <span>Responsable de Evaluación</span>
              </label>
              <input
                type="text"
                list="evaluators-list"
                required
                value={evaluatorName}
                onChange={(e) => setEvaluatorName(e.target.value)}
                placeholder="Nombre del evaluador..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-emerald-500"
              />
              <datalist id="evaluators-list">
                {DEFAULT_EVALUATORS.map((ev) => (
                  <option key={ev} value={ev} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] font-semibold block flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Próxima Revisión</span>
              </label>
              <input
                type="date"
                required
                value={nextReviewDate}
                onChange={(e) => setNextReviewDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-emerald-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Registrar Proyección Deportiva'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

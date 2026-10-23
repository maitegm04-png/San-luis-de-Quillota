import React, { useState } from 'react';
import { Player } from '../../types/football';
import { getPlayerProjection, PROJECTION_LEVEL_MAP } from '../../data/projectionData';
import { PlayerProjectionModal } from './PlayerProjectionModal';
import { 
  TrendingUp, 
  Calendar, 
  UserCheck, 
  Clock, 
  Target, 
  FileText, 
  Edit3, 
  History, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  ShieldAlert,
  Award
} from 'lucide-react';

interface PlayerProjectionSectionProps {
  player: Player;
}

export const PlayerProjectionSection: React.FC<PlayerProjectionSectionProps> = ({ player }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const projection = getPlayerProjection(player);
  const levelDef = PROJECTION_LEVEL_MAP[projection.currentLevelId] || PROJECTION_LEVEL_MAP['nivel_4'];
  const historyEntries = projection.history || [];

  return (
    <div className="pt-2 border-t border-slate-800 space-y-3">
      {/* Section Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Nivel de Proyección al Primer Equipo</span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${levelDef.badgeBg} ${levelDef.badgeText} ${levelDef.borderColor}`}>
                {levelDef.code}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Evaluación deportiva de la jefatura técnica y cuerpo técnico de Cantera
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {historyEntries.length > 1 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <History className="w-3 h-3 text-amber-400" />
              <span>Historial ({historyEntries.length})</span>
              {showHistory ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow transition-colors cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>Actualizar Proyección</span>
          </button>
        </div>
      </div>

      {/* Main Projection Badge Card */}
      <div className={`p-4 rounded-xl border ${levelDef.chipBg} ${levelDef.borderColor} bg-slate-950/70 space-y-3`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${levelDef.dotColor} animate-pulse`} />
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                Clasificación Oficial
              </span>
            </div>
            <h4 className={`text-base font-black ${levelDef.badgeText} mt-0.5`}>
              {levelDef.fullLabel}
            </h4>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Horizonte temporal:</span>
            <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300">
              {levelDef.timeframe}
            </span>
          </div>
        </div>

        {/* Level Official Description */}
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
          <strong className="text-white font-semibold">Criterio Institucional: </strong>
          {levelDef.description}
        </p>

        {/* 2-Column Details: Observaciones Técnicas & Objetivos de Mejora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
          {/* Observaciones Técnicas (Justificación) */}
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-emerald-400 uppercase font-black tracking-wider flex items-center gap-1.5">
              <FileText className="w-3 h-3" />
              <span>Justificación y Observaciones Técnicas</span>
            </span>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {projection.technicalObservations || 'Sin observaciones registradas para esta evaluación.'}
            </p>
          </div>

          {/* Objetivos de Mejora Individuales */}
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-amber-400 uppercase font-black tracking-wider flex items-center gap-1.5">
              <Target className="w-3 h-3" />
              <span>Objetivos de Mejora Individuales</span>
            </span>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {projection.individualImprovementObjectives || 'Sin objetivos específicos fijados actualmente.'}
            </p>
          </div>
        </div>

        {/* Evaluator & Review Metadata Footer */}
        <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">
              Evaluador: <strong className="text-slate-200">{projection.evaluatorName || 'Fernando Guajardo (Jefe Técnico)'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>
              Fecha Evaluación: <strong className="text-slate-200">{projection.evaluationDate || '-'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
            <span>
              Próxima Revisión: <strong className="text-amber-300">{projection.nextReviewDate || '-'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Historical Changes Drawer / Accordion */}
      {showHistory && historyEntries.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-extrabold text-slate-200 uppercase text-[11px] flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Historial de Evaluaciones y Proyección ({historyEntries.length})</span>
            </span>
            <span className="text-[10px] text-slate-500">Trazabilidad deportiva del canterano</span>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {historyEntries.map((entry, index) => {
              const entryDef = PROJECTION_LEVEL_MAP[entry.newLevelId] || PROJECTION_LEVEL_MAP['nivel_4'];
              const prevDef = entry.previousLevelId ? PROJECTION_LEVEL_MAP[entry.previousLevelId] : null;

              return (
                <div
                  key={entry.id || index}
                  className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {prevDef ? (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                          <span className="line-through opacity-70">{prevDef.code}</span>
                          <ArrowRight className="w-3 h-3 text-amber-400" />
                          <span className={`font-black ${entryDef.badgeText}`}>{entryDef.code}</span>
                        </div>
                      ) : (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${entryDef.badgeBg} ${entryDef.badgeText}`}>
                          {entryDef.code} (Inicial)
                        </span>
                      )}
                      <span className="text-white font-bold">{entry.newLevelLabel}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>{entry.date}</span>
                      <span>•</span>
                      <span className="text-slate-300">{entry.evaluatorName}</span>
                    </div>
                  </div>

                  {entry.technicalObservations && (
                    <p className="text-[11px] text-slate-300 italic">
                      "{entry.technicalObservations}"
                    </p>
                  )}

                  {entry.individualImprovementObjectives && (
                    <div className="text-[10px] text-amber-300/90 bg-amber-950/20 px-2 py-1 rounded border border-amber-900/30">
                      <strong>Objetivos: </strong>{entry.individualImprovementObjectives}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      {isModalOpen && (
        <PlayerProjectionModal
          player={player}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

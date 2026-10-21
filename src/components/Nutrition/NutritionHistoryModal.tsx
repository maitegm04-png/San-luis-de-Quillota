import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Scale, 
  Activity, 
  TrendingDown, 
  TrendingUp, 
  Download, 
  Plus, 
  FileUp, 
  CheckCircle2, 
  AlertTriangle, 
  FileText,
  User,
  Trash2,
  Printer
} from 'lucide-react';
import { useFootball } from '../../context/FootballContext';
import { Player, PlayerNutritionalEvaluation } from '../../types/football';
import { generateSampleNutritionPdf } from '../../services/nutritionSamplePdfGenerator';

interface NutritionHistoryModalProps {
  player: Player;
  onClose: () => void;
  onOpenNewEvaluation?: () => void;
  onOpenUploadPdf?: () => void;
}

export const NutritionHistoryModal: React.FC<NutritionHistoryModalProps> = ({
  player,
  onClose,
  onOpenNewEvaluation,
  onOpenUploadPdf,
}) => {
  const { getPlayerNutritionalHistory, deleteNutritionalEvaluation } = useFootball();

  const history = getPlayerNutritionalHistory(player.id);
  const latest = history[0];

  const [selectedEvalId, setSelectedEvalId] = useState<string>(latest?.id || '');
  const activeEval = history.find((e) => e.id === selectedEvalId) || latest;

  const handleDownloadPdf = (ev: PlayerNutritionalEvaluation) => {
    const sample = generateSampleNutritionPdf(
      player,
      ev.trafficLight === 'green' ? 'optimo' : ev.trafficLight === 'yellow' ? 'alerta' : 'atencion',
      ev.date,
      ev.periodName
    );
    sample.doc.save(sample.fileName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            {player.photoUrl ? (
              <img
                src={player.photoUrl}
                alt={player.firstName}
                className="w-12 h-12 rounded-xl object-cover border-2 border-amber-400 shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-emerald-700 flex items-center justify-center font-black text-white text-base shadow-md">
                #{player.squadNumber}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                  #{player.squadNumber} • {player.primaryPosition}
                </span>
                <span className="text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {player.category}
                </span>
                <span className="text-xs text-slate-400">
                  Ficha: <strong className="text-slate-200">{player.idCard || 'N/A'}</strong>
                </span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Historial Nutricional: {player.firstName} {player.lastName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenUploadPdf && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUploadPdf();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 hover:text-white bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/40 rounded-lg transition-colors cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Subir PDF</span>
              </button>
            )}
            {onOpenNewEvaluation && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewEvaluation();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nueva Evaluación</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Current Nutrition Summary Card */}
          {latest ? (
            <div
              className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                latest.trafficLight === 'green'
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                  : latest.trafficLight === 'yellow'
                  ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                  : 'bg-rose-950/30 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-lg ${
                    latest.trafficLight === 'green'
                      ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                      : latest.trafficLight === 'yellow'
                      ? 'bg-amber-500/20 border border-amber-400 text-amber-300'
                      : 'bg-rose-500/20 border border-rose-400 text-rose-300'
                  }`}
                >
                  {latest.trafficLight === 'green' ? '🟢' : latest.trafficLight === 'yellow' ? '🟡' : '🔴'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                      Situación Actual en Ficha
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        latest.trafficLight === 'green'
                          ? 'bg-emerald-500 text-slate-950'
                          : latest.trafficLight === 'yellow'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {latest.statusClassification}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-0.5">
                    {latest.bodyFatPercent !== undefined ? `${latest.bodyFatPercent}% Grasa` : 'Grasa evaluada'} • {latest.weightKg} kg
                    <span className="text-xs font-normal text-slate-400 ml-2">
                      (Último control: {latest.date})
                    </span>
                  </h3>
                  <p className="text-xs opacity-90 mt-1 max-w-xl">
                    {latest.statusReason || latest.notes || 'Composición corporal registrada y sincronizada.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(latest)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Informe PDF</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-3">
              <Scale className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Sin evaluaciones nutricionales registradas</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Sube un informe PDF de antropometría o añade una evaluación manual para inicializar el perfil nutricional de este futbolista.
              </p>
            </div>
          )}

          {/* Evaluations Across The Year Timeline */}
          {history.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Evaluaciones del Año ({history.length} registradas)
                </h3>
                <span className="text-[11px] text-slate-400">
                  Ordenadas cronológicamente (más recientes primero)
                </span>
              </div>

              {/* Comparative Table */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                      <th className="p-3">Fecha y Período</th>
                      <th className="p-3 text-center">Semáforo</th>
                      <th className="p-3 text-center">Peso</th>
                      <th className="p-3 text-center">IMC</th>
                      <th className="p-3 text-center">% Grasa</th>
                      <th className="p-3 text-center">% Músculo</th>
                      <th className="p-3 text-center">Pliegues (mm)</th>
                      <th className="p-3">Diagnóstico / Nutricionista</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {history.map((ev, idx) => {
                      const prev = history[idx + 1];
                      const fatDiff =
                        prev && ev.bodyFatPercent !== undefined && prev.bodyFatPercent !== undefined
                          ? Number((ev.bodyFatPercent - prev.bodyFatPercent).toFixed(1))
                          : null;
                      const muscleDiff =
                        prev && ev.muscleMassPercent !== undefined && prev.muscleMassPercent !== undefined
                          ? Number((ev.muscleMassPercent - prev.muscleMassPercent).toFixed(1))
                          : null;

                      const isSelected = ev.id === selectedEvalId;

                      return (
                        <tr
                          key={ev.id}
                          onClick={() => setSelectedEvalId(ev.id)}
                          className={`hover:bg-slate-900/60 transition-colors cursor-pointer ${
                            isSelected ? 'bg-slate-900/90 ring-1 ring-amber-400/50' : ''
                          }`}
                        >
                          <td className="p-3 whitespace-nowrap">
                            <strong className="text-white block">{ev.date}</strong>
                            <span className="text-[11px] text-amber-300/90">{ev.periodName}</span>
                          </td>

                          <td className="p-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                ev.trafficLight === 'green'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : ev.trafficLight === 'yellow'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              <span>{ev.trafficLight === 'green' ? '🟢' : ev.trafficLight === 'yellow' ? '🟡' : '🔴'}</span>
                              <span>{ev.statusClassification}</span>
                            </span>
                          </td>

                          <td className="p-3 text-center font-bold text-white whitespace-nowrap">
                            {ev.weightKg} kg
                          </td>

                          <td className="p-3 text-center text-slate-300 whitespace-nowrap">
                            {ev.bmi}
                          </td>

                          <td className="p-3 text-center whitespace-nowrap">
                            {ev.bodyFatPercent !== undefined ? (
                              <div>
                                <span
                                  className={`font-black ${
                                    ev.bodyFatPercent <= 12.0
                                      ? 'text-emerald-400'
                                      : ev.bodyFatPercent <= 14.5
                                      ? 'text-amber-300'
                                      : 'text-rose-400'
                                  }`}
                                >
                                  {ev.bodyFatPercent}%
                                </span>
                                {fatDiff !== null && (
                                  <span
                                    className={`block text-[10px] font-semibold ${
                                      fatDiff < 0 ? 'text-emerald-400' : fatDiff > 0 ? 'text-rose-400' : 'text-slate-400'
                                    }`}
                                  >
                                    {fatDiff > 0 ? `+${fatDiff}%` : `${fatDiff}%`}
                                  </span>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>

                          <td className="p-3 text-center whitespace-nowrap">
                            {ev.muscleMassPercent !== undefined ? (
                              <div>
                                <span className="font-bold text-blue-400">{ev.muscleMassPercent}%</span>
                                {muscleDiff !== null && (
                                  <span
                                    className={`block text-[10px] font-semibold ${
                                      muscleDiff > 0 ? 'text-emerald-400' : muscleDiff < 0 ? 'text-amber-400' : 'text-slate-400'
                                    }`}
                                  >
                                    {muscleDiff > 0 ? `+${muscleDiff}%` : `${muscleDiff}%`}
                                  </span>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>

                          <td className="p-3 text-center text-slate-300 whitespace-nowrap">
                            {ev.skinfoldSumMm ? `${ev.skinfoldSumMm} mm` : '-'}
                          </td>

                          <td className="p-3 max-w-xs truncate">
                            <span className="text-slate-300 block truncate font-medium">
                              {ev.statusReason || ev.notes || 'Control estándar'}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {ev.nutritionistName || 'Nutricionista'}
                            </span>
                          </td>

                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleDownloadPdf(ev)}
                                title="Descargar PDF de esta evaluación"
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`¿Eliminar la evaluación del ${ev.date} (${ev.periodName})?`)) {
                                    deleteNutritionalEvaluation(ev.id);
                                  }
                                }}
                                title="Eliminar registro"
                                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Active Evaluation Detailed Card */}
              {activeEval && (
                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] text-amber-400 uppercase font-black tracking-wider block">
                        Detalle del Informe Seleccionado
                      </span>
                      <h4 className="text-base font-bold text-white">
                        {activeEval.periodName} • {activeEval.date}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1.5 ${
                          activeEval.trafficLight === 'green'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : activeEval.trafficLight === 'yellow'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        <span>{activeEval.trafficLight === 'green' ? '🟢' : activeEval.trafficLight === 'yellow' ? '🟡' : '🔴'}</span>
                        <span>{activeEval.statusClassification}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(activeEval)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF Oficial</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">Peso Corporal</span>
                      <span className="text-lg font-black text-white">{activeEval.weightKg} kg</span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">Estatura</span>
                      <span className="text-lg font-black text-white">{activeEval.heightCm} cm</span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">% Grasa (Adiposo)</span>
                      <span
                        className={`text-lg font-black ${
                          activeEval.bodyFatPercent && activeEval.bodyFatPercent <= 12.0
                            ? 'text-emerald-400'
                            : activeEval.bodyFatPercent && activeEval.bodyFatPercent <= 14.5
                            ? 'text-amber-300'
                            : 'text-rose-400'
                        }`}
                      >
                        {activeEval.bodyFatPercent !== undefined ? `${activeEval.bodyFatPercent}%` : '-'}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-bold">% Masa Muscular</span>
                      <span className="text-lg font-black text-blue-400">
                        {activeEval.muscleMassPercent !== undefined ? `${activeEval.muscleMassPercent}%` : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Notes & Recommendations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                        Diagnóstico y Observaciones
                      </span>
                      <p className="text-slate-200 leading-relaxed italic">
                        "{activeEval.notes || activeEval.statusReason || 'Sin observaciones adicionales.'}"
                      </p>
                      <span className="text-[10px] text-amber-400 font-bold mt-2 block">
                        Evaluador: {activeEval.nutritionistName || 'Nutricionista San Luis'}
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                        Pauta Dietética y Recomendaciones
                      </span>
                      <p className="text-slate-200 leading-relaxed">
                        {activeEval.recommendations || 'Mantener pauta habitual de competición.'}
                      </p>
                      {activeEval.target && (
                        <div className="mt-2 text-[10px] text-emerald-300 font-bold">
                          🎯 Objetivo: {activeEval.target}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Total en historial: <strong className="text-white">{history.length} evaluaciones</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

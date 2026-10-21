import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  CheckCircle2, 
  Scale, 
  User, 
  Calendar, 
  Activity, 
  Sparkles,
  HeartPulse
} from 'lucide-react';
import { useFootball } from '../../context/FootballContext';
import { determineNutritionTrafficLight } from '../../services/nutritionPdfParser';
import { NutritionTrafficLight, NutritionStatusType } from '../../types/football';

interface NutritionManualModalProps {
  onClose: () => void;
  initialPlayerId?: string;
  onSuccess?: () => void;
}

export const NutritionManualModal: React.FC<NutritionManualModalProps> = ({
  onClose,
  initialPlayerId,
  onSuccess,
}) => {
  const { players, addNutritionalEvaluation } = useFootball();

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(initialPlayerId || players[0]?.id || '');
  const [evaluationDate, setEvaluationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [periodName, setPeriodName] = useState<string>('Control Antropométrico');
  const [age, setAge] = useState<number | undefined>(19);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [bodyFatPercent, setBodyFatPercent] = useState<number | undefined>(17.5);
  const [bodyFatKg, setBodyFatKg] = useState<number | undefined>(12.2);
  const [muscleMassPercent, setMuscleMassPercent] = useState<number | undefined>(52.0);
  const [muscleMassKg, setMuscleMassKg] = useState<number | undefined>(36.4);
  const [skinfoldSumMm, setSkinfoldSumMm] = useState<number | undefined>(38.5);
  const [imo, setImo] = useState<number | undefined>(4.2);
  const [hydrationPercent, setHydrationPercent] = useState<number | undefined>(62);
  const [visceralFat, setVisceralFat] = useState<number | undefined>(3);
  const [trafficLight, setTrafficLight] = useState<NutritionTrafficLight>('green');
  const [statusClassification, setStatusClassification] = useState<NutritionStatusType>('Óptimo');
  const [target, setTarget] = useState<string>('Mantener composición óptima y potencia');
  const [nutritionistName, setNutritionistName] = useState<string>('Lic. Camila Valenzuela R.');
  const [notes, setNotes] = useState<string>('Evaluación antropométrica oficial registrada.');
  const [recommendations, setRecommendations] = useState<string>('Mantener hidratación y colación de recuperación post partido.');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const targetPlayer = players.find((p) => p.id === selectedPlayerId);

  // Auto-populate when selected player changes
  React.useEffect(() => {
    if (targetPlayer) {
      if (targetPlayer.weightKg) setWeightKg(targetPlayer.weightKg);
      if (targetPlayer.heightCm) setHeightCm(targetPlayer.heightCm);
      if (targetPlayer.birthDate) {
        const birth = new Date(targetPlayer.birthDate);
        const diff = new Date().getFullYear() - birth.getFullYear();
        if (diff > 12 && diff < 45) setAge(diff);
      }
      if (targetPlayer.currentNutrition) {
        const cn = targetPlayer.currentNutrition;
        if (cn.age !== undefined) setAge(cn.age);
        if (cn.bodyFatPercent !== undefined) setBodyFatPercent(cn.bodyFatPercent);
        if (cn.bodyFatKg !== undefined) setBodyFatKg(cn.bodyFatKg);
        if (cn.muscleMassPercent !== undefined) setMuscleMassPercent(cn.muscleMassPercent);
        if (cn.muscleMassKg !== undefined) setMuscleMassKg(cn.muscleMassKg);
        if (cn.skinfoldSumMm !== undefined) setSkinfoldSumMm(cn.skinfoldSumMm);
        if (cn.imo !== undefined) setImo(cn.imo);
        if (cn.trafficLight) setTrafficLight(cn.trafficLight);
        if (cn.statusClassification) setStatusClassification(cn.statusClassification);
      }
    }
  }, [selectedPlayerId, targetPlayer]);

  // Recalculate BMI
  const bmi = React.useMemo(() => {
    if (weightKg > 0 && heightCm > 0) {
      const hM = heightCm / 100;
      return Number((weightKg / (hM * hM)).toFixed(1));
    }
    return 22;
  }, [weightKg, heightCm]);

  const handleValuesChange = (
    newFat?: number,
    newSkinfold?: number,
    newWeight?: number,
    newHeight?: number
  ) => {
    const w = newWeight !== undefined ? newWeight : weightKg;
    const h = newHeight !== undefined ? newHeight : heightCm;
    const hM = h / 100;
    const computedBmi = hM > 0 ? Number((w / (hM * hM)).toFixed(1)) : 22;

    const currentFat = newFat !== undefined ? newFat : bodyFatPercent;
    const currentSkinfold = newSkinfold !== undefined ? newSkinfold : skinfoldSumMm;

    // Auto-update kg if percent changed
    if (currentFat !== undefined && w > 0) {
      setBodyFatKg(Number(((currentFat / 100) * w).toFixed(2)));
    }
    if (muscleMassPercent !== undefined && w > 0) {
      setMuscleMassKg(Number(((muscleMassPercent / 100) * w).toFixed(2)));
    }

    const evaluation = determineNutritionTrafficLight(currentFat, computedBmi, currentSkinfold, notes);
    setTrafficLight(evaluation.trafficLight);
    setStatusClassification(evaluation.status);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId || !targetPlayer) {
      setFeedbackMsg({ type: 'error', text: 'Por favor seleccione un jugador.' });
      return;
    }

    const calculatedBodyFatKg = bodyFatKg !== undefined 
      ? Number(bodyFatKg) 
      : (bodyFatPercent !== undefined && weightKg ? Number(((bodyFatPercent / 100) * weightKg).toFixed(2)) : undefined);

    const calculatedMuscleKg = muscleMassKg !== undefined 
      ? Number(muscleMassKg) 
      : (muscleMassPercent !== undefined && weightKg ? Number(((muscleMassPercent / 100) * weightKg).toFixed(2)) : undefined);

    const evalPayload = {
      playerId: selectedPlayerId,
      playerName: `${targetPlayer.firstName} ${targetPlayer.lastName}`,
      playerSquadNumber: targetPlayer.squadNumber,
      category: targetPlayer.category,
      date: evaluationDate,
      periodName: periodName.trim() || 'Control Antropométrico',
      age: age !== undefined ? Number(age) : undefined,
      weightKg: Number(weightKg) || 70,
      heightCm: Number(heightCm) || 175,
      bmi: Number(bmi) || 22,
      bodyFatPercent: bodyFatPercent !== undefined ? Number(bodyFatPercent) : undefined,
      bodyFatKg: calculatedBodyFatKg,
      muscleMassPercent: muscleMassPercent !== undefined ? Number(muscleMassPercent) : undefined,
      muscleMassKg: calculatedMuscleKg,
      skinfoldSumMm: skinfoldSumMm !== undefined ? Number(skinfoldSumMm) : undefined,
      imo: imo !== undefined ? Number(imo) : undefined,
      hydrationPercent: hydrationPercent !== undefined ? Number(hydrationPercent) : undefined,
      visceralFat: visceralFat !== undefined ? Number(visceralFat) : undefined,
      trafficLight,
      statusClassification,
      statusReason: notes.trim() || `Estado ${statusClassification}`,
      target: target.trim() || undefined,
      nutritionistName: nutritionistName.trim() || 'Nutricionista San Luis',
      notes: notes.trim() || undefined,
      recommendations: recommendations.trim() || undefined,
    };

    addNutritionalEvaluation(evalPayload);

    setFeedbackMsg({
      type: 'success',
      text: `¡Evaluación registrada para ${targetPlayer.firstName} ${targetPlayer.lastName}! La ficha en la base de datos se actualizó automáticamente.`
    });

    setTimeout(() => {
      if (onSuccess) onSuccess();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Nueva Evaluación Antropométrica Manual
              </h2>
              <p className="text-xs text-slate-400">
                Registra peso, pliegues y composición corporal directamente en el historial del jugador.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {feedbackMsg && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-500 text-rose-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
          )}
          {/* Player Selector */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              1. Seleccionar Futbolista
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <select
                value={selectedPlayerId}
                onChange={(e) => {
                  setSelectedPlayerId(e.target.value);
                  const p = players.find((pl) => pl.id === e.target.value);
                  if (p) {
                    setWeightKg(p.weightKg || 70);
                    setHeightCm(p.heightCm || 175);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-semibold focus:border-amber-400"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.squadNumber} - {p.firstName} {p.lastName} ({p.category})
                  </option>
                ))}
              </select>

              {targetPlayer && (
                <div className="flex items-center gap-3 p-2 bg-slate-900 rounded-lg border border-slate-800">
                  {targetPlayer.photoUrl ? (
                    <img
                      src={targetPlayer.photoUrl}
                      alt={targetPlayer.firstName}
                      className="w-9 h-9 rounded-lg object-cover border border-amber-400"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-xs font-black text-white">
                      #{targetPlayer.squadNumber}
                    </div>
                  )}
                  <div className="text-xs truncate">
                    <strong className="text-white block truncate">
                      {targetPlayer.firstName} {targetPlayer.lastName}
                    </strong>
                    <span className="text-slate-400">
                      {targetPlayer.primaryPosition} • {targetPlayer.category}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Color Traffic Light Indicator Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
              trafficLight === 'green'
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                : trafficLight === 'yellow'
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                : 'bg-rose-950/40 border-rose-500/60 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-xl">
                {trafficLight === 'green' ? '🟢' : trafficLight === 'yellow' ? '🟡' : '🔴'}
              </span>
              <div>
                <strong className="text-white text-sm block">
                  Estado: {statusClassification}
                </strong>
                <span className="text-[11px] opacity-90">
                  {trafficLight === 'green'
                    ? 'Composición óptima para competencia.'
                    : trafficLight === 'yellow'
                    ? 'En seguimiento quincenal.'
                    : 'Requiere plan nutricional correctivo.'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setTrafficLight('green');
                  setStatusClassification('Óptimo');
                }}
                className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                  trafficLight === 'green' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Verde
              </button>
              <button
                type="button"
                onClick={() => {
                  setTrafficLight('yellow');
                  setStatusClassification('Aceptable');
                }}
                className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                  trafficLight === 'yellow' ? 'bg-amber-500 text-slate-950 border-amber-300 font-black' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Amarillo
              </button>
              <button
                type="button"
                onClick={() => {
                  setTrafficLight('red');
                  setStatusClassification('Atención');
                }}
                className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                  trafficLight === 'red' ? 'bg-rose-600 text-white border-rose-400' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                Rojo
              </button>
            </div>
          </div>

          {/* Measurements */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              2. Mediciones Antropométricas
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Fecha de Evaluación
                </label>
                <input
                  type="date"
                  value={evaluationDate}
                  onChange={(e) => setEvaluationDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Nombre del Período / Control
                </label>
                <input
                  type="text"
                  value={periodName}
                  onChange={(e) => setPeriodName(e.target.value)}
                  placeholder="ej: Control N° 1 - Enero"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Edad del Jugador (Años)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={age !== undefined ? age : ''}
                  onChange={(e) => setAge(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="ej: 19.3"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Estatura / Talla (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={heightCm}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setHeightCm(val);
                    handleValuesChange(undefined, undefined, undefined, val);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Peso Corporal (kg)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={weightKg}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setWeightKg(val);
                    handleValuesChange(undefined, undefined, val, undefined);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  % Masa Adiposa
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bodyFatPercent !== undefined ? bodyFatPercent : ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : undefined;
                    setBodyFatPercent(val);
                    handleValuesChange(val, undefined, undefined, undefined);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-bold focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Masa Adiposa (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bodyFatKg !== undefined ? bodyFatKg : ''}
                  onChange={(e) => setBodyFatKg(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  % Masa Muscular
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={muscleMassPercent !== undefined ? muscleMassPercent : ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : undefined;
                    setMuscleMassPercent(val);
                    if (val !== undefined && weightKg > 0) {
                      setMuscleMassKg(Number(((val / 100) * weightKg).toFixed(2)));
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-blue-400 font-bold focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  Masa Muscular (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={muscleMassKg !== undefined ? muscleMassKg : ''}
                  onChange={(e) => setMuscleMassKg(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-blue-300 font-bold focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  6 Pliegues (mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={skinfoldSumMm !== undefined ? skinfoldSumMm : ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseFloat(e.target.value) : undefined;
                    setSkinfoldSumMm(val);
                    handleValuesChange(undefined, val, undefined, undefined);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  IMO (Músculo/Óseo)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={imo !== undefined ? imo : ''}
                  onChange={(e) => setImo(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="ej: 4.18"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-bold focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  IMC Calculado
                </label>
                <div className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-black">
                  {bmi} kg/m²
                </div>
              </div>
            </div>
          </div>

          {/* Diagnosis & Recommendations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">
                Objetivo / Meta
              </label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="ej: Mantener rendimiento óptimo"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">
                Nutricionista Responsable
              </label>
              <input
                type="text"
                value={nutritionistName}
                onChange={(e) => setNutritionistName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] text-slate-400 font-bold block mb-1">
                Diagnóstico Nutricional
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] text-slate-400 font-bold block mb-1">
                Pauta y Recomendaciones
              </label>
              <textarea
                rows={2}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-amber-400"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Evaluación en Ficha</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

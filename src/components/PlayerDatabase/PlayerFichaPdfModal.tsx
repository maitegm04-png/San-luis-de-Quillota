import React, { useRef, useState } from 'react';
import { Player } from '../../types/football';
import { POSITION_LABELS } from '../../data/mockData';
import { SanLuisLogo } from '../Common/SanLuisLogo';
import { exportPlayerFichaToPdf, calculatePlayerAge, calculatePlayerOverall } from '../../services/playerPdfGenerator';
import { useFootball } from '../../context/FootballContext';
import { 
  X, 
  Download, 
  Printer, 
  Shield, 
  Calendar, 
  Phone, 
  Mail, 
  FileText, 
  Activity, 
  Trophy, 
  Award,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';

interface PlayerFichaPdfModalProps {
  player: Player;
  onClose: () => void;
}

export const PlayerFichaPdfModal: React.FC<PlayerFichaPdfModalProps> = ({ player, onClose }) => {
  const { injuries, getPlayerNutritionalHistory } = useFootball();
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const nutritionalHistory = getPlayerNutritionalHistory(player.id);
  const currentNutrition = player.currentNutrition || (nutritionalHistory[0] ? {
    lastEvaluationDate: nutritionalHistory[0].date,
    weightKg: nutritionalHistory[0].weightKg,
    heightCm: nutritionalHistory[0].heightCm,
    bmi: nutritionalHistory[0].bmi,
    bodyFatPercent: nutritionalHistory[0].bodyFatPercent,
    muscleMassPercent: nutritionalHistory[0].muscleMassPercent,
    muscleMassKg: nutritionalHistory[0].muscleMassKg,
    skinfoldSumMm: nutritionalHistory[0].skinfoldSumMm,
    trafficLight: nutritionalHistory[0].trafficLight,
    statusClassification: nutritionalHistory[0].statusClassification,
    summary: nutritionalHistory[0].statusReason || nutritionalHistory[0].notes || '',
    evaluationCount: nutritionalHistory.length,
    target: nutritionalHistory[0].target,
    nutritionistName: nutritionalHistory[0].nutritionistName,
    recommendations: nutritionalHistory[0].recommendations,
  } : undefined);

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

  const posConfig = POSITION_LABELS[player.primaryPosition] || POSITION_LABELS['MC'];
  const age = calculatePlayerAge(player.birthDate);
  const overall = calculatePlayerOverall(player);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    try {
      await exportPlayerFichaToPdf(printRef.current, {
        player,
        category: player.category,
      });
    } catch (err) {
      console.error('Error generando PDF de ficha de jugador:', err);
      alert('Hubo un error al generar el PDF. Puede utilizar el botón "Imprimir" y seleccionar "Guardar como PDF".');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // BMI calculation
  const heightM = player.heightCm ? player.heightCm / 100 : 0;
  const bmi = heightM > 0 && player.weightKg ? (player.weightKg / (heightM * heightM)).toFixed(1) : '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-4">
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Ficha Oficial del Jugador: {player.firstName} {player.lastName}
              </h3>
              <p className="text-[11px] text-slate-400">
                Documento técnico y federativo descargable e imprimible • San Luis de Quillota
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Generando PDF...' : 'Descargar PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir Ficha</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Container for Preview */}
        <div className="p-4 sm:p-6 max-h-[82vh] overflow-y-auto bg-slate-950/60">
          {/* Printable Ficha Container (This element is isolated during print and PDF export) */}
          <div
            id="printable-player-ficha"
            ref={printRef}
            className="bg-white text-slate-900 rounded-xl p-6 sm:p-8 shadow-xl border border-slate-300 max-w-3xl mx-auto font-sans print:shadow-none print:border-none print:p-0 print:m-0"
          >
            {/* Header / Club Identity Banner */}
            <div className="border-b-2 border-black pb-4 mb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <SanLuisLogo className="w-16 h-18 shrink-0 drop-shadow" />
                  <div>
                    <h1 className="text-xl font-black text-black tracking-tight uppercase leading-tight">
                      San Luis de Quillota S.A.D.P.
                    </h1>
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                      Fútbol Formativo y Joven • Ficha Técnica Oficial
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Categoría: <strong className="text-black uppercase">{player.category}</strong> • Temporada 2026
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded border border-black shadow-xs uppercase">
                    Dorsal #{player.squadNumber}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 font-semibold">
                    Valoración Cantera: <span className="font-black text-slate-900 text-sm">{overall}</span> / 99
                  </div>
                </div>
              </div>
            </div>

            {/* Main Player Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Photo & Jersey Column */}
              <div className="flex flex-col items-center justify-center bg-slate-50 border-2 border-slate-800 rounded-xl p-4 text-center">
                <div className="relative mb-3">
                  {player.photoUrl ? (
                    <img
                      src={player.photoUrl}
                      alt={`${player.firstName} ${player.lastName}`}
                      className="w-32 h-32 rounded-2xl object-cover border-3 border-amber-400 shadow-md"
                    />
                  ) : (
                    <div
                      className="w-32 h-32 rounded-2xl flex flex-col items-center justify-center font-black text-white text-3xl shadow-md border-3 border-slate-800"
                      style={{ backgroundColor: player.avatarColor || '#eab308' }}
                    >
                      <span>#{player.squadNumber}</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">San Luis</span>
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-slate-950 text-amber-400 font-black text-xs px-2 py-0.5 rounded-md border border-amber-400 shadow">
                    #{player.squadNumber}
                  </div>
                </div>

                <h2 className="text-lg font-black text-slate-900 leading-tight">
                  {player.firstName} {player.lastName}
                </h2>
                {player.nickname && (
                  <p className="text-xs font-bold text-amber-700 italic mt-0.5">"{player.nickname}"</p>
                )}

                <div className="mt-2 flex items-center gap-1.5 flex-wrap justify-center">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-900 text-white">
                    {posConfig.label} - {posConfig.full}
                  </span>
                  {player.secondaryPosition && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300">
                      2ª: {player.secondaryPosition}
                    </span>
                  )}
                </div>

                <div className="mt-2 text-[10px] font-bold text-slate-600">
                  Estado:{' '}
                  <span className={`px-2 py-0.5 rounded ${
                    player.status === 'Disponible' 
                      ? 'bg-emerald-100 text-emerald-800 font-black' 
                      : 'bg-rose-100 text-rose-800 font-black'
                  }`}>
                    {player.status}
                  </span>
                </div>
              </div>

              {/* Personal & Physical Data Column */}
              <div className="md:col-span-2 space-y-4">
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <div className="bg-[#FFFF00] text-black font-black text-xs px-3 py-1.5 uppercase border-b border-black">
                    1. Datos Personales y Biométricos
                  </div>
                  <div className="p-3 bg-white grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Ficha / RUT / DNI:</span>
                      <strong className="text-slate-900">{player.idCard || 'No registrado'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Fecha Nacimiento:</span>
                      <strong className="text-slate-900">{player.birthDate || 'No definida'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Edad:</span>
                      <strong className="text-slate-900">{age} años</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Pierna Hábil:</span>
                      <strong className="text-slate-900">{player.dominantFoot}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Estatura:</span>
                      <strong className="text-slate-900">{player.heightCm ? `${player.heightCm} cm` : '-'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Peso / IMC:</span>
                      <strong className="text-slate-900">{player.weightKg ? `${player.weightKg} kg (${bmi})` : '-'}</strong>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <div className="bg-[#FFFF00] text-black font-black text-xs px-3 py-1.5 uppercase border-b border-black">
                    2. Datos de Contacto y Residencia
                  </div>
                  <div className="p-3 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Teléfono de Contacto:</span>
                      <strong className="text-slate-900">{player.phone || 'No registrado'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Correo Electrónico:</span>
                      <strong className="text-slate-900">{player.email || 'No registrado'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Evaluation & Attributes */}
            <div className="border border-black rounded-xl overflow-hidden mb-6">
              <div className="bg-slate-900 text-white font-black text-xs px-3 py-1.5 uppercase flex justify-between items-center">
                <span>3. Evaluación de Atributos y Capacidades (Escala 1 a 99)</span>
                <span className="text-amber-400 text-[10px]">Media Ponderada: {overall}</span>
              </div>
              <div className="p-4 bg-slate-50 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-extrabold block">Ritmo</span>
                  <span className="text-lg font-black text-slate-900">{player.attributes.pace}</span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${player.attributes.pace}%` }} />
                  </div>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-extrabold block">Tiro</span>
                  <span className="text-lg font-black text-slate-900">{player.attributes.shooting}</span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${player.attributes.shooting}%` }} />
                  </div>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-extrabold block">Pase</span>
                  <span className="text-lg font-black text-slate-900">{player.attributes.passing}</span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${player.attributes.passing}%` }} />
                  </div>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-extrabold block">Regate</span>
                  <span className="text-lg font-black text-slate-900">{player.attributes.dribbling}</span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${player.attributes.dribbling}%` }} />
                  </div>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-extrabold block">Defensa</span>
                  <span className="text-lg font-black text-slate-900">{player.attributes.defending}</span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${player.attributes.defending}%` }} />
                  </div>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-extrabold block">
                    {player.primaryPosition === 'POR' ? 'Portería' : 'Físico'}
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {player.primaryPosition === 'POR' ? (player.attributes.goalkeeping || 80) : player.attributes.physical}
                  </span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full" 
                      style={{ width: `${player.primaryPosition === 'POR' ? (player.attributes.goalkeeping || 80) : player.attributes.physical}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Season Stats Table */}
            <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
              <div className="bg-[#FFFF00] text-black font-black text-xs px-3 py-1.5 uppercase border-b border-black">
                4. Rendimiento Deportivo en Temporada Oficial
              </div>
              <div className="p-3 bg-white overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-300">
                      <th className="p-1.5">PJ</th>
                      <th className="p-1.5">Titular</th>
                      <th className="p-1.5">Minutos</th>
                      <th className="p-1.5">Goles</th>
                      <th className="p-1.5">Asist.</th>
                      <th className="p-1.5">TA</th>
                      <th className="p-1.5">TR</th>
                      {player.primaryPosition === 'POR' && <th className="p-1.5">Valla Invicta</th>}
                      <th className="p-1.5">Nota Media</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-bold text-slate-900">
                      <td className="p-1.5">{player.stats.matchesPlayed}</td>
                      <td className="p-1.5">{player.stats.starts}</td>
                      <td className="p-1.5">{player.stats.minutesPlayed}'</td>
                      <td className="p-1.5 text-amber-700 font-black">{player.stats.goals}</td>
                      <td className="p-1.5">{player.stats.assists}</td>
                      <td className="p-1.5 text-yellow-600">{player.stats.yellowCards}</td>
                      <td className="p-1.5 text-rose-600">{player.stats.redCards}</td>
                      {player.primaryPosition === 'POR' && (
                        <td className="p-1.5 text-emerald-700 font-black">{player.stats.cleanSheets}</td>
                      )}
                      <td className="p-1.5 font-black text-emerald-700">
                        {player.stats.avgRating > 0 ? player.stats.avgRating.toFixed(1) : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Medical & Injury History Section */}
            <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
              <div className="bg-[#FFFF00] text-black font-black text-xs px-3 py-1.5 uppercase border-b border-black flex justify-between items-center">
                <span>5. Historial Clínico y Registro de Lesiones en la Temporada</span>
                <span className="text-[10px] font-extrabold text-black">
                  {playerInjuries.length === 0 ? 'Sin lesiones activas' : `${playerInjuries.length} registro(s) médico(s)`}
                </span>
              </div>
              <div className="p-3 bg-white">
                {playerInjuries.length === 0 ? (
                  <p className="text-xs text-slate-600 italic">
                    Sin antecedentes de lesiones registrados en la temporada actual. Futbolista en óptimas condiciones físicas y médicas para la alta competencia.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-300 text-left">
                          <th className="p-1">Fecha</th>
                          <th className="p-1">Tipo y Zona Corporal</th>
                          <th className="p-1">Descripción / Diagnóstico</th>
                          <th className="p-1">Profesional / Centro</th>
                          <th className="p-1">Retorno / Alta</th>
                          <th className="p-1 text-center">Estado Actual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playerInjuries.map((inj, idx) => (
                          <tr key={inj.id || idx} className="border-b border-slate-200">
                            <td className="p-1 font-mono text-slate-800 whitespace-nowrap">
                              {inj.dateInjured}
                              {inj.category && (
                                <span className="block text-[8px] text-slate-500">[{inj.category}]</span>
                              )}
                            </td>
                            <td className="p-1">
                              <strong className="text-slate-900 block">{inj.injuryType}</strong>
                              <span className="text-slate-600">{inj.bodyZone}</span>
                            </td>
                            <td className="p-1 text-slate-700 max-w-xs">
                              {inj.description && <p className="text-slate-800 font-medium">{inj.description}</p>}
                              <p className="text-slate-600 italic">{inj.diagnosis}</p>
                            </td>
                            <td className="p-1 text-slate-700">
                              {inj.medicalStaffOrClinic || inj.medicalStaff || 'Kinesiología San Luis'}
                            </td>
                            <td className="p-1 whitespace-nowrap">
                              {inj.status === 'Alta Médica' ? (
                                <span className="text-emerald-700 font-bold">Alta: {inj.actualReturnDate || 'Concedida'}</span>
                              ) : (
                                <span className="text-amber-800">Est: {inj.expectedReturnDate || 'En eval.'}</span>
                              )}
                            </td>
                            <td className="p-1 text-center whitespace-nowrap">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                inj.status === 'Lesionado' || inj.status === 'Activa'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : inj.status === 'En Recuperación'
                                  ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                  : inj.status === 'En Reintegro Deportivo' || inj.status === 'En Reintegro'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}>
                                {inj.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* 6. Situación Nutricional y Evaluaciones Antropométricas del Año */}
            <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
              <div className="bg-[#FFFF00] text-black font-black text-xs px-3 py-1.5 uppercase border-b border-black flex justify-between items-center">
                <span>6. Situación Nutricional y Evaluaciones Antropométricas ({nutritionalHistory.length} en el año)</span>
                {currentNutrition && (
                  <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-black ${
                    currentNutrition.trafficLight === 'green'
                      ? 'bg-emerald-600 text-white'
                      : currentNutrition.trafficLight === 'yellow'
                      ? 'bg-amber-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}>
                    Estado Actual: {currentNutrition.statusClassification}
                  </span>
                )}
              </div>
              <div className="p-3 bg-white">
                {currentNutrition ? (
                  <div className="space-y-3">
                    {/* Clean Table of Anthropometric Evaluations matching photo format */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px] border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-300 text-left">
                            <th className="p-1.5">Fecha</th>
                            <th className="p-1.5">Protocolo / Informe</th>
                            <th className="p-1.5 text-center">Talla / Peso</th>
                            <th className="p-1.5 text-center">M. Adiposa</th>
                            <th className="p-1.5 text-center">M. Muscular</th>
                            <th className="p-1.5 text-center">6 Pliegues</th>
                            <th className="p-1.5 text-center">IMO</th>
                            <th className="p-1.5 text-center">IMC</th>
                            <th className="p-1.5 text-center">Semáforo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(nutritionalHistory.length > 0 ? nutritionalHistory : [currentNutrition as any]).map((ev, idx) => (
                            <tr key={ev.id || idx} className="border-b border-slate-200">
                              <td className="p-1.5 font-mono text-slate-900 whitespace-nowrap font-bold">{ev.date || currentNutrition.lastEvaluationDate}</td>
                              <td className="p-1.5 font-bold text-slate-800">{ev.periodName || 'Control Antropométrico'}</td>
                              <td className="p-1.5 text-center font-bold text-slate-900">{ev.heightCm}cm / {ev.weightKg}kg</td>
                              <td className="p-1.5 text-center font-black">
                                <span className={
                                  ev.bodyFatPercent && ev.bodyFatPercent <= 17.0
                                    ? 'text-emerald-700'
                                    : ev.bodyFatPercent && ev.bodyFatPercent <= 19.0
                                    ? 'text-amber-700'
                                    : 'text-rose-700'
                                }>
                                  {ev.bodyFatPercent !== undefined ? `${ev.bodyFatPercent}%` : '-'}
                                </span>
                                {ev.bodyFatKg !== undefined && <span className="block text-[8px] font-normal text-slate-500">{ev.bodyFatKg}kg</span>}
                              </td>
                              <td className="p-1.5 text-center text-blue-700 font-bold">
                                {ev.muscleMassPercent !== undefined ? `${ev.muscleMassPercent}%` : '-'}
                                {ev.muscleMassKg !== undefined && <span className="block text-[8px] font-normal text-slate-500">{ev.muscleMassKg}kg</span>}
                              </td>
                              <td className="p-1.5 text-center text-slate-700 font-bold">
                                {ev.skinfoldSumMm ? `${ev.skinfoldSumMm} mm` : '-'}
                              </td>
                              <td className="p-1.5 text-center text-emerald-700 font-bold">
                                {ev.imo !== undefined ? ev.imo.toFixed(2) : '-'}
                              </td>
                              <td className="p-1.5 text-center font-bold text-slate-800">
                                {ev.bmi || currentNutrition.bmi}
                              </td>
                              <td className="p-1.5 text-center whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                  ev.trafficLight === 'green'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : ev.trafficLight === 'yellow'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}>
                                  {ev.trafficLight === 'green' ? '🟢' : ev.trafficLight === 'yellow' ? '🟡' : '🔴'} {ev.statusClassification}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Sin controles antropométricos registrados para este jugador en la temporada actual.
                  </p>
                )}
              </div>
            </div>

            {/* Notes / Observaciones */}
            <div className="border border-slate-300 rounded-xl overflow-hidden mb-8">
              <div className="bg-slate-100 text-slate-800 font-extrabold text-xs px-3 py-1.5 uppercase border-b border-slate-300">
                7. Observaciones Técnicas y Disciplinarias
              </div>
              <div className="p-3 bg-white text-xs text-slate-700 min-h-[50px] whitespace-pre-wrap">
                {player.notes || 'Sin observaciones registradas por el cuerpo técnico.'}
              </div>
            </div>

            {/* Official Signatures Section */}
            <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-3 gap-6 text-center text-[10px] text-slate-600">
              <div>
                <div className="border-b border-slate-400 h-10 mb-1" />
                <strong className="block text-slate-900 uppercase">Director Técnico</strong>
                <span>Cuerpo Técnico {player.category}</span>
              </div>
              <div>
                <div className="border-b border-slate-400 h-10 mb-1" />
                <strong className="block text-slate-900 uppercase">Preparador Físico / Médico</strong>
                <span>Área de Rendimiento</span>
              </div>
              <div>
                <div className="border-b border-slate-400 h-10 mb-1" />
                <strong className="block text-slate-900 uppercase">Coordinación Cantera</strong>
                <span>San Luis de Quillota</span>
              </div>
            </div>

            {/* Footer stamp */}
            <div className="mt-6 pt-2 border-t border-slate-200 flex justify-between text-[9px] text-slate-400">
              <span>San Luis de Quillota S.A.D.P. • Documento Oficial Confidencial</span>
              <span>Emisión: {new Date().toLocaleDateString('es-CL')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

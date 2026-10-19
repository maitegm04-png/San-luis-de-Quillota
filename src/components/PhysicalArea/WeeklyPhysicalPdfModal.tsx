import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { Player, WeeklyCheckInEntry, WeeklyCheckOutEntry, DayOfWeek, DayScheduleType } from '../../types/football';
import { sanitizeClonedDocColors } from '../../services/pdfColorSanitizer';
import { SanLuisLogo } from '../Common/SanLuisLogo';
import { FileDown, X, Printer, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';

interface WeekDayInfo {
  key: DayOfWeek;
  label: string;
  dateStr: string;
  displayDate: string;
  scheduleType: DayScheduleType;
}

interface WeeklyPhysicalPdfModalProps {
  category: string;
  weekRangeLabel: string;
  weekDays: WeekDayInfo[];
  players: Player[];
  checkInsMap: Map<string, WeeklyCheckInEntry>;
  checkOutsMap: Map<string, WeeklyCheckOutEntry>;
  summary: {
    avgSleepScore: number;
    avgPse: number;
    totalWeeklyLoad: number;
    redAlerts: number;
    yellowAlerts: number;
  };
  onClose: () => void;
}

export const WeeklyPhysicalPdfModal: React.FC<WeeklyPhysicalPdfModalProps> = ({
  category,
  weekRangeLabel,
  weekDays,
  players,
  checkInsMap,
  checkOutsMap,
  summary,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);

    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          sanitizeClonedDocColors(clonedDoc);
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;

      let renderWidth = pdfWidth - 10;
      let renderHeight = renderWidth / ratio;

      if (renderHeight > pdfHeight - 10) {
        renderHeight = pdfHeight - 10;
        renderWidth = renderHeight * ratio;
      }

      const xOffset = (pdfWidth - renderWidth) / 2;
      const yOffset = 5;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, renderWidth, renderHeight);
      pdf.save(`Resumen_Semanal_Fisico_${category.replace(/\s+/g, '_')}_${weekDays[0]?.dateStr || 'semana'}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF semanal:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl shadow-2xl my-4 flex flex-col max-h-[94vh] overflow-hidden">
        {/* Modal Toolbar */}
        <div className="bg-slate-950 px-6 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Exportar Resumen Semanal en PDF • {category}
              </h3>
              <p className="text-[11px] text-slate-400">
                {weekRangeLabel} • Matriz de Control Físico (Check-In & Check-Out)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Descargar PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950/60">
          {/* Printable White Canvas */}
          <div
            ref={printRef}
            className="bg-white text-slate-900 p-6 rounded-lg shadow-xl mx-auto font-sans text-xs max-w-[1100px]"
            style={{ width: '100%', minWidth: '980px' }}
          >
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-3 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SanLuisLogo size={52} className="shrink-0" />
                <div>
                  <h1 className="text-base font-black uppercase text-slate-950 tracking-wider">
                    San Luis de Quillota • Fútbol Formativo
                  </h1>
                  <h2 className="text-xs font-bold text-amber-600 uppercase">
                    Área Física: Reporte Semanal de Bienestar y Carga (Check-In & Check-Out)
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Escala de Bienestar Hooper (1 al 7) y Percepción Subjetiva del Esfuerzo (Borg 0-10 / sRPE)
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block bg-slate-950 text-amber-400 font-black px-3 py-1 rounded text-xs uppercase tracking-wider mb-1">
                  Categoría {category}
                </div>
                <div className="text-[10px] font-bold text-slate-600">
                  {weekRangeLabel}
                </div>
                <div className="text-[9px] text-slate-400">
                  Emisión: {new Date().toLocaleDateString('es-CL')}
                </div>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-5 gap-2 mb-3 text-center">
              <div className="bg-slate-100 p-2 rounded border border-slate-300">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Plantel Evaluado</span>
                <span className="text-sm font-black text-slate-900">{players.length} futbolistas</span>
              </div>
              <div className="bg-amber-50 p-2 rounded border border-amber-200">
                <span className="text-[9px] text-amber-700 uppercase font-bold block">Nota Sueño Promedio</span>
                <span className="text-sm font-black text-amber-900">{summary.avgSleepScore} / 7</span>
              </div>
              <div className="bg-blue-50 p-2 rounded border border-blue-200">
                <span className="text-[9px] text-blue-700 uppercase font-bold block">PSE Promedio Sesión</span>
                <span className="text-sm font-black text-blue-900">{summary.avgPse} / 10 Borg</span>
              </div>
              <div className="bg-purple-50 p-2 rounded border border-purple-200">
                <span className="text-[9px] text-purple-700 uppercase font-bold block">Carga Semanal Total</span>
                <span className="text-sm font-black text-purple-900">{summary.totalWeeklyLoad} U.A.</span>
              </div>
              <div className="bg-slate-100 p-2 rounded border border-slate-300">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Alertas de Bienestar</span>
                <span className="text-xs font-black text-slate-900">
                  <span className="text-rose-600 font-extrabold">{summary.redAlerts} Rojas</span> • <span className="text-amber-600 font-bold">{summary.yellowAlerts} Amarillas</span>
                </span>
              </div>
            </div>

            {/* Schedule classification bar */}
            <div className="bg-slate-50 border border-slate-300 rounded p-1.5 mb-3 flex items-center justify-between text-[10px]">
              <span className="font-extrabold uppercase text-slate-700 pl-1">Planificación de la Semana:</span>
              <div className="flex items-center gap-2">
                {weekDays.map((d) => (
                  <span key={d.key} className="px-2 py-0.5 rounded font-bold border border-slate-300 bg-white text-slate-700">
                    <strong className="text-slate-950">{d.key.slice(0, 3)}:</strong>{' '}
                    <span className={
                      d.scheduleType === 'Partido'
                        ? 'text-amber-600 font-black'
                        : d.scheduleType === 'Libre'
                        ? 'text-blue-600 font-black'
                        : 'text-emerald-700'
                    }>
                      {d.scheduleType}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* Complete Weekly Matrix Table */}
            <div className="overflow-x-auto border border-slate-300 rounded">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[9px] font-black">
                    <th className="p-1.5 border border-slate-800 text-left w-36">Futbolista</th>
                    {weekDays.map((d) => (
                      <th key={d.key} className="p-1.5 border border-slate-800 text-center">
                        <div>{d.key}</div>
                        <div className="text-[8px] text-amber-300 font-mono font-normal">
                          {d.displayDate} • {d.scheduleType}
                        </div>
                      </th>
                    ))}
                    <th className="p-1.5 border border-slate-800 text-center w-20">Carga Total</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, idx) => {
                    let totalPlayerLoad = 0;

                    return (
                      <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-1 border border-slate-300 font-bold text-slate-900 whitespace-nowrap">
                          #{p.squadNumber} {p.lastName.toUpperCase()}, {p.firstName}
                          <span className="block text-[8px] font-normal text-slate-500 uppercase">{p.primaryPosition}</span>
                        </td>

                        {weekDays.map((d) => {
                          const cin = checkInsMap.get(`${p.id}_${d.dateStr}`);
                          const cout = checkOutsMap.get(`${p.id}_${d.dateStr}`);
                          if (cout) totalPlayerLoad += cout.sessionRpeLoad;

                          return (
                            <td key={d.key} className="p-1 border border-slate-300 text-center align-top">
                              {/* Check-In Row */}
                              {cin ? (
                                <div className={`p-1 rounded mb-0.5 border text-[9px] ${
                                  cin.trafficLight === 'green'
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                    : cin.trafficLight === 'yellow'
                                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                                    : 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                                }`}>
                                  <div className="font-bold flex items-center justify-between">
                                    <span>IN: S{cin.sleepScore ?? 5}/7</span>
                                    <span>F{cin.fatigue}/7 • D{cin.muscleSoreness}/7</span>
                                    <span className="font-mono">W:{cin.wellnessScore}/35</span>
                                  </div>
                                  {cin.painArea && (
                                    <div className="text-[8px] text-rose-700 truncate font-bold mt-0.5">
                                      ⚠️ {cin.painArea}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-slate-300 text-[8px] italic py-0.5">-</div>
                              )}

                              {/* Check-Out Row */}
                              {cout ? (
                                <div className="p-1 rounded bg-slate-100 border border-slate-200 text-[9px] text-slate-800">
                                  <div className="font-bold flex items-center justify-between">
                                    <span>{cout.durationMinutes}'</span>
                                    <span className="font-black text-amber-700">PSE {cout.pse}</span>
                                    <span className="font-mono">{cout.sessionRpeLoad} UA</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-slate-300 text-[8px] italic py-0.5">-</div>
                              )}
                            </td>
                          );
                        })}

                        <td className="p-1 border border-slate-300 text-center font-mono font-black text-xs text-amber-800 bg-amber-50/50">
                          {totalPlayerLoad > 0 ? `${totalPlayerLoad} UA` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Signatures & Footer */}
            <div className="mt-6 pt-4 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-[10px]">
              <div>
                <div className="h-10 border-b border-slate-400 border-dashed mx-6 mb-1"></div>
                <p className="font-bold text-slate-900">Preparador Físico</p>
                <p className="text-[9px] text-slate-500">Área Física Formativa</p>
              </div>
              <div>
                <div className="h-10 border-b border-slate-400 border-dashed mx-6 mb-1"></div>
                <p className="font-bold text-slate-900">Director Técnico</p>
                <p className="text-[9px] text-slate-500">Cuerpo Técnico {category}</p>
              </div>
              <div>
                <div className="h-10 border-b border-slate-400 border-dashed mx-6 mb-1"></div>
                <p className="font-bold text-slate-900">Kinesiología / Médico</p>
                <p className="text-[9px] text-slate-500">Área Médica San Luis</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

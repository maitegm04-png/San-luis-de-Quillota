import React, { useRef, useState } from 'react';
import { Player, MatchSheet, ClubInfo, CoachStaff } from '../../types/football';
import { POSITION_LABELS } from '../../data/mockData';
import { 
  X, 
  Download, 
  Printer, 
  Shield, 
  Trophy, 
  Award, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { sanitizeClonedDocColors } from '../../services/pdfColorSanitizer';

interface CategoryStatsPdfModalProps {
  category: string;
  clubInfo: ClubInfo;
  coachStaff: CoachStaff;
  players: Player[];
  matches: MatchSheet[];
  onClose: () => void;
}

export const CategoryStatsPdfModal: React.FC<CategoryStatsPdfModalProps> = ({
  category,
  clubInfo,
  coachStaff,
  players,
  matches,
  onClose
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter players and finished matches
  const finishedMatches = matches.filter((m) => m.status === 'finished');

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  finishedMatches.forEach((m) => {
    const ourGoals = m.isHome ? m.homeScore : m.awayScore;
    const opponentGoals = m.isHome ? m.awayScore : m.homeScore;
    goalsFor += ourGoals;
    goalsAgainst += opponentGoals;

    if (ourGoals > opponentGoals) wins++;
    else if (ourGoals === opponentGoals) draws++;
    else losses++;
  });

  const totalPlayed = finishedMatches.length;
  const winRate = totalPlayed > 0 ? Math.round((wins / totalPlayed) * 100) : 0;
  const goalDiff = goalsFor - goalsAgainst;
  const points = wins * 3 + draws;
  const maxPoints = totalPlayed * 3;
  const performanceRate = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;

  // Sorted leaderboards
  const topScorers = [...players]
    .filter((p) => p.stats.goals > 0)
    .sort((a, b) => b.stats.goals - a.stats.goals);

  const topAssists = [...players]
    .filter((p) => p.stats.assists > 0)
    .sort((a, b) => b.stats.assists - a.stats.assists);

  const mostMinutes = [...players]
    .sort((a, b) => b.stats.minutesPlayed - a.stats.minutesPlayed);

  const cleanSheetsList = [...players]
    .filter((p) => p.stats.cleanSheets > 0)
    .sort((a, b) => b.stats.cleanSheets - a.stats.cleanSheets);

  const disciplinary = [...players]
    .filter((p) => p.stats.yellowCards > 0 || p.stats.redCards > 0)
    .sort((a, b) => (b.stats.redCards * 3 + b.stats.yellowCards) - (a.stats.redCards * 3 + a.stats.yellowCards));

  const sortedSquad = [...players].sort((a, b) => a.squadNumber - b.squadNumber);

  // Native Print Handler
  const handlePrint = () => {
    window.print();
  };

  // PDF Download Handler using html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          sanitizeClonedDocColors(clonedDoc);
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Informe_Estadistico_SanLuis_${category.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Hubo un problema al exportar el PDF. Puedes usar el botón "Imprimir" y seleccionar "Guardar como PDF".');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Controls Header (Not in print) */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Informe Estadístico y Rendimiento</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                  {category === 'all' ? 'Todas las Categorías' : `Categoría ${category}`}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Documento oficial descargable en PDF y preparado para impresión
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-black rounded-lg shadow-md transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generando...' : 'Descargar PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content - High-Fidelity Printable Document */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-8 bg-slate-950">
          <div 
            ref={reportRef} 
            className="bg-white text-slate-900 rounded-xl p-6 sm:p-10 shadow-xl max-w-3xl mx-auto space-y-6 text-xs sm:text-sm font-sans"
          >
            {/* 1. Official Header */}
            <div className="border-b-2 border-amber-400 pb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center border-2 border-slate-900 shrink-0">
                  SLQ
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase leading-tight">
                    San Luis de Quillota
                  </h1>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    Fútbol Joven y Formativo • Cantera Canaria
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Estadio Bicentenario Lucio Fariña Fernández • Temporada {clubInfo.season}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 rounded-lg bg-slate-950 text-amber-400 font-black text-xs uppercase tracking-wider">
                  {category === 'all' ? 'Informe Global' : `Categoría ${category}`}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Fecha de Emisión: <strong>{currentDateFormatted}</strong>
                </p>
                <p className="text-[11px] text-slate-500">
                  DT: <strong>{coachStaff.coach}</strong>
                </p>
              </div>
            </div>

            {/* 2. Executive Performance Summary */}
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider border-l-4 border-amber-500 pl-2 mb-3">
                1. Balance de Competencia y Rendimiento
              </h2>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Partidos</span>
                  <span className="text-base font-black text-slate-900">{totalPlayed}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 uppercase font-bold block">Ganados</span>
                  <span className="text-base font-black text-emerald-700">{wins}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="text-[10px] text-amber-700 uppercase font-bold block">Empatados</span>
                  <span className="text-base font-black text-amber-700">{draws}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                  <span className="text-[10px] text-rose-700 uppercase font-bold block">Perdidos</span>
                  <span className="text-base font-black text-rose-700">{losses}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">GF / GC</span>
                  <span className="text-sm font-black text-slate-900">{goalsFor} / {goalsAgainst}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Dif. Goles</span>
                  <span className={`text-sm font-black ${goalDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-100 border border-amber-300">
                  <span className="text-[10px] text-amber-800 uppercase font-black block">% Rend.</span>
                  <span className="text-base font-black text-amber-900">{performanceRate}%</span>
                </div>
              </div>
            </div>

            {/* 3. Detailed Top Tables (Scorers & Assists & Minutes) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Top Scorers */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  Goleadores
                </h3>
                {topScorers.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Sin goles registrados aún</p>
                ) : (
                  <div className="space-y-1.5">
                    {topScorers.slice(0, 5).map((p, idx) => (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 truncate">
                          <strong className="text-slate-900 mr-1.5">#{p.squadNumber}</strong>
                          {p.firstName} {p.lastName}
                        </span>
                        <span className="font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 shrink-0">
                          {p.stats.goals} {p.stats.goals === 1 ? 'gol' : 'goles'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Assists */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <Award className="w-3.5 h-3.5 text-blue-500" />
                  Asistencias
                </h3>
                {topAssists.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Sin asistencias registradas</p>
                ) : (
                  <div className="space-y-1.5">
                    {topAssists.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 truncate">
                          <strong className="text-slate-900 mr-1.5">#{p.squadNumber}</strong>
                          {p.firstName} {p.lastName}
                        </span>
                        <span className="font-black px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 shrink-0">
                          {p.stats.assists} asist.
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Regularity / Minutes */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Mayor Participación
                </h3>
                <div className="space-y-1.5">
                  {mostMinutes.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 truncate">
                        <strong className="text-slate-900 mr-1.5">#{p.squadNumber}</strong>
                        {p.firstName} {p.lastName}
                      </span>
                      <span className="font-bold text-slate-800 text-[11px]">
                        {p.stats.minutesPlayed}' ({p.stats.starts} tit.)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Complete Squad Table with Detailed Stats */}
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider border-l-4 border-amber-500 pl-2 mb-2.5">
                2. Nómina Completa y Rendimiento Individual
              </h2>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-1.5 px-2 text-center w-8">#</th>
                      <th className="py-1.5 px-2">Jugador</th>
                      <th className="py-1.5 px-2">Pos.</th>
                      <th className="py-1.5 px-2">Serie</th>
                      <th className="py-1.5 px-2 text-center">PJ</th>
                      <th className="py-1.5 px-2 text-center">Tit.</th>
                      <th className="py-1.5 px-2 text-center">Min.</th>
                      <th className="py-1.5 px-2 text-center">Goles</th>
                      <th className="py-1.5 px-2 text-center">Asist.</th>
                      <th className="py-1.5 px-2 text-center">TA</th>
                      <th className="py-1.5 px-2 text-center">TR</th>
                      <th className="py-1.5 px-2 text-center">Nota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedSquad.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="py-1 px-2 text-center font-bold text-slate-900">
                          {p.squadNumber}
                        </td>
                        <td className="py-1 px-2 font-medium text-slate-800">
                          {p.firstName} {p.lastName}
                          {p.nickname && <span className="text-slate-400 text-[10px] ml-1">("{p.nickname}")</span>}
                        </td>
                        <td className="py-1 px-2">
                          <span className="font-bold text-slate-600">
                            {p.primaryPosition}
                          </span>
                        </td>
                        <td className="py-1 px-2 font-semibold text-slate-600">
                          {p.category}
                        </td>
                        <td className="py-1 px-2 text-center font-bold">{p.stats.matchesPlayed}</td>
                        <td className="py-1 px-2 text-center text-slate-600">{p.stats.starts}</td>
                        <td className="py-1 px-2 text-center font-mono font-medium">{p.stats.minutesPlayed}'</td>
                        <td className="py-1 px-2 text-center font-bold text-amber-700">{p.stats.goals}</td>
                        <td className="py-1 px-2 text-center text-blue-700 font-semibold">{p.stats.assists}</td>
                        <td className="py-1 px-2 text-center text-amber-600">{p.stats.yellowCards}</td>
                        <td className="py-1 px-2 text-center text-rose-600 font-bold">{p.stats.redCards}</td>
                        <td className="py-1 px-2 text-center font-black text-slate-900">
                          {p.stats.avgRating > 0 ? p.stats.avgRating.toFixed(1) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Match History */}
            {finishedMatches.length > 0 && (
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider border-l-4 border-amber-500 pl-2 mb-2.5">
                  3. Historial de Partidos Disputados
                </h2>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-1.5 px-2">Fecha</th>
                        <th className="py-1.5 px-2">Categoría</th>
                        <th className="py-1.5 px-2">Competición</th>
                        <th className="py-1.5 px-2">Rival</th>
                        <th className="py-1.5 px-2 text-center">Condición</th>
                        <th className="py-1.5 px-2 text-center">Resultado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {finishedMatches.map((m) => {
                        const our = m.isHome ? m.homeScore : m.awayScore;
                        const opp = m.isHome ? m.awayScore : m.homeScore;
                        const isWin = our > opp;
                        const isDraw = our === opp;
                        return (
                          <tr key={m.id} className="hover:bg-slate-50/80">
                            <td className="py-1 px-2 text-slate-600">{m.date}</td>
                            <td className="py-1 px-2 font-bold text-slate-800">{m.category}</td>
                            <td className="py-1 px-2 text-slate-600">{m.competition}</td>
                            <td className="py-1 px-2 font-medium text-slate-900">{m.opponent}</td>
                            <td className="py-1 px-2 text-center text-slate-600">
                              {m.isHome ? 'Local' : 'Visita'}
                            </td>
                            <td className="py-1 px-2 text-center font-black">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${
                                isWin 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : isDraw 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {our} - {opp} ({isWin ? 'V' : isDraw ? 'E' : 'D'})
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. Official Validation & Signatures */}
            <div className="pt-6 border-t-2 border-slate-200 mt-6">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <div className="border-b border-slate-400 h-14 mb-2 mx-auto w-48" />
                  <p className="font-black text-xs text-slate-900 uppercase">{coachStaff.coach}</p>
                  <p className="text-[10px] text-slate-500">Director Técnico • {category !== 'all' ? category : 'Fútbol Joven'}</p>
                  <p className="text-[9px] text-slate-400">San Luis de Quillota S.A.D.P.</p>
                </div>

                <div>
                  <div className="border-b border-slate-400 h-14 mb-2 mx-auto w-48" />
                  <p className="font-black text-xs text-slate-900 uppercase">Mauricio Riffo</p>
                  <p className="text-[10px] text-slate-500">Coordinador General • Fútbol Formativo</p>
                  <p className="text-[9px] text-slate-400">San Luis de Quillota S.A.D.P.</p>
                </div>
              </div>

              <div className="mt-6 text-center text-[10px] text-slate-400">
                Documento generado por el Sistema Oficial de Gestión Deportiva de San Luis de Quillota.
              </div>
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs text-slate-400 print:hidden shrink-0">
          <span>El informe incluye todo el registro de la serie {category}.</span>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black cursor-pointer"
            >
              Descargar PDF
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

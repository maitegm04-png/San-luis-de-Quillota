import React, { useRef, useState } from 'react';
import { MatchCitation } from '../../types/football';
import { SanLuisLogo } from '../Common/SanLuisLogo';
import { exportCitationToPdf } from '../../services/citationPdfGenerator';
import { useFootball } from '../../context/FootballContext';
import { 
  X, 
  Download, 
  Printer, 
  FileText,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Shield,
  User,
  Shirt,
  Check,
  RotateCcw,
  Hash,
  Edit2
} from 'lucide-react';
import { CitationPlayerEntry } from '../../types/football';

interface CitationPdfModalProps {
  citation: MatchCitation;
  onClose: () => void;
}

export const CitationPdfModal: React.FC<CitationPdfModalProps> = ({ citation, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { players, updateCitation } = useFootball();

  // Local state for convocated players (allows live dorsal editing without opening full form)
  const [citationPlayers, setCitationPlayers] = useState<CitationPlayerEntry[]>(citation.players);
  const [isEditingDorsals, setIsEditingDorsals] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const handleUpdateDorsal = (playerId: string, newNumber: number) => {
    setCitationPlayers((prev) =>
      prev.map((p) => (p.playerId === playerId ? { ...p, squadNumber: newNumber } : p))
    );
  };

  const handleRenumberSequential = () => {
    setCitationPlayers((prev) =>
      prev.map((p, idx) => ({ ...p, squadNumber: idx + 1 }))
    );
  };

  const handleResetToDatabaseNumbers = () => {
    setCitationPlayers((prev) =>
      prev.map((p) => {
        const dbPlayer = players.find((pl) => pl.id === p.playerId);
        return {
          ...p,
          squadNumber: dbPlayer ? dbPlayer.squadNumber : p.squadNumber,
        };
      })
    );
  };

  const handleSaveDorsals = () => {
    updateCitation(citation.id, { players: citationPlayers });
    setIsEditingDorsals(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    if (isEditingDorsals) {
      updateCitation(citation.id, { players: citationPlayers });
      setIsEditingDorsals(false);
    }
    setIsGeneratingPdf(true);
    try {
      await exportCitationToPdf(printRef.current, {
        citation: { ...citation, players: citationPlayers },
        clubName: 'San Luis de Quillota',
      });
    } catch (err) {
      console.error('Error generando PDF de citación:', err);
      alert('Hubo un error al generar el PDF. Puede utilizar el botón "Imprimir" y seleccionar "Guardar como PDF".');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Sort players by squad number
  const sortedPlayers = [...citationPlayers].sort((a, b) => a.squadNumber - b.squadNumber);

  // Requirements strictly restricted to the 3 requested items
  const requirements = [
    'Llevar cédula de identidad',
    'Canilleras',
    'Zapatos de fútbol'
  ];

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
                Planilla Oficial de Citación: {citation.opponent}
              </h3>
              <p className="text-[11px] text-slate-400">
                {citation.category} • {citation.matchDay || 'Convocatoria Oficial'} • San Luis de Quillota
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* Toggle Edit Dorsals Button */}
            <button
              type="button"
              onClick={() => {
                if (isEditingDorsals) {
                  handleSaveDorsals();
                } else {
                  setIsEditingDorsals(true);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl border transition-all cursor-pointer ${
                isEditingDorsals
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-black border-emerald-500 shadow'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold border-slate-700'
              }`}
              title="Modificar los dorsales de los jugadores para este partido"
            >
              <Shirt className="w-4 h-4" />
              <span>{isEditingDorsals ? 'Guardar Dorsales' : 'Cambiar Dorsales'}</span>
            </button>

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
              <span>Imprimir Planilla</span>
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
        <div className="p-3 sm:p-6 max-h-[82vh] overflow-y-auto bg-slate-950/60">
          {/* Notification when in edit mode */}
          {isEditingDorsals && (
            <div className="mb-4 p-3 bg-amber-400 text-slate-950 rounded-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 print:hidden">
              <div className="flex items-center gap-2">
                <Shirt className="w-5 h-5 shrink-0" />
                <div>
                  <p className="text-xs font-black">
                    Modo Edición de Dorsales de Partido Activo
                  </p>
                  <p className="text-[11px] text-slate-800">
                    Escribe el número en cada casilla amarilla. No modificará el dorsal permanente en la base de datos.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={handleRenumberSequential}
                  className="px-2.5 py-1 bg-slate-950 text-white rounded-lg text-xs font-bold hover:bg-slate-900 cursor-pointer flex items-center gap-1"
                  title="Numerar correlativo 1 al N"
                >
                  <Hash className="w-3 h-3 text-amber-400" />
                  <span>1..{sortedPlayers.length}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetToDatabaseNumbers}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                  title="Restablecer dorsales de la base de datos"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restablecer BD</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveDorsals}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-black rounded-lg text-xs shadow cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar</span>
                </button>
              </div>
            </div>
          )}

          {/* Success message banner */}
          {saveSuccessMsg && (
            <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 print:hidden shadow">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>¡Dorsales de este partido actualizados y guardados correctamente en la citación!</span>
            </div>
          )}
          {/* Printable Sheet (Designed to match the requested official match convocatoria) */}
          <div
            id="printable-citation-sheet"
            ref={printRef}
            className="bg-white text-slate-900 rounded-xl p-6 sm:p-7 shadow-xl border border-slate-300 max-w-3xl mx-auto font-sans print:shadow-none print:border-none print:p-0 print:m-0"
            style={{ width: '100%', maxWidth: '820px' }}
          >
            {/* Top Club & Category Header Banner */}
            <div className="bg-[#111827] text-white p-3 rounded-t-xl border-b-4 border-[#eab308] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SanLuisLogo className="w-10 h-10 shrink-0" />
                <div>
                  <h1 className="text-base sm:text-lg font-black tracking-wider uppercase text-white leading-tight">
                    SAN LUIS DE QUILLOTA S.A.D.P.
                  </h1>
                  <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest">
                    FÚTBOL FORMATIVO • PLANILLA OFICIAL DE CITACIÓN
                  </p>
                </div>
              </div>

              <div className="bg-[#eab308] text-slate-950 font-black px-3.5 py-1.5 rounded-lg text-sm sm:text-base uppercase tracking-wider shadow">
                CATEGORÍA {citation.category.toUpperCase()}
              </div>
            </div>

            {/* Match Duel Banner (San Luis vs Rival Logo) */}
            <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50 border-2 border-black border-t-0 p-3 sm:p-4 mb-3">
              <div className="grid grid-cols-3 items-center gap-2">
                {/* Local: San Luis */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center p-1 bg-white rounded-full border-2 border-amber-400 shadow-sm">
                    <SanLuisLogo className="w-full h-full object-contain" />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-black uppercase mt-1 leading-tight">
                    SAN LUIS DE QUILLOTA
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 uppercase">
                    {citation.isHome ? 'LOCAL' : 'VISITA'}
                  </span>
                </div>

                {/* Match Center Details */}
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="inline-block bg-black text-[#facc15] font-black text-sm px-3 py-0.5 rounded-full mb-1 tracking-wider shadow">
                    VS
                  </span>
                  <div className="bg-[#FFFF00] border border-black px-2.5 py-0.5 rounded text-[11px] font-black uppercase text-black mb-1">
                    HORA CITACIÓN: {citation.meetingTime} HRS
                  </div>
                  <div className="text-[10px] font-extrabold text-slate-800 uppercase leading-snug">
                    {citation.dateFormatted || citation.date}
                  </div>
                  <div className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">
                    {citation.venue} {citation.pitch ? `• ${citation.pitch}` : ''}
                  </div>
                </div>

                {/* Rival Team with Crest */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center p-1 bg-white rounded-full border-2 border-slate-400 shadow-sm overflow-hidden">
                    {citation.opponentLogoUrl ? (
                      <img
                        src={citation.opponentLogoUrl}
                        alt={citation.opponent}
                        crossOrigin="anonymous"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <Shield className="w-7 h-7 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-black text-black uppercase mt-1 leading-tight">
                    {citation.opponent.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">
                    {!citation.isHome ? 'LOCAL' : 'VISITANTE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Convocated Players Table (Only Number, Photo from DB, and Player Name) */}
            <div className="border-2 border-black rounded-lg overflow-hidden mb-3 bg-white">
              <div className="bg-black text-[#FFFF00] font-black text-xs px-3 py-1.5 uppercase flex justify-between items-center">
                <span>Nómina de Jugadores Convocados ({sortedPlayers.length} Futbolistas)</span>
                <span className="text-[10px] text-white font-bold">San Luis de Quillota</span>
              </div>

              {/* 2-Column Responsive / Printable Grid of Players */}
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-300">
                {/* Column 1 */}
                <div className="divide-y divide-slate-200">
                  {sortedPlayers.slice(0, Math.ceil(sortedPlayers.length / 2)).map((p, idx) => {
                    const dbPlayer = players.find((pl) => pl.id === p.playerId);
                    const photo = p.photoUrl || dbPlayer?.photoUrl;
                    const pos = p.primaryPosition || dbPlayer?.primaryPosition;
                    const isCustomDorsal = dbPlayer && dbPlayer.squadNumber !== p.squadNumber;

                    return (
                      <div
                        key={p.playerId || idx}
                        className={`flex items-center gap-2.5 p-1.5 px-2.5 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }`}
                      >
                        {/* Jersey Number (Editable in edit mode, clickable to edit) */}
                        {isEditingDorsals ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={p.squadNumber ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                const num = raw === '' ? 0 : parseInt(raw, 10);
                                handleUpdateDorsal(p.playerId, num);
                              }}
                              className="w-8 h-8 rounded-md bg-[#FFFF00] border-2 border-black font-black text-black text-xs text-center shrink-0 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                              title="Modificar dorsal para este partido"
                            />
                            {isCustomDorsal && (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-300" title={`En Base de Datos: #${dbPlayer?.squadNumber}`}>
                                BD:#{dbPlayer?.squadNumber}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div
                            onClick={() => setIsEditingDorsals(true)}
                            className="w-7 h-7 rounded-md bg-[#FFFF00] border border-black flex items-center justify-center font-black text-black text-xs shrink-0 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                            title="Haz clic para modificar el dorsal de este partido"
                          >
                            {p.squadNumber}
                          </div>
                        )}

                        {/* Player Photo from Database */}
                        <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-400 overflow-hidden shrink-0 flex items-center justify-center">
                          {photo ? (
                            <img
                              src={photo}
                              alt={p.name}
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-amber-100 flex items-center justify-center text-amber-900 font-black text-[10px]">
                              {p.squadNumber}
                            </div>
                          )}
                        </div>

                        {/* Player Name */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-black uppercase truncate leading-tight">
                            {p.displayName || p.name}
                          </p>
                          <p className="text-[10px] text-slate-600 font-semibold truncate">
                            {p.name} {pos ? `• ${pos}` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Column 2 */}
                <div className="divide-y divide-slate-200">
                  {sortedPlayers.slice(Math.ceil(sortedPlayers.length / 2)).map((p, idx) => {
                    const dbPlayer = players.find((pl) => pl.id === p.playerId);
                    const photo = p.photoUrl || dbPlayer?.photoUrl;
                    const pos = p.primaryPosition || dbPlayer?.primaryPosition;
                    const isCustomDorsal = dbPlayer && dbPlayer.squadNumber !== p.squadNumber;

                    return (
                      <div
                        key={p.playerId || idx}
                        className={`flex items-center gap-2.5 p-1.5 px-2.5 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }`}
                      >
                        {/* Jersey Number (Editable in edit mode, clickable to edit) */}
                        {isEditingDorsals ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={p.squadNumber ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                const num = raw === '' ? 0 : parseInt(raw, 10);
                                handleUpdateDorsal(p.playerId, num);
                              }}
                              className="w-8 h-8 rounded-md bg-[#FFFF00] border-2 border-black font-black text-black text-xs text-center shrink-0 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                              title="Modificar dorsal para este partido"
                            />
                            {isCustomDorsal && (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-300" title={`En Base de Datos: #${dbPlayer?.squadNumber}`}>
                                BD:#{dbPlayer?.squadNumber}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div
                            onClick={() => setIsEditingDorsals(true)}
                            className="w-7 h-7 rounded-md bg-[#FFFF00] border border-black flex items-center justify-center font-black text-black text-xs shrink-0 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                            title="Haz clic para modificar el dorsal de este partido"
                          >
                            {p.squadNumber}
                          </div>
                        )}

                        {/* Player Photo from Database */}
                        <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-400 overflow-hidden shrink-0 flex items-center justify-center">
                          {photo ? (
                            <img
                              src={photo}
                              alt={p.name}
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-amber-100 flex items-center justify-center text-amber-900 font-black text-[10px]">
                              {p.squadNumber}
                            </div>
                          )}
                        </div>

                        {/* Player Name */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-black uppercase truncate leading-tight">
                            {p.displayName || p.name}
                          </p>
                          <p className="text-[10px] text-slate-600 font-semibold truncate">
                            {p.name} {pos ? `• ${pos}` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Requisitos Obligatorios (ONLY: Cédula de identidad, Canilleras, Zapatos de fútbol) */}
            <div className="border-2 border-black rounded-lg overflow-hidden mb-3 bg-amber-50/60">
              <div className="bg-[#FFFF00] text-black font-black text-xs px-3 py-1 uppercase border-b border-black flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>Requisitos Obligatorios de Presentación</span>
              </div>
              <div className="p-2.5 px-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-md p-1.5 px-2">
                    <span className="w-4 h-4 rounded-full bg-black text-[#FFFF00] flex items-center justify-center text-[10px] font-black shrink-0">
                      ✓
                    </span>
                    <span className="font-extrabold text-black uppercase text-[11px] leading-tight">
                      {req}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Notice */}
            <div className="pt-2 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-500 font-bold uppercase gap-1">
              <span>San Luis de Quillota S.A.D.P. • Fútbol Formativo Oficial</span>
              <span>Puntualidad Estricta en Horario de Citación</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

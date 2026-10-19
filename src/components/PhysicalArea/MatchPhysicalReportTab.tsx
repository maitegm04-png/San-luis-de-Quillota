import React, { useState, useEffect } from 'react';
import { MatchSheet, MatchPhysicalReport, MatchPhysicalPlayerEntry } from '../../types/football';
import { useFootball } from '../../context/FootballContext';
import { SanLuisLogo } from '../Common/SanLuisLogo';
import { Save, RefreshCw, Printer, CheckCircle2, Dumbbell, UserCheck, Activity } from 'lucide-react';

interface MatchPhysicalReportTabProps {
  match: MatchSheet;
}

export const MatchPhysicalReportTab: React.FC<MatchPhysicalReportTabProps> = ({ match }) => {
  const { updateMatchPhysicalReport, players, clubInfo } = useFootball();

  // Helper to generate default entries from startingEleven and substitutes if no report exists
  const generateDefaultReport = (): MatchPhysicalReport => {
    const startersList: MatchPhysicalPlayerEntry[] = (match.startingEleven || []).map((slot, index) => {
      const p = players.find((pl) => pl.id === slot.playerId);
      const ratingMin = match.playerRatings?.[slot.playerId]?.minutes;
      return {
        number: index + 1,
        playerId: slot.playerId,
        firstName: p ? p.firstName.toUpperCase() : 'JUGADOR',
        lastName: p ? p.lastName.toUpperCase() : `#${index + 1}`,
        role: 'TITULAR',
        minutes: typeof ratingMin === 'number' ? ratingMin : 90,
        pse: 0,
        status: '-',
      };
    });

    const subsList: MatchPhysicalPlayerEntry[] = (match.substitutes || []).map((subId, index) => {
      const p = players.find((pl) => pl.id === subId);
      const ratingMin = match.playerRatings?.[subId]?.minutes;
      return {
        number: startersList.length + index + 1,
        playerId: subId,
        firstName: p ? p.firstName.toUpperCase() : 'SUPLENTE',
        lastName: p ? p.lastName.toUpperCase() : `#${index + 12}`,
        role: 'SUPLENTE',
        minutes: typeof ratingMin === 'number' ? ratingMin : 0,
        pse: 0,
        status: '-',
      };
    });

    const allP = [...startersList, ...subsList];
    return {
      fieldCondition: match.pitchType === 'Césped Artificial' ? 'Sintético' : 'Césped',
      tacticalSystem: match.formation || '1-4-3-3',
      venueLocation: match.venue || 'COMPLEJO SLQ',
      recordedBy: match.coachStaff.physicalTrainer || clubInfo.coachStaff.physicalTrainer || 'Preparador Físico',
      notes: '',
      players: allP,
      averagePseTitulares: 0,
      averagePseSuplentes: 0,
      averagePseTotal: 0,
    };
  };

  const [report, setReport] = useState<MatchPhysicalReport>(() => {
    return match.physicalReport || generateDefaultReport();
  });

  const [isSaved, setIsSaved] = useState(false);

  // Keep in sync if match changes
  useEffect(() => {
    if (match.physicalReport) {
      setReport(match.physicalReport);
    } else {
      setReport(generateDefaultReport());
    }
  }, [match.id]);

  // Recalculate PSE averages
  const calculateAverages = (playersList: MatchPhysicalPlayerEntry[]) => {
    const titulares = playersList.filter((p) => p.role === 'TITULAR');
    const suplentes = playersList.filter((p) => p.role === 'SUPLENTE');

    const sumPseTitulares = titulares.reduce((acc, curr) => acc + (Number(curr.pse) || 0), 0);
    const avgTitulares = titulares.length > 0 ? Math.round((sumPseTitulares / titulares.length) * 10) / 10 : 0;

    const sumPseSuplentes = suplentes.reduce((acc, curr) => acc + (Number(curr.pse) || 0), 0);
    const avgSuplentes = suplentes.length > 0 ? Math.round((sumPseSuplentes / suplentes.length) * 10) / 10 : 0;

    const totalActive = playersList.filter((p) => p.minutes > 0);
    const sumPseTotal = totalActive.reduce((acc, curr) => acc + (Number(curr.pse) || 0), 0);
    const avgTotal = totalActive.length > 0 ? Math.round((sumPseTotal / totalActive.length) * 10) / 10 : 0;

    return { avgTitulares, avgSuplentes, avgTotal };
  };

  const handlePlayerFieldChange = (index: number, field: keyof MatchPhysicalPlayerEntry, value: any) => {
    const updatedPlayers = [...report.players];
    updatedPlayers[index] = {
      ...updatedPlayers[index],
      [field]: field === 'minutes' || field === 'pse' ? Number(value) : value,
    };

    const { avgTitulares, avgSuplentes, avgTotal } = calculateAverages(updatedPlayers);

    setReport({
      ...report,
      players: updatedPlayers,
      averagePseTitulares: avgTitulares,
      averagePseSuplentes: avgSuplentes,
      averagePseTotal: avgTotal,
    });
    setIsSaved(false);
  };

  const handleSave = () => {
    const { avgTitulares, avgSuplentes, avgTotal } = calculateAverages(report.players);
    const finalReport: MatchPhysicalReport = {
      ...report,
      averagePseTitulares: avgTitulares,
      averagePseSuplentes: avgSuplentes,
      averagePseTotal: avgTotal,
    };
    updateMatchPhysicalReport(match.id, finalReport);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetFromLineup = () => {
    const resetRep = generateDefaultReport();
    setReport(resetRep);
    updateMatchPhysicalReport(match.id, resetRep);
    setShowResetConfirm(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const titulares = report.players.filter((p) => p.role === 'TITULAR');
  const suplentes = report.players.filter((p) => p.role === 'SUPLENTE');

  const { avgTitulares } = calculateAverages(report.players);

  return (
    <div className="space-y-6">
      {/* Action Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-amber-400" />
            <span>Área Física - Fútbol Formativo (Registro por Partido)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Planilla de registro de carga física, minutos disputados, PSE (0 a 10) y estado físico para categorías formativas (Sub 14 a Sub 20).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetFromLineup}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="Importar lista actualizada desde la alineación"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sincronizar Alineación</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={`inline-flex items-center gap-2 px-5 py-2 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer ${
              isSaved
                ? 'bg-emerald-600 text-white shadow-emerald-900/40'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-950/40'
            }`}
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? '¡Reporte Guardado!' : 'Guardar Reporte Físico'}</span>
          </button>
        </div>
      </div>

      {/* Official Form Sheet Preview - EXACT LAYOUT AS IMAGE 1 */}
      <div className="bg-white text-black p-5 sm:p-8 rounded-2xl shadow-2xl border-2 border-slate-300 overflow-x-auto font-sans">
        {/* Document Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4 gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3">
            <SanLuisLogo className="w-14 h-14 shrink-0 drop-shadow" />
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-black">
                REPORTE AREA FISICA - FUTBOL FORMATIVO
              </h2>
              <p className="text-xs font-bold text-slate-700 uppercase">
                Club Deportivo San Luis de Quillota • Área de Preparación Física
              </p>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="bg-black text-yellow-300 font-black px-2.5 py-1 rounded text-[11px] uppercase tracking-wider">
              {match.category}
            </span>
            <p className="text-[10px] text-slate-600 font-bold mt-1">
              PF: {report.recordedBy || match.coachStaff.physicalTrainer}
            </p>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-300 mb-5 text-xs">
          <div>
            <span className="font-extrabold text-slate-600 block text-[10px] uppercase">LOCAL:</span>
            <span className="font-black text-black text-sm">
              {match.isHome ? clubInfo.shortName : match.opponent}
            </span>
          </div>

          <div>
            <span className="font-extrabold text-slate-600 block text-[10px] uppercase">RESULTADO:</span>
            <span className="font-black text-emerald-800 text-sm">
              {match.homeScore} - {match.awayScore}
            </span>
          </div>

          <div>
            <span className="font-extrabold text-slate-600 block text-[10px] uppercase">VISITA:</span>
            <span className="font-black text-black text-sm">
              {match.isHome ? match.opponent : clubInfo.shortName}
            </span>
          </div>

          <div>
            <span className="font-extrabold text-slate-600 block text-[10px] uppercase">ESTADO CAMPO:</span>
            <select
              value={report.fieldCondition}
              onChange={(e) => setReport({ ...report, fieldCondition: e.target.value as any })}
              className="font-bold text-xs bg-white border border-slate-300 rounded px-2 py-1 text-black cursor-pointer w-full"
            >
              <option value="Césped">Césped</option>
              <option value="Sintético">Sintético</option>
              <option value="Mixto">Mixto</option>
              <option value="Tierra">Tierra</option>
            </select>
          </div>

          <div>
            <span className="font-extrabold text-slate-600 block text-[10px] uppercase">SISTEMA:</span>
            <input
              type="text"
              value={report.tacticalSystem || match.formation}
              onChange={(e) => setReport({ ...report, tacticalSystem: e.target.value })}
              className="font-bold text-xs bg-white border border-slate-300 rounded px-2 py-1 text-black w-full"
              placeholder="1-4-3-3"
            />
          </div>

          <div>
            <span className="font-extrabold text-slate-600 block text-[10px] uppercase">CATEGORIA:</span>
            <span className="font-black text-black text-xs block py-1">
              {match.category.replace('Sub ', 'U')}
            </span>
          </div>

          <div className="col-span-2">
            <span className="font-extrabold text-slate-600 block text-[10px] uppercase">LOCALIA / ESTADIO:</span>
            <input
              type="text"
              value={report.venueLocation || match.venue}
              onChange={(e) => setReport({ ...report, venueLocation: e.target.value })}
              className="font-bold text-xs bg-white border border-slate-300 rounded px-2 py-1 text-black w-full"
              placeholder="Complejo San Felipe / Complejo SLQ"
            />
          </div>
        </div>

        {/* PHYSICAL TABLE (YELLOW HEADER EXACTLY LIKE IMAGE 1) */}
        <div className="border-2 border-black rounded-lg overflow-hidden">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#FFFF00] text-black font-black uppercase text-center border-b-2 border-black">
                <th className="py-2 px-2 border-r border-black w-12">#</th>
                <th className="py-2 px-3 border-r border-black text-left">Nombre</th>
                <th className="py-2 px-3 border-r border-black text-left">Apellido</th>
                <th className="py-2 px-2 border-r border-black w-28">Rol</th>
                <th className="py-2 px-2 border-r border-black w-20">Minutos</th>
                <th className="py-2 px-2 border-r border-black w-20">PSE</th>
                <th className="py-2 px-3 border-black w-32">Estado</th>
              </tr>
            </thead>
            <tbody>
              {/* TITULARES */}
              {report.players.map((p, idx) => {
                if (p.role !== 'TITULAR') return null;
                return (
                  <tr key={p.playerId || idx} className="border-b border-slate-300 hover:bg-yellow-50/50">
                    <td className="py-1 px-2 border-r border-slate-300 font-black text-center bg-yellow-200/50 text-black">
                      {p.number}
                    </td>
                    <td className="py-1 px-3 border-r border-slate-300 font-extrabold text-black">
                      <input
                        type="text"
                        value={p.firstName}
                        onChange={(e) => handlePlayerFieldChange(idx, 'firstName', e.target.value.toUpperCase())}
                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-yellow-400 rounded px-1 font-extrabold uppercase text-xs"
                      />
                    </td>
                    <td className="py-1 px-3 border-r border-slate-300 font-black text-black">
                      <input
                        type="text"
                        value={p.lastName}
                        onChange={(e) => handlePlayerFieldChange(idx, 'lastName', e.target.value.toUpperCase())}
                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-yellow-400 rounded px-1 font-black uppercase text-xs"
                      />
                    </td>
                    <td className="py-1 px-2 border-r border-slate-300 text-center">
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-black text-[10px] uppercase border border-amber-300">
                        TITULAR
                      </span>
                    </td>
                    <td className="py-1 px-2 border-r border-slate-300 text-center font-bold">
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={p.minutes}
                        onChange={(e) => handlePlayerFieldChange(idx, 'minutes', e.target.value)}
                        className="w-14 text-center font-bold bg-white border border-slate-300 rounded py-0.5"
                      />
                    </td>
                    <td className="py-1 px-2 border-r border-slate-300 text-center">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={p.pse}
                        onChange={(e) => handlePlayerFieldChange(idx, 'pse', e.target.value)}
                        className="w-12 text-center font-black bg-yellow-50 border border-slate-300 rounded py-0.5 text-black"
                      />
                    </td>
                    <td className="py-1 px-2 text-center">
                      <select
                        value={p.status}
                        onChange={(e) => handlePlayerFieldChange(idx, 'status', e.target.value)}
                        className={`text-xs font-black rounded px-2 py-0.5 border cursor-pointer ${
                          p.status === 'OK'
                            ? 'bg-amber-100 text-amber-900 border-amber-400'
                            : p.status === 'Fatiga' || p.status === 'Sobrecarga'
                            ? 'bg-orange-100 text-orange-900 border-orange-400'
                            : p.status === 'Lesión'
                            ? 'bg-rose-100 text-rose-900 border-rose-400'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="OK">OK</option>
                        <option value="-">-</option>
                        <option value="Fatiga">Fatiga</option>
                        <option value="Molestia">Molestia</option>
                        <option value="Sobrecarga">Sobrecarga</option>
                        <option value="Lesión">Lesión</option>
                      </select>
                    </td>
                  </tr>
                );
              })}

              {/* PROMEDIO PSE ROW (YELLOW BAR FROM IMAGE 1) */}
              <tr className="bg-[#FFFF00] text-black font-black border-y-2 border-black">
                <td colSpan={5} className="py-1.5 px-3 text-right uppercase tracking-wider text-xs border-r border-black">
                  Promedio PSE
                </td>
                <td className="py-1.5 px-2 text-center font-black text-sm border-r border-black">
                  {Math.round(avgTitulares)}
                </td>
                <td className="py-1.5 px-3 bg-yellow-300/60 text-center text-[10px] text-slate-800">
                  (Media Titulares)
                </td>
              </tr>

              {/* SUPLENTES SECTION */}
              {report.players.map((p, idx) => {
                if (p.role !== 'SUPLENTE') return null;
                return (
                  <tr key={p.playerId || idx} className="border-b border-slate-300 hover:bg-slate-50">
                    <td className="py-1 px-2 border-r border-slate-300 font-black text-center bg-slate-100 text-black">
                      {p.number}
                    </td>
                    <td className="py-1 px-3 border-r border-slate-300 font-extrabold text-black">
                      <input
                        type="text"
                        value={p.firstName}
                        onChange={(e) => handlePlayerFieldChange(idx, 'firstName', e.target.value.toUpperCase())}
                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-yellow-400 rounded px-1 font-extrabold uppercase text-xs"
                      />
                    </td>
                    <td className="py-1 px-3 border-r border-slate-300 font-black text-black">
                      <input
                        type="text"
                        value={p.lastName}
                        onChange={(e) => handlePlayerFieldChange(idx, 'lastName', e.target.value.toUpperCase())}
                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-yellow-400 rounded px-1 font-black uppercase text-xs"
                      />
                    </td>
                    <td className="py-1 px-2 border-r border-slate-300 text-center">
                      <span className="inline-block px-2 py-0.5 rounded bg-rose-800 text-white font-black text-[10px] uppercase shadow-xs">
                        SUPLENTE
                      </span>
                    </td>
                    <td className="py-1 px-2 border-r border-slate-300 text-center font-bold">
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={p.minutes}
                        onChange={(e) => handlePlayerFieldChange(idx, 'minutes', e.target.value)}
                        className="w-14 text-center font-bold bg-white border border-slate-300 rounded py-0.5"
                      />
                    </td>
                    <td className="py-1 px-2 border-r border-slate-300 text-center">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={p.pse}
                        onChange={(e) => handlePlayerFieldChange(idx, 'pse', e.target.value)}
                        className="w-12 text-center font-black bg-slate-50 border border-slate-300 rounded py-0.5 text-black"
                      />
                    </td>
                    <td className="py-1 px-2 text-center">
                      <select
                        value={p.status}
                        onChange={(e) => handlePlayerFieldChange(idx, 'status', e.target.value)}
                        className={`text-xs font-black rounded px-2 py-0.5 border cursor-pointer ${
                          p.status === 'OK'
                            ? 'bg-amber-100 text-amber-900 border-amber-400'
                            : p.status === 'Fatiga' || p.status === 'Sobrecarga'
                            ? 'bg-orange-100 text-orange-900 border-orange-400'
                            : p.status === 'Lesión'
                            ? 'bg-rose-100 text-rose-900 border-rose-400'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="-">-</option>
                        <option value="OK">OK</option>
                        <option value="Fatiga">Fatiga</option>
                        <option value="Molestia">Molestia</option>
                        <option value="Sobrecarga">Sobrecarga</option>
                        <option value="Lesión">Lesión</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Notes & Signatures */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-300">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Observaciones del Preparador Físico:
            </label>
            <textarea
              rows={2}
              value={report.notes || ''}
              onChange={(e) => setReport({ ...report, notes: e.target.value })}
              placeholder="Anotaciones sobre respuestas fisiológicas, clima, tolerancia a la carga o alertas individuales..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-black text-xs"
            />
          </div>

          <div className="flex flex-col justify-end items-end gap-1">
            <div className="w-56 border-b border-black text-center pb-1 mt-6">
              <span className="font-bold text-[10px] text-slate-600">FIRMA PREPARADOR FÍSICO</span>
            </div>
            <span className="text-[10px] font-black text-black">
              {report.recordedBy || match.coachStaff.physicalTrainer}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

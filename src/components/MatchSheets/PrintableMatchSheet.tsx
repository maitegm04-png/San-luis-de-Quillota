import React, { useState } from 'react';
import { MatchSheet, Player } from '../../types/football';
import { useFootball } from '../../context/FootballContext';
import { Printer, Shield, CheckCircle2, Clock, Settings2, Download, FileDown, Trophy, Star, Activity, Flame } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintableMatchSheetProps {
  match: MatchSheet;
}

export const PrintableMatchSheet: React.FC<PrintableMatchSheetProps> = ({ match }) => {
  const { clubInfo, players } = useFootball();

  // Customization options: By default, DNI, Fecha, Firmas, and Estadísticas Colectivas are removed as requested
  const [includeDni, setIncludeDni] = useState<boolean>(false);
  const [includeDate, setIncludeDate] = useState<boolean>(false);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(false);
  const [includeCollectiveStats, setIncludeCollectiveStats] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('official-match-sheet');
    if (!element) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution for crisp printing
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pageHeight = pdf.internal.pageSize.getHeight();
      let position = 0;

      if (pdfHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      } else {
        let remainingHeight = pdfHeight;
        while (remainingHeight > 0) {
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          remainingHeight -= pageHeight;
          position -= pageHeight;
          if (remainingHeight > 0) {
            pdf.addPage();
          }
        }
      }

      const cleanClub = clubInfo.shortName.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanOpponent = match.opponent.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanRound = match.matchDay.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Planilla_${cleanClub}_vs_${cleanOpponent}_${cleanRound}.pdf`;

      pdf.save(fileName);
    } catch (err) {
      console.error('Error al exportar a PDF:', err);
      // Fallback
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const getPlayer = (id?: string): Player | undefined => {
    if (!id) return undefined;
    return players.find((p) => p.id === id);
  };

  const starters = match.startingEleven
    .map((slot) => {
      const p = getPlayer(slot.playerId);
      return { slot, player: p };
    })
    .sort((a, b) => (a.player?.squadNumber || 99) - (b.player?.squadNumber || 99));

  const substitutes = match.substitutes
    .map((id) => getPlayer(id))
    .filter((p): p is Player => p !== undefined)
    .sort((a, b) => a.squadNumber - b.squadNumber);

  const goalEvents = match.events.filter((e) => e.type === 'goal' || e.type === 'penalty_scored' || e.type === 'goal_conceded');
  const cardEvents = match.events.filter((e) => e.type === 'yellow_card' || e.type === 'red_card');
  const subEvents = match.events.filter((e) => e.type === 'sub_in_out');

  const mvpPlayer = getPlayer(match.mvpPlayerId);

  return (
    <div className="space-y-4">
      {/* Top Action & Options Bar (hidden when printing) */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl print:hidden shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Planilla Oficial y Acta Completa del Partido
            </h3>
            <p className="text-xs text-slate-400">
              Imprime o descarga directamente en archivo PDF con las alineaciones y todo lo que sucedió en el encuentro.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-md shadow-emerald-950/40 transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExporting ? 'Generando PDF...' : 'Exportar a PDF (.pdf)'}</span>
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-lg border border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center gap-4 flex-wrap text-xs text-slate-300">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5 text-emerald-400" />
            Opciones de Impresión:
          </span>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={includeDni}
              onChange={(e) => setIncludeDni(e.target.checked)}
              className="accent-emerald-500 rounded cursor-pointer"
            />
            <span>Incluir DNI / Ficha</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={includeDate}
              onChange={(e) => setIncludeDate(e.target.checked)}
              className="accent-emerald-500 rounded cursor-pointer"
            />
            <span>Incluir Fecha / Hora</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={includeSignatures}
              onChange={(e) => setIncludeSignatures(e.target.checked)}
              className="accent-emerald-500 rounded cursor-pointer"
            />
            <span>Incluir Columnas y Casillas de Firma</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={includeCollectiveStats}
              onChange={(e) => setIncludeCollectiveStats(e.target.checked)}
              className="accent-amber-400 rounded cursor-pointer"
            />
            <span>Incluir Estadísticas Colectivas</span>
          </label>
        </div>
      </div>

      {/* Official Printable Sheet Container */}
      <div
        id="official-match-sheet"
        className="bg-white text-black p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-300 font-sans print:shadow-none print:border-none print:p-0 print:m-0"
        style={{ minHeight: '800px' }}
      >
        {/* Header: Club Shield & details */}
        <div className="border-b-2 border-black pb-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-amber-400 text-black rounded-lg flex items-center justify-center font-black text-xl border-2 border-black shadow">
                SLQ
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-black">
                  {clubInfo.name}
                </h1>
                <p className="text-xs font-semibold text-slate-700 uppercase">
                  {match.category || clubInfo.category} • Temporada {clubInfo.season}
                </p>
                <p className="text-[10px] text-slate-500">
                  Campo habitual: {clubInfo.stadium}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-black text-white text-xs font-black uppercase tracking-wider rounded">
                Planilla Oficial de Partido
              </span>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {match.competition} - {match.matchDay} {match.category && `(${match.category})`}
              </p>
              {includeDate && (
                <p className="text-[11px] text-slate-600 font-semibold">{match.date} | {match.time} h</p>
              )}
            </div>
          </div>

          {/* Match Location & Opponent banner */}
          <div className="grid grid-cols-2 gap-3 mt-4 bg-slate-100 p-2.5 rounded border border-slate-300 text-xs">
            <div>
              <p className="text-slate-500 font-semibold text-[10px] uppercase">Encuentro:</p>
              <p className="font-extrabold text-sm text-slate-900">
                {match.isHome ? clubInfo.name : match.opponent} vs {match.isHome ? match.opponent : clubInfo.name}
              </p>
              <p className="text-[11px] text-slate-600">
                Condición: <strong>{match.isHome ? 'LOCAL' : 'VISITANTE'}</strong> • Dibujo Táctico: <strong>{match.formation}</strong>
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold text-[10px] uppercase">Árbitro e Instalación:</p>
              <p className="font-bold text-slate-900">{match.referee || 'Árbitro sin designar'}</p>
              <p className="text-[11px] text-slate-600">
                {match.venue} ({match.pitchType})
              </p>
            </div>
          </div>
        </div>

        {/* Big Match Score & Status Header */}
        <div className="mb-5 bg-slate-50 border-2 border-black p-3 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Marcador del Partido</span>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-black">
                {match.isHome ? clubInfo.name : match.opponent}
              </span>
              <span className="px-3 py-1 bg-black text-white font-black text-xl rounded">
                {match.status === 'scheduled' ? 'VS' : `${match.homeScore} - ${match.awayScore}`}
              </span>
              <span className="font-black text-xl text-black">
                {match.isHome ? match.opponent : clubInfo.name}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Estado del Acta</span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase ${
              match.status === 'finished' ? 'bg-emerald-100 text-emerald-900 border border-emerald-400' :
              match.status === 'live' ? 'bg-rose-100 text-rose-900 border border-rose-400' :
              'bg-slate-200 text-slate-800'
            }`}>
              {match.status === 'finished' ? 'Partido Finalizado' : match.status === 'live' ? 'En Directo' : 'Programado'}
            </span>
            {mvpPlayer && (
              <p className="text-[11px] font-bold text-slate-800 mt-1">
                ★ MVP: #{mvpPlayer.squadNumber} {mvpPlayer.nickname || mvpPlayer.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Starting Eleven Table */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-xs font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded">
              Alineación Titular (11 Inicial)
            </h2>
            <span className="text-[11px] font-semibold text-slate-700">
              Esquema: {match.formation}
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead className="bg-slate-200 text-slate-800 uppercase text-[10px] font-bold">
              <tr>
                <th className="border border-slate-300 p-1.5 text-center w-12">Dorsal</th>
                <th className="border border-slate-300 p-1.5">Apellidos y Nombre</th>
                <th className="border border-slate-300 p-1.5 text-center w-24">Posición</th>
                {includeDni && (
                  <th className="border border-slate-300 p-1.5 text-center w-24">DNI / Ficha</th>
                )}
                <th className="border border-slate-300 p-1.5 text-center w-24">Rol Táctico</th>
                <th className="border border-slate-300 p-1.5 text-center w-16">Minutos</th>
                <th className="border border-slate-300 p-1.5 text-center w-16">Nota</th>
                {includeSignatures && (
                  <th className="border border-slate-300 p-1.5 text-center w-24">Firma</th>
                )}
              </tr>
            </thead>
            <tbody>
              {starters.map(({ slot, player }, idx) => {
                const isCaptain = player && player.id === match.captainId;
                const isViceCaptain = player && player.id === match.viceCaptainId;
                const isPenalty = player && player.id === match.penaltyTakerId;
                const isFreeKick = player && player.id === match.freeKickTakerId;
                const ratingInfo = player ? match.playerRatings[player.id] : undefined;

                return (
                  <tr key={slot.slotId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-300 p-1.5 text-center font-black text-sm">
                      {player ? `#${player.squadNumber}` : '-'}
                    </td>
                    <td className="border border-slate-300 p-1.5 font-bold">
                      {player ? `${player.lastName}, ${player.firstName}` : <span className="text-slate-400 italic">Posición sin asignar</span>}
                      {player?.nickname && <span className="text-slate-500 font-normal ml-1.5">({player.nickname})</span>}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold">
                      {slot.roleName}
                    </td>
                    {includeDni && (
                      <td className="border border-slate-300 p-1.5 text-center font-mono text-[11px]">
                        {player?.idCard || '—'}
                      </td>
                    )}
                    <td className="border border-slate-300 p-1.5 text-center font-bold text-[10px]">
                      {isCaptain ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-400 px-1.5 py-0.5 rounded font-black">
                          CAPITÁN
                        </span>
                      ) : isViceCaptain ? (
                        <span className="bg-slate-100 text-slate-800 border border-slate-300 px-1.5 py-0.5 rounded">
                          2º CAP
                        </span>
                      ) : isPenalty ? (
                        <span className="text-emerald-700 font-semibold text-[10px]">PENALTIS</span>
                      ) : isFreeKick ? (
                        <span className="text-blue-700 font-semibold text-[10px]">FALTAS</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold text-slate-800">
                      {ratingInfo?.minutes ? `${ratingInfo.minutes}'` : match.status === 'finished' ? "90'" : '—'}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-center font-black text-slate-900">
                      {ratingInfo?.rating ? ratingInfo.rating : '—'}
                    </td>
                    {includeSignatures && (
                      <td className="border border-slate-300 p-1.5 text-center text-slate-400 text-[10px]">
                        ____________
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Substitutes Table */}
        <div className="mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded inline-block mb-1.5">
            Suplentes / Banquillo ({substitutes.length})
          </h2>

          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead className="bg-slate-200 text-slate-800 uppercase text-[10px] font-bold">
              <tr>
                <th className="border border-slate-300 p-1.5 text-center w-12">Dorsal</th>
                <th className="border border-slate-300 p-1.5">Apellidos y Nombre</th>
                <th className="border border-slate-300 p-1.5 text-center w-24">Posición</th>
                {includeDni && (
                  <th className="border border-slate-300 p-1.5 text-center w-24">DNI / Ficha</th>
                )}
                <th className="border border-slate-300 p-1.5 text-center w-24">Participación</th>
                <th className="border border-slate-300 p-1.5 text-center w-16">Minutos</th>
                <th className="border border-slate-300 p-1.5 text-center w-16">Nota</th>
                {includeSignatures && (
                  <th className="border border-slate-300 p-1.5 text-center w-24">Firma</th>
                )}
              </tr>
            </thead>
            <tbody>
              {substitutes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-slate-300 p-2 text-center text-slate-400 italic">
                    No se han registrado suplentes para este partido.
                  </td>
                </tr>
              ) : (
                substitutes.map((player, idx) => {
                  const ratingInfo = match.playerRatings[player.id];
                  const subInEvent = match.events.find((e) => e.type === 'sub_in_out' && e.playerId === player.id);

                  return (
                    <tr key={player.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="border border-slate-300 p-1.5 text-center font-black text-sm">
                        #{player.squadNumber}
                      </td>
                      <td className="border border-slate-300 p-1.5 font-bold">
                        {player.lastName}, {player.firstName}
                        {player.nickname && <span className="text-slate-500 font-normal ml-1.5">({player.nickname})</span>}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center">
                        {player.primaryPosition}
                      </td>
                      {includeDni && (
                        <td className="border border-slate-300 p-1.5 text-center font-mono text-[11px]">
                          {player.idCard || '—'}
                        </td>
                      )}
                      <td className="border border-slate-300 p-1.5 text-center text-[10px]">
                        {subInEvent ? (
                          <span className="font-bold text-emerald-800">Entró en min. {subInEvent.minute}'</span>
                        ) : ratingInfo?.minutes ? (
                          <span className="font-bold text-emerald-800">Jugó</span>
                        ) : (
                          <span className="text-slate-400 italic">Sin minutos</span>
                        )}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold text-slate-800">
                        {ratingInfo?.minutes ? `${ratingInfo.minutes}'` : '0\''}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center font-black text-slate-900">
                        {ratingInfo?.rating ? ratingInfo.rating : '—'}
                      </td>
                      {includeSignatures && (
                        <td className="border border-slate-300 p-1.5 text-center text-slate-400 text-[10px]">
                          ____________
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* SECTION: TODO LO QUE PASÓ EN EL PARTIDO (Incidencias completas) */}
        <div className="mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded inline-block mb-1.5">
            Acta Detallada del Partido: Todo lo que Sucedió
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Goles */}
            <div className="border border-slate-300 rounded p-2.5 bg-slate-50">
              <p className="font-bold border-b border-slate-200 pb-1 mb-1.5 text-slate-900 flex items-center justify-between">
                <span>⚽ Goles Marcados ({goalEvents.length})</span>
              </p>
              {goalEvents.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Sin goles registrados.</p>
              ) : (
                <ul className="space-y-1.5 text-[11px]">
                  {goalEvents.map((g) => {
                    const p = getPlayer(g.playerId);
                    const ast = getPlayer(g.assistPlayerId);
                    return (
                      <li key={g.id} className="border-b border-slate-200/60 pb-1">
                        <span className="font-mono font-black text-black bg-slate-200 px-1 rounded mr-1">
                          {g.minute}'
                        </span>
                        {g.type === 'goal_conceded' ? (
                          <span className="text-rose-700 font-bold">Gol rival {g.opponentPlayerName ? `(${g.opponentPlayerName})` : ''}</span>
                        ) : (
                          <span className="font-bold text-emerald-800">
                            #{p?.squadNumber} {p?.nickname || `${p?.firstName} ${p?.lastName}`}
                          </span>
                        )}
                        {ast && (
                          <span className="text-slate-600 block text-[10px]">
                            Asistencia: #{ast.squadNumber} {ast.nickname || ast.lastName}
                          </span>
                        )}
                        {g.detail && (
                          <span className="text-slate-500 italic block text-[10px]">{g.detail}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Tarjetas */}
            <div className="border border-slate-300 rounded p-2.5 bg-slate-50">
              <p className="font-bold border-b border-slate-200 pb-1 mb-1.5 text-slate-900 flex items-center justify-between">
                <span>🟨 Amonestaciones ({cardEvents.length})</span>
              </p>
              {cardEvents.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Sin tarjetas registradas.</p>
              ) : (
                <ul className="space-y-1.5 text-[11px]">
                  {cardEvents.map((c) => {
                    const p = getPlayer(c.playerId);
                    return (
                      <li key={c.id} className="border-b border-slate-200/60 pb-1">
                        <span className="font-mono font-black text-black bg-slate-200 px-1 rounded mr-1">
                          {c.minute}'
                        </span>
                        <span>{c.type === 'yellow_card' ? '🟨 Amarilla' : '🟥 Roja directa'}: </span>
                        <strong className="text-black">#{p?.squadNumber} {p?.nickname || p?.lastName}</strong>
                        {c.detail && (
                          <span className="text-slate-500 italic block text-[10px]">{c.detail}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Sustituciones */}
            <div className="border border-slate-300 rounded p-2.5 bg-slate-50">
              <p className="font-bold border-b border-slate-200 pb-1 mb-1.5 text-slate-900 flex items-center justify-between">
                <span>🔄 Cambios y Sustituciones ({subEvents.length})</span>
              </p>
              {subEvents.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">Sin sustituciones registradas.</p>
              ) : (
                <ul className="space-y-1.5 text-[11px]">
                  {subEvents.map((s) => {
                    const inP = getPlayer(s.playerId);
                    const outP = getPlayer(s.subOutPlayerId);
                    return (
                      <li key={s.id} className="border-b border-slate-200/60 pb-1">
                        <span className="font-mono font-black text-black bg-slate-200 px-1 rounded mr-1">
                          {s.minute}'
                        </span>
                        <span className="text-emerald-800 font-bold">▲ #{inP?.squadNumber} {inP?.lastName}</span>
                        <span className="text-slate-400 mx-1">por</span>
                        <span className="text-rose-700 font-bold">▼ #{outP?.squadNumber} {outP?.lastName}</span>
                        {s.detail && (
                          <span className="text-slate-500 italic block text-[10px]">{s.detail}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* SECTION: ESTADÍSTICAS COLECTIVAS (Opcional según selector de impresión) */}
        {includeCollectiveStats && (
          <div className="mb-5">
            <h2 className="text-xs font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded inline-block mb-1.5">
              Estadísticas Colectivas del Partido
            </h2>
            <div className="border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-center text-xs border-collapse">
                <thead className="bg-slate-200 text-slate-800 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-1.5 border border-slate-300 w-1/3 text-left pl-3">{match.isHome ? clubInfo.name : match.opponent} (Local)</th>
                    <th className="p-1.5 border border-slate-300 w-1/3">Métrica Colectiva</th>
                    <th className="p-1.5 border border-slate-300 w-1/3 text-right pr-3">{match.isHome ? match.opponent : clubInfo.name} (Visita)</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-semibold">
                  <tr className="bg-white">
                    <td className="p-1.5 border border-slate-300 font-black text-sm">{match.homeScore}</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Goles Marcados</td>
                    <td className="p-1.5 border border-slate-300 font-black text-sm">{match.awayScore}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-1.5 border border-slate-300 font-bold">{match.matchStats.possessionHome}%</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Posesión Estimada</td>
                    <td className="p-1.5 border border-slate-300 font-bold">{100 - match.matchStats.possessionHome}%</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-1.5 border border-slate-300 font-bold">{match.matchStats.shotsHome}</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Tiros Totales</td>
                    <td className="p-1.5 border border-slate-300 font-bold">{match.matchStats.shotsAway}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-1.5 border border-slate-300 font-bold">{match.matchStats.shotsOnTargetHome}</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Tiros a Puerta</td>
                    <td className="p-1.5 border border-slate-300 font-bold">{match.matchStats.shotsOnTargetAway}</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-1.5 border border-slate-300 font-bold">{match.matchStats.cornersHome}</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Córners / Tiros de Esquina</td>
                    <td className="p-1.5 border border-slate-300 font-bold">{match.matchStats.cornersAway}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-1.5 border border-slate-300 font-bold">{match.matchStats.foulsHome}</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Faltas Cometidas</td>
                    <td className="p-1.5 border border-slate-300 font-bold">{match.matchStats.foulsAway}</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="p-1.5 border border-slate-300 font-bold">{match.matchStats.yellowCardsHome ?? 0}🟨 / {match.matchStats.redCardsHome ?? 0}🟥</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Tarjetas Colectivas</td>
                    <td className="p-1.5 border border-slate-300 font-bold">{match.matchStats.yellowCardsAway ?? 0}🟨 / {match.matchStats.redCardsAway ?? 0}🟥</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-1.5 border border-slate-300 font-bold">{match.matchStats.offsidesHome ?? 0}</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Fueras de Juego</td>
                    <td className="p-1.5 border border-slate-300 font-bold">{match.matchStats.offsidesAway ?? 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Coaching Staff Table (7 Official Roles: Entrenador, Ayudante Técnico, PF, PA, KIN, UT, COORD) */}
        <div className="mb-5">
          <h2 className="text-xs font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded inline-block mb-1.5">
            Cuerpo Técnico Oficial
          </h2>
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead className="bg-slate-200 text-slate-800 uppercase text-[10px] font-bold">
              <tr>
                <th className="border border-slate-300 p-1.5 w-40">Cargo Oficial</th>
                <th className="border border-slate-300 p-1.5">Nombre y Apellidos</th>
                {includeSignatures && (
                  <th className="border border-slate-300 p-1.5 text-center w-28">Firma</th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-1.5 font-bold text-slate-800">Entrenador (D.T.)</td>
                <td className="border border-slate-300 p-1.5 font-black text-slate-900">{match.coachStaff.coach || 'Por asignar'}</td>
                {includeSignatures && (
                  <td className="border border-slate-300 p-1.5 text-center text-slate-400 text-[10px]">____________</td>
                )}
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 p-1.5 font-bold text-slate-800">Ayudante Técnico (A.T.)</td>
                <td className="border border-slate-300 p-1.5 font-bold text-slate-900">{match.coachStaff.assistantCoach || 'Por asignar'}</td>
                {includeSignatures && (
                  <td className="border border-slate-300 p-1.5 text-center text-slate-400 text-[10px]">____________</td>
                )}
              </tr>
              <tr>
                <td className="border border-slate-300 p-1.5 font-bold text-slate-800">PF (Preparador Físico)</td>
                <td className="border border-slate-300 p-1.5 font-bold text-slate-900">{match.coachStaff.physicalTrainer || 'Por asignar'}</td>
                {includeSignatures && (
                  <td className="border border-slate-300 p-1.5 text-center text-slate-400 text-[10px]">____________</td>
                )}
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 p-1.5 font-bold text-slate-800">PA (Preparador de Arqueros)</td>
                <td className="border border-slate-300 p-1.5 font-bold text-slate-900">{match.coachStaff.goalkeeperCoach || 'Por asignar'}</td>
                {includeSignatures && (
                  <td className="border border-slate-300 p-1.5 text-center text-slate-400 text-[10px]">____________</td>
                )}
              </tr>
              <tr>
                <td className="border border-slate-300 p-1.5 font-bold text-slate-800">KIN (Kinesiólogo)</td>
                <td className="border border-slate-300 p-1.5 font-bold text-slate-900">{match.coachStaff.kinesiologist || 'Por asignar'}</td>
                {includeSignatures && (
                  <td className="border border-slate-300 p-1.5 text-center text-slate-400 text-[10px]">____________</td>
                )}
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 p-1.5 font-bold text-slate-800">UT (Utilero)</td>
                <td className="border border-slate-300 p-1.5 font-bold text-slate-900">{match.coachStaff.kitManager || 'Por asignar'}</td>
                {includeSignatures && (
                  <td className="border border-slate-300 p-1.5 text-center text-slate-400 text-[10px]">____________</td>
                )}
              </tr>
              <tr>
                <td className="border border-slate-300 p-1.5 font-bold text-slate-800">COORD (Coordinador)</td>
                <td className="border border-slate-300 p-1.5 font-bold text-slate-900">{match.coachStaff.coordinator || 'Por asignar'}</td>
                {includeSignatures && (
                  <td className="border border-slate-300 p-1.5 text-center text-slate-400 text-[10px]">____________</td>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tactical Notes & Coach Conclusion */}
        {(match.tacticalNotesPre || match.tacticalNotesHalf || match.tacticalNotesPost) && (
          <div className="mb-4 bg-slate-50 border border-slate-300 p-3 rounded text-xs space-y-1.5">
            <p className="font-black uppercase text-[10px] text-black">Informe y Conclusiones del Entrenador:</p>
            {match.tacticalNotesPre && (
              <p className="text-slate-800">
                <strong>Plan Previo:</strong> {match.tacticalNotesPre}
              </p>
            )}
            {match.tacticalNotesHalf && (
              <p className="text-slate-800">
                <strong>Ajustes al Descanso:</strong> {match.tacticalNotesHalf}
              </p>
            )}
            {match.tacticalNotesPost && (
              <p className="text-slate-800">
                <strong>Conclusiones Post-Partido:</strong> {match.tacticalNotesPost}
              </p>
            )}
          </div>
        )}

        {/* Footer: Signatures or Clean Footer */}
        {includeSignatures ? (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-black mt-6 text-xs text-center">
            <div>
              <p className="font-bold text-slate-700 uppercase text-[10px]">Firma Capitán</p>
              <div className="h-14 border border-dashed border-slate-400 mt-1 rounded flex items-center justify-center text-[10px] text-slate-400">
                Firma
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-700 uppercase text-[10px]">Resultado Final</p>
              <div className="h-14 border-2 border-black mt-1 rounded flex items-center justify-center font-black text-2xl bg-slate-100">
                {match.status === 'scheduled' ? '- vs -' : `${match.homeScore} - ${match.awayScore}`}
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-700 uppercase text-[10px]">Firma del Entrenador</p>
              <div className="h-14 border border-dashed border-slate-400 mt-1 rounded flex items-center justify-center text-[10px] text-slate-400">
                Firma
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t-2 border-black mt-6 flex items-center justify-between text-xs">
            <div className="text-slate-600">
              <span className="font-bold text-black uppercase">Planilla Entrenador:</span> {clubInfo.name} ({clubInfo.category})
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold uppercase text-slate-700 text-[10px]">Resultado Registrado:</span>
              <span className="border-2 border-black px-4 py-1 rounded font-black text-lg bg-slate-100">
                {match.status === 'scheduled' ? '- vs -' : `${match.homeScore} - ${match.awayScore}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { MatchSheet, MatchGpsReport, MatchGpsPlayerEntry } from '../../types/football';
import { useFootball } from '../../context/FootballContext';
import { SanLuisLogo } from '../Common/SanLuisLogo';
import { Save, RefreshCw, Calculator, Printer, CheckCircle2, Zap, Trophy, TrendingUp } from 'lucide-react';

interface Sub20GpsReportTabProps {
  match: MatchSheet;
}

export const Sub20GpsReportTab: React.FC<Sub20GpsReportTabProps> = ({ match }) => {
  const { updateMatchGpsReport, players, clubInfo } = useFootball();

  // Helper to generate default GPS report
  const generateDefaultGpsReport = (): MatchGpsReport => {
    const starterEntries: MatchGpsPlayerEntry[] = (match.startingEleven || []).map((slot) => {
      const p = players.find((pl) => pl.id === slot.playerId);
      const ratingMin = match.playerRatings?.[slot.playerId]?.minutes;
      const initialLetter = p ? `${p.firstName.charAt(0)}. ` : '';
      const surname = p ? p.lastName.toUpperCase() : 'JUGADOR';
      return {
        playerId: slot.playerId,
        playerName: `${initialLetter}${surname}`,
        minutes: typeof ratingMin === 'number' && ratingMin > 0 ? ratingMin : 90,
        totalDistanceMeters: 9500,
        distancePerMinute: 105.5,
        highSpeedDistance: 650,
        sprintDistance: 210,
        sprintsCount: 10,
        maxSpeed: 30.5,
        pse: 7,
      };
    });

    const subEntries: MatchGpsPlayerEntry[] = (match.substitutes || []).slice(0, 5).map((subId) => {
      const p = players.find((pl) => pl.id === subId);
      const ratingMin = match.playerRatings?.[subId]?.minutes;
      const initialLetter = p ? `${p.firstName.charAt(0)}. ` : '';
      const surname = p ? p.lastName.toUpperCase() : 'SUPLENTE';
      return {
        playerId: subId,
        playerName: `${initialLetter}${surname}`,
        minutes: typeof ratingMin === 'number' && ratingMin > 0 ? ratingMin : 25,
        totalDistanceMeters: 3800,
        distancePerMinute: 115.0,
        highSpeedDistance: 280,
        sprintDistance: 75,
        sprintsCount: 4,
        maxSpeed: 29.0,
        pse: 6,
      };
    });

    const combined = [...starterEntries, ...subEntries];

    return {
      matchName: `VS ${match.opponent.toUpperCase()}`,
      date: match.date || '02 / 10 / 2026',
      category: 'SUB 20',
      stadium: match.venue || 'COMPLEJO SLQ',
      players: combined,
      averages: calculatePromedios(combined),
      topRecords: calculateTopRecords(combined),
    };
  };

  const calculatePromedios = (entries: MatchGpsPlayerEntry[]) => {
    if (entries.length === 0) {
      return {
        avgTotalDistance: 0,
        avgDistancePerMin: 0,
        avgHighSpeedDistance: 0,
        avgSprintDistance: 0,
        avgSprints: 0,
        avgMaxSpeed: 0,
      };
    }
    const count = entries.length;
    const avgTotalDistance = Math.round((entries.reduce((a, b) => a + (Number(b.totalDistanceMeters) || 0), 0) / count) * 10) / 10;
    const avgDistancePerMin = Math.round((entries.reduce((a, b) => a + (Number(b.distancePerMinute) || 0), 0) / count) * 10) / 10;
    const avgHighSpeedDistance = Math.round((entries.reduce((a, b) => a + (Number(b.highSpeedDistance) || 0), 0) / count) * 10) / 10;
    const avgSprintDistance = Math.round((entries.reduce((a, b) => a + (Number(b.sprintDistance) || 0), 0) / count) * 10) / 10;
    const avgSprints = Math.round((entries.reduce((a, b) => a + (Number(b.sprintsCount) || 0), 0) / count) * 10) / 10;
    const avgMaxSpeed = Math.round((entries.reduce((a, b) => a + (Number(b.maxSpeed) || 0), 0) / count) * 10) / 10;

    return {
      avgTotalDistance,
      avgDistancePerMin,
      avgHighSpeedDistance,
      avgSprintDistance,
      avgSprints,
      avgMaxSpeed,
    };
  };

  const calculateTopRecords = (entries: MatchGpsPlayerEntry[]) => {
    if (entries.length === 0) {
      return {
        topTotalDistance: { playerName: '-', value: 0 },
        topHighSpeedDistance: { playerName: '-', value: 0 },
        topMaxSpeed: { playerName: '-', value: 0 },
        topSprints: { playerName: '-', value: 0 },
        topSprintDistance: { playerName: '-', value: 0 },
      };
    }

    const topDist = [...entries].sort((a, b) => (b.totalDistanceMeters || 0) - (a.totalDistanceMeters || 0))[0];
    const topHsr = [...entries].sort((a, b) => (b.highSpeedDistance || 0) - (a.highSpeedDistance || 0))[0];
    const topSpeed = [...entries].sort((a, b) => (b.maxSpeed || 0) - (a.maxSpeed || 0))[0];
    const topSprints = [...entries].sort((a, b) => (b.sprintsCount || 0) - (a.sprintsCount || 0))[0];
    const topSprintDist = [...entries].sort((a, b) => (b.sprintDistance || 0) - (a.sprintDistance || 0))[0];

    return {
      topTotalDistance: { playerName: topDist?.playerName || '-', value: topDist?.totalDistanceMeters || 0 },
      topHighSpeedDistance: { playerName: topHsr?.playerName || '-', value: topHsr?.highSpeedDistance || 0 },
      topMaxSpeed: { playerName: topSpeed?.playerName || '-', value: topSpeed?.maxSpeed || 0 },
      topSprints: { playerName: topSprints?.playerName || '-', value: topSprints?.sprintsCount || 0 },
      topSprintDistance: { playerName: topSprintDist?.playerName || '-', value: topSprintDist?.sprintDistance || 0 },
    };
  };

  const [gpsReport, setGpsReport] = useState<MatchGpsReport>(() => {
    return match.gpsReport || generateDefaultGpsReport();
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (match.gpsReport) {
      setGpsReport(match.gpsReport);
    } else {
      setGpsReport(generateDefaultGpsReport());
    }
  }, [match.id]);

  const handleFieldChange = (index: number, field: keyof MatchGpsPlayerEntry, value: any) => {
    const updated = [...gpsReport.players];
    updated[index] = {
      ...updated[index],
      [field]: field === 'playerName' ? value : Number(value),
    };

    // Auto-calculate distance/min if total distance or minutes change
    if (field === 'totalDistanceMeters' || field === 'minutes') {
      const mins = field === 'minutes' ? Number(value) : updated[index].minutes;
      const totalDist = field === 'totalDistanceMeters' ? Number(value) : updated[index].totalDistanceMeters;
      if (mins > 0 && totalDist > 0) {
        updated[index].distancePerMinute = Math.round((totalDist / mins) * 10) / 10;
      }
    }

    const avgs = calculatePromedios(updated);
    const tops = calculateTopRecords(updated);

    setGpsReport({
      ...gpsReport,
      players: updated,
      averages: avgs,
      topRecords: tops,
    });
    setIsSaved(false);
  };

  const handleRecalculateAll = () => {
    const updated = gpsReport.players.map((p) => {
      const distPerMin = p.minutes > 0 ? Math.round((p.totalDistanceMeters / p.minutes) * 10) / 10 : p.distancePerMinute;
      return { ...p, distancePerMinute: distPerMin };
    });

    const avgs = calculatePromedios(updated);
    const tops = calculateTopRecords(updated);

    const newRep: MatchGpsReport = {
      ...gpsReport,
      players: updated,
      averages: avgs,
      topRecords: tops,
    };
    setGpsReport(newRep);
    updateMatchGpsReport(match.id, newRep);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSave = () => {
    const avgs = calculatePromedios(gpsReport.players);
    const tops = calculateTopRecords(gpsReport.players);
    const finalReport: MatchGpsReport = {
      ...gpsReport,
      averages: avgs,
      topRecords: tops,
    };
    updateMatchGpsReport(match.id, finalReport);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddPlayerRow = () => {
    const newPlayer: MatchGpsPlayerEntry = {
      playerId: `gps-ply-${Date.now()}`,
      playerName: 'NUEVO JUGADOR',
      minutes: 45,
      totalDistanceMeters: 5000,
      distancePerMinute: 111.1,
      highSpeedDistance: 350,
      sprintDistance: 120,
      sprintsCount: 6,
      maxSpeed: 30.0,
      pse: 6,
    };
    const updated = [...gpsReport.players, newPlayer];
    setGpsReport({
      ...gpsReport,
      players: updated,
      averages: calculatePromedios(updated),
      topRecords: calculateTopRecords(updated),
    });
    setIsSaved(false);
  };

  const handleRemovePlayerRow = (index: number) => {
    const updated = gpsReport.players.filter((_, idx) => idx !== index);
    setGpsReport({
      ...gpsReport,
      players: updated,
      averages: calculatePromedios(updated),
      topRecords: calculateTopRecords(updated),
    });
    setIsSaved(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
              Exclusivo Sub-20
            </span>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Módulo de Métricas GPS Post-Partido</span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Registro cinemático avanzado con dispositivos GPS para la categoría Sub-20 (Distancia Total, Alta Velocidad +21 km/h, Sprints +25 km/h, Velocidad Máxima y PSE).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleRecalculateAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
            title="Recalcular promedios y mejores marcas"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span>Recalcular Promedios</span>
          </button>

          <button
            type="button"
            onClick={handleAddPlayerRow}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <span>+ Añadir Fila</span>
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
            <span>{isSaved ? '¡Métricas Guardadas!' : 'Guardar Informe GPS'}</span>
          </button>
        </div>
      </div>

      {/* DOCUMENT PREVIEW - EXACT REPLICA OF ATTACHED PDF (IMAGE 2) */}
      <div className="bg-white text-black p-6 sm:p-8 rounded-2xl shadow-2xl border-2 border-slate-300 font-sans overflow-x-auto">
        {/* Yellow Header Banner */}
        <div className="bg-[#FFFF00] text-black font-black text-center py-2.5 px-4 text-sm sm:text-base uppercase tracking-wider border-2 border-black rounded-t-lg">
          INFORME GPS POST PARTIDO - SAN LUIS DE QUILLOTA
        </div>

        {/* Header Metadata with San Luis Logo */}
        <div className="flex items-center justify-between border-x-2 border-b-2 border-black p-4 bg-slate-50 gap-4 flex-wrap sm:flex-nowrap">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs w-full max-w-xl">
            <div className="flex items-center gap-2">
              <span className="font-black bg-[#FFFF00] text-black px-2 py-0.5 rounded text-[11px] w-28 uppercase border border-black text-center">
                PARTIDO
              </span>
              <input
                type="text"
                value={gpsReport.matchName}
                onChange={(e) => setGpsReport({ ...gpsReport, matchName: e.target.value.toUpperCase() })}
                className="font-bold text-xs bg-white border border-slate-300 rounded px-2 py-0.5 flex-1 uppercase"
                placeholder="VS SANTIAGO CITY"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-black bg-[#FFFF00] text-black px-2 py-0.5 rounded text-[11px] w-28 uppercase border border-black text-center">
                FECHA
              </span>
              <input
                type="text"
                value={gpsReport.date}
                onChange={(e) => setGpsReport({ ...gpsReport, date: e.target.value })}
                className="font-bold text-xs bg-white border border-slate-300 rounded px-2 py-0.5 flex-1 font-mono"
                placeholder="02 / 10 / 2026"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-black bg-[#FFFF00] text-black px-2 py-0.5 rounded text-[11px] w-28 uppercase border border-black text-center">
                CATEGORÍA
              </span>
              <span className="font-black text-xs text-black py-0.5">
                SUB 20 (FÚTBOL FORMATIVO)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-black bg-[#FFFF00] text-black px-2 py-0.5 rounded text-[11px] w-28 uppercase border border-black text-center">
                ESTADIO
              </span>
              <input
                type="text"
                value={gpsReport.stadium}
                onChange={(e) => setGpsReport({ ...gpsReport, stadium: e.target.value.toUpperCase() })}
                className="font-bold text-xs bg-white border border-slate-300 rounded px-2 py-0.5 flex-1 uppercase"
                placeholder="COMPLEJO SLQ"
              />
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-center p-1">
            <SanLuisLogo className="w-16 h-16 drop-shadow-md" />
          </div>
        </div>

        {/* GPS TABLE (YELLOW HEADER EXACTLY AS IN PDF) */}
        <div className="border-x-2 border-b-2 border-black overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="bg-[#FFFF00] text-black font-black uppercase text-[10px] sm:text-[11px] border-b-2 border-black">
                <th className="py-2 px-3 border-r border-black text-left">JUGADOR</th>
                <th className="py-2 px-2 border-r border-black w-14">MIN</th>
                <th className="py-2 px-2 border-r border-black w-32">
                  DISTANCIA TOTAL (MTS)
                </th>
                <th className="py-2 px-2 border-r border-black w-24">
                  DISTANCIA/MIN
                </th>
                <th className="py-2 px-2 border-r border-black w-36">
                  DISTANCIA ALTA VELOCIDAD (+21 KM/HRS)
                </th>
                <th className="py-2 px-2 border-r border-black w-32">
                  DISTANCIA SPRINT (MTS)
                </th>
                <th className="py-2 px-2 border-r border-black w-28">
                  SPRINTS (+25KM/HRS)
                </th>
                <th className="py-2 px-2 border-r border-black w-28">
                  MÁXIMA VELOCIDAD
                </th>
                <th className="py-2 px-2 border-black w-10 text-center print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {gpsReport.players.map((p, idx) => {
                const isHighlight = p.totalDistanceMeters >= 10000;
                return (
                  <tr
                    key={p.playerId || idx}
                    className={`border-b border-slate-300 text-[11px] font-bold ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    <td className="py-1 px-3 border-r border-slate-300 text-left font-black text-black">
                      <input
                        type="text"
                        value={p.playerName}
                        onChange={(e) => handleFieldChange(idx, 'playerName', e.target.value.toUpperCase())}
                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-yellow-400 font-black uppercase text-xs"
                      />
                    </td>
                    <td className="py-1 px-2 border-r border-slate-300 text-center font-bold">
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={p.minutes}
                        onChange={(e) => handleFieldChange(idx, 'minutes', e.target.value)}
                        className="w-12 text-center bg-transparent border border-slate-300 rounded font-bold"
                      />
                    </td>
                    <td className={`py-1 px-2 border-r border-slate-300 text-center font-mono ${isHighlight ? 'text-emerald-800 font-black bg-emerald-50/50' : ''}`}>
                      <input
                        type="number"
                        value={p.totalDistanceMeters}
                        onChange={(e) => handleFieldChange(idx, 'totalDistanceMeters', e.target.value)}
                        className="w-20 text-center bg-transparent border border-slate-300 rounded font-bold font-mono"
                      />
                    </td>
                    <td className="py-1 px-2 border-r border-slate-300 text-center font-mono font-bold">
                      <input
                        type="number"
                        step="0.1"
                        value={p.distancePerMinute}
                        onChange={(e) => handleFieldChange(idx, 'distancePerMinute', e.target.value)}
                        className="w-16 text-center bg-transparent border border-slate-300 rounded font-bold font-mono"
                      />
                    </td>
                    <td className="py-1 px-2 border-r border-slate-300 text-center font-mono font-bold">
                      <input
                        type="number"
                        value={p.highSpeedDistance}
                        onChange={(e) => handleFieldChange(idx, 'highSpeedDistance', e.target.value)}
                        className="w-16 text-center bg-transparent border border-slate-300 rounded font-bold font-mono"
                      />
                    </td>
                    <td className="py-1 px-2 border-r border-slate-300 text-center font-mono font-bold">
                      <input
                        type="number"
                        value={p.sprintDistance}
                        onChange={(e) => handleFieldChange(idx, 'sprintDistance', e.target.value)}
                        className="w-16 text-center bg-transparent border border-slate-300 rounded font-bold font-mono"
                      />
                    </td>
                    <td className="py-1 px-2 border-r border-slate-300 text-center font-mono font-bold">
                      <input
                        type="number"
                        value={p.sprintsCount}
                        onChange={(e) => handleFieldChange(idx, 'sprintsCount', e.target.value)}
                        className="w-14 text-center bg-transparent border border-slate-300 rounded font-bold font-mono"
                      />
                    </td>
                    <td className="py-1 px-2 border-r border-slate-300 text-center font-mono font-black text-rose-800">
                      <input
                        type="number"
                        step="0.1"
                        value={p.maxSpeed}
                        onChange={(e) => handleFieldChange(idx, 'maxSpeed', e.target.value)}
                        className="w-16 text-center bg-transparent border border-slate-300 rounded font-black font-mono text-rose-800"
                      />
                    </td>
                    <td className="py-1 px-1 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => handleRemovePlayerRow(idx)}
                        className="text-slate-400 hover:text-rose-600 text-xs px-1 cursor-pointer"
                        title="Eliminar fila"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* BOTTOM SUMMARY TABLES (EXACT LAYOUT OF ATTACHED PDF - IMAGE 2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* 1. PROMEDIOS DEL EQUIPO (YELLOW HEADER) */}
          <div className="border-2 border-black rounded-lg overflow-hidden shadow">
            <div className="bg-[#FFFF00] text-black font-black text-xs uppercase px-3 py-1.5 border-b-2 border-black tracking-wider text-center">
              PROMEDIOS DEL EQUIPO
            </div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-black text-[11px]">
                  <th className="py-1.5 px-3 text-left border-r border-slate-300">VARIABLE</th>
                  <th className="py-1.5 px-3 text-right">PROMEDIO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px] font-bold">
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300">Distancia Total (Mts)</td>
                  <td className="py-1.5 px-3 text-right font-mono font-black">{gpsReport.averages.avgTotalDistance.toLocaleString('es-CL')}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300">Distancia/min</td>
                  <td className="py-1.5 px-3 text-right font-mono font-black">{gpsReport.averages.avgDistancePerMin}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300">Distancia Alta Velocidad (+21 km/h)</td>
                  <td className="py-1.5 px-3 text-right font-mono font-black">{gpsReport.averages.avgHighSpeedDistance}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300">Distancia Sprint</td>
                  <td className="py-1.5 px-3 text-right font-mono font-black">{gpsReport.averages.avgSprintDistance}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300">Sprints (+25 km/h)</td>
                  <td className="py-1.5 px-3 text-right font-mono font-black">{gpsReport.averages.avgSprints}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300">Máxima Velocidad Promedio (km/h)</td>
                  <td className="py-1.5 px-3 text-right font-mono font-black">{gpsReport.averages.avgMaxSpeed}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. MEJORES REGISTROS (BLACK HEADER) */}
          <div className="border-2 border-black rounded-lg overflow-hidden shadow">
            <div className="bg-black text-[#FFFF00] font-black text-xs uppercase px-3 py-1.5 border-b-2 border-black tracking-wider text-center">
              MEJORES REGISTROS
            </div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-200 text-black font-extrabold border-b border-black text-[11px]">
                  <th className="py-1.5 px-3 text-left border-r border-black">VARIABLE</th>
                  <th className="py-1.5 px-3 text-left border-r border-black">MEJOR JUGADOR</th>
                  <th className="py-1.5 px-3 text-right">MEJOR REGISTRO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px] font-bold">
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300">Distancia Total</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-black font-black">{gpsReport.topRecords.topTotalDistance.playerName}</td>
                  <td className="py-1.5 px-3 text-right font-mono font-black text-emerald-800">{gpsReport.topRecords.topTotalDistance.value.toLocaleString('es-CL')} m</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300">Alta Velocidad (+21 km/h)</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-black font-black">{gpsReport.topRecords.topHighSpeedDistance.playerName}</td>
                  <td className="py-1.5 px-3 text-right font-mono font-black text-emerald-800">{gpsReport.topRecords.topHighSpeedDistance.value} m</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300">Máxima Velocidad</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-black font-black">{gpsReport.topRecords.topMaxSpeed.playerName}</td>
                  <td className="py-1.5 px-3 text-right font-mono font-black text-rose-800">{gpsReport.topRecords.topMaxSpeed.value} km/h</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300">SPRINTS (+25 km/h)</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-black font-black">{gpsReport.topRecords.topSprints.playerName}</td>
                  <td className="py-1.5 px-3 text-right font-mono font-black text-emerald-800">{gpsReport.topRecords.topSprints.value}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300">Distancia sprint</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-black font-black">{gpsReport.topRecords.topSprintDistance.playerName}</td>
                  <td className="py-1.5 px-3 text-right font-mono font-black text-emerald-800">{gpsReport.topRecords.topSprintDistance.value} m</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-5 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
          <span>San Luis de Quillota • Departamento de Ciencias del Deporte & Rendimiento Físico</span>
          <span>Tecnología GPS Catapult / GPSports</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  FileUp, 
  Plus, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  User, 
  FileText, 
  ChevronRight,
  Sparkles,
  BarChart3,
  Layers,
  HeartPulse,
  Table,
  Printer,
  Trash2
} from 'lucide-react';
import { useFootball } from '../../context/FootballContext';
import { matchesCategoryFilter, Player, PlayerNutritionalEvaluation } from '../../types/football';
import { NutritionPdfUploadModal } from './NutritionPdfUploadModal';
import { NutritionManualModal } from './NutritionManualModal';
import { NutritionHistoryModal } from './NutritionHistoryModal';
import { PlayerModal } from '../PlayerDatabase/PlayerModal';
import { PlayerFormModal } from '../PlayerDatabase/PlayerFormModal';
import { generateSampleNutritionPdf } from '../../services/nutritionSamplePdfGenerator';
import { generateOfficialAnthropometryPdf } from '../../services/nutritionOfficialTablePdfGenerator';
import { SanLuisLogo } from '../Common/SanLuisLogo';

type NutritionSubTab = 'table' | 'matrix' | 'evolution' | 'recent';

export const NutritionDashboard: React.FC = () => {
  const { 
    players, 
    activeCategory, 
    setActiveCategory, 
    nutritionalEvaluations,
    getPlayerNutritionalHistory,
    deleteNutritionalEvaluation
  } = useFootball();

  const [activeSubTab, setActiveSubTab] = useState<NutritionSubTab>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [trafficFilter, setTrafficFilter] = useState<'all' | 'green' | 'yellow' | 'red' | 'none'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [evalToDelete, setEvalToDelete] = useState<{ id: string; playerName: string; date: string } | null>(null);

  // Distinct evaluation dates registered in the system (only real dates from database)
  const availableEvaluationDates = useMemo(() => {
    const dates = new Set<string>();
    nutritionalEvaluations.forEach((ev) => {
      if (ev.date && ev.date.trim()) dates.add(ev.date.trim());
    });
    return Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [nutritionalEvaluations]);

  // Modals state
  const [isPdfUploadOpen, setIsPdfUploadOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedPlayerForHistory, setSelectedPlayerForHistory] = useState<Player | null>(null);
  const [selectedPlayerForUploadId, setSelectedPlayerForUploadId] = useState<string | undefined>(undefined);
  const [selectedPlayerForFicha, setSelectedPlayerForFicha] = useState<Player | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Filter players by category and search
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      // Category filter
      if (!matchesCategoryFilter(p.category, activeCategory)) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        const nick = (p.nickname || '').toLowerCase();
        const num = p.squadNumber.toString();
        if (!fullName.includes(query) && !nick.includes(query) && !num.includes(query)) {
          return false;
        }
      }

      // Traffic light filter
      if (trafficFilter !== 'all') {
        if (trafficFilter === 'none') {
          return !p.currentNutrition;
        }
        return p.currentNutrition?.trafficLight === trafficFilter;
      }

      return true;
    });
  }, [players, activeCategory, searchQuery, trafficFilter]);

  // Squad nutrition KPIs
  const kpis = useMemo(() => {
    const categoryPlayers = players.filter((p) => matchesCategoryFilter(p.category, activeCategory));
    const evaluatedPlayers = categoryPlayers.filter((p) => p.currentNutrition);

    const greenCount = categoryPlayers.filter((p) => p.currentNutrition?.trafficLight === 'green').length;
    const yellowCount = categoryPlayers.filter((p) => p.currentNutrition?.trafficLight === 'yellow').length;
    const redCount = categoryPlayers.filter((p) => p.currentNutrition?.trafficLight === 'red').length;

    const totalEvalsThisYear = nutritionalEvaluations.filter((ev) => {
      const matchCat = matchesCategoryFilter(ev.category, activeCategory);
      const matchYr = ev.date.startsWith(selectedYear);
      return matchCat && matchYr;
    }).length;

    const avgFat = evaluatedPlayers.length > 0
      ? (evaluatedPlayers.reduce((acc, p) => acc + (p.currentNutrition?.bodyFatPercent || 0), 0) / evaluatedPlayers.length).toFixed(1)
      : '0.0';

    const optimalPercent = evaluatedPlayers.length > 0
      ? Math.round((greenCount / evaluatedPlayers.length) * 100)
      : 0;

    return {
      totalPlayers: categoryPlayers.length,
      evaluatedCount: evaluatedPlayers.length,
      greenCount,
      yellowCount,
      redCount,
      totalEvalsThisYear,
      avgFat,
      optimalPercent,
    };
  }, [players, activeCategory, nutritionalEvaluations, selectedYear]);

  // Selected player for evolution graph in evolution tab
  const [evolutionPlayerId, setEvolutionPlayerId] = useState<string>(filteredPlayers[0]?.id || players[0]?.id || '');
  const evolutionPlayer = players.find((p) => p.id === evolutionPlayerId);
  const evolutionPlayerHistory = evolutionPlayerId ? getPlayerNutritionalHistory(evolutionPlayerId) : [];

  // Table Data: strictly derived from actual uploaded/registered evaluations in nutritionalEvaluations
  const tableData = useMemo(() => {
    // 1. Gather all evaluations that match category, date filter, traffic light filter, and search
    const matchingEvals = nutritionalEvaluations.filter((ev) => {
      if (!matchesCategoryFilter(ev.category, activeCategory)) return false;
      if (selectedDateFilter !== 'all' && ev.date !== selectedDateFilter) return false;
      if (trafficFilter !== 'all' && ev.trafficLight !== trafficFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pName = (ev.playerName || '').toLowerCase();
        const pSquad = (ev.playerSquadNumber || '').toString();
        if (!pName.includes(q) && !pSquad.includes(q)) return false;
      }
      return true;
    });

    // 2. When 'all' dates selected, keep the most recent evaluation per player to avoid duplicates
    let evalsToShow: PlayerNutritionalEvaluation[] = [];
    if (selectedDateFilter === 'all') {
      const playerLatestMap = new Map<string, PlayerNutritionalEvaluation>();
      // Sort descending by date so first occurrence is the latest
      const sorted = [...matchingEvals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      sorted.forEach((ev) => {
        if (!playerLatestMap.has(ev.playerId)) {
          playerLatestMap.set(ev.playerId, ev);
        }
      });
      evalsToShow = Array.from(playerLatestMap.values());
    } else {
      evalsToShow = matchingEvals;
    }

    // 3. Sort evaluations by squad number then name
    evalsToShow.sort((a, b) => {
      const numA = a.playerSquadNumber || 999;
      const numB = b.playerSquadNumber || 999;
      if (numA !== numB) return numA - numB;
      return (a.playerName || '').localeCompare(b.playerName || '');
    });

    return evalsToShow.map((ev, idx) => {
      const player = players.find((p) => p.id === ev.playerId) || {
        id: ev.playerId,
        squadNumber: ev.playerSquadNumber || idx + 1,
        firstName: ev.playerName?.split(' ')[0] || '',
        lastName: ev.playerName?.split(' ').slice(1).join(' ') || '',
        category: ev.category,
        primaryPosition: 'MC' as const,
        birthDate: '2006-01-01',
        dominantFoot: 'Derecho' as const,
        heightCm: ev.heightCm,
        weightKg: ev.weightKg,
        status: 'Disponible' as const,
        avatarColor: 'bg-amber-500',
        attributes: { pace: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70 },
        stats: { matchesPlayed: 0, starts: 0, minutesPlayed: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, avgRating: 7 },
      };

      return {
        rowNumber: idx + 1,
        player,
        playerName: ev.playerName || `${player.firstName} ${player.lastName}`,
        age: ev.age || 18.5,
        heightCm: ev.heightCm,
        weightKg: ev.weightKg,
        bodyFatPercent: ev.bodyFatPercent,
        bodyFatKg: ev.bodyFatKg,
        muscleMassPercent: ev.muscleMassPercent,
        muscleMassKg: ev.muscleMassKg,
        skinfoldSumMm: ev.skinfoldSumMm,
        imo: ev.imo,
        trafficLight: ev.trafficLight,
        statusClassification: ev.statusClassification,
        evaluationDate: ev.date,
        evalId: ev.id,
        hasEvaluation: true,
      };
    });
  }, [nutritionalEvaluations, players, activeCategory, selectedDateFilter, trafficFilter, searchQuery]);

  // General evaluation reports filtered by date, category, traffic light, and search
  const filteredEvaluations = useMemo(() => {
    return nutritionalEvaluations.filter((ev) => {
      // Category filter
      if (!matchesCategoryFilter(ev.category, activeCategory)) return false;
      // Date filter
      if (selectedDateFilter !== 'all' && ev.date !== selectedDateFilter) return false;
      // Traffic light filter
      if (trafficFilter !== 'all' && ev.trafficLight !== trafficFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pName = (ev.playerName || '').toLowerCase();
        const pSquad = (ev.playerSquadNumber || '').toString();
        if (!pName.includes(q) && !pSquad.includes(q)) return false;
      }
      return true;
    });
  }, [nutritionalEvaluations, activeCategory, selectedDateFilter, trafficFilter, searchQuery]);

  // Generates and downloads the official PDF report with all uploaded/filtered evaluations
  const handleDownloadPdf = () => {
    if (tableData.length === 0) {
      alert('No hay evaluaciones para exportar con los filtros actuales.');
      return;
    }

    const { download } = generateOfficialAnthropometryPdf(
      tableData.map((row) => ({
        rowNumber: row.rowNumber,
        playerName: row.playerName,
        squadNumber: row.player.squadNumber,
        age: row.age,
        heightCm: row.heightCm,
        weightKg: row.weightKg,
        bodyFatPercent: row.bodyFatPercent,
        bodyFatKg: row.bodyFatKg,
        muscleMassPercent: row.muscleMassPercent,
        muscleMassKg: row.muscleMassKg,
        skinfoldSumMm: row.skinfoldSumMm,
        imo: row.imo,
        trafficLight: row.trafficLight,
        statusClassification: row.statusClassification,
        evaluationDate: row.evaluationDate,
      })),
      {
        category: activeCategory,
        dateFilter: selectedDateFilter,
      }
    );

    download();
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header Area */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/60 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-amber-500 p-0.5 shadow-lg">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-300">
                <Scale className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-sm">
                  Área Nutricional • San Luis de Quillota
                </span>
                <span className="text-xs text-slate-400">
                  {activeCategory === 'all' ? 'Todas las Categorías' : `Categoría ${activeCategory}`}
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Control Antropométrico y Evaluaciones Nutricionales
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Carga informes en PDF con fecha personalizable, registra automáticamente los 5 componentes (M. Adiposa, M. Muscular, 6 Pliegues, IMO) y semáforo de colores en ficha de cada jugador.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setSelectedPlayerForUploadId(undefined);
                setIsPdfUploadOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-emerald-500 hover:from-amber-300 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all hover:scale-105 cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              <span>Subir PDF y Fijar Fecha de Evaluación</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedPlayerForUploadId(undefined);
                setIsManualModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registro Manual</span>
            </button>
          </div>
        </div>

        {/* Squad Status KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Plantel Evaluado</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-white">{kpis.evaluatedCount}</span>
              <span className="text-xs text-slate-500">/ {kpis.totalPlayers}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">{kpis.optimalPercent}% con ficha activa</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-emerald-950/40">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block flex items-center gap-1">
              <span>🟢</span> Óptimos / En Rango
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-emerald-400">{kpis.greenCount}</span>
              <span className="text-xs text-slate-500">jugadores</span>
            </div>
            <span className="text-[10px] text-slate-400">Grasa &lt; 17%</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-amber-950/40">
            <span className="text-[10px] text-amber-400 uppercase font-bold block flex items-center gap-1">
              <span>🟡</span> En Seguimiento
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-amber-400">{kpis.yellowCount}</span>
              <span className="text-xs text-slate-500">jugadores</span>
            </div>
            <span className="text-[10px] text-slate-400">Grasa 17.1 - 19%</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-rose-950/40">
            <span className="text-[10px] text-rose-400 uppercase font-bold block flex items-center gap-1">
              <span>🔴</span> Atención / Crítico
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-rose-400">{kpis.redCount}</span>
              <span className="text-xs text-slate-500">jugadores</span>
            </div>
            <span className="text-[10px] text-slate-400">Grasa &gt; 19%</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Promedio % Grasa</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-white">{kpis.avgFat}%</span>
            </div>
            <span className="text-[10px] text-slate-400">Meta equipo: &lt; 17.0%</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Controles en {selectedYear}</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-amber-400">{nutritionalEvaluations.length}</span>
              <span className="text-xs text-slate-500">informes</span>
            </div>
            <span className="text-[10px] text-slate-400">Historial completo</span>
          </div>
        </div>
      </div>

      {/* Subtabs and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        {/* Subtabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveSubTab('table')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'table'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Tabla Oficial Antropométrica (5 Componentes)</span>
            <span className="text-[10px] bg-slate-950/40 text-current px-1.5 py-0.2 rounded-full font-bold">
              {tableData.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('matrix')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'matrix'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Matriz de Jugadores y Semáforo</span>
            <span className="text-[10px] bg-slate-950/40 text-current px-1.5 py-0.2 rounded-full font-bold">
              {filteredPlayers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('evolution')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'evolution'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Evolución Anual por Jugador</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('recent')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'recent'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Historial General de Informes</span>
            <span className="text-[10px] bg-slate-950/40 text-current px-1.5 py-0.2 rounded-full font-bold">
              {nutritionalEvaluations.length}
            </span>
          </button>
        </div>

        {/* Traffic Light Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Filtrar:</span>
          <button
            type="button"
            onClick={() => setTrafficFilter('all')}
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              trafficFilter === 'all'
                ? 'bg-slate-700 text-white font-black'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setTrafficFilter('green')}
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              trafficFilter === 'green'
                ? 'bg-emerald-600 text-white font-black'
                : 'bg-slate-950 text-emerald-400 hover:bg-emerald-950/40 border border-slate-800'
            }`}
          >
            <span>🟢</span>
            <span>Óptimos ({kpis.greenCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setTrafficFilter('yellow')}
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              trafficFilter === 'yellow'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-slate-950 text-amber-300 hover:bg-amber-950/40 border border-slate-800'
            }`}
          >
            <span>🟡</span>
            <span>Alerta ({kpis.yellowCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setTrafficFilter('red')}
            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              trafficFilter === 'red'
                ? 'bg-rose-600 text-white font-black'
                : 'bg-slate-950 text-rose-400 hover:bg-rose-950/40 border border-slate-800'
            }`}
          >
            <span>🔴</span>
            <span>Atención ({kpis.redCount})</span>
          </button>
        </div>
      </div>

      {/* Search, Evaluation Date Filter & Year Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, apellido o dorsal..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Date Filter & Year Bar */}
        <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
          {/* Evaluation Date Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-sm">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-400 font-bold whitespace-nowrap">Filtrar por Fecha:</span>
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="bg-transparent border-0 text-amber-300 font-black text-xs focus:ring-0 cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">Todas las fechas (Último control)</option>
              {availableEvaluationDates.map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-amber-300">
                  📅 Control: {d}
                </option>
              ))}
            </select>
            {selectedDateFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedDateFilter('all')}
                className="text-[10px] text-slate-400 hover:text-white bg-slate-800 px-1.5 py-0.5 rounded transition-colors ml-1 cursor-pointer"
                title="Mostrar todas las fechas"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Year selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-500 font-bold">Año:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent border-0 text-white font-bold text-xs focus:ring-0 cursor-pointer"
            >
              <option value="2026" className="bg-slate-900 text-white">2026</option>
              <option value="2025" className="bg-slate-900 text-white">2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* SUBTAB 0: TABLA OFICIAL ANTROPOMÉTRICA (Exact Layout from PDF Report) */}
      {activeSubTab === 'table' && (
        <div className="space-y-4">
          <div
            id="printable-nutrition-table"
            className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl print:border-none print:shadow-none print:bg-white print:text-black print:p-0 print:m-0"
          >
            {/* Official Print Header (Only visible when printing) */}
            <div className="hidden print:flex items-center justify-between p-4 pb-3 border-b-2 border-black mb-3 bg-white text-black">
              <div className="flex items-center gap-3">
                <SanLuisLogo className="w-14 h-16 drop-shadow shrink-0" />
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-black leading-tight">
                    SAN LUIS DE QUILLOTA S.A.D.P.
                  </h1>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">
                    DEPARTAMENTO DE NUTRICIÓN Y RENDIMIENTO DEPORTIVO • FÚTBOL FORMATIVO
                  </p>
                  <p className="text-[11px] font-semibold text-slate-700">
                    INFORME ANTROPOMÉTRICO OFICIAL (5 COMPONENTES) • {activeCategory === 'all' ? 'Todas las Categorías' : `Categoría ${activeCategory}`}
                  </p>
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-700">
                <p>Fecha Filtro: <strong className="text-black">{selectedDateFilter === 'all' ? 'Todas las Fechas' : selectedDateFilter}</strong></p>
                <p>Total Evaluaciones: <strong className="text-black">{tableData.length} futbolistas</strong></p>
                <p className="text-[10px] text-slate-500 mt-1 font-bold">Responsable: Nta. Cristian Fuentes Toledo</p>
              </div>
            </div>

            {/* Header matching Official SLQ PDF Report (Hidden in print) */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950 shadow-sm">
                    PROYECCIÓN SLQ 2026
                  </span>
                  <span className="text-xs font-black uppercase text-amber-300 tracking-wider">
                    INFORME ANTROPOMÉTRICO (5 COMPONENTES)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Evaluación de masa adiposa, masa muscular, 6 pliegues cutáneos e Índice Músculo/Óseo (IMO).
                </p>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow-lg shadow-emerald-950 transition-all hover:scale-105 cursor-pointer"
                  title="Generar y descargar archivo PDF oficial con las evaluaciones subidas"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar PDF Oficial ({tableData.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  title="Imprimir informe en papel o guardar en PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPdfUploadOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black shadow transition-all hover:scale-105 cursor-pointer"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Subir PDF con Fecha</span>
                </button>
              </div>
            </div>

            {/* Table mimicking PDF report table with colors */}
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-300 text-[11px] font-bold uppercase border-b border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                  <tr>
                    <th className="p-3 w-8 text-center text-slate-500 print:text-black">#</th>
                    <th className="p-3">Nombre paciente</th>
                    <th className="p-3 text-center">Edad</th>
                    <th className="p-3 text-center">Talla</th>
                    <th className="p-3 text-center">Peso</th>
                    <th className="p-3 text-center bg-rose-950/30 text-rose-300 border-x border-slate-800/60 print:bg-rose-50 print:text-rose-900 print:border-slate-300" colSpan={2}>
                      M. Adiposa (% / kg)
                    </th>
                    <th className="p-3 text-center bg-blue-950/30 text-blue-300 border-r border-slate-800/60 print:bg-blue-50 print:text-blue-900 print:border-slate-300" colSpan={2}>
                      M. Muscular (% / kg)
                    </th>
                    <th className="p-3 text-center bg-amber-950/30 text-amber-300 border-r border-slate-800/60 print:bg-amber-50 print:text-amber-900 print:border-slate-300">
                      6 Pliegues
                    </th>
                    <th className="p-3 text-center bg-emerald-950/30 text-emerald-300 border-r border-slate-800/60 print:bg-emerald-50 print:text-emerald-900 print:border-slate-300">
                      IMO
                    </th>
                    <th className="p-3 text-center">Semáforo</th>
                    <th className="p-3 text-center print:hidden">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/50 font-mono text-xs">
                  {tableData.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="p-10 text-center bg-slate-950/70 font-sans">
                        <Scale className="w-10 h-10 text-slate-600 mx-auto mb-2.5 opacity-60" />
                        <h4 className="text-sm font-bold text-slate-200">
                          No hay evaluaciones registradas con los filtros actuales
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                          {selectedDateFilter !== 'all' 
                            ? `No figuran evaluaciones en la fecha ${selectedDateFilter}. Puedes cambiar el filtro de fecha a "Todas las fechas" o subir un nuevo informe.`
                            : 'Todas las evaluaciones fueron eliminadas o aún no se han registrado datos para esta categoría.'}
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-2">
                          {selectedDateFilter !== 'all' && (
                            <button
                              type="button"
                              onClick={() => setSelectedDateFilter('all')}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Ver Todas las Fechas
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setIsPdfUploadOpen(true)}
                            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black shadow cursor-pointer flex items-center gap-1.5"
                          >
                            <FileUp className="w-3.5 h-3.5" />
                            <span>Subir Nuevo Informe PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : null}

                  {tableData.map((row) => {
                    const fatPctColor =
                      row.bodyFatPercent !== undefined && row.bodyFatPercent <= 17.0
                        ? 'bg-emerald-950/80 text-emerald-300 font-bold'
                        : row.bodyFatPercent !== undefined && row.bodyFatPercent <= 19.0
                        ? 'bg-amber-950/80 text-amber-300 font-bold'
                        : 'bg-rose-950/80 text-rose-300 font-bold';

                    const fatKgColor =
                      row.bodyFatKg !== undefined && row.bodyFatKg <= 12.0
                        ? 'bg-emerald-950/70 text-emerald-300'
                        : row.bodyFatKg !== undefined && row.bodyFatKg <= 14.5
                        ? 'bg-amber-950/70 text-amber-300'
                        : 'bg-rose-950/70 text-rose-300';

                    const muscPctColor =
                      row.muscleMassPercent !== undefined && row.muscleMassPercent >= 52.0
                        ? 'bg-emerald-950/70 text-emerald-300 font-bold'
                        : 'bg-blue-950/70 text-blue-300 font-bold';

                    const skinfoldsColor =
                      row.skinfoldSumMm !== undefined && row.skinfoldSumMm <= 36.0
                        ? 'bg-emerald-950/80 text-emerald-300 font-bold'
                        : row.skinfoldSumMm !== undefined && row.skinfoldSumMm <= 48.0
                        ? 'bg-amber-950/80 text-amber-300 font-bold'
                        : 'bg-rose-950/80 text-rose-300 font-bold';

                    const imoColor =
                      row.imo !== undefined && row.imo >= 4.2
                        ? 'bg-emerald-950/80 text-emerald-300 font-bold'
                        : row.imo !== undefined && row.imo >= 3.9
                        ? 'bg-amber-950/80 text-amber-300 font-bold'
                        : 'bg-rose-950/80 text-rose-300 font-bold';

                    return (
                      <tr
                        key={row.player.id}
                        className="hover:bg-slate-800/70 transition-colors"
                      >
                        <td className="p-3 text-center text-slate-500 font-bold">{row.rowNumber}</td>
                        <td className="p-3 font-sans font-bold text-white text-xs">
                          <div className="flex items-center gap-2">
                            <span className="hover:text-amber-300 transition-colors cursor-pointer" onClick={() => setSelectedPlayerForFicha(row.player)}>
                              {row.playerName}
                            </span>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                              #{row.player.squadNumber}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center text-slate-300">{row.age}</td>
                        <td className="p-3 text-center text-slate-300">{row.heightCm} cm</td>
                        <td className="p-3 text-center text-slate-300 font-semibold">{row.weightKg} kg</td>
                        <td className={`p-3 text-center ${fatPctColor}`}>
                          {row.bodyFatPercent !== undefined ? `${row.bodyFatPercent}%` : '-'}
                        </td>
                        <td className={`p-3 text-center ${fatKgColor}`}>
                          {row.bodyFatKg !== undefined ? `${row.bodyFatKg} kg` : '-'}
                        </td>
                        <td className={`p-3 text-center ${muscPctColor}`}>
                          {row.muscleMassPercent !== undefined ? `${row.muscleMassPercent}%` : '-'}
                        </td>
                        <td className="p-3 text-center text-blue-200">
                          {row.muscleMassKg !== undefined ? `${row.muscleMassKg} kg` : '-'}
                        </td>
                        <td className={`p-3 text-center ${skinfoldsColor}`}>
                          {row.skinfoldSumMm !== undefined ? `${row.skinfoldSumMm} mm` : '-'}
                        </td>
                        <td className={`p-3 text-center ${imoColor}`}>
                          {row.imo !== undefined ? row.imo.toFixed(2) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              row.trafficLight === 'green'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : row.trafficLight === 'yellow'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            <span>{row.trafficLight === 'green' ? '🟢' : row.trafficLight === 'yellow' ? '🟡' : '🔴'}</span>
                            <span>{row.statusClassification}</span>
                          </span>
                        </td>
                        <td className="p-3 text-center font-sans print:hidden">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedPlayerForFicha(row.player)}
                              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-[10px] shadow transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Ver Ficha
                            </button>
                            {row.evalId && (
                              <button
                                type="button"
                                onClick={() =>
                                  setEvalToDelete({
                                    id: row.evalId!,
                                    playerName: row.playerName,
                                    date: row.evaluationDate,
                                  })
                                }
                                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                                title="Eliminar evaluación antropométrica de este jugador"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Official Report Footer mimicking PDF */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span className="font-bold text-amber-300">Nta. Cristian Fuentes Toledo</span>
                <span>•</span>
                <span>Tel: +56 9 7951 7692</span>
                <span>•</span>
                <span>@CristianFuentesToledo</span>
                <span>•</span>
                <span>@Nutrideportivocoach</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Último control registrado: <strong>2026-10-08</strong> • San Luis de Quillota
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 1: Matriz de Jugadores y Semáforo */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          {filteredPlayers.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
              <Scale className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">No se encontraron futbolistas con el filtro seleccionado</p>
              <p className="text-xs text-slate-400 mt-1">Prueba cambiando la categoría o quitando los filtros de semáforo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredPlayers.map((player) => {
                const nutrition = player.currentNutrition;
                const playerHistory = getPlayerNutritionalHistory(player.id);
                const hasEvaluations = playerHistory.length > 0;

                return (
                  <div
                    key={player.id}
                    className={`p-4 rounded-2xl border transition-all hover:border-amber-400/80 bg-slate-900/90 shadow-md ${
                      nutrition?.trafficLight === 'green'
                        ? 'border-emerald-900/40'
                        : nutrition?.trafficLight === 'yellow'
                        ? 'border-amber-900/40'
                        : nutrition?.trafficLight === 'red'
                        ? 'border-rose-900/40'
                        : 'border-slate-800'
                    }`}
                  >
                    {/* Player Info Card Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        {player.photoUrl ? (
                          <div className="relative">
                            <img
                              src={player.photoUrl}
                              alt={player.firstName}
                              className="w-12 h-12 rounded-xl object-cover border border-amber-400 shadow"
                            />
                            <span className="absolute -bottom-1 -right-1 bg-slate-950 text-amber-400 font-black text-[9px] px-1 py-0.2 rounded border border-amber-400/40 shadow">
                              #{player.squadNumber}
                            </span>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-emerald-700 flex items-center justify-center font-black text-white text-base shadow border">
                            #{player.squadNumber}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                              {player.primaryPosition}
                            </span>
                            <span className="text-[10px] text-amber-300/90 font-semibold">
                              {player.category}
                            </span>
                          </div>
                          <h3 
                            onClick={() => setSelectedPlayerForFicha(player)}
                            className="font-bold text-white text-sm tracking-tight leading-tight hover:text-amber-400 transition-colors cursor-pointer"
                          >
                            {player.firstName} {player.lastName}
                          </h3>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {player.heightCm} cm • {player.weightKg} kg
                          </span>
                        </div>
                      </div>

                      {/* Semaphore Badge */}
                      {nutrition ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 shadow-sm ${
                            nutrition.trafficLight === 'green'
                              ? 'bg-emerald-500 text-slate-950'
                              : nutrition.trafficLight === 'yellow'
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          <span>{nutrition.trafficLight === 'green' ? '🟢' : nutrition.trafficLight === 'yellow' ? '🟡' : '🔴'}</span>
                          <span>{nutrition.statusClassification}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                          Sin Evaluar
                        </span>
                      )}
                    </div>

                    {/* Nutrition Metrics Box */}
                    {nutrition ? (
                      <div className="space-y-2 mb-3">
                        <div className="grid grid-cols-4 gap-1.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-center text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">% Grasa</span>
                            <span
                              className={`text-sm font-black ${
                                nutrition.bodyFatPercent && nutrition.bodyFatPercent <= 17.0
                                  ? 'text-emerald-400'
                                  : nutrition.bodyFatPercent && nutrition.bodyFatPercent <= 19.0
                                  ? 'text-amber-300'
                                  : 'text-rose-400'
                              }`}
                            >
                              {nutrition.bodyFatPercent !== undefined ? `${nutrition.bodyFatPercent}%` : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">% Músculo</span>
                            <span className="text-sm font-black text-blue-400">
                              {nutrition.muscleMassPercent !== undefined ? `${nutrition.muscleMassPercent}%` : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">6 Pliegues</span>
                            <span className="text-sm font-black text-white">
                              {nutrition.skinfoldSumMm ? `${nutrition.skinfoldSumMm}mm` : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">IMO</span>
                            <span className="text-sm font-black text-emerald-300">
                              {nutrition.imo !== undefined ? nutrition.imo.toFixed(2) : '-'}
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-300 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 flex items-start gap-1.5">
                          <span className="text-amber-400 shrink-0 font-bold">🎯 Meta:</span>
                          <span className="truncate">{nutrition.target || 'Mantener forma competitiva'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 text-center mb-3 text-xs text-slate-400 italic">
                        Aún no se ha cargado una evaluación en PDF ni manual para este futbolista.
                      </div>
                    )}

                    {/* Card Footer: History info & buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <span className="text-[10px] text-slate-400">
                        {hasEvaluations ? (
                          <>
                            <strong className="text-white">{playerHistory.length}</strong> control{playerHistory.length > 1 ? 'es' : ''} en el año
                            <span className="block text-slate-500">Último: {nutrition?.lastEvaluationDate}</span>
                          </>
                        ) : (
                          'Pendiente de evaluación'
                        )}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedPlayerForFicha(player)}
                          title="Ver Ficha en Base de Datos"
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer text-[11px]"
                        >
                          Ficha
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPlayerForHistory(player)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-bold rounded-lg border border-emerald-800 transition-colors cursor-pointer text-[11px]"
                        >
                          <span>Historial</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: Evolución Anual por Jugador */}
      {activeSubTab === 'evolution' && (
        <div className="space-y-5">
          {/* Player Selector Bar */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Futbolista a consultar:
              </span>
              <select
                value={evolutionPlayerId}
                onChange={(e) => setEvolutionPlayerId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:border-amber-400"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.squadNumber} - {p.firstName} {p.lastName} ({p.category}) - {p.currentNutrition ? `🟢 ${p.currentNutrition.statusClassification}` : 'Sin evaluar'}
                  </option>
                ))}
              </select>
            </div>

            {evolutionPlayer && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlayerForUploadId(evolutionPlayer.id);
                    setIsPdfUploadOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Subir PDF para {evolutionPlayer.firstName}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlayerForFicha(evolutionPlayer)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
                >
                  Ver Ficha BD
                </button>
              </div>
            )}
          </div>

          {/* Timeline & Evolution Cards */}
          {evolutionPlayer && evolutionPlayerHistory.length > 0 ? (
            <div className="space-y-4">
              {/* Evolution Summary Box */}
              <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    Progreso y Variación Antropométrica en el Año
                  </h3>
                  <span className="text-xs text-amber-400 font-semibold">
                    {evolutionPlayerHistory.length} evaluaciones registradas en {selectedYear}
                  </span>
                </div>

                {/* Evolution Bars for each evaluation */}
                <div className="space-y-3 pt-2">
                  {evolutionPlayerHistory.map((ev, idx) => {
                    const isLatest = idx === 0;

                    return (
                      <div
                        key={ev.id}
                        className={`p-4 rounded-xl border text-xs transition-all ${
                          isLatest
                            ? 'bg-slate-950 border-amber-400/60 shadow-lg'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isLatest && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                                Situación Actual en Ficha
                              </span>
                            )}
                            <strong className="text-white text-sm">{ev.periodName}</strong>
                            <span className="text-slate-400">({ev.date})</span>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
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
                        </div>

                        {/* Metrics Bar Comparison */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Talla / Peso</span>
                            <span className="font-bold text-white text-sm">{ev.heightCm} cm / {ev.weightKg} kg</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">M. Adiposa</span>
                            <span
                              className={`font-black text-sm ${
                                ev.bodyFatPercent && ev.bodyFatPercent <= 17.0
                                  ? 'text-emerald-400'
                                  : ev.bodyFatPercent && ev.bodyFatPercent <= 19.0
                                  ? 'text-amber-300'
                                  : 'text-rose-400'
                              }`}
                            >
                              {ev.bodyFatPercent !== undefined ? `${ev.bodyFatPercent}%` : '-'}
                            </span>
                            {ev.bodyFatKg !== undefined && <span className="text-[10px] text-slate-400 block">({ev.bodyFatKg} kg)</span>}
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">M. Muscular</span>
                            <span className="font-black text-sm text-blue-400">
                              {ev.muscleMassPercent !== undefined ? `${ev.muscleMassPercent}%` : '-'}
                            </span>
                            {ev.muscleMassKg !== undefined && <span className="text-[10px] text-slate-400 block">({ev.muscleMassKg} kg)</span>}
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">6 Pliegues</span>
                            <span className="font-bold text-white text-sm">
                              {ev.skinfoldSumMm ? `${ev.skinfoldSumMm} mm` : '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">IMO</span>
                            <span className="font-bold text-emerald-300 text-sm">
                              {ev.imo !== undefined ? ev.imo.toFixed(2) : '-'}
                            </span>
                          </div>
                        </div>

                        {ev.statusReason && (
                          <p className="text-slate-300 text-[11px] mt-2 italic bg-slate-900/50 p-2 rounded border border-slate-800">
                            "{ev.statusReason}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <Scale className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Sin historial de evaluaciones</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Sube su informe nutricional en PDF o realiza un registro manual para empezar a graficar su evolución antropométrica.
              </p>
              {evolutionPlayer && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlayerForUploadId(evolutionPlayer.id);
                    setIsPdfUploadOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer"
                >
                  <FileUp className="w-4 h-4" />
                  <span>Subir PDF para {evolutionPlayer.firstName}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: Historial General de Informes */}
      {activeSubTab === 'recent' && (
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Informes Nutricionales Registrados ({filteredEvaluations.length})
                </h3>
                {selectedDateFilter !== 'all' && (
                  <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Filtrado por: {selectedDateFilter}
                  </span>
                )}
              </div>

              {selectedDateFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedDateFilter('all')}
                  className="text-xs text-amber-400 hover:underline self-start sm:self-auto cursor-pointer"
                >
                  Ver todas las fechas ({nutritionalEvaluations.length})
                </button>
              )}
            </div>

            {filteredEvaluations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <p>No hay evaluaciones que coincidan con los filtros aplicados {selectedDateFilter !== 'all' ? `para la fecha ${selectedDateFilter}` : ''}.</p>
                {selectedDateFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedDateFilter('all')}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
                  >
                    Mostrar todas las fechas
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {filteredEvaluations.map((ev) => {
                  const player = players.find((p) => p.id === ev.playerId);

                  return (
                    <div
                      key={ev.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-950/60 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                            ev.trafficLight === 'green'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : ev.trafficLight === 'yellow'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {ev.trafficLight === 'green' ? '🟢' : ev.trafficLight === 'yellow' ? '🟡' : '🔴'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong 
                              onClick={() => player && setSelectedPlayerForFicha(player)}
                              className="text-white text-sm hover:text-amber-400 cursor-pointer"
                            >
                              {player ? `${player.firstName} ${player.lastName}` : ev.playerName || 'Futbolista'}
                            </strong>
                            <span className="text-[10px] text-amber-300 font-bold bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/30">
                              {ev.category}
                            </span>
                            <span className="text-slate-400 font-mono">#{ev.playerSquadNumber || player?.squadNumber || '-'}</span>
                          </div>
                          <span className="text-slate-400 text-[11px] block mt-0.5">
                            {ev.periodName} • Fecha: <strong className="text-white">{ev.date}</strong> • {ev.weightKg} kg • IMC: {ev.bmi} • IMO: {ev.imo !== undefined ? ev.imo.toFixed(2) : '-'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="text-right">
                          <span
                            className={`font-black text-sm block ${
                              ev.bodyFatPercent && ev.bodyFatPercent <= 17.0
                                ? 'text-emerald-400'
                                : ev.bodyFatPercent && ev.bodyFatPercent <= 19.0
                                ? 'text-amber-300'
                                : 'text-rose-400'
                            }`}
                          >
                            {ev.bodyFatPercent !== undefined ? `${ev.bodyFatPercent}% Grasa` : 'Grasa evaluada'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {ev.statusClassification}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {player && (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedPlayerForFicha(player)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer text-xs"
                              >
                                Ficha BD
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedPlayerForHistory(player)}
                                className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-bold rounded-lg border border-emerald-800 transition-colors cursor-pointer text-xs"
                              >
                                Historial
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              setEvalToDelete({
                                id: ev.id,
                                playerName: player ? `${player.firstName} ${player.lastName}` : ev.playerName || 'Futbolista',
                                date: ev.date,
                              })
                            }
                            className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-300 font-bold rounded-lg border border-rose-800/60 transition-colors cursor-pointer text-xs flex items-center gap-1"
                            title="Eliminar esta evaluación del sistema"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Eliminar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Dialogs */}
      {isPdfUploadOpen && (
        <NutritionPdfUploadModal
          initialPlayerId={selectedPlayerForUploadId}
          onClose={() => {
            setIsPdfUploadOpen(false);
            setSelectedPlayerForUploadId(undefined);
          }}
          onSuccess={() => {
            setIsPdfUploadOpen(false);
            setSelectedPlayerForUploadId(undefined);
          }}
        />
      )}

      {isManualModalOpen && (
        <NutritionManualModal
          initialPlayerId={selectedPlayerForUploadId}
          defaultCategory={activeCategory}
          onClose={() => {
            setIsManualModalOpen(false);
            setSelectedPlayerForUploadId(undefined);
          }}
          onSuccess={() => {
            setIsManualModalOpen(false);
            setSelectedPlayerForUploadId(undefined);
          }}
        />
      )}

      {selectedPlayerForHistory && (
        <NutritionHistoryModal
          player={selectedPlayerForHistory}
          onClose={() => setSelectedPlayerForHistory(null)}
          onOpenNewEvaluation={() => {
            setSelectedPlayerForUploadId(selectedPlayerForHistory.id);
            setIsManualModalOpen(true);
          }}
          onOpenUploadPdf={() => {
            setSelectedPlayerForUploadId(selectedPlayerForHistory.id);
            setIsPdfUploadOpen(true);
          }}
        />
      )}

      {/* Player Database Ficha Modal */}
      {selectedPlayerForFicha && (
        <PlayerModal
          player={selectedPlayerForFicha}
          onClose={() => setSelectedPlayerForFicha(null)}
          onEdit={(player) => {
            setSelectedPlayerForFicha(null);
            setEditingPlayer(player);
          }}
        />
      )}

      {editingPlayer && (
        <PlayerFormModal
          playerToEdit={editingPlayer}
          onClose={() => setEditingPlayer(null)}
        />
      )}

      {/* Modal de confirmación para eliminar evaluación */}
      {evalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">¿Eliminar Evaluación Antropométrica?</h3>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="text-slate-300">
                <strong className="text-white">Futbolista:</strong> {evalToDelete.playerName}
              </div>
              <div className="text-slate-300">
                <strong className="text-white">Fecha de evaluación:</strong> {evalToDelete.date}
              </div>
              <p className="text-[11px] text-amber-400/90 pt-1">
                La ficha del jugador en la base de datos se recalculará automáticamente con su evaluación anterior o quedará disponible para nuevo control.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEvalToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteNutritionalEvaluation(evalToDelete.id);
                  setEvalToDelete(null);
                }}
                className="px-4 py-1.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-lg shadow-rose-950 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar Evaluación</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


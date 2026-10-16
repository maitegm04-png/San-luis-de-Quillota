import React, { useState } from 'react';
import { useFootball } from '../../context/FootballContext';
import { useAuth } from '../../context/AuthContext';
import { getAllowedCategories } from '../../types/auth';
import { LineupPlayer, Player, TacticalFormation, matchesCategoryFilter } from '../../types/football';
import { FORMATIONS_SLOTS } from '../../data/mockData';
import { PitchView } from '../PitchView';
import { Trophy, Shield, Printer, RotateCcw, Award, CheckCircle2, X } from 'lucide-react';

export const TacticalBoard: React.FC = () => {
  const { players, clubInfo, activeCategory, setActiveCategory, getCategoryStaff } = useFootball();
  const { currentUser } = useAuth();

  const isCoordinator = currentUser?.role === 'Coordinador General' || currentUser?.category === 'Todas';
  const allowedCategories = getAllowedCategories(currentUser?.category);

  const [formation, setFormation] = useState<TacticalFormation>('4-3-3');
  const [boardTitle, setBoardTitle] = useState('Plan Táctico Principal');
  const [tacticalObjective, setTacticalObjective] = useState(
    'Bloque medio-alto. Salida limpia con el pivote defensivo incrustado entre centrales y amplitud máxima con laterales proyectados.'
  );
  const [offensiveNotes, setOffensiveNotes] = useState(
    'Generar superioridad 3v2 por bandas. Llegada al área del interior opuesto y buscar el remate al primer palo.'
  );
  const [defensiveNotes, setDefensiveNotes] = useState(
    'Presión tras pérdida intensa durante los primeros 5 segundos. Si superan la primera línea, repliegue ordenado en 4-4-2.'
  );
  const [setPiecesNotes, setSetPiecesNotes] = useState(
    'Córners a favor: 2 al primer palo, 3 en zona de remate, 1 al rechace. Córners en contra: marcaje zonal mixto (5 zonales + 3 individuales).'
  );

  // Filter players scoped by role and active category
  const categoryPlayers = players.filter((p) => {
    if (!isCoordinator && !allowedCategories.includes(p.category as any)) return false;
    return matchesCategoryFilter(p.category, activeCategory);
  });

  const activeStaff = getCategoryStaff(activeCategory);

  // Lineup state for tactical sandbox
  const [lineup, setLineup] = useState<LineupPlayer[]>(() => {
    const defaultSlots = FORMATIONS_SLOTS['4-3-3'];
    const initialPool = players.filter((p) => {
      if (!isCoordinator && !allowedCategories.includes(p.category as any)) return false;
      return matchesCategoryFilter(p.category, activeCategory);
    });
    const available = initialPool.filter((p) => p.status === 'Disponible');
    return defaultSlots.map((s, i) => ({
      slotId: s.id,
      playerId: available[i]?.id || '',
      roleName: s.roleName,
    })).filter((s) => s.playerId !== '');
  });

  const [captainId, setCaptainId] = useState<string>(lineup[2]?.playerId || categoryPlayers[0]?.id || '');
  const [activeSlotForAssign, setActiveSlotForAssign] = useState<string | null>(null);

  // When active category changes, update the lineup with players from this category
  React.useEffect(() => {
    const pool = players.filter((p) => {
      if (!isCoordinator && !allowedCategories.includes(p.category as any)) return false;
      return matchesCategoryFilter(p.category, activeCategory);
    });
    const available = pool.filter((p) => p.status === 'Disponible');
    const defaultSlots = FORMATIONS_SLOTS[formation];

    const newLineup = defaultSlots.map((s, i) => ({
      slotId: s.id,
      playerId: available[i]?.id || '',
      roleName: s.roleName,
    })).filter((s) => s.playerId !== '');

    setLineup(newLineup);
    setCaptainId(newLineup[0]?.playerId || available[0]?.id || '');
  }, [activeCategory, formation]);

  const handleFormationChange = (newFormation: TacticalFormation) => {
    setFormation(newFormation);
    const newSlots = FORMATIONS_SLOTS[newFormation];
    const currentPIds = lineup.map((l) => l.playerId);

    const updated = newSlots.map((slot, idx) => ({
      slotId: slot.id,
      playerId: currentPIds[idx] || '',
      roleName: slot.roleName,
    })).filter((s) => s.playerId !== '');

    setLineup(updated);
  };

  const handleAssignPlayer = (playerId: string) => {
    if (!activeSlotForAssign) return;

    const slots = FORMATIONS_SLOTS[formation];
    const slotDef = slots.find((s) => s.id === activeSlotForAssign);
    const roleName = slotDef ? slotDef.roleName : 'MC';

    setLineup((prev) => {
      const filtered = prev.filter((s) => s.playerId !== playerId && s.slotId !== activeSlotForAssign);
      return [...filtered, { slotId: activeSlotForAssign, playerId, roleName }];
    });

    setActiveSlotForAssign(null);
  };

  const handleRemoveFromSlot = (playerId: string) => {
    setLineup((prev) => prev.filter((s) => s.playerId !== playerId));
  };

  const handlePrintBoard = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Board Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-md bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                SLQ
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                Pizarra Táctica Canarios
              </span>
              <span className="text-xs text-slate-400">{clubInfo.name}</span>
            </div>
            <input
              type="text"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              className="text-xl font-extrabold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-amber-400 focus:outline-none w-full max-w-md tracking-tight"
            />
            <p className="text-xs text-slate-400 mt-1">
              Laboratorio táctico para probar formaciones, diseñar jugadas ensayadas y preparar la charla técnica.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintBoard}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Pizarra</span>
            </button>

            {/* Formation switcher */}
            <select
              value={formation}
              onChange={(e) => handleFormationChange(e.target.value as TacticalFormation)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl px-4 py-2 text-xs transition-colors cursor-pointer shadow-lg shadow-amber-950/40"
            >
              <option value="4-3-3">Esquema 4-3-3</option>
              <option value="4-4-2">Esquema 4-4-2</option>
              <option value="4-2-3-1">Esquema 4-2-3-1</option>
              <option value="3-5-2">Esquema 3-5-2</option>
              <option value="3-4-3">Esquema 3-4-3</option>
              <option value="5-3-2">Esquema 5-3-2</option>
              <option value="4-1-4-1">Esquema 4-1-4-1</option>
            </select>
          </div>
        </div>

        {/* Category Selector for Tactical Board */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-amber-400 font-bold text-xs mr-1">Filtrar Pizarra por Categoría:</span>
            {['Sub 11', 'Sub 12', 'Sub 13', 'Sub 14', 'Sub 15', 'Sub 16', 'Sub 18', 'Sub 20', 'all'].map((cat) => {
              const isCurrent = activeCategory === cat;
              const count = cat === 'all' ? players.length : players.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-950/40 ring-1 ring-amber-300'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{cat === 'all' ? 'Ver Todas' : cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isCurrent ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="text-slate-500">Plantilla:</span>
            <span className="font-extrabold text-amber-300">
              {categoryPlayers.length} jugadores en {activeCategory !== 'all' ? activeCategory : 'total'}
            </span>
            <span className="text-slate-600">•</span>
            <span>DT: <strong className="text-slate-200">{activeStaff.coach}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Tactical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pitch with Tactical Layout (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Disposición Táctica - {activeCategory !== 'all' ? activeCategory : 'Plantilla General'}</span>
            </h3>
            <span className="text-xs text-slate-400">
              {lineup.length} / 11 Jugadores
            </span>
          </div>

          {categoryPlayers.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400 space-y-2">
              <Shield className="w-8 h-8 text-amber-400/60 mx-auto" />
              <p className="font-bold text-white text-sm">
                No hay jugadores inscritos en {activeCategory}
              </p>
              <p className="text-slate-400">
                Selecciona otra categoría con jugadores o inscribe canteranos en la base de datos para trabajar en la pizarra.
              </p>
            </div>
          ) : (
            <PitchView
              formation={formation}
              startingEleven={lineup}
              players={categoryPlayers.length > 0 ? categoryPlayers : players}
              captainId={captainId}
              onSlotClick={(slotId) => setActiveSlotForAssign(slotId)}
              onRemovePlayer={handleRemoveFromSlot}
              isEditable={true}
            />
          )}

          <p className="text-[11px] text-slate-500 text-center mt-3 italic">
            * Pulsa sobre cualquier posición vacía para colocar a un jugador de la plantilla {activeCategory !== 'all' ? activeCategory : ''}.
          </p>
        </div>

        {/* Right: Tactical Notebook & Analysis (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Captain selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Liderazgo en el Campo ({activeCategory !== 'all' ? activeCategory : 'General'})
            </h4>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-300 font-semibold">Capitán Designado:</span>
              <select
                value={captainId}
                onChange={(e) => setCaptainId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white font-bold rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                {(categoryPlayers.length > 0 ? categoryPlayers : players).map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.squadNumber} {p.nickname || `${p.firstName} ${p.lastName}`} ({p.primaryPosition})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tactical Philosophy & Guidelines */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              Plan de Partido y Cuaderno Táctico
            </h4>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Objetivo Táctico General:
              </label>
              <textarea
                rows={2}
                value={tacticalObjective}
                onChange={(e) => setTacticalObjective(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Fase Ofensiva (Con Balón):
              </label>
              <textarea
                rows={2}
                value={offensiveNotes}
                onChange={(e) => setOffensiveNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Fase Defensiva (Sin Balón / Presión):
              </label>
              <textarea
                rows={2}
                value={defensiveNotes}
                onChange={(e) => setDefensiveNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Acciones a Balón Parado (ABP):
              </label>
              <textarea
                rows={2}
                value={setPiecesNotes}
                onChange={(e) => setSetPiecesNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Player Assign Drawer / Modal */}
      {activeSlotForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div>
                <h3 className="font-bold text-white text-sm">Selecciona Jugador para la Pizarra</h3>
                <p className="text-[10px] text-amber-400">
                  {activeCategory !== 'all' ? `Mostrando jugadores de ${activeCategory}` : 'Mostrando todos los jugadores'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSlotForAssign(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {(categoryPlayers.length > 0 ? categoryPlayers : players).map((p) => {
                const isSelected = lineup.some((l) => l.playerId === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAssignPlayer(p.id)}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[10px]">
                        #{p.squadNumber}
                      </span>
                      <span className="font-bold text-white">{p.nickname || `${p.firstName} ${p.lastName}`}</span>
                      <span className="text-[10px] text-slate-400 uppercase">({p.primaryPosition})</span>
                    </div>

                    {isSelected ? (
                      <span className="text-[10px] text-amber-400 font-semibold">En el campo</span>
                    ) : (
                      <span className="text-emerald-400 font-bold text-xs">+ Colocar</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

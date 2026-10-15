import React, { useState } from 'react';
import { useFootball } from '../../context/FootballContext';
import { LineupPlayer, Player, TacticalFormation } from '../../types/football';
import { FORMATIONS_SLOTS } from '../../data/mockData';
import { PitchView } from '../PitchView';
import { Trophy, Shield, Printer, RotateCcw, Award, CheckCircle2, X } from 'lucide-react';

export const TacticalBoard: React.FC = () => {
  const { players, clubInfo } = useFootball();

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

  // Lineup state for tactical sandbox
  const [lineup, setLineup] = useState<LineupPlayer[]>(() => {
    const defaultSlots = FORMATIONS_SLOTS['4-3-3'];
    const available = players.filter((p) => p.status === 'Disponible');
    return defaultSlots.map((s, i) => ({
      slotId: s.id,
      playerId: available[i]?.id || '',
      roleName: s.roleName,
    })).filter((s) => s.playerId !== '');
  });

  const [captainId, setCaptainId] = useState<string>(lineup[2]?.playerId || players[0]?.id || '');
  const [activeSlotForAssign, setActiveSlotForAssign] = useState<string | null>(null);

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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
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
      </div>

      {/* Main Tactical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pitch with Tactical Layout (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Disposición Táctica en el Terreno
            </h3>
            <span className="text-xs text-slate-400">
              {lineup.length} / 11 Jugadores
            </span>
          </div>

          <PitchView
            formation={formation}
            startingEleven={lineup}
            players={players}
            captainId={captainId}
            onSlotClick={(slotId) => setActiveSlotForAssign(slotId)}
            onRemovePlayer={handleRemoveFromSlot}
            isEditable={true}
          />

          <p className="text-[11px] text-slate-500 text-center mt-3 italic">
            * Pulsa sobre cualquier posición vacía para colocar a un jugador de la plantilla.
          </p>
        </div>

        {/* Right: Tactical Notebook & Analysis (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Captain selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Liderazgo en el Campo
            </h4>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-300 font-semibold">Capitán Designado:</span>
              <select
                value={captainId}
                onChange={(e) => setCaptainId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white font-bold rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
              >
                {players.map((p) => (
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
              <h3 className="font-bold text-white text-sm">Selecciona Jugador para la Pizarra</h3>
              <button
                type="button"
                onClick={() => setActiveSlotForAssign(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {players.map((p) => {
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

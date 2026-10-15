import React from 'react';
import { LineupPlayer, Player, TacticalFormation } from '../types/football';
import { FORMATIONS_SLOTS, POSITION_LABELS } from '../data/mockData';
import { UserPlus, X, Shield, Award } from 'lucide-react';

interface PitchViewProps {
  formation: TacticalFormation;
  startingEleven: LineupPlayer[];
  players: Player[];
  captainId?: string;
  viceCaptainId?: string;
  penaltyTakerId?: string;
  freeKickTakerId?: string;
  cornerTakerId?: string;
  onSlotClick?: (slotId: string) => void;
  onRemovePlayer?: (playerId: string) => void;
  onPlayerClick?: (player: Player) => void;
  isEditable?: boolean;
}

export const PitchView: React.FC<PitchViewProps> = ({
  formation,
  startingEleven,
  players,
  captainId,
  viceCaptainId,
  penaltyTakerId,
  freeKickTakerId,
  cornerTakerId,
  onSlotClick,
  onRemovePlayer,
  onPlayerClick,
  isEditable = true,
}) => {
  const slots = FORMATIONS_SLOTS[formation] || FORMATIONS_SLOTS['4-3-3'];

  const getPlayerForSlot = (slotId: string): Player | undefined => {
    const assigned = startingEleven.find((s) => s.slotId === slotId);
    if (!assigned || !assigned.playerId) return undefined;
    return players.find((p) => p.id === assigned.playerId);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto select-none">
      {/* Pitch Outer Frame */}
      <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-emerald-950/80 bg-emerald-800">
        {/* Pitch Turf Stripes */}
        <div className="absolute inset-0 flex flex-col pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 ${i % 2 === 0 ? 'bg-emerald-700/90' : 'bg-emerald-600/90'}`}
            />
          ))}
        </div>

        {/* Realistic SVG Pitch Markings */}
        <svg
          viewBox="0 0 100 130"
          className="absolute inset-0 w-full h-full pointer-events-none stroke-white/70"
          fill="none"
          strokeWidth="0.8"
        >
          {/* Outer Boundary */}
          <rect x="4" y="4" width="92" height="122" rx="1" />

          {/* Halfway line */}
          <line x1="4" y1="65" x2="96" y2="65" />

          {/* Center Circle & Center Spot */}
          <circle cx="50" cy="65" r="12" />
          <circle cx="50" cy="65" r="0.8" fill="white" />

          {/* Top Penalty Area (Opponent Box) */}
          <rect x="22" y="4" width="56" height="20" />
          {/* Top Goal Area */}
          <rect x="34" y="4" width="32" height="7" />
          {/* Top Penalty Spot */}
          <circle cx="50" cy="16" r="0.8" fill="white" />
          {/* Top Penalty Arc */}
          <path d="M 38 24 A 10 10 0 0 0 62 24" />
          {/* Top Goal */}
          <rect x="40" y="1" width="20" height="3" strokeWidth="0.5" stroke="rgba(255,255,255,0.4)" />

          {/* Bottom Penalty Area (Our Box) */}
          <rect x="22" y="106" width="56" height="20" />
          {/* Bottom Goal Area */}
          <rect x="34" y="119" width="32" height="7" />
          {/* Bottom Penalty Spot */}
          <circle cx="50" cy="114" r="0.8" fill="white" />
          {/* Bottom Penalty Arc */}
          <path d="M 38 106 A 10 10 0 0 1 62 106" />
          {/* Bottom Goal */}
          <rect x="40" y="126" width="20" height="3" strokeWidth="0.5" stroke="rgba(255,255,255,0.4)" />

          {/* Corner Arcs */}
          <path d="M 4 8 A 4 4 0 0 0 8 4" />
          <path d="M 92 4 A 4 4 0 0 0 96 8" />
          <path d="M 4 122 A 4 4 0 0 1 8 126" />
          <path d="M 92 126 A 4 4 0 0 1 96 122" />
        </svg>

        {/* Pitch Direction Indicators */}
        <div className="absolute top-2 left-6 text-[10px] tracking-widest font-bold uppercase text-white/40 pointer-events-none flex items-center gap-1">
          <span>Ataque rival</span>
          <span>▲</span>
        </div>
        <div className="absolute bottom-2 left-6 text-[10px] tracking-widest font-bold uppercase text-white/40 pointer-events-none flex items-center gap-1">
          <Shield className="w-3 h-3 text-white/40" />
          <span>Nuestra portería</span>
        </div>

        {/* Formation Slots and Player Tokens */}
        {slots.map((slot) => {
          const player = getPlayerForSlot(slot.id);
          const isCaptain = player && player.id === captainId;
          const isViceCaptain = player && player.id === viceCaptainId;
          const isPenaltyTaker = player && player.id === penaltyTakerId;
          const isFreeKickTaker = player && player.id === freeKickTakerId;
          const isCornerTaker = player && player.id === cornerTakerId;
          const posConfig = POSITION_LABELS[slot.roleName] || POSITION_LABELS['MC'];

          return (
            <div
              key={slot.id}
              style={{
                left: `${slot.defaultX}%`,
                top: `${slot.defaultY}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer transition-transform hover:scale-110 active:scale-95 z-10"
              onClick={() => {
                if (player && onPlayerClick) {
                  onPlayerClick(player);
                } else if (onSlotClick) {
                  onSlotClick(slot.id);
                }
              }}
            >
              {player ? (
                // Occupied Player Node
                <div className="relative flex flex-col items-center">
                  {/* Remove button (if editable) */}
                  {isEditable && onRemovePlayer && (
                    <button
                      type="button"
                      title="Quitar de la alineación"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemovePlayer(player.id);
                      }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-lg border border-white/60 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  {/* Badges on jersey (Captain, Set Pieces) */}
                  <div className="absolute -top-2 -left-2 flex flex-col gap-0.5 z-20">
                    {isCaptain && (
                      <span className="w-5 h-5 bg-amber-400 text-black text-[10px] font-black rounded-full flex items-center justify-center shadow border border-amber-200" title="Capitán">
                        C
                      </span>
                    )}
                    {isViceCaptain && !isCaptain && (
                      <span className="w-5 h-5 bg-amber-200 text-amber-900 text-[9px] font-black rounded-full flex items-center justify-center shadow border border-amber-300" title="Subcapitán">
                        2C
                      </span>
                    )}
                  </div>

                  {/* Player Jersey Circle */}
                  <div
                    className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full flex items-center justify-center font-bold text-white shadow-xl border-2 transition-all relative ${
                      player.primaryPosition === 'POR'
                        ? 'bg-amber-500 border-amber-200 text-slate-950'
                        : 'bg-emerald-600 border-white text-white'
                    }`}
                    style={
                      player.avatarColor && player.primaryPosition !== 'POR'
                        ? { backgroundColor: player.avatarColor }
                        : undefined
                    }
                  >
                    <span className="text-sm sm:text-base font-black tracking-tight drop-shadow">
                      {player.squadNumber}
                    </span>

                    {/* Set-piece indicator icon */}
                    {(isPenaltyTaker || isFreeKickTaker || isCornerTaker) && (
                      <div className="absolute -bottom-1 -right-1 bg-slate-900 text-emerald-400 text-[8px] font-bold px-1 py-0.5 rounded border border-emerald-500/50 shadow">
                        {isPenaltyTaker ? 'PEN' : isFreeKickTaker ? 'FK' : 'CRN'}
                      </div>
                    )}
                  </div>

                  {/* Player Name Tag */}
                  <div className="mt-1 flex flex-col items-center max-w-[85px] sm:max-w-[100px]">
                    <span className="bg-slate-950/85 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md shadow-md backdrop-blur-sm border border-white/20 truncate text-center w-full">
                      {player.nickname || player.lastName}
                    </span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded mt-0.5 uppercase tracking-wider ${posOptionColor(slot.roleName)}`}>
                      {slot.roleName}
                    </span>
                  </div>
                </div>
              ) : (
                // Empty Position Slot
                <div
                  className="flex flex-col items-center"
                  onClick={() => onSlotClick && onSlotClick(slot.id)}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-white/60 bg-emerald-900/40 backdrop-blur-xs flex items-center justify-center text-white/80 group-hover:border-white group-hover:bg-emerald-800/80 shadow-md transition-all">
                    <UserPlus className="w-4 h-4 opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="mt-1 flex flex-col items-center">
                    <span className="bg-slate-950/60 text-white/90 text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10 uppercase">
                      {slot.roleName}
                    </span>
                    {isEditable && (
                      <span className="text-[8px] text-emerald-200/90 font-medium">
                        + Asignar
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Formation & Roles Bar Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-300 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Esquema:</span>
          <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
            {formation}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Titulares:</span>
          <span className={`font-bold ${startingEleven.length === 11 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {startingEleven.length} / 11
          </span>
        </div>

        <div className="flex items-center gap-3">
          {captainId && (
            <div className="flex items-center gap-1 text-[11px]" title="Capitán">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300 font-medium">
                {players.find((p) => p.id === captainId)?.nickname || players.find((p) => p.id === captainId)?.lastName || 'Sin asignar'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function posOptionColor(role: string): string {
  if (role === 'POR') return 'bg-amber-500 text-amber-950';
  if (['LD', 'DFC', 'LI'].includes(role)) return 'bg-blue-600 text-white';
  if (['MCD', 'MC', 'MCO'].includes(role)) return 'bg-purple-600 text-white';
  return 'bg-rose-600 text-white';
}

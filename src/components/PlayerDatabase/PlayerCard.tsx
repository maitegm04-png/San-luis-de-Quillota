import React from 'react';
import { Player } from '../../types/football';
import { POSITION_LABELS } from '../../data/mockData';
import { Activity, Star, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, onClick, onEdit }) => {
  const posConfig = POSITION_LABELS[player.primaryPosition] || POSITION_LABELS['MC'];

  const getStatusBadge = () => {
    switch (player.status) {
      case 'Disponible':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Disponible
          </span>
        );
      case 'Lesionado':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800">
            <AlertCircle className="w-2.5 h-2.5" />
            Lesionado
          </span>
        );
      case 'Sancionado':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800">
            <Clock className="w-2.5 h-2.5" />
            Sancionado
          </span>
        );
      case 'Duda':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-yellow-400 bg-yellow-950/80 px-2 py-0.5 rounded-full border border-yellow-800">
            <Activity className="w-2.5 h-2.5" />
            Duda
          </span>
        );
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-950/30 cursor-pointer flex flex-col justify-between group relative"
    >
      {/* Card Header: Dorsal & Badges */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            {/* Squad Jersey Circle */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow-md border ${
                player.primaryPosition === 'POR'
                  ? 'bg-amber-500 text-slate-950 border-amber-300'
                  : 'text-white border-white/20'
              }`}
              style={
                player.avatarColor && player.primaryPosition !== 'POR'
                  ? { backgroundColor: player.avatarColor }
                  : player.primaryPosition !== 'POR'
                  ? { backgroundColor: '#10b981' }
                  : undefined
              }
            >
              #{player.squadNumber}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border ${posConfig.color}`}>
                  {posConfig.label}
                </span>
                {player.secondaryPosition && (
                  <span className="text-[9px] font-medium text-slate-400 px-1 py-0.5 rounded bg-slate-800 border border-slate-700">
                    {player.secondaryPosition}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-white text-base tracking-tight leading-tight mt-0.5 group-hover:text-emerald-400 transition-colors">
                {player.nickname || `${player.firstName} ${player.lastName}`}
              </h3>
              {player.nickname && (
                <p className="text-xs text-slate-400">
                  {player.firstName} {player.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {getStatusBadge()}
            <span className="text-[10px] text-slate-400">
              {player.category}
            </span>
          </div>
        </div>

        {/* Player Mini Bio Details */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-950/50 rounded-lg p-2.5 border border-slate-800/80 mb-3">
          <div>
            <span className="text-slate-500 text-[10px] block">Pie Dominante</span>
            <span className="font-semibold">{player.dominantFoot}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">Estatura / Peso</span>
            <span className="font-semibold">{player.heightCm} cm / {player.weightKg} kg</span>
          </div>
        </div>
      </div>

      {/* Season Stats Summary */}
      <div>
        <div className="grid grid-cols-4 gap-1 text-center py-2 border-t border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">PJ</span>
            <span className="font-bold text-white">{player.stats.matchesPlayed}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Min</span>
            <span className="font-bold text-white">{player.stats.minutesPlayed}'</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Goles</span>
            <span className="font-bold text-emerald-400">{player.stats.goals}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Nota</span>
            <span className="font-bold text-amber-400 inline-flex items-center justify-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-amber-400" />
              {player.stats.avgRating || '-'}
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
          <span className="text-emerald-400 group-hover:underline text-[11px] font-medium">
            Ver ficha completa →
          </span>
          <button
            type="button"
            onClick={onEdit}
            className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
};

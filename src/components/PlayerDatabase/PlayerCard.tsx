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
            {/* Player Photo or Squad Jersey Circle */}
            <div className="relative shrink-0">
              {player.photoUrl ? (
                <div className="relative">
                  <img
                    src={player.photoUrl}
                    alt={`${player.firstName} ${player.lastName}`}
                    className="w-11 h-11 rounded-xl object-cover border border-amber-400/50 shadow-md"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-slate-950 text-amber-400 font-black text-[9px] px-1 py-0.2 rounded border border-amber-400/40 shadow">
                    #{player.squadNumber}
                  </span>
                </div>
              ) : (
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shadow-md border ${
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
              )}
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

        {/* Injury Warning Banner on Card */}
        {player.status === 'Lesionado' && player.statusReason && (
          <div className="text-[10px] text-rose-300 font-medium bg-rose-950/40 border border-rose-900/60 rounded-lg px-2 py-1 mb-2.5 flex items-center gap-1.5 truncate">
            <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="truncate">{player.statusReason}</span>
          </div>
        )}

        {/* Player Mini Bio Details */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-950/50 rounded-lg p-2.5 border border-slate-800/80 mb-2.5">
          <div>
            <span className="text-slate-500 text-[10px] block">Pie Dominante</span>
            <span className="font-semibold">{player.dominantFoot}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">Estatura / Peso</span>
            <span className="font-semibold">{player.heightCm} cm / {player.weightKg} kg</span>
          </div>
        </div>

        {/* Nutritional Status Badge */}
        {player.currentNutrition ? (
          <div
            className={`text-[10px] font-bold px-2 py-1 rounded-lg mb-2.5 flex items-center justify-between border ${
              player.currentNutrition.trafficLight === 'green'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : player.currentNutrition.trafficLight === 'yellow'
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <span className="flex items-center gap-1 truncate">
              <span>{player.currentNutrition.trafficLight === 'green' ? '🟢' : player.currentNutrition.trafficLight === 'yellow' ? '🟡' : '🔴'}</span>
              <span className="truncate">Nutrición: {player.currentNutrition.statusClassification}</span>
            </span>
            <span className="font-mono shrink-0 ml-1">
              {player.currentNutrition.bodyFatPercent !== undefined ? `${player.currentNutrition.bodyFatPercent}% Grasa` : `${player.currentNutrition.weightKg} kg`}
            </span>
          </div>
        ) : null}
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

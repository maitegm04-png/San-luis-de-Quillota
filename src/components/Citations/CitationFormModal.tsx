import React, { useState } from 'react';
import { CLUB_CATEGORIES, MatchCitation, CitationPlayerEntry, Position, MatchCompetition, matchesCategoryFilter } from '../../types/football';
import { useFootball } from '../../context/FootballContext';
import { useAuth } from '../../context/AuthContext';
import { getAllowedCategories } from '../../types/auth';
import { POSITION_LABELS } from '../../data/mockData';
import { RIVAL_PRESETS, findRivalPresetByOpponentName } from '../../data/rivalLogos';
import { SanLuisLogo } from '../Common/SanLuisLogo';
import { 
  X, 
  Plus, 
  Trash2, 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Shield, 
  AlertTriangle, 
  Sparkles,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Shirt,
  Hash,
  RotateCcw,
  Info
} from 'lucide-react';

interface CitationFormModalProps {
  citationToEdit?: MatchCitation | null;
  onClose: () => void;
  onSaved?: (citation: MatchCitation) => void;
}

export const CitationFormModal: React.FC<CitationFormModalProps> = ({
  citationToEdit,
  onClose,
  onSaved,
}) => {
  const { 
    addCitation, 
    updateCitation, 
    players, 
    clubInfo, 
    activeCategory, 
    getCategoryStaff,
    isPlayerInjured
  } = useFootball();
  const { currentUser } = useAuth();

  const isCoordinator = currentUser?.role === 'Coordinador General' || currentUser?.category === 'Todas';
  const allowedCategories = getAllowedCategories(currentUser?.category);
  const availableCategories = isCoordinator ? CLUB_CATEGORIES : allowedCategories;

  const defaultCategory = citationToEdit?.category || (
    availableCategories.includes(activeCategory as any) ? activeCategory : availableCategories[0]
  );
  const initialStaff = citationToEdit?.coachStaff || getCategoryStaff(defaultCategory);

  const [category, setCategory] = useState<string>(defaultCategory);
  const [opponent, setOpponent] = useState<string>(citationToEdit?.opponent || '');
  const [opponentLogoUrl, setOpponentLogoUrl] = useState<string>(
    citationToEdit?.opponentLogoUrl || (citationToEdit?.opponent ? findRivalPresetByOpponentName(citationToEdit.opponent)?.logoUrl || '' : '')
  );
  const [competition, setCompetition] = useState<MatchCompetition>(citationToEdit?.competition || 'Liga');
  const [matchDay, setMatchDay] = useState<string>(citationToEdit?.matchDay || 'Fecha 6');
  const [date, setDate] = useState<string>(citationToEdit?.date || new Date().toISOString().slice(0, 10));
  const [dateFormatted, setDateFormatted] = useState<string>(citationToEdit?.dateFormatted || 'SÁBADO 17 DE OCTUBRE');
  const [matchTime, setMatchTime] = useState<string>(citationToEdit?.matchTime || '11:00');
  const [meetingTime, setMeetingTime] = useState<string>(citationToEdit?.meetingTime || '07:30');
  const [venue, setVenue] = useState<string>(citationToEdit?.venue || 'COMPLEJO DEPORTIVO SAN LUIS');
  const [pitch, setPitch] = useState<string>(citationToEdit?.pitch || 'Cancha N°1 Principal');
  const [isHome, setIsHome] = useState<boolean>(citationToEdit?.isHome ?? true);

  // Selected convocated players list
  const [selectedPlayers, setSelectedPlayers] = useState<CitationPlayerEntry[]>(() => {
    if (citationToEdit?.players) {
      return citationToEdit.players;
    }
    return [];
  });

  // Filter available players strictly for this category
  const categoryPlayers = players.filter((p) => matchesCategoryFilter(p.category, category));

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    // Remove any players from the previous category so no cross-category leaks occur
    setSelectedPlayers((prev) =>
      prev.filter((p) => {
        const pl = players.find((x) => x.id === p.playerId);
        return pl ? matchesCategoryFilter(pl.category, newCat) : matchesCategoryFilter(p.category || '', newCat);
      })
    );
  };

  const handleOpponentChange = (val: string) => {
    setOpponent(val);
    const preset = findRivalPresetByOpponentName(val);
    if (preset && !opponentLogoUrl) {
      setOpponentLogoUrl(preset.logoUrl);
    }
  };

  const handleSelectPresetRival = (preset: typeof RIVAL_PRESETS[0]) => {
    setOpponent(preset.name);
    setOpponentLogoUrl(preset.logoUrl);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen es demasiado pesada. Selecciona una menor a 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setOpponentLogoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle or add player to citation
  const handleTogglePlayer = (player: typeof players[0]) => {
    // BLOCK IF INJURED
    if (player.status === 'Lesionado' || isPlayerInjured(player.id)) {
      alert(`⚠️ Jugador No Convocable:\n${player.firstName} ${player.lastName} se encuentra con baja médica activa por lesión (${player.statusReason || 'Parte Médico'}).`);
      return;
    }

    const isAlreadySelected = selectedPlayers.some((p) => p.playerId === player.id);
    if (isAlreadySelected) {
      setSelectedPlayers((prev) => prev.filter((p) => p.playerId !== player.id));
    } else {
      const newEntry: CitationPlayerEntry = {
        playerId: player.id,
        squadNumber: player.squadNumber,
        name: `${player.firstName} ${player.lastName}`,
        displayName: (player.lastName || player.firstName).toUpperCase(),
        photoUrl: player.photoUrl,
        primaryPosition: player.primaryPosition,
        category: player.category,
        avatarColor: player.avatarColor,
      };
      setSelectedPlayers((prev) => [...prev, newEntry]);
    }
  };

  // Auto-convocate eligible 18 players (skipping all injured players)
  const handleAutoConvocate = () => {
    // Filter only healthy and available players from this category
    const available = categoryPlayers.filter((p) => p.status !== 'Lesionado' && !isPlayerInjured(p.id));

    if (available.length === 0) {
      alert('No hay futbolistas disponibles en esta categoría sin lesiones.');
      return;
    }

    // Sort: GK first, then defenders, midfielders, forwards
    const posOrder: Record<Position, number> = {
      'POR': 1, 'LD': 2, 'DFC': 3, 'LI': 4, 'MCD': 5, 'MC': 6, 'MCO': 7, 'ED': 8, 'EI': 9, 'DC': 10
    };
    const sorted = [...available].sort((a, b) => (posOrder[a.primaryPosition] || 5) - (posOrder[b.primaryPosition] || 5));

    // Pick up to 18 players
    const picked = sorted.slice(0, 18);
    const newConvocated: CitationPlayerEntry[] = picked.map((p) => ({
      playerId: p.id,
      squadNumber: p.squadNumber,
      name: `${p.firstName} ${p.lastName}`,
      displayName: (p.lastName || p.firstName).toUpperCase(),
      photoUrl: p.photoUrl,
      primaryPosition: p.primaryPosition,
      category: p.category,
      avatarColor: p.avatarColor,
    }));

    setSelectedPlayers(newConvocated);
  };

  const handleUpdatePlayerSquadNumber = (index: number, newNumber: number) => {
    setSelectedPlayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], squadNumber: newNumber };
      return next;
    });
  };

  const handleUpdatePlayerDisplayName = (index: number, newName: string) => {
    setSelectedPlayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], displayName: newName.toUpperCase() };
      return next;
    });
  };

  // Re-number convocated players 1 to N sequentially
  const handleRenumberSequential = () => {
    setSelectedPlayers((prev) =>
      prev.map((entry, idx) => ({
        ...entry,
        squadNumber: idx + 1,
      }))
    );
  };

  // Reset back to original database squad numbers
  const handleResetToDatabaseNumbers = () => {
    setSelectedPlayers((prev) =>
      prev.map((entry) => {
        const dbPlayer = players.find((p) => p.id === entry.playerId);
        return {
          ...entry,
          squadNumber: dbPlayer ? dbPlayer.squadNumber : entry.squadNumber,
        };
      })
    );
  };

  const handleRemovePlayerEntry = (index: number) => {
    setSelectedPlayers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponent.trim()) {
      alert('Por favor especifica el equipo rival.');
      return;
    }
    if (selectedPlayers.length === 0) {
      alert('Debes convocar al menos un futbolista para generar la planilla de citación.');
      return;
    }

    // Final security check: ensure no injured player is in citation
    const injuredInList = selectedPlayers.filter((p) => {
      const original = players.find((pl) => pl.id === p.playerId);
      return original?.status === 'Lesionado' || isPlayerInjured(p.playerId);
    });

    if (injuredInList.length > 0) {
      const names = injuredInList.map((p) => p.name).join(', ');
      alert(`⚠️ Error de Seguridad Médica:\nNo es posible emitir la citación porque los siguientes jugadores están registrados como lesionados:\n${names}`);
      return;
    }

    const title = `Citación: ${isHome ? clubInfo.shortName : opponent} vs ${isHome ? opponent : clubInfo.shortName} (${category})`;

    // STRICTLY the 3 requested items
    const requiredItems = [
      'Llevar cédula de identidad',
      'Canilleras',
      'Zapatos de fútbol'
    ];

    const citationPayload = {
      category,
      title,
      matchDay: matchDay.trim(),
      competition,
      opponent: opponent.trim(),
      opponentLogoUrl: opponentLogoUrl.trim() || undefined,
      date,
      dateFormatted: dateFormatted.trim(),
      matchTime,
      meetingTime: meetingTime.trim(),
      venue: venue.trim(),
      pitch: pitch.trim(),
      isHome,
      requiredItems,
      coachStaff: initialStaff,
      players: selectedPlayers,
    };

    if (citationToEdit) {
      updateCitation(citationToEdit.id, citationPayload);
      if (onSaved) {
        onSaved({ ...citationToEdit, ...citationPayload });
      }
    } else {
      const newId = addCitation(citationPayload);
      if (onSaved) {
        onSaved({ id: newId, createdAt: new Date().toISOString(), ...citationPayload });
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-950/50">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {citationToEdit ? 'Editar Planilla de Citación' : 'Nueva Planilla de Citación y Convocatoria'}
              </h3>
              <p className="text-xs text-slate-400">
                Configura el rival con su logo, horario de presentación y nómina con fotos de la base de datos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Top Config Grid: Category, Rival, MatchDay */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-bold focus:border-amber-400 focus:outline-none"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>Categoría {cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Rival a Enfrentar</label>
              <input
                type="text"
                required
                value={opponent}
                onChange={(e) => handleOpponentChange(e.target.value)}
                placeholder="ej: Trasandino, Wanderers, Everton..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-400 focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Jornada / Campeonato</label>
              <input
                type="text"
                required
                value={matchDay}
                onChange={(e) => setMatchDay(e.target.value)}
                placeholder="ej: Fecha 6 - Torneo Formativo"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* RIVAL LOGO SELECTOR & UPLOADER */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Escudo / Logo del Rival</span>
              </label>

              {opponentLogoUrl && (
                <button
                  type="button"
                  onClick={() => setOpponentLogoUrl('')}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                >
                  Quitar logo
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Rival Logo Preview with San Luis Duel preview */}
              <div className="flex items-center gap-3 p-2.5 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
                <div className="flex flex-col items-center">
                  <SanLuisLogo className="w-9 h-9" />
                  <span className="text-[9px] text-amber-400 font-bold mt-1">San Luis</span>
                </div>
                <span className="text-xs font-black text-slate-500">VS</span>
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-white border border-slate-400 flex items-center justify-center p-1 overflow-hidden">
                    {opponentLogoUrl ? (
                      <img src={opponentLogoUrl} alt="Rival" className="w-full h-full object-contain" />
                    ) : (
                      <Shield className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <span className="text-[9px] text-slate-300 font-bold mt-1 max-w-[70px] truncate text-center">
                    {opponent || 'Rival'}
                  </span>
                </div>
              </div>

              {/* Upload & Input Controls */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Subir escudo desde PC / Celular</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="url"
                    value={opponentLogoUrl.startsWith('data:') ? '' : opponentLogoUrl}
                    onChange={(e) => setOpponentLogoUrl(e.target.value)}
                    placeholder="O pegar URL del escudo (PNG/SVG)..."
                    className="flex-1 min-w-[200px] bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Quick select presets */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Elegir de clubes chilenos predefinidos:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                    {RIVAL_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPresetRival(preset)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          opponent === preset.name || opponentLogoUrl === preset.logoUrl
                            ? 'bg-amber-400 text-slate-950 border-amber-400'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <img src={preset.logoUrl} alt={preset.shortName} className="w-3 h-3 object-contain inline" />
                        <span>{preset.shortName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Time & Venue Settings */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800/80">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Fecha del Partido</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Texto Fecha (ej: SÁBADO 17 OCTUBRE)</label>
              <input
                type="text"
                value={dateFormatted}
                onChange={(e) => setDateFormatted(e.target.value)}
                placeholder="ej: SÁBADO 17 DE OCTUBRE"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="bg-amber-950/30 p-2 rounded-lg border border-amber-800/50">
              <label className="block text-[11px] font-black text-amber-300 mb-1">
                ⭐ Hora de Citación (Presentación)
              </label>
              <input
                type="text"
                required
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                placeholder="07:30"
                className="w-full bg-slate-900 border border-amber-500/80 rounded-lg p-2 text-xs text-amber-300 font-black font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Condición</label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsHome(true)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    isHome ? 'bg-amber-400 text-slate-950 border-amber-400 font-black' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Local
                </button>
                <button
                  type="button"
                  onClick={() => setIsHome(false)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    !isHome ? 'bg-amber-400 text-slate-950 border-amber-400 font-black' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Visita
                </button>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Lugar de Citación</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="COMPLEJO DEPORTIVO SAN LUIS..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Cancha Asignada</label>
              <input
                type="text"
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                placeholder="Cancha N°1 Principal, Sintética..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>
          </div>

          {/* SQUAD SELECTION SECTION (With injury protection) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-black text-white">
                  Futbolistas Convocados ({selectedPlayers.length} seleccionados)
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoConvocate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-lg shadow transition-colors cursor-pointer"
                  title="Convoca automáticamente a futbolistas aptos, omitiendo lesionados"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sugerir Convocatoria (Sin Lesionados)</span>
                </button>

                {selectedPlayers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedPlayers([])}
                    className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-rose-950/30 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Quick Picker of Category Players */}
            <div>
              <p className="text-[11px] text-slate-400 mb-2">
                Haz clic en los futbolistas de la {category} para convocarlos. Las fotos se toman automáticamente de su ficha en la base de datos. Los futbolistas <strong>lesionados</strong> están bloqueados por seguridad médica.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                {categoryPlayers.map((p) => {
                  const selectedEntry = selectedPlayers.find((sp) => sp.playerId === p.id);
                  const isSelected = !!selectedEntry;
                  const isInjured = p.status === 'Lesionado' || isPlayerInjured(p.id);
                  const posConfig = POSITION_LABELS[p.primaryPosition] || POSITION_LABELS['MC'];
                  const isCustomNumber = selectedEntry && selectedEntry.squadNumber !== p.squadNumber;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isInjured}
                      onClick={() => handleTogglePlayer(p)}
                      className={`flex items-center justify-between p-2 rounded-lg text-left transition-all border text-xs ${
                        isInjured
                          ? 'opacity-40 bg-rose-950/20 border-rose-900/60 cursor-not-allowed text-rose-300'
                          : isSelected
                          ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-md scale-[1.02] cursor-pointer'
                          : 'bg-slate-900 text-slate-200 border-slate-800 hover:border-slate-700 hover:bg-slate-800 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Photo thumbnail */}
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.photoUrl ? (
                            <img src={p.photoUrl} alt={p.firstName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-black text-amber-400">#{p.squadNumber}</span>
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-bold truncate text-[11px]">{p.nickname || p.firstName}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`text-[9px] px-1 py-0.2 rounded font-extrabold ${isSelected ? 'bg-slate-950 text-white' : posConfig.color}`}>
                              {p.primaryPosition}
                            </span>
                            {isSelected ? (
                              <span className="text-[9px] font-black bg-slate-950 text-amber-300 px-1 py-0.2 rounded font-mono">
                                Dorsal: #{selectedEntry.squadNumber}
                                {isCustomNumber && '*'}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-500 font-mono">
                                #{p.squadNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isInjured ? (
                        <span className="text-[9px] font-black text-rose-400 bg-rose-950 px-1 py-0.5 rounded border border-rose-800 shrink-0">
                          🚫 Lesión
                        </span>
                      ) : isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List of Convocated Players with Custom Match Dorsal inputs */}
            {selectedPlayers.length > 0 && (
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-lg">
                <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Shirt className="w-4 h-4 text-amber-400" />
                      <span className="font-black text-white text-xs">
                        Nómina de Convocados ({selectedPlayers.length} futbolistas listos con foto)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Edita el <strong>dorsal de este partido</strong> directamente en cada casilla. No modificará el dorsal permanente en la base de datos.
                    </p>
                  </div>

                  {/* Batch Numbering Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                    <button
                      type="button"
                      onClick={handleRenumberSequential}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[11px] font-bold border border-slate-700 transition-colors cursor-pointer"
                      title="Asignar automáticamente dorsales correlativos 1, 2, 3... correlativos"
                    >
                      <Hash className="w-3 h-3" />
                      <span>Numerar 1 al {selectedPlayers.length}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetToDatabaseNumbers}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold border border-slate-700 transition-colors cursor-pointer"
                      title="Restablecer los dorsales registrados originalmente en la base de datos"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restablecer a BD</span>
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto p-1">
                  {selectedPlayers.map((entry, idx) => {
                    const dbPlayer = players.find((pl) => pl.id === entry.playerId);
                    const photo = entry.photoUrl || dbPlayer?.photoUrl;
                    const isCustomDorsal = dbPlayer && dbPlayer.squadNumber !== entry.squadNumber;

                    return (
                      <div
                        key={entry.playerId}
                        className={`p-2.5 flex items-center justify-between gap-3 text-xs rounded-lg transition-colors ${
                          isCustomDorsal ? 'bg-amber-950/20 hover:bg-amber-950/30' : 'hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-slate-500 font-mono w-4 text-center font-bold text-xs">
                            {idx + 1}
                          </span>

                          {/* Editable Match Squad Number Input */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-1">
                                Dorsal Partido
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={entry.squadNumber ?? ''}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/[^0-9]/g, '');
                                  const num = raw === '' ? 0 : parseInt(raw, 10);
                                  handleUpdatePlayerSquadNumber(idx, num);
                                }}
                                className={`w-12 h-8 text-center font-black rounded-lg border-2 text-sm focus:outline-none transition-all ${
                                  isCustomDorsal
                                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-sm'
                                    : 'bg-slate-900 text-amber-300 border-slate-700 focus:border-amber-400'
                                }`}
                                title="Escribe aquí el dorsal específico para este partido"
                              />
                            </div>

                            {/* Database reference badge */}
                            {dbPlayer && (
                              <div className="flex flex-col items-center justify-center">
                                <span className="text-[9px] uppercase text-slate-500 leading-none mb-1">
                                  Dorsal BD
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-1 rounded font-mono font-bold ${
                                    isCustomDorsal
                                      ? 'text-slate-400 bg-slate-900 border border-slate-800'
                                      : 'text-slate-500 bg-slate-900/60'
                                  }`}
                                  title={`Dorsal en base de datos: #${dbPlayer.squadNumber}`}
                                >
                                  #{dbPlayer.squadNumber}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Player Photo */}
                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                            {photo ? (
                              <img src={photo} alt={entry.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-black text-amber-400">
                                #{entry.squadNumber}
                              </span>
                            )}
                          </div>

                          {/* Player Names & Position */}
                          <div className="truncate flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-white text-xs truncate uppercase">
                                {entry.displayName || entry.name}
                              </p>
                              {isCustomDorsal && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 whitespace-nowrap">
                                  Dorsal Modificado
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium block truncate">
                              {entry.name} • <span className="text-amber-300 font-semibold">{entry.primaryPosition}</span>
                            </span>
                          </div>
                        </div>

                        {/* Remove Action */}
                        <button
                          type="button"
                          onClick={() => handleRemovePlayerEntry(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Quitar de citación"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* REQUISITOS OBLIGATORIOS (Only Cédula de identidad, Canilleras, Zapatos de fútbol) */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Requisitos Obligatorios de Citación</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-2">
                <span className="text-amber-400 font-black">✓</span>
                <span className="text-xs font-bold text-slate-200">Llevar cédula de identidad</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-2">
                <span className="text-amber-400 font-black">✓</span>
                <span className="text-xs font-bold text-slate-200">Canilleras</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-2">
                <span className="text-amber-400 font-black">✓</span>
                <span className="text-xs font-bold text-slate-200">Zapatos de fútbol</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950/40 transition-all hover:scale-[1.02] cursor-pointer"
            >
              {citationToEdit ? 'Guardar Cambios de Citación' : 'Crear Planilla de Citación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

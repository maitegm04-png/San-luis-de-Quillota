import React, { useState } from 'react';
import { CLUB_CATEGORIES, MatchCompetition, MatchSheet, TacticalFormation } from '../../types/football';
import { useFootball } from '../../context/FootballContext';
import { FORMATIONS_SLOTS } from '../../data/mockData';
import { X, Calendar, Clock, MapPin, Shield, Trophy } from 'lucide-react';

interface MatchFormModalProps {
  matchToEdit?: MatchSheet | null;
  onClose: () => void;
}

export const MatchFormModal: React.FC<MatchFormModalProps> = ({ matchToEdit, onClose }) => {
  const { addMatch, updateMatch, clubInfo, players, activeCategory, getCategoryStaff } = useFootball();

  const defaultCategory = matchToEdit?.category || (activeCategory !== 'all' ? activeCategory : 'Sub 14');
  const initialStaff = matchToEdit?.coachStaff || getCategoryStaff(defaultCategory);

  const [opponent, setOpponent] = useState<string>(matchToEdit?.opponent || '');
  const [competition, setCompetition] = useState<MatchCompetition>(matchToEdit?.competition || 'Liga');
  const [category, setCategory] = useState<string>(defaultCategory);
  const [matchDay, setMatchDay] = useState<string>(matchToEdit?.matchDay || 'Fecha 5');
  const [date, setDate] = useState<string>(matchToEdit?.date || new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(matchToEdit?.time || '11:00');
  const [isHome, setIsHome] = useState<boolean>(matchToEdit?.isHome ?? true);
  const [venue, setVenue] = useState<string>(matchToEdit?.venue || clubInfo.stadium);
  const [pitchType, setPitchType] = useState<'Césped Natural' | 'Césped Artificial' | 'Tierra'>(
    matchToEdit?.pitchType || 'Césped Artificial'
  );
  const [referee, setReferee] = useState<string>(matchToEdit?.referee || '');
  const [formation, setFormation] = useState<TacticalFormation>(matchToEdit?.formation || '4-3-3');
  const [tacticalNotesPre, setTacticalNotesPre] = useState<string>(matchToEdit?.tacticalNotesPre || '');

  // Coach staff - 7 Official roles: Entrenador, Ayudante Técnico, PF, PA, KIN, UT, COORD
  const [coach, setCoach] = useState<string>(initialStaff.coach);
  const [assistantCoach, setAssistantCoach] = useState<string>(initialStaff.assistantCoach);
  const [physicalTrainer, setPhysicalTrainer] = useState<string>(initialStaff.physicalTrainer);
  const [goalkeeperCoach, setGoalkeeperCoach] = useState<string>(initialStaff.goalkeeperCoach);
  const [kinesiologist, setKinesiologist] = useState<string>(initialStaff.kinesiologist);
  const [kitManager, setKitManager] = useState<string>(initialStaff.kitManager);
  const [coordinator, setCoordinator] = useState<string>(initialStaff.coordinator);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (!matchToEdit) {
      const staff = getCategoryStaff(newCat);
      setCoach(staff.coach);
      setAssistantCoach(staff.assistantCoach);
      setPhysicalTrainer(staff.physicalTrainer);
      setGoalkeeperCoach(staff.goalkeeperCoach);
      setKinesiologist(staff.kinesiologist);
      setKitManager(staff.kitManager);
      setCoordinator(staff.coordinator);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponent.trim()) {
      alert('Por favor especifica el equipo rival.');
      return;
    }

    const title = `${matchDay} - ${isHome ? clubInfo.shortName : opponent} vs ${isHome ? opponent : clubInfo.shortName} (${category})`;

    const staffData = {
      coach: coach.trim(),
      assistantCoach: assistantCoach.trim(),
      physicalTrainer: physicalTrainer.trim(),
      goalkeeperCoach: goalkeeperCoach.trim(),
      kinesiologist: kinesiologist.trim(),
      kitManager: kitManager.trim(),
      coordinator: coordinator.trim(),
    };

    if (matchToEdit) {
      updateMatch(matchToEdit.id, {
        title,
        opponent: opponent.trim(),
        competition,
        category,
        matchDay: matchDay.trim(),
        date,
        time,
        isHome,
        venue: venue.trim(),
        pitchType,
        referee: referee.trim() || undefined,
        formation,
        coachStaff: staffData,
        tacticalNotesPre: tacticalNotesPre.trim() || undefined,
      });
    } else {
      // Auto-suggest lineup based on available players for this category or general
      const availablePlayers = players.filter((p) => p.status === 'Disponible');
      const slots = FORMATIONS_SLOTS[formation];
      
      const startingEleven = slots.slice(0, 11).map((slot, index) => {
        const matchingPlayer = availablePlayers[index];
        return {
          slotId: slot.id,
          playerId: matchingPlayer ? matchingPlayer.id : '',
          roleName: slot.roleName,
        };
      }).filter((s) => s.playerId !== '');

      const starterIds = startingEleven.map((s) => s.playerId);
      const remainingAvailable = availablePlayers.filter((p) => !starterIds.includes(p.id));
      const substitutes = remainingAvailable.slice(0, 7).map((p) => p.id);
      const subIds = new Set([...starterIds, ...substitutes]);
      const reserves = players.filter((p) => !subIds.has(p.id)).map((p) => p.id);

      const defaultCaptain = starterIds[0];

      addMatch({
        title,
        opponent: opponent.trim(),
        competition,
        category,
        matchDay: matchDay.trim(),
        date,
        time,
        isHome,
        venue: venue.trim(),
        pitchType,
        referee: referee.trim() || undefined,
        status: 'scheduled',
        formation,
        startingEleven,
        substitutes,
        reserves,
        captainId: defaultCaptain,
        coachStaff: staffData,
        homeScore: 0,
        awayScore: 0,
        events: [],
        playerRatings: {},
        matchStats: {
          shotsHome: 0,
          shotsAway: 0,
          shotsOnTargetHome: 0,
          shotsOnTargetAway: 0,
          cornersHome: 0,
          cornersAway: 0,
          foulsHome: 0,
          foulsAway: 0,
          yellowCardsHome: 0,
          yellowCardsAway: 0,
          redCardsHome: 0,
          redCardsAway: 0,
          offsidesHome: 0,
          offsidesAway: 0,
          possessionHome: 50,
          recoveriesHome: 0,
          recoveriesAway: 0,
        },
        tacticalNotesPre: tacticalNotesPre.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-lg font-bold text-white">
                {matchToEdit ? 'Editar Planilla de Partido' : 'Crear Nueva Planilla de Partido'}
              </h2>
              <p className="text-xs text-slate-400">San Luis de Quillota • Fútbol Formativo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Section 1: Match & Rival & Category */}
          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
              1. Encuentro, Rival y Categoría Formativa
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Categoría Oficial *</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-amber-400 font-extrabold focus:outline-amber-500"
                >
                  {CLUB_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Equipo Rival *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Everton de Viña del Mar, U. La Calera..."
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Competición</label>
                <select
                  value={competition}
                  onChange={(e) => setCompetition(e.target.value as MatchCompetition)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-amber-500"
                >
                  <option value="Liga">Torneo Nacional Fútbol Joven (ANFP)</option>
                  <option value="Copa">Copa Futuro / Copa Chile</option>
                  <option value="Amistoso">Amistoso de Preparación</option>
                  <option value="Torneo">Torneo / Cuadrangular</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Jornada / Fecha</label>
                <input
                  type="text"
                  placeholder="ej. Fecha 5, Fecha 12 o Semifinal"
                  value={matchDay}
                  onChange={(e) => setMatchDay(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">Condición de Juego</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsHome(true);
                      setVenue(clubInfo.stadium);
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      isHome
                        ? 'bg-amber-400 text-black shadow font-black'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    🏠 Local (Estadio Lucio Fariña)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsHome(false);
                      setVenue(`Cancha de ${opponent || 'Rival'}`);
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      !isHome
                        ? 'bg-amber-400 text-black shadow font-black'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    🚌 Visitante
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Date, Time & Venue */}
          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
              2. Fecha, Horario e Instalación
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Fecha</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Hora de Citación/Inicio</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tipo de Terreno</label>
                <select
                  value={pitchType}
                  onChange={(e) => setPitchType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-amber-500"
                >
                  <option value="Césped Artificial">Césped Artificial</option>
                  <option value="Césped Natural">Césped Natural</option>
                  <option value="Tierra">Tierra</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">Estadio / Complejo Deportivo</label>
                <input
                  type="text"
                  placeholder="ej. Estadio Bicentenario Lucio Fariña Fernández"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Árbitro</label>
                <input
                  type="text"
                  placeholder="ej. Claudio Aranda (ANFP)"
                  value={referee}
                  onChange={(e) => setReferee(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: The 7 Coaching Staff Roles */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  3. Cuerpo Técnico Oficial ({category})
                </h3>
                <span className="text-[10px] text-slate-400">Entrenador • Ayudante Técnico • PF • PA • KIN • UT • COORD</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const staff = getCategoryStaff(category);
                  setCoach(staff.coach);
                  setAssistantCoach(staff.assistantCoach);
                  setPhysicalTrainer(staff.physicalTrainer);
                  setGoalkeeperCoach(staff.goalkeeperCoach);
                  setKinesiologist(staff.kinesiologist);
                  setKitManager(staff.kitManager);
                  setCoordinator(staff.coordinator);
                }}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/80 rounded-lg px-2.5 py-1 transition-colors cursor-pointer self-start sm:self-auto"
              >
                ↻ Cargar Cuerpo Técnico de {category}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 mb-3">
              <div>
                <label className="block font-bold text-slate-200 mb-1">Entrenador (D.T.)</label>
                <input
                  type="text"
                  value={coach}
                  onChange={(e) => setCoach(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Ayudante Técnico (A.T.)</label>
                <input
                  type="text"
                  value={assistantCoach}
                  onChange={(e) => setAssistantCoach(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">PF (Preparador Físico)</label>
                <input
                  type="text"
                  value={physicalTrainer}
                  onChange={(e) => setPhysicalTrainer(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">PA (Preparador de Arqueros)</label>
                <input
                  type="text"
                  value={goalkeeperCoach}
                  onChange={(e) => setGoalkeeperCoach(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">KIN (Kinesiólogo)</label>
                <input
                  type="text"
                  value={kinesiologist}
                  onChange={(e) => setKinesiologist(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">UT (Utilero)</label>
                <input
                  type="text"
                  value={kitManager}
                  onChange={(e) => setKitManager(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold focus:outline-amber-500"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-bold text-slate-200 mb-1">COORD (Coordinador)</label>
                <input
                  type="text"
                  value={coordinator}
                  onChange={(e) => setCoordinator(e.target.value)}
                  placeholder="Nombre y Apellidos del Coordinador"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold focus:outline-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Esquema Táctico Inicial</label>
                <select
                  value={formation}
                  onChange={(e) => setFormation(e.target.value as TacticalFormation)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-amber-400 font-bold focus:outline-amber-500"
                >
                  <option value="4-3-3">4-3-3 (Ofensivo San Luis)</option>
                  <option value="4-4-2">4-4-2 (Clásico dos puntas)</option>
                  <option value="4-2-3-1">4-2-3-1 (Doble volante y mediapunta)</option>
                  <option value="3-5-2">3-5-2 (Tres centrales y carriles)</option>
                  <option value="3-4-3">3-4-3 (Presión ofensiva)</option>
                  <option value="5-3-2">5-3-2 (Bloque bajo)</option>
                  <option value="4-1-4-1">4-1-4-1 (Líneas juntas)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Consignas Tácticas Previas</label>
                <textarea
                  rows={2}
                  placeholder="Plan de juego, puntos clave..."
                  value={tacticalNotesPre}
                  onChange={(e) => setTacticalNotesPre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 font-bold text-black bg-amber-400 hover:bg-amber-300 rounded-lg shadow-lg shadow-amber-950/40 transition-colors cursor-pointer"
            >
              <span>{matchToEdit ? 'Guardar Cambios' : 'Crear Planilla'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export type Position = 
  | 'POR' // Portero
  | 'LD'  // Lateral Derecho
  | 'DFC' // Defensa Central
  | 'LI'  // Lateral Izquierdo
  | 'MCD' // Mediocentro Defensivo / Pivote
  | 'MC'  // Mediocentro
  | 'MCO' // Mediapunta
  | 'ED'  // Extremo Derecho
  | 'EI'  // Extremo Izquierdo
  | 'DC'; // Delantero Centro

export type PositionGroup = 'Porteros' | 'Defensas' | 'Centrocampistas' | 'Delanteros';

export type DominantFoot = 'Derecho' | 'Izquierdo' | 'Ambidiestro';

export type PlayerStatus = 'Disponible' | 'Lesionado' | 'Sancionado' | 'Duda';

export interface PlayerAttributes {
  pace: number;        // Ritmo / Velocidad (1-99)
  shooting: number;    // Disparo (1-99)
  passing: number;     // Pase (1-99)
  dribbling: number;   // Regate / Técnica (1-99)
  defending: number;   // Defensa (1-99)
  physical: number;    // Físico / Resistencia (1-99)
  goalkeeping?: number;// Habilidad de Portero (1-99)
}

export interface PlayerStats {
  matchesPlayed: number;
  starts: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
  avgRating: number;
}

export type InjuryStatus = 
  | 'Lesionado' 
  | 'En Recuperación' 
  | 'En Reintegro Deportivo' 
  | 'Alta Médica'
  | 'Activa' 
  | 'En Reintegro';

export interface PlayerInjury {
  id: string;
  playerId: string;
  playerName?: string;
  playerSquadNumber?: number;
  category: string;
  injuryType: string; // ej: "Desgarro isquiotibial", "Esguince de tobillo", "Rotura meniscal", "Sobrecarga muscular"
  bodyZone: string; // ej: "Muslo posterior derecho", "Rodilla izquierda", "Tobillo derecho"
  description?: string; // Descripción de la lesión y qué le pasó (mecanismo del trauma, dolor, cómo ocurrió)
  diagnosis: string; // Diagnóstico médico (si está disponible)
  medicalStaff?: string; // Profesional responsable o centro médico
  medicalStaffOrClinic?: string; // Centro médico o profesional a cargo
  severity: 'Leve' | 'Moderada' | 'Grave' | 'Muy Grave';
  dateInjured: string; // YYYY-MM-DD (Fecha de la lesión)
  expectedReturnDate?: string; // YYYY-MM-DD (Fecha estimada de regreso)
  actualReturnDate?: string; // YYYY-MM-DD (Fecha efectiva de alta médica)
  status: InjuryStatus; // Estado actual: lesionado, en recuperación, en reintegro deportivo o alta médica
  treatment?: string; // Tratamiento kinésico o médico indicado
  notes?: string; // Observaciones y evolución de la recuperación
  evolutionNotes?: string; // Historial y notas de evolución clínica
  season?: string;
  matchId?: string; // Si la lesión ocurrió durante un partido
  createdAt?: string;
}

export interface Player {
  id: string;
  squadNumber: number;
  firstName: string;
  lastName: string;
  nickname?: string;
  primaryPosition: Position;
  secondaryPosition?: Position;
  category: string; // ej: "Primer Equipo", "Juvenil A"
  birthDate: string; // YYYY-MM-DD
  dominantFoot: DominantFoot;
  heightCm: number;
  weightKg: number;
  status: PlayerStatus;
  statusReason?: string;
  idCard?: string; // DNI o Número de Ficha Federativa
  phone?: string;
  email?: string;
  notes?: string;
  avatarColor: string;
  photoUrl?: string; // Foto del jugador (URL o imagen base64 comprimida)
  attributes: PlayerAttributes;
  stats: PlayerStats;
  injuries?: PlayerInjury[];
}

export interface CitationPlayerEntry {
  playerId: string;
  squadNumber: number;
  name: string;
  displayName: string; // Apellido o nombre corto en mayúsculas para la chapa amarilla (ej: "CHARPENTIER", "SILVA", "L. TAPIA")
  photoUrl?: string; // Foto desde la base de datos del jugador
  primaryPosition?: Position;
  category?: string;
  avatarColor?: string;
  roleType?: 'Titular' | 'Suplente' | 'Reserva';
}

export interface MatchCitation {
  id: string;
  category: string; // Sub 11, Sub 12, Sub 13, Sub 14, Sub 15, Sub 16, Sub 18, Sub 20
  title: string;
  matchDay?: string; // ej: "Fecha 6"
  competition?: MatchCompetition;
  opponent: string;
  opponentLogoUrl?: string; // Logo del rival (SVG, PNG o preestablecido)
  date: string; // YYYY-MM-DD
  dateFormatted?: string; // ej: "SABADO 17 OCTUBRE"
  matchTime?: string; // HH:mm
  meetingTime: string; // HH:mm (ej: "07:30 HRS")
  venue: string; // ej: "COMPLEJO SAN LUIS"
  pitch?: string; // ej: "Cancha N°1 Principal"
  isHome?: boolean; // true si es local, false si es visita
  requiredItems: string[]; // Solo: ['Llevar cédula de identidad', 'Canilleras', 'Zapatos de fútbol']
  coachStaff?: CoachStaff;
  players: CitationPlayerEntry[];
  createdAt: string;
}

export type TacticalFormation = '4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2' | '3-4-3' | '5-3-2' | '4-1-4-1';

export interface FormationSlot {
  id: string;
  roleName: Position;
  defaultX: number; // 0 to 100 percentage
  defaultY: number; // 0 to 100 percentage
}

export type MatchStatus = 'scheduled' | 'live' | 'finished';
export type MatchCompetition = 'Liga' | 'Copa' | 'Amistoso' | 'Torneo';

export type MatchEventType = 
  | 'goal'
  | 'goal_conceded'
  | 'yellow_card'
  | 'red_card'
  | 'sub_in_out'
  | 'injury'
  | 'penalty_scored'
  | 'penalty_missed'
  | 'own_goal'
  | 'note';

export interface MatchInjuryIncident {
  id: string;
  playerId: string;
  playerName: string;
  playerSquadNumber?: number;
  minute: number;
  description: string; // Qué le pasó al jugador (ej: "Choque con rival, salió con dolor en tobillo")
  injuryType?: string; // Tipo de lesión diagnosticada o sospechada
  bodyZone?: string; // Zona del cuerpo afectada
  severity?: 'Leve' | 'Moderada' | 'Grave' | 'Muy Grave';
  recordedInMedicalModule?: boolean; // Si ya fue registrada en el módulo médico de lesionados
  medicalInjuryId?: string; // ID de la lesión en el módulo médico
}

export interface MatchEvent {
  id: string;
  minute: number;
  type: MatchEventType;
  playerId?: string;
  subOutPlayerId?: string;
  assistPlayerId?: string;
  opponentPlayerName?: string;
  detail?: string;
  injuryIncident?: MatchInjuryIncident;
}

export interface LineupPlayer {
  slotId: string;
  playerId: string;
  roleName: Position;
  customX?: number;
  customY?: number;
}

export interface PlayerMatchRating {
  rating: number; // 1 to 10
  minutes: number;
  notes?: string;
}

export const CLUB_CATEGORIES = [
  'Sub 11',
  'Sub 12',
  'Sub 13',
  'Sub 14',
  'Sub 15',
  'Sub 16',
  'Sub 18',
  'Sub 20',
] as const;

export type ClubCategory = typeof CLUB_CATEGORIES[number];

export interface CoachStaff {
  coach: string;           // Entrenador
  assistantCoach: string;  // Ayudante Técnico
  physicalTrainer: string; // PF (Preparador Físico)
  goalkeeperCoach: string; // PA (Preparador de Arqueros)
  kinesiologist: string;   // KIN (Kinesiólogo)
  kitManager: string;      // UT (Utilero)
  coordinator: string;     // COORD (Coordinador)
}

export interface CollectiveMatchStats {
  shotsHome: number;
  shotsAway: number;
  shotsOnTargetHome: number;
  shotsOnTargetAway: number;
  cornersHome: number;
  cornersAway: number;
  foulsHome: number;
  foulsAway: number;
  yellowCardsHome: number;
  yellowCardsAway: number;
  redCardsHome: number;
  redCardsAway: number;
  offsidesHome: number;
  offsidesAway: number;
  possessionHome: number; // percentage
  recoveriesHome?: number;
  recoveriesAway?: number;
}

export interface MatchPhysicalPlayerEntry {
  number: number;
  playerId: string;
  firstName: string;
  lastName: string;
  role: 'TITULAR' | 'SUPLENTE';
  minutes: number;
  pse: number; // 0 to 10 (Escala Borg)
  status: 'OK' | '-' | 'Fatiga' | 'Molestia' | 'Sobrecarga' | 'Lesión';
}

export interface MatchPhysicalReport {
  fieldCondition: 'Césped' | 'Sintético' | 'Mixto' | 'Tierra';
  tacticalSystem?: string;
  venueLocation?: string;
  players: MatchPhysicalPlayerEntry[];
  averagePseTitulares?: number;
  averagePseSuplentes?: number;
  averagePseTotal?: number;
  notes?: string;
  recordedBy?: string; // Nombre del PF responsable
}

export interface MatchGpsPlayerEntry {
  playerId: string;
  playerName: string;
  minutes: number;
  totalDistanceMeters: number;
  distancePerMinute: number;
  highSpeedDistance: number; // +21 km/h
  sprintDistance: number;
  sprintsCount: number; // +25 km/h
  maxSpeed: number; // km/h
  pse?: number;
}

export interface MatchGpsAverages {
  avgTotalDistance: number;
  avgDistancePerMin: number;
  avgHighSpeedDistance: number;
  avgSprintDistance: number;
  avgSprints: number;
  avgMaxSpeed: number;
}

export interface MatchGpsTopRecords {
  topTotalDistance: { playerName: string; value: number };
  topHighSpeedDistance: { playerName: string; value: number };
  topMaxSpeed: { playerName: string; value: number };
  topSprints: { playerName: string; value: number };
  topSprintDistance: { playerName: string; value: number };
}

export interface MatchGpsReport {
  matchName: string;
  date: string;
  category: string; // Exclusivo Sub 20
  stadium: string;
  players: MatchGpsPlayerEntry[];
  averages: MatchGpsAverages;
  topRecords: MatchGpsTopRecords;
  notes?: string;
}

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export type DayScheduleType = 'Entrenamiento' | 'Partido' | 'Libre' | 'Gimnasio' | 'Recuperación';

export interface WeeklyCheckInEntry {
  id: string;
  playerId: string;
  playerName: string;
  category: string; // Sub 15, Sub 16, Sub 18, Sub 20
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  sleepScore: number; // Sueño: Nota 1 a 7 (no en horas)
  stressLevel: number; // Estrés: Nota 1 a 7
  fatigue: number; // Fatiga: Nota 1 a 7
  muscleSoreness: number; // Dolor Muscular: Nota 1 a 7
  energyLevel: number; // Nivel de energía: Nota 1 a 7
  painArea?: string; // Indica zona de molestia Pre Entrenamiento
  wellnessScore: number; // Puntuación de bienestar calculada (5 a 35)
  trafficLight: 'green' | 'yellow' | 'red';
  readyToTrain: boolean;
  notes?: string;
  sleepHours?: number; // compatibilidad previa
  sleepQuality?: number; // compatibilidad previa
  mood?: number; // compatibilidad previa
  createdAt: string;
}

export interface WeeklyCheckOutEntry {
  id: string;
  playerId: string;
  playerName: string;
  category: string; // Sub 15, Sub 16, Sub 18, Sub 20
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  sessionType: 'Entrenamiento' | 'Fuerza / Gimnasio' | 'Táctico' | 'Partido' | 'Recuperación';
  durationMinutes: number; // duración de la sesión en minutos
  pse: number; // 0-10 (Percepción Subjetiva del Esfuerzo)
  sessionRpeLoad: number; // PSE x Duración = Carga U.A. (Unidades Arbitrarias)
  painPostSession?: string;
  status: 'OK' | 'Fatiga Normal' | 'Sobrecarga' | 'Atención Kinesiológica';
  notes?: string;
  createdAt: string;
}

export interface MatchSheet {
  id: string;
  title: string;
  competition: MatchCompetition;
  category: string; // Sub 11, Sub 12, Sub 13, Sub 14, Sub 15, Sub 16, Sub 18, Sub 20
  matchDay: string; // ej: "Fecha 5", "Jornada 12"
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  opponent: string;
  isHome: boolean;
  venue: string;
  pitchType: 'Césped Natural' | 'Césped Artificial' | 'Tierra';
  referee?: string;
  status: MatchStatus;
  
  // Tactical & Lineup
  formation: TacticalFormation;
  startingEleven: LineupPlayer[]; // 11 players
  substitutes: string[]; // player IDs
  reserves: string[]; // Not selected / reserve player IDs
  
  // Special roles
  captainId?: string;
  viceCaptainId?: string;
  penaltyTakerId?: string;
  freeKickTakerId?: string;
  cornerTakerId?: string;
  
  // Staff
  coachStaff: CoachStaff;

  // Score & Live
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  
  // Stats & Ratings
  playerRatings: Record<string, PlayerMatchRating>;
  matchStats?: CollectiveMatchStats;
  mvpPlayerId?: string;

  // Coach tactical notes
  tacticalNotesPre?: string;
  tacticalNotesHalf?: string;
  tacticalNotesPost?: string;

  // Medical & Injury incidents during match
  injuryIncidents?: MatchInjuryIncident[];

  // Physical Area (Sub 14 a Sub 20)
  physicalReport?: MatchPhysicalReport;

  // GPS Metrics (Exclusively Sub 20)
  gpsReport?: MatchGpsReport;
}

export interface ClubInfo {
  name: string;
  shortName: string;
  category: string;
  selectedCategory: string; // active category filter: "Todas" or "Sub 11", etc.
  coachStaff: CoachStaff;
  primaryColor: string;
  secondaryColor: string;
  stadium: string;
  season: string;
  federationId?: string;
}

export function matchesCategoryFilter(itemCategory: string, filterCategory: string): boolean {
  if (!filterCategory || filterCategory === 'all' || filterCategory === 'Todas') return true;
  if (filterCategory === 'Sub 11-12') return itemCategory === 'Sub 11' || itemCategory === 'Sub 12';
  if (filterCategory === 'Sub 13-14') return itemCategory === 'Sub 13' || itemCategory === 'Sub 14';
  if (filterCategory === 'Sub 15-16') return itemCategory === 'Sub 15' || itemCategory === 'Sub 16';
  return itemCategory === filterCategory;
}

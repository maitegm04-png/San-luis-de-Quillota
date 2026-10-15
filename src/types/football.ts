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
  attributes: PlayerAttributes;
  stats: PlayerStats;
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
  | 'penalty_scored'
  | 'penalty_missed'
  | 'own_goal'
  | 'note';

export interface MatchEvent {
  id: string;
  minute: number;
  type: MatchEventType;
  playerId?: string;
  subOutPlayerId?: string;
  assistPlayerId?: string;
  opponentPlayerName?: string;
  detail?: string;
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
  matchStats: CollectiveMatchStats;
  mvpPlayerId?: string;

  // Coach tactical notes
  tacticalNotesPre?: string;
  tacticalNotesHalf?: string;
  tacticalNotesPost?: string;
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

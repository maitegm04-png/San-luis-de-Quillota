import { Player, PlayerFirstTeamProjection, ProjectionLevelId } from '../types/football';

export interface ProjectionLevelDef {
  id: ProjectionLevelId;
  code: string;
  title: string;
  fullLabel: string;
  timeframe: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  chipBg: string;
  dotColor: string;
  accentHex: string;
  ringColor: string;
}

export const PROJECTION_LEVELS: ProjectionLevelDef[] = [
  {
    id: 'nivel_1',
    code: 'Nivel 1',
    title: 'Preparado para el primer equipo',
    fullLabel: 'Nivel 1 — Preparado para el primer equipo',
    timeframe: 'Inmediato',
    description: 'Jugador que presenta las condiciones técnicas, tácticas, físicas y mentales para integrarse al primer equipo y competir por oportunidades, según la evaluación del cuerpo técnico.',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-300',
    borderColor: 'border-emerald-500/50',
    chipBg: 'bg-emerald-500/15',
    dotColor: 'bg-emerald-400',
    accentHex: '#10b981',
    ringColor: 'ring-emerald-500',
  },
  {
    id: 'nivel_2',
    code: 'Nivel 2',
    title: 'Proyección a corto plazo',
    fullLabel: 'Nivel 2 — Proyección a corto plazo',
    timeframe: '6 a 12 meses',
    description: 'Jugador con potencial cercano al primer equipo, que necesita consolidar aspectos específicos de su rendimiento para estar en condiciones de integrarse competitivamente.',
    badgeBg: 'bg-sky-950/80',
    badgeText: 'text-sky-300',
    borderColor: 'border-sky-500/50',
    chipBg: 'bg-sky-500/15',
    dotColor: 'bg-sky-400',
    accentHex: '#0284c7',
    ringColor: 'ring-sky-500',
  },
  {
    id: 'nivel_3',
    code: 'Nivel 3',
    title: 'Proyección a mediano plazo',
    fullLabel: 'Nivel 3 — Proyección a mediano plazo',
    timeframe: '1 a 2 años',
    description: 'Jugador con condiciones y potencial para llegar al primer equipo, que requiere continuar su desarrollo y alcanzar mayores niveles de madurez técnica, táctica, física y psicológica.',
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-300',
    borderColor: 'border-amber-500/50',
    chipBg: 'bg-amber-500/15',
    dotColor: 'bg-amber-400',
    accentHex: '#f59e0b',
    ringColor: 'ring-amber-500',
  },
  {
    id: 'nivel_4',
    code: 'Nivel 4',
    title: 'En desarrollo formativo',
    fullLabel: 'Nivel 4 — En desarrollo formativo',
    timeframe: 'Sin plazo definido',
    description: 'Jugador que continúa su proceso de formación de acuerdo con su edad y etapa madurativa, con énfasis en el desarrollo integral y sin una proyección temporal definida hacia el primer equipo.',
    badgeBg: 'bg-indigo-950/80',
    badgeText: 'text-indigo-300',
    borderColor: 'border-indigo-500/50',
    chipBg: 'bg-indigo-500/15',
    dotColor: 'bg-indigo-400',
    accentHex: '#6366f1',
    ringColor: 'ring-indigo-500',
  },
  {
    id: 'nivel_5',
    code: 'Nivel 5',
    title: 'Proyección por evaluar',
    fullLabel: 'Nivel 5 — Proyección por evaluar',
    timeframe: 'Pendiente de evaluación',
    description: 'Jugador que requiere un período adicional de observación y evaluación para determinar su potencial y establecer una proyección deportiva.',
    badgeBg: 'bg-slate-900',
    badgeText: 'text-slate-300',
    borderColor: 'border-slate-700',
    chipBg: 'bg-slate-800/80',
    dotColor: 'bg-slate-400',
    accentHex: '#94a3b8',
    ringColor: 'ring-slate-500',
  },
];

export const PROJECTION_LEVEL_MAP: Record<ProjectionLevelId, ProjectionLevelDef> = PROJECTION_LEVELS.reduce(
  (acc, lvl) => {
    acc[lvl.id] = lvl;
    return acc;
  },
  {} as Record<ProjectionLevelId, ProjectionLevelDef>
);

export const DEFAULT_EVALUATORS = [
  'Fernando Guajardo (Jefe Técnico)',
  'Juan Manuel Rezzónico (DT Sub 20)',
  'Víctor Rivero (DT Sub 18)',
  'Francisco Bozán (DT Sub 16)',
  'Pablo Abraham (DT Sub 15)',
  'Carlos Martínez (DT Sub 14)',
  'Esteban Valencia (DT Sub 13)',
  'Cristián Abarca (DT Sub 12)',
  'Rodrigo Tapia (DT Sub 11)',
  'Maite González (Coordinadora Cantera)',
];

/**
 * Obtiene la proyección al primer equipo para un jugador.
 * Si el jugador ya fue evaluado, retorna su proyección existente.
 * Si no, genera una proyección formativa inicial coherente con su categoría y rendimiento.
 */
export function getPlayerProjection(player: Player): PlayerFirstTeamProjection {
  if (player.firstTeamProjection && player.firstTeamProjection.currentLevelId) {
    const levelDef = PROJECTION_LEVEL_MAP[player.firstTeamProjection.currentLevelId] || PROJECTION_LEVELS[3];
    return {
      ...player.firstTeamProjection,
      currentLevelLabel: levelDef.fullLabel,
      timeframe: levelDef.timeframe,
    };
  }

  // Deducción predeterminada según categoría y madurez deportiva
  let defaultLevelId: ProjectionLevelId = 'nivel_4';
  let defaultObservations = 'En etapa formativa regular, fortaleciendo fundamentos y desarrollo integral.';
  let defaultObjectives = 'Consolidar técnica individual, toma de decisiones y acondicionamiento físico general.';

  if (player.category === 'Sub 20') {
    if (player.stats.avgRating >= 8.0 || player.stats.goals >= 7) {
      defaultLevelId = 'nivel_1';
      defaultObservations = 'Presenta madurez técnico-táctica, solidez física y personalidad competitiva para alternar dinámicas de entrenamiento y citaciones con el plantel profesional.';
      defaultObjectives = 'Intensidad en ritmo de juego profesional, duelos 1v1 en alta exigencia y templanza táctica bajo presión.';
    } else {
      defaultLevelId = 'nivel_2';
      defaultObservations = 'Buen perfil técnico y físico. Requiere mayor regularidad competitiva y ajustes específicos en posicionamiento defensivo/ofensivo para su inserción al primer equipo.';
      defaultObjectives = 'Acelerar velocidad de transición, robustecer masa muscular útil y lectura de segundas jugadas.';
    }
  } else if (player.category === 'Sub 18') {
    if (player.stats.avgRating >= 8.2) {
      defaultLevelId = 'nivel_2';
      defaultObservations = 'Proyección destacada en su generación. Monitoreado por la jefatura técnica para promoción acelerada.';
      defaultObjectives = 'Potencia aeróbica, consistencia en 90 minutos y madurez emocional en escenarios adversos.';
    } else {
      defaultLevelId = 'nivel_3';
      defaultObservations = 'Condiciones notorias y potencial de mediano plazo. En proceso de consolidación táctica y maduración neuromuscular.';
      defaultObjectives = 'Mejorar perfil de pierna inhábil, trabajo de fuerza funcional y comprensión del modelo táctico institucional.';
    }
  } else if (player.category === 'Sub 16' || player.category === 'Sub 15') {
    defaultLevelId = 'nivel_3';
    defaultObservations = 'Etapa de desarrollo madurativo y crecimiento. Muestra buenas aptitudes técnicas y comprensión del juego.';
    defaultObjectives = 'Coordinación motriz especializada, nutrición deportiva para etapa de crecimiento y disciplina táctica.';
  } else {
    // Sub 11 a Sub 14
    defaultLevelId = 'nivel_4';
    defaultObservations = 'Proceso de fútbol formativo infantil-juvenil. Prioridad en la formación integral, juego asociativo y valores del club.';
    defaultObjectives = 'Desarrollo de habilidades motrices básicas y específicas, dominio de ambos perfiles y hábitos deportivos.';
  }

  const def = PROJECTION_LEVEL_MAP[defaultLevelId];

  return {
    currentLevelId: defaultLevelId,
    currentLevelLabel: def.fullLabel,
    timeframe: def.timeframe,
    evaluationDate: '2026-03-01',
    evaluatorName: 'Fernando Guajardo (Jefe Técnico)',
    evaluatorRole: 'Jefatura Fútbol Formativo',
    nextReviewDate: '2026-07-15',
    technicalObservations: defaultObservations,
    individualImprovementObjectives: defaultObjectives,
    history: [
      {
        id: `init-${player.id}`,
        newLevelId: defaultLevelId,
        newLevelLabel: def.fullLabel,
        date: '2026-03-01',
        evaluatorName: 'Fernando Guajardo (Jefe Técnico)',
        evaluatorRole: 'Jefatura Fútbol Formativo',
        technicalObservations: defaultObservations,
        individualImprovementObjectives: defaultObjectives,
        nextReviewDate: '2026-07-15',
        createdAt: '2026-03-01T10:00:00Z',
      },
    ],
  };
}

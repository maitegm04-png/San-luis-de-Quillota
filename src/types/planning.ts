import { CategoryGroup } from './auth';

export type PlanningArea = 'tecnica' | 'fisica' | 'arqueros';

export type DayOfWeek = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

export const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: 'lunes', label: 'LUNES' },
  { key: 'martes', label: 'MARTES' },
  { key: 'miercoles', label: 'MIÉRCOLES' },
  { key: 'jueves', label: 'JUEVES' },
  { key: 'viernes', label: 'VIERNES' },
  { key: 'sabado', label: 'SÁBADO' },
  { key: 'domingo', label: 'DOMINGO' },
];

export interface DayTechnicalPlan {
  fecha: string;
  sesionTitulo: string;
  isFreeDay?: boolean;
  bloques: {
    estructura: string;
    modulo: string;
  }[];
}

export interface DayPhysicalPlan {
  fecha: string;
  cargaDelDia: string;
  isFreeDay?: boolean;
  preSesion: {
    tipo: string;
    descripcion: string;
  };
  sesion: {
    bloques: {
      tipo: string;
      descripcion: string;
    }[];
  };
  complementario: {
    tipo: string;
    descripcion: string;
  };
}

export interface DayGoalkeeperPlan {
  fecha: string;
  objetivoDelDia: string;
  isFreeDay?: boolean;
  preSesion: {
    tipo: string;
    descripcion: string;
  };
  sesion: {
    bloques: {
      tipo: string;
      descripcion: string;
    }[];
  };
  complementario: {
    tipo: string;
    descripcion: string;
  };
}

export interface WeeklyCategoryPlan {
  id: string; // e.g. "plan-Sub_13-14-2026-W08"
  category: CategoryGroup | string; // 'Sub 11-12' | 'Sub 13-14' | 'Sub 15-16' | 'Sub 18' | 'Sub 20'
  year: number; // e.g. 2026
  weekNumber: number; // 1 to 52
  startDate: string; // Monday date YYYY-MM-DD
  endDate: string; // Sunday date YYYY-MM-DD
  updatedAt: string;
  authorName?: string;

  tecnica: Record<DayOfWeek, DayTechnicalPlan>;
  fisica: Record<DayOfWeek, DayPhysicalPlan>;
  arqueros: Record<DayOfWeek, DayGoalkeeperPlan>;
}

// Preset options for dropdown selectors
export const CARGA_OPTIONS = [
  '- Seleccionar Carga -',
  'Regenerativo (Baja)',
  'Carga Media (Aeróbica)',
  'Carga Alta (Fuerza / Tensión)',
  'Fuerza / Potencia',
  'Velocidad / Reactividad',
  'Activación Pre-competitiva',
  'Competición Oficial (Partido)',
  'Descanso / LIBRE'
];

export const PRE_SESION_FISICA_OPTIONS = [
  '- Seleccionar Pre-sesión -',
  'Activación Neuromuscular',
  'Movilidad Articular & Foam Roller',
  'Fuerza Preventiva (Isquios / Pubis)',
  'Core & Estabilidad Lumbo-Pélvica',
  'Coordinación Dinámica',
  'Preventivo Ligamentario (Rodilla/Tobillo)'
];

export const SESION_FISICA_OPTIONS = [
  '- Seleccionar Tipo de Sesión -',
  'Resistencia a la Velocidad (RSA)',
  'Potencia Aeróbica (Interval Training)',
  'Fuerza Específica / Transferencia',
  'Capacidad Aeróbica en Espacios Medios',
  'Juegos Reducidos de Alta Intensidad (SSG)',
  'Circuitos de Agilidad y Cambio de Dirección'
];

export const COMPLEMENTARIO_FISICA_OPTIONS = [
  '- Seleccionar Complementario -',
  'Gimnasio (Fuerza Máxima / Hipertrofia)',
  'Preventivo Tren Inferior (Nordic Hamstring)',
  'Flexibilidad Dinámica & Estática',
  'Criogenia & Contraste Térmico',
  'Trabajo Individualizado de Compensación'
];

export const ARQUEROS_OBJETIVOS = [
  '- Seleccionar Objetivo del Día -',
  'Técnica de Blocaje y Desvíos',
  'Juego Aéreo (Centros y Despejes de Puños)',
  'Juego con los Pies (Salida Corta y Media)',
  '1 vs 1, Coberturas y Reducción de Espacio',
  'Velocidad de Reacción y Segunda Jugada',
  'Ubicación Táctica y Coordinación con Línea Defensiva',
  'Activación Pre-Partido',
  'Competición Oficial',
  'LIBRE'
];

export const ARQUEROS_PRE_OPTIONS = [
  '- Seleccionar Pre-sesión -',
  'Movilidad Específica de Cadera y Hombros',
  'Activación Óculo-Manual y Agarre',
  'Fuerza de Núcleo y Caídas Seguras',
  'Fuerza Elástica de Tren Inferior'
];

export const ARQUEROS_SESION_OPTIONS = [
  '- Seleccionar Tipo de Tarea -',
  'Secuencia de Blocajes Frontales y a Media Altura',
  'Situaciones de Remates con Oposición',
  'Centros Laterales con Tráfico en Área',
  'Salidas Rápidas tras Atajada (Contraataque)',
  'Duelos de 1 vs 1 en Área Chica',
  'Integración con Grupo (Espacios Reducidos)'
];

export const TECNICA_ESTRUCTURA_OPTIONS = [
  '- Seleccionar Estructura -',
  'Pre Principal',
  'Parte Principal',
  'Específico',
  'Definición'
];


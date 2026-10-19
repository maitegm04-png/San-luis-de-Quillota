import { 
  WeeklyCategoryPlan, 
  DayOfWeek, 
  DayTechnicalPlan, 
  DayPhysicalPlan, 
  DayGoalkeeperPlan,
  DAYS_OF_WEEK 
} from '../types/planning';

// Calculate dates for a specific week of the year
export function getWeekDates(year: number, weekNumber: number): { key: DayOfWeek; label: string; dateStr: string; displayDate: string }[] {
  // Find Monday of the specified ISO week
  const simple = new Date(Date.UTC(year, 0, 1 + (weekNumber - 1) * 7));
  const dow = simple.getUTCDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  } else {
    ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  }

  return DAYS_OF_WEEK.map((d, index) => {
    const current = new Date(ISOweekStart);
    current.setUTCDate(ISOweekStart.getUTCDate() + index);

    const yearNum = current.getUTCFullYear();
    const monthNum = String(current.getUTCMonth() + 1).padStart(2, '0');
    const dayNum = String(current.getUTCDate()).padStart(2, '0');
    const dateStr = `${yearNum}-${monthNum}-${dayNum}`;

    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const displayDate = `${current.getUTCDate()} ${monthNames[current.getUTCMonth()]}`;

    return {
      key: d.key,
      label: d.label,
      dateStr,
      displayDate
    };
  });
}

// Current ISO week number
export function getCurrentWeekNumber(): { year: number; week: number } {
  const now = new Date();
  const target = new Date(now.valueOf());
  const dayNr = (now.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return { year: now.getFullYear(), week: Math.min(Math.max(weekNumber, 1), 52) };
}

export function createEmptyWeeklyPlan(category: string, year: number, weekNumber: number): WeeklyCategoryPlan {
  const weekDates = getWeekDates(year, weekNumber);
  const startDate = weekDates[0].dateStr;
  const endDate = weekDates[6].dateStr;

  const planId = `plan-${category.replace(/\s+/g, '_')}-${year}-W${String(weekNumber).padStart(2, '0')}`;

  const tecnica = {} as Record<DayOfWeek, DayTechnicalPlan>;
  const fisica = {} as Record<DayOfWeek, DayPhysicalPlan>;
  const arqueros = {} as Record<DayOfWeek, DayGoalkeeperPlan>;

  weekDates.forEach((wd) => {
    tecnica[wd.key] = {
      fecha: wd.displayDate,
      sesionTitulo: '',
      isFreeDay: false,
      bloques: [
        { estructura: '', modulo: '' },
        { estructura: '', modulo: '' },
        { estructura: '', modulo: '' },
        { estructura: '', modulo: '' }
      ]
    };

    fisica[wd.key] = {
      fecha: wd.displayDate,
      cargaDelDia: 'Media (MD)',
      isFreeDay: false,
      preSesion: {
        tipo: 'Activación y Movilidad Articular',
        descripcion: ''
      },
      sesion: {
        bloques: [
          { tipo: 'Resistencia Aeróbica / Capacidad', descripcion: '' },
          { tipo: 'Velocidad y Agilidad', descripcion: '' },
          { tipo: '', descripcion: '' }
        ]
      },
      complementario: {
        tipo: 'Core y Estabilidad Lumbo-Pélvica',
        descripcion: ''
      }
    };

    arqueros[wd.key] = {
      fecha: wd.displayDate,
      objetivoDelDia: '',
      isFreeDay: false,
      preSesion: {
        tipo: 'Activación Específica y Coordinación Manual',
        descripcion: ''
      },
      sesion: {
        bloques: [
          { tipo: 'Blocaje y Posicionamiento Bajo los Tres Palos', descripcion: '' },
          { tipo: 'Juego Aéreo y Salidas en Balón Parado', descripcion: '' },
          { tipo: '', descripcion: '' }
        ]
      },
      complementario: {
        tipo: 'Juego de Pies y Salida con Balón',
        descripcion: ''
      }
    };
  });

  return {
    id: planId,
    category,
    year,
    weekNumber,
    startDate,
    endDate,
    updatedAt: new Date().toISOString(),
    tecnica,
    fisica,
    arqueros
  };
}

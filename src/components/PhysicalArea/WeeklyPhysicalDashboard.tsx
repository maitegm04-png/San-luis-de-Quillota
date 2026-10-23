import React, { useState, useMemo } from 'react';
import { useFootball } from '../../context/FootballContext';
import { useAuth } from '../../context/AuthContext';
import { 
  WeeklyCheckInEntry, 
  WeeklyCheckOutEntry, 
  DayOfWeek,
  DayScheduleType,
  CLUB_CATEGORIES 
} from '../../types/football';
import { 
  Activity, 
  Calendar, 
  Clock, 
  Dumbbell, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Filter, 
  BarChart2, 
  Moon, 
  Zap, 
  Save, 
  FileSpreadsheet, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Heart,
  Users,
  Sparkles,
  Upload,
  Printer,
  FileDown,
  X
} from 'lucide-react';
import { SanLuisLogo } from '../Common/SanLuisLogo';
import { DriveFormImportModal } from './DriveFormImportModal';
import { WeeklyPhysicalPdfModal } from './WeeklyPhysicalPdfModal';

// Helper to get today's date formatted as YYYY-MM-DD
export function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

// Helper to get today's Spanish Day of Week
export function getTodayDayName(): DayOfWeek {
  const d = new Date();
  const days: DayOfWeek[] = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[d.getDay()] || 'Lunes';
}

// Helper to find Monday of any date (defaults to current real week if not provided)
export function getMondayOfDate(dateStr?: string): string {
  let d: Date;
  if (dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      d = new Date();
    }
  } else {
    d = new Date();
  }
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const date = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

// Helper to get all 7 dates of a week from Monday to Sunday (Lunes a Domingo)
export function getWeekDates(mondayStr: string): { key: DayOfWeek; label: string; dateStr: string; displayDate: string }[] {
  const parts = mondayStr.split('-');
  const monday = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const dayNames: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  return dayNames.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return {
      key: name,
      label: name,
      dateStr,
      displayDate: `${day}/${month}`,
    };
  });
}

// Physical Control Categories: Sub-15 a Sub-20
const PHYSICAL_CATEGORIES = ['Sub 15', 'Sub 16', 'Sub 18', 'Sub 20'] as const;

export const WeeklyPhysicalDashboard: React.FC = () => {
  const { 
    players, 
    weeklyCheckIns, 
    weeklyCheckOuts, 
    addWeeklyCheckIn, 
    updateWeeklyCheckIn,
    deleteWeeklyCheckIn,
    addWeeklyCheckOut,
    updateWeeklyCheckOut,
    deleteWeeklyCheckOut,
    activeCategory,
    matches,
    setSelectedMatchId
  } = useFootball();

  const { currentUser } = useAuth();

  // Category filter: default to user's category or Sub 20
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (currentUser?.category && PHYSICAL_CATEGORIES.includes(currentUser.category as any)) {
      return currentUser.category;
    }
    if (activeCategory && PHYSICAL_CATEGORIES.includes(activeCategory as any)) {
      return activeCategory;
    }
    return 'Sub 20';
  });

  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'batch_entry' | 'load_analysis'>('matrix');

  // Navigation across weeks: always initialized to the current real week's Monday
  const realCurrentMonday = useMemo(() => getMondayOfDate(), []);
  const [currentWeekMonday, setCurrentWeekMonday] = useState<string>(() => getMondayOfDate());

  // Week days from Monday to Sunday (7 days)
  const weekDays = useMemo(() => {
    return getWeekDates(currentWeekMonday);
  }, [currentWeekMonday]);

  const weekRangeLabel = useMemo(() => {
    if (weekDays.length === 0) return '';
    const first = weekDays[0];
    const last = weekDays[weekDays.length - 1];
    return `Semana del ${first.label} ${first.displayDate} al ${last.label} ${last.displayDate}/${first.dateStr.slice(0, 4)}`;
  }, [weekDays]);

  // List of weeks for navigation and past weeks filtering
  const availableWeeks = useMemo(() => {
    const mondaysSet = new Set<string>();
    const thisMonday = getMondayOfDate();
    mondaysSet.add(thisMonday);
    mondaysSet.add(getMondayOfDate(currentWeekMonday));

    // Dynamically populate surrounding weeks (-3 to +2)
    [-3, -2, -1, 1, 2].forEach((offset) => {
      const parts = thisMonday.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() + offset * 7);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      mondaysSet.add(`${y}-${m}-${day}`);
    });

    weeklyCheckIns.forEach((c) => {
      if (c.date) mondaysSet.add(getMondayOfDate(c.date));
    });
    weeklyCheckOuts.forEach((c) => {
      if (c.date) mondaysSet.add(getMondayOfDate(c.date));
    });

    const list = Array.from(mondaysSet).sort().reverse();
    return list.map((mStr) => {
      const days = getWeekDates(mStr);
      const isCurrent = mStr === thisMonday;
      return {
        mondayStr: mStr,
        isCurrent,
        label: `Semana ${days[0].displayDate} al ${days[6].displayDate} (${mStr.slice(0, 4)})${isCurrent ? ' ⭐ (Semana Actual)' : ''}`,
      };
    });
  }, [weeklyCheckIns, weeklyCheckOuts, currentWeekMonday]);

  const handlePrevWeek = () => {
    const parts = currentWeekMonday.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() - 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setCurrentWeekMonday(`${y}-${m}-${day}`);
  };

  const handleNextWeek = () => {
    const parts = currentWeekMonday.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() + 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setCurrentWeekMonday(`${y}-${m}-${day}`);
  };

  const handleCurrentWeek = () => {
    setCurrentWeekMonday(getMondayOfDate());
  };

  // Custom day schedules (e.g. Día de Partido, Día Libre, Entrenamiento, etc.) per category and date
  const [customDaySchedules, setCustomDaySchedules] = useState<Record<string, DayScheduleType>>(() => {
    try {
      const saved = localStorage.getItem('sl_custom_day_schedules');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const getDaySchedule = (dateStr: string, dayOfWeek: DayOfWeek): DayScheduleType => {
    const key = `${selectedCategory}_${dateStr}`;
    if (customDaySchedules[key]) return customDaySchedules[key];
    // No darlo automático: el usuario define cuál es el día de partido y cuál es el día libre
    return 'Entrenamiento';
  };

  const handleSetDaySchedule = (dateStr: string, type: DayScheduleType) => {
    const key = `${selectedCategory}_${dateStr}`;
    setCustomDaySchedules((prev) => {
      const next = { ...prev, [key]: type };
      try {
        localStorage.setItem('sl_custom_day_schedules', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Helper to determine the configured Match Day and Free Day in the active week
  const currentMatchDay = useMemo(() => {
    return weekDays.find((d) => getDaySchedule(d.dateStr, d.key) === 'Partido')?.key || 'none';
  }, [weekDays, customDaySchedules, selectedCategory]);

  const currentFreeDay = useMemo(() => {
    return weekDays.find((d) => getDaySchedule(d.dateStr, d.key) === 'Libre')?.key || 'none';
  }, [weekDays, customDaySchedules, selectedCategory]);

  const handleSetMatchDayForWeek = (targetDay: DayOfWeek | 'none') => {
    weekDays.forEach((d) => {
      const current = getDaySchedule(d.dateStr, d.key);
      if (targetDay !== 'none' && d.key === targetDay) {
        handleSetDaySchedule(d.dateStr, 'Partido');
      } else if (current === 'Partido') {
        handleSetDaySchedule(d.dateStr, 'Entrenamiento');
      }
    });
  };

  const handleSetFreeDayForWeek = (targetDay: DayOfWeek | 'none') => {
    weekDays.forEach((d) => {
      const current = getDaySchedule(d.dateStr, d.key);
      if (targetDay !== 'none' && d.key === targetDay) {
        handleSetDaySchedule(d.dateStr, 'Libre');
      } else if (current === 'Libre') {
        handleSetDaySchedule(d.dateStr, 'Entrenamiento');
      }
    });
  };

  // Selected date for daily entries (Defaults to current today date)
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateStr());
  const [selectedDayName, setSelectedDayName] = useState<DayOfWeek>(() => getTodayDayName());

  // Modal states for single entry, Drive import and PDF export
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [isDriveImportOpen, setIsDriveImportOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [targetPlayerId, setTargetPlayerId] = useState<string>('');

  // Single Check-In form fields (Apartados escala 1 a 7: Sueño nota, Estrés, Fatiga, Dolor Muscular, Nivel Energía, Zona Molestia)
  const [cinSleepScore, setCinSleepScore] = useState<number>(5);
  const [cinStress, setCinStress] = useState<number>(1);
  const [cinFatigue, setCinFatigue] = useState<number>(2);
  const [cinSoreness, setCinSoreness] = useState<number>(2);
  const [cinEnergyLevel, setCinEnergyLevel] = useState<number>(6);
  const [cinPainArea, setCinPainArea] = useState<string>('');
  const [cinReady, setCinReady] = useState<boolean>(true);
  const [cinNotes, setCinNotes] = useState<string>('');

  // Single Check-Out form fields
  const [coutSessionType, setCoutSessionType] = useState<WeeklyCheckOutEntry['sessionType']>('Entrenamiento');
  const [coutDuration, setCoutDuration] = useState<number>(80);
  const [coutPse, setCoutPse] = useState<number>(7);
  const [coutPain, setCoutPain] = useState<string>('');
  const [coutStatus, setCoutStatus] = useState<WeeklyCheckOutEntry['status']>('OK');
  const [coutNotes, setCoutNotes] = useState<string>('');

  // Batch entry state for the entire squad (Defaults to today)
  const [batchDate, setBatchDate] = useState<string>(() => getTodayDateStr());
  const [batchDay, setBatchDay] = useState<DayOfWeek>(() => getTodayDayName());
  const [batchSessionType, setBatchSessionType] = useState<WeeklyCheckOutEntry['sessionType']>('Entrenamiento');
  const [batchDuration, setBatchDuration] = useState<number>(80);

  // Filter category players
  const categoryPlayers = useMemo(() => {
    return players
      .filter((p) => {
        if (p.category === selectedCategory) return true;
        if (selectedCategory === 'Sub 20' && (p.category === 'Proyección' || p.category === 'Juvenil')) return true;
        if (selectedCategory === 'Proyección' && p.category === 'Sub 20') return true;
        return false;
      })
      .sort((a, b) => (a.squadNumber || 0) - (b.squadNumber || 0));
  }, [players, selectedCategory]);

  // Map of check-ins by `playerId_date`
  const checkInsMap = useMemo(() => {
    const map = new Map<string, WeeklyCheckInEntry>();
    weeklyCheckIns.forEach((c) => {
      map.set(`${c.playerId}_${c.date}`, c);
    });
    return map;
  }, [weeklyCheckIns]);

  // Map of check-outs by `playerId_date`
  const checkOutsMap = useMemo(() => {
    const map = new Map<string, WeeklyCheckOutEntry>();
    weeklyCheckOuts.forEach((c) => {
      map.set(`${c.playerId}_${c.date}`, c);
    });
    return map;
  }, [weeklyCheckOuts]);

  // Calculate wellness traffic light on 1-7 scale (Score 5-35)
  const calculateTrafficLight = (
    score: number,
    fatigue: number,
    soreness: number,
    stress: number = 1,
    sleepScore: number = 5
  ): 'green' | 'yellow' | 'red' => {
    if (fatigue >= 6 || soreness >= 6 || stress >= 6 || sleepScore <= 2 || score < 19) return 'red';
    if (fatigue >= 4 || soreness >= 4 || stress >= 5 || sleepScore <= 3 || score < 26) return 'yellow';
    return 'green';
  };

  const handleOpenCheckIn = (playerId: string, date: string, day: DayOfWeek) => {
    setTargetPlayerId(playerId);
    setSelectedDate(date);
    setSelectedDayName(day);

    const existing = checkInsMap.get(`${playerId}_${date}`);
    if (existing) {
      setCinSleepScore(existing.sleepScore ?? (existing.sleepHours ? Math.min(7, Math.round(existing.sleepHours - 2)) : 5));
      setCinStress(existing.stressLevel ?? 1);
      setCinFatigue(existing.fatigue ?? 2);
      setCinSoreness(existing.muscleSoreness ?? 2);
      setCinEnergyLevel(existing.energyLevel ?? 6);
      setCinPainArea(existing.painArea || '');
      setCinReady(existing.readyToTrain ?? true);
      setCinNotes(existing.notes || '');
    } else {
      setCinSleepScore(5);
      setCinStress(1);
      setCinFatigue(2);
      setCinSoreness(2);
      setCinEnergyLevel(6);
      setCinPainArea('');
      setCinReady(true);
      setCinNotes('');
    }
    setIsCheckInModalOpen(true);
  };

  const handleSaveCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    const p = players.find((pl) => pl.id === targetPlayerId);
    if (!p) return;

    // Hooper Index Score out of 35 (all 5 metrics on scale 1 to 7)
    const score = Math.min(35, Math.max(5,
      Number(cinSleepScore) + (8 - Number(cinFatigue)) + (8 - Number(cinSoreness)) + (8 - Number(cinStress)) + Number(cinEnergyLevel)
    ));
    const traffic = calculateTrafficLight(score, Number(cinFatigue), Number(cinSoreness), Number(cinStress), Number(cinSleepScore));

    addWeeklyCheckIn({
      playerId: targetPlayerId,
      playerName: p.nickname || `${p.firstName} ${p.lastName}`,
      category: selectedCategory,
      date: selectedDate,
      dayOfWeek: selectedDayName,
      sleepScore: Number(cinSleepScore),
      stressLevel: Number(cinStress),
      fatigue: Number(cinFatigue),
      muscleSoreness: Number(cinSoreness),
      energyLevel: Number(cinEnergyLevel),
      painArea: cinPainArea.trim() || undefined,
      wellnessScore: score,
      trafficLight: traffic,
      readyToTrain: cinReady,
      sleepHours: Number(cinSleepScore) >= 5 ? 8 : 7,
      sleepQuality: Number(cinSleepScore),
      mood: Number(cinEnergyLevel),
      notes: cinNotes.trim() || undefined,
    });

    setIsCheckInModalOpen(false);
  };

  const handleOpenCheckOut = (playerId: string, date: string, day: DayOfWeek) => {
    setTargetPlayerId(playerId);
    setSelectedDate(date);
    setSelectedDayName(day);

    const existing = checkOutsMap.get(`${playerId}_${date}`);
    if (existing) {
      setCoutSessionType(existing.sessionType);
      setCoutDuration(existing.durationMinutes);
      setCoutPse(existing.pse);
      setCoutPain(existing.painPostSession || '');
      setCoutStatus(existing.status);
      setCoutNotes(existing.notes || '');
    } else {
      setCoutSessionType('Entrenamiento');
      setCoutDuration(80);
      setCoutPse(7);
      setCoutPain('');
      setCoutStatus('OK');
      setCoutNotes('');
    }
    setIsCheckOutModalOpen(true);
  };

  const handleSaveCheckOut = (e: React.FormEvent) => {
    e.preventDefault();
    const p = players.find((pl) => pl.id === targetPlayerId);
    if (!p) return;

    const dur = Number(coutDuration);
    const pse = Number(coutPse);
    const load = dur * pse;

    addWeeklyCheckOut({
      playerId: targetPlayerId,
      playerName: p.nickname || `${p.firstName} ${p.lastName}`,
      category: selectedCategory,
      date: selectedDate,
      dayOfWeek: selectedDayName,
      sessionType: coutSessionType,
      durationMinutes: dur,
      pse: pse,
      sessionRpeLoad: load,
      painPostSession: coutPain.trim() || undefined,
      status: coutStatus,
      notes: coutNotes.trim() || undefined,
    });

    setIsCheckOutModalOpen(false);
  };

  // Quick batch save for entire squad (Escala 1 a 7 para todos los apartados de Check-in)
  const [batchData, setBatchData] = useState<Record<string, {
    sleepScore: number; // Nota 1 a 7 (no en horas)
    stress: number; // 1 a 7
    fatigue: number; // 1 a 7
    soreness: number; // 1 a 7
    energy: number; // 1 a 7
    painArea: string; // Zona molestia
    pse: number;
    status: WeeklyCheckOutEntry['status'];
  }>>({});

  const handleBatchFieldChange = (playerId: string, field: string, value: any) => {
    setBatchData((prev) => {
      const current = prev[playerId] || {
        sleepScore: 5,
        stress: 1,
        fatigue: 2,
        soreness: 2,
        energy: 6,
        painArea: '',
        pse: 7,
        status: 'OK' as const,
      };
      return {
        ...prev,
        [playerId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const handleSaveBatch = () => {
    categoryPlayers.forEach((p) => {
      const data = batchData[p.id] || {
        sleepScore: 5,
        stress: 1,
        fatigue: 2,
        soreness: 2,
        energy: 6,
        painArea: '',
        pse: 7,
        status: 'OK'
      };
      // Score Hooper 5-35 (5 apartados del 1 al 7)
      const score = Math.min(35, Math.max(5,
        data.sleepScore + (8 - data.fatigue) + (8 - data.soreness) + (8 - data.stress) + data.energy
      ));
      const traffic = calculateTrafficLight(score, data.fatigue, data.soreness, data.stress, data.sleepScore);

      // Check-in (con los 6 apartados exactos)
      addWeeklyCheckIn({
        playerId: p.id,
        playerName: p.nickname || `${p.firstName} ${p.lastName}`,
        category: selectedCategory,
        date: batchDate,
        dayOfWeek: batchDay,
        sleepScore: data.sleepScore,
        stressLevel: data.stress,
        fatigue: data.fatigue,
        muscleSoreness: data.soreness,
        energyLevel: data.energy,
        painArea: data.painArea.trim() || undefined,
        wellnessScore: score,
        trafficLight: traffic,
        readyToTrain: traffic !== 'red',
        sleepHours: data.sleepScore >= 5 ? 8 : 7,
        sleepQuality: data.sleepScore,
        mood: Math.min(5, Math.max(1, Math.round((data.energy / 7) * 5))),
        notes: `Carga rápida del preparador físico`,
      });

      // Check-out
      addWeeklyCheckOut({
        playerId: p.id,
        playerName: p.nickname || `${p.firstName} ${p.lastName}`,
        category: selectedCategory,
        date: batchDate,
        dayOfWeek: batchDay,
        sessionType: batchSessionType,
        durationMinutes: batchDuration,
        pse: data.pse,
        sessionRpeLoad: batchDuration * data.pse,
        status: data.status,
      });
    });

    setToastMessage({
      text: `¡Registros del día ${batchDay} guardados correctamente para ${categoryPlayers.length} futbolistas de ${selectedCategory}!`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 4500);
    setActiveSubTab('matrix');
  };

  // Weekly stats summary for the selected week
  const weeklySummary = useMemo(() => {
    const weekDates = new Set(weekDays.map((d) => d.dateStr));
    const catCheckIns = weeklyCheckIns.filter(
      (c) => c.category === selectedCategory && weekDates.has(c.date)
    );
    const catCheckOuts = weeklyCheckOuts.filter(
      (c) => c.category === selectedCategory && weekDates.has(c.date)
    );

    const redAlerts = catCheckIns.filter((c) => c.trafficLight === 'red').length;
    const yellowAlerts = catCheckIns.filter((c) => c.trafficLight === 'yellow').length;
    
    const avgSleepScore = catCheckIns.length > 0 
      ? Math.round((catCheckIns.reduce((a, b) => a + (b.sleepScore ?? b.sleepQuality ?? 5), 0) / catCheckIns.length) * 10) / 10 
      : 5.5;

    const avgPse = catCheckOuts.length > 0
      ? Math.round((catCheckOuts.reduce((a, b) => a + b.pse, 0) / catCheckOuts.length) * 10) / 10
      : 6.8;

    const totalWeeklyLoad = catCheckOuts.reduce((a, b) => a + b.sessionRpeLoad, 0);

    return { redAlerts, yellowAlerts, avgSleepScore, avgPse, totalWeeklyLoad };
  }, [weeklyCheckIns, weeklyCheckOuts, selectedCategory, weekDays]);

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xl transition-all animate-in fade-in slide-in-from-top-2 ${
          toastMessage.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200'
            : 'bg-amber-950/90 border-amber-600 text-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold">{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Category Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-950/50 shrink-0">
              <Activity className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/30">
                  Control Físico y Monitoreo Diario
                </span>
                <span className="text-[10px] font-bold text-slate-400">Sub-15 a Sub-20</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Área Física: Seguimiento Semanal de Check-in y Check-out
              </h2>
              <p className="text-xs text-slate-400">
                Control pre-entrenamiento (wellness, sueño, fatiga, dolor) y post-entrenamiento (escala Borg PSE 0-10 y carga sRPE).
              </p>
            </div>
          </div>

          {/* Category Tabs (Sub-15, Sub-16, Sub-18, Sub-20) */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto flex-wrap">
            <span className="text-[11px] font-black text-slate-400 px-2">Categoría:</span>
            {PHYSICAL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-950/50 scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase">Plantel {selectedCategory}</span>
              <Users className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-lg font-black text-white">{categoryPlayers.length} futbolistas</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase">Nota Sueño Promedio</span>
              <Moon className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-lg font-black text-blue-300">{weeklySummary.avgSleepScore} / 7</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase">PSE Promedio Sesión</span>
              <Activity className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-lg font-black text-amber-300">{weeklySummary.avgPse} / 10 Borg</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase">Carga Semanal Acum.</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-lg font-black text-emerald-400">{weeklySummary.totalWeeklyLoad.toLocaleString('es-CL')} U.A.</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase">Alertas de Fatiga</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-rose-400">{weeklySummary.redAlerts} Rojas</span>
              <span className="text-xs text-amber-400 font-bold">({weeklySummary.yellowAlerts} Amarillas)</span>
            </div>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveSubTab('matrix')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'matrix'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Matriz Semanal de Bienestar & Carga</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('batch_entry')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'batch_entry'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Carga Rápida Diaria (Planilla Masiva del PF)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDriveImportOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40"
              title="Importar respuestas de formulario en Google Drive identificando futbolistas por apellido día a día"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Cargar Formulario Drive</span>
              <span className="text-[10px] bg-emerald-800 text-emerald-100 px-1.5 py-0.2 rounded font-bold">
                Auto Apellidos
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-bold">
            {weekRangeLabel}
          </div>
        </div>
      </div>

      {/* VIEW 1: WEEKLY WELLNESS & LOAD MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          {/* Top Bar: Title & Global Actions (PDF Export + Cargar Drive) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                  Matriz Semanal
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {categoryPlayers.length} Futbolistas • {selectedCategory}
                </span>
              </div>
              <h3 className="font-extrabold text-white text-base sm:text-lg flex items-center gap-2 mt-0.5">
                <span>Seguimiento Semanal de Bienestar (IN) y Carga de Trabajo (OUT)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Monitorea el semáforo matutino (escala 1 a 7) y la percepción del esfuerzo post-sesión (Borg 0-10 / sRPE). Haz clic en cualquier casilla para ingresar o editar.
              </p>
            </div>

            {/* Action Buttons: Export PDF & Import Drive */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
                title="Exportar en PDF el informe semanal completo de Check-in y Check-out con firmas"
              >
                <FileDown className="w-4 h-4 text-slate-950" />
                <span>Exportar PDF Resumen Semanal</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDriveImportOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                title="Importar respuestas del formulario Drive identificando por apellido día a día"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Cargar Formulario Drive</span>
              </button>
            </div>
          </div>

          {/* Week Filter & History Navigator Bar */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-300 flex items-center gap-1.5 shrink-0">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Filtrar Semana:</span>
              </span>

              {/* Prev Week Button */}
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                title="Semana Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Week Dropdown Selector */}
              <select
                value={currentWeekMonday}
                onChange={(e) => setCurrentWeekMonday(e.target.value)}
                className="bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs font-black text-amber-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                {availableWeeks.map((w) => (
                  <option key={w.mondayStr} value={w.mondayStr}>
                    {w.label}
                  </option>
                ))}
              </select>

              {/* Next Week Button */}
              <button
                type="button"
                onClick={handleNextWeek}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                title="Semana Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Go to current week */}
              {currentWeekMonday !== realCurrentMonday && (
                <button
                  type="button"
                  onClick={handleCurrentWeek}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-sm cursor-pointer transition-colors"
                  title="Volver a la semana en curso"
                >
                  ⭐ Ir a Semana Actual
                </button>
              )}

              {/* Custom Date Jump */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 ml-1">
                <span>Ir a fecha:</span>
                <input
                  type="date"
                  value={currentWeekMonday}
                  onChange={(e) => {
                    if (e.target.value) {
                      setCurrentWeekMonday(getMondayOfDate(e.target.value));
                    }
                  }}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono cursor-pointer"
                />
              </div>
            </div>

            {/* Traffic Light Legend */}
            <div className="flex items-center gap-3 text-[11px] bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 self-start md:self-auto">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Óptimo
              </span>
              <span className="flex items-center gap-1 text-yellow-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> Precaución
              </span>
              <span className="flex items-center gap-1 text-rose-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Alerta Fatiga
              </span>
            </div>
          </div>

          {/* Day Schedule Configuration (Día de Partido y Día Libre sin darlo automático) */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-black shrink-0">
                ⚙️
              </div>
              <div>
                <span className="font-extrabold text-white text-xs block">
                  Planificación Semanal: Asignar Día de Partido y Día Libre
                </span>
                <span className="text-[10px] text-slate-400">
                  Define manualmente qué día se juega y cuál se descansa (no se asignan automáticamente):
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Match Day Selector */}
              <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span className="text-amber-400 font-black text-[11px]">⚽ Día Partido (MD):</span>
                <select
                  value={currentMatchDay}
                  onChange={(e) => handleSetMatchDayForWeek(e.target.value as any)}
                  className="bg-slate-950 border border-amber-500/60 rounded px-2 py-0.5 text-xs text-amber-300 font-bold cursor-pointer"
                >
                  <option value="none">Sin partido fijado</option>
                  {weekDays.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label} ({d.displayDate})
                    </option>
                  ))}
                </select>
              </div>

              {/* Free Day Selector */}
              <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span className="text-sky-300 font-black text-[11px]">🏖️ Día Libre / Descanso:</span>
                <select
                  value={currentFreeDay}
                  onChange={(e) => handleSetFreeDayForWeek(e.target.value as any)}
                  className="bg-slate-950 border border-sky-500/60 rounded px-2 py-0.5 text-xs text-sky-200 font-bold cursor-pointer"
                >
                  <option value="none">Sin día libre</option>
                  {weekDays.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label} ({d.displayDate})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Matrix Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 uppercase text-[10px] font-black border-b border-slate-800">
                  <th className="p-3 border-r border-slate-800 w-48">Futbolista ({selectedCategory})</th>
                  {weekDays.map((d) => {
                    const sched = getDaySchedule(d.dateStr, d.key);

                    return (
                      <th key={d.key} className="p-2 border-r border-slate-800 text-center min-w-[130px]">
                        <div className="font-extrabold text-white">{d.label}</div>
                        <span className="text-[10px] text-slate-400 font-mono font-bold block">
                          {d.displayDate}
                        </span>

                        {/* Interactive Schedule Badge */}
                        <div className="mt-1">
                          <select
                            value={sched}
                            onChange={(e) => handleSetDaySchedule(d.dateStr, e.target.value as DayScheduleType)}
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border cursor-pointer tracking-wider ${
                              sched === 'Partido'
                                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm font-extrabold'
                                : sched === 'Libre'
                                ? 'bg-sky-950 text-sky-300 border-sky-800'
                                : sched === 'Gimnasio'
                                ? 'bg-purple-950 text-purple-300 border-purple-800'
                                : sched === 'Recuperación'
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                            }`}
                            title="Cambiar tipo de día (Entrenamiento, Partido, Libre, etc.)"
                          >
                            <option value="Entrenamiento">🏃 Entreno</option>
                            <option value="Partido">⚽ Partido (MD)</option>
                            <option value="Libre">🏖️ Día Libre</option>
                            <option value="Gimnasio">🏋️ Gimnasio</option>
                            <option value="Recuperación">🔄 Recup.</option>
                          </select>
                        </div>
                      </th>
                    );
                  })}
                  <th className="p-3 text-center w-28">Carga Semanal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {categoryPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 italic">
                      No hay futbolistas registrados en la categoría {selectedCategory}.
                    </td>
                  </tr>
                ) : (
                  categoryPlayers.map((player) => {
                    let totalPlayerLoad = 0;

                    return (
                      <tr key={player.id} className="hover:bg-slate-850/60 transition-colors">
                        {/* Player name & dorsal */}
                        <td className="p-3 border-r border-slate-800 font-bold text-white whitespace-nowrap bg-slate-900/40">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center font-mono font-black text-[11px] text-amber-400 shrink-0">
                              #{player.squadNumber}
                            </span>
                            <div className="truncate max-w-[130px]">
                              <p className="truncate text-xs font-extrabold">{player.nickname || `${player.firstName} ${player.lastName}`}</p>
                              <span className="text-[9px] text-slate-400 font-normal uppercase">{player.primaryPosition}</span>
                            </div>
                          </div>
                        </td>

                        {/* Days of week columns */}
                        {weekDays.map((d) => {
                          const dateStr = d.dateStr;
                          const sched = getDaySchedule(d.dateStr, d.key);
                          const cin = checkInsMap.get(`${player.id}_${dateStr}`);
                          const cout = checkOutsMap.get(`${player.id}_${dateStr}`);

                          if (cout) {
                            totalPlayerLoad += cout.sessionRpeLoad;
                          }

                          return (
                            <td key={d.key} className={`p-1.5 border-r border-slate-800 text-center ${sched === 'Libre' && !cin && !cout ? 'bg-slate-950/40' : ''}`}>
                              <div className="flex flex-col gap-1">
                                {/* Check-In Pill */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenCheckIn(player.id, dateStr, d.key)}
                                  className={`w-full py-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-between transition-all cursor-pointer border ${
                                    !cin
                                      ? sched === 'Libre'
                                        ? 'bg-slate-950/30 text-slate-500 border-dotted border-slate-800 hover:border-slate-600'
                                        : 'bg-slate-950/40 text-slate-500 border-dashed border-slate-800 hover:border-slate-600 hover:text-slate-300'
                                      : cin.trafficLight === 'green'
                                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900'
                                      : cin.trafficLight === 'yellow'
                                      ? 'bg-yellow-950/70 text-yellow-300 border-yellow-800/80 hover:bg-yellow-900'
                                      : 'bg-rose-950/80 text-rose-200 border-rose-800 hover:bg-rose-900 animate-pulse'
                                  }`}
                                  title={cin ? `Check-in: Sueño Nota ${cin.sleepScore ?? cin.sleepQuality ?? 5}/7, Estrés ${cin.stressLevel}/7, Fatiga ${cin.fatigue}/7, Dolor ${cin.muscleSoreness}/7, Energía ${cin.energyLevel ?? 6}/7 ${cin.painArea ? `• Zona: ${cin.painArea}` : ''}` : sched === 'Libre' ? 'Día Libre (Clic para registrar)' : 'Clic para registrar Check-In'}
                                >
                                  <span className="text-[9px] uppercase font-mono">IN</span>
                                  {cin ? (
                                    <span className="font-mono font-black">S:{cin.sleepScore ?? cin.sleepQuality ?? 5}/7 • W:{cin.wellnessScore}</span>
                                  ) : sched === 'Libre' ? (
                                    <span className="text-[9px] text-slate-500">🏖️ Libre</span>
                                  ) : (
                                    <span>+ Check-in</span>
                                  )}
                                </button>

                                {/* Check-Out Pill */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenCheckOut(player.id, dateStr, d.key)}
                                  className={`w-full py-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-between transition-all cursor-pointer border ${
                                    !cout
                                      ? sched === 'Libre'
                                        ? 'bg-slate-950/30 text-slate-600 border-dotted border-slate-800 hover:border-slate-600'
                                        : 'bg-slate-950/40 text-slate-500 border-dashed border-slate-800 hover:border-slate-600 hover:text-slate-300'
                                      : 'bg-amber-950/50 text-amber-300 border-amber-800/80 hover:bg-amber-900/60'
                                  }`}
                                  title={cout ? `Check-out: ${cout.durationMinutes} min, PSE ${cout.pse}/10, Carga: ${cout.sessionRpeLoad} U.A.` : sched === 'Libre' ? 'Día Libre (Clic para registrar)' : 'Clic para registrar Check-Out'}
                                >
                                  <span className="text-[9px] uppercase font-mono text-slate-400">OUT</span>
                                  {cout ? (
                                    <span className="font-mono font-black">PSE {cout.pse} ({cout.sessionRpeLoad} UA)</span>
                                  ) : sched === 'Libre' ? (
                                    <span className="text-[9px] text-slate-600">Descanso</span>
                                  ) : (
                                    <span>+ Check-out</span>
                                  )}
                                </button>
                              </div>
                            </td>
                          );
                        })}

                        {/* Total Weekly Load */}
                        <td className="p-3 text-center font-mono font-black text-xs text-amber-400 bg-slate-950/30">
                          {totalPlayerLoad > 0 ? `${totalPlayerLoad} U.A.` : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: BATCH SPREADSHEET ENTRY FOR PF */}
      {activeSubTab === 'batch_entry' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                <span>Carga Masiva Diaria de Plantel (Planilla del Preparador Físico)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Registra rápidamente el Check-in matutino y Check-out vespertino para todos los futbolistas de la {selectedCategory} a la vez.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveBatch}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Carga del Día para Todo el Plantel</span>
            </button>
          </div>

          {/* Session Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Día de la Semana</label>
              <select
                value={batchDay}
                onChange={(e) => {
                  const day = e.target.value as DayOfWeek;
                  setBatchDay(day);
                  const found = weekDays.find((d) => d.key === day);
                  if (found) setBatchDate(found.dateStr);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
              >
                {weekDays.map((d) => (
                  <option key={d.key} value={d.key}>{d.label} ({d.displayDate})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Fecha</label>
              <input
                type="date"
                value={batchDate}
                onChange={(e) => setBatchDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Tipo de Sesión</label>
              <select
                value={batchSessionType}
                onChange={(e) => setBatchSessionType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
              >
                <option value="Entrenamiento">Entrenamiento en Cancha</option>
                <option value="Fuerza / Gimnasio">Fuerza / Gimnasio</option>
                <option value="Táctico">Trabajo Táctico</option>
                <option value="Partido">Partido Oficial / Amistoso</option>
                <option value="Recuperación">Recuperación Activa</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Duración Sesión (Minutos)</label>
              <input
                type="number"
                min={20}
                max={150}
                value={batchDuration}
                onChange={(e) => setBatchDuration(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
              />
            </div>
          </div>

          {/* Quick Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 uppercase text-[10px] font-black border-b border-slate-800">
                  <th className="p-2.5 border-r border-slate-800 w-44">Futbolista</th>
                  <th className="p-2.5 border-r border-slate-800 text-center w-28">Sueño (Nota 1-7)</th>
                  <th className="p-2.5 border-r border-slate-800 text-center w-28">Estrés (1-7)</th>
                  <th className="p-2.5 border-r border-slate-800 text-center w-28">Fatiga (1-7)</th>
                  <th className="p-2.5 border-r border-slate-800 text-center w-28">Dolor Musc. (1-7)</th>
                  <th className="p-2.5 border-r border-slate-800 text-center w-28">Energía (1-7)</th>
                  <th className="p-2.5 border-r border-slate-800 text-center w-36">Zona Molestia</th>
                  <th className="p-2.5 border-r border-slate-800 text-center w-24">PSE (0-10)</th>
                  <th className="p-2.5 border-r border-slate-800 text-center w-24">Carga sRPE</th>
                  <th className="p-2.5 text-center w-32">Estado Post</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {categoryPlayers.map((player) => {
                  const data = batchData[player.id] || {
                    sleepScore: 5,
                    stress: 1,
                    fatigue: 2,
                    soreness: 2,
                    energy: 6,
                    painArea: '',
                    pse: 7,
                    status: 'OK' as const
                  };
                  const load = batchDuration * (data.pse || 7);

                  return (
                    <tr key={player.id} className="hover:bg-slate-850">
                      <td className="p-2.5 border-r border-slate-800 font-bold text-white whitespace-nowrap">
                        #{player.squadNumber} {player.nickname || `${player.firstName} ${player.lastName}`}
                      </td>

                      {/* 1. Sueño (Nota 1 a 7, NO en horas) */}
                      <td className="p-2 border-r border-slate-800 text-center">
                        <select
                          value={data.sleepScore}
                          onChange={(e) => handleBatchFieldChange(player.id, 'sleepScore', Number(e.target.value))}
                          className="bg-slate-950 border border-amber-500/70 rounded p-1 text-xs font-bold text-amber-300 w-24 text-center"
                        >
                          <option value={1}>1 - Muy malo</option>
                          <option value={2}>2 - Malo</option>
                          <option value={3}>3 - Deficiente</option>
                          <option value={4}>4 - Regular</option>
                          <option value={5}>5 - Bueno</option>
                          <option value={6}>6 - Muy bueno</option>
                          <option value={7}>7 - Excelente</option>
                        </select>
                      </td>

                      {/* 2. Estrés (1 a 7) */}
                      <td className="p-2 border-r border-slate-800 text-center">
                        <select
                          value={data.stress}
                          onChange={(e) => handleBatchFieldChange(player.id, 'stress', Number(e.target.value))}
                          className="bg-slate-950 border border-slate-700 rounded p-1 text-xs text-blue-300 w-16 text-center font-bold"
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5</option>
                          <option value={6}>6</option>
                          <option value={7}>7</option>
                        </select>
                      </td>

                      {/* 3. Fatiga (1 a 7) */}
                      <td className="p-2 border-r border-slate-800 text-center">
                        <select
                          value={data.fatigue}
                          onChange={(e) => handleBatchFieldChange(player.id, 'fatigue', Number(e.target.value))}
                          className="bg-slate-950 border border-slate-700 rounded p-1 text-xs text-white w-16 text-center font-bold"
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5</option>
                          <option value={6}>6</option>
                          <option value={7}>7</option>
                        </select>
                      </td>

                      {/* 4. Dolor Muscular (1 a 7) */}
                      <td className="p-2 border-r border-slate-800 text-center">
                        <select
                          value={data.soreness}
                          onChange={(e) => handleBatchFieldChange(player.id, 'soreness', Number(e.target.value))}
                          className="bg-slate-950 border border-slate-700 rounded p-1 text-xs text-white w-16 text-center font-bold"
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5</option>
                          <option value={6}>6</option>
                          <option value={7}>7</option>
                        </select>
                      </td>

                      {/* 5. Nivel Energía (1 a 7) */}
                      <td className="p-2 border-r border-slate-800 text-center">
                        <select
                          value={data.energy}
                          onChange={(e) => handleBatchFieldChange(player.id, 'energy', Number(e.target.value))}
                          className="bg-slate-950 border border-slate-700 rounded p-1 text-xs text-emerald-300 w-16 text-center font-bold"
                        >
                          <option value={1}>1 (Mín)</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4 (Med)</option>
                          <option value={5}>5</option>
                          <option value={6}>6</option>
                          <option value={7}>7 (Máx)</option>
                        </select>
                      </td>

                      {/* 6. Zona de Molestia */}
                      <td className="p-2 border-r border-slate-800 text-center">
                        <input
                          type="text"
                          value={data.painArea}
                          placeholder="Ninguna / zona..."
                          onChange={(e) => handleBatchFieldChange(player.id, 'painArea', e.target.value)}
                          className="w-32 bg-slate-950 border border-slate-700 rounded p-1 text-xs text-white placeholder:text-slate-600"
                        />
                      </td>

                      {/* Check-Out: PSE */}
                      <td className="p-2 border-r border-slate-800 text-center">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={data.pse}
                          onChange={(e) => handleBatchFieldChange(player.id, 'pse', Number(e.target.value))}
                          className="w-14 bg-slate-950 border border-amber-600 rounded p-1 text-center font-black text-amber-300"
                        />
                      </td>

                      {/* Carga sRPE */}
                      <td className="p-2.5 border-r border-slate-800 text-center font-mono font-bold text-amber-400">
                        {load} U.A.
                      </td>

                      {/* Estado */}
                      <td className="p-2 text-center">
                        <select
                          value={data.status}
                          onChange={(e) => handleBatchFieldChange(player.id, 'status', e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded p-1 text-xs text-white"
                        >
                          <option value="OK">OK</option>
                          <option value="Fatiga Normal">Fatiga Normal</option>
                          <option value="Sobrecarga">Sobrecarga</option>
                          <option value="Atención Kinesiológica">Atención Kinesio</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: SINGLE CHECK-IN (PRE-ENTRENO / WELLNESS) */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400">Check-In Matutino</span>
                <h3 className="text-base font-extrabold text-white">
                  Evaluación de Bienestar (Wellness)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckInModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCheckIn} className="space-y-4 text-xs">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px]">Futbolista</span>
                  <span className="font-bold text-white text-sm">
                    {players.find((p) => p.id === targetPlayerId)?.nickname || 'Jugador'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Día & Fecha</span>
                  <span className="font-mono text-amber-300 font-bold">{selectedDayName} ({selectedDate})</span>
                </div>
              </div>

              {/* 6 APARTADOS SOLICITADOS: Sueño (nota no horas), Estrés, Fatiga, Dolor Muscular, Nivel Energía, Zona Molestia */}
              <div className="space-y-3.5">
                {/* 1. SUEÑO (NOTA 1 A 7, NO EN HORAS) */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-[10px] font-black border border-amber-400/40">1</span>
                      <span>Sueño (Calificación / Nota, no en horas)</span>
                    </label>
                    <span className="text-amber-400 font-extrabold font-mono text-xs">Nota {cinSleepScore} / 7</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {[
                      { val: 1, label: '1 - Muy deficiente' },
                      { val: 2, label: '2 - Malo' },
                      { val: 3, label: '3 - Deficiente' },
                      { val: 4, label: '4 - Regular' },
                      { val: 5, label: '5 - Bueno' },
                      { val: 6, label: '6 - Muy bueno' },
                      { val: 7, label: '7 - Excelente' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setCinSleepScore(item.val)}
                        className={`py-1.5 px-0.5 text-center rounded-lg border transition-all cursor-pointer font-bold ${
                          cinSleepScore === item.val
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-black">{item.val}</div>
                        <div className="text-[8px] truncate">{item.label.split(' - ')[1]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. ESTRÉS (1 A 7) */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-400/20 text-blue-300 flex items-center justify-center text-[10px] font-black border border-blue-400/40">2</span>
                      <span>Nivel de Estrés</span>
                    </label>
                    <span className="text-blue-400 font-extrabold font-mono text-xs">{cinStress} / 7</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {[
                      { val: 1, label: '1 - Sin estrés' },
                      { val: 2, label: '2 - Bajo' },
                      { val: 3, label: '3 - Leve' },
                      { val: 4, label: '4 - Moderado' },
                      { val: 5, label: '5 - Medio-Alto' },
                      { val: 6, label: '6 - Alto' },
                      { val: 7, label: '7 - Muy alto' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setCinStress(item.val)}
                        className={`py-1.5 px-0.5 text-center rounded-lg border transition-all cursor-pointer font-bold ${
                          cinStress === item.val
                            ? 'bg-blue-500 text-white border-blue-400 shadow-md font-black'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-black">{item.val}</div>
                        <div className="text-[8px] truncate">{item.label.split(' - ')[1]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. FATIGA (1 A 7) */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-400/20 text-rose-300 flex items-center justify-center text-[10px] font-black border border-rose-400/40">3</span>
                      <span>Nivel de Fatiga</span>
                    </label>
                    <span className="text-rose-400 font-extrabold font-mono text-xs">{cinFatigue} / 7</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {[
                      { val: 1, label: '1 - Sin fatiga' },
                      { val: 2, label: '2 - Fresco' },
                      { val: 3, label: '3 - Normal' },
                      { val: 4, label: '4 - Cansancio' },
                      { val: 5, label: '5 - Fatigado' },
                      { val: 6, label: '6 - Muy fatigado' },
                      { val: 7, label: '7 - Agotamiento' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setCinFatigue(item.val)}
                        className={`py-1.5 px-0.5 text-center rounded-lg border transition-all cursor-pointer font-bold ${
                          cinFatigue === item.val
                            ? 'bg-rose-500 text-white border-rose-400 shadow-md font-black'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-black">{item.val}</div>
                        <div className="text-[8px] truncate">{item.label.split(' - ')[1]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. DOLOR MUSCULAR (1 A 7) */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-black border border-amber-500/40">4</span>
                      <span>Dolor Muscular</span>
                    </label>
                    <span className="text-amber-400 font-extrabold font-mono text-xs">{cinSoreness} / 7</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {[
                      { val: 1, label: '1 - Sin dolor' },
                      { val: 2, label: '2 - Mínimo' },
                      { val: 3, label: '3 - Leve' },
                      { val: 4, label: '4 - Moderado' },
                      { val: 5, label: '5 - Molestia' },
                      { val: 6, label: '6 - Dolor alto' },
                      { val: 7, label: '7 - Sobrecarga' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setCinSoreness(item.val)}
                        className={`py-1.5 px-0.5 text-center rounded-lg border transition-all cursor-pointer font-bold ${
                          cinSoreness === item.val
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-black">{item.val}</div>
                        <div className="text-[8px] truncate">{item.label.split(' - ')[1]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. NIVEL ENERGÍA */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center text-[10px] font-black border border-emerald-400/40">5</span>
                      <span>Nivel de Energía</span>
                    </label>
                    <span className="text-emerald-400 font-extrabold font-mono text-xs">{cinEnergyLevel} / 7</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {[
                      { val: 1, label: '1 (Mín)' },
                      { val: 2, label: '2' },
                      { val: 3, label: '3' },
                      { val: 4, label: '4 (Med)' },
                      { val: 5, label: '5' },
                      { val: 6, label: '6' },
                      { val: 7, label: '7 (Máx)' },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setCinEnergyLevel(item.val)}
                        className={`py-1.5 px-0.5 text-center rounded-lg border transition-all cursor-pointer font-bold ${
                          cinEnergyLevel === item.val
                            ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md font-black'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-black">{item.val}</div>
                        <div className="text-[8px] truncate">{item.label.includes('(') ? item.label.replace(/^[0-9]\s*/, '') : ''}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. ZONA DE MOLESTIA */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-400/20 text-purple-300 flex items-center justify-center text-[10px] font-black border border-purple-400/40">6</span>
                      <span>Zona de Molestia</span>
                    </label>
                    {cinPainArea && (
                      <button
                        type="button"
                        onClick={() => setCinPainArea('')}
                        className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        Limpiar zona
                      </button>
                    )}
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      'Sin molestia',
                      'Isquiotibial der.',
                      'Isquiotibial izq.',
                      'Cuádriceps',
                      'Aductor / Ingle',
                      'Gemelo der.',
                      'Gemelo izq.',
                      'Rodilla',
                      'Tobillo',
                      'Espalda baja / Lumbar',
                      'Púbis',
                    ].map((area) => {
                      const isSelected = area === 'Sin molestia' ? !cinPainArea : cinPainArea.includes(area);
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => {
                            if (area === 'Sin molestia') setCinPainArea('');
                            else setCinPainArea(area);
                          }}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-purple-900/60 text-purple-200 border-purple-600'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {area}
                        </button>
                      );
                    })}
                  </div>

                  <input
                    type="text"
                    value={cinPainArea}
                    onChange={(e) => setCinPainArea(e.target.value)}
                    placeholder="O escribe detalle específico (ej. Isquiotibial derecho, gemelo...)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder:text-slate-600 focus:outline-amber-400"
                  />
                </div>

                {/* Score Summary & Feedback Banner (Escala 1 a 7 -> 5 a 35 pts) */}
                {(() => {
                  const hooperScore = Math.min(35, Math.max(5,
                    Number(cinSleepScore) + (8 - Number(cinFatigue)) + (8 - Number(cinSoreness)) + (8 - Number(cinStress)) + Number(cinEnergyLevel)
                  ));
                  const isRed = Number(cinFatigue) >= 6 || Number(cinSoreness) >= 6 || Number(cinStress) >= 6 || Number(cinSleepScore) <= 2 || hooperScore < 19;
                  const isYellow = !isRed && (Number(cinFatigue) >= 4 || Number(cinSoreness) >= 4 || Number(cinStress) >= 5 || Number(cinSleepScore) <= 3 || hooperScore < 26);

                  return (
                    <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Índice Hooper / Bienestar Total</span>
                        <span className="text-sm font-black text-white font-mono">
                          {hooperScore} / 35 pts
                        </span>
                      </div>
                      <div>
                        {isRed ? (
                          <span className="px-2.5 py-1 bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-black rounded-lg">
                            ⚠️ ALERTA FATIGA / SOBRECARGA
                          </span>
                        ) : isYellow ? (
                          <span className="px-2.5 py-1 bg-yellow-950 text-yellow-300 border border-yellow-800 text-[10px] font-black rounded-lg">
                            ⚡ PRECAUCIÓN
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black rounded-lg">
                            ✓ ÓPTIMO PARA ENTRENAR
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Observaciones Adicionales</label>
                <input
                  type="text"
                  value={cinNotes}
                  onChange={(e) => setCinNotes(e.target.value)}
                  placeholder="Comentario sobre el descanso, sensaciones o molestia..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  id="cinReady"
                  checked={cinReady}
                  onChange={(e) => setCinReady(e.target.checked)}
                  className="accent-amber-400 w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="cinReady" className="text-xs text-white font-bold cursor-pointer">
                  Apto para completar la sesión completa de entrenamiento
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-amber-400 text-slate-950 font-black rounded-lg shadow-md hover:bg-amber-300 cursor-pointer"
                >
                  Guardar Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SINGLE CHECK-OUT (POST-ENTRENO / PSE & sRPE) */}
      {isCheckOutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400">Check-Out Post-Sesión</span>
                <h3 className="text-base font-extrabold text-white">
                  Percepción del Esfuerzo (PSE / Borg) & Carga
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckOutModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCheckOut} className="space-y-4 text-xs">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px]">Futbolista</span>
                  <span className="font-bold text-white text-sm">
                    {players.find((p) => p.id === targetPlayerId)?.nickname || 'Jugador'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Día & Fecha</span>
                  <span className="font-mono text-emerald-300 font-bold">{selectedDayName} ({selectedDate})</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo de Sesión</label>
                  <select
                    value={coutSessionType}
                    onChange={(e) => setCoutSessionType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  >
                    <option value="Entrenamiento">Entrenamiento en Cancha</option>
                    <option value="Fuerza / Gimnasio">Fuerza / Gimnasio</option>
                    <option value="Táctico">Trabajo Táctico</option>
                    <option value="Partido">Partido Oficial / Amistoso</option>
                    <option value="Recuperación">Recuperación Activa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duración (Minutos)</label>
                  <input
                    type="number"
                    min={10}
                    max={150}
                    value={coutDuration}
                    onChange={(e) => setCoutDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  />
                </div>
              </div>

              {/* Borg PSE Scale (0 to 10) */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200">
                    Escala de Borg (PSE / RPE):
                  </label>
                  <span className="text-xl font-black text-amber-400 font-mono">
                    {coutPse} / 10
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={10}
                  value={coutPse}
                  onChange={(e) => setCoutPse(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />

                <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                  <span>0 Reposo</span>
                  <span>3 Moderado</span>
                  <span>5 Duro</span>
                  <span>7 Muy Duro</span>
                  <span>10 Máximo</span>
                </div>

                <div className="pt-2 border-t border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400">
                    Carga sRPE resultante: <strong className="text-emerald-400 font-mono text-sm">{coutDuration * coutPse} U.A.</strong> (Minutos × PSE)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estado Post-Sesión</label>
                  <select
                    value={coutStatus}
                    onChange={(e) => setCoutStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  >
                    <option value="OK">OK (Sin novedad)</option>
                    <option value="Fatiga Normal">Fatiga Normal</option>
                    <option value="Sobrecarga">Sobrecarga Muscular</option>
                    <option value="Atención Kinesiológica">Atención Kinesiológica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Molestia Post (Opcional)</label>
                  <input
                    type="text"
                    value={coutPain}
                    onChange={(e) => setCoutPain(e.target.value)}
                    placeholder="ej. Fatiga en cuádriceps..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notas de la Sesión</label>
                <input
                  type="text"
                  value={coutNotes}
                  onChange={(e) => setCoutNotes(e.target.value)}
                  placeholder="Detalles sobre hidratación, ejercicios específicos..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckOutModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg shadow-md cursor-pointer"
                >
                  Guardar Check-Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Google Drive Form Import */}
      {isDriveImportOpen && (
        <DriveFormImportModal
          category={selectedCategory}
          onClose={() => setIsDriveImportOpen(false)}
          onSuccess={(count, day, type, targetDate) => {
            if (targetDate) {
              const monday = getMondayOfDate(targetDate);
              setCurrentWeekMonday(monday);
            }
            setActiveSubTab('matrix');
            setToastMessage({
              text: `¡Éxito! Se registraron ${count} futbolistas de ${selectedCategory} para el día ${day} (${type === 'checkin' ? 'Check-In' : 'Check-Out'}) desde el formulario Drive. Se visualiza de inmediato en la Matriz Semanal.`,
              type: 'success',
            });
            setTimeout(() => setToastMessage(null), 5000);
          }}
        />
      )}

      {/* Modal: PDF Export */}
      {isPdfModalOpen && (
        <WeeklyPhysicalPdfModal
          category={selectedCategory}
          weekRangeLabel={weekRangeLabel}
          weekDays={weekDays.map((d) => ({
            ...d,
            scheduleType: getDaySchedule(d.dateStr, d.key),
          }))}
          players={categoryPlayers}
          checkInsMap={checkInsMap}
          checkOutsMap={checkOutsMap}
          summary={weeklySummary}
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}
    </div>
  );
};

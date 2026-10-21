import React, { useState, useMemo } from 'react';
import { Player, WeeklyCheckInEntry, WeeklyCheckOutEntry, DayOfWeek } from '../../types/football';
import { useFootball } from '../../context/FootballContext';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  UserCheck, 
  X, 
  Calendar, 
  Clock, 
  Sparkles, 
  Check, 
  RefreshCw,
  HelpCircle,
  ClipboardPaste,
  FileText
} from 'lucide-react';
import { SanLuisLogo } from '../Common/SanLuisLogo';

interface DriveFormImportModalProps {
  category: string;
  onClose: () => void;
  onSuccess: (count: number, day: string, type: 'checkin' | 'checkout', targetDate?: string) => void;
}

interface ParsedFormRow {
  id: string;
  rawTimestamp: string;
  normalizedDate: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  rawPlayerName: string;
  matchedPlayerId: string | null;
  matchedPlayerName: string | null;
  confidence: 'high' | 'medium' | 'none';
  selected: boolean;

  // Check-In fields (Escala 1 a 7 para todos los apartados)
  sleepScore: number; // Sueño: Nota 1 a 7 (no en horas)
  stressLevel: number; // Estrés: Nota 1 a 7
  fatigue: number; // Fatiga: Nota 1 a 7
  muscleSoreness: number; // Dolor Muscular: Nota 1 a 7
  energyLevel: number; // Nivel Energía: 1 a 7 (1 "muy poca", 7 "mucha")
  painArea?: string; // Zona de molestia
  sleepHours?: number; // compatibilidad previa
  sleepQuality?: number; // compatibilidad previa
  mood?: number;
  wellnessScore: number;
  trafficLight: 'green' | 'yellow' | 'red';
  readyToTrain: boolean;

  // Check-Out fields
  sessionType: WeeklyCheckOutEntry['sessionType'];
  durationMinutes: number;
  pse: number;
  sessionRpeLoad: number;
  painPostSession?: string;
  status: WeeklyCheckOutEntry['status'];
  notes?: string;
}

// Normalizer utility for robust name / surname comparison
function normalizeStr(str?: string | null): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, ' ') // replace special chars with space
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper to determine day of week from date string (YYYY-MM-DD)
function getDayOfWeekFromDate(dateStr: string): DayOfWeek {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const days: DayOfWeek[] = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[d.getDay()] || 'Lunes';
  }
  return 'Lunes';
}

// Helper to parse dates like "13/10/2026 7:23:58" or "2026-10-13" or "13/10/26" into "2026-10-13"
function parseFormDate(raw?: string | null, fallbackDate: string = '2026-10-14'): { dateStr: string; day: DayOfWeek } {
  if (!raw || typeof raw !== 'string') {
    return { dateStr: fallbackDate, day: getDayOfWeekFromDate(fallbackDate) };
  }
  const clean = raw.trim();

  // Pattern DD/MM/YYYY or DD-MM-YYYY or DD/MM/YY
  const dmyMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let year = dmyMatch[3];
    if (year.length === 2) year = `20${year}`;
    const dateStr = `${year}-${month}-${day}`;
    return { dateStr, day: getDayOfWeekFromDate(dateStr) };
  }

  // Pattern YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return { dateStr, day: getDayOfWeekFromDate(dateStr) };
  }

  return { dateStr: fallbackDate, day: getDayOfWeekFromDate(fallbackDate) };
}

export const DriveFormImportModal: React.FC<DriveFormImportModalProps> = ({
  category,
  onClose,
  onSuccess
}) => {
  const { players, addWeeklyCheckInsBatch, addWeeklyCheckOutsBatch } = useFootball();

  // Squad of category for matching (safely includes Sub 20 <-> Proyección / Juvenil)
  const categoryPlayers = useMemo(() => {
    const normCategory = normalizeStr(category);
    return players.filter((p) => {
      const pCat = normalizeStr(p.category || '');
      if (pCat === normCategory) return true;
      if (
        (normCategory.includes('20') || normCategory.includes('proyeccion')) &&
        (pCat.includes('20') || pCat.includes('proyeccion') || pCat.includes('juvenil'))
      ) {
        return true;
      }
      return false;
    });
  }, [players, category]);

  // Mode: Auto, Check-in, or Check-out
  const [formType, setFormType] = useState<'auto' | 'checkin' | 'checkout'>('auto');
  const [detectedType, setDetectedType] = useState<'checkin' | 'checkout'>('checkin');

  // Input source: file or pasted text
  const [inputTab, setInputTab] = useState<'paste' | 'file'>('paste');
  const [pastedText, setPastedText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  // Target date filter: allow selecting which day to import ("ir subiendo día a día")
  const [targetDateFilter, setTargetDateFilter] = useState<string>('all');
  const [manualDate, setManualDate] = useState<string>('2026-10-14');

  // Parsed rows
  const [parsedRows, setParsedRows] = useState<ParsedFormRow[]>([]);
  const [availableDates, setAvailableDates] = useState<{ dateStr: string; label: string; count: number }[]>([]);
  const [hasParsed, setHasParsed] = useState<boolean>(false);

  // Match player by full name, surname, or email username
  const matchPlayer = (rawName?: string | null): { player: Player | null; confidence: 'high' | 'medium' | 'none' } => {
    if (!rawName || typeof rawName !== 'string') return { player: null, confidence: 'none' };

    let cleaned = rawName.trim();
    // If it's an email, extract local part
    if (cleaned.includes('@')) {
      cleaned = cleaned.split('@')[0].replace(/[._-]+/g, ' ');
    }

    const normInput = normalizeStr(cleaned);
    if (!normInput || normInput === 'nombres' || normInput === 'nombre' || normInput === 'apellidos') {
      return { player: null, confidence: 'none' };
    }

    const inputTokens = normInput.split(/\s+/).filter(Boolean);
    if (inputTokens.length === 0) return { player: null, confidence: 'none' };

    // Candidate pools: search category squad first, then all players
    const pool = categoryPlayers.length > 0 ? categoryPlayers : players;

    // 1. Exact match on full name or nickname in category pool
    for (const p of pool) {
      const pFirst = normalizeStr(p.firstName);
      const pLast = normalizeStr(p.lastName);
      const full = `${pFirst} ${pLast}`.trim();
      const reverse = `${pLast} ${pFirst}`.trim();
      const nick = normalizeStr(p.nickname);

      if (normInput === full || normInput === reverse || (nick && normInput === nick)) {
        return { player: p, confidence: 'high' };
      }
    }

    // 2. Surname matching in category pool
    for (const p of pool) {
      const pLast = normalizeStr(p.lastName);
      const surnameTokens = pLast.split(/\s+/).filter(Boolean);
      const pFirst = normalizeStr(p.firstName);
      const firstTokens = pFirst.split(/\s+/).filter(Boolean);

      // Check if primary surname or all surname tokens are present
      const matchesPrimarySurname = surnameTokens.length > 0 && inputTokens.includes(surnameTokens[0]);
      const matchesAnySurname = surnameTokens.some((st) => inputTokens.includes(st) && st.length >= 3);
      const matchesFirst = firstTokens.some((ft) => inputTokens.includes(ft) && ft.length >= 3);

      if (matchesPrimarySurname && matchesFirst) {
        return { player: p, confidence: 'high' };
      }
      if (matchesPrimarySurname) {
        // High confidence if only player with this surname in pool
        const countWithSurname = pool.filter((other) => normalizeStr(other.lastName).includes(surnameTokens[0])).length;
        return { player: p, confidence: countWithSurname === 1 ? 'high' : 'medium' };
      }
      if (matchesAnySurname) {
        return { player: p, confidence: 'medium' };
      }
    }

    // 3. Substring / Token containment in category pool
    for (const p of pool) {
      const pFirst = normalizeStr(p.firstName);
      const pLast = normalizeStr(p.lastName);

      if ((pLast && normInput.includes(pLast)) || (normInput.length >= 4 && pLast.includes(normInput))) {
        return { player: p, confidence: 'medium' };
      }
      if (pFirst && normInput.includes(pFirst) && inputTokens.length >= 2) {
        return { player: p, confidence: 'medium' };
      }
    }

    // 4. Global club pool fallback (if player was registered under different category)
    if (pool !== players) {
      for (const p of players) {
        const pFirst = normalizeStr(p.firstName);
        const pLast = normalizeStr(p.lastName);
        const full = `${pFirst} ${pLast}`.trim();
        const surnameTokens = pLast.split(/\s+/).filter(Boolean);

        if (normInput === full || (surnameTokens.length > 0 && inputTokens.includes(surnameTokens[0]))) {
          return { player: p, confidence: 'medium' };
        }
      }
    }

    return { player: null, confidence: 'none' };
  };

  // Process raw text into lines and fields
  const parseRawContent = (content: string) => {
    if (!content || typeof content !== 'string' || !content.trim()) return;

    try {
      const lines = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length === 0) return;

      // Detect delimiter: tab (\t), semicolon (;), comma (,), or regex multiple spaces
      const firstLine = lines[0];
      let delimiterType: '\t' | ';' | ',' | 'spaces' = '\t';
      if (firstLine.includes('\t')) {
        delimiterType = '\t';
      } else if (firstLine.includes(';') && (firstLine.match(/;/g)?.length || 0) >= (firstLine.match(/,/g)?.length || 0)) {
        delimiterType = ';';
      } else if (firstLine.includes(',')) {
        delimiterType = ',';
      } else if (/\s{2,}/.test(firstLine)) {
        delimiterType = 'spaces';
      }

      const splitLine = (l: string): string[] => {
        let items: string[] = [];
        if (delimiterType === 'spaces') {
          items = l.split(/\t|\s{2,}/);
        } else {
          items = l.split(delimiterType);
        }
        return items.map((c) => (c || '').trim().replace(/^["']|["']$/g, ''));
      };

      // Parse header to identify column indices
      const headerCols = splitLine(firstLine).map((c) => (c || '').trim().toLowerCase());
      const isHeaderPresent = headerCols.some((c) => 
        c.includes('nombre') || 
        c.includes('marca') || 
        c.includes('fecha') ||
        c.includes('sueño') || 
        c.includes('sueno') || 
        c.includes('pse') || 
        c.includes('fatiga') ||
        c.includes('jornada') ||
        c.includes('columna')
      );

      // Determine type: check-in vs check-out
      let detected: 'checkin' | 'checkout' = 'checkin';
      const headerText = headerCols.join(' ');
      if (formType === 'checkin') {
        detected = 'checkin';
      } else if (formType === 'checkout') {
        detected = 'checkout';
      } else {
        if (headerText.includes('pse') || headerText.includes('jornada') || headerText.includes('minutos')) {
          detected = 'checkout';
        } else {
          detected = 'checkin';
        }
      }
      setDetectedType(detected);

      // Column index finders
      let timestampIdx = headerCols.findIndex((c) => c.includes('marca') || c.includes('fecha') || c.includes('columna 1') || c.includes('timestamp') || c.includes('hora'));
      let nameIdx = headerCols.findIndex((c) => c.includes('nombre') || c.includes('jugador') || c.includes('columna 3') || c.includes('apellido') || c.includes('deportista') || c.includes('futbolista'));
      let sleepIdx = headerCols.findIndex((c) => c.includes('sueño') || c.includes('sueno') || c.includes('dormir') || c.includes('descanso'));
      let stressIdx = headerCols.findIndex((c) => c.includes('estrés') || c.includes('estres') || c.includes('stress'));
      let fatigueIdx = headerCols.findIndex((c) => c.includes('fatiga') || c.includes('cansancio'));
      let sorenessIdx = headerCols.findIndex((c) => c.includes('dolor') || c.includes('muscular') || c.includes('agujetas'));
      let energyIdx = headerCols.findIndex((c) => c.includes('energ') || c.includes('nivel'));
      let painZoneIdx = headerCols.findIndex((c) => c.includes('zona') || c.includes('específica') || c.includes('especifica') || c.includes('pre entrenamiento') || c.includes('molestia'));
      
      // Checkout columns
      let pseIdx = headerCols.findIndex((c) => c.includes('pse') || c.includes('rpe') || c.includes('esfuerzo'));
      let sessionTypeIdx = headerCols.findIndex((c) => c.includes('jornada') || c.includes('sesion') || c.includes('tipo') || c.includes('actividad'));
      let minutesIdx = headerCols.findIndex((c) => c.includes('minutos') || c.includes('duracion') || c.includes('juego') || c.includes('tiempo'));
      let observationsIdx = headerCols.findIndex((c) => c.includes('observ') || c.includes('malestar') || c.includes('informar') || c.includes('comentario'));

      // If no header detected, assign defaults based on Google Forms structure
      if (!isHeaderPresent) {
        const sampleCols = splitLine(lines[0]);
        const emailInCol1 = sampleCols[1] && sampleCols[1].includes('@');

        if (detected === 'checkin') {
          timestampIdx = 0;
          nameIdx = emailInCol1 ? 2 : 1;
          sleepIdx = emailInCol1 ? 4 : 3;
          stressIdx = emailInCol1 ? 5 : 4;
          fatigueIdx = emailInCol1 ? 6 : 5;
          sorenessIdx = emailInCol1 ? 7 : 6;
          energyIdx = emailInCol1 ? 8 : 7;
          painZoneIdx = emailInCol1 ? 9 : 8;
        } else {
          timestampIdx = 0;
          nameIdx = emailInCol1 ? 2 : 1;
          sessionTypeIdx = emailInCol1 ? 3 : 2;
          pseIdx = emailInCol1 ? 5 : 4;
          observationsIdx = emailInCol1 ? 6 : 5;
          minutesIdx = emailInCol1 ? 8 : 7;
        }
      } else {
        // Fallback column positions if not explicitly mapped
        if (timestampIdx === -1) timestampIdx = 0;
        if (nameIdx === -1) {
          const sampleCols = splitLine(lines[0]);
          nameIdx = (sampleCols[1] && sampleCols[1].includes('@')) ? 2 : 1;
        }
      }

      const dataLines = isHeaderPresent ? lines.slice(1) : lines;
      const parsed: ParsedFormRow[] = [];
      const dateSet = new Map<string, { label: string; count: number }>();

      dataLines.forEach((line, idx) => {
        const cols = splitLine(line);
        if (cols.length < 2) return;

        const rawTimestamp = cols[timestampIdx] || '';
        let rawName = cols[nameIdx] || cols[1] || '';
        if (rawName.includes('@') && cols[nameIdx + 1] && !cols[nameIdx + 1].includes('@')) {
          rawName = cols[nameIdx + 1];
        }
        if (!rawName || (rawName || '').toLowerCase() === 'nombres' || (rawName || '').toLowerCase() === 'nombre') return;

        const { dateStr, day } = parseFormDate(rawTimestamp, manualDate);

        // Track dates
        const currentCount = dateSet.get(dateStr)?.count || 0;
        dateSet.set(dateStr, {
          label: `${day} ${dateStr}`,
          count: currentCount + 1,
        });

        const { player, confidence } = matchPlayer(rawName);

        // Check-In fields (Escala 1 a 7 para todos los apartados)
        const rawSleep = sleepIdx !== -1 && cols[sleepIdx] ? parseFloat(cols[sleepIdx]) || 5 : 5;
        const sleepScore = Math.min(7, Math.max(1, Math.round(rawSleep)));
        const rawStress = stressIdx !== -1 && cols[stressIdx] ? parseFloat(cols[stressIdx]) || 1 : 1;
        const stressVal = Math.min(7, Math.max(1, Math.round(rawStress)));
        const rawFatigue = fatigueIdx !== -1 && cols[fatigueIdx] ? parseFloat(cols[fatigueIdx]) || 2 : 2;
        const fatigueVal = Math.min(7, Math.max(1, Math.round(rawFatigue)));
        const rawSoreness = sorenessIdx !== -1 && cols[sorenessIdx] ? parseFloat(cols[sorenessIdx]) || 2 : 2;
        const sorenessVal = Math.min(7, Math.max(1, Math.round(rawSoreness)));
        const rawEnergy = energyIdx !== -1 && cols[energyIdx] ? parseFloat(cols[energyIdx]) || 6 : 6;
        const energyVal = Math.min(7, Math.max(1, Math.round(rawEnergy)));

        const rawPain = (painZoneIdx !== -1 && cols[painZoneIdx]) ? cols[painZoneIdx] : '';
        const cleanPain = (rawPain || '').toLowerCase();
        const painArea = rawPain && rawPain !== '-' && rawPain !== 'nada.' && rawPain !== 'no' && !cleanPain.includes('ningun') ? rawPain : undefined;

        // Score Hooper 5-35: Sueño (1-7) + (8 - fatiga) + (8 - dolor) + (8 - estrés) + energía (1-7)
        const score = Math.min(35, Math.max(5, sleepScore + (8 - fatigueVal) + (8 - sorenessVal) + (8 - stressVal) + energyVal));
        const trafficLight = fatigueVal >= 6 || sorenessVal >= 6 || stressVal >= 6 || sleepScore <= 2 || score < 19
          ? 'red'
          : (fatigueVal >= 4 || sorenessVal >= 4 || stressVal >= 5 || sleepScore <= 3 || score < 26 ? 'yellow' : 'green');

        // Check-Out fields
        const rawPse = (pseIdx !== -1 && cols[pseIdx]) ? parseFloat(cols[pseIdx]) : 7;
        const pse = isNaN(rawPse) ? 7 : Math.min(10, Math.max(0, rawPse));
        
        const rawSession = (sessionTypeIdx !== -1 && cols[sessionTypeIdx]) ? cols[sessionTypeIdx] : 'Entrenamiento';
        const cleanSession = (rawSession || '').toLowerCase();
        let sessionType: WeeklyCheckOutEntry['sessionType'] = 'Entrenamiento';
        if (cleanSession.includes('kinesio')) sessionType = 'Recuperación';
        else if (cleanSession.includes('compet') || cleanSession.includes('partido')) sessionType = 'Partido';
        else if (cleanSession.includes('fuerza') || cleanSession.includes('gim')) sessionType = 'Fuerza / Gimnasio';
        else if (cleanSession.includes('tact')) sessionType = 'Táctico';

        // Duration & Minutos
        let dur = 80;
        if (minutesIdx !== -1 && cols[minutesIdx]) {
          const minStr = (cols[minutesIdx] || '').replace(/[^0-9]/g, '');
          const parsedMin = parseInt(minStr, 10);
          if (!isNaN(parsedMin) && parsedMin > 0) dur = parsedMin;
        }
        if (sessionType === 'Partido' && dur < 60) dur = 90;

        const rawObs = (observationsIdx !== -1 && cols[observationsIdx]) ? cols[observationsIdx] : '';
        const cleanObs = (rawObs || '').toLowerCase();
        const painPost = rawObs && rawObs !== '-' && rawObs !== 'nada.' && rawObs !== 'no' && !cleanObs.includes('ninguna') ? rawObs : undefined;
        
        let status: WeeklyCheckOutEntry['status'] = 'OK';
        if (sessionType === 'Recuperación' || cleanSession.includes('kinesio')) status = 'Atención Kinesiológica';
        else if (pse >= 9 || (painPost && painPost.length > 3)) status = 'Sobrecarga';
        else if (pse >= 7) status = 'Fatiga Normal';

        parsed.push({
          id: `row-${idx}-${Date.now()}`,
          rawTimestamp,
          normalizedDate: dateStr,
          dayOfWeek: day,
          rawPlayerName: rawName,
          matchedPlayerId: player ? player.id : null,
          matchedPlayerName: player ? `${player.firstName} ${player.lastName}` : null,
          confidence,
          selected: true,
          sleepScore,
          stressLevel: stressVal,
          fatigue: fatigueVal,
          muscleSoreness: sorenessVal,
          energyLevel: energyVal,
          painArea,
          sleepHours: sleepScore >= 4 ? 8 : 7,
          sleepQuality: sleepScore,
          mood: Math.min(5, Math.max(1, Math.round((energyVal / 7) * 5))),
          wellnessScore: score,
          trafficLight,
          readyToTrain: trafficLight !== 'red',
          sessionType,
          durationMinutes: dur,
          pse,
          sessionRpeLoad: dur * pse,
          painPostSession: painPost,
          status,
          notes: `Importado de formulario Drive (${rawTimestamp})`,
        });
      });

      setParsedRows(parsed);
      setHasParsed(true);

      const datesList = Array.from(dateSet.entries()).map(([dateStr, meta]) => ({
        dateStr,
        label: meta.label,
        count: meta.count,
      }));
      setAvailableDates(datesList);

      // If only one date is present, select it automatically for day-to-day upload
      if (datesList.length === 1) {
        setTargetDateFilter(datesList[0].dateStr);
      } else if (datesList.length > 1) {
        setTargetDateFilter(datesList[0].dateStr);
      }
    } catch (err) {
      console.error('Error procesando formulario Drive:', err);
    }
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setPastedText(text);
        parseRawContent(text);
      }
    };
    reader.readAsText(file);
  };

  // Paste trigger
  const handleParsePasted = () => {
    parseRawContent(pastedText);
  };

  // Filtered rows for current date selection ("ir subiendo día a día")
  const filteredRows = useMemo(() => {
    if (targetDateFilter === 'all') return parsedRows;
    return parsedRows.filter((r) => r.normalizedDate === targetDateFilter);
  }, [parsedRows, targetDateFilter]);

  // Player selection change in table
  const handleRowPlayerChange = (rowId: string, playerId: string) => {
    setParsedRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const pl = players.find((p) => p.id === playerId);
        return {
          ...r,
          matchedPlayerId: playerId || null,
          matchedPlayerName: pl ? `${pl.firstName} ${pl.lastName}` : null,
          confidence: playerId ? 'high' : 'none',
        };
      })
    );
  };

  const handleToggleRow = (rowId: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleToggleAll = (select: boolean) => {
    setParsedRows((prev) =>
      prev.map((r) => {
        if (targetDateFilter !== 'all' && r.normalizedDate !== targetDateFilter) return r;
        return { ...r, selected: select };
      })
    );
  };

  // Final confirmation: batch save
  const handleConfirmImport = () => {
    const rowsToImport = filteredRows.filter((r) => r.selected && r.matchedPlayerId);
    if (rowsToImport.length === 0) return;

    if (detectedType === 'checkin') {
      const checkinEntries: Omit<WeeklyCheckInEntry, 'id' | 'createdAt'>[] = rowsToImport.map((r) => ({
        playerId: r.matchedPlayerId!,
        playerName: r.matchedPlayerName || r.rawPlayerName,
        category,
        date: r.normalizedDate,
        dayOfWeek: r.dayOfWeek,
        sleepScore: r.sleepScore,
        stressLevel: r.stressLevel,
        fatigue: r.fatigue,
        muscleSoreness: r.muscleSoreness,
        energyLevel: r.energyLevel,
        painArea: r.painArea,
        wellnessScore: r.wellnessScore,
        trafficLight: r.trafficLight,
        readyToTrain: r.readyToTrain,
        sleepHours: r.sleepHours ?? (r.sleepScore >= 4 ? 8 : 7),
        sleepQuality: r.sleepScore,
        mood: r.mood ?? 4,
        notes: r.notes,
      }));

      addWeeklyCheckInsBatch(checkinEntries);
      const targetDate = rowsToImport[0].normalizedDate;
      onSuccess(checkinEntries.length, rowsToImport[0].dayOfWeek, 'checkin', targetDate);
    } else {
      const checkoutEntries: Omit<WeeklyCheckOutEntry, 'id' | 'createdAt'>[] = rowsToImport.map((r) => ({
        playerId: r.matchedPlayerId!,
        playerName: r.matchedPlayerName || r.rawPlayerName,
        category,
        date: r.normalizedDate,
        dayOfWeek: r.dayOfWeek,
        sessionType: r.sessionType,
        durationMinutes: r.durationMinutes,
        pse: r.pse,
        sessionRpeLoad: r.sessionRpeLoad,
        painPostSession: r.painPostSession,
        status: r.status,
        notes: r.notes,
      }));

      addWeeklyCheckOutsBatch(checkoutEntries);
      const targetDate = rowsToImport[0].normalizedDate;
      onSuccess(checkoutEntries.length, rowsToImport[0].dayOfWeek, 'checkout', targetDate);
    }

    onClose();
  };

  // Statistics of recognition
  const matchedCount = filteredRows.filter((r) => r.matchedPlayerId !== null).length;
  const totalCount = filteredRows.length;
  const isAllMatched = matchedCount === totalCount && totalCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl my-6 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-950/40">
              <FileSpreadsheet className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                  Google Drive / Google Forms
                </span>
                <span className="text-xs font-bold text-slate-400">
                  Categoría {category}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                Carga Automática de Formulario Drive (Check-In & Check-Out)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-200">
          {/* Instructions banner */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-xs">
                Identificación Automática por Apellidos y Subida Día a Día
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                Pega directamente las filas de respuestas de Google Sheets (Ctrl+C y Ctrl+V) o sube el archivo CSV exportado desde Google Drive. El sistema reconoce automáticamente los apellidos de los futbolistas de la {category} y te permite ir registrando fecha a fecha.
              </p>
            </div>
          </div>

          {/* Form Type & Import Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="block text-slate-400 font-bold mb-1.5 text-[11px]">
                Tipo de Formulario Drive:
              </label>
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormType('auto')}
                  className={`flex-1 py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${
                    formType === 'auto' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('checkin')}
                  className={`flex-1 py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${
                    formType === 'checkin' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Check-In
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('checkout')}
                  className={`flex-1 py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${
                    formType === 'checkout' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Check-Out
                </button>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="block text-slate-400 font-bold mb-1.5 text-[11px]">
                Modo de Entrada:
              </label>
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setInputTab('paste')}
                  className={`flex-1 py-1 text-[11px] font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    inputTab === 'paste' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Pegar Celdas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputTab('file')}
                  className={`flex-1 py-1 text-[11px] font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    inputTab === 'file' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir CSV</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="block text-slate-400 font-bold mb-1.5 text-[11px]">
                Subir Día a Día (Fecha a Registrar):
              </label>
              {availableDates.length > 0 ? (
                <select
                  value={targetDateFilter}
                  onChange={(e) => setTargetDateFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-bold text-amber-300 focus:outline-amber-400 cursor-pointer"
                >
                  <option value="all">Todas las fechas del formulario ({parsedRows.length})</option>
                  {availableDates.map((d) => (
                    <option key={d.dateStr} value={d.dateStr}>
                      📅 {d.label} ({d.count} futbolistas)
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-bold text-white focus:outline-emerald-500"
                />
              )}
            </div>
          </div>

          {/* Paste or Upload Area */}
          {inputTab === 'paste' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">
                  Pega aquí el contenido copiado de la hoja de Google Drive:
                </span>
                {pastedText && (
                  <button
                    type="button"
                    onClick={() => {
                      setPastedText('');
                      setParsedRows([]);
                      setHasParsed(false);
                      setAvailableDates([]);
                    }}
                    className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Limpiar texto
                  </button>
                )}
              </div>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Copia las filas desde Google Sheets (con o sin encabezados) y pégalas aquí... Ej:&#10;13/10/2026 7:23:58   DAVID ARAVENA   Proyección   1   1   1   1   6&#10;13/10/2026 7:44:19   DIEGO IRRAZABAL Proyección   3   2   2   3   6"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-white placeholder:text-slate-600 focus:outline-amber-400"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={!pastedText.trim()}
                  onClick={handleParsePasted}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-950/50 cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Procesar e Identificar Jugadores</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-800 hover:border-amber-400/60 rounded-2xl p-6 text-center bg-slate-950/60 transition-colors">
              <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="font-bold text-white text-xs">
                Selecciona el archivo CSV o de texto de Google Drive
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Descargado directamente desde Google Sheets (Archivo &gt; Descargar &gt; Valores separados por comas .csv)
              </p>
              <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer transition-colors">
                <FileText className="w-4 h-4" />
                <span>{fileName ? `Archivo: ${fileName}` : 'Buscar archivo CSV en el equipo...'}</span>
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Recognition Results & Preview */}
          {hasParsed && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${
                    isAllMatched ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {isAllMatched ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-xs">
                      {detectedType === 'checkin' ? 'Check-In Matutino (Bienestar)' : 'Check-Out Vespertino (Carga & PSE)'} • {matchedCount} de {totalCount} futbolistas identificados
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {targetDateFilter !== 'all' ? `Subiendo día específico: ${targetDateFilter}` : 'Mostrando todos los días'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleToggleAll(true)}
                    className="text-amber-400 hover:underline cursor-pointer"
                  >
                    Seleccionar todos
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => handleToggleAll(false)}
                    className="text-slate-400 hover:underline cursor-pointer"
                  >
                    Deseleccionar
                  </button>
                </div>
              </div>

              {/* Table Preview */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-300 text-[10px] font-black uppercase sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5 w-8 text-center">✓</th>
                      <th className="p-2.5">Nombre en Formulario Drive</th>
                      <th className="p-2.5">Futbolista Identificado ({category})</th>
                      <th className="p-2.5 text-center">Fecha / Día</th>
                      {detectedType === 'checkin' ? (
                        <>
                          <th className="p-2.5 text-center">Sueño (Nota 1-7)</th>
                          <th className="p-2.5 text-center">Estrés (1-7)</th>
                          <th className="p-2.5 text-center">Fatiga (1-7)</th>
                          <th className="p-2.5 text-center">Dolor Musc. (1-7)</th>
                          <th className="p-2.5 text-center">Energía (1-7)</th>
                          <th className="p-2.5 text-center">Zona Molestia</th>
                          <th className="p-2.5 text-center">Semáforo</th>
                        </>
                      ) : (
                        <>
                          <th className="p-2.5 text-center">Jornada</th>
                          <th className="p-2.5 text-center">Minutos</th>
                          <th className="p-2.5 text-center">PSE (0-10)</th>
                          <th className="p-2.5 text-center">Carga (sRPE)</th>
                          <th className="p-2.5">Molestias / Notas</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono text-[11px]">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-6 text-center text-slate-500 italic">
                          No hay registros para la fecha seleccionada ({targetDateFilter}).
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => (
                        <tr key={row.id} className={`hover:bg-slate-800/40 transition-colors ${!row.matchedPlayerId ? 'bg-rose-950/20' : ''}`}>
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={() => handleToggleRow(row.id)}
                              className="accent-amber-400 rounded cursor-pointer w-3.5 h-3.5"
                            />
                          </td>

                          {/* Raw Name from Drive */}
                          <td className="p-2 font-bold text-white truncate max-w-[140px]" title={row.rawPlayerName}>
                            {row.rawPlayerName}
                          </td>

                          {/* Matched player dropdown */}
                          <td className="p-2">
                            <select
                              value={row.matchedPlayerId || ''}
                              onChange={(e) => handleRowPlayerChange(row.id, e.target.value)}
                              className={`w-full text-xs font-sans font-bold rounded-lg px-2 py-1 border transition-colors cursor-pointer ${
                                row.confidence === 'high'
                                  ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-200'
                                  : row.confidence === 'medium'
                                  ? 'bg-amber-950/60 border-amber-700/80 text-amber-200'
                                  : 'bg-rose-950/60 border-rose-700/80 text-rose-300'
                              }`}
                            >
                              <option value="">⚠️ Sin identificar (elegir...)</option>
                              <optgroup label={`Plantel ${category}`}>
                                {categoryPlayers.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    #{p.squadNumber} {(p.lastName || '').toUpperCase()}, {p.firstName || ''} ({p.primaryPosition || ''})
                                  </option>
                                ))}
                              </optgroup>
                              {players.filter((p) => !categoryPlayers.some((cp) => cp.id === p.id)).length > 0 && (
                                <optgroup label="Otras Categorías del Club">
                                  {players
                                    .filter((p) => !categoryPlayers.some((cp) => cp.id === p.id))
                                    .map((p) => (
                                      <option key={p.id} value={p.id}>
                                        #{p.squadNumber} {(p.lastName || '').toUpperCase()}, {p.firstName || ''} ({p.category})
                                      </option>
                                    ))}
                                </optgroup>
                              )}
                            </select>
                          </td>

                          {/* Date */}
                          <td className="p-2 text-center text-slate-400 whitespace-nowrap">
                            {row.dayOfWeek.slice(0, 3)} {row.normalizedDate.slice(5)}
                          </td>

                          {detectedType === 'checkin' ? (
                            <>
                              <td className="p-2 text-center font-bold text-amber-300">Nota {row.sleepScore}/7</td>
                              <td className="p-2 text-center font-bold text-blue-300">{row.stressLevel}/7</td>
                              <td className="p-2 text-center font-bold text-slate-300">{row.fatigue}/7</td>
                              <td className="p-2 text-center font-bold text-slate-300">{row.muscleSoreness}/7</td>
                              <td className="p-2 text-center font-bold text-emerald-300">{row.energyLevel}/7</td>
                              <td className="p-2 text-center text-slate-300 truncate max-w-[130px]">
                                {row.painArea ? (
                                  <span className="text-amber-300 font-sans font-bold text-[10px] bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800" title={row.painArea}>
                                    {row.painArea}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">-</span>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black ${
                                  row.trafficLight === 'green'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : row.trafficLight === 'yellow'
                                    ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                                    : 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                                }`}>
                                  {row.trafficLight === 'green' ? 'OK' : row.trafficLight === 'yellow' ? 'ALERTA' : 'CRÍTICO'}
                                </span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-2 text-center font-sans text-slate-300">{row.sessionType}</td>
                              <td className="p-2 text-center font-bold text-white">{row.durationMinutes}'</td>
                              <td className="p-2 text-center font-black">
                                <span className={`px-1.5 py-0.5 rounded text-white ${
                                  row.pse >= 8 ? 'bg-rose-600' : row.pse >= 6 ? 'bg-amber-500 text-black' : 'bg-emerald-600'
                                }`}>
                                  {row.pse}
                                </span>
                              </td>
                              <td className="p-2 text-center font-bold text-amber-300">{row.sessionRpeLoad} UA</td>
                              <td className="p-2 text-slate-300 font-sans truncate max-w-[150px]">
                                {row.painPostSession || row.status}
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            {hasParsed && (
              <span>
                Listos para registrar: <strong className="text-white">{filteredRows.filter((r) => r.selected && r.matchedPlayerId).length}</strong> futbolistas
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={!hasParsed || filteredRows.filter((r) => r.selected && r.matchedPlayerId).length === 0}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/50 cursor-pointer transition-all"
            >
              <Check className="w-4 h-4" />
              <span>
                Confirmar y Registrar {filteredRows.filter((r) => r.selected && r.matchedPlayerId).length} Registros ({detectedType === 'checkin' ? 'Check-In' : 'Check-Out'})
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

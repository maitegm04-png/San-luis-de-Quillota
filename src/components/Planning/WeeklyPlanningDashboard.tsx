import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllowedCategories } from '../../types/auth';
import { 
  PlanningArea, 
  WeeklyCategoryPlan, 
  DayOfWeek, 
  DAYS_OF_WEEK, 
  CARGA_OPTIONS, 
  PRE_SESION_FISICA_OPTIONS, 
  SESION_FISICA_OPTIONS, 
  COMPLEMENTARIO_FISICA_OPTIONS, 
  ARQUEROS_OBJETIVOS, 
  ARQUEROS_PRE_OPTIONS, 
  ARQUEROS_SESION_OPTIONS, 
  TECNICA_ESTRUCTURA_OPTIONS 
} from '../../types/planning';
import { createEmptyWeeklyPlan, getCurrentWeekNumber, getWeekDates } from '../../data/planningDefaults';
import { db } from '../../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { SanLuisLogo } from '../Common/SanLuisLogo';
import { FirebaseQuotaBadge } from '../Common/FirebaseQuotaBadge';
import { exportPlanningToPdf } from '../../services/planningPdfGenerator';
import { canPerformFirebaseWrite, recordQuotaOperation, hasDataChanged } from '../../services/firebaseQuotaGuard';
import { cleanForFirestore } from '../../utils/firestoreSanitizer';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Printer, 
  RotateCcw, 
  Check, 
  Dumbbell, 
  Shield, 
  Crosshair, 
  Sparkles, 
  Cloud, 
  FileSpreadsheet, 
  AlertCircle,
  Download,
  FileText,
  Layers
} from 'lucide-react';

const CATEGORIES_LIST = [
  'Sub 11-12',
  'Sub 13-14',
  'Sub 15-16',
  'Sub 18',
  'Sub 20'
];

export const WeeklyPlanningDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const isCoordinator = currentUser?.role === 'Coordinador General' || currentUser?.category === 'Todas';
  const allowedCategories = getAllowedCategories(currentUser?.category);

  // Available categories for this user
  const availableCategories = useMemo(() => {
    if (isCoordinator) return CATEGORIES_LIST;
    if (currentUser?.category && CATEGORIES_LIST.includes(currentUser.category)) {
      return [currentUser.category];
    }
    // Match Sub 11 or Sub 12 -> Sub 11-12, etc.
    const matching = CATEGORIES_LIST.filter((catGroup) => {
      if (catGroup === 'Sub 11-12') return allowedCategories.includes('Sub 11') || allowedCategories.includes('Sub 12');
      if (catGroup === 'Sub 13-14') return allowedCategories.includes('Sub 13') || allowedCategories.includes('Sub 14');
      if (catGroup === 'Sub 15-16') return allowedCategories.includes('Sub 15') || allowedCategories.includes('Sub 16');
      if (catGroup === 'Sub 18') return allowedCategories.includes('Sub 18');
      if (catGroup === 'Sub 20') return allowedCategories.includes('Sub 20');
      return false;
    });
    return matching.length > 0 ? matching : ['Sub 13-14'];
  }, [isCoordinator, currentUser?.category, allowedCategories]);

  const [selectedCategory, setSelectedCategory] = useState<string>(availableCategories[0] || 'Sub 13-14');
  const currentWeekInfo = getCurrentWeekNumber();
  const [selectedYear, setSelectedYear] = useState<number>(currentWeekInfo.year);
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeekInfo.week);
  const [activeArea, setActiveArea] = useState<PlanningArea>('tecnica');

  // Active plan state
  const [plan, setPlan] = useState<WeeklyCategoryPlan>(() => 
    createEmptyWeeklyPlan(selectedCategory, selectedYear, selectedWeek)
  );

  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [printScope, setPrintScope] = useState<'current' | 'all'>('current');
  const [viewMode, setViewMode] = useState<'edit' | 'clean'>('edit');

  const planId = `plan-${selectedCategory.replace(/\s+/g, '_')}-${selectedYear}-W${String(selectedWeek).padStart(2, '0')}`;

  // Real-time Firestore sync & local storage cache
  useEffect(() => {
    const storageKey = `slq_plan_${planId}`;
    let loadedFromStorage = false;

    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        setPlan(JSON.parse(cached));
        loadedFromStorage = true;
      }
    } catch {
      // ignore
    }

    if (!loadedFromStorage) {
      setPlan(createEmptyWeeklyPlan(selectedCategory, selectedYear, selectedWeek));
    }

    // Subscribe to Firestore for real-time team collaboration with quota tracking
    const unsub = onSnapshot(doc(db, 'weekly_plans', planId), (snapshot) => {
      recordQuotaOperation('read', 1);
      if (snapshot.exists()) {
        const remoteData = snapshot.data() as WeeklyCategoryPlan;
        setPlan(remoteData);
        localStorage.setItem(storageKey, JSON.stringify(remoteData));
      }
    }, (err) => {
      console.warn('Firestore weekly plan listener offline fallback', err);
    });

    return () => unsub();
  }, [planId, selectedCategory, selectedYear, selectedWeek]);

  // Dates for the current week
  const weekDays = useMemo(() => {
    return getWeekDates(selectedYear, selectedWeek);
  }, [selectedYear, selectedWeek]);

  // Save changes to Firestore & local storage with quota protection
  const handleSavePlan = async () => {
    setIsSaving(true);
    setSaveError(null);
    const updatedPlan: WeeklyCategoryPlan = {
      ...plan,
      id: planId,
      category: selectedCategory,
      year: selectedYear,
      weekNumber: selectedWeek,
      updatedAt: new Date().toISOString(),
      authorName: currentUser?.name || 'Cuerpo Técnico'
    };

    try {
      const storageKey = `slq_plan_${planId}`;
      const previousRaw = localStorage.getItem(storageKey);
      const isDifferent = previousRaw ? hasDataChanged(JSON.parse(previousRaw), updatedPlan) : true;

      // Always persist instantly in local storage
      localStorage.setItem(storageKey, JSON.stringify(updatedPlan));

      // Guard: Only write to Firebase if data changed and quota limit allows it
      if (isDifferent && canPerformFirebaseWrite()) {
        const sanitizedPlan = cleanForFirestore(updatedPlan);
        await setDoc(doc(db, 'weekly_plans', planId), sanitizedPlan, { merge: true });
        recordQuotaOperation('write', 1);
      }

      setIsSaved(true);
      setSaveError(null);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (e: any) {
      console.error('Error guardando planificación:', e);
      setIsSaved(false);
      setSaveError(e?.message || 'Error al sincronizar con la nube');
      setTimeout(() => setSaveError(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const success = await exportPlanningToPdf(printRef.current, {
        category: selectedCategory,
        year: selectedYear,
        week: selectedWeek,
        areaTitle: printScope === 'all' ? 'Microciclo Completo' : activeArea.toUpperCase(),
      });
      if (!success) {
        alert('Para imprimir o guardar en PDF de forma alternativa, pulse "Imprimir" y elija "Guardar como PDF".');
      }
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Week navigation
  const handlePrevWeek = () => {
    if (selectedWeek > 1) {
      setSelectedWeek(selectedWeek - 1);
    } else {
      setSelectedYear(selectedYear - 1);
      setSelectedWeek(52);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeek < 52) {
      setSelectedWeek(selectedWeek + 1);
    } else {
      setSelectedYear(selectedYear + 1);
      setSelectedWeek(1);
    }
  };

  const handleGoCurrentWeek = () => {
    const cur = getCurrentWeekNumber();
    setSelectedYear(cur.year);
    setSelectedWeek(cur.week);
  };

  // Mutators for Technical Area
  const updateTechnicalField = (dayKey: DayOfWeek, field: 'sesionTitulo' | 'isFreeDay', value: any) => {
    setPlan((prev) => {
      const currentDay = prev.tecnica[dayKey];
      const updatedDay = { ...currentDay, [field]: value };
      if (field === 'isFreeDay' && value === true) {
        updatedDay.sesionTitulo = 'LIBRE';
      }
      return {
        ...prev,
        tecnica: {
          ...prev.tecnica,
          [dayKey]: updatedDay
        }
      };
    });
  };

  const updateTechnicalBlock = (dayKey: DayOfWeek, blockIndex: number, field: 'estructura' | 'modulo', value: string) => {
    setPlan((prev) => {
      const currentDay = prev.tecnica[dayKey];
      const newBloques = [...currentDay.bloques];
      newBloques[blockIndex] = { ...newBloques[blockIndex], [field]: value };
      return {
        ...prev,
        tecnica: {
          ...prev.tecnica,
          [dayKey]: { ...currentDay, bloques: newBloques }
        }
      };
    });
  };

  // Mutators for Physical Area
  const updatePhysicalDay = (dayKey: DayOfWeek, field: string, value: any) => {
    setPlan((prev) => {
      const currentDay = prev.fisica[dayKey];
      const updatedDay = { ...currentDay, [field]: value };
      if (field === 'isFreeDay' && value === true) {
        updatedDay.cargaDelDia = 'Descanso / LIBRE';
      }
      return {
        ...prev,
        fisica: {
          ...prev.fisica,
          [dayKey]: updatedDay
        }
      };
    });
  };

  const updatePhysicalPre = (dayKey: DayOfWeek, field: 'tipo' | 'descripcion', value: string) => {
    setPlan((prev) => {
      const currentDay = prev.fisica[dayKey];
      return {
        ...prev,
        fisica: {
          ...prev.fisica,
          [dayKey]: {
            ...currentDay,
            preSesion: { ...currentDay.preSesion, [field]: value }
          }
        }
      };
    });
  };

  const updatePhysicalBlock = (dayKey: DayOfWeek, blockIndex: number, field: 'tipo' | 'descripcion', value: string) => {
    setPlan((prev) => {
      const currentDay = prev.fisica[dayKey];
      const newBloques = [...currentDay.sesion.bloques];
      newBloques[blockIndex] = { ...newBloques[blockIndex], [field]: value };
      return {
        ...prev,
        fisica: {
          ...prev.fisica,
          [dayKey]: {
            ...currentDay,
            sesion: { ...currentDay.sesion, bloques: newBloques }
          }
        }
      };
    });
  };

  const updatePhysicalComp = (dayKey: DayOfWeek, field: 'tipo' | 'descripcion', value: string) => {
    setPlan((prev) => {
      const currentDay = prev.fisica[dayKey];
      return {
        ...prev,
        fisica: {
          ...prev.fisica,
          [dayKey]: {
            ...currentDay,
            complementario: { ...currentDay.complementario, [field]: value }
          }
        }
      };
    });
  };

  // Mutators for Goalkeepers Area
  const updateGoalkeeperDay = (dayKey: DayOfWeek, field: string, value: any) => {
    setPlan((prev) => {
      const currentDay = prev.arqueros[dayKey];
      const updatedDay = { ...currentDay, [field]: value };
      if (field === 'isFreeDay' && value === true) {
        updatedDay.objetivoDelDia = 'LIBRE';
      }
      return {
        ...prev,
        arqueros: {
          ...prev.arqueros,
          [dayKey]: updatedDay
        }
      };
    });
  };

  const updateGoalkeeperPre = (dayKey: DayOfWeek, field: 'tipo' | 'descripcion', value: string) => {
    setPlan((prev) => {
      const currentDay = prev.arqueros[dayKey];
      return {
        ...prev,
        arqueros: {
          ...prev.arqueros,
          [dayKey]: {
            ...currentDay,
            preSesion: { ...currentDay.preSesion, [field]: value }
          }
        }
      };
    });
  };

  const updateGoalkeeperBlock = (dayKey: DayOfWeek, blockIndex: number, field: 'tipo' | 'descripcion', value: string) => {
    setPlan((prev) => {
      const currentDay = prev.arqueros[dayKey];
      const newBloques = [...currentDay.sesion.bloques];
      newBloques[blockIndex] = { ...newBloques[blockIndex], [field]: value };
      return {
        ...prev,
        arqueros: {
          ...prev.arqueros,
          [dayKey]: {
            ...currentDay,
            sesion: { ...currentDay.sesion, bloques: newBloques }
          }
        }
      };
    });
  };

  const updateGoalkeeperComp = (dayKey: DayOfWeek, field: 'tipo' | 'descripcion', value: string) => {
    setPlan((prev) => {
      const currentDay = prev.arqueros[dayKey];
      return {
        ...prev,
        arqueros: {
          ...prev.arqueros,
          [dayKey]: {
            ...currentDay,
            complementario: { ...currentDay.complementario, [field]: value }
          }
        }
      };
    });
  };

  const handleClearWeek = () => {
    if (window.confirm(`¿Estás seguro de reiniciar la planificación de la Semana ${selectedWeek} (${selectedCategory})?`)) {
      setPlan(createEmptyWeeklyPlan(selectedCategory, selectedYear, selectedWeek));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SanLuisLogo className="w-12 h-14" />
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  Planificación Semanal
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-400/30">
                  {selectedCategory}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Cloud className="w-3 h-3" />
                  Sincronizado
                </span>
                <FirebaseQuotaBadge compact />
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                Planificación por Áreas y Semanas
              </h2>
              <p className="text-xs text-slate-400">
                Organización metodológica semanal por Área Técnica, Física y de Arqueros de San Luis de Quillota.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
            {/* Scope selector for print and PDF */}
            <div className="inline-flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
              <span className="text-slate-500 px-2 flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-400" />
                Exportar:
              </span>
              <button
                type="button"
                onClick={() => setPrintScope('current')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  printScope === 'current'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Imprimir o exportar solo el área seleccionada"
              >
                Área Actual
              </button>
              <button
                type="button"
                onClick={() => setPrintScope('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  printScope === 'all'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Imprimir o exportar el microciclo completo (Técnica + Física + Arqueros)"
              >
                Microciclo (3 Áreas)
              </button>
            </div>

            <button
              onClick={handleClearWeek}
              title="Limpiar datos de esta semana"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>

            {/* Alternar Vista Limpia / Modo Edición */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'edit' ? 'clean' : 'edit')}
              title="Alternar entre modo de edición de campos y vista limpia de lectura completa"
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                viewMode === 'clean'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md font-black scale-105'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span>{viewMode === 'clean' ? 'Vista Limpia: Activa' : 'Vista Limpia'}</span>
            </button>

            {/* Descargar PDF */}
            <button
              onClick={handleExportPdf}
              disabled={isGeneratingPdf}
              title="Descargar documento PDF oficial para guardar o compartir"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-xs font-bold rounded-xl border border-amber-400/40 transition-colors cursor-pointer shadow-sm hover:scale-[1.02]"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>{isGeneratingPdf ? 'Generando PDF...' : 'Descargar PDF'}</span>
            </button>

            {/* Imprimir */}
            <button
              onClick={handlePrint}
              title="Imprimir formato oficial de la semana en papel o PDF de sistema"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir</span>
            </button>

            {/* Guardar Plan */}
            <button
              onClick={handleSavePlan}
              disabled={isSaving}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all cursor-pointer ${
                isSaved
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20 hover:scale-[1.02]'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Plan Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Plan'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {saveError && (
          <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Category & Week Pickers */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Categories Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-amber-400 mr-1 uppercase">Bloque:</span>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-950/40 scale-105'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Week Navigation */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={handlePrevWeek}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-2 text-center min-w-[200px]">
              <span className="text-xs font-black text-white block">
                Semana {selectedWeek} ({selectedYear})
              </span>
              <span className="text-[10px] text-amber-400 font-medium">
                {weekDays[0].displayDate} al {weekDays[6].displayDate}
              </span>
            </div>

            <button
              onClick={handleNextWeek}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleGoCurrentWeek}
              className="ml-2 px-2.5 py-1 text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
            >
              Hoy
            </button>
          </div>
        </div>

        {/* Area Navigation Tabs (Matching the 3 uploaded Excel Sheets) */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-400 mr-2">Área de Trabajo:</span>
          
          <button
            onClick={() => setActiveArea('tecnica')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeArea === 'tecnica'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-300'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>Área Técnica</span>
          </button>

          <button
            onClick={() => setActiveArea('fisica')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeArea === 'fisica'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-300'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>Área Física</span>
          </button>

          <button
            onClick={() => setActiveArea('arqueros')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeArea === 'arqueros'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-300'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Área Arqueros</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet View Container */}
      <div 
        id="printable-planning-area"
        ref={printRef}
        className="bg-white text-slate-900 rounded-2xl shadow-2xl p-4 sm:p-6 overflow-x-auto font-sans border-2 border-slate-800"
      >
        {/* Official Club Header (Visible in print and exported PDF) */}
        <div id="planning-pdf-header" className="flex items-center justify-between pb-3 border-b-2 border-amber-400 mb-4 bg-white">
          <div className="flex items-center gap-3">
            <SanLuisLogo className="w-14 h-16 drop-shadow" />
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">San Luis de Quillota S.A.D.P.</h1>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Fútbol Formativo y Joven • Planificación Semanal Metodológica</p>
              <p className="text-[11px] font-medium text-slate-600">
                Categoría: <strong className="text-slate-950 uppercase">{selectedCategory}</strong> • Semana {selectedWeek} ({selectedYear}) • Cantera Canaria
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded border border-black uppercase shadow-xs">
              {printScope === 'all' ? 'MICROCICLO COMPLETO (3 ÁREAS)' : activeArea === 'tecnica' ? 'ÁREA TÉCNICA' : activeArea === 'fisica' ? 'ÁREA FÍSICA' : 'ÁREA ARQUEROS'}
            </div>
            <p className="text-[11px] font-bold text-slate-600 mt-1">
              Fechas: {weekDays[0].displayDate} al {weekDays[6].displayDate}
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. AREA TECNICA TABLE */}
        {/* ========================================================================= */}
        {(printScope === 'all' || activeArea === 'tecnica') && (
          <div className="space-y-0 mb-6">
            {/* Main Yellow Banner */}
            <div className="bg-[#FFFF00] text-black font-black text-center py-2 text-sm sm:text-base uppercase tracking-wider border-2 border-black">
              AREA TECNICA • {selectedCategory} • SEMANA {selectedWeek} ({weekDays[0].displayDate} - {weekDays[6].displayDate})
            </div>

            {/* Days Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-black text-xs min-w-[1050px] table-fixed">
                {/* Header row with days */}
                <thead>
                  <tr className="bg-[#FFFF00] text-black font-black text-center border-b-2 border-black">
                    <th className="w-28 sm:w-32 p-2 border-r-2 border-black">CAMPO</th>
                    {weekDays.map((wd) => (
                      <th key={wd.key} className="p-2 border-r border-black last:border-r-0 uppercase">
                        {wd.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* FECHA ROW */}
                  <tr className="bg-yellow-100/60 font-bold border-b border-black">
                    <td className="p-2 bg-yellow-200/90 font-black text-black border-r-2 border-black text-center uppercase">
                      FECHA
                    </td>
                    {weekDays.map((wd) => (
                      <td key={wd.key} className="p-2 text-center border-r border-black last:border-r-0 font-black text-slate-900">
                        {wd.displayDate}
                      </td>
                    ))}
                  </tr>

                  {/* SESION ROW */}
                  <tr className="bg-yellow-50 border-b-2 border-black">
                    <td className="p-2 bg-yellow-200/90 font-black text-black border-r-2 border-black text-center uppercase">
                      SESION
                    </td>
                    {weekDays.map((wd) => {
                      const dayPlan = plan.tecnica[wd.key];
                      return (
                        <td key={wd.key} className="p-1.5 border-r border-black last:border-r-0 align-top">
                          {viewMode === 'clean' ? (
                            <div className="p-1.5 text-xs font-black text-slate-900 text-center uppercase min-h-[32px] flex items-center justify-center bg-slate-50 rounded border border-slate-200">
                              {dayPlan.sesionTitulo || <span className="text-slate-400 font-normal">Sin definir</span>}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={dayPlan.sesionTitulo}
                              onChange={(e) => updateTechnicalField(wd.key, 'sesionTitulo', e.target.value)}
                              placeholder="Tema o foco de sesión..."
                              className="w-full p-1.5 text-xs font-bold rounded border bg-white text-slate-900 border-slate-300 focus:outline-amber-500"
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* 4 ESTRUCTURA / MODULO BLOCKS */}
                  {[0, 1, 2, 3].map((blockIdx) => (
                    <React.Fragment key={blockIdx}>
                      {/* Estructura Row */}
                      <tr className="bg-slate-50 border-t border-black">
                        <td className="p-2 bg-yellow-300/80 font-black text-black border-r-2 border-black text-center uppercase">
                          Estructura {blockIdx + 1}
                        </td>
                        {weekDays.map((wd) => {
                          const currentBlock = plan.tecnica[wd.key]?.bloques[blockIdx] || { estructura: '', modulo: '' };
                          const normalizedEstructura = TECNICA_ESTRUCTURA_OPTIONS.find(
                            (opt) => opt.toLowerCase() === (currentBlock.estructura || '').toLowerCase()
                          ) || currentBlock.estructura;

                          return (
                            <td key={wd.key} className="p-1.5 border-r border-black last:border-r-0 align-middle">
                              {viewMode === 'clean' ? (
                                <div className="p-1 text-[11px] font-black text-center text-slate-900 bg-amber-100 rounded border border-amber-300">
                                  {normalizedEstructura || <span className="text-slate-400 font-normal">-</span>}
                                </div>
                              ) : (
                                <select
                                  value={normalizedEstructura}
                                  onChange={(e) => updateTechnicalBlock(wd.key, blockIdx, 'estructura', e.target.value === '- Seleccionar Estructura -' ? '' : e.target.value)}
                                  className="w-full p-1 text-[11px] font-bold rounded border border-slate-300 bg-white text-slate-900 focus:outline-amber-500"
                                >
                                  {TECNICA_ESTRUCTURA_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt === '- Seleccionar Estructura -' ? '' : opt}>{opt}</option>
                                  ))}
                                </select>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Modulo Row */}
                      <tr className="bg-white border-b-2 border-black">
                        <td className="p-2 bg-yellow-200/90 font-black text-black border-r-2 border-black text-center uppercase">
                          Modulo {blockIdx + 1}
                        </td>
                        {weekDays.map((wd) => {
                          const currentBlock = plan.tecnica[wd.key]?.bloques[blockIdx] || { estructura: '', modulo: '' };
                          return (
                            <td key={wd.key} className="p-1.5 border-r border-black last:border-r-0 align-top">
                              {viewMode === 'clean' ? (
                                <div className="p-2 text-[11px] font-medium leading-relaxed whitespace-pre-wrap break-words text-slate-900 bg-slate-50/80 min-h-[50px] rounded border border-slate-200">
                                  {currentBlock.modulo || <span className="text-slate-400 italic">Sin consignas registradas</span>}
                                </div>
                              ) : (
                                <textarea
                                  rows={2}
                                  value={currentBlock.modulo}
                                  onChange={(e) => {
                                    updateTechnicalBlock(wd.key, blockIdx, 'modulo', e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.max(50, e.target.scrollHeight) + 'px';
                                  }}
                                  placeholder="Detalle de tarea, consignas y objetivos tácticos..."
                                  className="w-full p-1.5 text-[11px] font-medium leading-relaxed rounded border border-slate-200 bg-slate-50/50 text-slate-800 min-h-[50px] focus:outline-amber-500"
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. AREA FISICA TABLE */}
        {/* ========================================================================= */}
        {(printScope === 'all' || activeArea === 'fisica') && (
          <div className="space-y-0 mb-6">
            {/* Main Yellow Banner */}
            <div className="bg-[#FFFF00] text-black font-black text-center py-2 text-sm sm:text-base uppercase tracking-wider border-2 border-black">
              AREA FISICA • {selectedCategory} • SEMANA {selectedWeek} ({weekDays[0].displayDate} - {weekDays[6].displayDate})
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-black text-xs min-w-[1050px] table-fixed">
                <thead>
                  <tr className="bg-[#FFFF00] text-black font-black text-center border-b-2 border-black">
                    <th className="w-28 sm:w-32 p-2 border-r-2 border-black">CAMPO</th>
                    {weekDays.map((wd) => (
                      <th key={wd.key} className="p-2 border-r border-black last:border-r-0 uppercase">
                        {wd.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* FECHA */}
                  <tr className="bg-yellow-100/60 font-bold border-b border-black">
                    <td className="p-2 bg-yellow-200/90 font-black text-black border-r-2 border-black text-center uppercase">
                      FECHA
                    </td>
                    {weekDays.map((wd) => (
                      <td key={wd.key} className="p-2 text-center border-r border-black last:border-r-0 font-black text-slate-900">
                        {wd.displayDate}
                      </td>
                    ))}
                  </tr>

                  {/* CARGA DEL DIA */}
                  <tr className="bg-amber-100/80 border-b-2 border-black">
                    <td className="p-2 bg-yellow-300 font-black text-black border-r-2 border-black text-center uppercase">
                      CARGA DEL DIA
                    </td>
                    {weekDays.map((wd) => {
                      const dayPlan = plan.fisica[wd.key];
                      return (
                        <td key={wd.key} className="p-1.5 border-r border-black last:border-r-0 align-middle">
                          {viewMode === 'clean' ? (
                            <div className="p-1.5 text-[11px] font-black text-center text-slate-900 bg-amber-100 rounded border border-amber-300">
                              {dayPlan.cargaDelDia || '-'}
                            </div>
                          ) : (
                            <select
                              value={dayPlan.cargaDelDia}
                              onChange={(e) => updatePhysicalDay(wd.key, 'cargaDelDia', e.target.value)}
                              className="w-full p-1.5 text-[11px] font-black rounded border border-slate-300 bg-white text-slate-900 focus:outline-amber-500"
                            >
                              {CARGA_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* PRE - SESION */}
                  <tr className="bg-white border-b-2 border-black">
                    <td className="p-2 bg-[#FFFF00] font-black text-black border-r-2 border-black text-center uppercase">
                      Pre - sesion
                    </td>
                    {weekDays.map((wd) => {
                      const dayPlan = plan.fisica[wd.key];
                      return (
                        <td key={wd.key} className="p-1.5 border-r border-black last:border-r-0 align-top space-y-1">
                          {viewMode === 'clean' ? (
                            <div className="space-y-1 p-1">
                              <div className="font-bold text-[10px] text-amber-950 bg-amber-100 px-1 py-0.5 rounded border border-amber-300 text-center">
                                {dayPlan.preSesion.tipo || '-'}
                              </div>
                              <div className="text-[10px] font-medium leading-relaxed whitespace-pre-wrap break-words text-slate-900 bg-slate-50 p-1.5 rounded border border-slate-200 min-h-[38px]">
                                {dayPlan.preSesion.descripcion || <span className="text-slate-400 italic">Sin detalle</span>}
                              </div>
                            </div>
                          ) : (
                            <>
                              <select
                                value={dayPlan.preSesion.tipo}
                                onChange={(e) => updatePhysicalPre(wd.key, 'tipo', e.target.value)}
                                className="w-full p-1 text-[11px] font-bold rounded border border-slate-300 bg-white text-slate-900 focus:outline-amber-500"
                              >
                                {PRE_SESION_FISICA_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                              <textarea
                                rows={2}
                                value={dayPlan.preSesion.descripcion}
                                onChange={(e) => {
                                  updatePhysicalPre(wd.key, 'descripcion', e.target.value);
                                  e.target.style.height = 'auto';
                                  e.target.style.height = Math.max(45, e.target.scrollHeight) + 'px';
                                }}
                                placeholder="Ejercicios preventivos y activación..."
                                className="w-full p-1 text-[10px] font-medium leading-relaxed rounded border border-slate-200 bg-slate-50 text-slate-800 min-h-[45px] focus:outline-amber-500"
                              />
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* SESION (Main Physical Core) */}
                  <tr className="bg-white border-b-2 border-black">
                    <td className="p-2 bg-[#FFFF00] font-black text-black border-r-2 border-black text-center uppercase">
                      Sesion
                    </td>
                    {weekDays.map((wd) => {
                      const dayPlan = plan.fisica[wd.key];
                      const b1 = dayPlan.sesion.bloques[0] || { tipo: '', descripcion: '' };
                      const b2 = dayPlan.sesion.bloques[1] || { tipo: '', descripcion: '' };
                      return (
                        <td key={wd.key} className="p-1.5 border-r border-black last:border-r-0 align-top space-y-1.5">
                          {viewMode === 'clean' ? (
                            <div className="space-y-1.5 p-1">
                              {/* Block 1 */}
                              <div className="space-y-1">
                                <div className="font-bold text-[10px] text-slate-900 bg-yellow-100 px-1 py-0.5 rounded border border-yellow-300 text-center">
                                  {b1.tipo || '-'}
                                </div>
                                <div className="text-[10px] font-medium leading-relaxed whitespace-pre-wrap break-words text-slate-900 bg-slate-50 p-1.5 rounded border border-slate-200 min-h-[42px]">
                                  {b1.descripcion || <span className="text-slate-400 italic">Sin tareas</span>}
                                </div>
                              </div>
                              {/* Block 2 */}
                              {(b2.tipo || b2.descripcion) && (
                                <div className="pt-1 border-t border-slate-200 space-y-1">
                                  <div className="font-bold text-[9px] text-slate-800 bg-slate-100 px-1 py-0.5 rounded border border-slate-200 text-center">
                                    {b2.tipo || '-'}
                                  </div>
                                  <div className="text-[10px] font-medium leading-relaxed whitespace-pre-wrap break-words text-slate-900 bg-slate-50 p-1.5 rounded border border-slate-200">
                                    {b2.descripcion}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              {/* Block 1 */}
                              <div className="space-y-1">
                                <select
                                  value={b1.tipo}
                                  onChange={(e) => updatePhysicalBlock(wd.key, 0, 'tipo', e.target.value)}
                                  className="w-full p-1 text-[11px] font-bold rounded border border-slate-300 bg-white text-slate-900 focus:outline-amber-500"
                                >
                                  {SESION_FISICA_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <textarea
                                  rows={2}
                                  value={b1.descripcion}
                                  onChange={(e) => {
                                    updatePhysicalBlock(wd.key, 0, 'descripcion', e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.max(50, e.target.scrollHeight) + 'px';
                                  }}
                                  placeholder="Volumen, series, repeticiones, metros..."
                                  className="w-full p-1 text-[10px] font-medium leading-relaxed rounded border border-slate-200 bg-slate-50 text-slate-800 min-h-[50px] focus:outline-amber-500"
                                />
                              </div>

                              {/* Block 2 (Optional sub-exercise) */}
                              <div className="pt-1 border-t border-slate-200 space-y-1">
                                <select
                                  value={b2.tipo}
                                  onChange={(e) => updatePhysicalBlock(wd.key, 1, 'tipo', e.target.value)}
                                  className="w-full p-1 text-[10px] font-semibold rounded border border-slate-300 bg-white text-slate-800 focus:outline-amber-500"
                                >
                                  {SESION_FISICA_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <textarea
                                  rows={2}
                                  value={b2.descripcion}
                                  onChange={(e) => {
                                    updatePhysicalBlock(wd.key, 1, 'descripcion', e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.max(45, e.target.scrollHeight) + 'px';
                                  }}
                                  placeholder="Trabajo específico o complementario..."
                                  className="w-full p-1 text-[10px] font-medium leading-relaxed rounded border border-slate-200 bg-slate-50 text-slate-800 min-h-[45px] focus:outline-amber-500"
                                />
                              </div>
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* COMPLEMENTARIO */}
                  <tr className="bg-white border-b-2 border-black">
                    <td className="p-2 bg-[#FFFF00] font-black text-black border-r-2 border-black text-center uppercase">
                      Complementario
                    </td>
                    {weekDays.map((wd) => {
                      const dayPlan = plan.fisica[wd.key];
                      return (
                        <td key={wd.key} className="p-1.5 border-r border-black last:border-r-0 align-top space-y-1">
                          {viewMode === 'clean' ? (
                            <div className="space-y-1 p-1">
                              <div className="font-bold text-[10px] text-amber-950 bg-amber-100 px-1 py-0.5 rounded border border-amber-300 text-center">
                                {dayPlan.complementario.tipo || '-'}
                              </div>
                              <div className="text-[10px] font-medium leading-relaxed whitespace-pre-wrap break-words text-slate-900 bg-slate-50 p-1.5 rounded border border-slate-200 min-h-[36px]">
                                {dayPlan.complementario.descripcion || <span className="text-slate-400 italic">Sin detalle</span>}
                              </div>
                            </div>
                          ) : (
                            <>
                              <select
                                value={dayPlan.complementario.tipo}
                                onChange={(e) => updatePhysicalComp(wd.key, 'tipo', e.target.value)}
                                className="w-full p-1 text-[11px] font-bold rounded border border-slate-300 bg-white text-slate-900 focus:outline-amber-500"
                              >
                                {COMPLEMENTARIO_FISICA_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                              <textarea
                                rows={2}
                                value={dayPlan.complementario.descripcion}
                                onChange={(e) => {
                                  updatePhysicalComp(wd.key, 'descripcion', e.target.value);
                                  e.target.style.height = 'auto';
                                  e.target.style.height = Math.max(45, e.target.scrollHeight) + 'px';
                                }}
                                placeholder="Fuerza, crioterapia o flexibilidad..."
                                className="w-full p-1 text-[10px] font-medium leading-relaxed rounded border border-slate-200 bg-slate-50 text-slate-800 min-h-[45px] focus:outline-amber-500"
                              />
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. AREA ARQUEROS TABLE */}
        {/* ========================================================================= */}
        {(printScope === 'all' || activeArea === 'arqueros') && (
          <div className="space-y-0">
            {/* Main Yellow Banner */}
            <div className="bg-[#FFFF00] text-black font-black text-center py-2 text-sm sm:text-base uppercase tracking-wider border-2 border-black">
              AREA ARQUEROS • {selectedCategory} • SEMANA {selectedWeek} ({weekDays[0].displayDate} - {weekDays[6].displayDate})
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border-2 border-black text-xs min-w-[1050px] table-fixed">
                <thead>
                  <tr className="bg-[#FFFF00] text-black font-black text-center border-b-2 border-black">
                    <th className="w-28 sm:w-32 p-2 border-r-2 border-black">CAMPO</th>
                    {weekDays.map((wd) => (
                      <th key={wd.key} className="p-2 border-r border-black last:border-r-0 uppercase">
                        {wd.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* FECHA */}
                  <tr className="bg-yellow-100/60 font-bold border-b border-black">
                    <td className="p-2 bg-yellow-200/90 font-black text-black border-r-2 border-black text-center uppercase">
                      FECHA
                    </td>
                    {weekDays.map((wd) => (
                      <td key={wd.key} className="p-2 text-center border-r border-black last:border-r-0 font-black text-slate-900">
                        {wd.displayDate}
                      </td>
                    ))}
                  </tr>

                  {/* OBJETIVO DEL DIA */}
                  <tr className="bg-amber-100/80 border-b-2 border-black">
                    <td className="p-2 bg-yellow-300 font-black text-black border-r-2 border-black text-center uppercase">
                      OBJETIVO DEL DIA
                    </td>
                    {weekDays.map((wd) => {
                      const dayPlan = plan.arqueros[wd.key];
                      return (
                        <td key={wd.key} className="p-1.5 border-r border-black last:border-r-0 align-middle">
                          {viewMode === 'clean' ? (
                            <div className="p-1.5 text-[11px] font-black text-center text-slate-900 bg-amber-100 rounded border border-amber-300">
                              {dayPlan.objetivoDelDia || '-'}
                            </div>
                          ) : (
                            <select
                              value={dayPlan.objetivoDelDia}
                              onChange={(e) => updateGoalkeeperDay(wd.key, 'objetivoDelDia', e.target.value)}
                              className="w-full p-1.5 text-[11px] font-black rounded border border-slate-300 bg-white text-slate-900 focus:outline-amber-500"
                            >
                              {ARQUEROS_OBJETIVOS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* PRE - SESION */}
                  <tr className="bg-white border-b-2 border-black">
                    <td className="p-2 bg-[#FFFF00] font-black text-black border-r-2 border-black text-center uppercase">
                      Pre - sesion
                    </td>
                    {weekDays.map((wd) => {
                      const dayPlan = plan.arqueros[wd.key];
                      return (
                        <td key={wd.key} className="p-1.5 border-r border-black last:border-r-0 align-top space-y-1">
                          {viewMode === 'clean' ? (
                            <div className="space-y-1 p-1">
                              <div className="font-bold text-[10px] text-amber-950 bg-amber-100 px-1 py-0.5 rounded border border-amber-300 text-center">
                                {dayPlan.preSesion.tipo || '-'}
                              </div>
                              <div className="text-[10px] font-medium leading-relaxed whitespace-pre-wrap break-words text-slate-900 bg-slate-50 p-1.5 rounded border border-slate-200 min-h-[38px]">
                                {dayPlan.preSesion.descripcion || <span className="text-slate-400 italic">Sin detalle</span>}
                              </div>
                            </div>
                          ) : (
                            <>
                              <select
                                value={dayPlan.preSesion.tipo}
                                onChange={(e) => updateGoalkeeperPre(wd.key, 'tipo', e.target.value)}
                                className="w-full p-1 text-[11px] font-bold rounded border border-slate-300 bg-white text-slate-900 focus:outline-amber-500"
                              >
                                {ARQUEROS_PRE_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                              <textarea
                                rows={2}
                                value={dayPlan.preSesion.descripcion}
                                onChange={(e) => {
                                  updateGoalkeeperPre(wd.key, 'descripcion', e.target.value);
                                  e.target.style.height = 'auto';
                                  e.target.style.height = Math.max(45, e.target.scrollHeight) + 'px';
                                }}
                                placeholder="Movilidad, coordinación y agarres..."
                                className="w-full p-1 text-[10px] font-medium leading-relaxed rounded border border-slate-200 bg-slate-50 text-slate-800 min-h-[45px] focus:outline-amber-500"
                              />
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* SESION */}
                  <tr className="bg-white border-b-2 border-black">
                    <td className="p-2 bg-[#FFFF00] font-black text-black border-r-2 border-black text-center uppercase">
                      Sesion
                    </td>
                    {weekDays.map((wd) => {
                      const dayPlan = plan.arqueros[wd.key];
                      const b1 = dayPlan.sesion.bloques[0] || { tipo: '', descripcion: '' };
                      const b2 = dayPlan.sesion.bloques[1] || { tipo: '', descripcion: '' };
                      return (
                        <td key={wd.key} className="p-1.5 border-r border-black last:border-r-0 align-top space-y-1.5">
                          {viewMode === 'clean' ? (
                            <div className="space-y-1.5 p-1">
                              {/* Block 1 */}
                              <div className="space-y-1">
                                <div className="font-bold text-[10px] text-slate-900 bg-yellow-100 px-1 py-0.5 rounded border border-yellow-300 text-center">
                                  {b1.tipo || '-'}
                                </div>
                                <div className="text-[10px] font-medium leading-relaxed whitespace-pre-wrap break-words text-slate-900 bg-slate-50 p-1.5 rounded border border-slate-200 min-h-[42px]">
                                  {b1.descripcion || <span className="text-slate-400 italic">Sin tareas</span>}
                                </div>
                              </div>
                              {/* Block 2 */}
                              {(b2.tipo || b2.descripcion) && (
                                <div className="pt-1 border-t border-slate-200 space-y-1">
                                  <div className="font-bold text-[9px] text-slate-800 bg-slate-100 px-1 py-0.5 rounded border border-slate-200 text-center">
                                    {b2.tipo || '-'}
                                  </div>
                                  <div className="text-[10px] font-medium leading-relaxed whitespace-pre-wrap break-words text-slate-900 bg-slate-50 p-1.5 rounded border border-slate-200">
                                    {b2.descripcion}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="space-y-1">
                                <select
                                  value={b1.tipo}
                                  onChange={(e) => updateGoalkeeperBlock(wd.key, 0, 'tipo', e.target.value)}
                                  className="w-full p-1 text-[11px] font-bold rounded border border-slate-300 bg-white text-slate-900 focus:outline-amber-500"
                                >
                                  {ARQUEROS_SESION_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <textarea
                                  rows={2}
                                  value={b1.descripcion}
                                  onChange={(e) => {
                                    updateGoalkeeperBlock(wd.key, 0, 'descripcion', e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.max(50, e.target.scrollHeight) + 'px';
                                  }}
                                  placeholder="Repeticiones, orientación corporal y toma de decisiones..."
                                  className="w-full p-1 text-[10px] font-medium leading-relaxed rounded border border-slate-200 bg-slate-50 text-slate-800 min-h-[50px] focus:outline-amber-500"
                                />
                              </div>

                              <div className="pt-1 border-t border-slate-200 space-y-1">
                                <select
                                  value={b2.tipo}
                                  onChange={(e) => updateGoalkeeperBlock(wd.key, 1, 'tipo', e.target.value)}
                                  className="w-full p-1 text-[10px] font-semibold rounded border border-slate-300 bg-white text-slate-800 focus:outline-amber-500"
                                >
                                  {ARQUEROS_SESION_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <textarea
                                  rows={2}
                                  value={b2.descripcion}
                                  onChange={(e) => {
                                    updateGoalkeeperBlock(wd.key, 1, 'descripcion', e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.max(45, e.target.scrollHeight) + 'px';
                                  }}
                                  placeholder="Juego de pies o integración grupal..."
                                  className="w-full p-1 text-[10px] font-medium leading-relaxed rounded border border-slate-200 bg-slate-50 text-slate-800 min-h-[45px] focus:outline-amber-500"
                                />
                              </div>
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* COMPLEMENTARIO */}
                  <tr className="bg-white border-b-2 border-black">
                    <td className="p-2 bg-[#FFFF00] font-black text-black border-r-2 border-black text-center uppercase">
                      Complementario
                    </td>
                    {weekDays.map((wd) => {
                      const dayPlan = plan.arqueros[wd.key];
                      return (
                        <td key={wd.key} className="p-1.5 border-r border-black last:border-r-0 align-top space-y-1">
                          {viewMode === 'clean' ? (
                            <div className="space-y-1 p-1">
                              <div className="font-bold text-[10px] text-amber-950 bg-amber-100 px-1 py-0.5 rounded border border-amber-300 text-center">
                                {dayPlan.complementario.tipo || '-'}
                              </div>
                              <div className="text-[10px] font-medium leading-relaxed whitespace-pre-wrap break-words text-slate-900 bg-slate-50 p-1.5 rounded border border-slate-200 min-h-[36px]">
                                {dayPlan.complementario.descripcion || <span className="text-slate-400 italic">Sin detalle</span>}
                              </div>
                            </div>
                          ) : (
                            <>
                              <input
                                type="text"
                                value={dayPlan.complementario.tipo}
                                onChange={(e) => updateGoalkeeperComp(wd.key, 'tipo', e.target.value)}
                                placeholder="Gimnasio / Core..."
                                className="w-full p-1 text-[11px] font-bold rounded border border-slate-300 bg-white text-slate-900 focus:outline-amber-500"
                              />
                              <textarea
                                rows={2}
                                value={dayPlan.complementario.descripcion}
                                onChange={(e) => {
                                  updateGoalkeeperComp(wd.key, 'descripcion', e.target.value);
                                  e.target.style.height = 'auto';
                                  e.target.style.height = Math.max(45, e.target.scrollHeight) + 'px';
                                }}
                                placeholder="Trabajo específico complementario..."
                                className="w-full p-1 text-[10px] font-medium leading-relaxed rounded border border-slate-200 bg-slate-50 text-slate-800 min-h-[45px] focus:outline-amber-500"
                              />
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Validation Footnote */}
        <div className="mt-4 pt-3 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>San Luis de Quillota S.A.D.P. • Cantera Canaria 2026</span>
          <span className="font-semibold">
            Última actualización: {new Date(plan.updatedAt).toLocaleString('es-CL')} {plan.authorName && `• Por: ${plan.authorName}`}
          </span>
        </div>
      </div>
    </div>
  );
};

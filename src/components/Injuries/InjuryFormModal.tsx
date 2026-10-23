import React, { useState, useMemo } from 'react';
import { PlayerInjury, InjuryStatus, CLUB_CATEGORIES, matchesCategoryFilter } from '../../types/football';
import { useFootball } from '../../context/FootballContext';
import { useAuth } from '../../context/AuthContext';
import { getAllowedCategories } from '../../types/auth';
import { 
  X, 
  Activity, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  FileText,
  Building2,
  Stethoscope,
  HeartPulse
} from 'lucide-react';

interface InjuryFormModalProps {
  injuryToEdit?: PlayerInjury | null;
  defaultPlayerId?: string;
  onClose: () => void;
}

const COMMON_INJURY_TYPES = [
  'Desgarro Isquiotibial Grado I',
  'Desgarro Isquiotibial Grado II',
  'Desgarro de Cuádriceps',
  'Esguince de Tobillo Grado I',
  'Esguince de Tobillo Grado II',
  'Esguince de Rodilla (LLE / LLI)',
  'Rotura de Ligamento Cruzado Anterior (LCA)',
  'Rotura Meniscal',
  'Pubalgia / Osteopatía de Pubis',
  'Sobrecarga Muscular de Aductores',
  'Sobrecarga Muscular de Gemelos',
  'Tendinitis Rotuliana / Patelar',
  'Tendinopatía de Aquiles',
  'Contusión Ósea Traumática',
  'Fractura / Fisura',
  'Lumbalgia Aguda',
  'Conmoción Cerebral / Protocolo Traumatismo',
  'Otra Lesión Específica'
];

const COMMON_BODY_ZONES = [
  'Muslo posterior derecho (Isquiotibiales)',
  'Muslo posterior izquierdo (Isquiotibiales)',
  'Muslo anterior derecho (Cuádriceps)',
  'Muslo anterior izquierdo (Cuádriceps)',
  'Rodilla derecha',
  'Rodilla izquierda',
  'Tobillo derecho',
  'Tobillo izquierdo',
  'Gemelo / Sóleo derecho',
  'Gemelo / Sóleo izquierdo',
  'Ingle / Aductor derecho',
  'Ingle / Aductor izquierdo',
  'Zona Púbica / Abdominal',
  'Columna Lumbar',
  'Hombro / Clavícula',
  'Muñeca / Mano',
  'Cabeza / Cuello',
  'Otro segmento'
];

export const InjuryFormModal: React.FC<InjuryFormModalProps> = ({
  injuryToEdit,
  defaultPlayerId,
  onClose,
}) => {
  const { players, addInjury, updateInjury, activeCategory, getCategoryStaff } = useFootball();
  const { currentUser } = useAuth();

  const isCoordinator = currentUser?.role === 'Coordinador General' || currentUser?.category === 'Todas';
  const allowedCategories = getAllowedCategories(currentUser?.category);
  const availableCategories = isCoordinator ? CLUB_CATEGORIES : allowedCategories;

  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (injuryToEdit?.category) return injuryToEdit.category;
    if (defaultPlayerId) {
      const pl = players.find((p) => p.id === defaultPlayerId);
      if (pl?.category) return pl.category;
    }
    if (activeCategory && activeCategory !== 'all' && activeCategory !== 'Todas') return activeCategory;
    return availableCategories[0] || 'Sub 14';
  });

  // Filter players strictly by selectedCategory
  const eligiblePlayers = useMemo(() => {
    return players.filter((p) => matchesCategoryFilter(p.category, selectedCategory));
  }, [players, selectedCategory]);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    injuryToEdit?.playerId || defaultPlayerId || eligiblePlayers[0]?.id || ''
  );

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  const defaultKinesio = selectedPlayer 
    ? getCategoryStaff(selectedPlayer.category).kinesiologist 
    : 'Felipe Astudillo (Kinesiólogo San Luis)';

  // Required injury fields
  const [dateInjured, setDateInjured] = useState<string>(
    injuryToEdit?.dateInjured || new Date().toISOString().slice(0, 10)
  );
  const [injuryType, setInjuryType] = useState<string>(injuryToEdit?.injuryType || COMMON_INJURY_TYPES[0]);
  const [customInjuryType, setCustomInjuryType] = useState<string>('');
  const [bodyZone, setBodyZone] = useState<string>(injuryToEdit?.bodyZone || COMMON_BODY_ZONES[0]);
  const [customBodyZone, setCustomBodyZone] = useState<string>('');
  const [description, setDescription] = useState<string>(
    injuryToEdit?.description || ''
  );
  const [diagnosis, setDiagnosis] = useState<string>(
    injuryToEdit?.diagnosis || ''
  );
  const [medicalStaffOrClinic, setMedicalStaffOrClinic] = useState<string>(
    injuryToEdit?.medicalStaffOrClinic || injuryToEdit?.medicalStaff || defaultKinesio
  );
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>(
    injuryToEdit?.expectedReturnDate || ''
  );
  const [actualReturnDate, setActualReturnDate] = useState<string>(
    injuryToEdit?.actualReturnDate || ''
  );
  
  // Normalized 4 requested statuses
  const initialStatus: InjuryStatus = (() => {
    if (!injuryToEdit) return 'Lesionado';
    if (injuryToEdit.status === 'Activa') return 'Lesionado';
    if (injuryToEdit.status === 'En Reintegro') return 'En Reintegro Deportivo';
    return injuryToEdit.status;
  })();

  const [status, setStatus] = useState<InjuryStatus>(initialStatus);
  const [severity, setSeverity] = useState<'Leve' | 'Moderada' | 'Grave' | 'Muy Grave'>(
    injuryToEdit?.severity || 'Moderada'
  );
  const [evolutionNotes, setEvolutionNotes] = useState<string>(
    injuryToEdit?.evolutionNotes || injuryToEdit?.notes || ''
  );

  const handleStatusChange = (newStatus: InjuryStatus) => {
    setStatus(newStatus);
    if (newStatus === 'Alta Médica' && !actualReturnDate) {
      setActualReturnDate(new Date().toISOString().slice(0, 10));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) {
      alert('Por favor selecciona un futbolista.');
      return;
    }

    const finalType = injuryType === 'Otra Lesión Específica' ? customInjuryType.trim() : injuryType;
    if (!finalType) {
      alert('Por favor especifica el tipo de lesión.');
      return;
    }

    const finalZone = bodyZone === 'Otro segmento' ? customBodyZone.trim() : bodyZone;
    if (!finalZone) {
      alert('Por favor indica la zona del cuerpo afectada.');
      return;
    }

    const payload = {
      playerId: selectedPlayerId,
      playerName: selectedPlayer ? `${selectedPlayer.firstName} ${selectedPlayer.lastName}` : injuryToEdit?.playerName,
      playerSquadNumber: selectedPlayer?.squadNumber,
      category: selectedPlayer?.category || 'Sub 14',
      injuryType: finalType,
      bodyZone: finalZone,
      description: description.trim() || `Lesión en ${finalZone} sufrida el ${dateInjured}.`,
      diagnosis: diagnosis.trim() || `${finalType} en ${finalZone}.`,
      medicalStaff: medicalStaffOrClinic.trim(),
      medicalStaffOrClinic: medicalStaffOrClinic.trim(),
      severity,
      dateInjured,
      expectedReturnDate: expectedReturnDate || undefined,
      actualReturnDate: actualReturnDate || undefined,
      status,
      treatment: `Atención kinésica en ${medicalStaffOrClinic.trim()}.`,
      notes: evolutionNotes.trim(),
      evolutionNotes: evolutionNotes.trim(),
      season: '2026',
    };

    if (injuryToEdit) {
      updateInjury(injuryToEdit.id, payload);
    } else {
      addInjury(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black shadow-md shadow-rose-950/50">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {injuryToEdit ? 'Editar Registro de Lesión' : 'Registrar Nueva Lesión en Parte Médico'}
              </h3>
              <p className="text-xs text-slate-400">
                Se guarda automáticamente en la ficha del jugador creando su historial cronológico
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
          {/* 1. Nombre del jugador */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="block font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>1. Futbolista Afectado</span>
              </label>

              {!injuryToEdit && (
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-400 font-semibold">Categoría:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setSelectedCategory(newCat);
                      const catSquad = players.filter((p) => matchesCategoryFilter(p.category, newCat));
                      if (catSquad.length > 0) setSelectedPlayerId(catSquad[0].id);
                    }}
                    className="bg-slate-900 border border-slate-700 text-amber-300 font-bold rounded px-2 py-0.5 text-xs focus:outline-none cursor-pointer"
                  >
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <select
              value={selectedPlayerId}
              disabled={!!injuryToEdit}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-bold focus:border-rose-500 focus:outline-none"
            >
              {eligiblePlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.squadNumber} - {p.firstName} {p.lastName} ({p.primaryPosition} • {p.category}) {p.status !== 'Disponible' ? `[Estado: ${p.status}]` : ''}
                </option>
              ))}
            </select>

            {selectedPlayer && (
              <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Categoría: <strong className="text-white">{selectedPlayer.category}</strong></span>
                <span>Posición: <strong className="text-amber-400">{selectedPlayer.primaryPosition}</strong></span>
                <span>Ficha/DNI: <strong className="text-slate-200">{selectedPlayer.idCard || '-'}</strong></span>
              </div>
            )}
          </div>

          {/* 2 & 3. Fecha de la lesión, Tipo de lesión y Zona corporal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Fecha de la Lesión</span>
              </label>
              <input
                type="date"
                required
                value={dateInjured}
                onChange={(e) => setDateInjured(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-300 mb-1">
                3. Tipo de Lesión
              </label>
              <select
                value={injuryType}
                onChange={(e) => setInjuryType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              >
                {COMMON_INJURY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {injuryType === 'Otra Lesión Específica' && (
                <input
                  type="text"
                  placeholder="Escribe el tipo de lesión específico..."
                  value={customInjuryType}
                  onChange={(e) => setCustomInjuryType(e.target.value)}
                  className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              )}
            </div>
          </div>

          {/* Zona corporal & Gravedad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Zona Corporal Afectada</label>
              <select
                value={bodyZone}
                onChange={(e) => setBodyZone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              >
                {COMMON_BODY_ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
              {bodyZone === 'Otro segmento' && (
                <input
                  type="text"
                  placeholder="Indica la zona anatómica afectada..."
                  value={customBodyZone}
                  onChange={(e) => setCustomBodyZone(e.target.value)}
                  className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Gravedad Estimada</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
              >
                <option value="Leve">Leve (1-7 días de baja)</option>
                <option value="Moderada">Moderada (1-3 semanas de baja)</option>
                <option value="Grave">Grave (1-2 meses de baja)</option>
                <option value="Muy Grave">Muy Grave (&gt; 2 meses de baja)</option>
              </select>
            </div>
          </div>

          {/* 4. Descripción de la lesión */}
          <div>
            <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>4. Descripción de la Lesión (Mecanismo y Ocurrencia)</span>
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalla cómo ocurrió la lesión (ej: Traumatismo por choque con rival en disputa aérea, frenada brusca con hiperextensión de rodilla, tirón al sprintar en entrenamiento...)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
            />
          </div>

          {/* 5. Diagnóstico médico */}
          <div>
            <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-rose-400" />
              <span>5. Diagnóstico Médico (Si está disponible)</span>
            </label>
            <textarea
              rows={2}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Resultado de ecografía, resonancia magnética o diagnóstico traumatológico clínico..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
            />
          </div>

          {/* 6. Profesional responsable o centro médico */}
          <div>
            <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>6. Profesional Responsable o Centro Médico</span>
            </label>
            <input
              type="text"
              required
              value={medicalStaffOrClinic}
              onChange={(e) => setMedicalStaffOrClinic(e.target.value)}
              placeholder="ej: Felipe Astudillo (Kinesiólogo) / Dr. Juan Pablo Valdés / Clínica Los Andes / Mutual"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-semibold"
            />
          </div>

          {/* 7 & 8. Fechas de regreso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>7. Fecha Estimada de Regreso</span>
              </label>
              <input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>8. Fecha Efectiva de Alta Médica</span>
              </label>
              <input
                type="date"
                value={actualReturnDate}
                onChange={(e) => setActualReturnDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
              />
            </div>
          </div>

          {/* 9. Estado Actual: lesionado, en recuperación, en reintegro deportivo o alta médica */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <label className="block font-bold text-slate-300 mb-2 flex items-center justify-between">
              <span>9. Estado Actual del Futbolista</span>
              <span className="text-[10px] text-amber-400 font-extrabold uppercase">
                Determina la disponibilidad para citaciones
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('Lesionado')}
                className={`p-2.5 rounded-xl font-black border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  status === 'Lesionado' || status === 'Activa'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950/60 scale-[1.02]'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span className="text-base">🚫</span>
                <span className="text-xs">Lesionado</span>
                <span className="text-[9px] font-normal opacity-80">Baja Activa</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('En Recuperación')}
                className={`p-2.5 rounded-xl font-black border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  status === 'En Recuperación'
                    ? 'bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-950/60 scale-[1.02]'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span className="text-base">🩹</span>
                <span className="text-xs">En Recuperación</span>
                <span className="text-[9px] font-normal opacity-80">Fase Kinésica</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('En Reintegro Deportivo')}
                className={`p-2.5 rounded-xl font-black border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  status === 'En Reintegro Deportivo' || status === 'En Reintegro'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-950/60 scale-[1.02]'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span className="text-base">🏃</span>
                <span className="text-xs">En Reintegro</span>
                <span className="text-[9px] font-normal opacity-80">Con PF en Campo</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('Alta Médica')}
                className={`p-2.5 rounded-xl font-black border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  status === 'Alta Médica'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-950/60 scale-[1.02]'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span className="text-base">✅</span>
                <span className="text-xs">Alta Médica</span>
                <span className="text-[9px] font-normal opacity-80">Apto Competir</span>
              </button>
            </div>
          </div>

          {/* 10. Observaciones y evolución de la recuperación */}
          <div>
            <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-amber-400" />
              <span>10. Observaciones y Evolución de la Recuperación</span>
            </label>
            <textarea
              rows={3}
              value={evolutionNotes}
              onChange={(e) => setEvolutionNotes(e.target.value)}
              placeholder="Registra avances kinésicos, respuesta a cargas, mejoría en rango articular, dolor residual y observaciones de control semanal..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
            />
          </div>

          {/* Automatic Protection & Category Preservation Notice */}
          <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl text-amber-200 text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Protección Médica Automática y Persistencia</span>
            </div>
            <p className="text-[10px] text-amber-300/80 leading-relaxed">
              • Si el estado es <strong>Lesionado</strong> o <strong>En Recuperación</strong>, el sistema bloquea automáticamente su citación en partidos oficiales.
              <br />
              • Este registro queda guardado en la ficha oficial del futbolista de forma cronológica y <strong>se mantendrá intacto aunque cambie de categoría</strong> en el club.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl shadow-lg shadow-rose-950/50 transition-all hover:scale-[1.02] cursor-pointer"
            >
              {injuryToEdit ? 'Guardar Cambios de Lesión' : 'Registrar Lesión en Ficha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

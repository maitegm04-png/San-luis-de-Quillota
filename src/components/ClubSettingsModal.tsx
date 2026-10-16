import React, { useState } from 'react';
import { useFootball } from '../context/FootballContext';
import { CLUB_CATEGORIES } from '../types/football';
import { X, Save, Download, Upload, RotateCcw, Shield, CheckCircle2 } from 'lucide-react';

interface ClubSettingsModalProps {
  onClose: () => void;
  onOpenUsers?: () => void;
}

export const ClubSettingsModal: React.FC<ClubSettingsModalProps> = ({ onClose, onOpenUsers }) => {
  const { 
    clubInfo, 
    updateClubInfo, 
    exportDatabaseJson, 
    importDatabaseJson, 
    resetToDefaultData,
    activeCategory,
    getCategoryStaff,
    updateCategoryStaff
  } = useFootball();

  const [name, setName] = useState(clubInfo.name);
  const [shortName, setShortName] = useState(clubInfo.shortName);
  const [category, setCategory] = useState(clubInfo.category);
  const [stadium, setStadium] = useState(clubInfo.stadium);
  const [season, setSeason] = useState(clubInfo.season);
  const [federationId, setFederationId] = useState(clubInfo.federationId || '');

  // Category specific technical staff
  const [staffCategory, setStaffCategory] = useState<string>(activeCategory !== 'all' ? activeCategory : 'Sub 14');
  const initialStaff = getCategoryStaff(activeCategory !== 'all' ? activeCategory : 'Sub 14');

  const [coach, setCoach] = useState(initialStaff.coach);
  const [assistantCoach, setAssistantCoach] = useState(initialStaff.assistantCoach);
  const [physicalTrainer, setPhysicalTrainer] = useState(initialStaff.physicalTrainer);
  const [goalkeeperCoach, setGoalkeeperCoach] = useState(initialStaff.goalkeeperCoach);
  const [kinesiologist, setKinesiologist] = useState(initialStaff.kinesiologist);
  const [kitManager, setKitManager] = useState(initialStaff.kitManager);
  const [coordinator, setCoordinator] = useState(initialStaff.coordinator);

  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleStaffCategoryChange = (newCat: string) => {
    // Save current before switching
    updateCategoryStaff(staffCategory, {
      coach: coach.trim(),
      assistantCoach: assistantCoach.trim(),
      physicalTrainer: physicalTrainer.trim(),
      goalkeeperCoach: goalkeeperCoach.trim(),
      kinesiologist: kinesiologist.trim(),
      kitManager: kitManager.trim(),
      coordinator: coordinator.trim(),
    });

    setStaffCategory(newCat);
    const nextStaff = getCategoryStaff(newCat);
    setCoach(nextStaff.coach);
    setAssistantCoach(nextStaff.assistantCoach);
    setPhysicalTrainer(nextStaff.physicalTrainer);
    setGoalkeeperCoach(nextStaff.goalkeeperCoach);
    setKinesiologist(nextStaff.kinesiologist);
    setKitManager(nextStaff.kitManager);
    setCoordinator(nextStaff.coordinator);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staffData = {
      coach: coach.trim(),
      assistantCoach: assistantCoach.trim(),
      physicalTrainer: physicalTrainer.trim(),
      goalkeeperCoach: goalkeeperCoach.trim(),
      kinesiologist: kinesiologist.trim(),
      kitManager: kitManager.trim(),
      coordinator: coordinator.trim(),
    };

    updateCategoryStaff(staffCategory, staffData);

    updateClubInfo({
      name: name.trim(),
      shortName: shortName.trim(),
      category: category.trim(),
      stadium: stadium.trim(),
      season: season.trim(),
      federationId: federationId.trim() || undefined,
      coachStaff: staffData,
    });
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importDatabaseJson(content);
        if (ok) {
          setImportStatus('Base de datos restaurada correctamente.');
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          setImportStatus('Error: El archivo no tiene el formato JSON válido.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Configuración del Club: San Luis de Quillota</h2>
              <p className="text-xs text-slate-400">Parámetros institucionales y cuerpo técnico oficial</p>
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
          {/* Identity */}
          <div>
            <h3 className="font-bold text-amber-400 uppercase tracking-wider mb-3">
              1. Identidad Institucional
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">Nombre Completo del Club *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nombre Corto</label>
                <input
                  type="text"
                  required
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Área / División</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Estadio Principal</label>
                <input
                  type="text"
                  value={stadium}
                  onChange={(e) => setStadium(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Temporada Oficial</label>
                <input
                  type="text"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">Código ANFP / Registro Federativo</label>
                <input
                  type="text"
                  placeholder="ej. ANFP-SLQ-1919"
                  value={federationId}
                  onChange={(e) => setFederationId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Coaching Staff (7 Roles) */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-bold text-amber-400 uppercase tracking-wider">
                  2. Cuerpo Técnico por Categoría ({staffCategory})
                </h3>
                <span className="text-[10px] text-slate-400">Cada categoría tiene su cuerpo técnico independiente</span>
              </div>

              {/* Category pill switcher */}
              <div className="flex items-center gap-1 flex-wrap">
                {CLUB_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleStaffCategoryChange(cat)}
                    className={`px-2 py-0.5 text-[10px] rounded-md font-bold transition-colors cursor-pointer ${
                      staffCategory === cat
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block font-bold text-slate-200 mb-1">Entrenador (D.T.)</label>
                <input
                  type="text"
                  value={coach}
                  onChange={(e) => setCoach(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Ayudante Técnico (A.T.)</label>
                <input
                  type="text"
                  value={assistantCoach}
                  onChange={(e) => setAssistantCoach(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">PF (Preparador Físico)</label>
                <input
                  type="text"
                  value={physicalTrainer}
                  onChange={(e) => setPhysicalTrainer(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">PA (Preparador de Arqueros)</label>
                <input
                  type="text"
                  value={goalkeeperCoach}
                  onChange={(e) => setGoalkeeperCoach(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">KIN (Kinesiólogo)</label>
                <input
                  type="text"
                  value={kinesiologist}
                  onChange={(e) => setKinesiologist(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">UT (Utilero)</label>
                <input
                  type="text"
                  value={kitManager}
                  onChange={(e) => setKitManager(e.target.value)}
                  placeholder="Nombre y Apellidos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-amber-500"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-bold text-slate-200 mb-1">COORD (Coordinador)</label>
                <input
                  type="text"
                  value={coordinator}
                  onChange={(e) => setCoordinator(e.target.value)}
                  placeholder="Nombre y Apellidos del Coordinador"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="pt-3 border-t border-slate-800">
            <h3 className="font-bold text-slate-300 uppercase tracking-wider mb-3">
              3. Respaldo y Restauración de Datos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={exportDatabaseJson}
                className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-center gap-2 text-slate-200 transition-colors font-bold cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Descargar Backup (JSON)</span>
              </button>

              <label className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-center gap-2 text-slate-200 transition-colors font-bold cursor-pointer">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Restaurar Archivo (JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <p className="mt-2 text-emerald-400 font-semibold text-center">
                {importStatus}
              </p>
            )}

            {onOpenUsers && (
              <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-300">Cuerpos Técnicos y Usuarios</p>
                  <p className="text-[11px] text-slate-500">Administra o crea cuentas para los DTs y preparadores de cada categoría.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUsers();
                  }}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold text-xs cursor-pointer shadow-md"
                >
                  Gestionar Usuarios
                </button>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-400">Restablecer Datos de San Luis de Quillota</p>
                <p className="text-[11px] text-slate-500">Recarga las plantillas y partidos de muestra de las series Sub 11 a Sub 20.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Restablecer los datos a los valores de San Luis de Quillota? Perderás cambios no guardados.')) {
                    resetToDefaultData();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg font-bold cursor-pointer"
              >
                Restablecer San Luis
              </button>
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
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

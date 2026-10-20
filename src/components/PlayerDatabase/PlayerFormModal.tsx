import React, { useState } from 'react';
import { DominantFoot, Player, PlayerStatus, Position } from '../../types/football';
import { useFootball } from '../../context/FootballContext';
import { useAuth } from '../../context/AuthContext';
import { getAllowedCategories } from '../../types/auth';
import { CLUB_CATEGORIES } from '../../types/football';
import { X, Save, Shield, Camera, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { compressImageForPlayer } from '../../services/firebaseQuotaGuard';

interface PlayerFormModalProps {
  playerToEdit?: Player | null;
  onClose: () => void;
}

const POSITIONS: { code: Position; name: string }[] = [
  { code: 'POR', name: 'Portero (POR)' },
  { code: 'LD', name: 'Lateral Derecho (LD)' },
  { code: 'DFC', name: 'Defensa Central (DFC)' },
  { code: 'LI', name: 'Lateral Izquierdo (LI)' },
  { code: 'MCD', name: 'Mediocentro Defensivo / Pivote (MCD)' },
  { code: 'MC', name: 'Mediocentro (MC)' },
  { code: 'MCO', name: 'Mediapunta (MCO)' },
  { code: 'ED', name: 'Extremo Derecho (ED)' },
  { code: 'EI', name: 'Extremo Izquierdo (EI)' },
  { code: 'DC', name: 'Delantero Centro (DC)' },
];

const AVATAR_COLORS = [
  '#10b981', '#059669', '#0284c7', '#0891b2', 
  '#8b5cf6', '#7c3aed', '#ec4899', '#f43f5e', 
  '#ea580c', '#eab308', '#64748b'
];

export const PlayerFormModal: React.FC<PlayerFormModalProps> = ({ playerToEdit, onClose }) => {
  const { addPlayer, updatePlayer, clubInfo, activeCategory } = useFootball();
  const { currentUser } = useAuth();

  const isCoordinator = currentUser?.role === 'Coordinador General' || currentUser?.category === 'Todas';
  const allowedCategories = getAllowedCategories(currentUser?.category);
  const availableCategories = isCoordinator ? CLUB_CATEGORIES : allowedCategories;

  const defaultCategory = playerToEdit?.category || (
    availableCategories.includes(activeCategory as any) ? activeCategory : availableCategories[0]
  );

  const [squadNumber, setSquadNumber] = useState<number>(playerToEdit?.squadNumber || 10);
  const [firstName, setFirstName] = useState<string>(playerToEdit?.firstName || '');
  const [lastName, setLastName] = useState<string>(playerToEdit?.lastName || '');
  const [nickname, setNickname] = useState<string>(playerToEdit?.nickname || '');
  const [primaryPosition, setPrimaryPosition] = useState<Position>(playerToEdit?.primaryPosition || 'MC');
  const [secondaryPosition, setSecondaryPosition] = useState<Position | ''>(playerToEdit?.secondaryPosition || '');
  const [category, setCategory] = useState<string>(defaultCategory);
  const [birthDate, setBirthDate] = useState<string>(playerToEdit?.birthDate || '2008-01-01');
  const [dominantFoot, setDominantFoot] = useState<DominantFoot>(playerToEdit?.dominantFoot || 'Derecho');
  const [heightCm, setHeightCm] = useState<number>(playerToEdit?.heightCm || 180);
  const [weightKg, setWeightKg] = useState<number>(playerToEdit?.weightKg || 75);
  const [status, setStatus] = useState<PlayerStatus>(playerToEdit?.status || 'Disponible');
  const [statusReason, setStatusReason] = useState<string>(playerToEdit?.statusReason || '');
  const [idCard, setIdCard] = useState<string>(playerToEdit?.idCard || '');
  const [phone, setPhone] = useState<string>(playerToEdit?.phone || '');
  const [email, setEmail] = useState<string>(playerToEdit?.email || '');
  const [notes, setNotes] = useState<string>(playerToEdit?.notes || '');
  const [avatarColor, setAvatarColor] = useState<string>(playerToEdit?.avatarColor || '#10b981');
  const [photoUrl, setPhotoUrl] = useState<string>(playerToEdit?.photoUrl || '');
  const [isCompressingPhoto, setIsCompressingPhoto] = useState<boolean>(false);

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingPhoto(true);
      const compressed = await compressImageForPlayer(file, 260, 260, 0.78);
      setPhotoUrl(compressed);
    } catch (err) {
      console.error('Error comprimiendo foto, intentando carga directa:', err);
      // Fallback: direct FileReader
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.onerror = () => {
        alert('No se pudo cargar la imagen. Intente con otra foto en formato JPG o PNG.');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressingPhoto(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
  };

  // Attributes
  const [pace, setPace] = useState<number>(playerToEdit?.attributes?.pace || 75);
  const [shooting, setShooting] = useState<number>(playerToEdit?.attributes?.shooting || 70);
  const [passing, setPassing] = useState<number>(playerToEdit?.attributes?.passing || 75);
  const [dribbling, setDribbling] = useState<number>(playerToEdit?.attributes?.dribbling || 74);
  const [defending, setDefending] = useState<number>(playerToEdit?.attributes?.defending || 65);
  const [physical, setPhysical] = useState<number>(playerToEdit?.attributes?.physical || 78);
  const [goalkeeping, setGoalkeeping] = useState<number>(playerToEdit?.attributes?.goalkeeping || 80);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      alert('Por favor introduzca el nombre y apellidos del jugador.');
      return;
    }

    try {
      const playerData = {
        squadNumber: Number(squadNumber) || 1,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: nickname.trim() || undefined,
        primaryPosition,
        secondaryPosition: secondaryPosition ? (secondaryPosition as Position) : undefined,
        category: category.trim() || 'Primer Equipo',
        birthDate: birthDate || '2008-01-01',
        dominantFoot,
        heightCm: Number(heightCm) || 175,
        weightKg: Number(weightKg) || 70,
        status,
        statusReason: statusReason.trim() || undefined,
        idCard: idCard.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        avatarColor: avatarColor || '#10b981',
        photoUrl: photoUrl.trim() || undefined,
        attributes: {
          pace: Number(pace) || 75,
          shooting: Number(shooting) || 70,
          passing: Number(passing) || 75,
          dribbling: Number(dribbling) || 74,
          defending: Number(defending) || 65,
          physical: Number(physical) || 78,
          goalkeeping: primaryPosition === 'POR' ? (Number(goalkeeping) || 80) : undefined,
        },
      };

      if (playerToEdit) {
        updatePlayer(playerToEdit.id, playerData);
      } else {
        addPlayer(playerData);
      }

      onClose();
    } catch (err) {
      console.error('Error guardando ficha del jugador:', err);
      alert('Ocurrió un error al guardar la ficha. Verifique los campos obligatorios.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              {playerToEdit ? `Editar Ficha: ${playerToEdit.firstName} ${playerToEdit.lastName}` : 'Inscribir Nuevo Jugador'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Photo Section */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Photo Preview / Fallback Avatar */}
              <div className="relative shrink-0">
                {photoUrl ? (
                  <div className="relative group">
                    <img
                      src={photoUrl}
                      alt="Foto de perfil"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      title="Eliminar foto"
                      className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow cursor-pointer transition-transform hover:scale-110"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-700 bg-slate-900 text-slate-400 shadow-inner"
                    style={{ backgroundColor: avatarColor }}
                  >
                    <span className="text-xl font-black text-white/90">#{squadNumber || 10}</span>
                    <span className="text-[10px] font-bold text-white/70 uppercase">Sin Foto</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Foto Oficial del Jugador
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  Sube una foto del futbolista desde tu dispositivo. Se comprime automáticamente a menos de 30KB para mantener la base de datos veloz y sin cargos de almacenamiento.
                </p>

                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start pt-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow transition-all hover:scale-[1.02]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isCompressingPhoto ? 'Procesando...' : photoUrl ? 'Cambiar Foto' : 'Subir Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      disabled={isCompressingPhoto}
                      className="hidden"
                    />
                  </label>

                  {photoUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar</span>
                    </button>
                  )}
                </div>

                <div className="pt-1.5 flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="O pegar URL directa de foto (https://...)"
                    value={photoUrl.startsWith('data:') ? '' : photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-emerald-500"
                  />
                  {photoUrl && !photoUrl.startsWith('data:') && (
                    <span className="text-[10px] text-emerald-400 font-bold shrink-0">URL cargada</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Identity Section */}
          <div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
              1. Datos Personales y Deportivos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dorsal (#) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={99}
                  value={squadNumber}
                  onChange={(e) => setSquadNumber(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-emerald-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Daniel"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Apellidos *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Carrión"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Apodo o Nombre en Camiseta</label>
                <input
                  type="text"
                  placeholder="ej. Dani Carrión"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Posición Principal *</label>
                <select
                  value={primaryPosition}
                  onChange={(e) => setPrimaryPosition(e.target.value as Position)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-emerald-500"
                >
                  {POSITIONS.map((p) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Posición Secundaria</label>
                <select
                  value={secondaryPosition}
                  onChange={(e) => setSecondaryPosition(e.target.value as Position | '')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-emerald-500"
                >
                  <option value="">Ninguna</option>
                  {POSITIONS.map((p) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Physical Profile & Category */}
          <div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
              2. Físico, Categoría y Ficha
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha Nacimiento</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pie Dominante</label>
                <select
                  value={dominantFoot}
                  onChange={(e) => setDominantFoot(e.target.value as DominantFoot)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-emerald-500"
                >
                  <option value="Derecho">Derecho</option>
                  <option value="Izquierdo">Izquierdo</option>
                  <option value="Ambidiestro">Ambidiestro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Altura (cm)</label>
                <input
                  type="number"
                  min={120}
                  max={220}
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  min={30}
                  max={130}
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-emerald-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">DNI / Ficha Federativa</label>
                <input
                  type="text"
                  placeholder="ej. 09483821K"
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-emerald-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Categoría Formativa (San Luis de Quillota) *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-amber-400 font-bold focus:outline-amber-500"
                >
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Availability Status */}
          <div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
              3. Estado Físico y Disponibilidad
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Estado Médico / Sanción</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PlayerStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-emerald-500 font-semibold"
                >
                  <option value="Disponible">Disponible (Apto)</option>
                  <option value="Duda">Duda / Molestias</option>
                  <option value="Lesionado">Lesionado (Baja médica)</option>
                  <option value="Sancionado">Sancionado (Tarjetas / Comité)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Motivo / Diagnóstico</label>
                <input
                  type="text"
                  placeholder="ej. Esguince de tobillo, 5 tarjetas..."
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Skill Ratings (1 to 99) */}
          <div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
              4. Atributos Técnicos (1 - 99)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <AttributeSlider label="Ritmo" value={pace} onChange={setPace} />
              <AttributeSlider label="Disparo" value={shooting} onChange={setShooting} />
              <AttributeSlider label="Pase" value={passing} onChange={setPassing} />
              <AttributeSlider label="Regate" value={dribbling} onChange={setDribbling} />
              <AttributeSlider label="Defensa" value={defending} onChange={setDefending} />
              <AttributeSlider label="Físico" value={physical} onChange={setPhysical} />
              {primaryPosition === 'POR' && (
                <div className="col-span-2 sm:col-span-3">
                  <AttributeSlider label="Portería" value={goalkeeping} onChange={setGoalkeeping} />
                </div>
              )}
            </div>
          </div>

          {/* Contact & Coach Notes */}
          <div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">
              5. Contacto e Informes del Entrenador
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono</label>
                <input
                  type="tel"
                  placeholder="+34 600 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="jugador@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Observaciones Técnicas y Tácticas</label>
              <textarea
                rows={2}
                placeholder="Fortalezas tácticas, aspectos a mejorar, recomendaciones..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-emerald-500"
              />
            </div>

            {/* Avatar Color Selector */}
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Color distintivo / Camiseta</label>
              <div className="flex items-center gap-2 flex-wrap">
                {AVATAR_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setAvatarColor(col)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      avatarColor === col ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-900/40 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Ficha</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AttributeSlider: React.FC<{
  label: string;
  value: number;
  onChange: (val: number) => void;
}> = ({ label, value, onChange }) => {
  return (
    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold text-white">{value}</span>
      </div>
      <input
        type="range"
        min={30}
        max={99}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
      />
    </div>
  );
};

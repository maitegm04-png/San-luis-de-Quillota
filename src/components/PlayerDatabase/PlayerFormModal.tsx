import React, { useState } from 'react';
import { DominantFoot, Player, PlayerStatus, Position } from '../../types/football';
import { useFootball } from '../../context/FootballContext';
import { X, Save, Shield } from 'lucide-react';

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
  const { addPlayer, updatePlayer, clubInfo } = useFootball();

  const [squadNumber, setSquadNumber] = useState<number>(playerToEdit?.squadNumber || 10);
  const [firstName, setFirstName] = useState<string>(playerToEdit?.firstName || '');
  const [lastName, setLastName] = useState<string>(playerToEdit?.lastName || '');
  const [nickname, setNickname] = useState<string>(playerToEdit?.nickname || '');
  const [primaryPosition, setPrimaryPosition] = useState<Position>(playerToEdit?.primaryPosition || 'MC');
  const [secondaryPosition, setSecondaryPosition] = useState<Position | ''>(playerToEdit?.secondaryPosition || '');
  const [category, setCategory] = useState<string>(playerToEdit?.category || clubInfo.category || 'Primer Equipo');
  const [birthDate, setBirthDate] = useState<string>(playerToEdit?.birthDate || '2000-01-01');
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

  // Attributes
  const [pace, setPace] = useState<number>(playerToEdit?.attributes.pace || 75);
  const [shooting, setShooting] = useState<number>(playerToEdit?.attributes.shooting || 70);
  const [passing, setPassing] = useState<number>(playerToEdit?.attributes.passing || 75);
  const [dribbling, setDribbling] = useState<number>(playerToEdit?.attributes.dribbling || 74);
  const [defending, setDefending] = useState<number>(playerToEdit?.attributes.defending || 65);
  const [physical, setPhysical] = useState<number>(playerToEdit?.attributes.physical || 78);
  const [goalkeeping, setGoalkeeping] = useState<number>(playerToEdit?.attributes.goalkeeping || 80);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      alert('Por favor introduzca el nombre y apellidos del jugador.');
      return;
    }

    const playerData = {
      squadNumber: Number(squadNumber),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nickname: nickname.trim() || undefined,
      primaryPosition,
      secondaryPosition: secondaryPosition ? (secondaryPosition as Position) : undefined,
      category: category.trim() || 'Primer Equipo',
      birthDate,
      dominantFoot,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      status,
      statusReason: statusReason.trim() || undefined,
      idCard: idCard.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      avatarColor,
      attributes: {
        pace: Number(pace),
        shooting: Number(shooting),
        passing: Number(passing),
        dribbling: Number(dribbling),
        defending: Number(defending),
        physical: Number(physical),
        goalkeeping: primaryPosition === 'POR' ? Number(goalkeeping) : undefined,
      },
    };

    if (playerToEdit) {
      updatePlayer(playerToEdit.id, playerData);
    } else {
      addPlayer(playerData);
    }

    onClose();
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
                  <option value="Sub 11">Sub 11</option>
                  <option value="Sub 12">Sub 12</option>
                  <option value="Sub 13">Sub 13</option>
                  <option value="Sub 14">Sub 14</option>
                  <option value="Sub 15">Sub 15</option>
                  <option value="Sub 16">Sub 16</option>
                  <option value="Sub 18">Sub 18</option>
                  <option value="Sub 20">Sub 20</option>
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

import React, { useState, useEffect } from 'react';
import { getDailyQuotaStats, DailyQuotaStats } from '../../services/firebaseQuotaGuard';
import { ShieldCheck, Info, X } from 'lucide-react';

export const FirebaseQuotaBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [stats, setStats] = useState<DailyQuotaStats>(getDailyQuotaStats);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    const handleUpdate = () => {
      setStats(getDailyQuotaStats());
    };

    window.addEventListener('firebase-quota-update', handleUpdate);
    const interval = setInterval(handleUpdate, 30000);

    return () => {
      window.removeEventListener('firebase-quota-update', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          title="Protección de Plan Gratuito Firebase (Spark $0)"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold cursor-pointer transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Plan Gratuito Activo (0 Cobros)</span>
        </button>

        {showModal && <QuotaModal stats={stats} onClose={() => setShowModal(false)} />}
      </>
    );
  }

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        className="bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl px-3 py-2 flex items-center justify-between gap-3 text-xs shadow-md cursor-pointer transition-colors group"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span>Protección Firebase Spark (Costo $0)</span>
              <span className="text-[10px] text-emerald-400 font-extrabold uppercase bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                100% Protegido
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Escrituras hoy: <span className="text-white font-bold">{stats.writes}</span> / {stats.maxDailyWrites.toLocaleString()} • Lecturas en caché
            </p>
          </div>
        </div>

        <Info className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
      </div>

      {showModal && <QuotaModal stats={stats} onClose={() => setShowModal(false)} />}
    </>
  );
};

const QuotaModal: React.FC<{ stats: DailyQuotaStats; onClose: () => void }> = ({ stats, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>Garantía de Cuota Gratuita Firebase</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            El sistema cuenta con un <strong className="text-white">Guardián de Cuota Inteligente</strong> configurado para el <strong className="text-amber-400">Plan Spark Gratuito de Firebase</strong>, garantizando que el club nunca incurra en cobros diarios:
          </p>

          <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Escrituras usadas hoy:</span>
              <span className="font-bold text-white">{stats.writes} / {stats.maxDailyWrites.toLocaleString()} ({stats.writePercent}%)</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all"
                style={{ width: `${stats.writePercent}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-slate-400">Lecturas protegidas:</span>
              <span className="font-bold text-white">{stats.reads} / {stats.maxDailyReads.toLocaleString()} ({stats.readPercent}%)</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all"
                style={{ width: `${stats.readPercent}%` }}
              />
            </div>
          </div>

          <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-[11px]">
            <li><strong className="text-slate-200">Caché IndexedDB persistente:</strong> Las consultas se leen localmente, evitando consumir lecturas de red repetidas.</li>
            <li><strong className="text-slate-200">Filtro de cambios:</strong> Si no modificas datos al guardar, se omite la escritura a la base de datos.</li>
            <li><strong className="text-slate-200">Compresión de fotos:</strong> Las imágenes de los jugadores se comprimen a menos de 30KB.</li>
            <li><strong className="text-slate-200">Modo de seguridad:</strong> Si se alcanza el umbral diario seguro, el sistema almacena los datos localmente en tu navegador sin interrumpir tu trabajo y sin generar ningún cobro.</li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

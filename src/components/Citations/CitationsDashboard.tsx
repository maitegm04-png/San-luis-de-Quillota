import React, { useState } from 'react';
import { useFootball } from '../../context/FootballContext';
import { useAuth } from '../../context/AuthContext';
import { MatchCitation, matchesCategoryFilter } from '../../types/football';
import { CitationFormModal } from './CitationFormModal';
import { CitationPdfModal } from './CitationPdfModal';
import { 
  ClipboardList, 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText, 
  Printer, 
  Edit, 
  Trash2, 
  Download,
  Shield,
  Search
} from 'lucide-react';

export const CitationsDashboard: React.FC = () => {
  const { citations, deleteCitation, activeCategory, setActiveCategory, clubInfo } = useFootball();
  const { currentUser } = useAuth();

  const [selectedCitationForPdf, setSelectedCitationForPdf] = useState<MatchCitation | null>(null);
  const [citationToEdit, setCitationToEdit] = useState<MatchCitation | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter citations by active category
  const filteredCitations = citations.filter((c) => {
    const matchesCategory = matchesCategoryFilter(c.category, activeCategory);
    if (!matchesCategory) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.opponent.toLowerCase().includes(term) ||
      c.title.toLowerCase().includes(term) ||
      c.category.toLowerCase().includes(term) ||
      c.venue.toLowerCase().includes(term) ||
      (c.matchDay || '').toLowerCase().includes(term)
    );
  });

  const handleDelete = (citation: MatchCitation) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la citación para el partido contra ${citation.opponent}?`)) {
      deleteCitation(citation.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-950/50">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                Citaciones y Convocatorias de Partido
              </h2>
              <span className="text-xs bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                {activeCategory === 'all' ? 'Todas' : activeCategory}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Genera las planillas oficiales de citación descargables en PDF e imprimibles con el dorsal y nombre de los futbolistas convocados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => {
              setCitationToEdit(null);
              setIsFormOpen(true);
            }}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-950/40 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Citación</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por rival, fecha, cancha..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Mostrando <strong className="text-amber-400">{filteredCitations.length}</strong> {filteredCitations.length === 1 ? 'citación' : 'citaciones'}
        </div>
      </div>

      {/* Citations List Grid */}
      {filteredCitations.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
          <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No hay citaciones registradas para este filtro</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Crea una nueva citación para convocar a los futbolistas de la {activeCategory === 'all' ? 'categoría' : activeCategory} y descargar la planilla oficial en PDF.
          </p>
          <button
            type="button"
            onClick={() => {
              setCitationToEdit(null);
              setIsFormOpen(true);
            }}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primera Citación</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCitations.map((citation) => {
            return (
              <div
                key={citation.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                    <div className="flex items-start gap-2.5">
                      {citation.opponentLogoUrl ? (
                        <div className="w-10 h-10 rounded-full bg-white p-1 border border-slate-700 flex items-center justify-center shrink-0 shadow">
                          <img src={citation.opponentLogoUrl} alt={citation.opponent} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          <Shield className="w-5 h-5 text-amber-400" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                            {citation.category}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {citation.competition}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                          vs {citation.opponent}
                        </h3>
                        <p className="text-[11px] text-slate-400">{citation.matchDay || citation.date}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      citation.isHome ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}>
                      {citation.isHome ? 'Local' : 'Visita'}
                    </span>
                  </div>

                  {/* Date, Times & Location Details */}
                  <div className="py-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{citation.date}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-amber-950/20 border border-amber-500/20">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-amber-300 block font-extrabold uppercase">Hora Citación</span>
                          <span className="text-sm font-black text-white">{citation.meetingTime} hrs</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Partido</span>
                        <span className="text-xs font-bold text-slate-200">{citation.matchTime} hrs</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{citation.venue} ({citation.pitch})</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        <strong className="text-white">{citation.players.length}</strong> futbolistas convocados con foto
                      </span>
                    </div>
                  </div>

                  {/* Mini squad list tags */}
                  <div className="flex flex-wrap gap-1 pt-1 pb-2">
                    {citation.players.slice(0, 6).map((p) => (
                      <span key={p.playerId} className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 border border-slate-800">
                        #{p.squadNumber} {p.name.split(' ')[0]}
                      </span>
                    ))}
                    {citation.players.length > 6 && (
                      <span className="text-[10px] text-amber-400 px-1 py-0.5 font-bold">
                        +{citation.players.length - 6} más
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCitationForPdf(citation)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg shadow transition-all cursor-pointer"
                      title="Ver y descargar Planilla en PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Planilla PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCitationForPdf(citation)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                      title="Imprimir Planilla Oficial"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCitationToEdit(citation);
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                      title="Editar citación"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(citation)}
                      className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar citación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PDF Modal */}
      {selectedCitationForPdf && (
        <CitationPdfModal
          citation={selectedCitationForPdf}
          onClose={() => setSelectedCitationForPdf(null)}
        />
      )}

      {/* Citation Builder Modal */}
      {isFormOpen && (
        <CitationFormModal
          citationToEdit={citationToEdit}
          onClose={() => {
            setIsFormOpen(false);
            setCitationToEdit(null);
          }}
          onSaved={(savedCitation) => {
            setSelectedCitationForPdf(savedCitation);
          }}
        />
      )}
    </div>
  );
};

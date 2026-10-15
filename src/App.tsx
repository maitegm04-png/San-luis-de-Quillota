import React, { useState } from 'react';
import { FootballProvider, useFootball } from './context/FootballContext';
import { Header, ActiveTab } from './components/Header';
import { PlayerList } from './components/PlayerDatabase/PlayerList';
import { PlayerFormModal } from './components/PlayerDatabase/PlayerFormModal';
import { MatchList } from './components/MatchSheets/MatchList';
import { MatchFormModal } from './components/MatchSheets/MatchFormModal';
import { TacticalBoard } from './components/Tactics/TacticalBoard';
import { ClubStats } from './components/StatsDashboard/ClubStats';
import { ClubSettingsModal } from './components/ClubSettingsModal';
import { Shield } from 'lucide-react';

function FootballApp() {
  const { clubInfo, players, matches } = useFootball();

  const [activeTab, setActiveTab] = useState<ActiveTab>('matches');
  const [isNewMatchOpen, setIsNewMatchOpen] = useState(false);
  const [isNewPlayerOpen, setIsNewPlayerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewMatch={() => setIsNewMatchOpen(true)}
        onOpenNewPlayer={() => setIsNewPlayerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'matches' && (
          <MatchList onOpenNewMatch={() => setIsNewMatchOpen(true)} />
        )}

        {activeTab === 'players' && (
          <PlayerList onOpenNewPlayer={() => setIsNewPlayerOpen(true)} />
        )}

        {activeTab === 'tactics' && (
          <TacticalBoard />
        )}

        {activeTab === 'stats' && (
          <ClubStats />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-600/80 flex items-center justify-center text-white">
              <Shield className="w-3 h-3" />
            </div>
            <span>
              <strong>{clubInfo.name}</strong> • {clubInfo.category} ({clubInfo.season})
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>{players.length} Futbolistas en plantilla</span>
            <span>•</span>
            <span>{matches.length} Planillas registradas</span>
            <span>•</span>
            <span>DT: {clubInfo.coachStaff?.coach || 'Cuerpo Técnico'}</span>
          </div>
        </div>
      </footer>

      {/* Modal Dialogs */}
      {isNewMatchOpen && (
        <MatchFormModal onClose={() => setIsNewMatchOpen(false)} />
      )}

      {isNewPlayerOpen && (
        <PlayerFormModal onClose={() => setIsNewPlayerOpen(false)} />
      )}

      {isSettingsOpen && (
        <ClubSettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <FootballProvider>
      <FootballApp />
    </FootballProvider>
  );
}

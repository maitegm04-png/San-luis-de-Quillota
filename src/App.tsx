import React, { useState, useEffect } from 'react';
import { FootballProvider, useFootball } from './context/FootballContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header, ActiveTab } from './components/Header';
import { PlayerList } from './components/PlayerDatabase/PlayerList';
import { PlayerFormModal } from './components/PlayerDatabase/PlayerFormModal';
import { MatchList } from './components/MatchSheets/MatchList';
import { MatchFormModal } from './components/MatchSheets/MatchFormModal';
import { TacticalBoard } from './components/Tactics/TacticalBoard';
import { ClubStats } from './components/StatsDashboard/ClubStats';
import { WeeklyPlanningDashboard } from './components/Planning/WeeklyPlanningDashboard';
import { ClubSettingsModal } from './components/ClubSettingsModal';
import { LoginScreen } from './components/Auth/LoginScreen';
import { UserManagementModal } from './components/Auth/UserManagementModal';
import { SanLuisLogo } from './components/Common/SanLuisLogo';
import { Shield } from 'lucide-react';

function FootballApp() {
  const { currentUser, isAuthenticated } = useAuth();
  const { clubInfo, players, matches, setActiveCategory, activeCategory } = useFootball();

  const [activeTab, setActiveTab] = useState<ActiveTab>('matches');
  const [isNewMatchOpen, setIsNewMatchOpen] = useState(false);
  const [isNewPlayerOpen, setIsNewPlayerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);

  // If user is not authenticated, show the login/register screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={(userCategory) => {
          if (userCategory && userCategory !== 'Todas') {
            setActiveCategory(userCategory);
          } else {
            setActiveCategory('all');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewMatch={() => setIsNewMatchOpen(true)}
        onOpenNewPlayer={() => setIsNewPlayerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenUsers={() => setIsUsersOpen(true)}
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

        {activeTab === 'planning' && (
          <WeeklyPlanningDashboard />
        )}

        {activeTab === 'stats' && (
          <ClubStats />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SanLuisLogo className="w-6 h-6" />
            <span>
              <strong>{clubInfo.name}</strong> • {clubInfo.category} ({clubInfo.season})
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 flex-wrap">
            <span>{players.length} Futbolistas en plantilla</span>
            <span>•</span>
            <span>{matches.length} Planillas registradas</span>
            <span>•</span>
            <span>Sesión: <strong className="text-amber-400">{currentUser?.name}</strong> ({currentUser?.category})</span>
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
        <ClubSettingsModal 
          onClose={() => setIsSettingsOpen(false)} 
          onOpenUsers={() => setIsUsersOpen(true)}
        />
      )}

      {isUsersOpen && (
        <UserManagementModal onClose={() => setIsUsersOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FootballProvider>
        <FootballApp />
      </FootballProvider>
    </AuthProvider>
  );
}

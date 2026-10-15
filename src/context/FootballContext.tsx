import React, { createContext, useContext, useEffect, useState } from 'react';
import { ClubInfo, MatchEvent, MatchSheet, Player, Position, TacticalFormation } from '../types/football';
import { FORMATIONS_SLOTS, INITIAL_CLUB_INFO, INITIAL_MATCHES, INITIAL_PLAYERS } from '../data/mockData';

interface FootballContextType {
  players: Player[];
  matches: MatchSheet[];
  clubInfo: ClubInfo;
  selectedMatchId: string | null;
  selectedMatch: MatchSheet | null;
  setSelectedMatchId: (id: string | null) => void;
  
  // Players actions
  addPlayer: (player: Omit<Player, 'id' | 'stats'>) => void;
  updatePlayer: (id: string, player: Partial<Player>) => void;
  deletePlayer: (id: string) => void;
  getPlayerById: (id?: string) => Player | undefined;

  // Matches actions
  addMatch: (match: Omit<MatchSheet, 'id'>) => string;
  updateMatch: (id: string, match: Partial<MatchSheet>) => void;
  deleteMatch: (id: string) => void;
  updateClubInfo: (info: Partial<ClubInfo>) => void;

  // Tactical & Lineup helpers
  changeFormation: (matchId: string, formation: TacticalFormation) => void;
  assignPlayerToSlot: (matchId: string, slotId: string, playerId: string) => void;
  removePlayerFromStartingEleven: (matchId: string, playerId: string) => void;
  toggleSubstitute: (matchId: string, playerId: string) => void;
  setMatchSpecialRole: (matchId: string, role: 'captain' | 'viceCaptain' | 'penalty' | 'freeKick' | 'corner', playerId: string | undefined) => void;

  // Match Events & Live
  addMatchEvent: (matchId: string, event: Omit<MatchEvent, 'id'>) => void;
  removeMatchEvent: (matchId: string, eventId: string) => void;
  updatePlayerRating: (matchId: string, playerId: string, rating: number, minutes: number, notes?: string) => void;
  updateMatchScore: (matchId: string, homeScore: number, awayScore: number) => void;
  finishMatch: (matchId: string) => void;

  // Data management
  resetToDefaultData: () => void;
  exportDatabaseJson: () => void;
  importDatabaseJson: (jsonString: string) => boolean;
}

const FootballContext = createContext<FootballContextType | undefined>(undefined);

const STORAGE_KEY_PLAYERS = 'san_luis_players_v2';
const STORAGE_KEY_MATCHES = 'san_luis_matches_v2';
const STORAGE_KEY_CLUB = 'san_luis_club_v2';

export const FootballProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
      return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
    } catch {
      return INITIAL_PLAYERS;
    }
  });

  const [matches, setMatches] = useState<MatchSheet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MATCHES);
      return saved ? JSON.parse(saved) : INITIAL_MATCHES;
    } catch {
      return INITIAL_MATCHES;
    }
  });

  const [clubInfo, setClubInfo] = useState<ClubInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLUB);
      return saved ? JSON.parse(saved) : INITIAL_CLUB_INFO;
    } catch {
      return INITIAL_CLUB_INFO;
    }
  });

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(matches[0]?.id || null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CLUB, JSON.stringify(clubInfo));
  }, [clubInfo]);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || null;

  const getPlayerById = (id?: string) => {
    if (!id) return undefined;
    return players.find((p) => p.id === id);
  };

  const addPlayer = (playerData: Omit<Player, 'id' | 'stats'>) => {
    const newPlayer: Player = {
      ...playerData,
      id: `ply-${Date.now()}`,
      stats: {
        matchesPlayed: 0,
        starts: 0,
        minutesPlayed: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        cleanSheets: 0,
        avgRating: 0,
      },
    };
    setPlayers((prev) => [...prev, newPlayer]);
  };

  const updatePlayer = (id: string, updatedFields: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
    );
  };

  const deletePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    // Also remove from any matches lineups
    setMatches((prev) =>
      prev.map((m) => ({
        ...m,
        startingEleven: m.startingEleven.filter((s) => s.playerId !== id),
        substitutes: m.substitutes.filter((subId) => subId !== id),
        reserves: m.reserves.filter((resId) => resId !== id),
        captainId: m.captainId === id ? undefined : m.captainId,
        viceCaptainId: m.viceCaptainId === id ? undefined : m.viceCaptainId,
      }))
    );
  };

  const addMatch = (matchData: Omit<MatchSheet, 'id'>): string => {
    const newId = `mat-${Date.now()}`;
    const newMatch: MatchSheet = {
      ...matchData,
      id: newId,
    };
    setMatches((prev) => [newMatch, ...prev]);
    setSelectedMatchId(newId);
    return newId;
  };

  const updateMatch = (id: string, matchFields: Partial<MatchSheet>) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...matchFields } : m))
    );
  };

  const deleteMatch = (id: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== id));
    if (selectedMatchId === id) {
      const remaining = matches.filter((m) => m.id !== id);
      setSelectedMatchId(remaining[0]?.id || null);
    }
  };

  const updateClubInfo = (info: Partial<ClubInfo>) => {
    setClubInfo((prev) => ({ ...prev, ...info }));
  };

  // Tactical management
  const changeFormation = (matchId: string, newFormation: TacticalFormation) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch) return;

    const standardSlots = FORMATIONS_SLOTS[newFormation];
    // Keep current players in new slots as much as possible
    const currentStarters = targetMatch.startingEleven.map((s) => s.playerId);
    
    const newStartingEleven = standardSlots.map((slot, index) => {
      const existingPlayerId = currentStarters[index];
      return {
        slotId: slot.id,
        playerId: existingPlayerId || '',
        roleName: slot.roleName,
      };
    }).filter((s) => s.playerId !== '');

    updateMatch(matchId, {
      formation: newFormation,
      startingEleven: newStartingEleven,
    });
  };

  const assignPlayerToSlot = (matchId: string, slotId: string, playerId: string) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch) return;

    // Remove player from substitutes or reserves if present
    const updatedSubs = targetMatch.substitutes.filter((id) => id !== playerId);
    const updatedReserves = targetMatch.reserves.filter((id) => id !== playerId);

    // If another player had this slot, free them to bench or reserves
    const existingSlotIndex = targetMatch.startingEleven.findIndex((s) => s.slotId === slotId);
    let newStarting = [...targetMatch.startingEleven];

    // Also remove this player from another slot if they were already in the starting 11
    newStarting = newStarting.filter((s) => s.playerId !== playerId);

    // Find role for this slot from formation
    const formationSlots = FORMATIONS_SLOTS[targetMatch.formation] || [];
    const slotDef = formationSlots.find((s) => s.id === slotId);
    const roleName: Position = slotDef ? slotDef.roleName : 'MC';

    if (existingSlotIndex >= 0) {
      newStarting[existingSlotIndex] = {
        slotId,
        playerId,
        roleName,
      };
    } else {
      newStarting.push({
        slotId,
        playerId,
        roleName,
      });
    }

    updateMatch(matchId, {
      startingEleven: newStarting,
      substitutes: updatedSubs,
      reserves: updatedReserves,
    });
  };

  const removePlayerFromStartingEleven = (matchId: string, playerId: string) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch) return;

    const newStarting = targetMatch.startingEleven.filter((s) => s.playerId !== playerId);
    // Put them in substitutes
    const newSubs = Array.from(new Set([...targetMatch.substitutes, playerId]));

    updateMatch(matchId, {
      startingEleven: newStarting,
      substitutes: newSubs,
    });
  };

  const toggleSubstitute = (matchId: string, playerId: string) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch) return;

    const isSub = targetMatch.substitutes.includes(playerId);
    let newSubs: string[];
    let newReserves: string[];

    if (isSub) {
      // Move to reserves
      newSubs = targetMatch.substitutes.filter((id) => id !== playerId);
      newReserves = Array.from(new Set([...targetMatch.reserves, playerId]));
    } else {
      // If was starting, remove from starting
      const newStarting = targetMatch.startingEleven.filter((s) => s.playerId !== playerId);
      newSubs = Array.from(new Set([...targetMatch.substitutes, playerId]));
      newReserves = targetMatch.reserves.filter((id) => id !== playerId);
      
      updateMatch(matchId, {
        startingEleven: newStarting,
        substitutes: newSubs,
        reserves: newReserves,
      });
      return;
    }

    updateMatch(matchId, {
      substitutes: newSubs,
      reserves: newReserves,
    });
  };

  const setMatchSpecialRole = (
    matchId: string,
    role: 'captain' | 'viceCaptain' | 'penalty' | 'freeKick' | 'corner',
    playerId: string | undefined
  ) => {
    const fieldMap = {
      captain: 'captainId',
      viceCaptain: 'viceCaptainId',
      penalty: 'penaltyTakerId',
      freeKick: 'freeKickTakerId',
      corner: 'cornerTakerId',
    } as const;

    updateMatch(matchId, {
      [fieldMap[role]]: playerId,
    });
  };

  // Events & Live Match
  const addMatchEvent = (matchId: string, eventData: Omit<MatchEvent, 'id'>) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch) return;

    const newEvent: MatchEvent = {
      ...eventData,
      id: `ev-${Date.now()}`,
    };

    const newEvents = [...targetMatch.events, newEvent].sort((a, b) => a.minute - b.minute);

    // Auto-update match score if it's a goal
    let homeScore = targetMatch.homeScore;
    let awayScore = targetMatch.awayScore;

    if (eventData.type === 'goal' || eventData.type === 'penalty_scored') {
      if (targetMatch.isHome) {
        homeScore += 1;
      } else {
        awayScore += 1;
      }
    } else if (eventData.type === 'goal_conceded') {
      if (targetMatch.isHome) {
        awayScore += 1;
      } else {
        homeScore += 1;
      }
    }

    // Auto update player stats if relevant
    if (eventData.playerId) {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id !== eventData.playerId) return p;
          const stats = { ...p.stats };
          if (eventData.type === 'goal' || eventData.type === 'penalty_scored') {
            stats.goals += 1;
          } else if (eventData.type === 'yellow_card') {
            stats.yellowCards += 1;
          } else if (eventData.type === 'red_card') {
            stats.redCards += 1;
          }
          return { ...p, stats };
        })
      );
    }

    if (eventData.assistPlayerId) {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id !== eventData.assistPlayerId) return p;
          return {
            ...p,
            stats: { ...p.stats, assists: p.stats.assists + 1 },
          };
        })
      );
    }

    updateMatch(matchId, {
      events: newEvents,
      homeScore,
      awayScore,
    });
  };

  const removeMatchEvent = (matchId: string, eventId: string) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch) return;

    const removedEvent = targetMatch.events.find((e) => e.id === eventId);
    const newEvents = targetMatch.events.filter((e) => e.id !== eventId);

    // Rollback score if removing a goal
    let homeScore = targetMatch.homeScore;
    let awayScore = targetMatch.awayScore;

    if (removedEvent) {
      if (removedEvent.type === 'goal' || removedEvent.type === 'penalty_scored') {
        if (targetMatch.isHome) homeScore = Math.max(0, homeScore - 1);
        else awayScore = Math.max(0, awayScore - 1);
      } else if (removedEvent.type === 'goal_conceded') {
        if (targetMatch.isHome) awayScore = Math.max(0, awayScore - 1);
        else homeScore = Math.max(0, homeScore - 1);
      }

      // Rollback stats
      if (removedEvent.playerId) {
        setPlayers((prev) =>
          prev.map((p) => {
            if (p.id !== removedEvent.playerId) return p;
            const stats = { ...p.stats };
            if (removedEvent.type === 'goal' || removedEvent.type === 'penalty_scored') stats.goals = Math.max(0, stats.goals - 1);
            if (removedEvent.type === 'yellow_card') stats.yellowCards = Math.max(0, stats.yellowCards - 1);
            if (removedEvent.type === 'red_card') stats.redCards = Math.max(0, stats.redCards - 1);
            return { ...p, stats };
          })
        );
      }
      if (removedEvent.assistPlayerId) {
        setPlayers((prev) =>
          prev.map((p) => {
            if (p.id !== removedEvent.assistPlayerId) return p;
            return { ...p, stats: { ...p.stats, assists: Math.max(0, p.stats.assists - 1) } };
          })
        );
      }
    }

    updateMatch(matchId, {
      events: newEvents,
      homeScore,
      awayScore,
    });
  };

  const updatePlayerRating = (
    matchId: string,
    playerId: string,
    rating: number,
    minutes: number,
    notes?: string
  ) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch) return;

    const newRatings = {
      ...targetMatch.playerRatings,
      [playerId]: { rating, minutes, notes },
    };

    updateMatch(matchId, {
      playerRatings: newRatings,
    });
  };

  const updateMatchScore = (matchId: string, homeScore: number, awayScore: number) => {
    updateMatch(matchId, {
      homeScore: Math.max(0, homeScore),
      awayScore: Math.max(0, awayScore),
    });
  };

  const finishMatch = (matchId: string) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch) return;

    // Recalculate stats for participants
    const starters = targetMatch.startingEleven.map((s) => s.playerId);
    const subIns = targetMatch.events
      .filter((e) => e.type === 'sub_in_out' && e.playerId)
      .map((e) => e.playerId as string);
    const allPlayed = Array.from(new Set([...starters, ...subIns]));

    // Check clean sheet for GK & Defenders
    const opponentGoals = targetMatch.isHome ? targetMatch.awayScore : targetMatch.homeScore;
    const isCleanSheet = opponentGoals === 0;

    setPlayers((prev) =>
      prev.map((p) => {
        if (!allPlayed.includes(p.id)) return p;
        const isStarter = starters.includes(p.id);
        const playerRating = targetMatch.playerRatings[p.id]?.rating || 7;
        const minutes = targetMatch.playerRatings[p.id]?.minutes || (isStarter ? 90 : 25);

        const currentMatches = p.stats.matchesPlayed + 1;
        const currentAvg = p.stats.avgRating || 7;
        const newAvg = Number(((currentAvg * p.stats.matchesPlayed + playerRating) / currentMatches).toFixed(1));

        return {
          ...p,
          stats: {
            ...p.stats,
            matchesPlayed: currentMatches,
            starts: isStarter ? p.stats.starts + 1 : p.stats.starts,
            minutesPlayed: p.stats.minutesPlayed + minutes,
            cleanSheets: isCleanSheet && (p.primaryPosition === 'POR' || ['DFC', 'LD', 'LI'].includes(p.primaryPosition))
              ? p.stats.cleanSheets + 1
              : p.stats.cleanSheets,
            avgRating: newAvg,
          },
        };
      })
    );

    updateMatch(matchId, { status: 'finished' });
  };

  // Backup & Restore
  const resetToDefaultData = () => {
    setPlayers(INITIAL_PLAYERS);
    setMatches(INITIAL_MATCHES);
    setClubInfo(INITIAL_CLUB_INFO);
    setSelectedMatchId(INITIAL_MATCHES[0].id);
    localStorage.removeItem(STORAGE_KEY_PLAYERS);
    localStorage.removeItem(STORAGE_KEY_MATCHES);
    localStorage.removeItem(STORAGE_KEY_CLUB);
  };

  const exportDatabaseJson = () => {
    const data = {
      version: 1,
      exportDate: new Date().toISOString(),
      clubInfo,
      players,
      matches,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dt_futbol_backup_${clubInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.players && Array.isArray(data.players)) {
        setPlayers(data.players);
      }
      if (data.matches && Array.isArray(data.matches)) {
        setMatches(data.matches);
        if (data.matches.length > 0) {
          setSelectedMatchId(data.matches[0].id);
        }
      }
      if (data.clubInfo && typeof data.clubInfo === 'object') {
        setClubInfo(data.clubInfo);
      }
      return true;
    } catch (e) {
      console.error('Error importing JSON database:', e);
      return false;
    }
  };

  return (
    <FootballContext.Provider
      value={{
        players,
        matches,
        clubInfo,
        selectedMatchId,
        selectedMatch,
        setSelectedMatchId,
        addPlayer,
        updatePlayer,
        deletePlayer,
        getPlayerById,
        addMatch,
        updateMatch,
        deleteMatch,
        updateClubInfo,
        changeFormation,
        assignPlayerToSlot,
        removePlayerFromStartingEleven,
        toggleSubstitute,
        setMatchSpecialRole,
        addMatchEvent,
        removeMatchEvent,
        updatePlayerRating,
        updateMatchScore,
        finishMatch,
        resetToDefaultData,
        exportDatabaseJson,
        importDatabaseJson,
      }}
    >
      {children}
    </FootballContext.Provider>
  );
};

export const useFootball = () => {
  const context = useContext(FootballContext);
  if (!context) {
    throw new Error('useFootball must be used within a FootballProvider');
  }
  return context;
};

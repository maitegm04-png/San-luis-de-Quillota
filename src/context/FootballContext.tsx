import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  ClubInfo, 
  CoachStaff, 
  MatchCitation, 
  MatchEvent, 
  MatchInjuryIncident, 
  MatchSheet, 
  Player, 
  PlayerInjury, 
  Position, 
  TacticalFormation,
  MatchPhysicalReport,
  MatchGpsReport,
  WeeklyCheckInEntry,
  WeeklyCheckOutEntry
} from '../types/football';
import { 
  FORMATIONS_SLOTS, 
  INITIAL_CITATIONS, 
  INITIAL_CLUB_INFO, 
  INITIAL_INJURIES, 
  INITIAL_MATCHES, 
  INITIAL_PLAYERS, 
  INITIAL_STAFF_BY_CATEGORY,
  INITIAL_WEEKLY_CHECKINS,
  INITIAL_WEEKLY_CHECKOUTS
} from '../data/mockData';
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { canPerformFirebaseWrite, recordQuotaOperation } from '../services/firebaseQuotaGuard';

interface FootballContextType {
  players: Player[];
  matches: MatchSheet[];
  clubInfo: ClubInfo;
  selectedMatchId: string | null;
  selectedMatch: MatchSheet | null;
  setSelectedMatchId: (id: string | null) => void;

  // Active Category filter (Sub 11, Sub 12, Sub 13, Sub 14, Sub 15, Sub 16, Sub 18, Sub 20 or 'all')
  activeCategory: string;
  setActiveCategory: (cat: string) => void;

  // Coaching staff per category
  categoryStaff: Record<string, CoachStaff>;
  getCategoryStaff: (cat?: string) => CoachStaff;
  updateCategoryStaff: (cat: string, staff: Partial<CoachStaff>) => void;
  
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

  // Medical & Injuries Management
  injuries: PlayerInjury[];
  addInjury: (injury: Omit<PlayerInjury, 'id' | 'createdAt'>) => string;
  updateInjury: (id: string, injury: Partial<PlayerInjury>) => void;
  deleteInjury: (id: string) => void;
  dischargeInjury: (id: string, returnDate?: string) => void;
  isPlayerInjured: (playerId: string) => boolean;
  recordMatchInjury: (matchId: string, incident: Omit<MatchInjuryIncident, 'id'>, createMedicalRecord?: boolean) => void;
  removeMatchInjury: (matchId: string, incidentId: string) => void;

  // Match Citations / Convocatorias de Partido
  citations: MatchCitation[];
  addCitation: (citation: Omit<MatchCitation, 'id' | 'createdAt'>) => string;
  updateCitation: (id: string, citation: Partial<MatchCitation>) => void;
  deleteCitation: (id: string) => void;
  getCitationById: (id: string) => MatchCitation | undefined;

  // Physical Area (Sub-14 a Sub-20) & GPS Sub-20
  updateMatchPhysicalReport: (matchId: string, report: MatchPhysicalReport) => void;
  updateMatchGpsReport: (matchId: string, report: MatchGpsReport) => void;

  // Weekly Physical Control (Sub-16 a Sub-20): Check-in & Check-out
  weeklyCheckIns: WeeklyCheckInEntry[];
  addWeeklyCheckIn: (entry: Omit<WeeklyCheckInEntry, 'id' | 'createdAt'>) => string;
  addWeeklyCheckInsBatch: (entries: Omit<WeeklyCheckInEntry, 'id' | 'createdAt'>[]) => void;
  updateWeeklyCheckIn: (id: string, entry: Partial<WeeklyCheckInEntry>) => void;
  deleteWeeklyCheckIn: (id: string) => void;

  weeklyCheckOuts: WeeklyCheckOutEntry[];
  addWeeklyCheckOut: (entry: Omit<WeeklyCheckOutEntry, 'id' | 'createdAt'>) => string;
  addWeeklyCheckOutsBatch: (entries: Omit<WeeklyCheckOutEntry, 'id' | 'createdAt'>[]) => void;
  updateWeeklyCheckOut: (id: string, entry: Partial<WeeklyCheckOutEntry>) => void;
  deleteWeeklyCheckOut: (id: string) => void;

  // Data management
  resetToDefaultData: () => void;
  exportDatabaseJson: () => void;
  importDatabaseJson: (jsonString: string) => boolean;
}

const FootballContext = createContext<FootballContextType | undefined>(undefined);

const STORAGE_KEY_PLAYERS = 'san_luis_players_v2';
const STORAGE_KEY_MATCHES = 'san_luis_matches_v2';
const STORAGE_KEY_CLUB = 'san_luis_club_v2';
const STORAGE_KEY_ACTIVE_CATEGORY = 'san_luis_active_category_v2';
const STORAGE_KEY_STAFF_BY_CAT = 'san_luis_staff_by_cat_v2';
const STORAGE_KEY_INJURIES = 'san_luis_injuries_v2';
const STORAGE_KEY_CITATIONS = 'san_luis_citations_v2';
const STORAGE_KEY_CHECKINS = 'san_luis_checkins_v1';
const STORAGE_KEY_CHECKOUTS = 'san_luis_checkouts_v1';

export const FootballProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
      if (!saved) return INITIAL_PLAYERS;
      const parsed: Player[] = JSON.parse(saved);
      const existingIds = new Set(parsed.map((p) => p.id));
      const missing = INITIAL_PLAYERS.filter((p) => !existingIds.has(p.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
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

  const [injuries, setInjuries] = useState<PlayerInjury[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INJURIES);
      return saved ? JSON.parse(saved) : INITIAL_INJURIES;
    } catch {
      return INITIAL_INJURIES;
    }
  });

  const [citations, setCitations] = useState<MatchCitation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CITATIONS);
      return saved ? JSON.parse(saved) : INITIAL_CITATIONS;
    } catch {
      return INITIAL_CITATIONS;
    }
  });

  const [weeklyCheckIns, setWeeklyCheckIns] = useState<WeeklyCheckInEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHECKINS);
      return saved ? JSON.parse(saved) : INITIAL_WEEKLY_CHECKINS;
    } catch {
      return INITIAL_WEEKLY_CHECKINS;
    }
  });

  const [weeklyCheckOuts, setWeeklyCheckOuts] = useState<WeeklyCheckOutEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHECKOUTS);
      return saved ? JSON.parse(saved) : INITIAL_WEEKLY_CHECKOUTS;
    } catch {
      return INITIAL_WEEKLY_CHECKOUTS;
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

  // Active category filter: Sub 11 to Sub 20 or 'all'. Defaults to Sub 14 for specific team view
  const [activeCategory, setActiveCategoryState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_CATEGORY);
      return saved || 'Sub 14';
    } catch {
      return 'Sub 14';
    }
  });

  // Technical staff customized per category
  const [categoryStaff, setCategoryStaff] = useState<Record<string, CoachStaff>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STAFF_BY_CAT);
      return saved ? JSON.parse(saved) : INITIAL_STAFF_BY_CATEGORY;
    } catch {
      return INITIAL_STAFF_BY_CATEGORY;
    }
  });

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(matches[0]?.id || null);

  // Real-time Firestore sync for players
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'players'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudPlayers: Player[] = [];
        snapshot.forEach((d) => {
          cloudPlayers.push(d.data() as Player);
        });
        setPlayers(cloudPlayers);
      } else {
        // Seed initial players on first run
        const batch = writeBatch(db);
        INITIAL_PLAYERS.forEach((p) => {
          batch.set(doc(db, 'players', p.id), p);
        });
        batch.commit().catch(console.error);
      }
    }, (error) => {
      console.warn('Firestore players sync fallback to cache', error);
    });
    return () => unsub();
  }, []);

  // Real-time Firestore sync for matches
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'matches'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudMatches: MatchSheet[] = [];
        snapshot.forEach((d) => {
          cloudMatches.push(d.data() as MatchSheet);
        });
        setMatches(cloudMatches);
      } else {
        // Seed initial matches on first run
        const batch = writeBatch(db);
        INITIAL_MATCHES.forEach((m) => {
          batch.set(doc(db, 'matches', m.id), m);
        });
        batch.commit().catch(console.error);
      }
    }, (error) => {
      console.warn('Firestore matches sync fallback to cache', error);
    });
    return () => unsub();
  }, []);

  // Real-time Firestore sync for clubInfo
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'club', 'info'), (snapshot) => {
      if (snapshot.exists()) {
        setClubInfo(snapshot.data() as ClubInfo);
      } else {
        setDoc(doc(db, 'club', 'info'), INITIAL_CLUB_INFO).catch(console.error);
      }
    }, (error) => {
      console.warn('Firestore club sync fallback', error);
    });
    return () => unsub();
  }, []);

  // Real-time Firestore sync for staff per category
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'staff'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudStaff: Record<string, CoachStaff> = {};
        snapshot.forEach((d) => {
          cloudStaff[d.id] = d.data() as CoachStaff;
        });
        setCategoryStaff((prev) => ({ ...prev, ...cloudStaff }));
      } else {
        const batch = writeBatch(db);
        Object.entries(INITIAL_STAFF_BY_CATEGORY).forEach(([cat, staff]) => {
          batch.set(doc(db, 'staff', cat), staff);
        });
        batch.commit().catch(console.error);
      }
    }, (error) => {
      console.warn('Firestore staff sync fallback', error);
    });
    return () => unsub();
  }, []);

  // Real-time Firestore sync for injuries
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'injuries'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudInjuries: PlayerInjury[] = [];
        snapshot.forEach((d) => {
          cloudInjuries.push(d.data() as PlayerInjury);
        });
        setInjuries(cloudInjuries);
      } else {
        const batch = writeBatch(db);
        INITIAL_INJURIES.forEach((inj) => {
          batch.set(doc(db, 'injuries', inj.id), inj);
        });
        batch.commit().catch(console.error);
      }
    }, (error) => {
      console.warn('Firestore injuries sync fallback', error);
    });
    return () => unsub();
  }, []);

  // Real-time Firestore sync for match citations / convocatorias
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'citations'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudCitations: MatchCitation[] = [];
        snapshot.forEach((d) => {
          cloudCitations.push(d.data() as MatchCitation);
        });
        setCitations(cloudCitations);
      } else {
        const batch = writeBatch(db);
        INITIAL_CITATIONS.forEach((cit) => {
          batch.set(doc(db, 'citations', cit.id), cit);
        });
        batch.commit().catch(console.error);
      }
    }, (error) => {
      console.warn('Firestore citations sync fallback', error);
    });
    return () => unsub();
  }, []);

  // Real-time Firestore sync for daily check-ins
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'checkins'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudCheckIns: WeeklyCheckInEntry[] = [];
        snapshot.forEach((d) => {
          cloudCheckIns.push(d.data() as WeeklyCheckInEntry);
        });
        setWeeklyCheckIns(cloudCheckIns);
      }
    }, (error) => {
      console.warn('Firestore checkins sync fallback', error);
    });
    return () => unsub();
  }, []);

  // Real-time Firestore sync for daily check-outs
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'checkouts'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudCheckOuts: WeeklyCheckOutEntry[] = [];
        snapshot.forEach((d) => {
          cloudCheckOuts.push(d.data() as WeeklyCheckOutEntry);
        });
        setWeeklyCheckOuts(cloudCheckOuts);
      }
    }, (error) => {
      console.warn('Firestore checkouts sync fallback', error);
    });
    return () => unsub();
  }, []);

  // Sync to local storage as instant backup
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CLUB, JSON.stringify(clubInfo));
  }, [clubInfo]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE_CATEGORY, activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STAFF_BY_CAT, JSON.stringify(categoryStaff));
  }, [categoryStaff]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INJURIES, JSON.stringify(injuries));
  }, [injuries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CITATIONS, JSON.stringify(citations));
  }, [citations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CHECKINS, JSON.stringify(weeklyCheckIns));
  }, [weeklyCheckIns]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CHECKOUTS, JSON.stringify(weeklyCheckOuts));
  }, [weeklyCheckOuts]);

  const setActiveCategory = (cat: string) => {
    setActiveCategoryState(cat);
    // If selecting a category, switch selectedMatch to one of that category if available
    if (cat !== 'all') {
      const matchInCat = matches.find((m) => m.category === cat);
      if (matchInCat) {
        setSelectedMatchId(matchInCat.id);
      }
    }
  };

  const getCategoryStaff = (cat?: string): CoachStaff => {
    const key = cat && cat !== 'all' ? cat : activeCategory !== 'all' ? activeCategory : 'Sub 14';
    return categoryStaff[key] || INITIAL_STAFF_BY_CATEGORY[key] || clubInfo.coachStaff;
  };

  const updateCategoryStaff = (cat: string, newStaff: Partial<CoachStaff>) => {
    setCategoryStaff((prev) => {
      const current = prev[cat] || INITIAL_STAFF_BY_CATEGORY[cat] || clubInfo.coachStaff;
      const updated = { ...current, ...newStaff };
      setDoc(doc(db, 'staff', cat), updated, { merge: true }).catch(console.error);
      return { ...prev, [cat]: updated };
    });
  };

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
    if (canPerformFirebaseWrite()) {
      setDoc(doc(db, 'players', newPlayer.id), newPlayer)
        .then(() => recordQuotaOperation('write', 1))
        .catch(console.error);
    }
  };

  const updatePlayer = (id: string, updatedFields: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
    );

    // Keep injuries in sync if category or name changes
    if (updatedFields.category || updatedFields.firstName || updatedFields.lastName || updatedFields.nickname) {
      setInjuries((prevInj) =>
        prevInj.map((inj) => {
          if (inj.playerId === id) {
            return {
              ...inj,
              category: updatedFields.category || inj.category,
              playerName: updatedFields.nickname || 
                (updatedFields.firstName && updatedFields.lastName ? `${updatedFields.firstName} ${updatedFields.lastName}` : inj.playerName)
            };
          }
          return inj;
        })
      );
    }

    if (canPerformFirebaseWrite()) {
      setDoc(doc(db, 'players', id), updatedFields, { merge: true })
        .then(() => recordQuotaOperation('write', 1))
        .catch(console.error);
    }
  };

  const deletePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    if (canPerformFirebaseWrite()) {
      deleteDoc(doc(db, 'players', id))
        .then(() => recordQuotaOperation('delete', 1))
        .catch(console.error);
    }
    // Also remove from any matches lineups
    setMatches((prev) =>
      prev.map((m) => {
        const hasStarting = m.startingEleven.some((s) => s.playerId === id);
        const hasSub = m.substitutes.includes(id);
        const hasRes = m.reserves.includes(id);
        if (hasStarting || hasSub || hasRes || m.captainId === id || m.viceCaptainId === id) {
          const updated = {
            ...m,
            startingEleven: m.startingEleven.filter((s) => s.playerId !== id),
            substitutes: m.substitutes.filter((subId) => subId !== id),
            reserves: m.reserves.filter((resId) => resId !== id),
            captainId: m.captainId === id ? undefined : m.captainId,
            viceCaptainId: m.viceCaptainId === id ? undefined : m.viceCaptainId,
          };
          if (canPerformFirebaseWrite()) {
            setDoc(doc(db, 'matches', m.id), updated, { merge: true })
              .then(() => recordQuotaOperation('write', 1))
              .catch(console.error);
          }
          return updated;
        }
        return m;
      })
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
    if (canPerformFirebaseWrite()) {
      setDoc(doc(db, 'matches', newId), newMatch)
        .then(() => recordQuotaOperation('write', 1))
        .catch(console.error);
    }
    return newId;
  };

  const updateMatch = (id: string, matchFields: Partial<MatchSheet>) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const updated = { ...m, ...matchFields };
          if (canPerformFirebaseWrite()) {
            setDoc(doc(db, 'matches', id), updated, { merge: true })
              .then(() => recordQuotaOperation('write', 1))
              .catch(console.error);
          }
          return updated;
        }
        return m;
      })
    );
  };

  const deleteMatch = (id: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== id));
    deleteDoc(doc(db, 'matches', id)).catch(console.error);
    if (selectedMatchId === id) {
      const remaining = matches.filter((m) => m.id !== id);
      setSelectedMatchId(remaining[0]?.id || null);
    }
  };

  const updateClubInfo = (info: Partial<ClubInfo>) => {
    setClubInfo((prev) => {
      const next = { ...prev, ...info };
      setDoc(doc(db, 'club', 'info'), next, { merge: true }).catch(console.error);
      return next;
    });
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

    // Block injured players from being fielded
    const candidatePlayer = players.find((p) => p.id === playerId);
    if (candidatePlayer?.status === 'Lesionado') {
      alert(`No es posible alinear a ${candidatePlayer.firstName} ${candidatePlayer.lastName}: El futbolista figura con baja médica activa (Lesionado).`);
      return;
    }

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
      // Block injured players from being put on the bench
      const candidatePlayer = players.find((p) => p.id === playerId);
      if (candidatePlayer?.status === 'Lesionado') {
        alert(`No es posible convocar al banquillo a ${candidatePlayer.firstName} ${candidatePlayer.lastName}: El futbolista figura con baja médica activa (Lesionado).`);
        return;
      }

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

  // Helper to check if player has active injury (Lesionado, En Recuperación o Activa)
  const isPlayerInjured = (playerId: string): boolean => {
    const p = players.find((pl) => pl.id === playerId);
    if (p?.status === 'Lesionado') return true;
    return injuries.some((inj) => 
      inj.playerId === playerId && 
      (inj.status === 'Lesionado' || inj.status === 'En Recuperación' || inj.status === 'Activa')
    );
  };

  const addInjury = (injuryData: Omit<PlayerInjury, 'id' | 'createdAt'>): string => {
    const newId = `inj-${Date.now()}`;
    const targetPlayer = players.find((p) => p.id === injuryData.playerId);
    const newInjury: PlayerInjury = {
      ...injuryData,
      id: newId,
      playerName: targetPlayer ? (targetPlayer.nickname || `${targetPlayer.firstName} ${targetPlayer.lastName}`) : injuryData.playerName,
      playerSquadNumber: targetPlayer?.squadNumber,
      category: targetPlayer?.category || injuryData.category,
      createdAt: new Date().toISOString(),
    };

    setInjuries((prev) => [newInjury, ...prev]);
    setDoc(doc(db, 'injuries', newId), newInjury).catch(console.error);

    const isActive = injuryData.status === 'Lesionado' || injuryData.status === 'En Recuperación' || injuryData.status === 'Activa';
    const isReintegro = injuryData.status === 'En Reintegro Deportivo' || injuryData.status === 'En Reintegro';

    if (targetPlayer) {
      // Automatic chronological history in player profile
      const currentInjuries = targetPlayer.injuries || [];
      const updatedInjuries = [newInjury, ...currentInjuries.filter((i) => i.id !== newId)].sort(
        (a, b) => new Date(b.dateInjured).getTime() - new Date(a.dateInjured).getTime()
      );

      updatePlayer(targetPlayer.id, {
        injuries: updatedInjuries,
        status: isActive ? 'Lesionado' : isReintegro ? 'Duda' : targetPlayer.status,
        statusReason: isActive 
          ? `${injuryData.injuryType} (${injuryData.bodyZone})` 
          : isReintegro 
          ? `${injuryData.injuryType} (En Reintegro Deportivo)` 
          : targetPlayer.statusReason,
      });
    }

    return newId;
  };

  const updateInjury = (id: string, partial: Partial<PlayerInjury>) => {
    const existing = injuries.find((i) => i.id === id);
    if (!existing) return;

    const updated = { ...existing, ...partial };
    setInjuries((prev) => prev.map((i) => (i.id === id ? updated : i)));
    setDoc(doc(db, 'injuries', id), updated, { merge: true }).catch(console.error);

    const playerId = updated.playerId;
    const targetPlayer = players.find((p) => p.id === playerId);

    const isNowAlta = partial.status === 'Alta Médica';
    const isNowActive = partial.status === 'Lesionado' || partial.status === 'En Recuperación' || partial.status === 'Activa';
    const isNowReintegro = partial.status === 'En Reintegro Deportivo' || partial.status === 'En Reintegro';

    if (targetPlayer) {
      const currentInjuries = targetPlayer.injuries || [];
      const updatedInjuries = currentInjuries.map((i) => (i.id === id ? updated : i)).sort(
        (a, b) => new Date(b.dateInjured).getTime() - new Date(a.dateInjured).getTime()
      );

      if (isNowAlta) {
        const hasOtherActive = injuries.some((i) => 
          i.id !== id && i.playerId === playerId && 
          (i.status === 'Lesionado' || i.status === 'En Recuperación' || i.status === 'Activa')
        );
        updatePlayer(playerId, {
          injuries: updatedInjuries,
          status: hasOtherActive ? 'Lesionado' : 'Disponible',
          statusReason: hasOtherActive ? targetPlayer.statusReason : undefined,
        });
      } else if (isNowActive) {
        updatePlayer(playerId, {
          injuries: updatedInjuries,
          status: 'Lesionado',
          statusReason: `${updated.injuryType} (${updated.bodyZone})`,
        });
      } else if (isNowReintegro) {
        updatePlayer(playerId, {
          injuries: updatedInjuries,
          status: 'Duda',
          statusReason: `${updated.injuryType} (En Reintegro Deportivo)`,
        });
      } else {
        updatePlayer(playerId, { injuries: updatedInjuries });
      }
    }
  };

  const dischargeInjury = (id: string, returnDate?: string) => {
    const today = returnDate || new Date().toISOString().slice(0, 10);
    updateInjury(id, {
      status: 'Alta Médica',
      actualReturnDate: today,
      notes: `Alta médica otorgada el ${today}. Apto para competición oficial.`
    });
  };

  const deleteInjury = (id: string) => {
    const target = injuries.find((i) => i.id === id);
    setInjuries((prev) => prev.filter((i) => i.id !== id));
    deleteDoc(doc(db, 'injuries', id)).catch(console.error);

    if (target) {
      const targetPlayer = players.find((p) => p.id === target.playerId);
      const otherActive = injuries.some((i) => 
        i.id !== id && i.playerId === target.playerId && 
        (i.status === 'Lesionado' || i.status === 'En Recuperación' || i.status === 'Activa')
      );
      if (targetPlayer) {
        const remainingHistory = (targetPlayer.injuries || []).filter((i) => i.id !== id);
        updatePlayer(target.playerId, {
          injuries: remainingHistory,
          status: otherActive ? 'Lesionado' : 'Disponible',
          statusReason: otherActive ? targetPlayer.statusReason : undefined,
        });
      }
    }
  };

  // Record an injury incident directly during a match
  const recordMatchInjury = (
    matchId: string, 
    incidentData: Omit<MatchInjuryIncident, 'id'>, 
    createMedicalRecord: boolean = true
  ) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch) return;

    const incidentId = `minj-${Date.now()}`;
    const newIncident: MatchInjuryIncident = {
      ...incidentData,
      id: incidentId,
    };

    let medicalInjuryId: string | undefined = undefined;

    if (createMedicalRecord) {
      medicalInjuryId = addInjury({
        playerId: incidentData.playerId,
        playerName: incidentData.playerName,
        playerSquadNumber: incidentData.playerSquadNumber,
        category: targetMatch.category,
        injuryType: incidentData.injuryType || 'Lesión en Partido Oficial',
        bodyZone: incidentData.bodyZone || 'Por evaluar en kinesiología',
        description: incidentData.description,
        diagnosis: `Lesión en partido ${targetMatch.matchDay} vs ${targetMatch.opponent} (Minuto ${incidentData.minute}'). ${incidentData.description}`,
        severity: incidentData.severity || 'Moderada',
        dateInjured: targetMatch.date,
        status: 'Lesionado',
        treatment: 'Atención kinésica de urgencia en terreno de juego y reposo deportivo inmediato.',
        medicalStaff: targetMatch.coachStaff?.kinesiologist || 'Kinesiólogo San Luis',
        notes: `Ocurrió en partido oficial vs ${targetMatch.opponent} en el minuto ${incidentData.minute}'. ${incidentData.description}`,
        matchId: targetMatch.id,
        season: '2026',
      });
      newIncident.recordedInMedicalModule = true;
      newIncident.medicalInjuryId = medicalInjuryId;
    }

    // Add match event to timeline
    const injuryEvent: MatchEvent = {
      id: `ev-${Date.now()}`,
      minute: incidentData.minute,
      type: 'injury',
      playerId: incidentData.playerId,
      detail: `Lesión: ${incidentData.description}`,
      injuryIncident: newIncident,
    };

    const updatedIncidents = [...(targetMatch.injuryIncidents || []), newIncident];
    const updatedEvents = [...targetMatch.events, injuryEvent].sort((a, b) => a.minute - b.minute);

    updateMatch(matchId, {
      injuryIncidents: updatedIncidents,
      events: updatedEvents,
    });
  };

  const removeMatchInjury = (matchId: string, incidentId: string) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    if (!targetMatch) return;

    const updatedIncidents = (targetMatch.injuryIncidents || []).filter((i) => i.id !== incidentId);
    const updatedEvents = targetMatch.events.filter((e) => e.injuryIncident?.id !== incidentId);

    updateMatch(matchId, {
      injuryIncidents: updatedIncidents,
      events: updatedEvents,
    });
  };

  const addCitation = (citationData: Omit<MatchCitation, 'id' | 'createdAt'>): string => {
    const newId = `cit-${Date.now()}`;
    const newCitation: MatchCitation = {
      ...citationData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setCitations((prev) => [newCitation, ...prev]);
    setDoc(doc(db, 'citations', newId), newCitation).catch(console.error);
    return newId;
  };

  const updateCitation = (id: string, partial: Partial<MatchCitation>) => {
    setCitations((prev) => prev.map((c) => (c.id === id ? { ...c, ...partial } : c)));
    setDoc(doc(db, 'citations', id), partial, { merge: true }).catch(console.error);
  };

  const deleteCitation = (id: string) => {
    setCitations((prev) => prev.filter((c) => c.id !== id));
    deleteDoc(doc(db, 'citations', id)).catch(console.error);
  };

  const getCitationById = (id: string) => {
    return citations.find((c) => c.id === id);
  };

  // Physical Area (Sub-14 a Sub-20) & GPS (Sub-20)
  const updateMatchPhysicalReport = (matchId: string, report: MatchPhysicalReport) => {
    updateMatch(matchId, { physicalReport: report });
  };

  const updateMatchGpsReport = (matchId: string, report: MatchGpsReport) => {
    updateMatch(matchId, { gpsReport: report });
  };

  // Weekly Physical Control (Sub-16 a Sub-20): Check-in & Check-out
  const addWeeklyCheckIn = (entryData: Omit<WeeklyCheckInEntry, 'id' | 'createdAt'>): string => {
    const newId = `wcin-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newEntry: WeeklyCheckInEntry = {
      ...entryData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setWeeklyCheckIns((prev) => [newEntry, ...prev.filter(e => !(e.playerId === newEntry.playerId && e.date === newEntry.date))]);
    setDoc(doc(db, 'checkins', newId), newEntry).catch(console.error);
    return newId;
  };

  const updateWeeklyCheckIn = (id: string, partial: Partial<WeeklyCheckInEntry>) => {
    setWeeklyCheckIns((prev) => prev.map((e) => (e.id === id ? { ...e, ...partial } : e)));
    setDoc(doc(db, 'checkins', id), partial, { merge: true }).catch(console.error);
  };

  const deleteWeeklyCheckIn = (id: string) => {
    setWeeklyCheckIns((prev) => prev.filter((e) => e.id !== id));
    deleteDoc(doc(db, 'checkins', id)).catch(console.error);
  };

  const addWeeklyCheckInsBatch = (entries: Omit<WeeklyCheckInEntry, 'id' | 'createdAt'>[]) => {
    if (!entries || entries.length === 0) return;
    const now = new Date().toISOString();
    const newItems: WeeklyCheckInEntry[] = entries.map((entryData, idx) => ({
      ...entryData,
      id: `wcin-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: now,
    }));

    setWeeklyCheckIns((prev) => {
      const keys = new Set(newItems.map((n) => `${n.playerId}_${n.date}`));
      return [...newItems, ...prev.filter((e) => !keys.has(`${e.playerId}_${e.date}`))];
    });

    try {
      const batch = writeBatch(db);
      newItems.forEach((item) => {
        batch.set(doc(db, 'checkins', item.id), item);
      });
      batch.commit().catch(console.error);
    } catch (err) {
      console.warn('Batch checkins Firestore write error', err);
    }
  };

  const addWeeklyCheckOut = (entryData: Omit<WeeklyCheckOutEntry, 'id' | 'createdAt'>): string => {
    const newId = `wcout-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newEntry: WeeklyCheckOutEntry = {
      ...entryData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setWeeklyCheckOuts((prev) => [newEntry, ...prev.filter(e => !(e.playerId === newEntry.playerId && e.date === newEntry.date))]);
    setDoc(doc(db, 'checkouts', newId), newEntry).catch(console.error);
    return newId;
  };

  const addWeeklyCheckOutsBatch = (entries: Omit<WeeklyCheckOutEntry, 'id' | 'createdAt'>[]) => {
    if (!entries || entries.length === 0) return;
    const now = new Date().toISOString();
    const newItems: WeeklyCheckOutEntry[] = entries.map((entryData, idx) => ({
      ...entryData,
      id: `wcout-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: now,
    }));

    setWeeklyCheckOuts((prev) => {
      const keys = new Set(newItems.map((n) => `${n.playerId}_${n.date}`));
      return [...newItems, ...prev.filter((e) => !keys.has(`${e.playerId}_${e.date}`))];
    });

    try {
      const batch = writeBatch(db);
      newItems.forEach((item) => {
        batch.set(doc(db, 'checkouts', item.id), item);
      });
      batch.commit().catch(console.error);
    } catch (err) {
      console.warn('Batch checkouts Firestore write error', err);
    }
  };

  const updateWeeklyCheckOut = (id: string, partial: Partial<WeeklyCheckOutEntry>) => {
    setWeeklyCheckOuts((prev) => prev.map((e) => (e.id === id ? { ...e, ...partial } : e)));
    setDoc(doc(db, 'checkouts', id), partial, { merge: true }).catch(console.error);
  };

  const deleteWeeklyCheckOut = (id: string) => {
    setWeeklyCheckOuts((prev) => prev.filter((e) => e.id !== id));
    deleteDoc(doc(db, 'checkouts', id)).catch(console.error);
  };

  // Backup & Restore
  const resetToDefaultData = () => {
    setPlayers(INITIAL_PLAYERS);
    setMatches(INITIAL_MATCHES);
    setInjuries(INITIAL_INJURIES);
    setCitations(INITIAL_CITATIONS);
    setWeeklyCheckIns(INITIAL_WEEKLY_CHECKINS);
    setWeeklyCheckOuts(INITIAL_WEEKLY_CHECKOUTS);
    setClubInfo(INITIAL_CLUB_INFO);
    setActiveCategoryState('Sub 14');
    setCategoryStaff(INITIAL_STAFF_BY_CATEGORY);
    setSelectedMatchId(INITIAL_MATCHES[0].id);
    localStorage.removeItem(STORAGE_KEY_PLAYERS);
    localStorage.removeItem(STORAGE_KEY_MATCHES);
    localStorage.removeItem(STORAGE_KEY_INJURIES);
    localStorage.removeItem(STORAGE_KEY_CITATIONS);
    localStorage.removeItem(STORAGE_KEY_CHECKINS);
    localStorage.removeItem(STORAGE_KEY_CHECKOUTS);
    localStorage.removeItem(STORAGE_KEY_CLUB);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_CATEGORY);
    localStorage.removeItem(STORAGE_KEY_STAFF_BY_CAT);

    try {
      const batch = writeBatch(db);
      INITIAL_PLAYERS.forEach((p) => {
        batch.set(doc(db, 'players', p.id), p);
      });
      INITIAL_MATCHES.forEach((m) => {
        batch.set(doc(db, 'matches', m.id), m);
      });
      INITIAL_INJURIES.forEach((inj) => {
        batch.set(doc(db, 'injuries', inj.id), inj);
      });
      INITIAL_CITATIONS.forEach((cit) => {
        batch.set(doc(db, 'citations', cit.id), cit);
      });
      batch.set(doc(db, 'club', 'info'), INITIAL_CLUB_INFO);
      Object.entries(INITIAL_STAFF_BY_CATEGORY).forEach(([cat, staff]) => {
        batch.set(doc(db, 'staff', cat), staff);
      });
      batch.commit().catch(console.error);
    } catch (e) {
      console.error('Error resetting Firestore data:', e);
    }
  };

  const exportDatabaseJson = () => {
    let usersData = [];
    try {
      const savedUsers = localStorage.getItem('san_luis_users_v2');
      if (savedUsers) usersData = JSON.parse(savedUsers);
    } catch {
      usersData = [];
    }

    const data = {
      version: 2,
      exportDate: new Date().toISOString(),
      clubInfo,
      players,
      matches,
      injuries,
      citations,
      weeklyCheckIns,
      weeklyCheckOuts,
      categoryStaff,
      activeCategory,
      users: usersData
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `san_luis_datos_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      const batch = writeBatch(db);

      if (data.players && Array.isArray(data.players)) {
        setPlayers(data.players);
        data.players.forEach((p: Player) => {
          if (p.id) batch.set(doc(db, 'players', p.id), p);
        });
      }
      if (data.matches && Array.isArray(data.matches)) {
        setMatches(data.matches);
        data.matches.forEach((m: MatchSheet) => {
          if (m.id) batch.set(doc(db, 'matches', m.id), m);
        });
        if (data.matches.length > 0) {
          setSelectedMatchId(data.matches[0].id);
        }
      }
      if (data.injuries && Array.isArray(data.injuries)) {
        setInjuries(data.injuries);
        data.injuries.forEach((inj: PlayerInjury) => {
          if (inj.id) batch.set(doc(db, 'injuries', inj.id), inj);
        });
      }
      if (data.citations && Array.isArray(data.citations)) {
        setCitations(data.citations);
        data.citations.forEach((cit: MatchCitation) => {
          if (cit.id) batch.set(doc(db, 'citations', cit.id), cit);
        });
      }
      if (data.weeklyCheckIns && Array.isArray(data.weeklyCheckIns)) {
        setWeeklyCheckIns(data.weeklyCheckIns);
      }
      if (data.weeklyCheckOuts && Array.isArray(data.weeklyCheckOuts)) {
        setWeeklyCheckOuts(data.weeklyCheckOuts);
      }
      if (data.clubInfo && typeof data.clubInfo === 'object') {
        setClubInfo(data.clubInfo);
        batch.set(doc(db, 'club', 'info'), data.clubInfo);
      }
      if (data.categoryStaff && typeof data.categoryStaff === 'object') {
        setCategoryStaff(data.categoryStaff);
        Object.entries(data.categoryStaff).forEach(([cat, staff]) => {
          batch.set(doc(db, 'staff', cat), staff as CoachStaff);
        });
      }
      if (data.activeCategory && typeof data.activeCategory === 'string') {
        setActiveCategoryState(data.activeCategory);
      }
      if (data.users && Array.isArray(data.users)) {
        localStorage.setItem('san_luis_users_v2', JSON.stringify(data.users));
        data.users.forEach((u: any) => {
          if (u.id) batch.set(doc(db, 'users', u.id), u);
        });
      }
      batch.commit().catch(console.error);
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
        activeCategory,
        setActiveCategory,
        categoryStaff,
        getCategoryStaff,
        updateCategoryStaff,
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
        injuries,
        addInjury,
        updateInjury,
        deleteInjury,
        dischargeInjury,
        isPlayerInjured,
        recordMatchInjury,
        removeMatchInjury,
        citations,
        addCitation,
        updateCitation,
        deleteCitation,
        getCitationById,
        updateMatchPhysicalReport,
        updateMatchGpsReport,
        weeklyCheckIns,
        addWeeklyCheckIn,
        addWeeklyCheckInsBatch,
        updateWeeklyCheckIn,
        deleteWeeklyCheckIn,
        weeklyCheckOuts,
        addWeeklyCheckOut,
        addWeeklyCheckOutsBatch,
        updateWeeklyCheckOut,
        deleteWeeklyCheckOut,
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

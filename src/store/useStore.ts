import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { type Stats, type Quest, type CharacterAnalysis } from '../lib/gemini';
import { type DecayResult } from '../lib/decaySystem';

export type Page = 'LANDING' | 'LOGIN' | 'REGISTER' | 'COMPLETE_PROFILE' | 'ONBOARDING' | 'CHARACTER_REVEAL' | 'DASHBOARD' | 'SETTINGS' | 'PROFILE' | 'ADMIN' | 'LEADERBOARD';

interface AppState {
  // Navigation
  page: Page;
  setPage: (page: Page | ((prev: Page) => Page)) => void;

  // Auth & User
  session: Session | null;
  dbUserId: string | null;
  name: string;
  level: number;
  xp: number;
  streak: number;
  lastStreakDate: string | null;
  userContext: { usia?: number; gender?: string; username?: string };
  nameChangeCount: number;
  lastNameChange: string | null;
  talents: string[];
  
  setSession: (session: Session | null | ((prev: Session | null) => Session | null)) => void;
  setDbUserId: (id: string | null | ((prev: string | null) => string | null)) => void;
  setName: (name: string | ((prev: string) => string)) => void;
  setLevel: (level: number | ((prev: number) => number)) => void;
  setXp: (xp: number | ((prev: number) => number)) => void;
  setStreak: (streak: number | ((prev: number) => number)) => void;
  setLastStreakDate: (date: string | null | ((prev: string | null) => string | null)) => void;
  setUserContext: (context: { usia?: number; gender?: string; username?: string } | ((prev: { usia?: number; gender?: string; username?: string }) => { usia?: number; gender?: string; username?: string })) => void;
  setNameChangeCount: (count: number | ((prev: number) => number)) => void;
  setLastNameChange: (date: string | null | ((prev: string | null) => string | null)) => void;
  setTalents: (talents: string[] | ((prev: string[]) => string[])) => void;

  // Game Data
  stats: Stats;
  characterAnalysis: CharacterAnalysis | null;
  quests: Quest[];
  statHistory: any[];
  isRefreshing: boolean;
  lastEvolutionDate: string | null;
  refreshCount: number;
  decayResult: DecayResult | null;
  showLevelUp: boolean;
  isDataReady: boolean;

  setStats: (stats: Stats | ((prev: Stats) => Stats)) => void;
  setCharacterAnalysis: (analysis: CharacterAnalysis | null | ((prev: CharacterAnalysis | null) => CharacterAnalysis | null)) => void;
  setQuests: (quests: Quest[] | ((prev: Quest[]) => Quest[])) => void;
  setStatHistory: (history: any[] | ((prev: any[]) => any[])) => void;
  setIsRefreshing: (isRefreshing: boolean | ((prev: boolean) => boolean)) => void;
  setLastEvolutionDate: (date: string | null | ((prev: string | null) => string | null)) => void;
  setRefreshCount: (count: number | ((prev: number) => number)) => void;
  setDecayResult: (result: DecayResult | null | ((prev: DecayResult | null) => DecayResult | null)) => void;
  setShowLevelUp: (show: boolean | ((prev: boolean) => boolean)) => void;
  setIsDataReady: (ready: boolean | ((prev: boolean) => boolean)) => void;
}

export const useStore = create<AppState>((set) => ({
  // Navigation
  page: 'LANDING',
  setPage: (page) => set((state) => ({ page: typeof page === 'function' ? page(state.page) : page })),

  // Auth & User
  session: null,
  dbUserId: null,
  name: 'Player One',
  level: 1,
  xp: 0,
  streak: 0,
  lastStreakDate: null,
  userContext: {},
  nameChangeCount: 0,
  lastNameChange: null,
  talents: [],

  setSession: (session) => set((state) => ({ session: typeof session === 'function' ? session(state.session) : session })),
  setDbUserId: (dbUserId) => set((state) => ({ dbUserId: typeof dbUserId === 'function' ? dbUserId(state.dbUserId) : dbUserId })),
  setName: (name) => set((state) => ({ name: typeof name === 'function' ? name(state.name) : name })),
  setLevel: (level) => set((state) => ({ level: typeof level === 'function' ? level(state.level) : level })),
  setXp: (xp) => set((state) => ({ xp: typeof xp === 'function' ? xp(state.xp) : xp })),
  setStreak: (streak) => set((state) => ({ streak: typeof streak === 'function' ? streak(state.streak) : streak })),
  setLastStreakDate: (lastStreakDate) => set((state) => ({ lastStreakDate: typeof lastStreakDate === 'function' ? lastStreakDate(state.lastStreakDate) : lastStreakDate })),
  setUserContext: (userContext) => set((state) => ({ userContext: typeof userContext === 'function' ? userContext(state.userContext) : userContext })),
  setNameChangeCount: (nameChangeCount) => set((state) => ({ nameChangeCount: typeof nameChangeCount === 'function' ? nameChangeCount(state.nameChangeCount) : nameChangeCount })),
  setLastNameChange: (lastNameChange) => set((state) => ({ lastNameChange: typeof lastNameChange === 'function' ? lastNameChange(state.lastNameChange) : lastNameChange })),
  setTalents: (talents) => set((state) => ({ talents: typeof talents === 'function' ? talents(state.talents) : talents })),

  // Game Data
  stats: {
    JIWA: 50,
    RAGA: 50,
    HARTA: 50,
    ILMU: 50,
    KARMA: 50,
  },
  characterAnalysis: null,
  quests: [],
  statHistory: [],
  isRefreshing: false,
  lastEvolutionDate: null,
  refreshCount: 0,
  decayResult: null,
  showLevelUp: false,
  isDataReady: false,

  setStats: (stats) => set((state) => ({ stats: typeof stats === 'function' ? stats(state.stats) : stats })),
  setCharacterAnalysis: (characterAnalysis) => set((state) => ({ characterAnalysis: typeof characterAnalysis === 'function' ? characterAnalysis(state.characterAnalysis) : characterAnalysis })),
  setQuests: (quests) => set((state) => ({ quests: typeof quests === 'function' ? quests(state.quests) : quests })),
  setStatHistory: (statHistory) => set((state) => ({ statHistory: typeof statHistory === 'function' ? statHistory(state.statHistory) : statHistory })),
  setIsRefreshing: (isRefreshing) => set((state) => ({ isRefreshing: typeof isRefreshing === 'function' ? isRefreshing(state.isRefreshing) : isRefreshing })),
  setLastEvolutionDate: (lastEvolutionDate) => set((state) => ({ lastEvolutionDate: typeof lastEvolutionDate === 'function' ? lastEvolutionDate(state.lastEvolutionDate) : lastEvolutionDate })),
  setRefreshCount: (refreshCount) => set((state) => ({ refreshCount: typeof refreshCount === 'function' ? refreshCount(state.refreshCount) : refreshCount })),
  setDecayResult: (decayResult) => set((state) => ({ decayResult: typeof decayResult === 'function' ? decayResult(state.decayResult) : decayResult })),
  setShowLevelUp: (showLevelUp) => set((state) => ({ showLevelUp: typeof showLevelUp === 'function' ? showLevelUp(state.showLevelUp) : showLevelUp })),
  setIsDataReady: (isDataReady) => set((state) => ({ isDataReady: typeof isDataReady === 'function' ? isDataReady(state.isDataReady) : isDataReady })),
}));

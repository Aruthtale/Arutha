import React, { useEffect, useRef, Suspense, lazy } from 'react';
import { Session } from '@supabase/supabase-js';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './lib/supabase';
import { getLocalTimestamp, getTodayDate, isToday, isNewDay, extractDate } from './lib/dateUtils';
import { TALENTS } from './lib/talents';
import { generateDailyQuests, verifyQuestCompletion, generateRecoveryQuests, type CharacterAnalysis, type Quest, type Stats, type Dimension } from './lib/gemini';
import { Navbar } from './components/Navbar';
import { TalentSelector } from './components/TalentSelector';
import { checkAndApplyDecay, resetFatigue } from './lib/decaySystem';
import { cn } from './lib/utils';
import { Star } from 'lucide-react';
import { isAdmin } from './lib/config';
import { SplashScreen } from './components/SplashScreen';
import { useStore } from './store/useStore';
import { PullToRefresh } from './components/PullToRefresh';
import { PageSkeleton } from './components/Skeleton';

// Lazy Load Pages for Performance
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const CharacterReveal = lazy(() => import('./pages/CharacterReveal').then(m => ({ default: m.CharacterReveal })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const CompleteGoogleProfile = lazy(() => import('./pages/CompleteGoogleProfile').then(m => ({ default: m.CompleteGoogleProfile })));
const Codex = lazy(() => import('./pages/Codex').then(m => ({ default: m.Codex })));
const Leaderboard = lazy(() => import('./pages/Leaderboard').then(m => ({ default: m.Leaderboard })));
const Mail = lazy(() => import('./pages/Mail').then(m => ({ default: m.Mail })));
const MentalHealthChat = lazy(() => import('./pages/MentalHealthChat').then(m => ({ default: m.MentalHealthChat })));

export default function App() {
  const {
    page, setPage,
    session, setSession,
    dbUserId, setDbUserId,
    isDataReady, setIsDataReady,
    decayResult, setDecayResult,
    name, setName,
    level, setLevel,
    xp, setXp,
    stats, setStats,
    characterAnalysis, setCharacterAnalysis,
    quests, setQuests,
    statHistory, setStatHistory,
    isRefreshing, setIsRefreshing,
    lastEvolutionDate, setLastEvolutionDate,
    refreshCount, setRefreshCount,
    streak, setStreak,
    lastStreakDate, setLastStreakDate,
    showLevelUp, setShowLevelUp,
    nameChangeCount, setNameChangeCount,
    lastNameChange, setLastNameChange,
    userContext, setUserContext,
    talents, setTalents
  } = useStore();

  const [levelUpStage, setLevelUpStage] = React.useState<1 | 2>(1);

  const refreshLockRef = useRef(false);
  const initLockRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        initializeUserData(session);
      } else {
        setIsDataReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED')) {
        initializeUserData(session);
      } else if (!session) {
        setPage('LANDING');
      }
    });

    // Detect Errors in URL (like expired OTP)
    const hash = window.location.hash;
    if (hash && hash.includes('error=')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const errorDesc = params.get('error_description');
      if (errorDesc) alert(`Auth Error: ${errorDesc.replace(/\+/g, ' ')}`);
    }

    // Handle Deep Links (for Mobile Auth)
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('appUrlOpen', async (data: any) => {
        const url = new URL(data.url);
        // Supabase tokens are usually in the hash (e.g. #access_token=...)
        const hash = url.hash.substring(1);
        if (hash) {
          const params = new URLSearchParams(hash);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          if (access_token && refresh_token) {
            const { data: { session }, error } = await supabase.auth.setSession({
              access_token,
              refresh_token
            });
            if (session) {
              setSession(session);
              initializeUserData(session);
            }
          }
        }
      });
    }

    return () => {
      subscription.unsubscribe();
      if (Capacitor.isNativePlatform()) {
        CapApp.removeAllListeners();
      }
    };
  }, []);

  const initializeUserData = async (session: Session) => {
    if (initLockRef.current) return;
    initLockRef.current = true;
    
    const userMetadata = session.user.user_metadata;
    const displayName = userMetadata.full_name || userMetadata.username || session.user.email?.split('@')[0] || 'Player One';
    setName(displayName);

    try {
      const userEmail = session.user.email || `user_${session.user.id.slice(0, 8)}@arutha.local`;
      const now = getLocalTimestamp();

      // 1. Coba ambil user berdasarkan supabase_id (paling akurat)
      let { data: userData, error: fetchError } = await supabase
        .from('arutha_user')
        .select('*')
        .eq('supabase_id', session.user.id)
        .maybeSingle();

      // 2. Jika tidak ada, coba cari berdasarkan email (data healing untuk user lama)
      if (!userData) {
        const { data: emailUser } = await supabase
          .from('arutha_user')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();
        
        if (emailUser) {
          userData = emailUser;
          // Update supabase_id jika belum ada
          await supabase.from('arutha_user').update({ supabase_id: session.user.id }).eq('id', emailUser.id);
        }
      }

      // 3. Jika benar-benar tidak ada, baru buat baru
      if (!userData) {
        const { data: newList, error: insertError } = await supabase
          .from('arutha_user')
          .insert({
            supabase_id: session.user.id,
            email: userEmail,
            username: displayName,
            updated_at: now,
            level: 1,
            xp: 0,
            streak: 0
          })
          .select();
        
        if (insertError) throw insertError;
        userData = newList?.[0];
      }

      if (userData) {
        setDbUserId(userData.id);
        setName(userData.username || displayName); // Use the username from database if exists
        setLevel(userData.level || 1);
        setXp(userData.xp || 0);

        // 3. Jalankan Decay System
        const decayResult = await checkAndApplyDecay(userData.id);
        setDecayResult(decayResult);

        // logic Streak — menggunakan waktu lokal device
        const lsd = userData.last_streak_date;
        const currentStreak = userData.streak || 0;
        setLastStreakDate(lsd ? String(lsd) : null);

        if (lsd) {
          // Hitung selisih hari berdasarkan tanggal lokal (YYYY-MM-DD substring)
          const lastDateStr = extractDate(lsd);
          const todayStr = extractDate(getLocalTimestamp());
          if (lastDateStr && todayStr && lastDateStr < todayStr) {
            // Hitung selisih hari
            const lastD = new Date(lastDateStr + 'T00:00:00');
            const todayD = new Date(todayStr + 'T00:00:00');
            const diffDays = Math.round((todayD.getTime() - lastD.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > 1) {
              setStreak(0);
              await supabase.from('arutha_user').update({ streak: 0 }).eq('supabase_id', session.user.id);
            } else {
              setStreak(currentStreak);
            }
          } else {
            setStreak(currentStreak);
          }
        } else {
          setStreak(0);
        }

        setNameChangeCount(userData.name_change_count || 0);
        setLastNameChange(userData.last_name_change ? String(userData.last_name_change) : null);
        setTalents(userData.talents || []);

        // Reset Refresh Count jika sudah berganti hari
        const refreshNewDay = isNewDay(userData.last_refresh_date);
        setRefreshCount(refreshNewDay ? 0 : (userData.refresh_count || 0));
        if (refreshNewDay) refreshLockRef.current = false;

        setUserContext({ usia: userData.usia, gender: userData.gender, username: displayName });

        if (!userData.usia || !userData.gender) {
          setPage('COMPLETE_PROFILE');
          return;
        }

        const { data: profiles } = await supabase
          .from('character_profile')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(1);

        let profileData = profiles?.[0];

        // --- DATA HEALING: Cari berdasarkan user_id, jika gagal baru email ---
        if (!profileData && userData.email) {
          const { data: altProfiles } = await supabase
            .from('character_profile')
            .select('*')
            .eq('user_id', userData.id)
            .limit(1);
          profileData = altProfiles?.[0];
        }

        if (profileData) {
          setLastEvolutionDate(profileData.created_at);
          const loadedStats = {
            JIWA: profileData.jiwa,
            RAGA: profileData.raga,
            HARTA: profileData.harta,
            ILMU: profileData.ilmu,
            KARMA: profileData.karma,
          };
          setCharacterAnalysis({
            personality_type: profileData.personality_type,
            personality_title: profileData.personality_title,
            personality_desc: profileData.personality_desc,
            stats: loadedStats,
            character_summary: profileData.character_summary,
            starter_quest: { title: '', desc: '', stat: '' }
          });
          setStats(loadedStats);

          const isQuestExpired = isNewDay(userData.last_quest_update);
          const hasNoQuests = !userData.active_quests || (userData.active_quests as any[]).length === 0;

          if (isQuestExpired || hasNoQuests) {
            console.log("[Quest] Expired or Empty. Regenerating...", { 
              isQuestExpired, 
              hasNoQuests, 
              lastUpdate: userData.last_quest_update,
              today: getTodayDate()
            });
            const aiQuests = await generateDailyQuests(loadedStats);
            setQuests(aiQuests);
            setRefreshCount(0);
            refreshLockRef.current = false;
            await supabase.from('arutha_user').update({
              active_quests: aiQuests,
              last_quest_update: getLocalTimestamp(),
              refresh_count: 0,
              last_refresh_date: getLocalTimestamp()
            }).eq('supabase_id', session.user.id);
          } else {
            const dbQuests = userData.active_quests as Quest[];
            // Only update if current quests are empty to avoid overwriting during session refreshes
            setQuests(prev => {
              if (prev.length > 0) {
                console.log("[Quest] Already have quests, skipping DB overwrite to prevent race conditions.");
                return prev;
              }
              console.log("[Quest] Loading quests from DB.");
              return dbQuests;
            });
            
            if ((userData.refresh_count || 0) >= 1) {
              refreshLockRef.current = true;
            }
          }

          fetchStatHistory(userData.id);

          setPage(prev => {
            const entryPages = ['LANDING', 'LOGIN', 'REGISTER', 'ONBOARDING', 'CHARACTER_REVEAL', 'COMPLETE_PROFILE'];
            if (entryPages.includes(prev)) return 'DASHBOARD';
            return prev;
          });
        } else {
          setPage('ONBOARDING');
        }
      }
    } catch (err: any) {
      console.error("Init error detailed:", err.message || err);
    } finally {
      setIsDataReady(true);
      initLockRef.current = false;
    }
  };

  const fetchStatHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('stat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(7);

      if (error) throw error;
      if (data) setStatHistory(data.reverse());
    } catch (err) {
      console.error("Fetch history error:", err);
    }
  };

  const syncProgress = async (newLevel: number, newXp: number, newStats: Stats, updatedQuests?: Quest[]) => {
    if (!session || !dbUserId) return;
    try {
      const updateData: any = { level: newLevel, xp: newXp };
      if (updatedQuests) updateData.active_quests = updatedQuests;
      await supabase.from('arutha_user').update(updateData).eq('supabase_id', session.user.id);

      const { data: profiles } = await supabase.from('character_profile').select('id').eq('user_id', dbUserId).order('created_at', { ascending: false }).limit(1);
      const latestProfile = profiles?.[0];
      if (latestProfile) {
        await supabase.from('character_profile').update({
          jiwa: newStats.JIWA, raga: newStats.RAGA, harta: newStats.HARTA, ilmu: newStats.ILMU, karma: newStats.KARMA,
        }).eq('id', latestProfile.id);
      }

      const { data: lastLogs } = await supabase
        .from('stat_history')
        .select('id, created_at')
        .eq('user_id', dbUserId)
        .order('created_at', { ascending: false })
        .limit(1);

      const historyData = {
        jiwa: Math.round(newStats.JIWA || 0),
        raga: Math.round(newStats.RAGA || 0),
        harta: Math.round(newStats.HARTA || 0),
        ilmu: Math.round(newStats.ILMU || 0),
        karma: Math.round(newStats.KARMA || 0)
      };

      const isTodayLog = lastLogs && lastLogs.length > 0 && 
        isToday(lastLogs[0].created_at);

      if (isTodayLog) {
        await supabase.from('stat_history').update(historyData).eq('id', lastLogs[0].id);
      } else {
        await supabase.from('stat_history').insert({
          id: crypto.randomUUID(),
          user_id: dbUserId,
          ...historyData
        });
      }
      // Selalu fetch ulang agar UI (grafik) langsung terupdate
      fetchStatHistory(dbUserId);

    } catch (err: any) { 
      console.error("Sync error:", err.message || err); 
    }
  };

  const handleOnboardingComplete = async (analysis: CharacterAnalysis) => {
    if (!session) return;
    try {
      let { data: users } = await supabase
        .from('arutha_user')
        .select('id, level, xp, active_quests, last_quest_update, refresh_count, last_refresh_date')
        .eq('supabase_id', session.user.id)
        .limit(1);

      const userData = users?.[0];

      if (userData) {
        const { data: existingProfiles } = await supabase
          .from('character_profile')
          .select('id')
          .eq('user_id', userData.id)
          .limit(1);

        const profilePayload = {
          user_id: userData.id,
          personality_type: analysis.personality_type,
          personality_title: analysis.personality_title,
          personality_desc: analysis.personality_desc,
          character_summary: analysis.character_summary,
          jiwa: analysis.stats.JIWA,
          raga: analysis.stats.RAGA,
          harta: analysis.stats.HARTA,
          ilmu: analysis.stats.ILMU,
          karma: analysis.stats.KARMA,
        };

        let profileDate = new Date().toISOString();

        if (existingProfiles && existingProfiles.length > 0) {
          const { data: updated, error: updateErr } = await supabase
            .from('character_profile')
            .update(profilePayload)
            .eq('id', existingProfiles[0].id)
            .select();
          if (updateErr) {
            console.error('character_profile UPDATE failed:', updateErr);
            alert(`Gagal menyimpan profil karakter: ${updateErr.message}`);
          }
          if (updated?.[0]) profileDate = updated[0].created_at;
        } else {
          const { data: inserted, error: insertErr } = await supabase
            .from('character_profile')
            .insert({
              id: crypto.randomUUID(),
              ...profilePayload
            })
            .select();
          if (insertErr) {
            console.error('character_profile INSERT failed:', insertErr);
            console.error('Payload was:', profilePayload);
            alert(`Gagal menyimpan profil karakter: ${insertErr.message}. Cek RLS policy di Supabase.`);
          }
          if (inserted?.[0]) profileDate = inserted[0].created_at;
        }

        setLastEvolutionDate(profileDate);

        const aiQuests = await generateDailyQuests(analysis.stats);
        setQuests(aiQuests);

        await supabase
          .from('arutha_user')
          .update({ active_quests: aiQuests, last_quest_update: getLocalTimestamp() })
          .eq('id', userData.id);
      }
    } catch (err) {
      console.error("Save error:", err);
    }
    setCharacterAnalysis(analysis);
    setStats(analysis.stats);
    setPage('CHARACTER_REVEAL');
  };


  const handleTakeRecovery = async () => {
    if (!dbUserId || !decayResult || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const recQuests = await generateRecoveryQuests(decayResult.fatigueDays);
      setQuests(recQuests);
      await supabase.from('arutha_user').update({ active_quests: recQuests }).eq('id', dbUserId);
    } catch (err) {
      console.error("Take recovery error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };


  const addXp = (amount: number, stat?: Dimension, updatedQuests?: Quest[]) => {
    // 1. Ambil Bakat Aktif
    const activeTalents = TALENTS.filter(t => talents.includes(t.id));
    
    // 2. Hitung Bonus XP
    let bonusMultiplier = 1;
    const now = new Date();
    const hour = now.getHours();

    activeTalents.forEach(t => {
      if (t.xpBoost) {
        let applies = false;
        if (t.xpBoost.condition === 'ALWAYS') applies = true;
        else if (t.xpBoost.condition === 'MORNING' && hour < 9) applies = true;
        else if (t.xpBoost.condition === 'NIGHT' && hour >= 21) applies = true;
        else if (t.xpBoost.condition === 'STREAK_3' && streak >= 3) applies = true;
        else if (t.xpBoost.condition === 'STREAK_7' && streak >= 7) applies = true;

        if (applies) bonusMultiplier += t.xpBoost.value;
      }
    });

    const finalXpAmount = Math.round(amount * bonusMultiplier);
    
    let nextLevel = level;
    let nextXp = xp + finalXpAmount;
    let nextStats = { ...stats };

    // 3. Hitung Kenaikan Level
    if (nextXp >= level * 1000) {
      nextXp = nextXp - (level * 1000);
      nextLevel = level + 1;
      setLevelUpStage(1); // Mulai dari animasi level up
      setShowLevelUp(true);
    }

    // 4. Hitung Bonus Statistik (Termasuk bakat)
    if (stat) {
      let statMultiplier = 1;
      activeTalents.forEach(t => {
        if (t.statBoost && (t.statBoost.stat === stat || t.statBoost.stat === 'ALL')) {
          statMultiplier += t.statBoost.value;
        }
      });
      nextStats[stat] = Math.min(100, stats[stat] + (2 * statMultiplier));
    }

    setLevel(nextLevel); setXp(nextXp); setStats(nextStats);
    syncProgress(nextLevel, nextXp, nextStats, updatedQuests);
  };

  const handleUpdateName = async (newName: string) => {
    if (!session || !dbUserId) return;

    // Check Cooldown Logic
    // Check Cooldown Logic (Locked only after 3 changes)
    if (nameChangeCount >= 3 && lastNameChange) {
      const lastDate = new Date(lastNameChange);
      const diffDays = (new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
      if (diffDays < 3) {
        const remainingDays = Math.ceil(3 - diffDays);
        throw new Error(`Limit tercapai. Tunggu ${remainingDays} hari lagi untuk reset kuota.`);
      }
    }

    try {
      // 1. Force refresh session to ensure tokens are fresh
      const { data: { session: currentSession }, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError || !currentSession) {
        throw new Error("Sesi login tidak valid. Silakan coba Logout dan Login kembali.");
      }

      // Reset count to 1 if we were previously locked but the cooldown passed
      const isCurrentlyLocked = nameChangeCount >= 3;
      const newCount = isCurrentlyLocked ? 1 : nameChangeCount + 1;
      const now = getLocalTimestamp();

      // 2. Update Auth Metadata (Try but don't fail the whole process if it's just metadata)
      try {
        await supabase.auth.updateUser({
          data: { full_name: newName }
        });
      } catch (authErr) {
        console.warn("Auth metadata update failed, proceeding with DB update:", authErr);
      }

      // 3. Update Database (Critical)
      const { error: dbError } = await supabase
        .from('arutha_user')
        .update({
          username: newName,
          name_change_count: newCount,
          last_name_change: now
        })
        .eq('supabase_id', currentSession.user.id);

      if (dbError) throw dbError;

      // 4. Update Local State
      setName(newName);
      setNameChangeCount(newCount);
      setLastNameChange(now);
    } catch (err) {
      console.error("Update name error:", err);
      throw err;
    }
  };

  const completeQuest = async (id: string, note: string): Promise<{ success: boolean; feedback: string }> => {
    const quest = quests.find(q => q.id === id);
    if (quest && !quest.completed) {
      // AI Verification
      const verification = await verifyQuestCompletion(quest.title, quest.desc, note);
      if (verification.success) {
        const updatedQuests = quests.map(q => q.id === id ? { ...q, completed: true } : q);
        setQuests(updatedQuests);
        addXp(quest.xp, quest.stat, updatedQuests);

        // RESET FATIGUE
        if (dbUserId) {
          await resetFatigue(dbUserId);
          setDecayResult(prev => prev ? { ...prev, status: 'ok', fatigueDays: 0 } : null);
        }
      }
      return verification;
    }
    return { success: false, feedback: "Quest tidak ditemukan." };
  };

  const generateInitialQuests = async (mood: string) => {
    if (!dbUserId) return;
    setIsRefreshing(true);
    try {
      const aiQuests = await generateDailyQuests(stats, mood);
      setQuests(aiQuests);

      await supabase.from('arutha_user').update({
        active_quests: aiQuests,
        last_quest_update: getLocalTimestamp(),
        refresh_count: 0, // Still have 1 free refresh
        last_refresh_date: getLocalTimestamp()
      }).eq('supabase_id', session?.user.id);
    } catch (err) {
      console.error("Generate initial quests error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshQuests = async () => {
    // Kunci gerbang instan — mencegah double-click & race condition
    if (refreshLockRef.current || !dbUserId || refreshCount >= 1) return;
    refreshLockRef.current = true;
    setIsRefreshing(true);
    // Langsung set refreshCount agar UI ter-disable seketika
    setRefreshCount(1);
    try {
      const aiQuests = await generateDailyQuests(stats);
      setQuests(aiQuests);

      await supabase.from('arutha_user').update({
        active_quests: aiQuests,
        last_quest_update: getLocalTimestamp(),
        refresh_count: 1,
        last_refresh_date: getLocalTimestamp()
      }).eq('supabase_id', session?.user.id);
    } catch (err) {
      console.error("Refresh error:", err);
      // Jika gagal, kembalikan state agar user bisa coba lagi
      setRefreshCount(0);
      refreshLockRef.current = false;
    } finally {
      setIsRefreshing(false);
      // Jangan buka kunci — refresh hanya boleh sekali per hari
    }
  };

  const handleClaimStreak = async () => {
    if (!dbUserId) return;
    const nowLocal = getLocalTimestamp();
    const newStreak = streak + 1;
    
    setStreak(newStreak);
    setLastStreakDate(nowLocal);
    
    try {
      await supabase.from('arutha_user').update({
        streak: newStreak,
        last_streak_date: nowLocal
      }).eq('supabase_id', session?.user.id);
      
      // Bonus XP for daily streak
      addXp(100);
    } catch (err) {
      console.error("Claim streak error:", err);
    }
  };

  const handleGlobalRefresh = async () => {
    if (session) {
      await initializeUserData(session);
    }
  };

  const handleProfileComplete = (data: { username: string; usia: number; gender: string }) => {
    setName(data.username);
    setUserContext({ usia: data.usia, gender: data.gender, username: data.username });
    if (characterAnalysis) {
      setPage('DASHBOARD');
    } else {
      setPage('ONBOARDING');
    }
  };

  const hideNavbar = !session || page === 'ONBOARDING' || page === 'CHARACTER_REVEAL' || page === 'LOGIN' || page === 'REGISTER' || page === 'COMPLETE_PROFILE' || page === 'SOUL_GUARD';

  return (
    <div className="min-h-screen bg-rpg-black text-white selection:bg-white selection:text-black overflow-x-hidden">
      <SplashScreen isReady={isDataReady} />
      
      {/* Optimized Static Background */}
      <div className="bg-premium-glow" />
      <div className="noise-overlay" />

      {!hideNavbar && (
        <Navbar session={session} userName={name} onNavigate={(p) => setPage(p as any)} currentPage={page} stats={stats} />
      )}

      <div className={cn(
        "transition-all duration-500 ease-out min-h-screen",
        !hideNavbar ? "md:pl-[280px] pb-24 md:pb-0" : ""
      )}>
        <PullToRefresh onRefresh={handleGlobalRefresh} disabled={page === 'SOUL_GUARD' || page === 'CODEX'}>
          <Suspense fallback={<PageSkeleton />}>
          <AnimatePresence mode="wait">
            {page === 'LANDING' && (
              <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <Landing session={session} hasProfile={!!characterAnalysis} setPage={setPage} />
              </motion.div>
            )}
            {page === 'LOGIN' && <Login onBack={() => setPage('LANDING')} />}
            {page === 'REGISTER' && <Register onBack={() => setPage('LANDING')} />}
            {page === 'COMPLETE_PROFILE' && dbUserId && (
              <CompleteGoogleProfile
                userId={dbUserId}
                initialUsername={name}
                onComplete={handleProfileComplete}
              />
            )}
            {page === 'ONBOARDING' && <Onboarding onComplete={handleOnboardingComplete} userContext={userContext} />}
            {page === 'CHARACTER_REVEAL' && characterAnalysis && (
              <CharacterReveal analysis={characterAnalysis} onContinue={() => setPage('DASHBOARD')} />
            )}
            {page === 'DASHBOARD' && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <Dashboard
                  session={session}
                  userId={dbUserId || ''}
                  name={name} level={level} xp={xp} stats={stats} quests={quests} analysis={characterAnalysis}
                  streak={streak}
                  lastStreakDate={lastStreakDate}
                  onClaimStreak={handleClaimStreak}
                  statHistory={statHistory}
                  completeQuest={completeQuest} handleLogout={() => supabase.auth.signOut()} addXp={addXp}
                  onReOnboard={() => setPage('ONBOARDING')} onRefreshQuests={refreshQuests} isRefreshing={isRefreshing}
                  lastEvolutionDate={lastEvolutionDate} refreshCount={refreshCount}
                  decayResult={decayResult}
                  onTakeRecovery={handleTakeRecovery}
                  setPage={setPage}
                  talents={talents}
                  onGenerateInitialQuests={generateInitialQuests}
                />
              </motion.div>
            )}
            {page === 'SETTINGS' && session && (
              <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Settings
                  userId={dbUserId || ''}
                  initialName={name}
                  email={session.user.email || ''}
                  nameChangeCount={nameChangeCount}
                  lastNameChange={lastNameChange}
                  onUpdateName={handleUpdateName}
                  onLogout={() => supabase.auth.signOut()}
                  onBack={() => setPage('DASHBOARD')}
                />
              </motion.div>
            )}
            {page === 'PROFILE' && characterAnalysis && (
              <Profile
                name={name} level={level} xp={xp} stats={stats} analysis={characterAnalysis}
                onBack={() => setPage('DASHBOARD')}
                talents={talents}
              />
            )}
            {page === 'LEADERBOARD' && (
              <Leaderboard 
                currentUserId={dbUserId || ''} 
                onBack={() => setPage('DASHBOARD')} 
              />
            )}
            {page === 'ADMIN' && isAdmin(session?.user.email) && (
              <Admin onBack={() => setPage('DASHBOARD')} />
            )}
            {page === 'CODEX' && (
              <Codex onBack={() => setPage('DASHBOARD')} />
            )}
            {page === 'MAIL' && (
              <motion.div key="mail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Mail 
                  userId={dbUserId || ''} 
                  supabaseId={session?.user.id || ''}
                  onBack={() => setPage('DASHBOARD')} 
                />
              </motion.div>
            )}
            {page === 'SOUL_GUARD' && (
              <motion.div key="soulguard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <MentalHealthChat userId={dbUserId || ''} username={name} onBack={() => setPage('DASHBOARD')} />
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
        </PullToRefresh>
      </div>

      {/* LEVEL UP MODAL */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl"
          >
            <AnimatePresence mode="wait">
              {levelUpStage === 1 ? (
                <motion.div 
                  key="lvl-anim"
                  initial={{ scale: 0.5, y: 50, rotate: -10 }}
                  animate={{ scale: 1, y: 0, rotate: 0 }}
                  exit={{ scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
                  className="relative max-w-sm w-full bg-gradient-to-b from-jiwa to-rpg-black p-8 rounded-[40px] border border-white/20 shadow-[0_0_100px_rgba(255,255,255,0.1)] text-center overflow-hidden"
                >
                  {/* Decorative elements */}
                  <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-white/10 blur-3xl animate-pulse" />
                    <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-ilmu/20 blur-3xl" />
                  </div>

                  <div className="relative z-10 space-y-6">
                    <motion.div 
                      animate={{ 
                        rotateY: [0, 360],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-24 h-24 bg-white/10 rounded-[32px] mx-auto flex items-center justify-center border border-white/20 shadow-2xl"
                    >
                      <Star className="w-12 h-12 text-white fill-white" />
                    </motion.div>

                    <div>
                      <h2 className="text-4xl font-black italic text-white tracking-tight">LEVEL UP!</h2>
                      <p className="text-xs font-black text-white/60 uppercase tracking-[0.3em] mt-2">Kekuatanmu meningkat</p>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-white/40 uppercase">Sebelumnya</p>
                        <p className="text-2xl font-black text-white/60">{level - 1}</p>
                      </div>
                      <div className="w-8 h-px bg-white/20" />
                      <div className="text-center">
                        <p className="text-[10px] font-black text-jiwa uppercase">Sekarang</p>
                        <p className="text-4xl font-black text-white">{level}</p>
                      </div>
                    </div>

                    <p className="text-sm text-white/80 leading-relaxed italic">
                      "Setiap langkah kecil yang kamu ambil hari ini telah membawamu ke level baru. Teruslah berkembang!"
                    </p>

                    <button 
                      onClick={() => setLevelUpStage(2)}
                      className="w-full py-4 bg-white text-black font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs"
                    >
                      Pilih Bakat Baru
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="talent-selector"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="w-full max-w-5xl"
                >
                  <TalentSelector 
                    level={level} 
                    onSelect={async (talent) => {
                      const newTalents = [...talents, talent.id];
                      setTalents(newTalents);
                      setShowLevelUp(false);
                      // Update DB
                      if (session?.user.id) {
                        await supabase.from('arutha_user').update({
                          talents: newTalents
                        }).eq('supabase_id', session.user.id);
                      }
                    }} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

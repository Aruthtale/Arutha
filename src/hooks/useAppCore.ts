import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { 
  analyzeCharacter, 
  generateDailyQuests, 
  generateOnboardingQuestions, 
  generateRecoveryQuests,
  verifyQuestCompletion,
  type Quest, 
  type Stats, 
  type Dimension, 
  type OnboardingAnswer 
} from '../lib/gemini';
import { checkAndApplyDecay, resetFatigue } from '../lib/decaySystem';
import { isNewDay, getLocalTimestamp, getTodayDate, isToday, isNewWeek } from '../lib/dateUtils';
import { TALENTS } from '../lib/talents';
import { useToast } from './useToast';
import { getEventXpMultiplier } from '../components/dashboard/SeasonalEventBanner';

export function useAppCore() {
  const {
    page, setPage,
    session, setSession,
    dbUserId, setDbUserId,
    setIsDataReady,
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
    talents, setTalents,
    achievements, setAchievements,
    onboardingQuestions, setOnboardingQuestions,
    availableWeeklyQuests, setAvailableWeeklyQuests,
    activeWeeklyQuests, setActiveWeeklyQuests,
    lastWeeklyReset, setLastWeeklyReset,
    globalQuests, setGlobalQuests,
    talentChoicesAvailable, setTalentChoicesAvailable,
    totalChoicesGranted, setTotalChoicesGranted,
    pendingTalentPool, setPendingTalentPool
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [levelUpStage, setLevelUpStage] = useState<1 | 2>(1);
  const initLockRef = useRef(false);
  const refreshLockRef = useRef(false);

  const fetchGlobalQuests = useCallback(async (overrideUserId?: string) => {
    const userIdToUse = overrideUserId || dbUserId;
    if (!userIdToUse) return;
    try {
      const { data: questsData, error: questsError } = await supabase
        .from('arutha_global_quests')
        .select('*')
        .gt('expires_at', getLocalTimestamp());
      
      if (questsError) throw questsError;

      const { data: subsData, error: subsError } = await supabase
        .from('arutha_global_quest_submissions')
        .select('quest_id, status')
        .eq('user_id', userIdToUse);
      
      if (subsError) throw subsError;

      if (questsData) {
        const approvedQuestIds = new Set(
          (subsData || [])
            .filter(s => s.status === 'APPROVED')
            .map(s => s.quest_id)
        );

        const filteredQuests = questsData.filter(q => !approvedQuestIds.has(q.id));

        setGlobalQuests(filteredQuests.map(q => {
          const userSub = (subsData || []).find(s => s.quest_id === q.id);
          return {
            ...q,
            stat: q.stat_type as Dimension,
            is_global: true,
            submission_status: userSub ? userSub.status : null
          };
        }));
      }
    } catch (err) {
      console.error("Fetch global quests error:", err);
    }
  }, [dbUserId, setGlobalQuests]);

  useEffect(() => {
    if (dbUserId) {
      fetchGlobalQuests();
    }
  }, [dbUserId, fetchGlobalQuests]);

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

  const syncProgress = useCallback(async (newLevel: number, newXp: number, newStats: Stats, updatedQuests?: Quest[], newTalents?: string[], newTalentChoicesAvailable?: number, newTotalChoicesGranted?: number) => {
    if (!session || !dbUserId) return;
    try {
      const sanitizedLevel = isNaN(newLevel) ? 1 : Math.max(1, newLevel);
      const sanitizedXp = isNaN(newXp) ? 0 : Math.max(0, newXp);
      
      const updateData: any = { 
        level: sanitizedLevel, 
        xp: sanitizedXp,
        last_active_date: getLocalTimestamp()
      };
      
      if (updatedQuests) updateData.active_quests = updatedQuests;
      if (newTalents) updateData.talents = newTalents;
      if (newTalentChoicesAvailable !== undefined) updateData.talent_choices_available = newTalentChoicesAvailable;
      if (newTotalChoicesGranted !== undefined) updateData.total_choices_granted = newTotalChoicesGranted;
      
      updateData.updated_at = new Date().toISOString();
      
      const { error } = await supabase.from('arutha_user').update(updateData).eq('supabase_id', session.user.id);
      if (error) console.error("Sync Progress Error (arutha_user):", error);

      const { data: profiles } = await supabase.from('character_profile').select('id').eq('user_id', dbUserId).order('created_at', { ascending: false }).limit(1);
      const latestProfile = profiles?.[0];
      if (latestProfile) {
        await supabase.from('character_profile').update({
          jiwa: Math.round(newStats.JIWA || 0),
          raga: Math.round(newStats.RAGA || 0),
          harta: Math.round(newStats.HARTA || 0),
          ilmu: Math.round(newStats.ILMU || 0),
          karma: Math.round(newStats.KARMA || 0),
        }).eq('id', latestProfile.id);
      }

      const historyData = {
        jiwa: Math.round(newStats.JIWA || 0),
        raga: Math.round(newStats.RAGA || 0),
        harta: Math.round(newStats.HARTA || 0),
        ilmu: Math.round(newStats.ILMU || 0),
        karma: Math.round(newStats.KARMA || 0)
      };

      const { data: lastLogs } = await supabase.from('stat_history').select('id, created_at').eq('user_id', dbUserId).order('created_at', { ascending: false }).limit(1);
      const isTodayLog = lastLogs && lastLogs.length > 0 && isToday(lastLogs[0].created_at);

      if (isTodayLog) {
        await supabase.from('stat_history').update(historyData).eq('id', lastLogs[0].id);
      } else {
        await supabase.from('stat_history').insert({ id: crypto.randomUUID(), user_id: dbUserId, ...historyData });
      }
      fetchStatHistory(dbUserId);
    } catch (err) { console.error("Sync error:", err); }
  }, [session, dbUserId, fetchStatHistory]);

  const initializeUserData = useCallback(async (currentSession: any) => {
    if (initLockRef.current) return;
    initLockRef.current = true;
    
    const userMetadata = currentSession.user.user_metadata;
    const displayName = userMetadata.full_name || userMetadata.username || currentSession.user.email?.split('@')[0] || 'Player One';

    try {
      const userEmail = currentSession.user.email || `user_${currentSession.user.id.slice(0, 8)}@arutha.local`;
      const USER_COLUMNS = 'id, supabase_id, email, username, level, xp, streak, last_streak_date, name_change_count, last_name_change, last_evolution_date, refresh_count, last_refresh_date, talents, achievements, last_weekly_reset, available_weekly_quests, active_weekly_quests, talent_choices_available, total_choices_granted, pending_talent_pool, usia, gender, birth_date, zodiac, last_quest_update, active_quests';
      
      let { data: userData, error: fetchError } = await supabase.from('arutha_user').select(USER_COLUMNS).eq('supabase_id', currentSession.user.id).maybeSingle();

      if (fetchError) {
        console.error("Initialize User Fetch Error:", fetchError);
        // Attempt a very limited fields fetch as ultimate fallback
        const { data: fallbackData } = await supabase.from('arutha_user').select('id, username, level, xp').eq('supabase_id', currentSession.user.id).maybeSingle();
        if (fallbackData) userData = fallbackData as any;
      }

      if (!userData) {
        const now = new Date().toISOString();
        const { data: newList, error: insertError } = await supabase.from('arutha_user').insert({
          supabase_id: currentSession.user.id, 
          email: userEmail, 
          username: displayName, 
          level: 1, 
          xp: 0, 
          streak: 0,
          created_at: now,
          updated_at: now
        }).select();
        
        if (insertError) {
          console.error("User Creation Error:", insertError);
          throw insertError;
        }
        userData = newList?.[0];
      }

      if (userData) {
        setDbUserId(userData.id);
        setName(userData.username || displayName);
        setLevel(userData.level || 1);
        setXp(userData.xp || 0);
        setStreak(userData.streak || 0);
        setLastStreakDate(userData.last_streak_date);
        setNameChangeCount(userData.name_change_count || 0);
        setLastNameChange(userData.last_name_change);
        setLastEvolutionDate(userData.last_evolution_date);
        let currentRefreshCount = userData.refresh_count || 0;
        if (userData.last_refresh_date && isNewDay(userData.last_refresh_date)) {
          currentRefreshCount = 0;
          supabase.from('arutha_user').update({ refresh_count: 0 }).eq('id', userData.id).then(({ error }) => {
            if (error) console.error("Error resetting refresh count:", error);
          });
        }
        setRefreshCount(currentRefreshCount);
        setTalents(userData.talents || []);
        setAchievements(userData.achievements || []);
        setLastWeeklyReset(userData.last_weekly_reset);

        // Catch-up logic for talents based on level milestones (loop-safe)
        const MILESTONES = [1, 3, 5, 10, 15, 20, 25, 30];
        const userLevel = userData.level || 1;
        const choicesAlreadyGranted = userData.total_choices_granted || 0;
        const currentChoicesAvailable = userData.talent_choices_available || 0;
        const expectedTotalChoices = MILESTONES.filter(m => m <= userLevel).length;
        
        setTotalChoicesGranted(choicesAlreadyGranted);

        if (choicesAlreadyGranted < expectedTotalChoices) {
          const diff = expectedTotalChoices - choicesAlreadyGranted;
          const newChoices = currentChoicesAvailable + diff;
          const newTotalGranted = choicesAlreadyGranted + diff;
          
          setTalentChoicesAvailable(newChoices);
          setTotalChoicesGranted(newTotalGranted);
          
          // Sync to DB immediately
          await supabase.from('arutha_user').update({ 
            talent_choices_available: newChoices,
            total_choices_granted: newTotalGranted
          }).eq('id', userData.id);
        } else {
          setTalentChoicesAvailable(currentChoicesAvailable);
        }

        setAvailableWeeklyQuests(userData.available_weekly_quests || []);
        setActiveWeeklyQuests(userData.active_weekly_quests || []);
        setPendingTalentPool(userData.pending_talent_pool || []);
        setDecayResult(await checkAndApplyDecay(userData.id));

        setUserContext({ 
          usia: userData.usia, gender: userData.gender, username: userData.username || displayName,
          birthDate: userData.birth_date, zodiac: userData.zodiac 
        });

        if (!userData.usia || !userData.gender || !userData.birth_date) {
          setPage('COMPLETE_PROFILE');
          return;
        }

        const { data: profiles } = await supabase.from('character_profile').select('*').eq('user_id', userData.id).order('created_at', { ascending: false }).limit(1);
        const profileData = profiles?.[0];

        if (profileData) {
          const loadedStats = { JIWA: profileData.jiwa, RAGA: profileData.raga, HARTA: profileData.harta, ILMU: profileData.ilmu, KARMA: profileData.karma };
          setStats(loadedStats);
          setCharacterAnalysis({
            personality_type: profileData.personality_type, personality_title: profileData.personality_title,
            personality_desc: profileData.personality_desc, stats: loadedStats, character_summary: profileData.character_summary,
            starter_quest: { title: '', desc: '', stat: '' }
          });

          const existingQuests = (userData.active_quests as any[]) || [];
          const hasRecovery = existingQuests.some((q: any) => q.quest_type === 'RECOVERY');

          if ((isNewDay(userData.last_quest_update) && !hasRecovery) || existingQuests.length === 0) {
            const aiQuests = await generateDailyQuests(loadedStats, undefined, false);
            setQuests(aiQuests);
            await supabase.from('arutha_user').update({ 
              active_quests: aiQuests, 
              last_quest_update: getLocalTimestamp(),
              refresh_count: 0 
            }).eq('supabase_id', currentSession.user.id);
            setRefreshCount(0);
          } else {
            setQuests(existingQuests as Quest[]);
          }
          fetchStatHistory(userData.id);
          fetchGlobalQuests(userData.id);

          // Handle Weekly Reset (Monday or First Time)
          const hasNoWeeklyQuests = (!userData.available_weekly_quests || (userData.available_weekly_quests as any[]).length === 0) && 
                                   (!userData.active_weekly_quests || (userData.active_weekly_quests as any[]).length === 0);

          if (isNewWeek(userData.last_weekly_reset) || hasNoWeeklyQuests) {
            const newWeeklyOptions = await generateDailyQuests(loadedStats, "Fokus tantangan mingguan pahlawan yang lebih berat dan butuh waktu lama.", true);
            // Convert to weekly type with steps
            const weeklyQuests = newWeeklyOptions.map((q, i) => ({
              ...q,
              id: `weekly_${Date.now()}_${i}`,
              is_weekly: true,
              xp: q.xp * 5, // Weekly rewards are 5x daily
              steps: { current: 0, total: q.xp > 500 ? 5 : 3 } // Big quests need 5 days, small ones 3
            }));
            
            setAvailableWeeklyQuests(weeklyQuests);
            setActiveWeeklyQuests([]); // Reset active ones
            const now = getLocalTimestamp();
            setLastWeeklyReset(now);
            await supabase.from('arutha_user').update({ 
              available_weekly_quests: weeklyQuests, 
              active_weekly_quests: [],
              last_weekly_reset: now 
            }).eq('id', userData.id);
          } else {
            setAvailableWeeklyQuests(userData.available_weekly_quests || []);
            setActiveWeeklyQuests(userData.active_weekly_quests || []);
            setLastWeeklyReset(userData.last_weekly_reset);
          }

          setPage(prev => ['LANDING', 'LOGIN', 'REGISTER', 'ONBOARDING', 'CHARACTER_REVEAL', 'COMPLETE_PROFILE'].includes(prev) ? 'DASHBOARD' : prev);
        } else {
          setPage('ONBOARDING');
        }
      }
    } catch (err) { console.error("Init error:", err); } finally { setIsDataReady(true); initLockRef.current = false; }
  }, [setDbUserId, setName, setLevel, setXp, setStreak, setLastStreakDate, setNameChangeCount, setLastNameChange, setLastEvolutionDate, setRefreshCount, setTalents, setAchievements, setLastWeeklyReset, setTotalChoicesGranted, setTalentChoicesAvailable, setAvailableWeeklyQuests, setActiveWeeklyQuests, setPendingTalentPool, setDecayResult, setUserContext, setPage, setStats, setCharacterAnalysis, setQuests, fetchStatHistory, fetchGlobalQuests]);

  const addXp = useCallback((amount: number, stat?: Dimension, updatedQuests?: Quest[]) => {
    const activeTalents = TALENTS.filter(t => talents.includes(t.id));
    let bonusMultiplier = 1;
    activeTalents.forEach(t => { if (t.xpBoost) bonusMultiplier += t.xpBoost.value; });

    let streakMultiplier = 1;
    if (streak >= 30) streakMultiplier = 3;
    else if (streak >= 14) streakMultiplier = 2;
    else if (streak >= 7) streakMultiplier = 1.5;

    const eventMultiplier = stat ? getEventXpMultiplier(stat) : 1;
    const finalXpAmount = Math.round(amount * bonusMultiplier * streakMultiplier * eventMultiplier);
    let nextLevel = level;
    let nextXp = xp + finalXpAmount;
    let nextStats = { ...stats };
    let nextTalentChoicesAvailable = talentChoicesAvailable;
    let nextTotalChoicesGranted = totalChoicesGranted;

    if (stat) {
      let statMultiplier = 1;
      activeTalents.forEach(t => { if (t.statBoost && (t.statBoost.stat === stat || t.statBoost.stat === 'ALL')) statMultiplier += t.statBoost.value; });
      nextStats[stat] = Math.min(100, stats[stat] + (2 * statMultiplier));
    }

    if (nextXp >= level * 1000) {
      nextXp -= level * 1000;
      nextLevel++;
      
      const MILESTONES = [1, 3, 5, 10, 15, 20, 25, 30];
      if (MILESTONES.includes(nextLevel)) {
        nextTalentChoicesAvailable += 1;
        nextTotalChoicesGranted += 1;
        setTalentChoicesAvailable(nextTalentChoicesAvailable);
        setTotalChoicesGranted(nextTotalChoicesGranted);
      }

      setLevelUpStage(1);
      setShowLevelUp(true);
    }

    setLevel(nextLevel); setXp(nextXp); setStats(nextStats);
    syncProgress(nextLevel, nextXp, nextStats, updatedQuests, undefined, nextTalentChoicesAvailable, nextTotalChoicesGranted);
  }, [level, xp, stats, talents, talentChoicesAvailable, totalChoicesGranted, streak, setTalentChoicesAvailable, setTotalChoicesGranted, setLevelUpStage, setShowLevelUp, setLevel, setXp, setStats, syncProgress]);

  const completeQuest = useCallback(async (id: string, note: string, photoBase64?: string, photoMimeType?: string) => {
    if (!dbUserId) {
      return { success: false, feedback: "Sesi Anda belum siap, silakan tunggu sebentar atau muat ulang halaman." };
    }
    // 1. Find the quest in all possible lists
    const isGlobal = globalQuests.find(q => q.id === id);
    const isWeeklyActive = activeWeeklyQuests.find(q => q.id === id);
    const quest = isGlobal || isWeeklyActive || quests.find(q => q.id === id);
    
    if (!quest || quest.completed) return { success: false, feedback: "Quest tidak valid atau sudah selesai." };
    
    // Optimistic UI update
    if (isWeeklyActive) {
      setActiveWeeklyQuests(activeWeeklyQuests.map(q => q.id === id ? { ...q, is_verifying: true } : q));
    } else if (isGlobal) {
      setGlobalQuests(globalQuests.map(q => q.id === id ? { ...q, is_verifying: true } : q));
    } else {
      setQuests(quests.map(q => q.id === id ? { ...q, is_verifying: true } : q));
    }

    // Rollback helper
    const revertOptimisticUI = () => {
      if (isWeeklyActive) {
        setActiveWeeklyQuests(activeWeeklyQuests.map(q => q.id === id ? { ...q, is_verifying: false } : q));
      } else if (isGlobal) {
        setGlobalQuests(globalQuests.map(q => q.id === id ? { ...q, is_verifying: false } : q));
      } else {
        setQuests(quests.map(q => q.id === id ? { ...q, is_verifying: false } : q));
      }
    };

    // Rate Limit check for Global Quests
    if (isGlobal) {
      const startOfDay = new Date();
      startOfDay.setHours(0,0,0,0);
      const { count } = await supabase.from('arutha_global_quest_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', dbUserId)
        .gte('created_at', startOfDay.toISOString());
      
      if (count && count >= 3) {
        revertOptimisticUI();
        return { success: false, feedback: "Kamu sudah mencapai batas maksimal pengajuan Global Quest hari ini (3/hari)." };
      }
    }

    let storedPhotoUrl: string | null = null;
    // Basic AI Verification Hardening (EXIF/Hash detection concept)
    if (photoBase64) {
      // Create a rough hash to detect immediate duplicates
      const imageHash = btoa(photoBase64.substring(0, 100) + photoBase64.substring(photoBase64.length - 100));
      storedPhotoUrl = imageHash;
      photoMimeType = photoMimeType || 'image/jpeg';
      
      try {
        const { data: existing } = await supabase.from('arutha_quest_log').select('id').eq('proof_photo_url', imageHash).limit(1).maybeSingle();
        if (existing) {
           revertOptimisticUI();
           return { success: false, feedback: "Gagal: Gambar ini terdeteksi sudah pernah digunakan sebelumnya (Duplikasi)." };
        }
      } catch (err) {
        console.warn("Duplicate image check skipped or restricted by RLS:", err);
      }
    }

    // Offline Handling
    if (!navigator.onLine) {
      revertOptimisticUI();
      const offlineItem = { id, note, photoBase64, photoMimeType, timestamp: Date.now() };
      const currentQueue = JSON.parse(localStorage.getItem('arutha_offline_queue') || '[]');
      currentQueue.push(offlineItem);
      localStorage.setItem('arutha_offline_queue', JSON.stringify(currentQueue));
      return { success: true, feedback: "Kamu sedang offline. Progres misi disimpan dan akan disinkronisasi saat koneksi pulih." };
    }

    // 2. Special handling for Progressive Quests (Steps)
    if (quest.steps) {
      if (quest.steps.last_check_in && isToday(quest.steps.last_check_in)) {
        revertOptimisticUI();
        return { success: false, feedback: "Kamu sudah melaporkan progres misi ini hari ini, Pahlawan. Istirahatlah sejenak dan kembali besok!" };
      }
    }

    // 3. Global Quests Handling (Pending Admin)
    if (quest.is_global) {
      try {
        const { error: subError } = await supabase.from('arutha_global_quest_submissions').insert({
          id: crypto.randomUUID(),
          quest_id: id,
          user_id: dbUserId,
          proof_note: note,
          proof_photo: photoBase64,
          status: 'PENDING'
        });
        if (subError) throw subError;
        await fetchGlobalQuests();
        return { success: true, feedback: "Bukti terkirim! Menunggu verifikasi Admin." };
      } catch (err: any) {
        revertOptimisticUI();
        return { success: false, feedback: `Gagal mengirim bukti: ${err.message}` };
      }
    }

    // 4. Normal/Weekly AI Verification
    try {
      const verification = await verifyQuestCompletion(quest.title, quest.desc, note, photoBase64, photoMimeType);
      
      if (verification.success) {
        const now = getLocalTimestamp();

        if (quest.steps) {
          // Progressive Quest Logic
          const newCurrent = quest.steps.current + 1;
          const isFullyComplete = newCurrent >= quest.steps.total;
          
          const updatedSteps = {
            ...quest.steps,
            current: newCurrent,
            last_check_in: now
          };

          if (isWeeklyActive) {
            const updatedActiveWeekly = activeWeeklyQuests.map(q => 
              q.id === id ? { ...q, steps: updatedSteps, completed: isFullyComplete, is_verifying: false } : q
            );
            setActiveWeeklyQuests(updatedActiveWeekly);
            
            // Sync to DB (User profile)
            await supabase.from('arutha_user').update({ active_weekly_quests: updatedActiveWeekly }).eq('id', dbUserId);
            
             // Log to arutha_quest_log
             await supabase.from('arutha_quest_log')
               .update({ 
                 current_step: newCurrent,
                 status: isFullyComplete ? 'COMPLETED' : 'IN_PROGRESS',
                 proof_note: note,
                 ai_feedback: verification.feedback,
                 proof_photo_url: storedPhotoUrl || null 
               })
               .eq('user_id', dbUserId)
               .eq('quest_id', id);
 
             if (isFullyComplete) {
               addXp(quest.xp, quest.stat as Dimension);
               verification.feedback = `LUAR BIASA! Misi Mingguan Selesai. +${quest.xp} XP!`;
             } else {
               verification.feedback = `Laporan diterima! Progres: ${newCurrent}/${quest.steps.total}. Sampai jumpa besok!`;
             }
           }
         } else {
           // Regular Daily Quest Logic
           const updatedDailies = quests.map(q => q.id === id ? { ...q, completed: true, is_verifying: false } : q);
           setQuests(updatedDailies);
           addXp(quest.xp, quest.stat as Dimension, updatedDailies);
           
           // Log to arutha_quest_log
           await supabase.from('arutha_quest_log').insert({
             user_id: dbUserId,
             quest_id: id,
             quest_type: 'DAILY',
             title: quest.title,
             stat_type: quest.stat,
             xp_reward: quest.xp,
             proof_note: note,
             ai_feedback: verification.feedback,
             status: 'COMPLETED',
             current_step: 1,
             total_steps: 1,
             proof_photo_url: storedPhotoUrl || null
           });

          // CHECK FOR DAILY COMPLETION BONUS
          const dailyRites = updatedDailies.filter(q => q.quest_type === 'DAILY' || !q.quest_type); // default is DAILY
          const allRitesDone = dailyRites.length > 0 && dailyRites.every(q => q.completed);

          if (allRitesDone) {
            const startOfDay = new Date();
            startOfDay.setHours(0,0,0,0);
            
            // Check if bonus already claimed today
            const { data: existingBonus } = await supabase.from('arutha_quest_log')
              .select('id')
              .eq('user_id', dbUserId)
              .eq('quest_id', 'DAILY_COMPLETION_BONUS')
              .gte('created_at', startOfDay.toISOString())
              .maybeSingle();

            if (!existingBonus) {
              const bonusXp = 300;
              addXp(bonusXp);
              
              await supabase.from('arutha_quest_log').insert({
                user_id: dbUserId,
                quest_id: 'DAILY_COMPLETION_BONUS',
                quest_type: 'DAILY',
                title: 'Bonus Penyelesaian Harian (Rites)',
                stat_type: 'KARMA', // Bonus gives Karma boost
                xp_reward: bonusXp,
                status: 'COMPLETED',
                ai_feedback: 'Luar biasa, Pahlawan! Kamu telah menyelesaikan seluruh ritual harianmu. Ambisi dan disiplinmu adalah kunci pertumbuhan sejati.'
              });
              
              useToast.getState().addToast(`SELAMAT! Bonus Penyelesaian Harian: +${bonusXp} XP!`, "success");
            }
          }

          if (dbUserId) await resetFatigue(dbUserId);
          setDecayResult(prev => prev ? { ...prev, status: 'ok', fatigueDays: 0 } : null);

          // ACHIEVEMENT: LANGKAH PERTAMA
          const currentAchievements = useStore.getState().achievements;
          if (!currentAchievements.includes('LANGKAH_PERTAMA')) {
            const newAchievements = [...currentAchievements, 'LANGKAH_PERTAMA'];
            setAchievements(newAchievements);
            await supabase.from('arutha_user').update({ achievements: newAchievements }).eq('id', dbUserId);
            useToast.getState().addToast("Pencapaian Terbuka: Langkah Pertama!", "success");
          }
        }
        useToast.getState().addToast(verification.feedback || "Misi berhasil diselesaikan pahlawan!", "success");
      } else {
         revertOptimisticUI();
         useToast.getState().addToast(verification.feedback || "Misi ditolak oleh Mentor.", "error");
      }
      return verification;
    } catch (err) {
      console.error(err);
      revertOptimisticUI();
      return { success: false, feedback: "Gagal memproses verifikasi AI." };
    }
  }, [globalQuests, activeWeeklyQuests, quests, dbUserId, addXp, setActiveWeeklyQuests, setQuests, setDecayResult]);

  const handleOnboardingComplete = useCallback(async (answers: OnboardingAnswer[]) => {
    if (!session) return;
    setLoading(true);
    try {
      const analysis = await analyzeCharacter(answers, userContext);
      let { data: users } = await supabase.from('arutha_user').select('id, talents').eq('supabase_id', session.user.id).limit(1);
      
      if (users?.[0]) {
        const userData = users[0];
        
        // 1. Insert Character Profile
        const { error: profileError } = await supabase.from('character_profile').insert({
          id: crypto.randomUUID(), 
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
          rationale: analysis.rationale,
        });

        if (profileError) {
          console.error("Profile Insert Error:", profileError);
          throw new Error(`Gagal menyimpan profil: ${profileError.message}`);
        }

        // 2. Grant Initial Talent Choice (Level 1 Milestone)
        const initialTalentChoices = 1;
        setTalentChoicesAvailable(initialTalentChoices);
        setTotalChoicesGranted(1);

        // 3. Generate and Store Quests & Update User
        const aiQuests = await generateDailyQuests(analysis.stats, undefined, false);
        setQuests(aiQuests);
        
        const now = new Date().toISOString();
        const { error: questError } = await supabase.from('arutha_user').update({ 
          active_quests: aiQuests, 
          last_quest_update: now,
          last_refresh_date: now,
          last_evolution_date: now,
          talent_choices_available: initialTalentChoices,
          total_choices_granted: 1,
          updated_at: now
        }).eq('id', userData.id);

        if (questError) {
          console.error("Quest/Talent Update Error:", questError);
        } else {
          setLastEvolutionDate(now);
        }

        setCharacterAnalysis(analysis);
        setStats(analysis.stats);
        setPage('CHARACTER_REVEAL');
      } else {
        throw new Error("Data user tidak ditemukan di sistem.");
      }
    } catch (err: any) {
      console.error("Onboarding Error:", err);
      useToast.getState().addToast(err.message || "Terjadi kesalahan saat penyelarasan jiwa.", "error");
    } finally { 
      setLoading(false); 
    }
  }, [session, userContext, setTalentChoicesAvailable, setTotalChoicesGranted, setQuests, setLastEvolutionDate, setCharacterAnalysis, setStats, setPage, setLoading]);

  const handleTakeRecovery = useCallback(async () => {
    if (!dbUserId || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const recQuests = await generateRecoveryQuests(decayResult?.fatigueDays || 1);
      setQuests(recQuests);
      await supabase.from('arutha_user').update({ active_quests: recQuests }).eq('id', dbUserId);
      setDecayResult(prev => prev ? { ...prev, status: 'ok' } : null);
    } finally { setIsRefreshing(false); }
  }, [dbUserId, isRefreshing, decayResult, setQuests, setDecayResult]);

  const handleUpdateName = useCallback(async (newName: string) => {
    if (!session) return;
    
    const now = new Date();
    const lastChange = lastNameChange ? new Date(lastNameChange) : null;
    let currentCount = nameChangeCount;

    if (lastChange) {
      const diffMs = now.getTime() - lastChange.getTime();
      const diffDays = diffMs / (1000 * 3600 * 24);
      if (diffDays >= 3) {
        currentCount = 0;
      }
    }

    if (currentCount >= 3) {
      throw new Error("Batas ganti nama tercapai (3 kali dalam 3 hari).");
    }

    const nextCount = currentCount + 1;
    const nowStr = now.toISOString();

    try {
      const { error } = await supabase.from('arutha_user').update({ 
        username: newName,
        name_change_count: nextCount,
        last_name_change: nowStr
      }).eq('supabase_id', session.user.id);

      if (error) throw error;

      setName(newName);
      setNameChangeCount(nextCount);
      setLastNameChange(nowStr);
      setUserContext(prev => ({ ...prev, username: newName }));
    } catch (e) { 
      console.error(e);
      throw e;
    }
  }, [session, nameChangeCount, lastNameChange, setName, setNameChangeCount, setLastNameChange, setUserContext]);

  const handleClaimStreak = useCallback(async () => {
    if (!session || !session.user) return;
    
    // Prevent double claim today
    if (lastStreakDate && isToday(lastStreakDate)) {
      console.warn("Streak sudah diklaim hari ini.");
      return;
    }

    const now = getLocalTimestamp();
    const newStreak = streak + 1;
    setStreak(newStreak);
    setLastStreakDate(now);
    
    try {
      await supabase.from('arutha_user').update({ 
        streak: newStreak, 
        last_streak_date: now 
      }).eq('supabase_id', session.user.id);
      addXp(100);
    } catch (err) {
      console.error("Gagal update streak:", err);
    }
  }, [session, lastStreakDate, streak, setStreak, setLastStreakDate, addXp]);

  const handleStartOnboarding = useCallback(async (override?: any) => {
    setLoading(true);
    try {
      const questions = await generateOnboardingQuestions(override || userContext);
      setOnboardingQuestions(questions);
      setPage('ONBOARDING');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userContext, setOnboardingQuestions, setPage, setLoading]);

  const refreshQuests = useCallback(async () => {
    const currentQuests = useStore.getState().quests || [];
    const hasRecovery = currentQuests.some((q: any) => q.quest_type === 'RECOVERY');
    if (!dbUserId || refreshCount >= 1 || hasRecovery) return;
    setIsRefreshing(true);
    try {
      const newQuests = await generateDailyQuests(stats, undefined, false, dbUserId, true);
      setQuests(newQuests);
      setRefreshCount(1);
      await supabase.from('arutha_user').update({ active_quests: newQuests, refresh_count: 1, last_refresh_date: getLocalTimestamp() }).eq('id', dbUserId);
    } catch (err) {
      console.error(err);
    } finally { setIsRefreshing(false); }
  }, [dbUserId, refreshCount, stats, setQuests, setRefreshCount]);

  const generateInitialQuests = useCallback(async (mood: string) => {
    setLoading(true);
    try {
      const aiQuests = await generateDailyQuests(stats, mood, false);
      setQuests(aiQuests);
      await supabase.from('arutha_user').update({ active_quests: aiQuests, last_quest_update: getLocalTimestamp() }).eq('id', dbUserId);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }, [stats, dbUserId, setQuests, setLoading]);

  const handleClaimGlobalQuest = useCallback(async (questId: string) => {
    if (!dbUserId || !session) return;
    setLoading(true);
    try {
      const { data: quest } = await supabase.from('arutha_global_quests').select('*').eq('id', questId).single();
      if (!quest || quest.is_claimed) { 
        useToast.getState().addToast("Terlambat! Misi ini sudah diselesaikan pahlawan lain.", "error"); 
        fetchGlobalQuests(); 
        return; 
      }
      
      // Check if already accepted
      if (quests.find(q => q.id === questId)) {
        useToast.getState().addToast("Kamu sudah menerima misi ini.", "info");
        return;
      }

      const normalizedQuest = {
        ...quest,
        xp: quest.reward_xp,
        stat: quest.stat_type as Dimension,
        is_global: true,
        completed: false
      };

      const newQ = [...quests, normalizedQuest];
      setQuests(newQ);
      await supabase.from('arutha_user').update({ active_quests: newQ }).eq('id', dbUserId);
      useToast.getState().addToast("Misi Diterima! Buktikan tantangan ini sebelum orang lain menyelesaikannya.", "success"); 
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }, [dbUserId, session, quests, setQuests, setLoading, fetchGlobalQuests]);

  const handleClaimWeeklyQuest = useCallback(async (questId: string) => {
    if (!dbUserId) return;
    const quest = availableWeeklyQuests.find(q => q.id === questId);
    if (!quest) return;

    // Check if user already has an active quest for this dimension
    const existing = activeWeeklyQuests.find(q => q.stat === quest.stat && !q.completed);
    if (existing) {
      useToast.getState().addToast(`Kamu masih memiliki misi mingguan aktif untuk dimensi ${quest.stat}. Selesaikan dulu atau tunggu minggu depan!`, "error");
      return;
    }

    const updatedAvailable = availableWeeklyQuests.filter(q => q.id !== questId);
    const updatedActive = [...activeWeeklyQuests, quest];
    
    setAvailableWeeklyQuests(updatedAvailable);
    setActiveWeeklyQuests(updatedActive);
    
    try {
      await supabase.from('arutha_user').update({
        available_weekly_quests: updatedAvailable,
        active_weekly_quests: updatedActive
      }).eq('id', dbUserId);

      // Initialize log for weekly quest
      await supabase.from('arutha_quest_log').insert({
        user_id: dbUserId,
        quest_id: questId,
        quest_type: 'WEEKLY',
        title: quest.title,
        stat_type: quest.stat,
        xp_reward: quest.xp,
        status: 'IN_PROGRESS',
        current_step: 0,
        total_steps: quest.steps?.total || 1
      });

      useToast.getState().addToast(`Misi "${quest.title}" diterima! Semoga disiplinmu membawamu pada kemenangan.`, "success");
    } catch (err) {
      console.error(err);
    }
  }, [dbUserId, availableWeeklyQuests, activeWeeklyQuests, setAvailableWeeklyQuests, setActiveWeeklyQuests]);

  const handleTalentSelection = useCallback(async (selectedTalentId: string, replacedTalentId?: string) => {
    if (!dbUserId || talentChoicesAvailable <= 0) return;

    let newTalents = [...talents];
    if (replacedTalentId) {
      newTalents = newTalents.filter(id => id !== replacedTalentId);
    }
    
    if (!newTalents.includes(selectedTalentId)) {
      newTalents.push(selectedTalentId);
    }

    // Keep only latest 3 if somehow it exceeds (safety)
    if (newTalents.length > 3) {
      newTalents = newTalents.slice(-3);
    }

    const nextChoices = talentChoicesAvailable - 1;
    setTalents(newTalents);
    setTalentChoicesAvailable(nextChoices);
    setPendingTalentPool([]);

    await supabase.from('arutha_user').update({
      talents: newTalents,
      talent_choices_available: nextChoices,
      pending_talent_pool: []
    }).eq('id', dbUserId);
  }, [dbUserId, talentChoicesAvailable, talents, setTalents, setTalentChoicesAvailable, setPendingTalentPool]);

  const saveTalentPool = useCallback(async (pool: any[]) => {
    if (!dbUserId) return;
    setPendingTalentPool(pool);
    await supabase.from('arutha_user').update({
      pending_talent_pool: pool
    }).eq('id', dbUserId);
  }, [dbUserId, setPendingTalentPool]);

  const handleSkipTalent = useCallback(async () => {
    if (!dbUserId || talentChoicesAvailable <= 0) return;
    const nextChoices = talentChoicesAvailable - 1;
    setTalentChoicesAvailable(nextChoices);
    setPendingTalentPool([]);
    await supabase.from('arutha_user').update({
      talent_choices_available: nextChoices,
      pending_talent_pool: []
    }).eq('id', dbUserId);
  }, [dbUserId, talentChoicesAvailable, setTalentChoicesAvailable, setPendingTalentPool]);

    // Online sync listener
    useEffect(() => {
      const syncOfflineQueue = async () => {
        if (!navigator.onLine) return;
        const queueStr = localStorage.getItem('arutha_offline_queue');
        if (!queueStr) return;
        
        try {
          const queue = JSON.parse(queueStr);
          if (queue.length > 0) {
            useToast.getState().addToast(`Menyinkronkan ${queue.length} misi dari offline...`, "info");
            localStorage.removeItem('arutha_offline_queue');
            
            for (const item of queue) {
              await completeQuest(item.id, item.note, item.photoBase64, item.photoMimeType);
            }
          }
        } catch (e) {
          console.error("Failed to sync offline queue", e);
        }
      };

      window.addEventListener('online', syncOfflineQueue);
      return () => window.removeEventListener('online', syncOfflineQueue);
    }, [completeQuest]);

  return {
    loading, setLoading, levelUpStage, setLevelUpStage,
    initializeUserData, fetchGlobalQuests, handleClaimGlobalQuest,
    addXp, completeQuest, refreshQuests, syncProgress,
    handleOnboardingComplete, handleTakeRecovery, handleUpdateName,
    handleClaimStreak, handleStartOnboarding, generateInitialQuests,
    handleClaimWeeklyQuest, handleTalentSelection, saveTalentPool,
    handleSkipTalent
  };
}

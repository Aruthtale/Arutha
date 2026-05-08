import React, { useState, useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { AnimatePresence, motion } from 'framer-motion';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { type CharacterAnalysis, analyzeCharacter, generateDailyQuests, verifyQuestCompletion, type Quest, type Stats, type Dimension, generateRecoveryQuests } from './lib/gemini';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Onboarding } from './pages/Onboarding';
import { CharacterReveal } from './pages/CharacterReveal';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { checkAndApplyDecay, resetFatigue, type DecayResult } from './lib/decaySystem';

export default function App() {
  const [page, setPage] = useState<'LANDING' | 'LOGIN' | 'REGISTER' | 'ONBOARDING' | 'CHARACTER_REVEAL' | 'DASHBOARD' | 'SETTINGS' | 'PROFILE'>('LANDING');
  const [session, setSession] = useState<Session | null>(null);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [decayResult, setDecayResult] = useState<DecayResult | null>(null);
  const [name, setName] = useState('Player One');
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [stats, setStats] = useState<Stats>({
    JIWA: 50,
    RAGA: 50,
    HARTA: 50,
    ILMU: 50,
    KARMA: 50,
  });
  const [characterAnalysis, setCharacterAnalysis] = useState<CharacterAnalysis | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [statHistory, setStatHistory] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastEvolutionDate, setLastEvolutionDate] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [nameChangeCount, setNameChangeCount] = useState(0);
  const [lastNameChange, setLastNameChange] = useState<string | null>(null);
  const refreshLockRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        initializeUserData(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        initializeUserData(session);
      } else {
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
    const userMetadata = session.user.user_metadata;
    const displayName = userMetadata.full_name || userMetadata.username || session.user.email?.split('@')[0] || 'Player One';
    setName(displayName);

    try {
      const userEmail = session.user.email || `user_${session.user.id.slice(0, 8)}@arutha.local`;
      const now = new Date().toISOString();

      // 1. Ambil data user atau buat baru jika belum ada (Upsert)
      const { data: userDataList, error: upsertError } = await supabase
        .from('arutha_user')
        .upsert({
          id: crypto.randomUUID(),
          supabase_id: session.user.id,
          email: userEmail,
          username: userMetadata.username || displayName.toLowerCase().replace(/\s+/g, '_') + Math.floor(Math.random() * 1000),
          updated_at: now,
        }, { 
          onConflict: 'supabase_id',
          ignoreDuplicates: false
        })
        .select('id, level, xp, active_quests, last_quest_update, refresh_count, last_refresh_date, name_change_count, last_name_change')
        .limit(1);

      if (upsertError) {
        console.error("Upsert User Error:", upsertError.message);
        throw upsertError;
      }

      let userData = userDataList?.[0];

      if (userData) {
        setDbUserId(userData.id);
        setLevel(userData.level || 1);
        setXp(userData.xp || 0);

        // 3. Jalankan Decay System
        const decayResult = await checkAndApplyDecay(userData.id);
        setDecayResult(decayResult);

        setNameChangeCount(userData.name_change_count || 0);
        setLastNameChange(userData.last_name_change || null);

        // Reset Refresh Count jika sudah berganti hari
        const lastRefreshDateStr = userData.last_refresh_date || now;
        const lastRefresh = new Date(lastRefreshDateStr);
        const isNewDay = lastRefresh.getDate() !== new Date().getDate();
        setRefreshCount(isNewDay ? 0 : (userData.refresh_count || 0));
        if (isNewDay) refreshLockRef.current = false;

        const { data: profiles } = await supabase
          .from('character_profile')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        const profileData = profiles?.[0];

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

          const lastUpdateStr = userData.last_quest_update || new Date(0).toISOString();
          const lastUpdate = new Date(lastUpdateStr);
          const isQuestExpired = lastUpdate.getDate() !== new Date().getDate();

          if (isQuestExpired || !userData.active_quests || (userData.active_quests as any[]).length === 0) {
            const aiQuests = await generateDailyQuests(loadedStats);
            setQuests(aiQuests);
            setRefreshCount(0);
            refreshLockRef.current = false;
            await supabase.from('arutha_user').update({ 
              active_quests: aiQuests, 
              last_quest_update: new Date().toISOString(),
              refresh_count: 0,
              last_refresh_date: new Date().toISOString()
            }).eq('id', userData.id);
          } else {
            setQuests(userData.active_quests as Quest[]);
            if ((userData.refresh_count || 0) >= 1) {
              refreshLockRef.current = true;
            }
          }
          
          const decay = await checkAndApplyDecay(userData.id);
          setDecayResult(decay);

          fetchStatHistory(userData.id);

          setPage(prev => {
            const entryPages = ['LANDING', 'LOGIN', 'REGISTER', 'ONBOARDING', 'CHARACTER_REVEAL'];
            if (entryPages.includes(prev)) return 'DASHBOARD';
            return prev;
          });
        } else {
          setPage('ONBOARDING');
        }
      }
    } catch (err: any) {
      console.error("Init error detailed:", err.message || err);
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
    if (!dbUserId) return;
    try {
      const updateData: any = { level: newLevel, xp: newXp };
      if (updatedQuests) updateData.active_quests = updatedQuests;
      await supabase.from('arutha_user').update(updateData).eq('id', dbUserId);
      
      const { data: profiles } = await supabase.from('character_profile').select('id').eq('user_id', dbUserId).order('created_at', { ascending: false }).limit(1);
      const latestProfile = profiles?.[0];
      if (latestProfile) {
        await supabase.from('character_profile').update({
          jiwa: newStats.JIWA, raga: newStats.RAGA, harta: newStats.HARTA, ilmu: newStats.ILMU, karma: newStats.KARMA,
        }).eq('id', latestProfile.id);
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: existingLogs } = await supabase
        .from('stat_history')
        .select('id')
        .eq('user_id', dbUserId)
        .gte('created_at', today)
        .limit(1);

      if (existingLogs && existingLogs.length > 0) {
        await supabase.from('stat_history').update({
          jiwa: newStats.JIWA, raga: newStats.RAGA, harta: newStats.HARTA, ilmu: newStats.ILMU, karma: newStats.KARMA
        }).eq('id', existingLogs[0].id);
      } else {
        await supabase.from('stat_history').insert({
          user_id: dbUserId,
          jiwa: newStats.JIWA, raga: newStats.RAGA, harta: newStats.HARTA, ilmu: newStats.ILMU, karma: newStats.KARMA
        });
        fetchStatHistory(dbUserId);
      }

    } catch (err) { console.error("Sync error:", err); }
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
        const { data: profiles } = await supabase
          .from('character_profile')
          .insert({
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
          })
          .select();
        
        const profile = profiles?.[0];
        if (profile) setLastEvolutionDate(profile.created_at);
        
        const aiQuests = await generateDailyQuests(analysis.stats);
        setQuests(aiQuests);
        
        await supabase
          .from('arutha_user')
          .update({ active_quests: aiQuests, last_quest_update: new Date().toISOString() })
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
    if (!dbUserId || !decayResult) return;
    setIsRefreshing(true);
    try {
      const recQuests = [
        { id: 'r1', title: 'Recovery Session', desc: 'Lakukan meditasi 10 menit untuk memulihkan energi.', stat: 'JIWA' as Dimension, xp: 200, completed: false }
      ];
      setQuests(recQuests);
      await supabase.from('arutha_user').update({ active_quests: recQuests }).eq('id', dbUserId);
    } catch (err) {
      console.error("Take recovery error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };


  const addXp = (amount: number, stat?: Dimension, updatedQuests?: Quest[]) => {
    let nextLevel = level;
    let nextXp = xp + amount;
    let nextStats = { ...stats };
    if (nextXp >= level * 1000) {
      nextXp = nextXp - (level * 1000);
      nextLevel = level + 1;
    }
    if (stat) nextStats[stat] = Math.min(100, stats[stat] + 2);
    setLevel(nextLevel); setXp(nextXp); setStats(nextStats);
    syncProgress(nextLevel, nextXp, nextStats, updatedQuests);
  };

  const handleUpdateName = async (newName: string) => {
    if (!session || !dbUserId) return;
    
    // Check Cooldown Logic
    if (nameChangeCount >= 3 && lastNameChange) {
      const lastDate = new Date(lastNameChange);
      const diffDays = (new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
      if (diffDays < 3) {
        const remainingDays = Math.ceil(3 - diffDays);
        throw new Error(`Limit tercapai. Tunggu ${remainingDays} hari lagi untuk mengganti nama.`);
      }
    }

    try {
      const newCount = nameChangeCount >= 3 ? 1 : nameChangeCount + 1;
      const now = new Date().toISOString();

      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: newName }
      });
      if (authError) throw authError;

      const { error: dbError } = await supabase
        .from('arutha_user')
        .update({ 
          username: newName.toLowerCase().replace(/\s+/g, '_'),
          name_change_count: newCount,
          last_name_change: now
        })
        .eq('id', dbUserId);
      if (dbError) throw dbError;

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
        last_quest_update: new Date().toISOString(),
        refresh_count: 0, // Still have 1 free refresh
        last_refresh_date: new Date().toISOString()
      }).eq('id', dbUserId);
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
        last_quest_update: new Date().toISOString(),
        refresh_count: 1,
        last_refresh_date: new Date().toISOString()
      }).eq('id', dbUserId);
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

  const hideNavbar = page === 'ONBOARDING' || page === 'CHARACTER_REVEAL' || page === 'LOGIN' || page === 'REGISTER';

  return (
    <div className="min-h-screen bg-rpg-black text-white selection:bg-white selection:text-black">
      <div className="fixed inset-0 -z-10 bg-rpg-black overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-jiwa/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-ilmu/5 blur-[150px]" />
      </div>

      {!hideNavbar && (
        <Navbar session={session} onNavigate={(p) => setPage(p as any)} currentPage={page} />
      )}

      <AnimatePresence mode="wait">
        {page === 'LANDING' && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Landing session={session} setPage={setPage} />
          </motion.div>
        )}
        {page === 'LOGIN' && <Login onBack={() => setPage('LANDING')} />}
        {page === 'REGISTER' && <Register onBack={() => setPage('LANDING')} />}
        {page === 'ONBOARDING' && <Onboarding onComplete={handleOnboardingComplete} />}
        {page === 'CHARACTER_REVEAL' && characterAnalysis && (
          <CharacterReveal analysis={characterAnalysis} onContinue={() => setPage('DASHBOARD')} />
        )}
        {page === 'DASHBOARD' && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Dashboard 
              userId={dbUserId || ''}
              name={name} level={level} xp={xp} stats={stats} quests={quests} analysis={characterAnalysis}
              statHistory={statHistory}
              completeQuest={completeQuest} handleLogout={() => supabase.auth.signOut()} addXp={addXp}
              onReOnboard={() => setPage('ONBOARDING')} onRefreshQuests={refreshQuests} isRefreshing={isRefreshing}
              lastEvolutionDate={lastEvolutionDate} refreshCount={refreshCount}
              decayResult={decayResult}
              onTakeRecovery={handleTakeRecovery}
              setPage={setPage} onGenerateInitialQuests={generateInitialQuests}
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}

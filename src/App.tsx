import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { type CharacterAnalysis, analyzeCharacter, generateDailyQuests, verifyQuestCompletion, type Quest, type Stats, type Dimension } from './lib/gemini';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Onboarding } from './pages/Onboarding';
import { CharacterReveal } from './pages/CharacterReveal';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';

export default function App() {
  const [page, setPage] = useState<'LANDING' | 'LOGIN' | 'REGISTER' | 'ONBOARDING' | 'CHARACTER_REVEAL' | 'DASHBOARD' | 'PROFILE'>('LANDING');
  const [session, setSession] = useState<Session | null>(null);
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastEvolutionDate, setLastEvolutionDate] = useState<string | null>(null);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const refreshLockRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        initializeUserData(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        initializeUserData(session);
      } else {
        setPage('LANDING');
      }
    });

    return () => subscription.unsubscribe();
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
          id: crypto.randomUUID(), // Pastikan ID disediakan jika DB tidak memiliki default gen_random_uuid()
          supabase_id: session.user.id,
          email: userEmail,
          username: userMetadata.username || displayName.toLowerCase().replace(/\s+/g, '_') + Math.floor(Math.random() * 1000),
          updatedAt: now,
        }, { 
          onConflict: 'supabase_id',
          ignoreDuplicates: false
        })
        .select('id, level, xp, activeQuests, lastQuestUpdate, refreshCount, lastRefreshDate')
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

        // Reset Refresh Count jika sudah berganti hari
        const lastRefreshDateStr = userData.lastRefreshDate || now;
        const lastRefresh = new Date(lastRefreshDateStr);
        const isNewDay = lastRefresh.getDate() !== new Date().getDate();
        setRefreshCount(isNewDay ? 0 : (userData.refreshCount || 0));

        const { data: profiles } = await supabase
          .from('character_profile')
          .select('*')
          .eq('userId', userData.id)
          .order('createdAt', { ascending: false })
          .limit(1);
        
        const profileData = profiles?.[0];

        if (profileData) {
          setLastEvolutionDate(profileData.createdAt);
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

          const lastUpdateStr = userData.lastQuestUpdate || new Date(0).toISOString();
          const lastUpdate = new Date(lastUpdateStr);
          const isQuestExpired = lastUpdate.getDate() !== new Date().getDate();

          if (isQuestExpired || !userData.activeQuests || (userData.activeQuests as any[]).length === 0) {
            setQuests([]);
            setRefreshCount(0);
            refreshLockRef.current = false;
            // Kita tidak generate sekarang, kita biarkan Dashboard yang urus setelah Mood Check-in
          } else {
            setQuests(userData.activeQuests as Quest[]);
            if ((userData.refreshCount || 0) >= 1) {
              refreshLockRef.current = true;
            }
          }
          setPage('DASHBOARD');
        } else {
          setPage('ONBOARDING');
        }
      }
    } catch (err: any) {
      console.error("Init error detailed:", err.message || err);
    }
  };

  const syncProgress = async (newLevel: number, newXp: number, newStats: Stats, updatedQuests?: Quest[]) => {
    if (!dbUserId) return;
    try {
      const updateData: any = { level: newLevel, xp: newXp };
      if (updatedQuests) updateData.activeQuests = updatedQuests;
      await supabase.from('arutha_user').update(updateData).eq('id', dbUserId);
      
      const { data: profiles } = await supabase.from('character_profile').select('id').eq('userId', dbUserId).order('createdAt', { ascending: false }).limit(1);
      const latestProfile = profiles?.[0];
      if (latestProfile) {
        await supabase.from('character_profile').update({
          jiwa: newStats.JIWA, raga: newStats.RAGA, harta: newStats.HARTA, ilmu: newStats.ILMU, karma: newStats.KARMA,
        }).eq('id', latestProfile.id);
      }
    } catch (err) { console.error("Sync error:", err); }
  };

  const handleOnboardingComplete = async (analysis: CharacterAnalysis) => {
    if (!session) return;
    try {
      // Menggunakan cara manual untuk mencari user (menghindari error 406 dari .single())
      const { data: users } = await supabase
        .from('arutha_user')
        .select('id')
        .eq('supabase_id', session.user.id)
        .limit(1);

      const userData = users?.[0];

      if (userData) {
        const { data: profiles } = await supabase
          .from('character_profile')
          .insert({
            id: crypto.randomUUID(),
            userId: userData.id,
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
        if (profile) setLastEvolutionDate(profile.createdAt);
        
        const aiQuests = await generateDailyQuests(analysis.stats);
        setQuests(aiQuests);
        
        await supabase
          .from('arutha_user')
          .update({ activeQuests: aiQuests, lastQuestUpdate: new Date().toISOString() })
          .eq('id', userData.id);
      }
    } catch (err) { 
      console.error("Save error:", err); 
    }
    setCharacterAnalysis(analysis);
    setStats(analysis.stats);
    setPage('CHARACTER_REVEAL');
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

  const completeQuest = async (id: string, note: string): Promise<{ success: boolean; feedback: string }> => {
    const quest = quests.find(q => q.id === id);
    if (quest && !quest.completed) {
      // AI Verification
      const verification = await verifyQuestCompletion(quest.title, quest.desc, note);
      if (verification.success) {
        const updatedQuests = quests.map(q => q.id === id ? { ...q, completed: true } : q);
        setQuests(updatedQuests);
        addXp(quest.xp, quest.stat, updatedQuests);
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
        activeQuests: aiQuests,
        lastQuestUpdate: new Date().toISOString(),
        refreshCount: 0, // Still have 1 free refresh
        lastRefreshDate: new Date().toISOString()
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
        activeQuests: aiQuests,
        lastQuestUpdate: new Date().toISOString(),
        refreshCount: 1,
        lastRefreshDate: new Date().toISOString()
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

  const hideNavbar = page === 'ONBOARDING' || page === 'CHARACTER_REVEAL';

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
              name={name} level={level} xp={xp} stats={stats} quests={quests} analysis={characterAnalysis}
              completeQuest={completeQuest} handleLogout={() => supabase.auth.signOut()} addXp={addXp}
              onReOnboard={() => setPage('ONBOARDING')} onRefreshQuests={refreshQuests} isRefreshing={isRefreshing}
              lastEvolutionDate={lastEvolutionDate} refreshCount={refreshCount}
              setPage={setPage} onGenerateInitialQuests={generateInitialQuests}
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

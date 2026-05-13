import React, { useEffect, Suspense, lazy } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { AnimatePresence, motion, LazyMotion, domMax } from 'framer-motion';
import { Star, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { isAdmin } from './lib/config';
import { cn } from './lib/utils';
import { useStore } from './store/useStore';
import { useAppCore } from './hooks/useAppCore';
import { Navbar } from './components/Navbar';
import { SplashScreen } from './components/SplashScreen';
import { PullToRefresh } from './components/PullToRefresh';
import { PageSkeleton } from './components/Skeleton';
import { ToastContainer } from './components/ToastContainer';

// Lazy Load Pages
const lazyWithRetry = (componentImport: () => Promise<any>) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false');
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });

const Landing = lazyWithRetry(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Login = lazyWithRetry(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazyWithRetry(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Onboarding = lazyWithRetry(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const CharacterReveal = lazyWithRetry(() => import('./pages/CharacterReveal').then(m => ({ default: m.CharacterReveal })));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Settings = lazyWithRetry(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Profile = lazyWithRetry(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Admin = lazyWithRetry(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const CompleteGoogleProfile = lazyWithRetry(() => import('./pages/CompleteGoogleProfile').then(m => ({ default: m.CompleteGoogleProfile })));
const Codex = lazyWithRetry(() => import('./pages/Codex').then(m => ({ default: m.Codex })));
const Leaderboard = lazyWithRetry(() => import('./pages/Leaderboard').then(m => ({ default: m.Leaderboard })));
const Mail = lazyWithRetry(() => import('./pages/Mail').then(m => ({ default: m.Mail })));
const MentalHealthChat = lazyWithRetry(() => import('./pages/MentalHealthChat').then(m => ({ default: m.MentalHealthChat })));

export default function App() {
  const {
    loading, levelUpStage, setLevelUpStage,
    initializeUserData, fetchGlobalQuests, handleClaimGlobalQuest,
    addXp, completeQuest, refreshQuests,
    handleOnboardingComplete, handleTakeRecovery, handleUpdateName,
    handleClaimStreak, handleStartOnboarding, generateInitialQuests,
    handleClaimWeeklyQuest, handleTalentSelection, saveTalentPool,
    handleSkipTalent
  } = useAppCore();

  const {
    page, setPage, session, setSession, dbUserId, isDataReady, setIsDataReady,
    decayResult, name, setName, level, xp, stats, characterAnalysis,
    quests, statHistory, isRefreshing, lastEvolutionDate, refreshCount,
    streak, lastStreakDate, showLevelUp, setShowLevelUp,
    nameChangeCount, lastNameChange, userContext, setUserContext,
    talents, onboardingQuestions, globalQuests,
    availableWeeklyQuests, activeWeeklyQuests, talentChoicesAvailable,
    pendingTalentPool, theme
  } = useStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { setSession(session); initializeUserData(session); }
      else { setIsDataReady(true); }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED')) {
        initializeUserData(session);
      } else if (!session) {
        setPage('LANDING');
      }
    });

    const globalChannel = supabase.channel('global-quests')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'arutha_global_quests' 
      }, () => {
        fetchGlobalQuests();
      })
      .subscribe();

    // Capacitor Back Button Handling
    let backListener: any;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          CapApp.exitApp();
        } else {
          window.history.back();
        }
      }).then(l => backListener = l);
    }

    return () => {
      if (subscription) subscription.subscription.unsubscribe();
      supabase.removeChannel(globalChannel);
      if (backListener) backListener.remove();
    };
  }, []);

  const hideNavbar = !session || ['ONBOARDING', 'CHARACTER_REVEAL', 'LOGIN', 'REGISTER', 'COMPLETE_PROFILE', 'COMPLETE_GOOGLE_PROFILE', 'SOUL_GUARD'].includes(page);

  return (
    <LazyMotion features={domMax}>
    <div className="min-h-screen bg-rpg-black text-rpg-text selection:bg-rpg-primary selection:text-rpg-primary-text overflow-x-hidden">
      <SplashScreen isReady={isDataReady} />
      <div className="bg-premium-glow" />
      <div className="noise-overlay" />

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-rpg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6">
            <div className="w-12 h-12 border-4 border-jiwa/20 border-t-jiwa rounded-full animate-spin" />
            <h3 className="text-lg font-black tracking-widest text-rpg-text uppercase italic">Soul Alignment...</h3>
          </motion.div>
        )}
      </AnimatePresence>

      {!hideNavbar && <Navbar session={session} userName={name} onNavigate={setPage as any} currentPage={page} stats={stats} talentChoicesAvailable={talentChoicesAvailable} />}

      <div className={cn("transition-all duration-500 ease-out min-h-screen", !hideNavbar ? "md:pl-20 xl:pl-[280px] pb-24 md:pb-0" : "")}>
        <PullToRefresh onRefresh={() => session && initializeUserData(session)} disabled={['SOUL_GUARD', 'CODEX'].includes(page)}>
          <Suspense fallback={<PageSkeleton />}>
          <AnimatePresence mode="wait">
            {page === 'LANDING' && <Landing session={session} hasProfile={!!characterAnalysis} setPage={setPage} />}
            {page === 'LOGIN' && <Login onBack={() => setPage('LANDING')} />}
            {page === 'REGISTER' && <Register onBack={() => setPage('LANDING')} />}
            {page === 'COMPLETE_GOOGLE_PROFILE' && (
              <CompleteGoogleProfile 
                userId={dbUserId || ''} 
                initialUsername={name} 
                onComplete={(ctx) => { setUserContext(ctx); handleStartOnboarding(ctx); }} 
              />
            )}
            {page === 'COMPLETE_PROFILE' && (
              <CompleteGoogleProfile 
                userId={dbUserId || ''} 
                initialUsername={name} 
                onComplete={(ctx) => { setUserContext(ctx); setPage('ONBOARDING'); }} 
              />
            )}
            {page === 'ONBOARDING' && <Onboarding onComplete={handleOnboardingComplete} userContext={userContext} questions={onboardingQuestions} />}
            {page === 'CHARACTER_REVEAL' && characterAnalysis && <CharacterReveal analysis={characterAnalysis} onContinue={() => setPage('DASHBOARD')} />}
            {page === 'DASHBOARD' && (
              <Dashboard
                session={session} userId={dbUserId || ''} name={name} level={level} xp={xp} stats={stats} quests={quests} analysis={characterAnalysis}
                streak={streak} lastStreakDate={lastStreakDate} onClaimStreak={handleClaimStreak} statHistory={statHistory}
                completeQuest={completeQuest} handleLogout={() => supabase.auth.signOut()} addXp={addXp}
                onReOnboard={handleStartOnboarding} onRefreshQuests={refreshQuests} isRefreshing={isRefreshing}
                lastEvolutionDate={lastEvolutionDate} refreshCount={refreshCount} decayResult={decayResult}
                onTakeRecovery={handleTakeRecovery} setPage={setPage} talents={talents} onGenerateInitialQuests={generateInitialQuests}
                onClaimGlobalQuest={handleClaimGlobalQuest}
                availableWeeklyQuests={availableWeeklyQuests} activeWeeklyQuests={activeWeeklyQuests} onClaimWeeklyQuest={handleClaimWeeklyQuest}
                talentChoicesAvailable={talentChoicesAvailable} onSelectTalent={handleTalentSelection}
                pendingTalentPool={pendingTalentPool} onSaveTalentPool={saveTalentPool}
                onSkipTalent={handleSkipTalent}
              />
            )}
            {page === 'SETTINGS' && session && (
              <Settings
                userId={dbUserId || ''} initialName={name} email={session.user.email || ''} nameChangeCount={nameChangeCount}
                lastNameChange={lastNameChange} onUpdateName={handleUpdateName} onLogout={() => supabase.auth.signOut()} onBack={() => setPage('DASHBOARD')} setPage={setPage}
              />
            )}
            {page === 'PROFILE' && (
          characterAnalysis ? (
            <Profile 
              userId={dbUserId || ''}
              name={name} 
              level={level} 
              xp={xp} 
              stats={stats} 
              analysis={characterAnalysis} 
              onBack={() => setPage('DASHBOARD')} 
              talents={talents} 
              statHistory={statHistory} 
              zodiac={userContext.zodiac} 
              usia={userContext.usia} 
            />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-jiwa" />
              <p className="text-rpg-text/60 font-black uppercase tracking-widest text-xs">Menyelaraskan Dimensi...</p>
            </div>
          )
        )}
            {page === 'LEADERBOARD' && <Leaderboard currentUserId={dbUserId || ''} onBack={() => setPage(session ? 'DASHBOARD' : 'LANDING')} />}
            {page === 'ADMIN' && isAdmin(session?.user.email) && <Admin onBack={() => setPage('DASHBOARD')} />}
            {page === 'CODEX' && <Codex onBack={() => setPage('DASHBOARD')} />}
            {page === 'MAIL' && <Mail userId={dbUserId || ''} supabaseId={session?.user.id || ''} onBack={() => setPage('DASHBOARD')} />}
            {page === 'SOUL_GUARD' && <MentalHealthChat userId={dbUserId || ''} username={name} onBack={() => setPage('DASHBOARD')} />}
          </AnimatePresence>
          </Suspense>
        </PullToRefresh>
      </div>

      <AnimatePresence>
        {showLevelUp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
            {levelUpStage === 1 ? (
              <motion.div key="lvl-anim" initial={{ scale: 0.5, y: 50 }} animate={{ scale: 1, y: 0 }} className="relative max-w-sm w-full bg-gradient-to-b from-jiwa to-rpg-black p-8 rounded-[40px] border border-white/20 text-center">
                <Star className="w-16 h-16 text-rpg-text mx-auto mb-6 animate-pulse" />
                <h2 className="text-4xl font-black italic text-rpg-text mb-4">LEVEL UP!</h2>
                <div className="text-4xl font-black text-rpg-text">{level}</div>
                <button onClick={() => setShowLevelUp(false)} className="mt-8 px-8 py-3 bg-rpg-primary text-rpg-primary-text rounded-full font-black">LANJUTKAN</button>
              </motion.div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
      <ToastContainer />
    </div>
    </LazyMotion>
  );
}

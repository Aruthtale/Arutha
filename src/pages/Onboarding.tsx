import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { analyzeCharacter, generateOnboardingQuestions, type OnboardingAnswer, type CharacterAnalysis } from '../lib/gemini';

const FALLBACK_QUESTIONS = [
  "Apa hobimu saat sedang bosan?",
  "Pilih satu: Olahraga, Main Game, atau Tidur?",
  "Jika punya 10 juta, buat apa?",
  "Siapa tokoh idola atau panutanmu?",
  "Hal apa yang paling sering bikin kamu kepikiran?",
  "Apa cita-citamu waktu masih kecil?",
  "Suka keramaian atau menyendiri?",
  "Lebih pilih uang banyak atau teman banyak?",
  "Apa satu hal yang ingin kamu ubah dari dirimu?",
  "Sebutkan satu kata yang menggambarkan kamu hari ini!",
];

interface OnboardingProps {
  onComplete: (answers: OnboardingAnswer[]) => void;
  userContext?: { usia?: number; gender?: string; username?: string; zodiac?: string };
  questions?: string[];
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, userContext, questions: providedQuestions }) => {
  const [step, setStep] = useState((providedQuestions && providedQuestions.length > 0) ? 0 : -1); 
  const [questions, setQuestions] = useState<string[]>((providedQuestions && providedQuestions.length > 0) ? providedQuestions : FALLBACK_QUESTIONS);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus the input on each step (except intro)
    if (step >= 0) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleStart = async () => {
    console.log("Memulai Sinkronisasi Dimensi...");
    setIsLoadingQuestions(true);
    try {
      const generated = await generateOnboardingQuestions(userContext);
      console.log("Pertanyaan diterima:", generated);
      if (!generated || generated.length === 0) {
        console.error("AI mengembalikan array kosong!");
      }
      setQuestions(generated);
    } catch (e) {
      console.warn("Failed to fetch questions, using fallback.");
    } finally {
      setIsLoadingQuestions(false);
      setStep(0);
    }
  };

  const handleSubmit = async () => {
    if (!currentAnswer.trim()) return;

    const newAnswer: OnboardingAnswer = {
      question: questions[step],
      answer: currentAnswer.trim(),
    };
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    setCurrentAnswer('');

    if (step < questions.length - 1) {
      setStep(s => s + 1);
    } else {
      // All questions answered — send to parent for analysis
      onComplete(updatedAnswers);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const progress = step >= 0 ? ((step) / questions.length) * 100 : 0;

  // --- Intro Screen ---
  if (step === -1) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-rpg-black relative overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-jiwa/10 blur-[150px] rounded-full pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-xl text-center space-y-8"
        >
          <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-6">
            <Sparkles className="w-8 h-8 text-jiwa" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-neutral-100">
            Soul Initialization
          </h1>
          <div className="space-y-4 text-neutral-400 text-sm md:text-base leading-relaxed">
            <p>
              Setiap pahlawan memiliki awal ceritanya masing-masing. Sebelum kamu memulai petualangan ini, Arutha perlu memahami siapa kamu yang sebenarnya.
            </p>
            <p>
              Kami akan mengajukan 10 pertanyaan singkat untuk mengukur potensimu dalam 5 Dimensi Kehidupan: <strong className="text-jiwa">Jiwa</strong>, <strong className="text-raga">Raga</strong>, <strong className="text-harta">Harta</strong>, <strong className="text-ilmu">Ilmu</strong>, dan <strong className="text-karma">Karma</strong>.
            </p>
            <p className="text-neutral-200 font-medium">
              Jawablah sejujur mungkin. Tidak ada jawaban benar atau salah.
            </p>
          </div>
          
          <button
            onClick={handleStart}
            disabled={isLoadingQuestions}
            className="w-full md:w-auto px-8 py-4 bg-rpg-primary text-rpg-primary-text font-black rounded-2xl shadow-[0_0_20px_rgba(var(--rpg-primary-rgb),0.2)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoadingQuestions ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isLoadingQuestions ? 'Syncing Dimensions...' : 'START CALIBRATION'}
          </button>
        </motion.div>
      </div>
    );
  }

  // --- Analyzing Screen ---
  if (isAnalyzing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-rpg-black relative overflow-hidden">
        {/* Animated Background */}
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute w-[500px] h-[500px] bg-jiwa/20 blur-[150px] rounded-full"
        />
        <motion.div
          animate={{ scale: [1.3, 1, 1.3], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute w-[400px] h-[400px] bg-ilmu/20 blur-[130px] rounded-full"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center gap-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-full border-2 border-transparent border-t-jiwa border-r-ilmu"
          />
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-100 uppercase">
              Analyzing Soul Pattern...
            </h2>
            <p className="text-neutral-500 text-sm max-w-sm">
              The Arbiter is reading your frequency to determine your initial RPG Profile.
            </p>
          </div>

          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(i => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 h-2 rounded-full bg-white"
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // --- Question Screen ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-start md:justify-center p-6 bg-rpg-black relative overflow-y-auto overflow-x-hidden pt-32 pb-20 md:pt-24 md:pb-0">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-jiwa/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Progress bar */}
      <div className="fixed top-16 md:top-20 left-0 right-0 z-40 px-4 md:px-6">
        <div className="max-w-lg mx-auto">
          <div className="h-1 w-full bg-rpg-border rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-jiwa to-ilmu"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[8px] md:text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Profile Calibration</span>
            <span className="text-[8px] md:text-[10px] font-mono text-neutral-600">{step + 1} / {questions.length}</span>
          </div>
        </div>
      </div>

      {/* Previous answers (faded) */}
      <div className="max-w-lg w-full relative z-10">
        {answers.length > 0 && (
          <div className="mb-8 space-y-4 max-h-40 overflow-y-auto opacity-30 pointer-events-none">
            {answers.slice(-2).map((a, i) => (
              <div key={i} className="space-y-1">
                <p className="text-xs text-neutral-600 italic">"{a.question}"</p>
                <p className="text-sm text-neutral-400">{a.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* Current Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-jiwa" />
                <span className="text-[10px] font-black tracking-[0.3em] text-neutral-500 uppercase">
                  Pertanyaan {step + 1}
                </span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight leading-snug">
                {questions[step]}
              </h2>
            </div>

            {/* Answer Input */}
            <div className="relative">
              <textarea
                ref={inputRef}
                value={currentAnswer}
                onChange={e => setCurrentAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik jawabanmu di sini..."
                rows={3}
                className="w-full p-4 md:p-6 pr-14 md:pr-16 bg-rpg-card border border-rpg-border focus:border-white/30 rounded-2xl outline-none transition-all text-white placeholder:text-neutral-600 resize-none text-base md:text-lg leading-relaxed"
              />
              <button
                onClick={handleSubmit}
                disabled={!currentAnswer.trim()}
                className="absolute bottom-3 right-3 md:bottom-4 md:right-4 p-2.5 md:p-3 bg-rpg-primary text-rpg-primary-text rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:hover:scale-100 shadow-[0_0_15px_rgba(var(--rpg-primary-rgb),0.2)]"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-700 text-center">
              Tekan <kbd className="px-1.5 py-0.5 bg-rpg-card border border-rpg-border rounded text-neutral-500 font-mono">Enter</kbd> untuk lanjut
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Error state */}
        {analyzeError && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 bg-karma/10 border border-karma/20 rounded-2xl text-karma text-sm text-center"
          >
            {analyzeError}
            <button
              onClick={() => {
                setIsAnalyzing(true);
                setAnalyzeError(null);
                onComplete(answers);
              }}
              className="block mx-auto mt-2 underline font-bold hover:text-white transition-colors"
            >
              Coba Lagi
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

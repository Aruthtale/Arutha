import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { analyzeCharacter, type OnboardingAnswer, type CharacterAnalysis } from '../lib/gemini';

const QUESTIONS = [
  "Ceritakan, bagaimana harimu hari ini?",
  "Apa yang biasanya kamu lakukan ketika punya waktu senggang?",
  "Kalau ada uang 10 juta tiba-tiba masuk rekeningmu, apa yang pertama kamu pikirkan?",
  "Hal terakhir apa yang membuatmu penasaran dan ingin tahu lebih dalam?",
  "Bagaimana hubunganmu dengan orang-orang di sekitarmu belakangan ini?",
  "Apa yang paling sering membuatmu cemas atau khawatir?",
  "Kalau hidupmu dijadikan sebuah novel, kira-kira apa judul chapter yang sedang kamu jalani sekarang?",
];

interface OnboardingProps {
  onComplete: (analysis: CharacterAnalysis) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus the input on each step
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, [step]);

  const handleSubmit = async () => {
    if (!currentAnswer.trim()) return;

    const newAnswer: OnboardingAnswer = {
      question: QUESTIONS[step],
      answer: currentAnswer.trim(),
    };
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    setCurrentAnswer('');

    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1);
    } else {
      // All questions answered — analyze with AI
      setIsAnalyzing(true);
      setAnalyzeError(null);
      try {
        const result = await analyzeCharacter(updatedAnswers);
        onComplete(result);
      } catch (err: any) {
        console.error('Analysis failed:', err);
        setAnalyzeError(err.message || 'Gagal menganalisis. Coba lagi.');
        setIsAnalyzing(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const progress = ((step) / QUESTIONS.length) * 100;

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
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Menganalisis Karaktermu...
            </h2>
            <p className="text-neutral-500 text-sm max-w-sm">
              AI sedang membaca pola dari jawabanmu untuk menentukan profil karakter awal.
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-rpg-black relative overflow-hidden pt-24">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-jiwa/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Progress bar */}
      <div className="fixed top-20 left-0 right-0 z-40 px-6">
        <div className="max-w-lg mx-auto">
          <div className="h-1 w-full bg-rpg-border rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-jiwa to-ilmu"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">Analisis Profil</span>
            <span className="text-[10px] font-mono text-neutral-600">{step + 1} / {QUESTIONS.length}</span>
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
                {QUESTIONS[step]}
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
                className="w-full p-6 pr-16 bg-rpg-card border border-rpg-border focus:border-white/30 rounded-2xl outline-none transition-all text-white placeholder:text-neutral-600 resize-none text-lg leading-relaxed"
              />
              <button
                onClick={handleSubmit}
                disabled={!currentAnswer.trim()}
                className="absolute bottom-4 right-4 p-3 bg-white text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:hover:scale-100 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                <Send className="w-5 h-5" />
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
                analyzeCharacter(answers)
                  .then(onComplete)
                  .catch(err => {
                    setAnalyzeError(err.message);
                    setIsAnalyzing(false);
                  });
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

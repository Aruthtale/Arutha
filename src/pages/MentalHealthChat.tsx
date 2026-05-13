import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Loader2, Shield, Heart, Phone, Sparkles, Brain, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { chatWithSoulGuard, analyzeMentalState, type MentalStateAnalysis, type RiskLevel } from '../lib/gemini';
import { MAJOR_ARCANA } from '../lib/tarotData';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  cardId?: string;
}

interface MentalHealthChatProps {
  userId: string;
  username: string;
  onBack: () => void;
}

const PHASE_LABELS = [
  { phase: 1, label: 'Membangun Konteks', icon: Eye, color: 'text-ilmu' },
  { phase: 2, label: 'Eksplorasi Perasaan', icon: Brain, color: 'text-jiwa' },
  { phase: 3, label: 'Pendamping Jiwa', icon: Heart, color: 'text-karma' },
];

const RISK_COLORS: Record<RiskLevel, string> = {
  GREEN: 'bg-raga/20 border-raga/30 text-raga',
  YELLOW: 'bg-harta/20 border-harta/30 text-harta',
  RED: 'bg-karma/20 border-karma/30 text-karma',
};

const RISK_PULSE: Record<RiskLevel, string> = {
  GREEN: 'bg-raga',
  YELLOW: 'bg-harta',
  RED: 'bg-karma',
};

export const MentalHealthChat: React.FC<MentalHealthChatProps> = ({ userId, username, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<MentalStateAnalysis | null>(null);
  const [showCrisisBar, setShowCrisisBar] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [communicationStyle, setCommunicationStyle] = useState<'concise' | 'deep' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Count user messages for phase tracking
  const userMessageCount = messages.filter(m => m.role === 'user').length;

  // Update phase based on message count
  useEffect(() => {
    if (userMessageCount <= 3) setCurrentPhase(1);
    else if (userMessageCount <= 8) setCurrentPhase(2);
    else setCurrentPhase(3);
  }, [userMessageCount]);

  // Load chat history & settings
  useEffect(() => {
    const loadHistory = () => {
      const saved = localStorage.getItem(`arutha_soulguard_${userId}`);
      const savedStyle = localStorage.getItem(`arutha_soulguard_style_${userId}`);
      
      if (savedStyle) setCommunicationStyle(savedStyle as 'concise' | 'deep');

      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        setMessages(parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
      } else {
        // Initial greeting
        setMessages([{
          role: 'assistant',
          content: `Halo ${username}. Aku Soul Guard. Sebelum kita mulai, bagaimana kamu ingin aku meresponmu hari ini?`,
          timestamp: new Date()
        }]);
      }
    };
    loadHistory();
  }, [userId, username]);

  // Load saved analysis
  useEffect(() => {
    const savedAnalysis = localStorage.getItem(`arutha_soulguard_analysis_${userId}`);
    if (savedAnalysis) {
      try {
        setAnalysis(JSON.parse(savedAnalysis));
      } catch { /* ignore */ }
    }
  }, [userId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, communicationStyle]);

  // Check for crisis indicators
  useEffect(() => {
    if (analysis?.riskLevel === 'RED') {
      setShowCrisisBar(true);
    }
  }, [analysis]);

  const handleSend = async (forcedInput?: string) => {
    const messageToSend = forcedInput || input;
    if (!messageToSend.trim() || isLoading) return;

    const userMessage = messageToSend.trim();
    if (!forcedInput) setInput('');
    
    const newMsg: Message = { role: 'user', content: userMessage, timestamp: new Date() };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const historyForAI = updatedMessages.slice(-16).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Get Soul Guard response
      const response = await chatWithSoulGuard(
        userMessage,
        historyForAI.slice(0, -1),
        username,
        userMessageCount + 1,
        communicationStyle || 'concise'
      );

      // Small delay for more natural feel
      await new Promise(r => setTimeout(r, 400));

      // Check for Tarot trigger: [TAROT:card_id]
      let cleanResponse = response;
      let detectedCardId: string | undefined;
      const tarotMatch = response.match(/\[TAROT:([a-z_]+)\]/);
      
      if (tarotMatch) {
        detectedCardId = tarotMatch[1];
        cleanResponse = response.replace(/\[TAROT:[a-z_]+\]/, '').trim();
      }

      const assistantMsg: Message = { 
        role: 'assistant', 
        content: cleanResponse, 
        timestamp: new Date(),
        cardId: detectedCardId
      };
      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);

      // Save to localStorage
      localStorage.setItem(`arutha_soulguard_${userId}`, JSON.stringify(finalMessages));

      // Save to Supabase (best-effort)
      try {
        await supabase.from('chat_logs').insert([
          { user_id: userId, role: 'user', content: userMessage, category: 'soulguard' },
          { user_id: userId, role: 'assistant', content: response, category: 'soulguard' }
        ]);
      } catch { /* silent fail for chat logs */ }

      // Run silent mental health analysis (every 4 user messages, in background)
      if ((userMessageCount + 1) % 4 === 0 && (userMessageCount + 1) >= 4) {
        analyzeMentalState(
          finalMessages.map(m => ({ role: m.role, content: m.content })),
          username
        ).then(async (result) => {
          if (result) {
            setAnalysis(result);
            localStorage.setItem(`arutha_soulguard_analysis_${userId}`, JSON.stringify(result));
            console.log('[SoulGuard Internal Analysis]', JSON.stringify(result, null, 2));
            
            // Save to dimension_reflections
            try {
              await supabase.from('dimension_reflections').insert({
                id: crypto.randomUUID(),
                user_id: userId,
                dimension: 'JIWA',
                reflection_text: `Kondisi Batin: ${result.dominantCondition} - Pola: ${result.primaryPattern}`,
                created_at: new Date().toISOString()
              });
            } catch (refErr) {
              console.error('[Dimension Reflection Error]', refErr);
            }
          }
        }).catch(err => {
          console.warn('[SoulGuard Analysis Error]', err);
        });
      }

    } catch (error) {
      console.error('Soul Guard chat error:', error);
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: 'Maaf, koneksiku sedang terganggu. Tapi aku tetap di sini. Coba kirim lagi ya.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem(`arutha_soulguard_${userId}`);
    localStorage.removeItem(`arutha_soulguard_analysis_${userId}`);
    localStorage.removeItem(`arutha_soulguard_style_${userId}`);
    setAnalysis(null);
    setCommunicationStyle(null);
    setMessages([{
      role: 'assistant',
      content: `Halo ${username}. Bagaimana kamu ingin aku meresponmu kali ini?`,
      timestamp: new Date()
    }]);
    setShowResetConfirm(false);
  };

  const selectStyle = (style: 'concise' | 'deep') => {
    setCommunicationStyle(style);
    localStorage.setItem(`arutha_soulguard_style_${userId}`, style);
    // Trigger first system response based on style
    handleSend(style === 'concise' ? "Bicaralah secara singkat dan padat padaku." : "Bicaralah secara mendalam dan penuh empati padaku.");
  };

  const currentPhaseInfo = PHASE_LABELS[currentPhase - 1] || PHASE_LABELS[2];
  const PhaseIcon = currentPhaseInfo.icon;

  return (
    <div className="h-screen flex flex-col bg-rpg-black overflow-hidden relative z-[60]">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-0 w-[60%] h-[50%] bg-jiwa/5 rounded-full blur-[200px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 right-0 w-[70%] h-[60%] bg-ilmu/5 rounded-full blur-[200px]" style={{ animationDuration: '12s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-karma/3 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      {/* Crisis Bar */}
      <AnimatePresence>
        {showCrisisBar && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="flex-none bg-gradient-to-r from-karma/90 to-karma/70 backdrop-blur-xl text-rpg-text px-6 py-4 flex items-center justify-between md:pl-[280px]"
          >
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-bold">
                Butuh bantuan segera? Hubungi: <span className="underline">119 ext 8</span> (24 jam)
              </span>
            </div>
            <button onClick={() => setShowCrisisBar(false)} className="text-xs font-bold opacity-60 hover:opacity-100 transition-opacity">
              Tutup
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Area */}
      <div className="flex-none bg-rpg-black/80 backdrop-blur-3xl border-b border-rpg-border/50">
        <div className="px-6 py-5 flex items-center justify-between max-w-3xl mx-auto w-full relative">
          
          {/* Floating Back Button - Now relative to the fixed header for better alignment */}
          <div className="absolute left-6 md:-left-16 top-1/2 -translate-y-1/2">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="p-3 rounded-2xl bg-rpg-border/5 backdrop-blur-xl border border-rpg-border/50 shadow-2xl text-neutral-400 hover:text-rpg-text transition-all flex items-center justify-center group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </motion.button>
          </div>

          <div className="flex items-center gap-4 pl-14 sm:pl-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-jiwa/30 to-ilmu/30 border border-rpg-border/50 flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-jiwa" />
                </div>
                <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-rpg-black", RISK_PULSE[analysis?.riskLevel || 'GREEN'])} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-rpg-text tracking-tight leading-none">Soul Guard</h2>
                <div className="flex items-center gap-2 mt-1">
                  <PhaseIcon className={cn("w-2.5 h-2.5", currentPhaseInfo.color)} />
                  <span className={cn("text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em]", currentPhaseInfo.color)}>
                    {currentPhaseInfo.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:text-neutral-300 transition-colors px-3 py-2 rounded-xl hover:bg-rpg-border/5"
          >
            Reset
          </button>
        </div>

        {/* Phase Progress Bar */}
        <div className="px-6 pb-4 max-w-3xl mx-auto w-full">
          <div className="flex gap-1.5">
            {PHASE_LABELS.map((p, i) => (
              <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-rpg-border/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: currentPhase > i ? '100%' : currentPhase === i + 1 ? `${Math.min(100, (userMessageCount / (i === 0 ? 3 : i === 1 ? 8 : 15)) * 100)}%` : '0%' }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={cn(
                    "h-full rounded-full",
                    i === 0 ? "bg-ilmu" : i === 1 ? "bg-jiwa" : "bg-karma"
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-neutral-900 border border-rpg-border/50 rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-karma to-transparent" />
              
              <div className="w-16 h-16 rounded-2xl bg-karma/10 border border-karma/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-karma" />
              </div>

              <h3 className="text-xl font-black text-rpg-text text-center mb-2 italic tracking-tighter">Reset Soul Guard?</h3>
              <p className="text-sm text-neutral-500 text-center mb-8 leading-relaxed">
                Seluruh riwayat obrolan dan analisis emosionalmu akan dihapus secara permanen dari dimensi ini.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleClearHistory}
                  className="w-full py-4 bg-karma text-black font-black uppercase tracking-widest rounded-2xl hover:bg-karma/90 transition-colors shadow-lg shadow-karma/20"
                >
                  Hapus Permanen
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full py-4 bg-rpg-border/5 text-rpg-text font-bold rounded-2xl hover:bg-rpg-border/10 transition-colors"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto hide-scrollbar px-4 sm:px-6 py-8 max-w-3xl mx-auto w-full space-y-8">
        {!communicationStyle && messages.length === 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-6 space-y-6"
          >
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => selectStyle('concise')}
                className="group relative p-6 bg-white/[0.03] border border-rpg-border/50 rounded-[24px] hover:bg-rpg-border/5 hover:border-jiwa/30 transition-all text-left"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 rounded-xl bg-jiwa/10 border border-jiwa/20 text-jiwa group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-rpg-text uppercase tracking-wider">Mode Singkat</h4>
                </div>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Respon padat (1 paragraf). Fokus pada pencerahan langsung tanpa basa-basi.
                </p>
              </button>

              <button 
                onClick={() => selectStyle('deep')}
                className="group relative p-6 bg-white/[0.03] border border-rpg-border/50 rounded-[24px] hover:bg-rpg-border/5 hover:border-karma/30 transition-all text-left"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 rounded-xl bg-karma/10 border border-karma/20 text-karma group-hover:scale-110 transition-transform">
                    <Heart className="w-5 h-5" />
                  </div>
                  <h4 className="font-black text-rpg-text uppercase tracking-wider">Mode Mendalam</h4>
                </div>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Respon lebih detail dan penuh empati. Untuk kamu yang butuh teman ngobrol panjang.
                </p>
              </button>
            </div>
          </motion.div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}
          >
            <div className={cn(
              "max-w-[88%] sm:max-w-[80%] px-5 py-4 text-[15px] leading-relaxed whitespace-pre-wrap shadow-sm",
              msg.role === 'user'
                ? "bg-rpg-primary text-rpg-primary-text rounded-[20px] rounded-tr-[6px] font-semibold"
                : "bg-rpg-card border border-rpg-border/30 text-rpg-text/80 rounded-[20px] rounded-tl-[6px] font-medium"
            )}>
              {msg.content}
              
              {/* Tarot Card inside bubble */}
              {msg.cardId && (
                <div className="mt-4 pt-4 border-t border-rpg-border/50">
                  <TarotCardUI cardId={msg.cardId} />
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2 opacity-25">
              {msg.role === 'assistant' ? (
                <Shield className="w-3 h-3 text-jiwa" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                {msg.role === 'user' ? username : 'Soul Guard'}
              </span>
              <span className="text-[9px] font-medium text-neutral-600">
                {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </motion.div>
        ))}

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-start gap-3"
            >
              <div className="bg-white/[0.06] border border-white/[0.08] rounded-[20px] rounded-tl-[6px] px-6 py-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-jiwa/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-jiwa/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-jiwa/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="h-4" /> {/* Bottom safety spacer */}
      </div>

      {/* Input Area */}
      <div className="flex-none bg-rpg-black/95 backdrop-blur-2xl border-t border-rpg-border/50 px-4 sm:px-6 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto w-full">
          {/* Quick Prompts (shown when few messages) */}
          {userMessageCount === 0 && input.trim() === '' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-2 mb-4"
            >
              {['Hari ini capek banget 😮‍💨', 'Lagi seneng hari ini!', 'Butuh teman ngobrol'].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt);
                    inputRef.current?.focus();
                  }}
                  className="px-4 py-2.5 bg-rpg-border/5 border border-rpg-border/50 rounded-full text-xs font-bold text-neutral-400 hover:text-rpg-text hover:bg-rpg-border/10 hover:border-white/20 transition-all active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </motion.div>
          )}

          <div className="relative flex items-center gap-3">
            <div className="flex-1 relative group">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ceritakan apa yang kamu rasakan..."
                disabled={isLoading}
                maxLength={500}
                className="w-full bg-white/[0.06] border border-rpg-border/50 rounded-2xl py-4 pl-5 pr-12 text-[15px] text-rpg-text placeholder:text-neutral-600 focus:outline-none focus:border-jiwa/30 focus:bg-white/[0.08] transition-all disabled:opacity-50"
              />
              {input.length > 0 && (
                <div className={cn(
                  "absolute right-4 bottom-[-18px] text-[9px] font-black tracking-widest transition-all",
                  input.length >= 450 ? "text-karma opacity-100" : "text-neutral-700 opacity-0 group-focus-within:opacity-100"
                )}>
                  {input.length}/500
                </div>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg shrink-0",
                input.trim() && !isLoading
                  ? "bg-gradient-to-br from-jiwa to-ilmu text-rpg-text shadow-jiwa/20"
                  : "bg-rpg-border/5 text-neutral-600 border border-rpg-border/50"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-[10px] text-neutral-700 mt-3 font-medium">
            Soul Guard bukan alat diagnosis. Jika kamu dalam kondisi darurat, hubungi 119 ext 8.
          </p>
        </div>
      </div>
    </div>
  );
};

// Sub-component for Tarot UI
function TarotCardUI({ cardId }: { cardId: string }) {
  const card = MAJOR_ARCANA.find(c => c.id === cardId);
  if (!card) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, rotateY: 45 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      className="relative w-full max-w-[200px] aspect-[2/3] mx-auto group perspective-1000"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-harta/20 to-karma/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
      <div className="relative h-full bg-neutral-800 border-2 border-harta/30 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        <div className="flex-1 relative">
          <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-harta italic">Arcana Major</span>
          </div>
        </div>
        <div className="p-3 bg-black/40 backdrop-blur-md border-t border-rpg-border/50">
          <h4 className="text-xs font-black text-rpg-text text-center uppercase tracking-widest mb-1">{card.name}</h4>
          <p className="text-[9px] text-neutral-400 text-center leading-tight italic line-clamp-2">
            "{card.meaning}"
          </p>
        </div>
      </div>
      
      {/* Decorative Gold Corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-harta/50 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-harta/50 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-harta/50 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-harta/50 rounded-br-lg" />
    </motion.div>
  );
}

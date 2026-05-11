import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Loader2, Sparkles, User, Bot } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { chatWithArbiter, Stats } from '../lib/gemini';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatWidgetProps {
  userId: string;
  username: string;
  stats: Stats;
}

export const AIChatWidget: React.FC<AIChatWidgetProps> = ({ userId, username, stats }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history from Supabase with LocalStorage fallback
  useEffect(() => {
    if (isOpen) {
      const fetchHistory = async () => {
        try {
          const { data, error } = await supabase
            .from('chat_logs')
            .select('role, content')
            .eq('user_id', userId)
            .eq('category', 'arbiter')
            .order('created_at', { ascending: true })
            .limit(20);

          if (!error && data && data.length > 0) {
            setMessages(data as Message[]);
            localStorage.setItem(`arutha_chat_${userId}`, JSON.stringify(data));
          } else {
            // Fallback to local storage
            const localHistory = localStorage.getItem(`arutha_chat_${userId}`);
            if (localHistory) {
              setMessages(JSON.parse(localHistory));
            } else {
              setMessages([{ 
                role: 'assistant', 
                content: `Selamat datang kembali, ${username}. Aku adalah The Arbiter. Apa yang ingin kau diskusikan mengenai progres takdirmu hari ini?` 
              }]);
            }
          }
        } catch (e) {
          console.error('Supabase fetch failed, using local storage:', e);
        }
      };
      fetchHistory();
    }
  }, [isOpen, userId, username]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Save assistant message to local storage first (for responsiveness)
      const currentMessages = [...newMessages];
      
      // Get AI response
      const response = await chatWithArbiter(userMessage, messages.slice(-10), stats, username);
      const assistantMessage: Message = { role: 'assistant', content: response };
      const updatedMessages = [...currentMessages, assistantMessage];
      setMessages(updatedMessages);
      localStorage.setItem(`arutha_chat_${userId}`, JSON.stringify(updatedMessages));

      // Try to save to Supabase
      const { error: userError } = await supabase.from('chat_logs').insert({ 
        user_id: userId, 
        role: 'user', 
        content: userMessage,
        category: 'arbiter'
      });
      
      if (userError) console.warn('User message sync failed:', userError.message);

      const { error: aiError } = await supabase.from('chat_logs').insert({ 
        user_id: userId, 
        role: 'assistant', 
        content: response,
        category: 'arbiter'
      });

      if (aiError) console.warn('AI message sync failed:', aiError.message);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { role: 'assistant', content: 'Koneksi ke dimensi astral terputus...' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 sm:bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 bottom-24 top-20 sm:absolute sm:inset-auto sm:bottom-20 sm:right-0 sm:w-[400px] sm:h-[550px] glass-panel border-white/10 shadow-2xl flex flex-col overflow-hidden rounded-[2rem] sm:rounded-3xl z-[100]"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-jiwa to-ilmu flex items-center justify-center shadow-lg shadow-jiwa/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white tracking-tight">The Arbiter</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Watching over you</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[90%] p-3 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm transition-all",
                    msg.role === 'user' 
                      ? "bg-white text-black rounded-tr-none font-bold" 
                      : "bg-white/10 border border-white/10 text-white rounded-tl-none font-medium"
                  )}>
                    {msg.content}
                  </div>
                  <div className="mt-3 flex items-center gap-2 opacity-30">
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {msg.role === 'user' ? username : 'Arbiter'}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-2 opacity-50">
                  <Loader2 className="w-4 h-4 animate-spin text-jiwa" />
                  <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">The Arbiter is reflecting...</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5 bg-white/5">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Bisikkan sesuatu..."
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-5 pr-12 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/30 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-2 p-2 bg-white text-black rounded-full hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all relative group",
          isOpen ? "bg-white text-black" : "bg-gradient-to-tr from-jiwa to-ilmu text-white"
        )}
      >
        <div className="absolute inset-0 bg-white blur-xl opacity-0 group-hover:opacity-20 transition-opacity rounded-full" />
        {isOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-rpg-black animate-bounce" />
        )}
      </motion.button>
    </div>
  );
};

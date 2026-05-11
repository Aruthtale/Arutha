import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ImagePlus, Star, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userNote: string;
  setUserNote: (val: string) => void;
  photoPreview: string | null;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
  onSubmit: () => void;
  isVerifying: boolean;
  feedback: { success: boolean; text: string } | null;
}

export const VerificationModal = ({ 
  isOpen, onClose, userNote, setUserNote, photoPreview, onPhotoUpload, onRemovePhoto, onSubmit, isVerifying, feedback 
}: VerificationModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          className="glass-panel p-8 max-w-lg w-full space-y-6 border-jiwa/20 shadow-2xl relative">
          
          <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>

          <div>
            <h3 className="text-2xl md:text-3xl font-black italic tracking-tighter">Buktikan Keberhasilanmu</h3>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">AI akan menganalisis catatanmu untuk memverifikasi kejujuran progresmu di dimensi ini.</p>
          </div>

          <textarea value={userNote} onChange={e => setUserNote(e.target.value)}
            placeholder="Ceritakan pengalamanmu menyelesaikan misi ini... (Opsional jika melampirkan foto)"
            className="w-full h-32 p-4 bg-rpg-black border border-rpg-border rounded-2xl focus:border-jiwa outline-none text-rpg-text resize-none text-sm shadow-inner" />
          
          <div className="flex flex-col gap-3">
            {photoPreview ? (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-rpg-border group">
                <img src={photoPreview} alt="Bukti" className="w-full h-full object-cover" />
                <button onClick={onRemovePhoto} className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 rounded-lg backdrop-blur-sm transition-colors text-rpg-text">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="w-full h-32 rounded-xl border-2 border-dashed border-rpg-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-jiwa/50 hover:bg-jiwa/5 transition-all group">
                <ImagePlus className="w-8 h-8 text-neutral-600 group-hover:text-jiwa transition-colors" />
                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest group-hover:text-jiwa">Lampirkan Foto Bukti</span>
                <input type="file" accept="image/*" onChange={onPhotoUpload} className="hidden" />
              </label>
            )}
          </div>

          {feedback && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={cn("p-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3",
                feedback.success ? "bg-jiwa/20 text-jiwa" : "bg-red-500/20 text-red-400")}>
              {feedback.success ? <Star className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {feedback.text}
            </motion.div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onClose}
              className="px-8 py-4 bg-rpg-border/5 border border-rpg-border/50 text-rpg-text/40 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all"
            >
              KEMBALI
            </button>
            <button onClick={onSubmit} disabled={isVerifying || (!userNote.trim() && !photoPreview)}
              className="flex-1 py-4 bg-rpg-primary text-rpg-primary-text rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl flex items-center justify-center gap-3">
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  MENYINKRONKAN JIWA...
                </>
              ) : 'KIRIM LAPORAN'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

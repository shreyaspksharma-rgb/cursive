import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ErrorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  articleId: number | null;
  articleTitle: string | undefined;
}

export const ErrorReportModal: React.FC<ErrorReportModalProps> = ({ 
  isOpen, 
  onClose, 
  user,
  articleId,
  articleTitle 
}) => {
  const [reportType, setReportType] = useState<'typo' | 'bug' | 'formatting' | 'other'>('typo');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !articleId) return;

    setIsSubmitting(true);
    try {
      // Capture technical context automatically for efficiency
      const metadata = {
        userAgent: navigator.userAgent,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        url: window.location.href,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      await addDoc(collection(db, 'errorReports'), {
        uid: user?.uid || 'anonymous',
        email: user?.email || 'anonymous',
        articleId,
        articleTitle: articleTitle || 'Unknown Article',
        reportType,
        description: description.trim(),
        metadata,
        createdAt: serverTimestamp()
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setDescription('');
        setReportType('typo');
      }, 2000);
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-md rounded-none shadow-2xl overflow-hidden relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors z-10"
            >
              <X size={20} />
            </button>

            {isSuccess ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-2">Report Received</h3>
                <p className="text-sm opacity-60 font-serif">
                  Thank you for helping us improve Cursive. Our editorial team will review this shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8">
                <header className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-none">
                      <AlertTriangle size={18} />
                    </div>
                    <span className="micro-label !text-amber-700 tracking-widest font-bold">Feedback Channel</span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight mb-1">Report an Issue</h2>
                  <p className="text-xs opacity-50 font-serif italic">
                    Found an error in <span className="font-bold underline">"{articleTitle}"</span>? Let us know.
                  </p>
                </header>

                <div className="space-y-6">
                  <div>
                    <label className="block micro-label mb-3">Type of Issue</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['typo', 'bug', 'formatting', 'other'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setReportType(type as any)}
                          className={`py-2 px-3 rounded-none border text-[10px] font-mono uppercase tracking-widest transition-all ${
                            reportType === type 
                              ? 'bg-ink text-bg border-ink' 
                              : 'border-line hover:border-ink/30'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block micro-label mb-3">Description</label>
                    <textarea
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the typo, bug, or issue..."
                      className="w-full h-32 bg-ink/[0.03] border border-line/10 rounded-none p-4 text-sm focus:outline-none focus:border-ink/30 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-line/10">
                  <button
                    type="submit"
                    disabled={isSubmitting || !description.trim()}
                    className="w-full bg-ink text-bg py-4 rounded-none font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed group"
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

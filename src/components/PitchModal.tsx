import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles, MessageSquare, Lightbulb } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface PitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export const PitchModal: React.FC<PitchModalProps> = ({ isOpen, onClose, user }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gameIdea, setGameIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in to pitch a story.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'pitches'), {
        uid: user.uid,
        email: user.email,
        title,
        description,
        gameIdea,
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setTitle('');
        setDescription('');
        setGameIdea('');
      }, 3000);
    } catch (err: any) {
      console.error('Error submitting pitch:', err);
      setError('Failed to submit pitch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white text-black max-w-2xl w-full p-8 md:p-12 relative shadow-2xl border border-gray-200 rounded-3xl my-8"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-black/5 transition-colors rounded-full"
            >
              <X size={24} />
            </button>

            {submitted ? (
              <div className="text-center py-12">
                <div className="bg-emerald-100 text-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send size={40} />
                </div>
                <h2 className="text-3xl font-bold tracking-tighter mb-4">Pitch Received.</h2>
                <p className="text-lg opacity-60 font-serif italic">
                  Thank you for sharing your vision. Our editorial team will review your pitch and get back to you soon.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-ink text-bg p-2 rounded-full">
                      <Sparkles size={20} />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-50">Contributor Program</span>
                  </div>
                  <h2 className="text-4xl font-bold tracking-tighter mb-4">Pitch Your Story.</h2>
                  <p className="text-lg opacity-60 font-serif leading-relaxed">
                    Have a narrative that needs to be played? We're looking for interactive journalism that challenges the medium.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="micro-label flex items-center gap-2">
                      <MessageSquare size={12} /> Story Title
                    </label>
                    <input
                      type="text"
                      placeholder="The intersection of..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full bg-black/5 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-black transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="micro-label flex items-center gap-2">
                      <Lightbulb size={12} /> Narrative Summary
                    </label>
                    <textarea
                      placeholder="What is the core message of your story?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={4}
                      className="w-full bg-black/5 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-black transition-colors resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="micro-label flex items-center gap-2">
                      <Sparkles size={12} /> Interactive Mechanic (Optional)
                    </label>
                    <textarea
                      placeholder="How should the reader interact with this piece? (e.g. Rearrange, Fill blanks, etc.)"
                      value={gameIdea}
                      onChange={(e) => setGameIdea(e.target.value)}
                      rows={3}
                      className="w-full bg-black/5 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-black transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-4 font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-all rounded-2xl shadow-lg flex items-center justify-center gap-3"
                  >
                    {loading ? 'Submitting...' : (
                      <>
                        <Send size={16} /> Submit Pitch
                      </>
                    )}
                  </button>
                  
                  {!user && (
                    <p className="text-center text-[10px] opacity-40 uppercase tracking-widest">
                      Please sign in to submit your pitch.
                    </p>
                  )}
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

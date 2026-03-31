import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white text-black max-w-lg w-full p-6 md:p-10 relative shadow-2xl border border-gray-200 rounded-3xl max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-black hover:text-white transition-colors rounded-full"
            >
              <X size={20} />
            </button>

            <div className="space-y-5 font-serif">
              <h2 className="text-2xl font-bold italic">Welcome,</h2>
              
              <div className="space-y-3 text-base leading-relaxed">
                <p>
                  We introduce you to our titled but structured sense of journalism where you
                  place what you know and news becomes a language to express. This is not a
                  publication where we not only present what’s ticking us but also what you want
                  to get from a certain story.
                </p>
                
                <p>
                  What you read is a stacked game. On the top right of every article there are icons.
                  Click on them and it’ll explain the puzzle.
                </p>
                
                <p>
                  Since this is just the beginning with time you’ll soon scribble some thoughts too.
                </p>

                <div className="bg-black/5 p-5 border-l-4 border-black mt-6 rounded-r-xl">
                  <p className="font-bold text-xs uppercase tracking-widest mb-1 font-sans">The Objective:</p>
                  <p className="text-sm italic">
                    To complete this edition, you must finish all six interactive articles. 
                    Once all puzzles are solved, you will receive the full answers and insights 
                    directly in your inbox.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-right italic text-sm">Until next time.</p>
                <p className="text-right font-bold text-sm">-Cursive.</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="mt-8 w-full bg-black text-white py-3 font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-xl"
            >
              Enter Publication
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

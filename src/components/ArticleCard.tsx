import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Shuffle, 
  MousePointerClick, 
  PenLine, 
  Keyboard, 
  Type,
  Zap,
  Droplets,
  Binary,
  Minus,
  Layout,
  HelpCircle,
  Share2,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Article, GameType } from '../constants';
import { calculateReadingTime } from '../utils';

interface ArticleCardProps {
  article: Article;
  onClick: () => void;
  onReport?: () => void;
  isCompleted: boolean;
  aspectRatio?: string;
  showImage?: boolean;
  showShare?: boolean;
}

const getGameIcon = (type: GameType) => {
  switch (type) {
    case 'fill-blanks': return <Sparkles size={18} />;
    case 'rearrange': return <Shuffle size={18} />;
    case 'double-click': return <MousePointerClick size={18} />;
    case 'poetic-fill': return <PenLine size={18} />;
    case 'type-answer': return <Keyboard size={18} />;
    case 'anagrams': return <Type size={18} />;
    case 'tangential-points': return <Droplets size={18} />;
    case 'compounding-effects': return <Binary size={18} />;
    case 'em-dash-phrases': return <Minus size={18} />;
    case 'paragraph-principles': return <Layout size={18} />;
    default: return <HelpCircle size={18} />;
  }
};

export const ArticleCard: React.FC<ArticleCardProps> = ({ 
  article, 
  onClick, 
  onReport,
  isCompleted,
  aspectRatio = "aspect-square",
  showImage = true,
  showShare = true,
}) => {
  const [isHoveringHelp, setIsHoveringHelp] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?article=${article.id}&puzzle=true`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div 
      className={`group relative flex flex-col h-full transition-all duration-500 w-full border-l-4 ${
        isCompleted 
          ? 'bg-emerald-50/30 border-l-emerald-500 pl-4 py-1 opacity-80 hover:opacity-100 grayscale-[0.1]' 
          : 'border-l-transparent pl-4 hover:border-l-ink/10'
      }`}
    >
      {isCompleted && (
        <div className="absolute top-0 right-0 p-2 z-[60] rotate-12 pointer-events-none">
          <div className="border-4 border-emerald-500/20 px-3 py-1 text-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-[0.4em] transform-gpu">
            Filed {new Date().getFullYear()}
          </div>
        </div>
      )}
      {article.image && article.id !== 7 && showImage && (
        <div 
          className={`relative ${aspectRatio} overflow-hidden mb-4 cursor-pointer rounded-none group/image`}
          onClick={onClick}
        >
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-1"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-500" />
          
          {isCompleted && (
            <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[2px] flex items-center justify-center">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/90 text-emerald-600 p-4 rounded-full shadow-2xl"
              >
                <Check size={32} strokeWidth={3} />
              </motion.div>
            </div>
          )}

          {isCompleted && (
            <div className="absolute top-4 left-4 bg-emerald-600 text-white px-3 py-1 text-[10px] font-mono uppercase tracking-widest z-10 rounded-full flex items-center gap-2 shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Verified Read
            </div>
          )}
        </div>
      )}

      {article.id !== 7 && !article.image && showImage && (
        <div 
          className={`relative py-8 md:py-12 px-6 bg-ink/5 border border-line/10 rounded-none mb-4 cursor-pointer hover:bg-ink/10 transition-all group overflow-hidden ${
            isCompleted ? 'bg-emerald-50/50 border-emerald-200/50' : ''
          }`}
          onClick={onClick}
        >
          {/* Subtle background decoration for no-image cards */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-ink/5 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-ink/5 blur-[40px] rounded-full -translate-x-1/2 translate-y-1/2" />
          
          <div className="relative z-10">
          </div>
          {isCompleted && (
            <div className="absolute top-4 right-4 bg-emerald-600 text-white px-3 py-1 text-[10px] font-mono uppercase tracking-widest z-10 rounded-full flex items-center gap-2 shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Verified Read
            </div>
          )}
        </div>
      )}

      <div 
        className={`flex flex-col flex-grow ${!showImage ? 'py-4 border-y border-line/10' : ''}`}
      >
        <div className="flex justify-between items-start gap-4 mb-2">
          <div className="flex items-center gap-2 group/title">
            <h3 
              className={`text-xl font-bold leading-tight cursor-pointer transition-all duration-500 group-hover:scale-[1.01] group-hover:translate-x-1 origin-left ${
                isCompleted ? 'text-emerald-900/90' : ''
              }`}
              onClick={onClick}
            >
              {article.title}
            </h3>
            {isCompleted && (
              <motion.div 
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="bg-emerald-500 text-white p-1 rounded-full flex-shrink-0 shadow-sm"
              >
                <Check size={10} strokeWidth={4} />
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {showShare && (
              <div className="relative">
                <button 
                  onClick={handleShare}
                  className={`border border-line rounded-full p-2 transition-all ${isShared ? 'bg-emerald-500 text-white border-emerald-500' : 'hover:bg-ink hover:text-bg'}`}
                  title="Share puzzling link"
                >
                  <AnimatePresence mode="wait">
                    {isShared ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                      >
                        <Check size={18} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="share"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Share2 size={18} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                
                <AnimatePresence>
                  {isShared && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, x: '-50%' }}
                      animate={{ opacity: 1, y: -40, x: '-50%' }}
                      exit={{ opacity: 0, y: 10, x: '-50%' }}
                      className="absolute left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap shadow-xl"
                    >
                      Copied!
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rotate-45" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {onReport && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReport();
                }}
                className="border border-line rounded-full p-2 hover:border-red-500 hover:text-red-500 transition-all opacity-40 hover:opacity-100"
                title="Report an issue with this article"
              >
                <AlertTriangle size={18} />
              </button>
            )}
            <div 
              className="relative"
              onMouseEnter={() => setIsHoveringHelp(true)}
              onMouseLeave={() => setIsHoveringHelp(false)}
            >
              <div className="border border-line rounded-full p-2 hover:bg-ink hover:text-bg transition-colors cursor-help">
                {getGameIcon(article.gameType)}
              </div>
              
              <AnimatePresence>
                {isHoveringHelp && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-4 w-72 bg-black text-white p-6 text-xs font-mono shadow-2xl z-50 rounded-none"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-[10px] uppercase tracking-widest text-white/40">How to play:-</p>
                        <div className="text-white/20">{getGameIcon(article.gameType)}</div>
                      </div>
                      
                      <div>
                        <p className="font-bold mb-1 text-sm">{article.gameType.replace('-', ' ').toUpperCase()}</p>
                        <p className="text-white/70 leading-relaxed font-sans">{article.gameExplanation}</p>
                      </div>

                      <div className="pt-3 border-t border-white/10">
                        <p className="font-bold mb-1 text-[10px] uppercase tracking-widest text-white/40">Rules:</p>
                        <p className="text-white/60 italic">1. Complete the interaction to finish the game.</p>
                      </div>
                    </div>
                    <div className="absolute -top-1 right-4 w-3 h-3 bg-black rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <p className={`text-[13px] leading-relaxed font-sans mb-3 transition-opacity duration-500 ${isCompleted ? 'opacity-40' : 'opacity-60'}`}>
          {article.description}
        </p>

        {/* Dynamic Completion Bar */}
        <div className="mt-auto pt-4">
          <div className="h-1.5 w-full bg-ink/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: isCompleted ? "100%" : "0%" }}
              className={`h-full ${isCompleted ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-ink/20'}`}
              transition={{ duration: 1, ease: "circOut" }}
            />
          </div>
          <div className="flex justify-between items-center mt-2.5">
            <span className={`text-[9px] font-mono uppercase tracking-[0.2em] transition-colors font-bold ${isCompleted ? 'text-emerald-600' : 'opacity-40'}`}>
              {isCompleted ? 'Retention Secured' : 'Engagement Pending'}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-mono uppercase tracking-widest opacity-20">
                {calculateReadingTime(article)} min read
              </span>
              {isCompleted && (
                <motion.div 
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map(i => <div key={i} className="w-1 h-2.5 bg-emerald-500/30" />)}
                    <div className="w-1 h-2.5 bg-emerald-500" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-600">100%</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Shuffle, 
  MousePointerClick, 
  PenLine, 
  Keyboard, 
  Type,
  HelpCircle 
} from 'lucide-react';
import { Article, GameType } from '../constants';

interface ArticleCardProps {
  article: Article;
  onClick: () => void;
  isCompleted: boolean;
  aspectRatio?: string;
}

const getGameIcon = (type: GameType) => {
  switch (type) {
    case 'fill-blanks': return <Sparkles size={18} />;
    case 'rearrange': return <Shuffle size={18} />;
    case 'double-click': return <MousePointerClick size={18} />;
    case 'poetic-fill': return <PenLine size={18} />;
    case 'type-answer': return <Keyboard size={18} />;
    case 'anagrams': return <Type size={18} />;
    default: return <HelpCircle size={18} />;
  }
};

export const ArticleCard: React.FC<ArticleCardProps> = ({ 
  article, 
  onClick, 
  isCompleted,
  aspectRatio = "aspect-square"
}) => {
  const [isHoveringHelp, setIsHoveringHelp] = useState(false);

  return (
    <div className={`group relative flex flex-col h-full transition-all duration-500 w-full ${isCompleted ? 'opacity-40 grayscale-[0.5] hover:opacity-60' : ''}`}>
      <div 
        className={`relative ${aspectRatio} overflow-hidden mb-2 cursor-pointer`}
        onClick={onClick}
      >
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        {isCompleted && (
          <div className="absolute top-4 left-4 bg-emerald-600 text-white px-3 py-1 text-[10px] font-mono uppercase tracking-widest z-10 rounded-full flex items-center gap-2 shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full" />
            Submitted
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-4 mb-1">
          <h3 
            className="text-2xl font-bold leading-tight cursor-pointer hover:opacity-70 transition-opacity"
            onClick={onClick}
          >
            {article.title}
          </h3>
          
          <div 
            className="relative shrink-0"
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
                  className="absolute right-0 top-full mt-4 w-72 bg-black text-white p-6 text-xs font-mono shadow-2xl z-50 rounded-2xl"
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

        <p className="text-[14px] leading-relaxed opacity-60 font-sans mb-2">
          {article.description}
        </p>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  Shuffle, 
  MousePointerClick, 
  PenLine, 
  Keyboard, 
  Type,
  HelpCircle,
  Info,
  Share2,
  Check
} from 'lucide-react';
import { Article, GameType } from '../constants';

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

interface GameViewProps {
  article: Article;
  onBack: () => void;
  onComplete: (answer: any) => void;
  onMistake: () => void;
  onPitch: () => void;
  isCompleted: boolean;
}

export const GameView: React.FC<GameViewProps> = ({ 
  article, 
  onBack, 
  onComplete, 
  onMistake,
  onPitch,
  isCompleted 
}) => {
  const [gameState, setGameState] = useState<any>(null);
  const [isCorrect, setIsCorrect] = useState(isCompleted);
  const [showHelp, setShowHelp] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?article=${article.id}`;
    const shareData = {
      title: `Cursive: ${article.title}`,
      text: article.description,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  useEffect(() => {
    // Initialize game state based on type
    if (article.gameType === 'fill-blanks') {
      setGameState(article.content.answers.map(() => ''));
    } else if (article.gameType === 'rearrange') {
      setGameState([...article.content.paragraphs].sort(() => Math.random() - 0.5));
    } else if (article.gameType === 'double-click') {
      setGameState({
        paragraphs: [...article.content.paragraphs],
        isFixed: false
      });
    } else if (article.gameType === 'poetic-fill') {
      setGameState('');
    } else if (article.gameType === 'type-answer') {
      setGameState('');
    } else if (article.gameType === 'anagrams') {
      setGameState(article.content.anagrams.map(() => ''));
    }
  }, [article]);

  const submitAnswer = () => {
    let correct = false;
    if (article.gameType === 'fill-blanks') {
      correct = gameState.every((val: string, i: number) => val.toLowerCase().trim() === article.content.answers[i].toLowerCase());
    } else if (article.gameType === 'rearrange') {
      correct = gameState.every((p: any, i: number) => p.id === article.content.correctOrder[i]);
    } else if (article.gameType === 'double-click') {
      correct = gameState.isFixed;
    } else if (article.gameType === 'poetic-fill') {
      correct = gameState.toLowerCase().trim() === article.content.answer.toLowerCase();
    } else if (article.gameType === 'type-answer') {
      correct = gameState.toLowerCase().trim() === article.content.answer.toLowerCase();
    } else if (article.gameType === 'anagrams') {
      correct = gameState.every((val: string, i: number) => val.toLowerCase().trim() === article.content.answers[i].toLowerCase());
    }

    if (correct) {
      setIsCorrect(true);
    } else {
      onMistake();
    }
    
    onComplete(gameState);
  };

  if (gameState === null && article.gameType !== 'double-click') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest mb-8 hover:opacity-60 transition-opacity"
      >
        <ArrowLeft size={16} /> Back to Publication
      </button>

      <div className="bg-white border border-line p-6 md:p-10 shadow-xl rounded-3xl">
        <header className="mb-10 border-b border-line pb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-ink text-bg p-2 rounded-full">
                {getGameIcon(article.gameType)}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-50">
                {article.gameType.replace('-', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleShare}
                className={`flex items-center gap-2 micro-label px-3 py-1.5 rounded-full border transition-all ${isShared ? 'bg-emerald-500 text-white border-emerald-500' : 'border-line hover:border-ink'}`}
              >
                {isShared ? <Check size={12} /> : <Share2 size={12} />}
                {isShared ? 'Link Copied' : 'Share'}
              </button>
              <button 
                onClick={() => setShowHelp(!showHelp)}
                className={`flex items-center gap-2 micro-label px-3 py-1.5 rounded-full border transition-all ${showHelp ? 'bg-ink text-bg border-ink' : 'border-line hover:border-ink'}`}
              >
                <Info size={12} /> {showHelp ? 'Hide Rules' : 'How to Play'}
              </button>
              {isCompleted && (
                <span className="flex items-center gap-1 text-ink font-mono text-[10px] uppercase tracking-widest bg-ink/5 px-3 py-1.5 rounded-full">
                  <CheckCircle2 size={14} /> Submitted
                </span>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-ink text-bg p-6 rounded-2xl text-sm font-sans leading-relaxed">
                  <p className="font-bold mb-2 uppercase tracking-widest text-[10px] opacity-50">Objective:</p>
                  <p>{article.gameExplanation}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight tracking-tighter">
            {article.title}
          </h1>
          <div className="h-48 md:h-80 w-full overflow-hidden mb-6 rounded-2xl">
            <img 
              src={article.image} 
              alt={article.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-lg md:text-xl font-serif italic opacity-60 leading-relaxed max-w-2xl">
            {article.description}
          </p>
        </header>

        <div className="prose prose-lg max-w-none font-serif leading-relaxed space-y-8">
          {/* Game Implementation */}
          {article.gameType === 'fill-blanks' && (
            <div className="space-y-6">
              <p className="font-bold border-l-4 border-ink pl-4 italic">
                {article.content.headline.split(/\[.*?\]/).map((part: string, i: number, arr: any[]) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <input
                        type="text"
                        value={gameState[i] || ''}
                        onChange={(e) => {
                          const next = [...gameState];
                          next[i] = e.target.value;
                          setGameState(next);
                        }}
                        className="inline-block border-b-2 border-ink w-32 mx-2 text-center focus:outline-none focus:bg-ink/5"
                        placeholder="..."
                      />
                    )}
                  </React.Fragment>
                ))}
              </p>
              {article.content.paragraphs.map((p: string, pi: number) => {
                // We need to calculate the global index for the inputs in each paragraph
                // This is a bit tricky with split. Let's assume the inputs are in order.
                // For Article 1: Headline has 2, Para 3 has 2, Para 4 has 1. Total 5.
                let inputOffset = 0;
                if (pi === 2) inputOffset = 2; // Starts after headline's 2
                if (pi === 3) inputOffset = 4; // Starts after para 3's 2
                
                const hasInputs = p.includes('[');

                return (
                  <p key={pi}>
                    {hasInputs ? p.split(/\[.*?\]/).map((part: string, i: number, arr: any[]) => (
                      <React.Fragment key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <input
                            type="text"
                            value={gameState[inputOffset + i] || ''}
                            onChange={(e) => {
                              const next = [...gameState];
                              next[inputOffset + i] = e.target.value;
                              setGameState(next);
                            }}
                            className="inline-block border-b-2 border-ink w-32 mx-2 text-center focus:outline-none focus:bg-ink/5"
                            placeholder="..."
                          />
                        )}
                      </React.Fragment>
                    )) : p}
                  </p>
                );
              })}
            </div>
          )}

          {article.gameType === 'rearrange' && (
            <div className="space-y-4">
              {gameState.map((p: any, i: number) => (
                <motion.div
                  layout
                  key={p.id}
                  className="p-4 border border-line bg-bg/30 cursor-move hover:bg-bg/50 transition-colors flex gap-4"
                >
                  <span className="font-mono text-xs opacity-30">{i + 1}</span>
                  <p className="text-sm">{p.text}</p>
                  <div className="flex flex-col gap-1 ml-auto">
                    <button 
                      onClick={() => {
                        if (i === 0) return;
                        const next = [...gameState];
                        [next[i-1], next[i]] = [next[i], next[i-1]];
                        setGameState(next);
                      }}
                      className="p-1 hover:bg-ink hover:text-bg transition-colors"
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => {
                        if (i === gameState.length - 1) return;
                        const next = [...gameState];
                        [next[i], next[i+1]] = [next[i+1], next[i]];
                        setGameState(next);
                      }}
                      className="p-1 hover:bg-ink hover:text-bg transition-colors"
                    >
                      ↓
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {article.gameType === 'double-click' && gameState && (
            <div className="space-y-6">
              {gameState.paragraphs.map((p: string, i: number) => (
                <p 
                  key={i}
                  onDoubleClick={() => {
                    if (i >= 5) {
                      const nextPara = [...gameState.paragraphs];
                      // Swap the words in the last two paragraphs
                      nextPara[5] = nextPara[5].replace('(key)', 'mild');
                      nextPara[6] = nextPara[6].replace('(mild)', 'key');
                      setGameState({ paragraphs: nextPara, isFixed: true });
                    }
                  }}
                  className={`transition-all duration-500 ${i >= 5 && !gameState.isFixed ? 'cursor-pointer hover:bg-ink/5' : ''}`}
                >
                  {p}
                </p>
              ))}
              {!gameState.isFixed && (
                <p className="text-xs font-mono uppercase opacity-50 text-center animate-pulse">
                  Double click the last two paragraphs to fix the words
                </p>
              )}
            </div>
          )}

          {article.gameType === 'poetic-fill' && (
            <div className="space-y-8">
              <div className="bg-bg/20 p-8 border-l-2 border-line italic text-sm space-y-1">
                {article.content.poem.map((line: string, i: number) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <div className="space-y-6">
                {article.content.paragraphs.map((p: string, i: number) => (
                  <p key={i}>
                    {p.includes('[________]') ? p.split('[________]').map((part: string, j: number, arr: any[]) => (
                      <React.Fragment key={j}>
                        {part}
                        {j < arr.length - 1 && (
                          <input
                            type="text"
                            value={gameState}
                            onChange={(e) => setGameState(e.target.value)}
                            className="inline-block border-b-2 border-ink w-48 mx-2 text-center focus:outline-none focus:bg-ink/5"
                            placeholder="Type answer..."
                          />
                        )}
                      </React.Fragment>
                    )) : p}
                  </p>
                ))}
              </div>
            </div>
          )}

          {article.gameType === 'type-answer' && (
            <div className="space-y-8">
              {article.content.paragraphs.map((p: string, i: number) => {
                // Render with italics
                const parts = p.split(/\*(.*?)\*/);
                return (
                  <p key={i}>
                    {parts.map((part, j) => (
                      j % 2 === 1 ? <em key={j} className="bg-ink/5 px-1">{part}</em> : part
                    ))}
                  </p>
                );
              })}
              <div className="pt-8 border-t border-line">
                <p className="font-mono text-xs uppercase tracking-widest mb-4 opacity-50">
                  {article.content.hint}
                </p>
                <input
                  type="text"
                  value={gameState}
                  onChange={(e) => setGameState(e.target.value)}
                  className="w-full border border-line p-4 font-mono focus:outline-none focus:bg-ink text-bg transition-all"
                  placeholder="TYPE FINAL WORD..."
                />
              </div>
            </div>
          )}

          {article.gameType === 'anagrams' && (
            <div className="space-y-6">
              {(() => {
                let currentInputIdx = 0;
                return article.content.paragraphs.map((p: string, pi: number) => {
                  const hasInputs = p.includes('[');
                  
                  return (
                    <p key={pi}>
                      {hasInputs ? p.split(/\[.*?\]/).map((part: string, i: number, arr: any[]) => {
                        const inputIdx = currentInputIdx;
                        if (i < arr.length - 1) {
                          currentInputIdx++;
                        }
                        
                        return (
                          <React.Fragment key={i}>
                            {part}
                            {i < arr.length - 1 && (
                              <input
                                type="text"
                                value={gameState[inputIdx] || ''}
                                onChange={(e) => {
                                  const next = [...gameState];
                                  next[inputIdx] = e.target.value;
                                  setGameState(next);
                                }}
                                className="inline-block border-b-2 border-ink w-48 mx-2 text-center focus:outline-none focus:bg-ink/5"
                                placeholder={`Fix: ${article.content.anagrams[inputIdx]}`}
                              />
                            )}
                          </React.Fragment>
                        );
                      }) : p}
                    </p>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {!isCompleted && (
          <button
            onClick={submitAnswer}
            className="mt-12 w-full bg-ink text-bg py-4 font-mono uppercase tracking-widest hover:opacity-90 transition-opacity rounded-xl"
          >
            Submit Answer
          </button>
        )}

        <div className="mt-12 pt-8 border-t border-line flex flex-col items-center gap-8">
          <button
            onClick={onBack}
            className="flex items-center gap-3 bg-ink/5 hover:bg-ink hover:text-bg px-8 py-4 rounded-full font-mono text-xs uppercase tracking-widest transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            Back to Publication
          </button>

          {/* Pitch CTA inside Article - Small and at the end */}
          <div className="mt-8 w-full bg-ink/5 rounded-2xl p-6 text-center border border-line/5">
            <p className="text-xs md:text-sm opacity-60 font-serif mb-4">
              Have a story like this? We're always looking for new voices.
            </p>
            <button 
              onClick={onPitch}
              className="bg-ink text-bg px-6 py-2 rounded-lg font-mono text-[9px] uppercase tracking-widest hover:opacity-90 transition-all inline-flex items-center gap-2"
            >
              <Sparkles size={12} /> Pitch Your Idea
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

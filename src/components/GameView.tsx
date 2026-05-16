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
  Zap,
  Droplets,
  Binary,
  Minus,
  Layout,
  HelpCircle,
  Info,
  Share2,
  Check,
  AlertTriangle,
  Volume2,
  Pause,
  Play,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Square,
  X,
  Clock
} from 'lucide-react';
import { Article, GameType } from '../constants';
import { calculateReadingTime } from '../utils';

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

interface GameViewProps {
  article: Article;
  onBack: () => void;
  onComplete: (answer: any) => void;
  onMistake: () => void;
  onPitch: () => void;
  onReportError: () => void;
  isCompleted: boolean;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  initialAnswer?: any;
}

export const GameView: React.FC<GameViewProps> = ({ 
  article, 
  onBack, 
  onComplete, 
  onMistake,
  onPitch,
  onReportError,
  isCompleted,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  initialAnswer
}) => {
  const [gameState, setGameState] = useState<any>(null);
  const [isCorrect, setIsCorrect] = useState(isCompleted);
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'checking' | 'correct' | 'wrong'>('idle');
  const [showHelp, setShowHelp] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [highlightPuzzle, setHighlightPuzzle] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);
  const puzzleRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggleSpeech = () => {
    if (isSpeaking) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } else {
      // Collect text to read
      let textToRead = `${article.title}. ${article.description}. `;
      
      if (article.gameType === 'fill-blanks') {
        textToRead += article.content.paragraphs.join('. ');
      } else if (article.gameType === 'rearrange') {
        textToRead += article.content.paragraphs.map((p: any) => p.text).join('. ');
      } else if (article.gameType === 'paragraph-principles') {
        textToRead += article.content.intro + '. ' + article.content.sections.map((s: any) => s.paragraph).join('. ') + '. ' + article.content.conclusion;
      } else {
         // Generic fallback
         if (article.content.paragraphs) {
           textToRead += article.content.paragraphs.join('. ');
         }
      }

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      
      utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance error', event);
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.cancel(); // Clear any existing speech
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      setIsPaused(false);
    }
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('puzzle') === 'true') {
      setHighlightPuzzle(true);
      setTimeout(() => {
        puzzleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
      
      // Clear the highlight after some time
      const timer = setTimeout(() => {
        setHighlightPuzzle(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [article.id]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?article=${article.id}&puzzle=true`;
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
    // If we have an initial answer and game is completed, use it
    if (initialAnswer && isCompleted) {
      setGameState(initialAnswer);
      return;
    }

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
    } else if (article.gameType === 'tangential-points') {
      setGameState([...article.content.fragments]);
    } else if (article.gameType === 'compounding-effects') {
      setGameState('');
    } else if (article.gameType === 'em-dash-phrases') {
      setGameState(article.content.answers.map(() => ''));
    } else if (article.gameType === 'paragraph-principles') {
      setGameState(article.content.sections.map(() => ''));
    }
  }, [article, initialAnswer, isCompleted]);

  const submitAnswer = () => {
    setSubmissionStatus('checking');

    // Artificial delay for 'checking' feel
    setTimeout(() => {
      let correct = false;
      if (article.gameType === 'fill-blanks') {
        correct = gameState.every((val: any, i: number) => (val || '').toString().toLowerCase().trim() === (article.content.answers[i] || '').toString().toLowerCase());
      } else if (article.gameType === 'rearrange') {
        correct = gameState.every((p: any, i: number) => p.id === article.content.correctOrder[i]);
      } else if (article.gameType === 'double-click') {
        correct = gameState.isFixed;
      } else if (article.gameType === 'poetic-fill') {
        correct = (gameState || '').toString().toLowerCase().trim() === (article.content.answer || '').toString().toLowerCase();
      } else if (article.gameType === 'type-answer') {
        correct = (gameState || '').toString().toLowerCase().trim() === (article.content.answer || '').toString().toLowerCase();
      } else if (article.gameType === 'anagrams') {
        correct = gameState.every((val: any, i: number) => (val || '').toString().toLowerCase().trim() === (article.content.answers[i] || '').toString().toLowerCase());
      } else if (article.gameType === 'tangential-points') {
        const currentIndices = gameState.map((f: string) => article.content.fragments.indexOf(f));
        correct = currentIndices.every((val: number, i: number) => val === article.content.correctOrder[i]);
      } else if (article.gameType === 'compounding-effects') {
        correct = (gameState || '').toString().toLowerCase().trim() === (article.content.answer || '').toString().toLowerCase();
      } else if (article.gameType === 'em-dash-phrases') {
        correct = gameState.every((val: any, i: number) => (val || '').toString().toLowerCase().trim() === (article.content.answers[i] || '').toString().toLowerCase());
      } else if (article.gameType === 'paragraph-principles') {
        correct = gameState.every((val: any, i: number) => (val || '').toString().toLowerCase().trim() === (article.content.sections[i].answer || '').toString().toLowerCase());
      }
      
      if (correct) {
        setIsCorrect(true);
        setSubmissionStatus('correct');
      } else {
        onMistake();
        setSubmissionStatus('wrong');
        setTimeout(() => setSubmissionStatus('idle'), 2000);
      }
      
      onComplete(gameState);
    }, 800);
  };

  if (gameState === null && article.gameType !== 'double-click') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-4"
    >
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest hover:opacity-100 opacity-40 transition-opacity"
        >
          <ArrowLeft size={12} /> Back to Publication
        </button>

        <div className="flex items-center gap-3">
          {hasPrev && (
            <button
              onClick={onPrev}
              className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest hover:opacity-100 opacity-30 transition-opacity"
              title="Previous Article"
            >
              <motion.div animate={{ x: [0, -1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}><ArrowLeft size={10} /></motion.div> Prev
            </button>
          )}
          <span className="text-ink/10 font-mono text-[9px]">{article.id.toString().padStart(2, '0')}</span>
          {hasNext && (
            <button
              onClick={onNext}
              className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest hover:opacity-100 opacity-30 transition-opacity"
              title="Next Article"
            >
              Next <motion.div animate={{ x: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}><ArrowLeft size={10} className="rotate-180" /></motion.div>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-line p-6 md:p-8 shadow-xl rounded-none">
        <header className="mb-8 border-b border-line pb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-ink text-bg p-1.5 rounded-full">
                {React.cloneElement(getGameIcon(article.gameType) as React.ReactElement, { size: 14 })}
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-40">
                {article.gameType.replace('-', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-ink/5 rounded-full px-1 py-0.5 border border-line/20">
                <button 
                  onClick={toggleSpeech}
                  className={`flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full transition-all ${isSpeaking ? 'bg-ink text-bg' : 'hover:bg-ink/10 opacity-60 hover:opacity-100'}`}
                  title={isSpeaking ? (isPaused ? 'Resume listening' : 'Pause listening') : 'Listen to article'}
                >
                  {isPaused ? <Play size={10} /> : (isSpeaking ? <Pause size={10} /> : <Volume2 size={10} />)}
                  {isSpeaking ? (isPaused ? 'Paused' : 'Playing') : 'Listen'}
                </button>
                {isSpeaking && (
                  <button 
                    onClick={stopSpeech}
                    className="p-1.5 opacity-40 hover:opacity-100 hover:text-red-500 transition-all"
                    title="Stop listening"
                  >
                    <Square size={10} />
                  </button>
                )}
              </div>
              <button 
                onClick={handleShare}
                className={`flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all ${isShared ? 'bg-emerald-500 text-white border-emerald-500' : 'border-line hover:border-ink opacity-40 hover:opacity-100'}`}
              >
                {isShared ? <Check size={10} /> : <Share2 size={10} />}
                {isShared ? 'Copied' : 'Share'}
              </button>
              <button 
                onClick={() => setShowHelp(!showHelp)}
                className={`flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all ${showHelp ? 'bg-ink text-bg border-ink' : 'border-line hover:border-ink opacity-40 hover:opacity-100'}`}
              >
                <Info size={10} /> {showHelp ? 'Hide' : 'Rules'}
              </button>
              <button 
                onClick={onReportError}
                className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border border-line hover:border-red-500 hover:text-red-500 transition-all opacity-40 hover:opacity-100"
                title="Report an issue with this article"
              >
                <AlertTriangle size={10} /> Report
              </button>
              <button 
                onClick={() => setShowAnswerSheet(true)}
                className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border border-line hover:border-ink opacity-40 hover:opacity-100 transition-all"
                title="View your current answers"
              >
                <Layout size={10} /> Answers
              </button>
              {isCompleted && (
                <span className="flex items-center gap-1 text-ink font-mono text-[9px] uppercase tracking-widest bg-ink/5 px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={12} /> OK
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
                <div className="bg-ink text-bg p-6 rounded-none text-sm font-sans leading-relaxed">
                  <p className="font-bold mb-2 uppercase tracking-widest text-[10px] opacity-50">Objective:</p>
                  <p>{article.gameExplanation}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <h1 className="text-2xl md:text-3xl font-bold mb-3 leading-tight tracking-tighter">
            {article.title}
          </h1>
          {article.image && (
            <div className="h-40 md:h-64 w-full overflow-hidden mb-4 rounded-none">
              <img 
                src={article.image} 
                alt={article.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <p className="text-base md:text-lg font-serif italic opacity-60 leading-relaxed max-w-2xl">
            {article.description}
          </p>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] opacity-30">
            <Clock size={12} />
            <span>Estimated Reading: {calculateReadingTime(article)} {calculateReadingTime(article) === 1 ? 'minute' : 'minutes'}</span>
          </div>
        </header>

        <div 
          ref={puzzleRef}
          className={`prose max-w-none font-serif leading-relaxed space-y-6 transition-all duration-1000 p-4 rounded-none ${highlightPuzzle ? 'bg-emerald-50 ring-2 ring-emerald-500 shadow-2xl' : ''}`}
        >
          {/* Game Implementation */}
          {article.gameType === 'fill-blanks' && (
            <div className="space-y-4">
              <div className="font-bold border-l-4 border-ink pl-4 italic text-sm md:text-base leading-relaxed">
                {article.content.headline.split(/\[.*?\]/).map((part: string, i: number, arr: any[]) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <div className="relative inline-block mx-2">
                        <input
                          type="text"
                          value={gameState[i] || ''}
                          onChange={(e) => {
                            const next = [...gameState];
                            next[i] = e.target.value;
                            setGameState(next);
                          }}
                          className={`inline-block border-b-2 w-20 text-center focus:outline-none transition-all text-xs font-serif ${
                            (gameState[i] || '').toString().toLowerCase().trim() === (article.content.answers[i] || '').toString().toLowerCase()
                              ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30'
                              : 'border-ink focus:bg-ink/5'
                          }`}
                          placeholder="..."
                        />
                        {(gameState[i] || '').toString().toLowerCase().trim() === (article.content.answers[i] || '').toString().toLowerCase() && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -right-4 top-1 text-emerald-500"
                          >
                            <Check size={12} />
                          </motion.div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              {article.content.paragraphs.map((p: string, pi: number) => {
                // We need to calculate the global index for the inputs in each paragraph
                // This is a bit tricky with split. Let's assume the inputs are in order.
                // For Article 1: Headline has 2, Para 3 has 2, Para 4 has 1. Total 5.
                let inputOffset = 0;
                if (pi === 2) inputOffset = 2; // Starts after headline's 2
                if (pi === 3) inputOffset = 4; // Starts after para 3's 2
                
                const hasInputs = p.includes('[');

                return (
                  <div key={pi}>
                    {hasInputs ? p.split(/\[.*?\]/).map((part: string, i: number, arr: any[]) => (
                      <React.Fragment key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <div className="relative inline-block mx-2">
                            <input
                              type="text"
                              value={gameState[inputOffset + i] || ''}
                              onChange={(e) => {
                                const next = [...gameState];
                                next[inputOffset + i] = e.target.value;
                                setGameState(next);
                              }}
                              className={`inline-block border-b-2 w-20 text-center focus:outline-none transition-all text-xs font-serif ${
                                (gameState[inputOffset + i] || '').toString().toLowerCase().trim() === (article.content.answers[inputOffset + i] || '').toString().toLowerCase()
                                  ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30'
                                  : 'border-ink focus:bg-ink/5'
                              }`}
                              placeholder="..."
                            />
                            {(gameState[inputOffset + i] || '').toString().toLowerCase().trim() === (article.content.answers[inputOffset + i] || '').toString().toLowerCase() && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -right-4 top-1 text-emerald-500"
                              >
                                <Check size={12} />
                              </motion.div>
                            )}
                          </div>
                        )}
                      </React.Fragment>
                    )) : p}
                  </div>
                );
              })}
            </div>
          )}

          {article.gameType === 'rearrange' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6 bg-ink/5 p-4 border-l-4 border-ink">
                <div className="w-8 h-8 rounded-full bg-ink text-bg flex items-center justify-center font-mono text-xs font-bold">!</div>
                <p className="text-[10px] font-mono uppercase tracking-widest leading-relaxed">
                  <strong>Puzzler's Note:</strong> This sequence has been intentionally disrupted. Restore the original narrative flow by rearranging the segments into their logical order.
                </p>
              </div>
              {gameState.map((p: any, i: number) => {
                const isCorrectPos = isCorrect || p.id === article.content.correctOrder[i];
                return (
                  <motion.div
                    layout
                    key={p.id}
                    className={`group relative p-6 border transition-all duration-500 flex gap-6 ${
                      isCorrectPos 
                        ? 'border-emerald-500/40 bg-emerald-50/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                        : 'border-line bg-bg/30 hover:bg-bg/50 hover:border-ink/20'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono text-xs transition-all duration-700 ${
                        isCorrectPos ? 'bg-emerald-500 border-emerald-500 text-white rotate-[360deg]' : 'bg-bg border-line text-ink/40'
                      }`}>
                        {i + 1}
                      </div>
                      <GripVertical size={14} className="opacity-10 group-hover:opacity-40 transition-opacity" />
                    </div>
                    
                    <div className={`flex-grow font-sans text-sm md:text-base leading-relaxed transition-all duration-500 ${isCorrectPos ? 'text-emerald-900/80' : 'text-ink/70'}`}>
                      {p.text}
                    </div>

                    <div className="flex flex-col gap-2 opacity-10 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (i === 0) return;
                          const next = [...gameState];
                          [next[i-1], next[i]] = [next[i], next[i-1]];
                          setGameState(next);
                        }}
                        disabled={isCorrect}
                        className={`p-2 rounded-full hover:bg-ink hover:text-bg transition-all ${i === 0 || isCorrect ? 'opacity-20 cursor-not-allowed' : ''}`}
                        title="Move Up"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (i === gameState.length - 1) return;
                          const next = [...gameState];
                          [next[i], next[i+1]] = [next[i+1], next[i]];
                          setGameState(next);
                        }}
                        disabled={isCorrect}
                        className={`p-2 rounded-full hover:bg-ink hover:text-bg transition-all ${i === gameState.length - 1 || isCorrect ? 'opacity-20 cursor-not-allowed' : ''}`}
                        title="Move Down"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    {isCorrectPos && !isCorrect && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 size={14} className="text-emerald-500/40" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {article.gameType === 'double-click' && gameState && (
            <div className="space-y-6">
              <div className="p-4 bg-ink/5 border-l-4 border-ink mb-8">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] italic">
                  <strong>Instruction:</strong> Double-click the incorrect (highlighted) terms to swap them with their factual counterparts based on current mission documentation.
                </p>
              </div>
              {gameState.paragraphs.map((para: string, i: number) => (
                <div 
                  key={i} 
                  className={`font-sans text-sm md:text-base leading-loose transition-all duration-500 ${!gameState.isFixed ? 'cursor-pointer hover:opacity-100 opacity-80' : 'opacity-100'}`}
                  onDoubleClick={() => {
                    if (isCorrect || gameState.isFixed) return;
                    const nextPara = [...gameState.paragraphs];
                    let changed = false;
                    article.content.wrongWords.forEach((wrong: string, idx: number) => {
                      if (nextPara[i].includes(`(${wrong})`)) {
                        nextPara[i] = nextPara[i].replace(`(${wrong})`, article.content.correctWords[idx]);
                        changed = true;
                      }
                    });

                    if (changed) {
                      const isFixed = nextPara.every(p => !p.includes('('));
                      setGameState({ paragraphs: nextPara, isFixed });
                    }
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: para.replace(/\(([^)]+)\)/g, '<span class="px-2 py-0.5 bg-red-100 text-red-700 font-bold border border-red-200 cursor-help">$1</span>')
                  }}
                />
              ))}
              {!gameState.isFixed && (
                <p className="text-[9px] font-mono uppercase opacity-30 text-center animate-pulse tracking-widest mt-8">
                  Awaiting factual correction in mission log...
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
                  <div key={i}>
                    {p.includes('[________]') ? p.split('[________]').map((part: string, j: number, arr: any[]) => (
                      <React.Fragment key={j}>
                        {part}
                        {j < arr.length - 1 && (
                          <div className="relative inline-block mx-2">
                            <input
                              type="text"
                              value={gameState}
                              onChange={(e) => setGameState(e.target.value)}
                              className={`inline-block border-b-2 w-32 text-center focus:outline-none transition-all text-sm font-serif ${
                                (gameState || '').toString().toLowerCase().trim() === (article.content.answer || '').toString().toLowerCase()
                                  ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30'
                                  : 'border-ink focus:bg-ink/5'
                              }`}
                              placeholder="Type..."
                            />
                            {(gameState || '').toString().toLowerCase().trim() === (article.content.answer || '').toString().toLowerCase() && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -right-4 top-1 text-emerald-500"
                              >
                                <Check size={12} />
                              </motion.div>
                            )}
                          </div>
                        )}
                      </React.Fragment>
                    )) : p}
                  </div>
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
                <div className="relative">
                  <input
                    type="text"
                    value={gameState}
                    onChange={(e) => setGameState(e.target.value)}
                    className={`w-full border p-3 font-mono text-sm focus:outline-none transition-all ${
                      gameState.toLowerCase().trim() === article.content.answer.toLowerCase()
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'border-line bg-white focus:bg-ink focus:text-bg'
                    }`}
                    placeholder="TYPE WORD..."
                  />
                  {gameState.toLowerCase().trim() === article.content.answer.toLowerCase() && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white"
                    >
                      <CheckCircle2 size={16} />
                    </motion.div>
                  )}
                </div>
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
                    <div key={pi}>
                      {hasInputs ? p.split(/\[.*?\]/).map((part: string, i: number, arr: any[]) => {
                        const inputIdx = currentInputIdx;
                        if (i < arr.length - 1) {
                          currentInputIdx++;
                        }
                        
                        const val = gameState[inputIdx] || '';
                        const isCorrect = (val || '').toString().toLowerCase().trim() === (article.content.answers[inputIdx] || '').toString().toLowerCase();

                        return (
                          <React.Fragment key={i}>
                            {part}
                            {i < arr.length - 1 && (
                              <div className="relative inline-block mx-1.5">
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => {
                                    const next = [...gameState];
                                    next[inputIdx] = e.target.value;
                                    setGameState(next);
                                  }}
                                  className={`inline-block border-b-2 w-20 text-center focus:outline-none transition-all text-xs font-serif ${
                                    isCorrect
                                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50/30'
                                      : 'border-ink focus:bg-ink/5'
                                  }`}
                                  placeholder={`Fix: ${article.content.anagrams[inputIdx]}`}
                                />
                                {isCorrect && (
                                  <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -right-4 top-1 text-emerald-500"
                                  >
                                    <Check size={12} />
                                  </motion.div>
                                )}
                              </div>
                            )}
                          </React.Fragment>
                        );
                      }) : p}
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {article.gameType === 'tangential-points' && (
            <div className="space-y-6">
              {(() => {
                let currentSpotIdx = 0;
                const currentIndices = gameState.map((f: string) => article.content.fragments.indexOf(f));

                return article.content.paragraphs.map((p: string, pi: number) => {
                  const hasBullet = p.includes('● [PHRASE]');
                  if (!hasBullet) return (
                    <p key={pi}>
                      {p.split(/\*(.*?)\*/).map((part, j) => (
                        j % 2 === 1 ? <em key={j} className="bg-ink/5 px-1">{part}</em> : part
                      ))}
                    </p>
                  );

                  const parts = p.split('● [PHRASE]');
                  return (
                    <p key={pi}>
                      {parts.map((part, i) => {
                        if (i === parts.length - 1) return part;
                        const spotIdx = currentSpotIdx++;
                        const currentFragment = gameState[spotIdx];
                        const isCorrect = currentIndices[spotIdx] === article.content.correctOrder[spotIdx];
                        
                        return (
                          <React.Fragment key={i}>
                            {part}
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-none mx-1 group/tangent transition-all ${
                              isCorrect ? 'bg-emerald-50 border-emerald-500/30' : 'bg-ink/5 border-line/20'
                            }`}>
                              <span className="flex flex-col gap-0.5">
                                <button 
                                  onClick={() => {
                                    if (spotIdx === 0) return;
                                    const next = [...gameState];
                                    [next[spotIdx - 1], next[spotIdx]] = [next[spotIdx], next[spotIdx - 1]];
                                    setGameState(next);
                                  }}
                                  className={`p-0.5 rounded hover:bg-ink hover:text-bg transition-colors ${spotIdx === 0 ? 'opacity-10 cursor-not-allowed' : 'opacity-40 hover:opacity-100'}`}
                                >
                                  <svg width="4" height="3" viewBox="0 0 6 4" fill="none" className="rotate-180"><path d="M1 1L3 3L5 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </button>
                                <button 
                                  onClick={() => {
                                    if (spotIdx === gameState.length - 1) return;
                                    const next = [...gameState];
                                    [next[spotIdx], next[spotIdx + 1]] = [next[spotIdx + 1], next[spotIdx]];
                                    setGameState(next);
                                  }}
                                  className={`p-0.5 rounded hover:bg-ink hover:text-bg transition-colors ${spotIdx === gameState.length - 1 ? 'opacity-10 cursor-not-allowed' : 'opacity-40 hover:opacity-100'}`}
                                >
                                  <svg width="4" height="3" viewBox="0 0 6 4" fill="none"><path d="M1 1L3 3L5 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </button>
                              </span>
                              <span className={`font-bold border-b italic text-xs transition-all ${
                                isCorrect ? 'text-emerald-700 border-emerald-500' : 'text-ink border-ink/30'
                              }`}>
                                ● {currentFragment}
                              </span>
                              {isCorrect && (
                                <motion.span 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="text-emerald-500"
                                >
                                  <Check size={10} />
                                </motion.span>
                              )}
                            </span>
                          </React.Fragment>
                        );
                      })}
                    </p>
                  );
                });
              })()}
            </div>
          )}

          {article.gameType === 'compounding-effects' && (
            <div className="space-y-6">
              {article.content.paragraphs.map((p: string, i: number) => {
                const parts = p.split(/(\*\*.*?\*\*|_.*?_|\[________\])/g);
                return (
                  <div key={i}>
                    {parts.map((part, j) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <span key={j} className="text-[#16a34a] bg-[#16a34a]/5 px-1.5 py-0.5 rounded-sm font-bold">{part.slice(2, -2)}</span>;
                      }
                      if (part.startsWith('_') && part.endsWith('_')) {
                        return <span key={j} className="text-[#2563eb] bg-[#2563eb]/5 px-1.5 py-0.5 rounded-sm italic">{part.slice(1, -1)}</span>;
                      }
                      if (part === '[________]') {
                        const isCorrect = (gameState || '').toString().toLowerCase().trim() === (article.content.answer || '').toString().toLowerCase();
                        return (
                          <div key={j} className="relative inline-block mx-1.5">
                            <input
                              type="text"
                              value={gameState}
                              onChange={(e) => setGameState(e.target.value)}
                              className={`inline-block border-2 w-24 text-center focus:outline-none bg-white transition-all rounded-none text-xs font-serif ${
                                isCorrect ? 'border-emerald-500 ring-2 ring-emerald-500/20' : ''
                              }`}
                              style={{ 
                                borderImageSource: isCorrect ? 'none' : 'linear-gradient(to right, #2563eb, #16a34a)',
                                borderImageSlice: isCorrect ? 'none' : 1,
                                borderStyle: 'solid'
                              }}
                              placeholder="..."
                            />
                            {isCorrect && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -right-6 top-1/2 -translate-y-1/2 text-emerald-500"
                              >
                                <CheckCircle2 size={16} />
                              </motion.div>
                            )}
                          </div>
                        );
                      }
                      return part;
                    })}
                  </div>
                );
              })}
              <div className="mt-8 p-6 bg-ink/5 rounded-none border border-line/20">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[#2563eb] border-2 border-white" title="Italics" />
                    <div className="w-8 h-8 rounded-full bg-[#16a34a] border-2 border-white" title="Bold" />
                  </div>
                  <p className="text-sm font-mono uppercase tracking-widest opacity-60">
                    Find the word that compounds these two themes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {article.gameType === 'em-dash-phrases' && (
            <div className="space-y-8">
              {article.content.paragraphs.map((p: string, pi: number) => {
                if (p.startsWith('###')) {
                  return <h3 key={pi} className="text-xl font-bold mt-12 mb-4 font-sans tracking-tight">{p.replace('###', '')}</h3>;
                }

                if (p.includes('[') && p.includes(']')) {
                  const parts = p.split(/\[(\d+)\]/);
                  return (
                    <div key={pi} className="my-10 p-8 bg-ink/5 border-l-4 border-ink rounded-none relative overflow-hidden group/quote">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-ink/5 rotate-45 translate-x-12 -translate-y-12" />
                      <div className="text-xl md:text-2xl font-serif italic relative z-10 leading-relaxed">
                        {parts.map((part, i) => {
                          const match = part.match(/^\d+$/);
                          if (match) {
                            const idx = parseInt(match[0]);
                            const val = gameState[idx] || '';
                            const isCorrect = (val || '').toString().toLowerCase().trim() === (article.content.answers[idx] || '').toString().toLowerCase();
                            
                            return (
                              <div key={i} className="relative inline-block w-full md:w-auto mx-1.5">
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => {
                                    const next = [...gameState];
                                    next[idx] = e.target.value;
                                    setGameState(next);
                                  }}
                                  className={`inline-block border-b-2 bg-transparent px-1 w-full md:w-auto min-w-[120px] focus:outline-none transition-all text-center placeholder:opacity-20 text-base mt-1 md:mt-0 ${
                                    isCorrect 
                                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50' 
                                      : 'border-ink text-ink focus:bg-ink/5'
                                  }`}
                                  placeholder="..."
                                />
                                {isCorrect && (
                                  <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -right-4 top-1 text-emerald-500"
                                  >
                                    <Check size={12} />
                                  </motion.div>
                                )}
                              </div>
                            );
                          }
                          return part;
                        })}
                      </div>
                    </div>
                  );
                }

                return <p key={pi} className="text-lg leading-relaxed opacity-80">{p}</p>;
              })}
              
              <div className="mt-12 p-6 bg-ink text-bg/10 rounded-none border border-ink/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-bg/10 rounded-full text-bg">
                    <Minus size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-bg mb-1">Paradoxical Em-Dash Phrases</h4>
                    <p className="text-[11px] font-sans opacity-60">Complete the statements that define the modern data literacy gap.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {article.gameType === 'paragraph-principles' && (
            <div className="space-y-16">
              <div className="border-b border-line pb-8 mb-8">
                <h2 className="text-2xl font-bold mb-4">{article.content.headline}</h2>
                <p className="text-lg opacity-80">{article.content.intro}</p>
              </div>

              {article.content.sections.map((section: any, idx: number) => {
                const val = gameState[idx] || '';
                const isCorrect = val.toLowerCase().trim() === section.answer.toLowerCase();
                
                return (
                  <div 
                    key={section.id} 
                    className={`flex flex-col md:flex-row items-stretch gap-6 ${section.alignment === 'right' ? 'md:flex-row-reverse' : ''}`}
                  >
                    <div className="flex-shrink-0 flex items-center justify-center">
                      <div className={`border p-2 w-[100px] transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,0.05)] ${
                        isCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-ink bg-white'
                      }`}>
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-[9px] font-sans font-bold uppercase tracking-wider ${isCorrect ? 'text-emerald-600' : 'opacity-60'}`}>
                            Term {idx + 1}:
                          </span>
                          <div className="relative">
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => {
                                const next = [...gameState];
                                next[idx] = e.target.value;
                                setGameState(next);
                              }}
                              className={`w-full bg-transparent border-b py-0.5 text-lg font-cursive focus:outline-none transition-colors ${
                                isCorrect ? 'border-emerald-500 text-emerald-700' : 'border-ink/20 focus:border-ink'
                              }`}
                              placeholder="..."
                            />
                            {isCorrect && (
                              <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -right-1.5 -top-1 text-emerald-500"
                              >
                                <Check size={10} strokeWidth={3} />
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:block w-[1px] bg-ink/10 relative">
                      <div className="absolute top-0 bottom-0 left-[-4px] right-[-4px] group">
                        <div className={`absolute inset-y-0 left-1/2 w-[1px] transition-colors ${
                          isCorrect ? 'bg-emerald-300' : 'bg-ink/10 group-hover:bg-ink/30'
                        }`} />
                      </div>
                    </div>
                    
                    <div className={`flex-grow ${section.alignment === 'right' ? 'md:text-right' : 'md:text-left'}`}>
                      <p className={`text-base md:text-lg leading-relaxed font-sans transition-colors ${
                        isCorrect ? 'text-emerald-900/80' : 'text-ink/90'
                      }`}>
                        {section.paragraph}
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="pt-12 border-t border-line mt-12 opacity-80">
                <p className="text-lg font-sans leading-relaxed">{article.content.conclusion}</p>
              </div>
            </div>
          )}

        </div>

        {!isCompleted && (
          <div className="mt-8 flex flex-col gap-3">
             <button
              onClick={submitAnswer}
              disabled={submissionStatus !== 'idle'}
              className={`w-full py-4 font-mono text-[11px] uppercase tracking-[0.3em] transition-all rounded-none relative overflow-hidden flex items-center justify-center gap-3 ${
                submissionStatus === 'correct' ? 'bg-emerald-500 text-white' : 
                submissionStatus === 'wrong' ? 'bg-red-500 text-white' : 
                submissionStatus === 'checking' ? 'bg-ink/10 text-ink animate-pulse' :
                'bg-ink text-bg hover:scale-[1.01] active:scale-[0.99] shadow-xl'
              }`}
            >
              {submissionStatus === 'checking' && <div className="w-3 h-3 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />}
              {submissionStatus === 'correct' && <Check size={14} />}
              {submissionStatus === 'wrong' && <AlertTriangle size={14} />}
              
              {submissionStatus === 'checking' ? 'Validating Retention...' : 
               submissionStatus === 'correct' ? 'Retention Secured' : 
               submissionStatus === 'wrong' ? 'Recall Mismatch' : 
               'File Weekly Answer'}

              {submissionStatus === 'idle' && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full duration-1000" />
              )}
            </button>
            <p className="text-[9px] font-mono uppercase text-center opacity-30 tracking-widest">
              Double check your work before filing.
            </p>
          </div>
        )}

        <div className="mt-16 pt-12 border-t border-line flex flex-col items-center gap-8 text-center">
          {isCompleted ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-ink text-bg rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Deep Dive Complete</h3>
                <p className="text-sm opacity-60 font-serif max-w-xs mx-auto">
                  Your progress has been saved. Return to the list to see your updated report card.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {hasPrev && (
                   <button
                     onClick={onPrev}
                     className="border border-line hover:border-ink px-4 py-3 rounded-none font-mono text-[9px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                   >
                     <ArrowLeft size={14} /> Prev Article
                   </button>
                 )}
                 <button
                   onClick={onBack}
                   className="bg-ink text-bg px-6 py-3 rounded-none font-mono text-[9px] uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
                 >
                   <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
                   Back to Edition
                 </button>
                 {hasNext && (
                   <button
                     onClick={onNext}
                     className="bg-ink text-bg px-4 py-3 rounded-none font-mono text-[9px] uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
                   >
                     Next Article
                     <ArrowLeft size={14} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                   </button>
                 )}
               </div>
               <div className="flex justify-center">
                 <button
                   onClick={onPitch}
                   className="border border-line hover:border-ink px-6 py-3 rounded-none font-mono text-[9px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                 >
                   <Sparkles size={14} /> Pitch Context
                 </button>
               </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap justify-center gap-3">
                {hasPrev && (
                  <button
                    onClick={onPrev}
                    className="flex items-center gap-2 bg-ink/5 hover:bg-ink hover:text-bg px-4 py-3 rounded-none border border-transparent hover:border-ink font-mono text-[9px] uppercase tracking-widest transition-all group"
                  >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
                    Previous
                  </button>
                )}
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 bg-ink/5 hover:bg-ink hover:text-bg px-6 py-3 rounded-none border border-transparent hover:border-ink font-mono text-[9px] uppercase tracking-widest transition-all group"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
                  Back to Publication
                </button>
                {hasNext && (
                  <button
                    onClick={onNext}
                    className="flex items-center gap-2 bg-ink/5 hover:bg-ink hover:text-bg px-4 py-3 rounded-none border border-transparent hover:border-ink font-mono text-[9px] uppercase tracking-widest transition-all group"
                  >
                    Next 
                    <ArrowLeft size={14} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>

              <div className="w-full max-w-sm bg-ink/5 rounded-none p-6 text-center border border-line/5">
                <p className="text-xs opacity-60 font-serif mb-4">
                  Have a story like this? We're always looking for new voices.
                </p>
                <button 
                  onClick={onPitch}
                  className="bg-ink text-bg px-6 py-2 rounded-lg font-mono text-[9px] uppercase tracking-widest hover:opacity-90 transition-all inline-flex items-center gap-2"
                >
                  <Sparkles size={12} /> Pitch Your Idea
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Live Answer Sheet Overlay */}
      <AnimatePresence>
        {showAnswerSheet && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAnswerSheet(false)}
              className="fixed inset-0 bg-ink/10 backdrop-blur-[2px] z-[70] md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-full max-w-xs bg-white border-l border-line shadow-2xl z-[80] p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="font-mono text-xs uppercase tracking-widest font-bold">Answer Sheet</h2>
                <button onClick={() => setShowAnswerSheet(false)} className="p-1 hover:bg-ink/5"><X size={16} /></button>
              </div>
              
              <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-8">
                <div className="border-l border-ink/10 pl-4 py-2">
                  <p className="micro-label opacity-40 mb-1">Article</p>
                  <p className="text-sm font-bold tracking-tight">{article.title}</p>
                </div>
                
                <div className="space-y-4">
                  <p className="micro-label opacity-40">Your Draft</p>
                  <div className="bg-ink/[0.02] p-4 font-mono text-[10px] leading-relaxed border border-line/10 min-h-[100px] whitespace-pre-wrap">
                    {(() => {
                      if (!gameState) return "Awaiting input...";
                      if (article.gameType === 'fill-blanks') return gameState.map((v: string) => v || '____').join(' • ');
                      if (article.gameType === 'rearrange') return "Sequence: " + gameState.map((p: any) => p.id).join(' → ');
                      if (article.gameType === 'double-click') return gameState.isFixed ? "Term Fixed" : "Pending Fix";
                      if (article.gameType === 'anagrams') return gameState.map((v: string) => v || '____').join(' • ');
                      if (article.gameType === 'tangential-points') return gameState.join(' → ');
                      if (article.gameType === 'paragraph-principles') return gameState.map((v: string) => v || '____').join(' • ');
                      if (typeof gameState === 'string') return gameState || "____";
                      return JSON.stringify(gameState);
                    })()}
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-none border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={10} className="text-emerald-500" />
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-700">Status</span>
                  </div>
                  <p className="text-[11px] font-sans text-emerald-900 leading-relaxed italic">
                    {isCompleted ? "Filed and secured in your weekly report card." : "Active draft. Answers are not final until filed."}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-line">
                <button 
                  onClick={() => setShowAnswerSheet(false)}
                  className="w-full bg-ink text-bg py-3 font-mono text-[10px] uppercase tracking-widest hover:opacity-95"
                >
                  Continue Reading
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

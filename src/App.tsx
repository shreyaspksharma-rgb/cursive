/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WelcomeModal } from './components/WelcomeModal';
import { AuthModal } from './components/AuthModal';
import { PitchModal } from './components/PitchModal';
import { ErrorReportModal } from './components/ErrorReportModal';
import { ArticleCard } from './components/ArticleCard';
import { GameView } from './components/GameView';
import { ARTICLES } from './constants';
import { Mail, Sparkles, Search, X, LogOut, User, LogIn, Send, Clock, Trash2, Share2, Check, AlertTriangle, Layout } from 'lucide-react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: number, title: string } | null>(null);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState<number | null>(null);
  const [completedGames, setCompletedGames] = useState<number[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
  const [mistakes, setMistakes] = useState<Record<number, number>>({});
  const [showEmailer, setShowEmailer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem('cursive_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load recent searches", e);
      }
    }
  }, []);

  // Save recent searches when updated
  useEffect(() => {
    if (recentSearches.length > 0) {
      localStorage.setItem('cursive_recent_searches', JSON.stringify(recentSearches));
    }
  }, [recentSearches]);

  // Handle click outside search suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addToRecentSearches = (query: string) => {
    if (!query.trim()) return;
    const trimmedQuery = query.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== trimmedQuery);
      return [trimmedQuery, ...filtered].slice(0, 5);
    });
  };

  const removeRecentSearch = (query: string) => {
    setRecentSearches(prev => prev.filter(s => s !== query));
  };

  // Handle URL parameters for sharing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('article');
    if (articleId) {
      const id = parseInt(articleId);
      if (ARTICLES.some(a => a.id === id)) {
        setCurrentArticleId(id);
      }
    }
  }, []);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Load progress (Firestore or LocalStorage)
  useEffect(() => {
    if (!isAuthReady) return;

    // One-time hard reset for v2.1 update
    const CURRENT_PROJECT_VERSION = '2.1';
    const savedVersion = localStorage.getItem('cursive_project_version');
    
    if (savedVersion !== CURRENT_PROJECT_VERSION) {
      handleResetProgress();
      localStorage.setItem('cursive_project_version', CURRENT_PROJECT_VERSION);
      return;
    }

    if (user) {
      // Load from Firestore
      const progressRef = doc(db, 'progress', user.uid);
      const unsubscribe = onSnapshot(progressRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.completedGames) setCompletedGames(data.completedGames);
          if (data.userAnswers) setUserAnswers(data.userAnswers);
          if (data.mistakes) setMistakes(data.mistakes);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `progress/${user.uid}`);
      });

      // Load profile (welcome state)
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          setHasSeenWelcome(snapshot.data().hasSeenWelcome || false);
        }
      }).catch(error => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      });

      return () => unsubscribe();
    } else {
      // Load from LocalStorage for anonymous users
      const savedProgress = localStorage.getItem('cursive_progress');
      if (savedProgress) {
        try {
          const { completed, answers, userMistakes } = JSON.parse(savedProgress);
          if (completed) setCompletedGames(completed);
          if (answers) setUserAnswers(answers);
          if (userMistakes) setMistakes(userMistakes);
        } catch (e) {
          console.error("Failed to load progress", e);
        }
      }
    }
  }, [user, isAuthReady]);

  // Save progress whenever it changes
  useEffect(() => {
    if (!isAuthReady) return;

    if (user) {
      // Save to Firestore
      const progressRef = doc(db, 'progress', user.uid);
      setDoc(progressRef, {
        uid: user.uid,
        completedGames,
        userAnswers,
        mistakes,
        updatedAt: serverTimestamp()
      }).catch(error => { // Remove merge: true to avoid merging old state if we intended to clear
        handleFirestoreError(error, OperationType.WRITE, `progress/${user.uid}`);
      });
    } else {
      // Save to LocalStorage for anonymous users
      localStorage.setItem('cursive_progress', JSON.stringify({
        completed: completedGames,
        answers: userAnswers,
        userMistakes: mistakes
      }));
    }
  }, [completedGames, userAnswers, mistakes, user, isAuthReady]);

  const handleCloseWelcome = async () => {
    setHasSeenWelcome(true);
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        hasSeenWelcome: true,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(error => {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCompletedGames([]);
      setUserAnswers({});
      setMistakes({});
      localStorage.removeItem('cursive_progress');
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const handleResetProgress = async () => {
    setCompletedGames([]);
    setUserAnswers({});
    setMistakes({});
    localStorage.removeItem('cursive_progress');
    // Ensure all state is truly zeroed
    setCurrentArticleId(null);
    setShowEmailer(false);
    
    if (user) {
      const progressRef = doc(db, 'progress', user.uid);
      await setDoc(progressRef, {
        uid: user.uid,
        completedGames: [],
        userAnswers: {},
        mistakes: {},
        updatedAt: serverTimestamp()
      }); // Remove merge: true to force clean state
    }
  };

  const getTotalMistakes = () => {
    return Object.entries(mistakes)
      .filter(([id]) => completedGames.includes(Number(id)))
      .reduce((acc, [_, val]) => acc + (val as number), 0);
  };
  const TARGET_COMPLETION = 6;
  const handleCompleteGame = (id: number, answer: any) => {
    if (!completedGames.includes(id)) {
      const next = [...completedGames, id];
      setCompletedGames(next);
      setUserAnswers(prev => ({ ...prev, [id]: answer }));
      
      if (next.length >= TARGET_COMPLETION) {
        setShowEmailer(true);
      }
    }
  };

  const handleMistake = (id: number) => {
    setMistakes(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return ARTICLES;
    const query = searchQuery.toLowerCase().trim();
    return ARTICLES.filter(article => 
      article.title.toLowerCase().includes(query) || 
      article.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleShareArticle = async (id: number) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?article=${id}&puzzle=true`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy share link', err);
    }
  };

  const isAllCompleted = completedGames.length >= TARGET_COMPLETION;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <WelcomeModal isOpen={!hasSeenWelcome} onClose={handleCloseWelcome} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <PitchModal isOpen={showPitchModal} onClose={() => setShowPitchModal(false)} user={user} />
      <ErrorReportModal 
        isOpen={!!reportTarget} 
        onClose={() => setReportTarget(null)} 
        user={user}
        articleId={reportTarget?.id ?? null}
        articleTitle={reportTarget?.title}
      />

      {/* Header */}
      <header className="py-2 text-center border-b border-line sticky top-0 bg-white z-40">
        <div 
          className="cursor-pointer inline-block mb-2"
          onClick={() => {
            setCurrentArticleId(null);
            setShowEmailer(false);
            setSearchQuery("");
          }}
        >
          <h1 className="text-2xl font-bold tracking-tighter">cursive.</h1>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-64" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={14} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onFocus={() => setShowSearchSuggestions(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addToRecentSearches(searchQuery);
                  setShowSearchSuggestions(false);
                }
              }}
              className="w-full bg-ink/5 border border-line/10 pl-9 pr-9 py-1.5 rounded-full text-xs focus:outline-none focus:border-ink/30 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchSuggestions(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100"
              >
                <X size={14} />
              </button>
            )}

            {/* Recent Searches Dropdown */}
            <AnimatePresence>
              {showSearchSuggestions && recentSearches.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-line rounded-none shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-2">
                    <div className="flex items-center justify-between px-3 py-1 mb-1">
                      <span className="micro-label opacity-40">Recent Searches</span>
                      <button 
                        onClick={() => {
                          setRecentSearches([]);
                          localStorage.removeItem('cursive_recent_searches');
                        }}
                        className="text-[9px] uppercase tracking-widest hover:text-red-500 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                    {recentSearches.map((query, index) => (
                      <div 
                        key={index}
                        className="group flex items-center justify-between px-3 py-2 hover:bg-ink/5 rounded-none cursor-pointer transition-colors"
                        onClick={() => {
                          setSearchQuery(query);
                          setShowSearchSuggestions(false);
                          addToRecentSearches(query);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="opacity-20 group-hover:opacity-100 transition-opacity" size={12} />
                          <span className="text-xs font-medium">{query}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(query);
                          }}
                          className="opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-4">
            <div className="micro-label">
              Progress: {Math.min(completedGames.length, TARGET_COMPLETION)}/{TARGET_COMPLETION}
            </div>
            {user ? (
              <div className="flex items-center gap-3 bg-ink/5 px-3 py-1.5 rounded-full">
                <div className="w-5 h-5 bg-ink rounded-full flex items-center justify-center">
                  <User size={10} className="text-white" />
                </div>
                <span className="text-[10px] font-bold tracking-tight hidden sm:inline">{user.displayName || user.email}</span>
                <button 
                  onClick={handleSignOut}
                  className="opacity-40 hover:opacity-100 transition-opacity"
                  title="Sign Out"
                >
                  <LogOut size={12} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-ink text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
        
        {/* Visual Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-line/10">
          <motion.div 
            className="h-full bg-ink"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (completedGames.length / TARGET_COMPLETION) * 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </header>

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentArticleId ? (
            <GameView
              key="game"
              article={ARTICLES.find(a => a.id === currentArticleId)!}
              onBack={() => setCurrentArticleId(null)}
              onComplete={(answer) => handleCompleteGame(currentArticleId, answer)}
              onMistake={() => handleMistake(currentArticleId)}
              onPitch={() => setShowPitchModal(true)}
              onReportError={() => {
                const art = ARTICLES.find(a => a.id === currentArticleId);
                if (art) setReportTarget({ id: art.id, title: art.title });
              }}
              isCompleted={completedGames.includes(currentArticleId)}
              onPrev={() => {
                const currentIndex = ARTICLES.findIndex(a => a.id === currentArticleId);
                if (currentIndex > 0) {
                  setCurrentArticleId(ARTICLES[currentIndex - 1].id);
                }
              }}
              onNext={() => {
                const currentIndex = ARTICLES.findIndex(a => a.id === currentArticleId);
                if (currentIndex < ARTICLES.length - 1) {
                  setCurrentArticleId(ARTICLES[currentIndex + 1].id);
                }
              }}
              hasPrev={ARTICLES.findIndex(a => a.id === currentArticleId) > 0}
              hasNext={ARTICLES.findIndex(a => a.id === currentArticleId) < ARTICLES.length - 1}
              initialAnswer={userAnswers[currentArticleId]}
            />
          ) : (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 py-2"
            >
              {/* Hero / Featured Intro */}
              {!searchQuery && (
                <section className="mb-1">
                  <div className="flex flex-col md:flex-row justify-between items-end mb-1 gap-4">
                    <div className="max-w-2xl">
                      <h2 className="text-5xl md:text-8xl font-bold tracking-tighter mb-1 leading-[0.85]">
                        Weekly <span className="italic">Read.</span>
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <p className="text-lg opacity-60 font-serif leading-relaxed">
                          Nine interactive stories. Nine unique puzzles. 
                          A structured sense of journalism for the modern era.
                          We believe that news should not just be consumed, but experienced.
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm opacity-40 font-sans leading-relaxed">
                            In this edition, we explore the intersection of technology and human emotion. 
                            Each piece is designed to challenge your perception and reward your curiosity.
                          </p>
                          <div className="flex gap-4">
                            <div className="h-[1px] bg-ink/20 flex-grow mt-3" />
                            <span className="micro-label whitespace-nowrap">Scroll to explore</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="micro-label pb-1 hidden md:block">
                      Edition #01 — Feb 2026
                    </div>
                  </div>
                </section>
              )}

              {searchQuery && (
                <section className="mb-8">
                  <h2 className="text-2xl font-bold tracking-tight mb-2">
                    Search results for "{searchQuery}"
                  </h2>
                  <p className="micro-label opacity-40">
                    Found {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
                  </p>
                </section>
              )}

              <div className="horizontal-line !my-1" />

              {/* Hierarchical Layout: 1 (Big) -> 2 (Medium) -> 3 (Small) */}
              
              {filteredArticles.length > 0 ? (
                <>
                  {/* Big Feature - 1 column, full width landscape */}
                  {(() => {
                    const featureArticle = filteredArticles.filter(a => ![7, 8, 9, 10].includes(a.id))[0];
                    if (featureArticle) {
                      return (
                        <section className="mb-2">
                          <ArticleCard
                            article={featureArticle}
                            isCompleted={completedGames.includes(featureArticle.id)}
                            onClick={() => setCurrentArticleId(featureArticle.id)}
                            aspectRatio="aspect-[16/9] md:aspect-[21/9]"
                          />
                        </section>
                      );
                    }
                    return null;
                  })()}

                  {/* Horizontal Gamified Article (ID 7) - Below Feature */}
                  {(() => {
                    const tangentialArticle = filteredArticles.find(a => a.id === 7);
                    if (tangentialArticle) {
                      return (
                        <section className="mb-12">
                          <div className="horizontal-line !my-8" />
                          <div className="mb-6 md:mb-8 lg:mb-10 text-center md:text-left">
                            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight mb-2 md:mb-3 uppercase font-mono">Special Coverage: Market Dynamics</h2>
                            <p className="text-xs md:text-sm lg:text-base opacity-60 max-w-xl md:max-w-4xl lg:max-w-none font-sans mx-auto md:mx-0 leading-relaxed">
                              An in-depth look at how geopolitical shifts impact the flows of global energy and trade. 
                              Complete this special edition puzzle to unlock one of your {TARGET_COMPLETION} required articles for the weekly report card.
                            </p>
                          </div>
                          <ArticleCard
                            article={tangentialArticle}
                            isCompleted={completedGames.includes(tangentialArticle.id)}
                            onClick={() => setCurrentArticleId(tangentialArticle.id)}
                            showShare={false}
                          />
                          <div className="horizontal-line !my-8" />
                        </section>
                      );
                    }
                    return null;
                  })()}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-2">
                    <div className="lg:col-span-8">
                      <div className="horizontal-line !mt-0 !mb-8" />
                      {/* Medium Grid - 2 columns */}
                      <section className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                        {filteredArticles
                          .filter(a => ![7, 8, 9, 10].includes(a.id)) // Exclude belt articles
                          .slice(1, 3)
                          .map((article) => (
                            <ArticleCard
                              key={article.id}
                              article={article}
                              isCompleted={completedGames.includes(article.id)}
                              onClick={() => setCurrentArticleId(article.id)}
                              showShare={false}
                            />
                          ))}
                      </section>
                    </div>
                    <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-line/20 pt-6 lg:pt-0 lg:pl-6">
                      <div className="sticky top-24">
                        <p className="micro-label mb-1">Editor's Note</p>
                        <h3 className="text-2xl font-serif italic mb-1">"The medium is the message, but the interaction is the meaning."</h3>
                        <p className="text-sm opacity-60 leading-relaxed mb-2">
                          Welcome to the first edition of Cursive. Our goal is to bridge the gap between static reporting and active engagement. 
                          By turning each story into a puzzle, we invite you to look closer, think deeper, and remember longer.
                        </p>
                        <div className="space-y-1">
                          <p className="text-xs font-bold uppercase tracking-widest">Contributors</p>
                          <p className="text-xs opacity-40">The Brewhouse News</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="horizontal-line !my-4" />

                  {/* Horizontal Compounding Effects Article (ID 8) - Belt Layout */}
                  {(() => {
                    const compoundingArticle = filteredArticles.find(a => a.id === 8);
                    if (compoundingArticle) {
                      return (
                        <section className="mb-0">
                          <ArticleCard
                            article={compoundingArticle}
                            isCompleted={completedGames.includes(compoundingArticle.id)}
                            onClick={() => setCurrentArticleId(compoundingArticle.id)}
                            aspectRatio="aspect-[16/9] md:aspect-[21/8]"
                            showShare={false}
                          />
                          <div className="horizontal-line !my-8" />
                        </section>
                      );
                    }
                    return null;
                  })()}

                  {/* Horizontal Em-Dash Phrases Article (ID 9) - Belt Layout */}
                  {(() => {
                    const emDashArticle = filteredArticles.find(a => a.id === 9);
                    if (emDashArticle) {
                      return (
                        <section className="mb-2">
                          <ArticleCard
                            article={emDashArticle}
                            isCompleted={completedGames.includes(emDashArticle.id)}
                            onClick={() => setCurrentArticleId(emDashArticle.id)}
                            showImage={false}
                            showShare={false}
                          />
                          <div className="horizontal-line !my-1" />
                        </section>
                      );
                    }
                    return null;
                  })()}

                  {/* Small Grid - 3 columns */}
                  <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    {filteredArticles
                      .filter(a => ![7, 8, 9, 10].includes(a.id)) // Exclude belt articles
                      .slice(3)
                      .map((article) => (
                        <ArticleCard
                          key={article.id}
                          article={article}
                          isCompleted={completedGames.includes(article.id)}
                          onClick={() => setCurrentArticleId(article.id)}
                        />
                      ))}
                  </section>
                  
                  {/* Horizontal Paragraph Principles Article (ID 10) - Belt Layout at bottom */}
                  {(() => {
                    const paragraphPrinciplesArticle = filteredArticles.find(a => a.id === 10);
                    if (paragraphPrinciplesArticle) {
                      return (
                        <section className="mb-12">
                          <ArticleCard
                            article={paragraphPrinciplesArticle}
                            isCompleted={completedGames.includes(paragraphPrinciplesArticle.id)}
                            onClick={() => setCurrentArticleId(paragraphPrinciplesArticle.id)}
                            aspectRatio="aspect-[16/9] md:aspect-[21/8]"
                            showShare={false}
                          />
                          <div className="horizontal-line !my-8" />
                        </section>
                      );
                    }
                    return null;
                  })()}
                </>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-xl opacity-40 font-serif italic">No articles found matching your search.</p>
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="mt-4 micro-label hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              )}

              {isAllCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 pt-4 text-center"
                >
                  <div className="relative overflow-hidden rounded-none group cursor-pointer" onClick={() => setShowEmailer(true)}>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-90 group-hover:scale-110 transition-transform duration-700" />
                    <div className="relative py-16 px-8 flex flex-col items-center justify-center gap-6">
                      <h3 className="text-4xl font-bold text-white tracking-tighter text-center">
                        {completedGames.length < TARGET_COMPLETION 
                          ? `Finish ${TARGET_COMPLETION - completedGames.length} more to unlock report card`
                          : "Your weekly report card is ready"}
                      </h3>
                      <div className="flex items-center gap-4 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-white font-mono text-xs uppercase tracking-widest">
                        <Mail size={16} /> {completedGames.length >= TARGET_COMPLETION ? 'View Full Insights' : `${completedGames.length}/${TARGET_COMPLETION} Completed`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-center">
                    <a 
                      href="https://wa.me/yournumber" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-[#25D366] text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-lg"
                    >
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                      Chat on WhatsApp
                    </a>
                  </div>
                </motion.div>
              )}

              {/* Pitch CTA Section */}
              {!searchQuery && (
                <section className="mt-12 mb-4">
                  <div className="relative overflow-hidden rounded-none bg-ink text-bg p-8 md:p-10 text-center">
                    <div className="relative z-10 max-w-2xl mx-auto">
                      <h2 className="text-2xl md:text-3xl font-bold tracking-tighter mb-3 leading-tight">
                        Your story belongs <span className="italic font-serif">in cursive.</span>
                      </h2>
                      <p className="text-sm md:text-base opacity-60 font-serif mb-6 leading-relaxed">
                        Redefine how news is experienced. Pitch your interactive story idea.
                      </p>
                      <button 
                        onClick={() => setShowPitchModal(true)}
                        className="bg-white text-ink px-6 py-2.5 rounded-none font-mono text-[10px] uppercase tracking-[0.2em] font-bold hover:scale-105 transition-all shadow-lg flex items-center gap-2 mx-auto"
                      >
                        <Send size={14} /> Pitch Your Story
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Progress Widget (Mobile/Desktop) */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[60]"
      >
        <motion.div 
          layout
          className="bg-white/40 backdrop-blur-xl border border-line p-2.5 md:p-3 shadow-2xl rounded-2xl w-40 md:w-52 group cursor-pointer overflow-hidden transform-gpu"
          onClick={() => setShowEmailer(true)}
          whileHover={{ y: -4, scale: 1.02 }}
        >
          <div className="flex justify-between items-end mb-2 md:mb-3">
            <div>
              <p className="micro-label !opacity-100 text-ink/80 !text-[8px] md:!text-[9px] mb-0.5">Edition Progress</p>
              <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 font-bold">Vol 1.1</p>
            </div>
            <p className="text-sm md:text-base font-bold tracking-tight text-ink leading-none">
              {Math.min(completedGames.length, TARGET_COMPLETION)}<span className="opacity-10 text-[10px]">/</span>{TARGET_COMPLETION}
            </p>
          </div>
          
          <div className="h-1.5 w-full bg-ink/5 rounded-full overflow-hidden mb-3">
            <motion.div 
              className="h-full bg-ink"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (completedGames.length / TARGET_COMPLETION) * 100)}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
            />
          </div>

          <AnimatePresence>
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="space-y-2 overflow-hidden"
            >
              <div className="flex justify-between items-center text-[9px] font-mono tracking-widest uppercase">
                <span className="opacity-40">Mismatches:</span>
                <span className={getTotalMistakes() > 0 ? "text-red-500 font-bold" : "text-emerald-500"}>{getTotalMistakes()}</span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-mono tracking-widest uppercase">
                <span className="opacity-40">Status:</span>
                <span className="text-ink font-bold">{isAllCompleted ? "Certified" : "Ongoing"}</span>
              </div>
              
              <div className="pt-2 mt-2 border-t border-line/10 flex items-center justify-center gap-2 group-hover:bg-ink group-hover:text-bg py-2 transition-colors">
                <Layout size={10} />
                <span className="text-[8px] font-mono uppercase tracking-[0.2em] font-bold">Open Ledger</span>
              </div>
            </motion.div>
          </AnimatePresence>

          {!user && (
            <div className="absolute top-3 right-3">
              <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.4)]" title="Progress saved locally" />
            </div>
          )}
        </motion.div>
      </motion.div>

      <footer className="border-t border-line bg-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-4">
            <div className="lg:col-span-2">
              <h4 className="text-3xl font-serif font-bold italic mb-4">cursive.</h4>
              <p className="text-lg opacity-60 max-w-md mb-4">
                A structured sense of journalism where news becomes a language to express. 
                Your progress is saved locally. Sign in for cross-device synchronization.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-none flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-emerald-900">Synced to {user.displayName || user.email}</span>
                      </div>
                      <button 
                        onClick={handleSignOut}
                        className="text-[10px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                      >
                        Sign Out
                      </button>
                    </div>
                    <p className="text-xs opacity-40 italic">Your progress is secured and synced to your account.</p>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="bg-ink text-bg px-8 py-3 rounded-none font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity whitespace-nowrap flex items-center gap-2"
                  >
                    <LogIn size={14} /> Backup progress to account
                  </button>
                )}
              </div>
            </div>
            <div>
              <p className="micro-label mb-4">Account</p>
              <ul className="space-y-2 font-sans text-sm">
                <li><button onClick={() => setShowEmailer(true)} className="hover:underline text-left">Review Answers</button></li>
                <li><button onClick={() => setShowPitchModal(true)} className="hover:underline text-left">Pitch a Story</button></li>
                <li><button onClick={handleResetProgress} className="hover:underline text-left flex items-center gap-2 text-ink/40 hover:text-red-500 transition-colors">
                  <Trash2 size={12} /> Reset Progress
                </button></li>
              </ul>
            </div>
            <div>
              <p className="micro-label mb-4">Connect</p>
              <ul className="space-y-2 font-sans text-sm">
                <li><a href="#" className="hover:underline">Twitter / X</a></li>
                <li><a href="#" className="hover:underline">Instagram</a></li>
                <li><a href="#" className="hover:underline">LinkedIn</a></li>
                <li><a href="#" className="hover:underline">Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-4 border-t border-line/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs font-mono opacity-40 uppercase tracking-widest">© 2026 Cursive Publication — All Rights Reserved</p>
            <div className="flex gap-8 font-mono text-[10px] uppercase tracking-widest opacity-50">
              <span>Built for the curious</span>
              <span>Edition #01</span>
            </div>
          </div>
        </div>
      </footer>
      <AnimatePresence>
        {showEmailer && (
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
              className="bg-white border border-line p-8 md:p-12 shadow-2xl relative rounded-none max-w-3xl w-full my-8"
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-ink text-bg p-4 rounded-none shadow-xl border-4 border-white">
                <div className="text-center">
                  <p className="font-mono text-[10px] uppercase tracking-tighter leading-none mb-1 opacity-60">Grade</p>
                  <p className="font-bold text-xl leading-none">
                    {(() => {
                      const totalMistakes = getTotalMistakes();
                      if (totalMistakes === 0) return 'A+';
                      if (totalMistakes < 3) return 'A';
                      if (totalMistakes < 7) return 'B';
                      return 'C';
                    })()}
                  </p>
                </div>
              </div>
              <header className="mb-12 border-b-4 border-double border-line pb-8 text-center relative">
                <div className="absolute top-0 right-0 p-2 opacity-20 hover:opacity-100 transition-opacity">
                  <Mail size={16} />
                </div>
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-ink text-bg text-[10px] font-mono uppercase tracking-[0.3em]">
                  <Check size={12} /> Verification Secured
                </div>
                <p className="micro-label mb-2 text-ink/40 tracking-[0.4em]">Official Transcript</p>
                <h2 className="text-5xl font-bold font-serif italic tracking-tighter mb-2">Weekly Read Ledger</h2>
                <div className="flex justify-center gap-6 text-[10px] font-mono uppercase tracking-widest opacity-60">
                  <div className="flex flex-col">
                    <span className="opacity-40">Volume</span>
                    <span>No. 01</span>
                  </div>
                  <div className="w-[1px] bg-line/20" />
                  <div className="flex flex-col">
                    <span className="opacity-40">Issued to</span>
                    <span>{user ? (user.displayName || user.email) : 'Anonymous Reader'}</span>
                  </div>
                  <div className="w-[1px] bg-line/20" />
                  <div className="flex flex-col">
                    <span className="opacity-40">Date Filed</span>
                    <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </header>
              
              <div className="grid grid-cols-3 md:grid-cols-9 gap-2 mb-12 border-b border-line pb-12">
                {ARTICLES.map((art) => {
                  const isComp = completedGames.includes(art.id);
                  return (
                    <div 
                      key={art.id} 
                      className={`aspect-square border flex flex-col items-center justify-center gap-1 transition-all ${
                        isComp ? 'bg-emerald-50 border-emerald-500' : 'bg-ink/[0.02] border-dashed border-line/20 opacity-30'
                      }`}
                      title={art.title}
                    >
                      <span className="font-mono text-[8px] opacity-40">{art.id.toString().padStart(2, '0')}</span>
                      {isComp ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500">
                          <Check size={16} strokeWidth={3} />
                        </motion.div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-ink/10" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-12 font-serif text-lg leading-relaxed">
                <div className="p-8 bg-[#fdfaf6] border border-[#e5e7eb] relative overflow-hidden mb-12 shadow-inner">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-ink/[0.03] -mr-8 -mt-8 rotate-12" />
                  <div className="relative z-10">
                    <p className="mb-6 first-letter:text-5xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-ink/80 prose-lg">
                      {completedGames.length === 0 
                        ? "The ledger remains blank, awaiting your cognitive engagement. Once you fulfill the weekly reading requirements, your insights and the editorial key will be documented here for permanent reference."
                        : completedGames.length < TARGET_COMPLETION
                        ? `A partial transcript has been generated. You have secured ${completedGames.length} of the ${TARGET_COMPLETION} required articles. Fulfill the remaining reading requirements to finalize the report.`
                        : "Your cognitive engagement for this edition has been verified. This ledger documents the synthesis between your retention and the collective insight of our editorial room."
                      }
                    </p>
                    {completedGames.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-line/10">
                        <div className="text-left">
                          <p className="micro-label opacity-40 mb-1 tracking-widest text-[9px]">Credits Earned</p>
                          <p className="font-mono text-xl font-bold flex items-baseline gap-1">
                            {completedGames.length} <span className="text-[10px] opacity-40">PTS</span>
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="micro-label opacity-40 mb-1 tracking-widest text-[9px]">Recall Precision</p>
                          <p className={`font-mono text-xl font-bold ${getTotalMistakes() > 5 ? 'text-red-500' : 'text-ink'}`}>
                            {Math.max(0, 100 - (getTotalMistakes() * 5))}%
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="micro-label opacity-40 mb-1 tracking-widest text-[9px]">Save Status</p>
                          <p className="font-mono text-sm font-bold uppercase tracking-tight">
                            {user ? 'Cloud Sync' : 'Local Draft'}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="micro-label opacity-40 mb-1 tracking-widest text-[9px]">Archive ID</p>
                          <p className="font-mono text-[10px] break-all opacity-40">{user ? user.uid.slice(0, 8) : 'ANON-REC'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-16 py-8 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                  {completedGames.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-line/10 rounded-none opacity-40 flex flex-col items-center">
                      <Clock className="mb-4" size={32} />
                      <p className="font-mono text-xs uppercase tracking-[0.3em]">Awaiting Progress Filing</p>
                      <p className="max-w-xs text-sm mt-2 opacity-60">Complete your first article to see the transformation of your answers into insights.</p>
                    </div>
                  ) : (
                    ARTICLES.filter(a => completedGames.includes(a.id)).map((article) => (
                    <div key={article.id} className="group/article border-l border-ink/10 pl-8 relative">
                      <div className="absolute top-0 left-[-4px] w-2 h-2 bg-ink rounded-full" />
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 border border-ink/10 bg-white flex items-center justify-center rounded-none font-mono text-sm group-hover/article:border-ink/40 transition-colors">
                            {(article.id).toString().padStart(2, '0')}
                          </div>
                          <div>
                            <h3 className="font-bold text-xl font-sans tracking-tight leading-none mb-2">{article.title}</h3>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  setCurrentArticleId(article.id);
                                  setShowEmailer(false);
                                }}
                                className="text-[9px] font-mono uppercase tracking-[0.2em] text-ink/40 hover:text-ink flex items-center gap-1 transition-colors"
                              >
                                Review Article <Sparkles size={8} />
                              </button>
                              <span className="text-ink/10">•</span>
                              <button
                                onClick={() => handleShareArticle(article.id)}
                                className={`text-[9px] font-mono uppercase tracking-[0.2em] flex items-center gap-1 transition-all ${copiedId === article.id ? 'text-emerald-500 font-bold' : 'text-ink/40 hover:text-ink'}`}
                              >
                                {copiedId === article.id ? 'Link Copied' : 'Share Link'} <Share2 size={8} />
                              </button>
                              <span className="text-ink/10">•</span>
                              <button
                                onClick={() => setReportTarget({ id: article.id, title: article.title })}
                                className="text-[9px] font-mono uppercase tracking-[0.2em] text-ink/40 hover:text-red-500 flex items-center gap-1 transition-colors"
                              >
                                File Issue <AlertTriangle size={8} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-[9px] font-mono uppercase tracking-widest opacity-40">Mismatches</p>
                            <p className={`font-mono text-lg font-bold ${mistakes[article.id] > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{mistakes[article.id] || 0}</p>
                          </div>
                          {(() => {
                            const ans = userAnswers[article.id];
                            const isCorrect = (() => {
                              if (!ans) return false;
                              if (article.gameType === 'fill-blanks' || article.gameType === 'em-dash-phrases') return ans.every((v: string, i: number) => v.toLowerCase().trim() === article.content.answers[i].toLowerCase());
                              if (article.gameType === 'paragraph-principles') return ans.every((v: string, i: number) => v.toLowerCase().trim() === article.content.sections[i].answer.toLowerCase());
                              if (article.gameType === 'rearrange') return ans.every((p: any, i: number) => p.id === article.content.correctOrder[i]);
                              if (article.gameType === 'double-click') return ans.isFixed;
                              if (article.gameType === 'poetic-fill' || article.gameType === 'type-answer' || article.gameType === 'compounding-effects') return ans.toLowerCase().trim() === article.content.answer.toLowerCase();
                              if (article.gameType === 'anagrams') return ans.every((v: string, i: number) => v.toLowerCase().trim() === article.content.answers[i].toLowerCase());
                              if (article.gameType === 'tangential-points') {
                                const currentIndices = ans.map((f: string) => article.content.fragments.indexOf(f));
                                return currentIndices.every((val: number, i: number) => val === article.content.correctOrder[i]);
                              }
                              return false;
                            })();

                            return (
                              <div className={`p-1.5 border flex items-center justify-center transition-colors ${
                                isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'bg-red-50 text-red-700 border-red-500'
                              }`}>
                                {isCorrect ? <Check size={14} strokeWidth={3} /> : <AlertTriangle size={14} strokeWidth={3} />}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line/10 mb-6 border border-line/10">
                        <div className="p-6 bg-white group-hover/article:bg-ink/[0.01] transition-colors">
                          <p className="micro-label opacity-40 mb-3 tracking-widest text-[8px]">Personal Retraction</p>
                          <div className="font-mono text-xs leading-relaxed break-words text-ink/80 italic">
                            {(() => {
                              const ans = userAnswers[article.id];
                              if (!ans) return "(Null)";
                              if (article.gameType === 'fill-blanks') return ans.join(' • ');
                              if (article.gameType === 'rearrange') return "Paragraph Sequence Locked";
                              if (article.gameType === 'double-click') return ans.isFixed ? "Term Corrected" : "Incomplete";
                              if (article.gameType === 'poetic-fill' || article.gameType === 'type-answer' || article.gameType === 'compounding-effects') return ans;
                              if (article.gameType === 'em-dash-phrases') return ans?.join(' • ');
                              if (article.gameType === 'paragraph-principles') return ans?.join(' • ');
                              if (article.gameType === 'anagrams') return ans.join(' • ');
                              if (article.gameType === 'tangential-points') return ans.join(' → ');
                              return "Data Filed 1.0";
                            })()}
                          </div>
                        </div>
                        <div className="p-6 bg-ink/5 group-hover/article:bg-ink/10 transition-colors">
                          <p className="micro-label text-ink opacity-40 mb-3 tracking-widest text-[8px]">Editorial Key</p>
                          <div className="font-mono text-xs text-ink leading-relaxed break-words font-bold">
                            {article.gameType === 'fill-blanks' && article.content.answers.join(' • ')}
                            {article.gameType === 'em-dash-phrases' && article.content.answers.join(' • ')}
                            {article.gameType === 'rearrange' && "Logical Sequence Verified"}
                            {article.gameType === 'double-click' && article.content.correctWords.join(' ↔ ')}
                            {article.gameType === 'poetic-fill' && article.content.answer}
                            {article.gameType === 'type-answer' && article.content.answer}
                            {article.gameType === 'compounding-effects' && article.content.answer}
                            {article.gameType === 'paragraph-principles' && article.content.sections.map((s: any) => s.answer).join(' • ')}
                            {article.gameType === 'anagrams' && article.content.answers.join(' • ')}
                            {article.gameType === 'tangential-points' && article.content.correctOrder.map((idx: number) => article.content.fragments[idx]).join(' → ')}
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-white border-l-2 border-ink group-hover/article:bg-ink/[0.02] transition-all">
                        <div className="flex gap-4">
                          <div className="text-ink/30 mt-1"><Sparkles size={14} /></div>
                          <div>
                            <p className="micro-label mb-1 text-ink opacity-40 tracking-[0.2em] text-[8px]">The Synthesis</p>
                            <p className="text-sm font-serif leading-relaxed text-ink/80 italic">
                              "{article.reasoning}"
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )))}
                </div>

                <div className="pt-8">
                  <p className="text-right italic">Stay curious,</p>
                  <p className="text-right font-bold">-Cursive Editorial Team</p>
                </div>
              </div>

          <button
            onClick={() => setShowEmailer(false)}
            className="mt-8 w-full bg-ink text-bg py-5 font-mono text-[11px] uppercase tracking-[0.4em] hover:opacity-90 transition-all rounded-none shadow-2xl relative group"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity translate-y-full group-hover:translate-y-0 duration-500" />
            <span className="relative z-10">Exit Archive</span>
          </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

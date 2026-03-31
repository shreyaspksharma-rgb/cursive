/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WelcomeModal } from './components/WelcomeModal';
import { ArticleCard } from './components/ArticleCard';
import { GameView } from './components/GameView';
import { ARTICLES } from './constants';
import { Mail, Sparkles, Search, X } from 'lucide-react';

export default function App() {
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState<number | null>(null);
  const [completedGames, setCompletedGames] = useState<number[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
  const [mistakes, setMistakes] = useState<Record<number, number>>({});
  const [showEmailer, setShowEmailer] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Load progress from localStorage
    const savedProgress = localStorage.getItem('cursive_progress');
    if (savedProgress) {
      try {
        const { completed, answers, userMistakes, email } = JSON.parse(savedProgress);
        if (completed) setCompletedGames(completed);
        if (answers) setUserAnswers(answers);
        if (userMistakes) setMistakes(userMistakes);
        if (email) setUserEmail(email);
      } catch (e) {
        console.error("Failed to load progress", e);
      }
    }
  }, []);

  // Save progress whenever it changes
  useEffect(() => {
    if (completedGames.length > 0 || userEmail) {
      localStorage.setItem('cursive_progress', JSON.stringify({
        completed: completedGames,
        answers: userAnswers,
        userMistakes: mistakes,
        email: userEmail
      }));
    }
  }, [completedGames, userAnswers, mistakes, userEmail]);

  const handleCloseWelcome = () => {
    setHasSeenWelcome(true);
  };

  const handleSignIn = () => {
    if (emailInput && emailInput.includes('@')) {
      setUserEmail(emailInput);
      setEmailInput("");
    }
  };

  const handleSignOut = () => {
    setUserEmail(null);
    localStorage.removeItem('cursive_progress');
    setCompletedGames([]);
    setUserAnswers({});
    setMistakes({});
  };

  const handleCompleteGame = (id: number, answer: any) => {
    if (!completedGames.includes(id)) {
      const next = [...completedGames, id];
      setCompletedGames(next);
      setUserAnswers(prev => ({ ...prev, [id]: answer }));
      
      if (next.length === ARTICLES.length) {
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

  const isAllCompleted = completedGames.length === ARTICLES.length;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <WelcomeModal isOpen={!hasSeenWelcome} onClose={handleCloseWelcome} />

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
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={14} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-ink/5 border border-line/10 pl-9 pr-9 py-1.5 rounded-full text-xs focus:outline-none focus:border-ink/30 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="micro-label">
            Progress: {completedGames.length}/{ARTICLES.length}
          </div>
        </div>
        
        {/* Visual Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-line/10">
          <motion.div 
            className="h-full bg-ink"
            initial={{ width: 0 }}
            animate={{ width: `${(completedGames.length / ARTICLES.length) * 100}%` }}
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
              isCompleted={completedGames.includes(currentArticleId)}
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
                          Six interactive stories. Six unique puzzles. 
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
                  {filteredArticles.length >= 1 && (
                    <section className="mb-2">
                      <ArticleCard
                        article={filteredArticles[0]}
                        isCompleted={completedGames.includes(filteredArticles[0].id)}
                        onClick={() => setCurrentArticleId(filteredArticles[0].id)}
                        aspectRatio="aspect-[16/9] md:aspect-[21/9]"
                      />
                    </section>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-2">
                    <div className="lg:col-span-8">
                      <div className="horizontal-line !mt-0 !mb-2" />
                      {/* Medium Grid - 2 columns */}
                      <section className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                        {filteredArticles.slice(1, 3).map((article) => (
                          <ArticleCard
                            key={article.id}
                            article={article}
                            isCompleted={completedGames.includes(article.id)}
                            onClick={() => setCurrentArticleId(article.id)}
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

                  <div className="horizontal-line !my-2" />

                  {/* Small Grid - Remaining columns */}
                  <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                    {filteredArticles.slice(3).map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        isCompleted={completedGames.includes(article.id)}
                        onClick={() => setCurrentArticleId(article.id)}
                      />
                    ))}
                  </section>
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
                  <div className="relative overflow-hidden rounded-3xl group cursor-pointer" onClick={() => setShowEmailer(true)}>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-90 group-hover:scale-110 transition-transform duration-700" />
                    <div className="relative py-16 px-8 flex flex-col items-center justify-center gap-6">
                      <h3 className="text-4xl font-bold text-white tracking-tighter">Click here to receive answers.</h3>
                      <div className="flex items-center gap-4 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-white font-mono text-xs uppercase tracking-widest">
                        <Mail size={16} /> Unlock Weekly Insights
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
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-line bg-white py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-4">
            <div className="lg:col-span-2">
              <h4 className="text-3xl font-serif font-bold italic mb-4">cursive.</h4>
              <p className="text-lg opacity-60 max-w-md mb-4">
                A structured sense of journalism where news becomes a language to express. 
                Sign in to save your progress across the week.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {userEmail ? (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-emerald-900">Signed in as {userEmail}</span>
                      </div>
                      <button 
                        onClick={handleSignOut}
                        className="text-[10px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                      >
                        Sign Out
                      </button>
                    </div>
                    <p className="text-xs opacity-40 italic">Your progress is automatically saved to your account.</p>
                  </div>
                ) : (
                  <>
                    <input 
                      type="email" 
                      placeholder="your@email.com" 
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="bg-ink/5 border border-line px-4 py-2 rounded-xl flex-grow focus:outline-none focus:border-ink transition-colors w-full"
                    />
                    <button 
                      onClick={handleSignIn}
                      className="bg-ink text-bg px-6 py-2 rounded-xl font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity whitespace-nowrap"
                    >
                      Sign in to save your answers.
                    </button>
                  </>
                )}
              </div>
            </div>
            <div>
              <p className="micro-label mb-4">Account</p>
              <ul className="space-y-2 font-sans text-sm">
                <li><button onClick={() => setShowEmailer(true)} className="hover:underline">Review Answers</button></li>
                <li><a href="#" className="hover:underline">Settings</a></li>
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
              className="bg-white border border-line p-8 md:p-12 shadow-2xl relative rounded-3xl max-w-3xl w-full my-8"
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-ink text-bg p-4 rounded-full shadow-xl">
                <Mail size={24} />
              </div>
              <header className="mb-8 border-b border-line pb-6 text-center">
                <p className="micro-label mb-2">Incoming Message</p>
                <h2 className="text-3xl font-bold">Answers Emailer</h2>
              </header>
              
              <div className="space-y-8 font-serif text-lg leading-relaxed">
                <p>Hi there,</p>
                <p>
                  Congratulations on finishing your first weekly read. We intentionally send out all the answers at once 
                  so that you can remember what you have read and things remain in the cluttered fast paced brain.
                </p>

                <div className="space-y-12 py-8 border-y border-line max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                  {ARTICLES.map((article) => (
                    <div key={article.id} className="space-y-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-baseline border-b border-line/10 pb-2 gap-4">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-xl">{article.title}</h3>
                          <button
                            onClick={() => {
                              setCurrentArticleId(article.id);
                              setShowEmailer(false);
                            }}
                            className="p-2 hover:bg-ink hover:text-bg rounded-full transition-colors group"
                            title="View Article"
                          >
                            <Sparkles size={14} className="group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                        {(() => {
                          const ans = userAnswers[article.id];
                          const isCorrect = (() => {
                            if (!ans) return false;
                            if (article.gameType === 'fill-blanks') return ans.every((v: string, i: number) => v.toLowerCase().trim() === article.content.answers[i].toLowerCase());
                            if (article.gameType === 'rearrange') return ans.every((p: any, i: number) => p.id === article.content.correctOrder[i]);
                            if (article.gameType === 'double-click') return ans.isFixed;
                            if (article.gameType === 'poetic-fill' || article.gameType === 'type-answer') return ans.toLowerCase().trim() === article.content.answer.toLowerCase();
                            if (article.gameType === 'anagrams') return ans.every((v: string, i: number) => v.toLowerCase().trim() === article.content.answers[i].toLowerCase());
                            return false;
                          })();

                          return (
                            <span className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border ${
                              !ans ? 'bg-ink/5 border-line/10 opacity-40' : 
                              isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                              {!ans ? '✗ No submission' : isCorrect ? '✓ Correct' : '✗ Incorrect'}
                            </span>
                          );
                        })()}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-base">
                        <div className="space-y-2">
                          <p className="micro-label opacity-40">Your Submission</p>
                          <div className="font-mono text-sm bg-ink/5 p-3 rounded-lg opacity-80 border border-line/5">
                            {(() => {
                              const ans = userAnswers[article.id];
                              if (!ans) return "(Empty)";
                              if (article.gameType === 'fill-blanks') return ans.join(', ');
                              if (article.gameType === 'rearrange') return "Paragraphs rearranged";
                              if (article.gameType === 'double-click') return ans.isFixed ? "Fixed" : "Not fixed";
                              if (article.gameType === 'poetic-fill' || article.gameType === 'type-answer') return ans || "(Empty)";
                              if (article.gameType === 'anagrams') return ans.join(', ');
                              return "Submitted";
                            })()}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="micro-label text-blue-600">The Solution</p>
                          <div className="font-mono text-sm bg-blue-50 p-3 rounded-lg text-blue-900 border border-blue-100">
                            {article.gameType === 'fill-blanks' && article.content.answers.join(', ')}
                            {article.gameType === 'rearrange' && "Paragraphs ordered correctly (p1 → p4)"}
                            {article.gameType === 'double-click' && article.content.correctWords.join(' ↔ ')}
                            {article.gameType === 'poetic-fill' && article.content.answer}
                            {article.gameType === 'type-answer' && article.content.answer}
                            {article.gameType === 'anagrams' && article.content.answers.join(', ')}
                          </div>
                        </div>
                      </div>

                      <div className="bg-ink/5 p-4 rounded-xl border border-line/10">
                        <p className="micro-label mb-2 opacity-60">The Reasoning</p>
                        <p className="text-sm font-sans italic leading-relaxed opacity-80">
                          {article.reasoning}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-8">
                  <p className="text-right italic">Stay curious,</p>
                  <p className="text-right font-bold">-Cursive Editorial Team</p>
                </div>
              </div>

              <button
                onClick={() => setShowEmailer(false)}
                className="mt-12 w-full bg-ink text-bg py-4 font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-all rounded-2xl shadow-lg"
              >
                Back to Publication
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Immersive Study Feed
// Full-screen edge-to-edge, minimal chrome, Instagram Reels
// ═══════════════════════════════════════════════════════════

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';
import StudyCard from './StudyCard';
import DiagnosticBomb from './DiagnosticBomb';
import FocusPivot from './FocusPivot';
import CommandBar from './CommandBar';

export default function StudyFeed() {
    const cards = useSRSStore((s) => s.cards);
    const fetchLiveCards = useSRSStore((s) => s.fetchLiveCards);
    const needsDiagnostic = useSRSStore((s) => s.needsDiagnostic);
    const isLoading = useSRSStore((s) => s.isLoading);
    const isBurnoutMode = useSRSStore((s) => s.isBurnoutMode);
    const isStoicIntervention = useSRSStore((s) => s.isStoicIntervention);
    const resetBurnout = useSRSStore((s) => s.resetBurnout);
    const dismissStoicIntervention = useSRSStore((s) => s.dismissStoicIntervention);
    const setCurrentIndex = useSRSStore((s) => s.setCurrentIndex);
    const isListenMode = useSRSStore((s) => s.isListenMode);
    const toggleListenMode = useSRSStore((s) => s.toggleListenMode);
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeFilter, setActiveFilter] = useState('All');
    const [burnoutTimer, setBurnoutTimer] = useState(30);
    const [isRapidFire, setIsRapidFire] = useState(false);
    const [showViralFomo, setShowViralFomo] = useState(false);
    const [fomoMessage, setFomoMessage] = useState('');
    const feedRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    const setupObserver = useCallback(() => {
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                        const index = Number(entry.target.getAttribute('data-index'));
                        if (!isNaN(index)) {
                            setActiveIndex(index);
                            setCurrentIndex(index);
                        }
                    }
                });
            },
            { root: feedRef.current, threshold: 0.5 }
        );

        cardRefs.current.forEach((ref) => {
            if (ref) observerRef.current?.observe(ref);
        });
    }, [setCurrentIndex]);

    useEffect(() => {
        fetchLiveCards();
    }, [fetchLiveCards]);

    useEffect(() => {
        if (!isLoading && cards.length > 0) {
            setupObserver();
        }
        return () => observerRef.current?.disconnect();
    }, [setupObserver, cards.length, isLoading]);

    // Viral FOMO Engine
    useEffect(() => {
        if (activeIndex > 0 && activeIndex % 8 === 0) {
            // Every 8 cards, 50% chance to drop a toxic FOMO alert
            if (Math.random() > 0.5) {
                const messages = [
                    "15,000 users just finished studying Parliament. You are falling behind.",
                    "Your rival 'Arjun' is currently on a 45-card streak. What are you doing?",
                    "Warning: 82% of aspirants know the card you just missed. Focus.",
                    "Your UPSC IQ is dropping relative to the national average. Speed up."
                ];
                setFomoMessage(messages[Math.floor(Math.random() * messages.length)]);
                setShowViralFomo(true);
                setTimeout(() => setShowViralFomo(false), 4500);
            }
        }
    }, [activeIndex]);

    if (isLoading) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0b0e17]">
                <div className="w-12 h-12 border-4 border-[#7c3aed]/30 border-t-[#c026d3] rounded-full animate-spin mb-4" />
                <p className="text-white/60 font-medium animate-pulse">Syncing AI Flashcards from Supabase...</p>
            </div>
        );
    }

    if (needsDiagnostic) {
        return <DiagnosticBomb />;
    }

    if (isStoicIntervention) {
        const stoicQuotes = [
            '"You have power over your mind - not outside events. Realize this, and you will find strength." — Marcus Aurelius',
            '"It is not that we have a short time to live, but that we waste a lot of it." — Seneca',
            '"We suffer more often in imagination than in reality." — Seneca',
            '"If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it." — Marcus Aurelius'
        ];
        const randomQuote = stoicQuotes[Math.floor(Math.random() * stoicQuotes.length)];
        return (
            <div className="fixed inset-0 z-[100] w-full h-full bg-[#050505] flex flex-col items-center justify-center px-8 text-center"
                style={{ backdropFilter: 'blur(20px)' }}>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="max-w-md space-y-10"
                >
                    <div className="w-12 h-12 mx-auto rounded-full border border-white/10 flex items-center justify-center">
                        <span className="text-white/40 text-xl font-serif tracking-widest">III</span>
                    </div>

                    <h2 className="text-xl font-light text-white/50 tracking-[0.2em] uppercase">Strategic Pause</h2>

                    <p className="text-lg text-white/90 font-serif italic leading-relaxed">
                        {randomQuote}
                    </p>

                    <div className="pt-8">
                        <button
                            onClick={() => dismissStoicIntervention()}
                            className="px-8 py-3 rounded-full border border-white/20 text-white/60 text-xs uppercase tracking-[0.3em] hover:bg-white/5 transition-colors"
                        >
                            Inhale. Exhale. Resume.
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const SUBJECTS = ['All', 'Polity', 'History', 'Geography', 'Economy', 'Environment', 'Sci & Tech'];

    // Filter cards based on active subject selection
    const filteredCards = activeFilter === 'All'
        ? cards
        : cards.filter(c => c.subject?.toLowerCase() === activeFilter.toLowerCase());

    return (
        <div
            ref={feedRef}
            className="study-feed w-full h-screen overflow-y-scroll bg-transparent"
            style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
        >
            {/* ─── Ultra-Subtle Progress Line ─── */}
            <div className="fixed top-0 left-0 right-0 z-[60] h-[1px] bg-white/5">
                <motion.div
                    className="h-full bg-white/40"
                    animate={{ width: `${cards.length > 0 ? ((activeIndex + 1) / filteredCards.length) * 100 : 0}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                />
            </div>

            {/* ─── Top Subject Filter Chips ─── */}
            <div className="fixed top-4 left-0 right-0 z-[60] px-4">
                <div className="max-w-xl mx-auto flex overflow-x-auto gap-2 pb-2 scrollbar-none snap-x pointer-events-auto mask-edges">
                    {SUBJECTS.map((sub, i) => (
                        <button
                            key={sub}
                            onClick={() => { setActiveFilter(sub); setActiveIndex(0); }}
                            className={`snap-start whitespace-nowrap px-4 py-1.5 rounded-full border text-[11px] transition-all font-bold tracking-widest uppercase shadow-sm ${activeFilter === sub
                                    ? 'bg-white text-black border-transparent shadow-[0_4px_10px_rgba(255,255,255,0.2)]'
                                    : 'bg-black/50 backdrop-blur-md border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {sub}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Mastermind Focus Pivot ─── */}
            <FocusPivot />

            {/* ─── Command Palette ─── */}
            <CommandBar />

            {/* ─── Refined FOMO Notification ─── */}
            <AnimatePresence>
                {showViralFomo && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-24 inset-x-6 z-[100] flex justify-center pointer-events-none"
                    >
                        <div className="bg-white text-black px-5 py-3 rounded-full flex items-center gap-3 shadow-2xl">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                            <p className="text-[11px] font-bold tracking-tight uppercase">{fomoMessage}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Minimal Index Counter ─── */}
            <div className="fixed bottom-8 right-6 z-50 pointer-events-none">
                <span className="text-[11px] font-black text-white/30 tracking-widest uppercase">
                    {filteredCards.length > 0 ? activeIndex + 1 : 0} / {filteredCards.length}
                </span>
            </div>


            {filteredCards.length === 0 ? (
                <div className="w-full h-screen flex flex-col items-center justify-center pt-20">
                    <span className="text-4xl mb-4 opacity-50 block">📭</span>
                    <p className="text-white/40 font-mono text-sm uppercase tracking-widest">No Intel for {activeFilter}</p>
                </div>
            ) : filteredCards.map((card, index) => (
                <div
                    key={card.id}
                    ref={(el) => { cardRefs.current[index] = el; }}
                    data-index={index}
                    className="w-full h-screen flex-shrink-0"
                    style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
                >
                    <StudyCard
                        card={card}
                        isActive={index === activeIndex}
                        isRapidFire={isRapidFire}
                        onAnswered={() => {
                            // If there is a next card, scroll to it smoothly
                            if (index + 1 < filteredCards.length) {
                                cardRefs.current[index + 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            } else {
                                // Scroll to the end screen
                                feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
                            }
                        }}
                    />
                </div>
            ))}

            {/* ─── End Card ─── */}
            <div
                className="w-full h-screen flex-shrink-0 flex items-center justify-center"
                style={{ scrollSnapAlign: 'start' }}
            >
                <motion.div
                    className="text-center px-8"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="text-5xl mb-5">🎉</div>
                    <h2 className="text-xl font-bold text-white/90 mb-2 font-outfit">
                        Session Complete
                    </h2>
                    <p className="text-white/40 text-sm mb-8 max-w-xs mx-auto">
                        You&apos;ve reviewed all {filteredCards.length} cards in this queue. Great work, future officer!
                    </p>
                    <motion.button
                        onClick={() => {
                            feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                            setActiveIndex(0);
                            setCurrentIndex(0);
                        }}
                        className="px-8 py-3.5 rounded-2xl text-white text-sm font-bold transition-shadow"
                        style={{
                            background: 'linear-gradient(135deg, #7c3aed, #c026d3)',
                            boxShadow: '0 8px 32px rgba(124, 58, 237, 0.25)',
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        Review Again
                    </motion.button>
                </motion.div>
            </div>
        </div>
    );
}

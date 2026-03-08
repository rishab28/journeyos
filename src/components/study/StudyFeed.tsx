'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Immersive Study Feed
// Full-screen edge-to-edge, minimal chrome, Instagram Reels
// ═══════════════════════════════════════════════════════════

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';
import { useProgressStore } from '@/store/progressStore';
import StudyCard from '@/components/study/StudyCard';
import StudyCardSkeleton from '@/components/study/StudyCardSkeleton';
import DiagnosticBomb from '@/components/practice/DiagnosticBomb';
import FocusPivot from '@/components/intelligence/FocusPivot';
import CommandBar from '@/components/navigation/CommandBar';
import SubjectStories from '@/components/stories/SubjectStories';
import CurrentAffairStories from '@/components/stories/CurrentAffairStories';
import { CurrentAffairStory } from '@/types';

interface StudyFeedProps {
    stories?: CurrentAffairStory[];
}

export default function StudyFeed({ stories = [] }: StudyFeedProps) {
    const cards = useSRSStore((s) => s.cards);
    const fetchLiveCards = useSRSStore((s) => s.fetchLiveCards);
    const fetchMoreCards = useSRSStore((s) => s.fetchMoreCards);
    const needsDiagnostic = useSRSStore((s) => s.needsDiagnostic);
    const isLoading = useSRSStore((s) => s.isLoading);
    const isBurnoutMode = useSRSStore((s) => s.isBurnoutMode);
    const isStoicIntervention = useSRSStore((s) => s.isStoicIntervention);
    const resetBurnout = useSRSStore((s) => s.resetBurnout);
    const dismissStoicIntervention = useSRSStore((s) => s.dismissStoicIntervention);
    const setCurrentIndex = useSRSStore((s) => s.setCurrentIndex);
    const setFilters = useSRSStore((s) => s.setFilters);
    const feedScrollTrigger = useSRSStore((s) => s.feedScrollTrigger);
    const [activeIndex, setActiveIndex] = useState(0);
    const activeIndexRef = useRef(0);
    const [isRapidFire, setIsRapidFire] = useState(false);
    const incrementSwipeCount = useProgressStore((s) => s.incrementSwipeCount);
    const lastTrackedIndex = useRef(-1);

    // Sync ref for stable callbacks
    useEffect(() => {
        activeIndexRef.current = activeIndex;
    }, [activeIndex]);

    const handleNext = useCallback(() => {
        const nextIndex = activeIndexRef.current + 1;
        if (nextIndex < cards.length) {
            cardRefs.current[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [cards.length]);

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

                            if (index > lastTrackedIndex.current) {
                                incrementSwipeCount();
                                lastTrackedIndex.current = index;
                            }
                        }
                    }
                });
            },
            { root: feedRef.current, threshold: 0.5 }
        );

        cardRefs.current.forEach((ref) => {
            if (ref) observerRef.current?.observe(ref);
        });
    }, [setCurrentIndex, incrementSwipeCount]);

    // ─── Feed Interaction Trigger (Instagram Style) ───
    useEffect(() => {
        if (feedScrollTrigger > 0 && feedRef.current) {
            feedRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            // If already at top, refetch for fresh content
            if (feedRef.current.scrollTop === 0) {
                fetchLiveCards();
            }
        }
    }, [feedScrollTrigger, fetchLiveCards]);

    useEffect(() => {
        // Zero-Distraction: Always get fresh intel on mount
        fetchLiveCards();
    }, [fetchLiveCards]);

    useEffect(() => {
        if (!isLoading && cards.length > 0) {
            setupObserver();
        }
        return () => observerRef.current?.disconnect();
    }, [setupObserver, cards.length, isLoading]);

    // Infinite Load Trigger: Fetch more when reaching near the end
    useEffect(() => {
        if (activeIndex >= cards.length - 3 && cards.length > 0) {
            fetchMoreCards();
        }
    }, [activeIndex, cards.length, fetchMoreCards]);

    if (isLoading) {
        return (
            <div className="w-full h-screen overflow-hidden bg-[#050508] flex flex-col">
                <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.2)]" />
                    <p className="mt-6 font-caps text-[10px] text-indigo-400 tracking-[0.4em] font-black animate-pulse">SYNCHRONIZING INTEL</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={feedRef}
            className="study-feed w-full h-full overflow-y-scroll bg-[#050508] relative no-scrollbar"
            style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch', scrollPaddingTop: '60px' }}
        >
            {/* ─── Top Snap Point: Intelligence Pulse (Stories) ─── */}
            <div className="w-full flex-shrink-0 snap-start bg-[#050508] pt-14">
                <CurrentAffairStories stories={stories} />

                {/* Phase 37: Neural Filter Banner */}
                {(useSRSStore.getState().activeSubject !== 'Mixed' || useSRSStore.getState().activeTopic) && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-8 mt-8"
                    >
                        <div className="glass-panel rounded-3xl p-5 flex items-center justify-between border-white/5 bg-indigo-500/[0.03]">
                            <div className="flex items-center gap-4">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_#6366f1]" />
                                <div>
                                    <h4 className="font-caps text-[9px] font-black text-white/30 uppercase tracking-[0.2em] leading-none mb-1.5">NEURAL FOCUS</h4>
                                    <p className="font-caps text-[11px] font-bold text-white uppercase tracking-[0.1em]">
                                        {useSRSStore.getState().activeSubject} {useSRSStore.getState().activeTopic ? `• ${useSRSStore.getState().activeTopic}` : ''}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setFilters({ subject: 'Mixed', topic: null, chapter: null })}
                                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 font-caps text-[9px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-widest active:scale-95"
                            >
                                RESET SYNC
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {cards.length === 0 ? (
                <div className="w-full h-screen flex flex-col items-center justify-center p-8 relative z-50">
                    <div className="absolute inset-0 bg-[#050508] z-0" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[500px] max-h-[500px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none z-10" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-20 flex flex-col items-center text-center max-w-sm mt-[-10vh]"
                    >
                        <div className="w-24 h-24 mb-8 rounded-full border border-white/5 flex items-center justify-center glass-panel shadow-[0_0_50px_rgba(99,102,241,0.1)] relative">
                            <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-[spin_4s_linear_infinite]" style={{ borderTopColor: 'transparent', borderBottomColor: 'transparent' }} />
                            <span className="text-3xl grayscale opacity-70">📭</span>
                        </div>

                        <h2 className="text-2xl font-bold text-white tracking-tight mb-3">Neural Queue Empty</h2>
                        <p className="text-[15px] text-white/40 leading-relaxed mb-10 max-w-[280px]">
                            {useSRSStore.getState().activeSubject !== 'Mixed'
                                ? "No intel mathing your current filters. Tap below to reset your scope."
                                : "Your local cache is empty. Pull the latest strategic intel from the master server to begin."}
                        </p>

                        <button
                            onClick={async () => {
                                if (useSRSStore.getState().activeSubject !== 'Mixed') {
                                    useSRSStore.getState().setFilters({ subject: 'Mixed', topic: null, chapter: null });
                                } else {
                                    triggerHaptic('medium');
                                    useSRSStore.setState({ syncStatus: 'syncing' });
                                    try {
                                        const { syncEngine } = await import('@/lib/core/db/syncEngine');
                                        await syncEngine.pullLatestData();
                                        await useSRSStore.getState().fetchLiveCards();
                                    } finally {
                                        useSRSStore.setState({ syncStatus: 'synced' });
                                    }
                                }
                            }}
                            className="bg-white text-black px-8 py-4 rounded-2xl font-caps text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all w-full flex items-center justify-center gap-3"
                        >
                            {useSRSStore.getState().syncStatus === 'syncing' ? (
                                <>
                                    <span className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    SYNCING DATABANKS...
                                </>
                            ) : useSRSStore.getState().activeSubject !== 'Mixed' ? (
                                "CLEAR FILTERS"
                            ) : (
                                "PULL LATEST INTEL"
                            )}
                        </button>
                    </motion.div>
                </div>
            ) : cards.map((card, index) => {
                const elements = [];

                // Insert Insight Interstitial every 5 cards
                if (index > 0 && index % 5 === 0) {
                    const todayReviewed = useProgressStore.getState().todayReviewed;
                    const accuracy = useProgressStore.getState().accuracy;
                    const currentStreak = useProgressStore.getState().currentStreak;
                    const upscIQ = useProgressStore.getState().upscIQ;

                    elements.push(
                        <div
                            key={`insight-${index}`}
                            className="w-full h-full flex-shrink-0 snap-start bg-[#050508] flex items-center justify-center"
                            style={{ scrollSnapStop: 'always' }}
                        >
                            <div className="w-full max-w-md mx-auto px-8">
                                <div className="rounded-[40px] glass-panel border border-indigo-500/20 p-10 relative overflow-hidden">
                                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-8">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_#6366f1]" />
                                            <span className="font-caps text-[10px] text-indigo-400 tracking-[0.3em] font-black uppercase">Session Pulse</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 mb-8">
                                            <div className="space-y-1">
                                                <p className="font-caps text-[9px] text-white/30 tracking-[0.2em]">REVIEWED</p>
                                                <p className="text-[36px] font-bold text-white tabular-nums leading-none">{todayReviewed}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-caps text-[9px] text-white/30 tracking-[0.2em]">ACCURACY</p>
                                                <p className="text-[36px] font-bold text-white tabular-nums leading-none">{accuracy}<span className="text-lg text-white/20">%</span></p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-caps text-[9px] text-white/30 tracking-[0.2em]">STREAK</p>
                                                <p className="text-[36px] font-bold text-indigo-400 tabular-nums leading-none">{currentStreak}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-caps text-[9px] text-white/30 tracking-[0.2em]">UPSC IQ</p>
                                                <p className="text-[36px] font-bold text-white tabular-nums leading-none">{upscIQ}</p>
                                            </div>
                                        </div>

                                        <div className="h-1.5 rounded-full bg-white/[0.03] overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full bg-gradient-to-r from-indigo-500/40 to-indigo-400"
                                                initial={{ width: '0%' }}
                                                animate={{ width: `${Math.min(accuracy, 100)}%` }}
                                                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                                            />
                                        </div>
                                        <p className="font-caps text-[9px] text-white/20 tracking-[0.2em] mt-3 text-center">
                                            KEEP GOING · {cards.length - index} CARDS LEFT
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }

                // Regular Study Card
                elements.push(
                    <div
                        key={card.id}
                        ref={(el) => { cardRefs.current[index] = el; }}
                        data-index={index}
                        className="w-full h-full flex-shrink-0 snap-start pt-6 bg-[#050508]"
                        style={{ scrollSnapStop: 'always' }}
                    >
                        <StudyCard
                            card={card}
                            isActive={index === activeIndex}
                            isRapidFire={isRapidFire}
                            onAnswered={handleNext}
                        />
                    </div>
                );

                return elements;
            })}

            {/* ─── End Card ─── */}
            <div
                className="w-full h-screen flex-shrink-0 flex items-center justify-center"
                style={{ scrollSnapAlign: 'start' }}
            >
                <div className="text-center px-10">
                    <div className="text-6xl mb-8 grayscale">🎉</div>
                    <h2 className="text-2xl font-bold text-white mb-3 font-outfit tracking-tight">Session Complete</h2>
                    <p className="font-caps text-[10px] text-white/30 tracking-[0.2em] mb-10 max-w-[240px] mx-auto uppercase">NEURAL BATCH MASTERED SUCCESSFULLY</p>
                    <button
                        onClick={() => {
                            feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-10 py-4 rounded-2xl bg-white text-black text-[12px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                    >
                        Review Again
                    </button>
                </div>
            </div>
        </div>
    );
}

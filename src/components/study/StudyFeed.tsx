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
    }, [setCurrentIndex]);

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
            <div className="w-full h-screen overflow-hidden bg-black flex flex-col">
                <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div
            ref={feedRef}
            className="study-feed w-full h-full overflow-y-scroll bg-black relative no-scrollbar"
            style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch', scrollPaddingTop: '60px' }}
        >
            {/* ─── Top Snap Point: Intelligence Pulse (Stories) ─── */}
            <div className="w-full flex-shrink-0 snap-start bg-black pt-14">
                <CurrentAffairStories stories={stories} />

                {/* Phase 37: Neural Filter Banner */}
                {(useSRSStore.getState().activeSubject !== 'Mixed' || useSRSStore.getState().activeTopic) && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-6 mt-6"
                    >
                        <div className="glass-card rounded-2xl p-4 flex items-center justify-between border-emerald-500/20 bg-emerald-500/[0.02]">
                            <div className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                                <div>
                                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Neural Focus</h4>
                                    <p className="text-[10px] font-bold text-white uppercase tracking-wider">
                                        {useSRSStore.getState().activeSubject} {useSRSStore.getState().activeTopic ? `• ${useSRSStore.getState().activeTopic}` : ''}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setFilters({ subject: 'Mixed', topic: null, chapter: null })}
                                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-white hover:bg-white/10 transition-colors uppercase tracking-tighter"
                            >
                                Reset Sync
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {cards.length === 0 ? (
                <div className="w-full h-screen flex flex-col items-center justify-center">
                    <span className="text-4xl mb-4 opacity-50 block">📭</span>
                    <p className="text-white/40 font-mono text-sm uppercase tracking-widest">No Intel in Sniper Feed</p>
                </div>
            ) : cards.map((card, index) => (
                <div
                    key={card.id}
                    ref={(el) => { cardRefs.current[index] = el; }}
                    data-index={index}
                    className="w-full h-full flex-shrink-0 snap-start pt-6 bg-black"
                    style={{ scrollSnapStop: 'always' }}
                >
                    <StudyCard
                        card={card}
                        isActive={index === activeIndex}
                        isRapidFire={isRapidFire}
                        onAnswered={handleNext}
                    />
                </div>
            ))}

            {/* ─── End Card ─── */}
            <div
                className="w-full h-screen flex-shrink-0 flex items-center justify-center"
                style={{ scrollSnapAlign: 'start' }}
            >
                <div className="text-center px-8">
                    <div className="text-5xl mb-5">🎉</div>
                    <h2 className="text-xl font-bold text-white/90 mb-2 font-outfit">Session Complete</h2>
                    <p className="text-white/40 text-sm mb-8 max-w-xs mx-auto">You've mastered this batch.</p>
                    <button
                        onClick={() => {
                            feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-8 py-3.5 rounded-2xl bg-white text-black text-sm font-bold active:scale-95 transition-transform"
                    >
                        Review Again
                    </button>
                </div>
            </div>
        </div>
    );
}

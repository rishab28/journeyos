'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Immersive Study Feed
// Full-screen edge-to-edge, minimal chrome, Instagram Reels
// ═══════════════════════════════════════════════════════════

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';
import StudyCard from './StudyCard';
import StudyCardSkeleton from './StudyCardSkeleton';
import DiagnosticBomb from './DiagnosticBomb';
import FocusPivot from './FocusPivot';
import CommandBar from './CommandBar';
import SubjectStories from './SubjectStories';

export default function StudyFeed() {
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
    const isListenMode = useSRSStore((s) => s.isListenMode);
    const toggleListenMode = useSRSStore((s) => s.toggleListenMode);
    const setFilters = useSRSStore((s) => s.setFilters);
    const feedScrollTrigger = useSRSStore((s) => s.feedScrollTrigger);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isRapidFire, setIsRapidFire] = useState(false);
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
        // Zero-Distraction: Reset all filters on mount to ensure "Sniper Feed"
        setFilters({ subject: 'Mixed', topic: null, chapter: null });
        fetchLiveCards();
    }, [fetchLiveCards, setFilters]);

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
            style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch', scrollPaddingTop: '20px' }}
        >
            {/* ─── Top Snap Point: Instagram Stories ─── */}
            <div className="w-full flex-shrink-0 snap-start bg-black pt-6">
                <SubjectStories />
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
                        onAnswered={() => {
                            if (index + 1 < cards.length) {
                                cardRefs.current[index + 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

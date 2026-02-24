'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Current Affairs Stories Engine (V2 - Portal Fix)
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CurrentAffairStory, Subject } from '@/types';
import { saveStoryToVault } from '@/app/actions/admin';

const SUBJECT_ICONS: Record<string, string> = {
    [Subject.POLITY]: '🏛️',
    [Subject.ECONOMY]: '📈',
    [Subject.SCIENCE]: '🔬',
    [Subject.ENVIRONMENT]: '🌱',
    [Subject.CURRENT_AFFAIRS]: '📰',
    'default': '⚡'
};

interface CurrentAffairStoriesProps {
    stories: CurrentAffairStory[];
}

export default function CurrentAffairStories({ stories }: CurrentAffairStoriesProps) {
    const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
    const [activeSlideIdx, setActiveSlideIdx] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Memoize unique stories
    const [uniqueStories, setUniqueStories] = useState<CurrentAffairStory[]>([]);

    useEffect(() => {
        const grouped = (stories || []).reduce((acc, story) => {
            if (!acc.find(s => s.subject === story.subject)) {
                acc.push(story);
            }
            return acc;
        }, [] as CurrentAffairStory[]);
        setUniqueStories(grouped);
    }, [stories]);

    const activeStory = activeStoryIdx !== null ? uniqueStories[activeStoryIdx] : null;

    // Auto-advance logic
    useEffect(() => {
        if (!activeStory) return;

        const duration = 5000;
        const interval = 50;
        const step = (interval / duration) * 100;

        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev + step >= 100) {
                    handleNextSlide();
                    return 0;
                }
                return prev + step;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [activeStory, activeSlideIdx, activeStoryIdx]);

    useEffect(() => {
        setProgress(0);
    }, [activeSlideIdx]);

    const handleNextSlide = () => {
        if (!activeStory) return;
        if (activeSlideIdx < activeStory.content.length - 1) {
            setActiveSlideIdx(prev => prev + 1);
        } else {
            if (activeStoryIdx !== null && activeStoryIdx < uniqueStories.length - 1) {
                setActiveStoryIdx(activeStoryIdx + 1);
                setActiveSlideIdx(0);
            } else {
                closeStory();
            }
        }
    };

    const handlePrevSlide = () => {
        if (!activeStory) return;
        if (activeSlideIdx > 0) {
            setActiveSlideIdx(prev => prev - 1);
        } else {
            if (activeStoryIdx !== null && activeStoryIdx > 0) {
                setActiveStoryIdx(activeStoryIdx - 1);
                const prevStory = uniqueStories[activeStoryIdx - 1];
                setActiveSlideIdx(prevStory.content.length - 1);
            }
        }
    };

    const handleCaptureToVault = async () => {
        if (!activeStory || isCapturing) return;
        setIsCapturing(true);
        try {
            const res = await saveStoryToVault(activeStory.id);
            if (res.success) alert('🚀 Captured to Vault!');
            else alert('❌ Capture failed: ' + res.error);
        } finally {
            setIsCapturing(false);
        }
    };

    const openStory = (idx: number) => {
        console.log(`[Stories] Opening story ${idx}`);
        setActiveStoryIdx(idx);
        setActiveSlideIdx(0);
        setProgress(0);
    };

    const closeStory = () => {
        setActiveStoryIdx(null);
        setActiveSlideIdx(0);
        setProgress(0);
    };

    if (uniqueStories.length === 0) return null;

    // Story Overlay Component
    const overlayContent = (
        <AnimatePresence>
            {activeStory && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-0"
                    style={{ pointerEvents: 'auto' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/95 backdrop-blur-3xl" />

                    <div className="relative w-full h-full max-w-md bg-[#111] overflow-hidden shadow-2xl flex flex-col sm:rounded-[2.5rem]">

                        {/* Progress Bars */}
                        <div className="absolute top-4 left-0 w-full px-4 flex gap-1 z-20">
                            {activeStory.content.map((_, i) => (
                                <div key={i} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white transition-all duration-75 ease-linear"
                                        style={{
                                            width: i === activeSlideIdx ? `${progress}%` : (i < activeSlideIdx ? '100%' : '0%')
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Story Header */}
                        <div className="absolute top-8 left-0 w-full px-4 flex justify-between items-center z-20">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                    <span className="text-sm">{SUBJECT_ICONS[activeStory.subject] || SUBJECT_ICONS['default']}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white tracking-widest uppercase">{activeStory.subject}</span>
                                    {activeStory.syllabusTopic && (
                                        <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Syllabus: {activeStory.syllabusTopic}</span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); closeStory(); }}
                                className="text-white/60 hover:text-white p-2 text-2xl font-bold cursor-pointer z-30"
                            >
                                ×
                            </button>
                        </div>

                        {/* Navigation Click Zones */}
                        <div className="absolute inset-0 z-10 flex">
                            <div className="w-1/3 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrevSlide(); }} />
                            <div className="w-2/3 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNextSlide(); }} />
                        </div>

                        {/* Slide Content */}
                        <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-0">
                            <motion.p
                                key={activeSlideIdx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-2xl sm:text-3xl font-bold text-center leading-tight tracking-tight text-white/90"
                            >
                                {activeStory.content[activeSlideIdx]}
                            </motion.p>

                            {activeSlideIdx === activeStory.content.length - 1 && activeStory.mainsFodder && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-12 p-5 bg-white/5 border border-white/10 rounded-3xl w-full"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-2 block text-center">Mains Value Addition</span>
                                    <p className="text-xs text-white/70 leading-relaxed italic text-center">"{activeStory.mainsFodder}"</p>
                                </motion.div>
                            )}
                        </div>

                        {/* Call to Action */}
                        <div className="absolute bottom-12 w-full px-8 z-30 flex justify-center">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleCaptureToVault(); }}
                                disabled={isCapturing}
                                className="w-full bg-white text-black font-black py-4 rounded-full uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-400 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {isCapturing ? 'Refining Flashcard...' : (
                                    <><span>🚀</span> Capture to Strategic Vault</>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="w-full py-4 relative">
            {/* Horizontal Scroll Bar */}
            <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none snap-x">
                {uniqueStories.map((story, idx) => (
                    <div
                        key={story.id}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openStory(idx);
                        }}
                        className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 snap-start active:scale-95 transition-transform group"
                    >
                        <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-emerald-500 to-violet-500 shadow-[0_4px_12px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform">
                            <div className="w-[72px] h-[72px] rounded-full bg-[#0a0f1c] border-[4px] border-[#0a0f1c] flex items-center justify-center relative overflow-hidden">
                                <span className="text-3xl z-10">{SUBJECT_ICONS[story.subject] || SUBJECT_ICONS['default']}</span>
                                <div className="absolute inset-0 bg-white/5" />
                            </div>
                        </div>
                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest text-center truncate w-[80px] group-hover:text-white transition-colors">
                            {story.subject}
                        </span>
                    </div>
                ))}
            </div>

            {/* Portal for Overlay */}
            {mounted && typeof document !== 'undefined' && createPortal(overlayContent, document.body)}
        </div>
    );
}

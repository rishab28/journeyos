'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Current Affairs Stories Engine
// Instagram-style stories with 24h ephemeral content
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CurrentAffairStory, Subject } from '@/types';

// Hardcoded icons for subject stories
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

    // Group stories by subject (assuming 1 story per subject per day for simplicity in UI)
    // If multiple, we just show the latest active one
    const uniqueStories = stories.reduce((acc, story) => {
        if (!acc.find(s => s.subject === story.subject)) {
            acc.push(story);
        }
        return acc;
    }, [] as CurrentAffairStory[]);

    const activeStory = activeStoryIdx !== null ? uniqueStories[activeStoryIdx] : null;

    // Auto-advance logic
    useEffect(() => {
        if (!activeStory) return;

        const duration = 5000; // 5 seconds per slide
        const interval = 50; // Update progress every 50ms
        const step = (interval / duration) * 100;

        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev + step >= 100) {
                    handleNextSlide();
                    return 0; // Reset progress for the next slide (handled by handleNextSlide if it doesn't close)
                }
                return prev + step;
            });
        }, interval);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeStory, activeSlideIdx]);

    // Reset progress when slide changes manually
    useEffect(() => {
        setProgress(0);
    }, [activeSlideIdx]);

    const handleNextSlide = () => {
        if (!activeStory) return;

        if (activeSlideIdx < activeStory.content.length - 1) {
            // Next slide
            setActiveSlideIdx(prev => prev + 1);
        } else if (activeStory.mcqCard) {
            // Reached the end but there is an MCQ validating card
            // Transition handled via special state or just next slide if we append it
            // For now, let's just close the story as MCQs deserve their own flow
            closeStory();
        } else {
            // Next Story
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
                // Go to last slide of prev story
                const prevStory = uniqueStories[activeStoryIdx - 1];
                setActiveSlideIdx(prevStory.content.length - 1);
            }
        }
    };

    const openStory = (idx: number) => {
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

    return (
        <div className="w-full py-4 mb-4">
            {/* Story Avatar Bar */}
            <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none snap-x">
                {uniqueStories.map((story, idx) => {
                    // Check if seen (In production, grab from localStorage/DB)
                    const isSeen = false;

                    return (
                        <div
                            key={story.id}
                            onClick={() => openStory(idx)}
                            className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 snap-start"
                        >
                            <div className={`p-0.5 rounded-full ${!isSeen ? 'bg-gradient-to-tr from-amber-500 via-emerald-500 to-violet-500' : 'bg-white/20'}`}>
                                <div className="w-[68px] h-[68px] rounded-full bg-[#0a0f1c] border-[3px] border-[#0a0f1c] flex items-center justify-center relative overflow-hidden">
                                    <span className="text-3xl z-10">{SUBJECT_ICONS[story.subject] || SUBJECT_ICONS['default']}</span>
                                    {/* Subtle glowing background aura */}
                                    <div className="absolute inset-0 bg-white/5" />
                                </div>
                            </div>
                            <span className="text-[10px] font-medium text-white/70 max-w-[70px] text-center truncate">
                                {story.subject}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Full Screen Story Viewer Overlay */}
            <AnimatePresence>
                {activeStory && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        className="fixed inset-0 z-50 bg-black flex items-center justify-center p-2 sm:p-4"
                    >
                        {/* Background subtle blur */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/95 backdrop-blur-3xl" />

                        <div className="relative w-full h-full max-w-md bg-[#111] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col">

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
                                    <span className="text-sm font-bold text-white tracking-widest uppercase">{activeStory.subject} <span className="text-white/40 ml-1 text-xs font-normal">Just now</span></span>
                                </div>
                                <button onClick={closeStory} className="text-white/60 hover:text-white p-2 text-xl font-bold">×</button>
                            </div>

                            {/* Click Areas for Navigation */}
                            <div className="absolute inset-0 z-10 flex">
                                <div className="w-1/3 h-full cursor-pointer" onClick={handlePrevSlide} />
                                <div className="w-2/3 h-full cursor-pointer" onClick={handleNextSlide} />
                            </div>

                            {/* Slide Content */}
                            <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-0">
                                <motion.p
                                    key={activeSlideIdx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-2xl sm:text-3xl font-bold text-center leading-tight tracking-tight text-white/90"
                                >
                                    {activeStory.content[activeSlideIdx]}
                                </motion.p>
                            </div>

                            {/* Swipe up prompt or MCQ hint */}
                            {activeStory.mcqCard && activeSlideIdx === activeStory.content.length - 1 && (
                                <div className="absolute bottom-10 w-full flex justify-center z-20 pointer-events-none">
                                    <div className="bg-white/10 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 flex items-center gap-2 animate-bounce">
                                        <span className="text-xl">🎯</span>
                                        <span className="text-sm font-bold text-white tracking-wide">Tap for Final Validation</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

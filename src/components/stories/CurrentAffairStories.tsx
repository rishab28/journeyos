'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Current Affairs Stories Engine (V2 - Portal Fix)
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CurrentAffairStory, Subject } from '@/types';
import { saveStoryToVault } from '@/app/actions/admin';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SUBJECT_ICONS: Record<string, string> = {
    [Subject.POLITY]: '🏛️',
    [Subject.ECONOMY]: '📈',
    [Subject.SCIENCE]: '🔬',
    [Subject.ENVIRONMENT]: '🌱',
    [Subject.CURRENT_AFFAIRS]: '📰',
    [Subject.SOCIAL_ISSUES]: '🤝',
    [Subject.INTERNATIONAL_RELATIONS]: '🌎',
    'default': '⚡'
};

const SOURCE_LOGOS: Record<string, string> = {
    'The Hindu': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/52/The_Hindu_logo.svg/330px-The_Hindu_logo.svg.png',
    'Indian Express': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/New_Indian_Express_Logo.svg/1200px-New_Indian_Express_Logo.svg.png',
    'PIB': 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PIB_Logo.png',
};

interface CurrentAffairStoriesProps {
    stories: CurrentAffairStory[];
}

interface GroupedStories {
    subject: Subject;
    items: CurrentAffairStory[];
}

export default function CurrentAffairStories({ stories }: CurrentAffairStoriesProps) {
    const router = useRouter();
    const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
    const [activeSlideIdx, setActiveSlideIdx] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isCapturing, setIsCapturing] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Group stories by subject
    const [groupedStories, setGroupedStories] = useState<GroupedStories[]>([]);

    useEffect(() => {
        const groups: Record<string, CurrentAffairStory[]> = {};
        (stories || []).forEach(story => {
            if (!groups[story.subject]) groups[story.subject] = [];
            groups[story.subject].push(story);
        });

        const sortedGroups = Object.entries(groups).map(([subject, items]) => ({
            subject: subject as Subject,
            items: items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }));

        setGroupedStories(sortedGroups);
    }, [stories]);

    const activeGroup = activeStoryIdx !== null ? groupedStories[activeStoryIdx] : null;
    const activeItem = activeGroup ? activeGroup.items[activeSlideIdx] : null;

    // Auto-advance logic
    useEffect(() => {
        if (!activeGroup || isPaused) return;

        const duration = 15000; // Increased to 15s
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
    }, [activeGroup, activeSlideIdx, activeStoryIdx, isPaused]);

    useEffect(() => {
        if (activeGroup) {
            setProgress(0);
            setIsPaused(false);
        }
    }, [activeSlideIdx, activeStoryIdx]);

    const handleNextSlide = () => {
        if (!activeGroup) return;
        if (activeSlideIdx < activeGroup.items.length - 1) {
            setActiveSlideIdx(prev => prev + 1);
        } else {
            if (activeStoryIdx !== null && activeStoryIdx < groupedStories.length - 1) {
                setActiveStoryIdx(activeStoryIdx + 1);
                setActiveSlideIdx(0);
            } else {
                closeStory();
            }
        }
    };

    const handlePrevSlide = () => {
        if (!activeGroup) return;
        if (activeSlideIdx > 0) {
            setActiveSlideIdx(prev => prev - 1);
        } else {
            if (activeStoryIdx !== null && activeStoryIdx > 0) {
                setActiveStoryIdx(activeStoryIdx - 1);
                const prevGroup = groupedStories[activeStoryIdx - 1];
                setActiveSlideIdx(prevGroup.items.length - 1);
            }
        }
    };

    const handleCaptureToVault = async () => {
        if (!activeItem || isCapturing) return;
        setIsCapturing(true);
        try {
            const res = await saveStoryToVault(activeItem.id);
            if (res.success) alert('🚀 Captured to Vault!');
            else alert('❌ Capture failed: ' + res.error);
        } finally {
            setIsCapturing(false);
        }
    };

    const openStoryGroup = (idx: number) => {
        const subject = groupedStories[idx]?.subject;
        console.log(`[Stories] Opening subject ${subject}`);
        setActiveStoryIdx(idx);
        setActiveSlideIdx(0);
        setProgress(0);
        setIsPaused(false);
    };

    const closeStory = () => {
        setActiveStoryIdx(null);
        setActiveSlideIdx(0);
        setProgress(0);
        setIsPaused(false);
    };

    if (groupedStories.length === 0) return null;

    // Subject-based aesthetic configuration
    const SUBJECT_THEMES: Record<string, { color: string; gradient: string; glow: string }> = {
        [Subject.POLITY]: { color: '#00ccff', gradient: 'from-[#00ccff]/20 to-black', glow: 'shadow-[0_0_15px_rgba(0,204,255,0.4)]' },
        [Subject.ECONOMY]: { color: '#818cf8', gradient: 'from-[#818cf8]/20 to-black', glow: 'shadow-[0_0_15px_rgba(129,140,248,0.4)]' },
        [Subject.SCIENCE]: { color: '#cc88ff', gradient: 'from-[#cc88ff]/20 to-black', glow: 'shadow-[0_0_15px_rgba(204,136,255,0.4)]' },
        [Subject.ENVIRONMENT]: { color: '#a5b4fc', gradient: 'from-[#a5b4fc]/20 to-black', glow: 'shadow-[0_0_15px_rgba(165,180,252,0.4)]' },
        [Subject.CURRENT_AFFAIRS]: { color: '#ffcc00', gradient: 'from-[#ffcc00]/20 to-black', glow: 'shadow-[0_0_15px_rgba(255,204,0,0.4)]' },
        [Subject.SOCIAL_ISSUES]: { color: '#ff8866', gradient: 'from-[#ff8866]/20 to-black', glow: 'shadow-[0_0_15px_rgba(255,136,102,0.4)]' },
        [Subject.INTERNATIONAL_RELATIONS]: { color: '#6688ff', gradient: 'from-[#6688ff]/20 to-black', glow: 'shadow-[0_0_15px_rgba(102,136,255,0.4)]' },
        'default': { color: '#ffffff', gradient: 'from-white/10 to-black', glow: 'shadow-[0_0_15px_rgba(255,255,255,0.2)]' }
    };

    const theme = activeItem ? (SUBJECT_THEMES[activeItem.subject] || SUBJECT_THEMES['default']) : SUBJECT_THEMES['default'];

    // Format time helper
    const getFormattedTime = (dateStr?: string) => {
        if (!dateStr) return 'Just Now';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'Today';
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch {
            return 'Today';
        }
    };

    // Story Overlay Component
    const overlayContent = (
        <AnimatePresence>
            {activeGroup && activeItem && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-0 overflow-hidden"
                    style={{ pointerEvents: 'auto' }}
                    onPointerDown={() => setIsPaused(true)}
                    onPointerUp={() => setIsPaused(false)}
                    onPointerLeave={() => setIsPaused(false)}
                >
                    {/* Background Mesh Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-tr ${theme.gradient} animate-pulse duration-[3000ms] opacity-40`} />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl" />

                    <div className={`relative w-full h-full max-w-md ${activeItem.editorialStyle ? 'bg-[#fcfaf7] text-[#1a1a1a]' : 'bg-[#0b0e14]/80 text-white'} overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col sm:rounded-[2.5rem] transition-all duration-700 border-x border-white/5`}>

                        {/* Top Header Section (Flex flow, not absolute) */}
                        <div className="relative z-20 w-full flex flex-col pt-16 pb-4 sm:pt-8 shrink-0 pointer-events-auto">
                            {/* Progress Bars */}
                            <div className="w-full px-4 flex gap-1.5 mb-6">
                                {activeGroup.items.map((_, i) => (
                                    <div key={i} className="h-[3px] flex-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                                        <div
                                            className={`h-full transition-all duration-75 ease-linear`}
                                            style={{
                                                backgroundColor: activeItem.editorialStyle ? '#000' : theme.color,
                                                boxShadow: activeItem.editorialStyle ? 'none' : `0 0 10px ${theme.color}`,
                                                width: i === activeSlideIdx ? `${progress}%` : (i < activeSlideIdx ? '100%' : '0%')
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Premium Header */}
                            <div className="w-full px-6 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-md shrink-0 ${theme.glow}`}>
                                        <span className="text-2xl">{SUBJECT_ICONS[activeItem.subject] || SUBJECT_ICONS['default']}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[12px] font-black tracking-[0.2em] uppercase ${activeItem.editorialStyle ? 'text-black' : 'text-white'}`}>{activeItem.subject}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/30 shrink-0" />
                                            <span className="text-[10px] font-bold text-white/50 tracking-wide shrink-0">{getFormattedTime(activeItem.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            {activeItem.sourceName && (
                                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter bg-indigo-400/10 px-1.5 py-0.5 rounded border border-indigo-400/20 whitespace-nowrap">{activeItem.sourceName}</span>
                                            )}
                                            {activeItem.syllabusTopic && (
                                                <>
                                                    <span className="text-[9px] text-white/30 hidden sm:inline">/</span>
                                                    <span className="text-[9px] text-white/60 font-medium uppercase tracking-widest">{activeItem.syllabusTopic}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); closeStory(); }}
                                    className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center ${activeItem.editorialStyle ? 'bg-black/5 text-black' : 'bg-white/5 text-white/60'} backdrop-blur-md border border-white/5 hover:bg-white/10 transition-all cursor-pointer group`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-300"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        </div>

                        {/* Navigation Click Zones */}
                        <div className="absolute inset-0 z-10 flex">
                            <div className="w-1/3 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrevSlide(); }} />
                            <div className="w-1/3 h-full cursor-none" /> {/* Pause Zone */}
                            <div className="w-1/3 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNextSlide(); }} />
                        </div>

                        {/* Content Area with Premium Typography */}
                        <div className="flex-1 flex flex-col relative z-20 overflow-y-auto no-scrollbar pointer-events-none">
                            {/* 🔥 HARD SPACER TO GUARANTEE GAP 🔥 */}
                            <div className="w-full h-32 sm:h-40 shrink-0 border border-transparent" />

                            <div className="p-4 mb-4 mt-auto">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeItem.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className={`pointer-events-auto mt-12 sm:mt-14 mb-auto space-y-6 p-6 sm:p-8 rounded-[2.5rem] border ${activeItem.editorialStyle ? 'bg-white/80 border-black/10' : 'bg-black/60 border-white/10'} shadow-2xl backdrop-blur-xl`}
                                    >
                                        {/* News Headline */}
                                        <h2 className={`text-2xl sm:text-3xl font-black leading-[1.2] ${activeItem.editorialStyle ? 'font-serif text-[#121212]' : 'text-white'} tracking-tight`}>
                                            {activeItem.title}
                                        </h2>

                                        {/* Summary Bullets */}
                                        <div className="space-y-5">
                                            {(activeItem.summary || activeItem.content).map((bullet, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.1 * i }}
                                                    className="flex gap-4"
                                                >
                                                    <div className="mt-2 w-2 h-2 rounded-full border-2 border-indigo-500 shrink-0 active-glow-small" style={{ borderColor: theme.color, boxShadow: `0 0 8px ${theme.color}44` }} />
                                                    <p className={`text-[15px] sm:text-[16px] leading-relaxed ${activeItem.editorialStyle ? 'text-black/80 font-serif' : 'text-white/80'} font-medium`}>
                                                        {bullet}
                                                    </p>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Mains Fodder Box - Elevate Design */}
                                        {activeItem.mainsFodder && (
                                            <div className={`p-6 rounded-[2rem] border-2 ${activeItem.editorialStyle ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'} backdrop-blur-md relative overflow-hidden group mt-10`}>
                                                <div className="absolute top-0 right-0 p-4 text-2xl opacity-10 group-hover:scale-125 transition-transform">🎯</div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className={`w-8 h-[2px] rounded-full`} style={{ backgroundColor: theme.color }} />
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${activeItem.editorialStyle ? 'text-black/40' : 'text-white/40'}`}>Mains Data Point</span>
                                                </div>
                                                <p className={`text-[14px] leading-relaxed ${activeItem.editorialStyle ? 'text-black/90 font-serif italic' : 'text-white/90 italic font-medium'}`}>
                                                    "{activeItem.mainsFodder}"
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Action Bar - More Premium Buttons */}
                        <div className="px-8 pb-12 z-30 flex flex-col gap-4 items-center">
                            {/* Source link - More prominent surgical button */}
                            {activeItem.sourceUrl && (
                                <a
                                    href={activeItem.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className={`w-full group relative h-14 overflow-hidden rounded-2xl transition-all active:scale-[0.98] border ${activeItem.editorialStyle ? 'border-black/20 text-black' : 'border-white/20 text-white'} flex items-center justify-center gap-3 backdrop-blur-md hover:bg-white/5`}
                                >
                                    <div className="flex items-center gap-3 relative z-10 transition-transform group-hover:scale-105">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Read Full Surgical Report</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" style={{ backgroundColor: theme.color }} />
                                        <span className="text-[11px] font-black uppercase tracking-widest">{activeItem.sourceName || 'News Source'}</span>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                    </div>
                                    <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                                </a>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleCaptureToVault(); }}
                                disabled={isCapturing}
                                className={`group relative w-full h-16 overflow-hidden rounded-2xl transition-all active:scale-[0.98] shadow-2xl`}
                            >
                                <div className={`absolute inset-0 ${activeItem.editorialStyle ? 'bg-black' : 'bg-white'} hover:opacity-90 transition-opacity`} />
                                <div className="relative h-full flex items-center justify-center gap-3">
                                    <span className={`text-[11px] font-black uppercase tracking-[0.25em] ${activeItem.editorialStyle ? 'text-white' : 'text-black'}`}>
                                        {isCapturing ? 'SYNCHRONIZING...' : 'ARCHIVE TO INTELLIGENCE VAULT'}
                                    </span>
                                    {!isCapturing && (
                                        <div className={`w-6 h-6 rounded-lg ${activeItem.editorialStyle ? 'bg-white/20' : 'bg-black/10'} flex items-center justify-center transition-transform group-hover:rotate-12`}>
                                            <span className="text-xs">📂</span>
                                        </div>
                                    )}
                                </div>
                                {isPaused && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute inset-x-0 bottom-0 h-[2px] bg-indigo-500"
                                        style={{ backgroundColor: theme.color }}
                                    />
                                )}
                            </button>

                            {/* Practice MCQs CTA — Connects Stories to Practice */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeStory();
                                    // Import srsStore and set subject filter
                                    const { useSRSStore } = require('@/store/srsStore');
                                    useSRSStore.getState().setFilters({
                                        subject: activeItem.subject,
                                        topic: null,
                                        chapter: null
                                    });
                                }}
                                className="w-full h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 backdrop-blur-md flex items-center justify-center gap-3 hover:bg-indigo-500/30 active:scale-[0.98] transition-all"
                            >
                                <span className="text-lg">🧠</span>
                                <span className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.2em]">
                                    Practice MCQs on {activeItem.subject}
                                </span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="w-full py-4 relative bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-0 left-1/4 w-1/2 h-full bg-indigo-500/5 blur-[60px] pointer-events-none" />

            <div className="flex gap-4 overflow-x-auto px-6 pb-2 scrollbar-none snap-x items-start relative z-10">
                {/* Profile Circle */}
                <div
                    onClick={() => router.push('/dashboard')}
                    className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 snap-start active:scale-90 transition-transform"
                >
                    <div className="w-[68px] h-[68px] rounded-full p-[2px] bg-white/10">
                        <div className="w-full h-full rounded-full bg-[#0b0e14] border border-white/10 flex items-center justify-center">
                            <span className="text-2xl">⚡</span>
                        </div>
                    </div>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest w-[70px] text-center truncate">Core</span>
                </div>

                {groupedStories.map((group, idx) => (
                    <div
                        key={group.subject}
                        onClick={() => openStoryGroup(idx)}
                        className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 snap-start active:scale-90 transition-transform"
                    >
                        <div className="w-[68px] h-[68px] rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-800 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                            <div className="w-full h-full rounded-full bg-[#0b0e14] border-[3px] border-[#0b0e14] flex items-center justify-center overflow-hidden">
                                <span className="text-3xl filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                                    {SUBJECT_ICONS[group.subject] || SUBJECT_ICONS['default']}
                                </span>
                            </div>
                        </div>
                        <span className="text-[10px] font-black text-white/80 uppercase tracking-widest w-[70px] text-center truncate">
                            {group.subject}
                        </span>
                    </div>
                ))}
            </div>

            {/* Portal for Overlay */}
            {mounted && typeof document !== 'undefined' && createPortal(overlayContent, document.body)}
        </div>
    );
}

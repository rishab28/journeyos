'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — The Library / Vault (High-Speed Search Enabled)
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { globalSearchCards } from '@/app/actions/cards';
import { triggerHaptic } from '@/lib/haptics';

const SUBJECTS = [
    'All', 'Polity', 'History', 'Geography', 'Economy', 'Enviro', 'Sci & Tech'
];

export default function LibraryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSubject, setActiveSubject] = useState('All');

    const handleSubjectSwitch = (sub: string) => {
        if (activeSubject === sub) return;
        triggerHaptic('light');
        setActiveSubject(sub);
    };
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length > 2) {
                setIsSearching(true);
                const res = await globalSearchCards(searchQuery, activeSubject);
                if (res.success) {
                    setSearchResults(res.cards || []);
                }
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, activeSubject]);

    return (
        <div className="w-full min-h-screen bg-[#050505] text-white pt-16 pb-24 overflow-y-auto">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00ffcc]/10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative z-10 px-6 max-w-lg mx-auto">

                {/* Header */}
                <div className="mb-8 mt-4 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-widest text-[#00ffcc] drop-shadow-[0_0_15px_rgba(0,255,204,0.3)]">
                            The Vault
                        </h1>
                        <p className="text-white/40 text-xs uppercase tracking-widest mt-1">
                            Curated Arsenals & Backtests
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6 relative">
                    <input
                        type="text"
                        placeholder="Search themes, PYQs or topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#00ffcc]/50 transition-all font-medium placeholder:text-white/20"
                    />
                    {isSearching && (
                        <div className="absolute right-4 top-4">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-lg">⚙️</motion.div>
                        </div>
                    )}
                </div>

                {/* Subject Chips (Horizontal Scroll) */}
                <div className="flex overflow-x-auto gap-3 pb-6 mb-4 scrollbar-none snap-x pointer-events-auto">
                    {SUBJECTS.map((sub) => (
                        <button
                            key={sub}
                            onClick={() => handleSubjectSwitch(sub)}
                            className={`snap-start whitespace-nowrap px-5 py-2 rounded-full border text-sm transition-all font-bold tracking-wider ${activeSubject === sub
                                ? 'bg-[#00ffcc] text-black border-transparent shadow-[0_0_15px_rgba(0,255,204,0.3)]'
                                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {sub}
                        </button>
                    ))}
                </div>

                {/* Search Results / Power Folders */}
                <div className="space-y-6">
                    {searchQuery.length > 2 ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Search Results ({searchResults.length})</h3>
                                <button onClick={() => setSearchQuery('')} className="text-[10px] text-[#00ffcc] uppercase font-bold">Clear</button>
                            </div>
                            <div className="grid gap-4">
                                <AnimatePresence mode="popLayout">
                                    {searchResults.map((card, idx) => (
                                        <motion.div
                                            key={card.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2, delay: idx * 0.03 }}
                                            className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#00ffcc]/30 transition-all cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[9px] bg-[#00ffcc]/10 text-[#00ffcc] px-2 py-0.5 rounded uppercase font-bold tracking-tighter">{card.subject}</span>
                                                <span className="text-[9px] text-white/20">{card.topic}</span>
                                            </div>
                                            <p className="text-sm text-white/80 font-medium line-clamp-2 group-hover:text-white transition-colors">{card.front}</p>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                            {searchResults.length === 0 && !isSearching && (
                                <div className="text-center py-20">
                                    <span className="text-4xl block mb-4 opacity-20">🕵️‍♂️</span>
                                    <p className="text-white/20 text-sm">No intel found for &quot;{searchQuery}&quot;</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* 1. Oracle Sniper List */}
                            <Link href="/war-room/oracle" className="block outline-none">
                                <motion.div
                                    whileHover={{ y: -2, scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-[#111] border border-[#00ffcc]/30 rounded-[2rem] p-6 relative overflow-hidden shadow-[0_0_30px_rgba(0,255,204,0.05)]"
                                >
                                    <div className="absolute -right-4 -top-4 text-8xl opacity-10 blur-[2px]">🎯</div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl">🎯</span>
                                            <h2 className="text-xl font-black text-white/90">Oracle Sniper List</h2>
                                        </div>
                                        <p className="text-white/50 text-sm leading-relaxed mb-4 font-mono w-5/6">
                                            The 2026 predictions derived from 15 years of recursive AI backtesting. High-probability logic.
                                        </p>
                                        <div className="text-[10px] text-[#00ffcc] uppercase tracking-widest font-bold bg-[#00ffcc]/10 w-max px-3 py-1 rounded">
                                            God-Mode Intel
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>

                            {/* 2. PYQ Archive */}
                            <div className="block outline-none opacity-80 cursor-not-allowed">
                                <div className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 relative overflow-hidden blur-[0.5px]">
                                    <div className="absolute -right-4 -top-4 text-8xl opacity-[0.03] blur-[2px]">📚</div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl">📚</span>
                                            <h2 className="text-xl font-bold text-white/80">PYQ Archive</h2>
                                        </div>
                                        <p className="text-white/40 text-sm leading-relaxed mb-4 w-5/6">
                                            The raw 15-year dataset. Filter by year, subject, and lethality.
                                        </p>
                                        <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold bg-white/5 w-max px-3 py-1 rounded border border-white/10 flex items-center gap-2">
                                            <span>🔒</span> Locked (Ingesting)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. CA Live-Wire */}
                            <div className="block outline-none opacity-80 cursor-not-allowed">
                                <div className="w-full bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] p-6 relative overflow-hidden blur-[0.5px]">
                                    <div className="absolute -right-4 -top-4 text-8xl opacity-[0.03] blur-[2px]">⚡</div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl">⚡</span>
                                            <h2 className="text-xl font-bold text-white/80">CA Live-Wire</h2>
                                        </div>
                                        <p className="text-white/40 text-sm leading-relaxed mb-4 w-5/6">
                                            Pattern-filtered current affairs mapping strict syllabus nodes.
                                        </p>
                                        <div className="text-[10px] text-emerald-500/50 uppercase tracking-widest font-bold bg-emerald-500/10 w-max px-3 py-1 rounded border border-emerald-500/20 flex items-center gap-2">
                                            <span>🔒</span> Preparing Feed
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

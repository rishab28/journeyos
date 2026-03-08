'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — The Library / Vault (High-Speed Search Enabled)
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import MentorChat from '@/components/mentor/MentorChat';
import { globalSearchCards, generateMissionBrief } from '@/app/actions/learner';
import { getConnectedIntel } from '@/app/actions/intel/intelGraph';
import { triggerHaptic } from '@/lib/core/haptics';
import MissionBriefPanel from '@/components/shared/MissionBriefPanel';
import VaultDMInbox from '@/components/vault/VaultDMInbox';
import { GlassCard } from '@/components/ui/GlassCard';
import { useProfileStore } from '@/store/profileStore';

const SUBJECTS = [
    'All', 'Polity', 'History', 'Geography', 'Economy', 'Enviro', 'Sci & Tech'
];

export default function LibraryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSubject, setActiveSubject] = useState('All');
    const [isMentorOpen, setIsMentorOpen] = useState(false);
    const { avatarUrl } = useProfileStore();

    const handleSubjectSwitch = (sub: string) => {
        if (activeSubject === sub) return;
        triggerHaptic('light');
        setActiveSubject(sub);
    };
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // ── Vault 2.0 State ──
    const [isBriefOpen, setIsBriefOpen] = useState(false);
    const [activeBrief, setActiveBrief] = useState({ briefing: '', nodeName: '', connections: [] });
    const [isBriefLoading, setIsBriefLoading] = useState(false);

    // ── DM Inbox State ──
    const [isDMInboxOpen, setIsDMInboxOpen] = useState(false);

    const handleNodeClick = async (nodeId: string, nodeName: string) => {
        triggerHaptic('medium');
        setIsBriefLoading(true);
        setIsBriefOpen(true);

        // Parallel fetch for Briefing and Causal Graph
        const [briefRes, graphRes] = await Promise.all([
            generateMissionBrief(nodeId),
            getConnectedIntel(nodeId)
        ]);

        if (briefRes.success) {
            setActiveBrief({
                briefing: briefRes.briefing || '',
                nodeName: briefRes.nodeName || nodeName,
                connections: graphRes.success ? graphRes.graph : []
            });
        }
        setIsBriefLoading(false);
    };

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
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="absolute left-6 top-8 sm:left-10 sm:top-10 z-50">
                <Link href="/dashboard" className="group">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group-hover:bg-white/10 group-hover:border-white/20 transition-all shadow-lg backdrop-blur-md">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        ) : (
                            <span className="text-sm group-hover:scale-110 transition-transform">👤</span>
                        )}
                    </div>
                </Link>
            </div>

            <div className="absolute right-6 top-8 sm:right-10 sm:top-10 z-50">
                <button
                    onClick={() => {
                        triggerHaptic('medium');
                        setIsMentorOpen(true);
                    }}
                    className="group"
                >
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all shadow-lg backdrop-blur-md">
                        <span className="text-sm group-hover:scale-110 transition-transform">🔍</span>
                    </div>
                </button>
            </div>

            <div className="relative z-10 px-6 max-w-lg mx-auto">

                {/* Header */}
                <div className="mb-8 mt-12 sm:mt-16 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-widest text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                            The Library
                        </h1>
                        <p className="text-white/40 text-xs uppercase tracking-widest mt-1">
                            Neural Node Archive
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
                        className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-medium placeholder:text-white/20"
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
                                ? 'bg-indigo-500 text-white border-transparent shadow-[0_0_15px_rgba(99,102,241,0.3)]'
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
                                <button onClick={() => setSearchQuery('')} className="text-[10px] text-indigo-400 uppercase font-bold">Clear</button>
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
                                            onClick={() => handleNodeClick(card.id, card.front)}
                                            className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded uppercase font-bold tracking-tighter">{card.subject}</span>
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
                                    className="w-full bg-[#111] border border-indigo-500/30 rounded-[2rem] p-6 relative overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.05)]"
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
                                        <div className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold bg-indigo-500/10 w-max px-3 py-1 rounded">
                                            God-Mode Intel
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>

                            {/* 2. PYQ Archive — UNLOCKED */}
                            <motion.div
                                whileHover={{ y: -2, scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSearchQuery('PYQ')}
                                className="w-full bg-[#111] border border-indigo-500/20 rounded-[2rem] p-6 relative overflow-hidden cursor-pointer hover:border-indigo-500/40 transition-all"
                            >
                                <div className="absolute -right-4 -top-4 text-8xl opacity-10 blur-[2px]">📚</div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">📚</span>
                                        <h2 className="text-xl font-bold text-white/90">PYQ Archive</h2>
                                    </div>
                                    <p className="text-white/50 text-sm leading-relaxed mb-4 w-5/6">
                                        The raw 15-year dataset. Filter by year, subject, and lethality.
                                    </p>
                                    <div className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold bg-indigo-500/10 w-max px-3 py-1 rounded border border-indigo-500/20 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                        Tap to Explore
                                    </div>
                                </div>
                            </motion.div>

                            {/* 3. CA Live-Wire — UNLOCKED */}
                            <Link href="/" className="block outline-none">
                                <motion.div
                                    whileHover={{ y: -2, scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-indigo-500/5 border border-indigo-500/20 rounded-[2rem] p-6 relative overflow-hidden hover:border-indigo-500/40 transition-all"
                                >
                                    <div className="absolute -right-4 -top-4 text-8xl opacity-[0.05] blur-[2px]">⚡</div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl">⚡</span>
                                            <h2 className="text-xl font-bold text-white/90">CA Live-Wire</h2>
                                        </div>
                                        <p className="text-white/50 text-sm leading-relaxed mb-4 w-5/6">
                                            Pattern-filtered current affairs mapping strict syllabus nodes.
                                        </p>
                                        <div className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold bg-indigo-500/10 w-max px-3 py-1 rounded border border-indigo-500/20 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                            Live Feed
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Mission Brief Slide-over */}
            <MissionBriefPanel
                isOpen={isBriefOpen}
                onClose={() => setIsBriefOpen(false)}
                briefing={isBriefLoading ? 'Synthesizing Strategic Intel...' : activeBrief.briefing}
                nodeName={activeBrief.nodeName}
                connections={activeBrief.connections}
            />

            <MentorChat isOpen={isMentorOpen} onClose={() => setIsMentorOpen(false)} />

            {/* Instagram Style DM Inbox Modal */}
            <VaultDMInbox isOpen={isDMInboxOpen} onClose={() => setIsDMInboxOpen(false)} />

            {/* Floating Message Icon */}
            {!isDMInboxOpen && (
                <div className="fixed bottom-24 left-6 z-40 sm:bottom-10 sm:left-10">
                    <button
                        onClick={() => {
                            triggerHaptic('medium');
                            setIsDMInboxOpen(true);
                        }}
                        className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center border-2 border-black hover:scale-105 active:scale-95 transition-transform relative group"
                    >
                        <span className="text-2xl">💬</span>
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-black"></div>
                    </button>
                    {/* Tooltip hint on hover (desktop) */}
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden sm:block">
                        Direct Messages
                    </div>
                </div>
            )}
        </div>
    );
}

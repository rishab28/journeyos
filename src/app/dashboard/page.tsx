'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Insights Dashboard
// Rank, Leaderboard, Memory Heatmap, Progress, Mastery
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DailyDashboard from '@/components/dashboard/DailyDashboard';
import SubjectMastery from '@/components/analytics/SubjectMastery';
import MemoryHeatmap from '@/components/analytics/MemoryHeatmap';
import MemoryLeakAlert from '@/components/intelligence/MemoryLeakAlert';
import SyllabusMap from '@/components/shared/SyllabusMap';
import FailureAudit from '@/components/intelligence/FailureAudit';
import AutonomousDashboard from '@/components/dashboard/AutonomousDashboard';
import StudyTools from '@/components/study/StudyTools';
import DeepIntelligence from '@/components/oracle/DeepIntelligence';
import BioSenseDashboard from '@/components/intelligence/BioSenseDashboard';
import ScorePredictor from '@/components/analytics/ScorePredictor';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProgressStore } from '@/store/progressStore';
import { useSRSStore } from '@/store/srsStore';
import TacticalNavigator from '@/components/navigation/TacticalNavigator';
import { GlassCard } from '@/components/ui/GlassCard';
import OfficerBiodata from '@/components/dashboard/OfficerBiodata';
import { useProfileStore } from '@/store/profileStore';

export default function DashboardPage() {
    const router = useRouter();
    const { rankProbability, totalReviewed, accuracy, currentStreak, bestStreak, upscIQ } = useProgressStore();
    const { avatarUrl } = useProfileStore();
    const cards = useSRSStore((s) => s.cards);
    const subjectMastery = useSRSStore((s) => s.subjectMastery);

    // Real Intelligence Saturation: avg mastery across all subjects (0–100)
    const intelligenceSaturation = useMemo(() => {
        const values = Object.values(subjectMastery);
        if (values.length === 0) return 0;
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }, [subjectMastery]);

    // Phase 29: Tabbed Navigation State
    const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'mastery' | 'explore' | 'tools' | 'biodata'>('overview');
    const [searchQuery, setSearchQuery] = useState('');

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const getRankTier = (prob: number) => {
        if (prob >= 70) return { label: 'Top 1% Rank Material', emoji: '🏆', color: '#6366f1' }; // Indigo
        if (prob >= 45) return { label: 'Strong Contender', emoji: '⚡', color: '#818cf8' }; // Light Indigo
        if (prob >= 20) return { label: 'Building Momentum', emoji: '🚀', color: '#94a3b8' }; // Slate
        return { label: 'Journey Begins', emoji: '🌱', color: '#ffffff' }; // White
    };

    const tier = getRankTier(rankProbability);

    // Aspirant Leaderboard — simulated percentile
    const getPercentile = () => {
        if (totalReviewed === 0) return 0;
        // Weighted: 60% accuracy, 40% volume (logarithmic)
        const accScore = accuracy / 100;
        const volScore = Math.min(Math.log(totalReviewed + 1) / Math.log(500), 1);
        const raw = (accScore * 0.6 + volScore * 0.4) * 100;
        return Math.min(Math.round(raw), 99);
    };

    const percentile = getPercentile();
    const aspirantRank = Math.max(1, Math.round(10000 * (1 - percentile / 100)));


    return (
        <main className="relative min-h-screen bg-[#050507] pb-32 overflow-x-hidden pt-8">
            <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8">
                {/* ── Minimalist Header ── */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="p-3 -ml-2 rounded-2xl glass-panel hover:bg-white/5 transition-all group">
                            <span className="text-xl group-hover:-translate-x-1 transition-transform inline-block text-white/40">←</span>
                        </Link>
                        <div>
                            <h1 className="text-[40px] sm:text-[48px] leading-none font-bold text-white tracking-tight">
                                Insights
                            </h1>
                            <p className="font-caps text-indigo-400/40 mt-2">NEURAL PERFORMANCE • v2.1</p>
                        </div>
                    </div>
                    {/* System/Admin Access */}
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="hidden sm:flex items-center gap-3 px-5 py-2.5 rounded-full glass-panel border-indigo-500/20 text-indigo-300 text-[10px] font-caps hover:bg-indigo-500/10 transition-all group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_12px_#6366f1]" />
                            Command
                        </Link>
                        {/* User Avatar Dashboard */}
                        <div className="w-12 h-12 rounded-2xl glass-panel p-0.5 border-white/5 relative overflow-hidden group">
                            <div className="w-full h-full rounded-2xl overflow-hidden">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Officer" className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-indigo-500/10">
                                        <span className="text-sm">⚡️</span>
                                    </div>
                                )}
                            </div>
                            <Link href="/admin" className="sm:hidden absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-[#050507] shadow-[0_0_12px_#6366f1]" />
                        </div>
                    </div>
                </div>

                {/* ── Tabbed Navigation ── */}
                <div className="flex gap-2 p-1.5 bg-white/[0.02] border border-white/[0.05] rounded-[24px] mb-10">
                    {(['overview', 'biodata', 'analytics', 'mastery', 'explore'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative flex-1 py-3.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] rounded-2xl transition-all ${activeTab === tab ? 'text-white' : 'text-white/30 hover:text-white/50'
                                }`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute inset-0 bg-white/[0.04] border border-white/5 rounded-2xl shadow-lg"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">{tab}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* ── BIODATA TAB ── */}
                    {activeTab === 'biodata' && (
                        <motion.div
                            key="biodata"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <OfficerBiodata />
                        </motion.div>
                    )}

                    {/* ── OVERVIEW TAB ── */}
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >

                            {/* ── Rank Probability Hero (Executive Glass) ── */}
                            <div className="relative overflow-hidden rounded-[40px] glass-panel p-10 border-white/5 group">
                                {/* Dynamic Glow Orb */}
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700" />

                                <div className="flex items-center justify-between mb-10 relative z-10">
                                    <div>
                                        <p className="text-[11px] font-caps text-indigo-300/40">Probability Vector</p>
                                        <p className="text-[64px] sm:text-[72px] font-black text-white tabular-nums leading-none mt-3 tracking-tighter">
                                            {rankProbability}<span className="text-[32px] text-white/20 ml-1">%</span>
                                        </p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div className="w-16 h-16 rounded-[24px] glass-panel border border-white/10 flex items-center justify-center text-3xl shadow-2xl mb-4 group-hover:scale-110 transition-transform duration-500">
                                            {tier.emoji}
                                        </div>
                                        <p className="text-[10px] font-caps tracking-[0.2em] text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                            {tier.label}
                                        </p>
                                    </div>
                                </div>

                                {/* ── Neural Progress Engine ── */}
                                <div className="space-y-5 relative z-10">
                                    <div className="relative h-2 rounded-full bg-white/[0.03] overflow-hidden">
                                        <motion.div
                                            className="absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r from-indigo-500/40 to-indigo-400"
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${Math.min(rankProbability, 100)}%` }}
                                            transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-full animate-shimmer-fast" />
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                        <p className="text-[10px] font-caps text-white/20">System Confidence</p>
                                        <p className="text-[10px] font-caps text-indigo-400/60 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                            -{Math.max(1, 18 - Math.floor(rankProbability / 10))}% Delta from Target
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Bento Grid Row 1 (Stats & AIR Predictor) ── */}
                            <div className="grid grid-cols-2 gap-5">
                                {/* Mini Stats Bento */}
                                <div className="rounded-[32px] glass-card-premium p-8">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-white/[0.04] pb-5">
                                            <p className="font-caps text-white/20 tracking-[0.2em] text-[10px]">ACCURACY</p>
                                            <p className="text-[32px] font-bold text-white tabular-nums tracking-tight">{accuracy}%</p>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-white/[0.04] pb-5">
                                            <p className="font-caps text-white/20 tracking-[0.2em] text-[10px]">REVIEWED</p>
                                            <p className="text-[32px] font-bold text-white tabular-nums tracking-tight">{totalReviewed}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="font-caps text-indigo-400/60 tracking-[0.2em] text-[10px]">STREAK</p>
                                            <p className="text-[32px] font-bold text-indigo-400 tabular-nums tracking-tight">{currentStreak}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* AIR Predictor Bento */}
                                <div className="rounded-[32px] glass-card-premium p-8 relative group overflow-hidden">
                                    <div className="absolute inset-0 bg-indigo-500/[0.02] group-hover:bg-indigo-500/[0.04] transition-colors" />
                                    <p className="font-caps text-white/20 tracking-[0.2em] text-[10px] mb-8 flex items-center justify-between relative z-10">
                                        AIR PREDICTOR
                                        <span className="text-[9px] px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black tracking-widest">LIVE</span>
                                    </p>
                                    {totalReviewed === 0 ? (
                                        <div className="h-full flex items-center justify-center relative z-10">
                                            <p className="font-caps text-white/10 tracking-[0.3em] text-[10px]">AWAITING NEURAL DATA</p>
                                        </div>
                                    ) : (
                                        <div className="relative z-10">
                                            <p className="text-[52px] leading-none font-bold text-white tabular-nums tracking-tighter">
                                                {aspirantRank.toLocaleString()}
                                            </p>
                                            <p className="font-caps text-white/30 text-[11px] mt-3 tracking-[0.1em]">
                                                PERCENTILE: {percentile}%
                                            </p>
                                            <div className="h-1.5 rounded-full bg-white/[0.03] overflow-hidden mt-10">
                                                <motion.div
                                                    className="h-full rounded-full bg-indigo-500/60"
                                                    initial={{ width: '0%' }}
                                                    animate={{ width: `${percentile}%` }}
                                                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Daily Progress Dashboard ── */}
                            <div className="rounded-[40px] glass-panel p-8 border border-white/5">
                                <DailyDashboard />
                            </div>

                            {/* ── Score Predictor (HIDDEN for now) ── */}
                            {/* <ScorePredictor /> */}

                        </motion.div>
                    )}

                    {/* ── ANALYTICS TAB ── */}
                    {activeTab === 'analytics' && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <div className="rounded-[40px] glass-panel p-8 relative overflow-hidden">
                                <BioSenseDashboard />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="p-8 rounded-[32px] glass-card-premium relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-30 transition-opacity text-2xl">🧠</div>
                                    <h4 className="font-caps text-white/20 tracking-[0.2em] text-[10px] mb-6 uppercase">INTELLIGENCE SATURATION</h4>
                                    <div className="flex items-end gap-2 text-white">
                                        <span className="text-[36px] font-bold leading-none tabular-nums">{intelligenceSaturation}<span className="text-sm opacity-20 ml-0.5">%</span></span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/[0.03] rounded-full mt-6 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${intelligenceSaturation}%` }}
                                            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                                            className="h-full bg-indigo-500/40"
                                        />
                                    </div>
                                </div>

                                <div className="p-8 rounded-[32px] glass-card-premium relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-30 transition-opacity text-2xl">🔗</div>
                                    <h4 className="font-caps text-white/20 tracking-[0.2em] text-[10px] mb-6 uppercase">NEURAL CARDS</h4>
                                    <div className="flex items-end gap-2 text-white/90">
                                        <span className="text-[36px] font-bold leading-none tabular-nums">{totalReviewed > 0 ? totalReviewed.toLocaleString() : cards.length}</span>
                                    </div>
                                    <p className="font-caps text-white/20 text-[9px] mt-6 tracking-[0.2em] uppercase">AGGREGATE REVIEWS</p>
                                </div>
                            </div>

                            <div className="rounded-[40px] glass-panel p-8 relative overflow-hidden border border-white/5">
                                <MemoryLeakAlert />
                            </div>

                            {/* ── Phase 32: Oracle Deep Intelligence ── */}
                            <div className="rounded-[40px] glass-panel p-8 relative overflow-hidden">
                                <p className="font-caps text-indigo-400 tracking-[0.2em] text-[10px] mb-8 flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                    ORACLE INTELLIGENCE V2.1
                                </p>
                                <DeepIntelligence />
                            </div>

                            {/* ── Failure Audit (Root Cause Analysis) ── */}
                            <div className="rounded-[40px] glass-panel p-8">
                                <p className="font-caps text-white/40 tracking-[0.2em] text-[10px] mb-6 flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-white/10" />
                                    FAILURE ROOT CAUSE
                                </p>
                                <FailureAudit />
                            </div>

                            {/* ── Memory Retention Heatmap ── */}
                            <div className="rounded-[40px] glass-panel p-8">
                                <p className="font-caps text-white/40 tracking-[0.2em] text-[10px] mb-6 flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-white/10" />
                                    NEURAL VOLUME MAP
                                </p>
                                <MemoryHeatmap />
                            </div>
                        </motion.div>
                    )}

                    {/* ── MASTERY TAB ── */}
                    {activeTab === 'mastery' && (
                        <motion.div
                            key="mastery"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {/* ── Subject Mastery ── */}
                            <div className="rounded-[40px] glass-panel p-10">
                                <p className="font-caps text-indigo-400 tracking-[0.3em] text-[10px] mb-8 flex items-center gap-3 uppercase">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
                                    Subject Mastery Coefficients
                                </p>
                                <SubjectMastery />
                                {(!mounted || totalReviewed === 0) && (
                                    <p className="font-caps text-white/20 tracking-[0.4em] text-[10px] text-center py-12 uppercase animate-pulse">
                                        SYNCHRONIZING NEURAL DATA...
                                    </p>
                                )}
                            </div>

                            {/* ── Granular Syllabus Tracker ── */}
                            <div className="rounded-[40px] glass-panel p-10">
                                <p className="font-caps text-white/40 tracking-[0.3em] text-[10px] mb-8 flex items-center gap-3 uppercase">
                                    <span className="w-2 h-2 rounded-full bg-white/20" />
                                    Syllabus Completion Delta
                                </p>
                                <SyllabusMap />
                            </div>
                        </motion.div>
                    )}

                    {/* ── TOOLS TAB ── */}
                    {activeTab === 'tools' && (
                        <motion.div
                            key="tools"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <div className="rounded-[40px] glass-panel p-10 relative overflow-hidden">
                                <p className="font-caps text-indigo-400 tracking-[0.3em] text-[10px] mb-10 flex items-center gap-3 uppercase">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
                                    Brain Vault: Visual IQ
                                </p>
                                <StudyTools />
                            </div>
                        </motion.div>
                    )}

                    {/* ── EXPLORE TAB ── */}
                    {activeTab === 'explore' && (
                        <motion.div
                            key="explore"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8"
                        >
                            {/* Command Search */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-indigo-500/5 rounded-[40px] blur-3xl group-focus-within:bg-indigo-500/15 transition-all duration-700" />
                                <div className="relative flex items-center px-8 py-7 rounded-[40px] glass-panel border-white/5 group-focus-within:border-indigo-500/40 group-focus-within:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-500">
                                    <span className="text-2xl mr-5 opacity-40 group-focus-within:opacity-100 transition-opacity grayscale group-focus-within:grayscale-0">🔭</span>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search Intelligence, PYQs, or Topics..."
                                        className="bg-transparent border-none outline-none text-[17px] font-bold text-white placeholder:text-white/20 w-full tracking-tight"
                                    />
                                    <div className="flex items-center gap-5 ml-4">
                                        <div className="w-[1px] h-6 bg-white/10" />
                                        <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                                            <span className="font-caps text-indigo-400 tracking-[0.25em] text-[9px] font-black">TACTICAL</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tactical Navigator */}
                            <div className="rounded-[40px] glass-panel p-8">
                                <TacticalNavigator onTopicSelect={() => router.push('/')} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}

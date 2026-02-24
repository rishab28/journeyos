'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Insights Dashboard
// Rank, Leaderboard, Memory Heatmap, Progress, Mastery
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
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
import Link from 'next/link';
import { useProgressStore } from '@/store/progressStore';
import { useSRSStore } from '@/store/srsStore';

export default function DashboardPage() {
    const { rankProbability, totalReviewed, accuracy, currentStreak, bestStreak, upscIQ } = useProgressStore();
    const cards = useSRSStore((s) => s.cards);

    // Phase 29: Tabbed Navigation State
    const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'mastery' | 'tools'>('overview');

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const getRankTier = (prob: number) => {
        if (prob >= 70) return { label: 'Top 1% Rank Material', emoji: '🏆', color: '#10b981' };
        if (prob >= 45) return { label: 'Strong Contender', emoji: '⚡', color: '#f59e0b' };
        if (prob >= 20) return { label: 'Building Momentum', emoji: '🚀', color: '#f97316' };
        return { label: 'Journey Begins', emoji: '🌱', color: '#8b5cf6' };
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
        <main className="relative min-h-screen bg-black pb-32 overflow-x-hidden pt-8">
            {/* Pure Black Ambient background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8">
                {/* ── Minimalist Header ── */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-[32px] sm:text-[40px] leading-[1.1] font-black text-white tracking-[-0.03em]" style={{ fontFamily: 'var(--font-outfit)' }}>
                            Insights
                        </h1>
                        <p className="text-[11px] sm:text-[12px] text-white/40 mt-1.5 font-extrabold tracking-[0.25em] uppercase">PERFORMANCE INTELLIGENCE</p>
                    </div>
                    {/* System/Admin Access */}
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            War Room
                        </Link>
                        {/* User Avatar Placeholder */}
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative">
                            <span className="text-sm">⚡️</span>
                            {/* Mobile War Room Dot */}
                            <Link href="/admin" className="sm:hidden absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#0a0a0a] shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                        </div>
                    </div>
                </div>

                {/* ── Tabbed Navigation ── */}
                <div className="flex gap-2 p-1.5 bg-white/[0.03] border border-white/[0.05] rounded-2xl mb-8 overflow-x-auto no-scrollbar">
                    {(['overview', 'analytics', 'mastery', 'tools'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative flex-1 min-w-[80px] py-3 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.2em] rounded-xl transition-colors ${activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/60'
                                }`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute inset-0 bg-white/10 rounded-xl"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">{tab}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* ── OVERVIEW TAB ── */}
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >

                            {/* ── Rank Probability Hero (Bento Style) ── */}
                            <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0a0a0a] p-6 sm:p-8 shadow-2xl">
                                {/* Subtle Top Inner Glow */}
                                <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-50" />

                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-[11px] text-white/40 uppercase tracking-[0.25em] font-extrabold">Rank Probability</p>
                                        <p className="text-[48px] sm:text-[56px] font-black text-white tabular-nums leading-none mt-2 tracking-[-0.04em] shadow-sm">
                                            {rankProbability}<span className="text-[28px] sm:text-[32px] text-white/40 tracking-[-0.02em] ml-1">%</span>
                                        </p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-[22px] shadow-inner mb-2">
                                            {tier.emoji}
                                        </div>
                                        <p className="text-[11px] uppercase font-extrabold tracking-[0.2em]" style={{ color: tier.color }}>
                                            {tier.label}
                                        </p>
                                    </div>
                                </div>

                                {/* ── Rank & Shadow Bar ── */}
                                <div className="space-y-2.5">
                                    <div className="relative h-2 rounded-full bg-white/[0.05] overflow-hidden">
                                        {/* Ghost Shadow (Rank 1 Benchmark) */}
                                        <motion.div
                                            className="absolute top-0 bottom-0 left-0 rounded-full bg-white/15"
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${Math.min(rankProbability + 18, 98)}%` }}
                                            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                                        />
                                        {/* User Progress */}
                                        <motion.div
                                            className="absolute top-0 bottom-0 left-0 rounded-full"
                                            style={{
                                                background: `linear-gradient(90deg, #7c3aed, ${tier.color})`,
                                                boxShadow: `0 0 12px ${tier.color}40`,
                                            }}
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${Math.min(rankProbability, 100)}%` }}
                                            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-extrabold">Your Pace</p>
                                        <p className="text-[10px] text-white/50 font-bold uppercase tracking-[0.1em]">
                                            👻 -{Math.max(1, 18 - Math.floor(rankProbability / 10))}% behind Rank 1
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Bento Grid Row 1 (Stats & AIR Predictor) ── */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Mini Stats Bento */}
                                <div className="rounded-3xl border border-white/[0.06] bg-[#0a0a0a] p-5 sm:p-6 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] sm:text-[11px] text-white/40 uppercase tracking-[0.2em] font-extrabold">Accuracy</p>
                                            <p className="text-[22px] sm:text-[24px] tracking-[-0.02em] font-black text-white tabular-nums">{accuracy}%</p>
                                        </div>
                                        <div className="flex items-center justify-between pointer-events-auto">
                                            <p className="text-[10px] sm:text-[11px] text-white/40 uppercase tracking-[0.2em] font-extrabold">Reviewed</p>
                                            <p className="text-[22px] sm:text-[24px] tracking-[-0.02em] font-black text-white tabular-nums">{totalReviewed}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] sm:text-[11px] text-amber-500/60 uppercase tracking-[0.2em] font-extrabold">Streak</p>
                                            <p className="text-[22px] sm:text-[24px] tracking-[-0.02em] font-black text-amber-500 tabular-nums">{currentStreak}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* AIR Predictor Bento */}
                                <div className="rounded-3xl border border-white/[0.06] bg-[#0a0a0a] p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full" />
                                    <p className="text-[10px] sm:text-[11px] font-extrabold text-emerald-400/80 uppercase tracking-[0.2em] mb-3">
                                        AIR Predictor
                                    </p>
                                    {totalReviewed === 0 ? (
                                        <p className="text-[10px] font-extrabold text-white/30 uppercase tracking-[0.2em] text-center mt-2">Needs Data</p>
                                    ) : (
                                        <div>
                                            <p className="text-[32px] sm:text-[36px] leading-[1.1] font-black text-white tabular-nums tracking-[-0.03em]">
                                                {aspirantRank.toLocaleString()}
                                            </p>
                                            <p className="text-[11px] text-white/40 font-extrabold uppercase tracking-[0.15em] mt-1">
                                                Top {Math.max(1, 100 - percentile)}%
                                            </p>
                                            <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden mt-4">
                                                <motion.div
                                                    className="h-full rounded-full bg-emerald-500"
                                                    initial={{ width: '0%' }}
                                                    animate={{ width: `${percentile}%` }}
                                                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Daily Progress Dashboard ── */}
                            <div className="rounded-3xl border border-white/[0.06] bg-[#0a0a0a] p-5 sm:p-6">
                                <DailyDashboard />
                            </div>

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
                            className="space-y-4"
                        >
                            <div className="rounded-3xl border border-rose-500/[0.15] bg-[#0a0a0a] p-5 sm:p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full" />
                                <MemoryLeakAlert />
                            </div>

                            {/* ── Phase 32: Oracle Deep Intelligence ── */}
                            <div className="rounded-3xl border border-white/[0.06] bg-[#0a0a0a] p-5 sm:p-6 shadow-xl relative overflow-hidden">
                                <p className="text-[10px] font-bold text-[#00ffcc] uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] shadow-[0_0_8px_#00ffcc]" />
                                    Oracle Intelligence (V2.1)
                                </p>
                                <DeepIntelligence />
                            </div>

                            {/* ── Failure Audit (Root Cause Analysis) ── */}
                            <div className="rounded-3xl border border-white/[0.06] bg-[#0a0a0a] p-5 sm:p-6 shadow-xl">
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                    Failure Root Cause
                                </p>
                                <FailureAudit />
                            </div>

                            {/* ── Memory Retention Heatmap ── */}
                            <div className="rounded-3xl border border-white/[0.06] bg-[#0a0a0a] p-5 sm:p-6 shadow-xl">
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    Neural Volume
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
                            className="space-y-4"
                        >
                            {/* ── Subject Mastery ── */}
                            <div className="rounded-3xl border border-white/[0.06] bg-[#0a0a0a] p-5 sm:p-6 shadow-xl">
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    Subject Mastery
                                </p>
                                <SubjectMastery />
                                {(!mounted || totalReviewed === 0) && (
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium text-center py-6">
                                        No Data Available
                                    </p>
                                )}
                            </div>

                            {/* ── Granular Syllabus Tracker ── */}
                            <div className="rounded-3xl border border-white/[0.06] bg-[#0a0a0a] p-5 sm:p-6 shadow-xl">
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Syllabus Completion
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
                            className="space-y-4"
                        >
                            <div className="rounded-3xl border border-white/[0.06] bg-[#0a0a0a] p-5 sm:p-6 shadow-xl">
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcc]" />
                                    Brain Vault: Visual IQ
                                </p>
                                <StudyTools />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}

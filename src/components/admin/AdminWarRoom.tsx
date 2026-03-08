'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin War Room (Aerial Command Deck)
// High-fidelity system monitoring and operational control
// ═══════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AdminWarRoom() {
    return (
        <div className="w-full space-y-16">

            {/* 1. Macro Global Metrics (The HUD) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Aspirants', val: '12,480', sub: '+12% this week', color: '#a855f7' },
                    { label: 'Avg System IQ', val: '64.2', sub: 'Up from 58.0', color: '#818cf8' },
                    { label: 'Content Saturation', val: '82%', sub: '42k Cards Active', color: '#3b82f6' },
                    { label: 'Oracle Precision', val: '94%', sub: '2024 Calibrated', color: '#f59e0b' },
                ].map((stat, i) => (
                    <div key={i} className="glass-card rounded-[2rem] p-8 relative overflow-hidden group transition-all hover:scale-[1.02] hover:border-white/20">
                        <div className="absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-20 rounded-full" style={{ backgroundColor: stat.color }} />
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                        <p className="text-4xl font-extrabold text-white tracking-tight mb-2">{stat.val}</p>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stat.color }} />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. Topographic System Map (Luxury View) */}
            <div className="glass-card rounded-[3rem] p-12 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tight">System Topography</h3>
                        <p className="text-sm text-white/40 mt-1 font-medium italic">Global content density and mastery mapping</p>
                    </div>
                    <div className="flex items-center gap-6 px-6 py-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-xl">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" /> <span className="text-[10px] font-bold uppercase text-white/60 tracking-widest">Saturated</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" /> <span className="text-[10px] font-bold uppercase text-white/60 tracking-widest">Growth</span></div>
                    </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-4">
                    {[...Array(48)].map((_, i) => {
                        const saturation = Math.random();
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.01 }}
                                className="aspect-square rounded-2xl border border-white/5 relative group cursor-help transition-all hover:scale-110 hover:z-20"
                                style={{
                                    backgroundColor: saturation > 0.8 ? 'rgba(99, 102, 241, 0.15)' : saturation > 0.5 ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                                    boxShadow: saturation > 0.8 ? 'inset 0 0 20px rgba(99,102,241,0.1)' : 'none'
                                }}
                            >
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md rounded-2xl">
                                    <span className="text-[10px] font-black text-white">{Math.round(saturation * 100)}%</span>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>

            {/* 3. Engine Pipelines & Command Deck */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Engine Pipelines */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.3em] pl-6 italic">Active Operations</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Smart Ingestor (Flash)', status: 'OPERATIONAL', load: 42, color: '#6366f1' },
                            { name: 'Oracle Backtester', status: 'STANDBY', load: 12, color: '#f59e0b' },
                            { name: 'Review QA Buffer', status: 'HEAVY LOAD', load: 88, color: '#f43f5e' },
                        ].map((pipe, i) => (
                            <div key={i} className="glass-card rounded-[2rem] p-8 flex items-center justify-between transition-all hover:bg-white/[0.05]">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                                        {pipe.status === 'OPERATIONAL' ? '⚡' : pipe.status === 'STANDBY' ? '💎' : '🔥'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white tracking-tight">{pipe.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: pipe.color }} />
                                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-40">{pipe.status}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="w-48 h-2 rounded-full bg-black/40 p-0.5 overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                            style={{ backgroundColor: pipe.color }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pipe.load}%` }}
                                            transition={{ duration: 1, delay: 0.5 }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-white/40 min-w-[3ch]">{pipe.load}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tactical Command Deck */}
                <div className="space-y-6">
                    <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.3em] pl-6 italic">Control Suite</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Ingest', icon: '📥', href: '/admin/ingest' },
                            { label: 'Neural', icon: '🧠', href: '/admin/ingestor' },
                            { label: 'Oracle', icon: '💎', href: '/admin/oracle' },
                            { label: 'Review', icon: '✨', href: '/admin/review' },
                            { label: 'Sources', icon: '🏛️', href: '/admin/vault' },
                            { label: 'News', icon: '📰', href: '/admin/news' },
                            { label: 'Audit', icon: '🕵️', href: '/admin/review' },
                        ].map((btn, i) => (
                            <Link key={i} href={btn.href}>
                                <motion.div
                                    whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.06)' }}
                                    whileTap={{ scale: 0.95 }}
                                    className="h-28 glass-card rounded-[2rem] flex flex-col items-center justify-center gap-3 group cursor-pointer transition-all"
                                >
                                    <span className="text-3xl group-hover:scale-110 transition-transform filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{btn.icon}</span>
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] group-hover:text-white/80 transition-colors">{btn.label}</span>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    );
}

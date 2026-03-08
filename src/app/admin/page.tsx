'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin Master Control (Command Suite)
// Central Hub for Global Operations
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, cloneElement, ReactElement } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Database,
    Zap,
    Activity,
    LayoutDashboard,
    Settings,
    FileSearch,
    BrainCircuit,
    RefreshCw,
    CheckCircle2
} from 'lucide-react';
import { scrapeAndSyncStories } from '@/app/actions/admin/stories';

const ADMIN_MODULES = [
    {
        id: 'war-room',
        title: 'Tactical War Room',
        desc: 'Real-time telemetry & KPI monitoring.',
        href: '/admin/war-room',
        icon: <Activity className="text-white/40" />,
        color: 'white',
        hotkey: 'W'
    },
    {
        id: 'users',
        title: 'User Control',
        desc: 'Manage aspirants and cognitive profiles.',
        href: '/admin/users',
        icon: <Users className="text-indigo-400" />,
        color: 'indigo',
        hotkey: 'U'
    },
    {
        id: 'vault',
        title: 'Intel Browser',
        desc: 'Search, filter and edit card repository.',
        href: '/admin/vault',
        icon: <Database className="text-white/40" />,
        color: 'white',
        hotkey: 'V'
    },
    {
        id: 'review',
        title: 'Intel Review',
        desc: 'Verify and approve AI-extracted content.',
        href: '/admin/review',
        icon: <CheckCircle2 className="text-indigo-400" />,
        color: 'indigo',
        hotkey: 'R'
    },
    {
        id: 'processor',
        title: 'Neural Processor',
        desc: 'AI Synthesis & Card Generation Queue.',
        href: '/admin/processor',
        icon: <BrainCircuit className="text-white/40" />,
        color: 'white',
        hotkey: 'P'
    },
    {
        id: 'ingest',
        title: 'Intelligence Ingest',
        desc: 'Batch upload and AI card generation.',
        href: '/admin/ingest',
        icon: <Zap className="text-indigo-400" />,
        color: 'indigo',
        hotkey: 'I'
    },
    {
        id: 'sources',
        title: 'Source Archive',
        desc: 'Manage uploaded PDFs and materials.',
        href: '/admin/sources',
        icon: <FileSearch className="text-white/40" />,
        color: 'white',
        hotkey: 'A'
    },
    {
        id: 'factory',
        title: 'Content Factory',
        desc: 'Manual card creation & template design.',
        href: '/admin/content-factory',
        icon: <Zap className="text-indigo-400" />,
        color: 'indigo',
        hotkey: 'F'
    },
    {
        id: 'news',
        title: 'News Pulse',
        desc: 'Manage RSS feeds & global news sync.',
        href: '/admin/news',
        icon: <LayoutDashboard className="text-white/40" />,
        color: 'white',
        hotkey: 'N'
    },
    {
        id: 'oracle',
        title: 'Oracle Engine',
        desc: 'Engine backtesting & theme predictions.',
        href: '/admin/oracle',
        icon: <BrainCircuit className="text-indigo-400" />,
        color: 'indigo',
        hotkey: 'O'
    },
    {
        id: 'feedback',
        title: 'User Feedback',
        desc: 'Monitor support tickets & user reports.',
        href: '/admin/feedback',
        icon: <Activity className="text-white/40" />,
        color: 'white',
        hotkey: 'B'
    },
    {
        id: 'settings',
        title: 'System Settings',
        desc: 'Global AI & engine tactical overrides.',
        href: '/admin/settings',
        icon: <Settings className="text-indigo-400" />,
        color: 'indigo',
        hotkey: 'S'
    }
];

export default function AdminDashboardPage() {
    return (
        <div className="w-full relative">
            <header className="mb-20">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 rounded-full glass-panel border-indigo-500/20 bg-indigo-500/5">
                            <span className="font-caps text-[9px] text-indigo-400 tracking-[0.3em] font-black uppercase">SYSTEM_STATE:STABLE</span>
                        </div>
                        <div className="h-[1px] w-12 bg-white/10"></div>
                        <span className="font-caps text-[9px] font-black text-indigo-400/60 uppercase tracking-[0.3em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_#6366f1]"></span>
                            NEXUS SECURE_NODE
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        <SyncTrigger />
                        <div className="text-right border-l border-white/10 pl-6">
                            <p className="font-caps text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">CORTEX_VER</p>
                            <p className="font-caps text-[12px] font-black text-white tracking-widest">4.2.0-EXEC</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-6xl font-bold font-outfit text-white tracking-tighter uppercase leading-none mb-4">
                            Command <span className="text-white/10">Suite</span>
                        </h1>
                        <p className="text-[13px] font-medium text-white/40 tracking-tight max-w-xl">
                            Strategic oversight and neural orchestration. Authorized access to global intelligence streams and automated generation protocols.
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ADMIN_MODULES.map((module, idx) => (
                    <motion.div
                        key={module.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        <Link href={module.href} className="group block h-full">
                            <div className="h-full glass-card-premium border-white/[0.03] p-8 hover:border-indigo-500/30 transition-all relative overflow-hidden flex flex-col justify-between min-h-[280px]">
                                {/* Design Accents */}
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
                                    <span className="text-8xl font-black italic select-none font-outfit">0{idx + 1}</span>
                                </div>
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />

                                <div>
                                    <div className="w-16 h-16 rounded-[24px] glass-panel border-white/10 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-indigo-500/5 group-hover:border-indigo-500/30 transition-all shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                                        {cloneElement(module.icon as ReactElement, { size: 28, className: 'text-white' } as any)}
                                    </div>
                                    <h3 className="text-xl font-bold font-outfit text-white uppercase tracking-tight mb-3 group-hover:translate-x-1 transition-transform">
                                        {module.title}
                                    </h3>
                                    <p className="text-white/40 text-[12px] font-medium leading-relaxed tracking-tight group-hover:text-white/60 transition-colors">
                                        {module.desc}
                                    </p>
                                </div>

                                <div className="mt-12 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-2">
                                        <span className="font-caps text-[9px] font-black text-white/20 border border-white/5 bg-white/[0.02] px-2.5 py-1 rounded-lg uppercase tracking-widest group-hover:text-indigo-400 group-hover:border-indigo-400/30 transition-all">
                                            HK / {module.hotkey}
                                        </span>
                                    </div>
                                    <div className="w-10 h-10 rounded-full glass-panel border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all shadow-lg group-active:scale-90">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            <footer className="mt-32 pt-12 border-t border-white/[0.05] flex justify-between items-center text-white/20">
                <div className="flex items-center gap-6">
                    <p className="font-caps text-[10px] font-black uppercase tracking-[0.4em]">JOURNEYOS_INTELLIGENCE_NETWORK</p>
                    <div className="h-4 w-[1px] bg-white/10"></div>
                    <p className="font-caps text-[10px] font-black uppercase tracking-[0.4em] text-white/10">EST. 2026</p>
                </div>
                <div className="flex gap-12">
                    <div className="flex flex-col items-end">
                        <span className="font-caps text-[8px] font-black uppercase tracking-widest mb-2">CORTEX LOAD</span>
                        <div className="w-32 h-1.5 bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05]">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '42%' }}
                                className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"
                            />
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function SyncTrigger() {
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [lastSync, setLastSync] = React.useState<{ count: number; time: string } | null>(null);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await scrapeAndSyncStories();
            if (res.success) {
                setLastSync({ count: res.count || 0, time: new Date().toLocaleTimeString() });
            } else {
                alert('Sync failed: ' + res.error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="flex items-center gap-6">
            {lastSync && (
                <div className="flex flex-col items-end animate-in fade-in slide-in-from-right-4 transition-all">
                    <span className="font-caps text-[9px] font-black text-indigo-400 uppercase tracking-widest">CYCLE_COMPLETE</span>
                    <span className="font-caps text-[8px] font-bold text-white/20 uppercase tracking-widest">+{lastSync.count} UNITS @ {lastSync.time}</span>
                </div>
            )}
            <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`flex items-center gap-3 px-6 py-3 rounded-[18px] border transition-all active:scale-95 ${isSyncing
                    ? 'glass-panel border-white/10 text-white/20 cursor-wait'
                    : 'glass-panel border-indigo-500/30 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] shadow-lg'
                    }`}
            >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                <span className="font-caps text-[11px] font-black uppercase tracking-[0.2em]">
                    {isSyncing ? 'SYNCING_INTEL...' : 'SYNC_NEWS_PULSE'}
                </span>
            </button>
        </div>
    );
}

function ChevronRight({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}

'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin Master Control (Command Suite)
// Central Hub for Global Operations
// ═══════════════════════════════════════════════════════════

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
        icon: <Activity className="text-fuchsia-400" />,
        color: 'fuchsia',
        hotkey: 'W'
    },
    {
        id: 'users',
        title: 'Student Ops',
        desc: 'Search & manage user cognitive profiles.',
        href: '/admin/users',
        icon: <Users className="text-indigo-400" />,
        color: 'indigo',
        hotkey: 'U'
    },
    {
        id: 'vault',
        title: 'Intel Browser',
        desc: 'Search, filter and edit card repository.',
        href: '/admin/vault/browser',
        icon: <Database className="text-emerald-400" />,
        color: 'emerald',
        hotkey: 'B'
    },
    {
        id: 'oracle',
        title: 'Oracle Engine',
        desc: 'Engine backtesting & theme predictions.',
        href: '/admin/oracle',
        icon: <BrainCircuit className="text-amber-400" />,
        color: 'amber',
        hotkey: 'O'
    },
    {
        id: 'ingest',
        title: 'Intelligence Ingest',
        desc: 'Batch upload and AI card generation.',
        href: '/admin/ingest',
        icon: <Zap className="text-sky-400" />,
        color: 'sky',
        hotkey: 'I'
    },
    {
        id: 'factory',
        title: 'Content Factory',
        desc: 'Autonomous AI Subject Flashcard Generation.',
        href: '/admin/content-factory',
        icon: <Zap className="text-emerald-500" />,
        color: 'emerald',
        hotkey: 'F'
    },
    {
        id: 'settings',
        title: 'System Settings',
        desc: 'Global AI & engine tactical overrides.',
        href: '/admin/settings',
        icon: <Settings className="text-slate-400" />,
        color: 'slate',
        hotkey: 'S'
    }
];

export default function AdminDashboardPage() {
    return (
        <div className="w-full min-h-screen bg-[#050505] text-white p-6 md:p-12 relative overflow-hidden">
            {/* Ambient Base Layer */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative z-10 max-w-7xl mx-auto">
                <header className="mb-16">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Authorized Access Only</span>
                            <div className="h-px w-12 bg-white/10"></div>
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                Nexus Secure
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <SyncTrigger />
                        </div>
                    </div>
                    <div className="flex justify-between items-end">
                        <h1 className="text-5xl font-black uppercase tracking-tighter">
                            Command <span className="text-white/20">Suite</span>
                        </h1>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">System Version</p>
                            <p className="text-sm font-black text-white">2.8.0-PROPER</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ADMIN_MODULES.map((module, idx) => (
                        <motion.div
                            key={module.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Link href={module.href} className="group block h-full">
                                <div className="h-full bg-[#0c0c0c] border border-white/10 rounded-3xl p-8 hover:border-white/20 hover:bg-[#111] transition-all relative overflow-hidden flex flex-col justify-between">
                                    {/* Design Accents */}
                                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
                                        <span className="text-6xl font-black italic select-none">0{idx + 1}</span>
                                    </div>
                                    <div className={`absolute bottom-0 right-0 w-32 h-32 bg-${module.color}-500 blur-3xl opacity-0 group-hover:opacity-5 transition-opacity rounded-full translate-x-10 translate-y-10`} />

                                    <div>
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                                            {module.icon}
                                        </div>
                                        <h3 className="text-xl font-black uppercase tracking-wider mb-2 group-hover:translate-x-1 transition-transform">
                                            {module.title}
                                        </h3>
                                        <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                                            {module.desc}
                                        </p>
                                    </div>

                                    <div className="mt-12 flex items-center justify-between">
                                        <span className="text-[9px] font-black text-white/20 border border-white/10 px-2 py-1 rounded">
                                            HK / {module.hotkey}
                                        </span>
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <footer className="mt-20 pt-10 border-t border-white/5 flex justify-between items-center text-white/20">
                    <p className="text-[10px] font-black uppercase tracking-widest">JourneyOS Intelligence Network</p>
                    <div className="flex gap-8">
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black uppercase mb-1">Cortex Load</span>
                            <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '42%' }}
                                    className="h-full bg-emerald-500"
                                />
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
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
        <div className="flex items-center gap-4">
            {lastSync && (
                <div className="flex flex-col items-end mr-2 animate-in fade-in slide-in-from-right-2">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Cycle Complete</span>
                    <span className="text-[8px] font-bold text-white/20 uppercase">+{lastSync.count} Units @ {lastSync.time}</span>
                </div>
            )}
            <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isSyncing
                    ? 'bg-white/5 border-white/10 text-white/20 cursor-wait'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40'
                    }`}
            >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                    {isSyncing ? 'Syncing Intel...' : 'Sync News Pulse'}
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

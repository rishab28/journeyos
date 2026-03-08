'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin War Room (The Panopticon)
// Deep KPI Telemetry and User Tracking Dashboard
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Users, Flame, BrainCircuit, RefreshCcw, Hand, ChevronRight, User, Globe, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { fetchGlobalTelemetry, fetchActivityTrend, fetchAllUsers, fetchUserTelemetry, fetchPipelineHealth, GlobalTelemetry, ActivityTrend, UserSummary, UserTelemetryLog, PipelineHealth } from '@/app/actions/admin';
import Link from 'next/link';

export default function PanopticonWarRoom() {
    const [telemetry, setTelemetry] = useState<GlobalTelemetry | null>(null);
    const [trendData, setTrendData] = useState<ActivityTrend[]>([]);
    const [pipelineHealth, setPipelineHealth] = useState<PipelineHealth | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        const [metricsRes, trendRes, healthRes] = await Promise.all([
            fetchGlobalTelemetry(),
            fetchActivityTrend(),
            fetchPipelineHealth()
        ]);

        if (metricsRes.success && metricsRes.data) setTelemetry(metricsRes.data);
        if (trendRes.success && trendRes.data) setTrendData(trendRes.data);
        if (healthRes.success && healthRes.data) setPipelineHealth(healthRes.data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Recharts Custom Tooltip (for dark neon aesthetic)
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#111] border border-white/10 p-3 rounded-xl shadow-xl">
                    <p className="text-white/50 text-[10px] uppercase tracking-widest mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm font-bold flex items-center gap-2" style={{ color: entry.color }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-10 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-white/5 pb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.15)]">
                        <Activity size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-widest text-fuchsia-400 drop-shadow-md">
                            The Panopticon
                        </h1>
                        <p className="text-white/50 text-xs tracking-widest uppercase mt-1">
                            Live Telemetry & Cognitive Yield Matrix
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={loadData} className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
                        <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
                        Sync Data
                    </button>
                    <Link href="/admin/sources" className="px-5 py-2.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-xs font-bold uppercase tracking-widest transition-colors">
                        To Vault
                    </Link>
                </div>
            </div>

            {isLoading && !telemetry ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="w-8 h-8 rounded-full border-2 border-fuchsia-500/30 border-t-fuchsia-500 animate-spin" />
                    <span className="text-white/40 text-xs uppercase tracking-widest font-bold">Establishing Secure Link to Edge...</span>
                </div>
            ) : telemetry ? (
                <>
                    {/* Top KPI row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <MetricCard title="Total Users" value={telemetry.totalUsers} icon={<Users size={20} />} color="text-indigo-400" bg="bg-indigo-500/10" border="border-indigo-500/20" />
                        <MetricCard title="Daily Active (DAU)" value={telemetry.dau} icon={<Activity size={20} />} color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" />
                        <MetricCard title="Day-7 Retention" value={`${telemetry.retentionRate}%`} icon={<RefreshCcw size={20} />} color="text-amber-400" bg="bg-amber-500/10" border="border-amber-500/20" />
                        <MetricCard title="Cognitive Swipes" value={telemetry.totalSwipes} icon={<Hand size={20} />} color="text-fuchsia-400" bg="bg-fuchsia-500/10" border="border-fuchsia-500/20" />
                    </div>

                    {/* Pipeline Health Pulse */}
                    <div className="mb-10">
                        <PipelinePulse health={pipelineHealth} />
                    </div>

                    {/* Secondary KPI Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 flex justify-between items-center">
                            <div>
                                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">AI Doubts Resolved</p>
                                <p className="text-2xl font-black">{telemetry.aiQuestionsAsked}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                <BrainCircuit size={18} />
                            </div>
                        </div>
                        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 flex justify-between items-center">
                            <div>
                                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-1">Mains Answers Evaluated</p>
                                <p className="text-2xl font-black">{telemetry.mainsSubmitted}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                                <Flame size={18} />
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-fuchsia-600/20 to-indigo-600/20 border border-fuchsia-500/30 rounded-2xl p-6 flex justify-between items-center relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 opacity-10 blur-xl">
                                <BrainCircuit size={120} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-fuchsia-300/70 text-[10px] uppercase font-bold tracking-widest mb-1">Network Health</p>
                                <p className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Nominal
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Charts Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                        {/* Main Interaction Graph */}
                        <div className="lg:col-span-2 bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 h-[400px] flex flex-col">
                            <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-6">Cognitive Yield (Swipes / Day)</h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSwipes" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                                        <XAxis dataKey="date" stroke="#ffffff30" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#ffffff30" fontSize={10} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff20', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        <Area type="monotone" dataKey="swipes" name="Swipes" stroke="#d946ef" strokeWidth={3} fillOpacity={1} fill="url(#colorSwipes)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Session Graph */}
                        <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 h-[400px] flex flex-col">
                            <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-6">Active Sessions Trend</h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                                        <XAxis dataKey="date" stroke="#ffffff30" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#ffffff30" fontSize={10} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                                        <Bar dataKey="sessions" name="Sessions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}

function PipelinePulse({ health }: { health: PipelineHealth | null }) {
    if (!health) return null;

    const StatusBadge = ({ status, label, lastTime }: { status: string, label: string, lastTime: string | null }) => {
        const isNominal = status === 'nominal';
        const isStale = status === 'stale';

        return (
            <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-white/10 transition-all">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isNominal ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : isStale ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                        {isNominal ? <CheckCircle2 size={18} /> : isStale ? <AlertTriangle size={18} /> : <Zap size={18} />}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{label}</p>
                        <p className="text-sm font-bold mt-0.5">{isNominal ? 'Pipeline Nominal' : isStale ? 'Health Degrading' : 'System Critical'}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-bold text-white/20 uppercase">Last Heartbeat</p>
                    <p className="text-[11px] font-mono text-white/40">{lastTime ? new Date(lastTime).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'NEVER'}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatusBadge status={health.ingestStatus} label="News Pulse Engine" lastTime={health.lastStoryIngest} />
            <StatusBadge status={health.oracleStatus} label="Oracle Calibration Loop" lastTime={health.lastOracleCalibration} />
        </div>
    );
}

// Helper Component for KPI Cards
function MetricCard({ title, value, icon, color, bg, border }: { title: string, value: number | string, icon: React.ReactNode, color: string, bg: string, border: string }) {
    return (
        <div className={`bg-[#0c0c0c] border ${border} rounded-2xl p-6 relative overflow-hidden group`}>
            {/* Ambient Base Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${bg} blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 rounded-full translate-x-10 -translate-y-10`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest">{title}</p>
                    <div className={`${color} opacity-80`}>{icon}</div>
                </div>
                <h3 className="text-3xl font-black text-white">{value}</h3>
            </div>
        </div>
    );
}

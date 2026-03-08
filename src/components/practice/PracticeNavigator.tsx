'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Practice Navigator (Mission Planning)
// Purpose-built Aerial View for PYQs, Predictions & Mocks
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '@/lib/core/haptics';

interface PracticeMission {
    id: string;
    title: string;
    description: string;
    yield: 'CRITICAL' | 'HIGH' | 'STAMINA' | 'ELITE';
    type: 'PYQ' | 'PREDICTED' | 'MOCK' | 'TOURNAMENT' | 'BATTLE';
    intelCount: number;
    icon: string;
    prizePool?: string;
    participants?: number;
    isWarZone?: boolean;
}

const MISSIONS: PracticeMission[] = [
    {
        id: 'pyq-2024',
        title: 'Elite PYQs: 2024',
        description: 'Direct intelligence from the latest UPSC battleground.',
        yield: 'CRITICAL',
        type: 'PYQ',
        intelCount: 100,
        icon: '📜'
    },
    {
        id: 'predicted-poly',
        title: 'Lethal Predictions',
        description: 'AI-predicted high-probability MCQ zones.',
        yield: 'HIGH',
        type: 'PREDICTED',
        intelCount: 42,
        icon: '🔥'
    },
    {
        id: 'mock-full-1',
        title: 'Mock Series: Delta-1',
        description: 'Full-scale simulation to build exam-day stamina.',
        yield: 'STAMINA',
        type: 'MOCK',
        intelCount: 100,
        icon: '🛡️'
    },
    {
        id: 'tournament-sunday',
        title: 'Sunday Global Open',
        description: 'Compete for the Title of National Topper.',
        yield: 'ELITE',
        type: 'TOURNAMENT',
        intelCount: 50,
        icon: '🏆',
        prizePool: '5,000 XP + Rare Badge',
        participants: 1240,
        isWarZone: true
    },
    {
        id: 'tournament-daily',
        title: 'Daily Speed Blitz',
        description: 'High-velocity MCQ combat. 60 seconds per card.',
        yield: 'HIGH',
        type: 'TOURNAMENT',
        intelCount: 20,
        icon: '⚡',
        prizePool: '500 XP',
        participants: 450,
        isWarZone: true
    },
    {
        id: 'war-briefing',
        title: 'Daily War Briefing',
        description: 'Elite audio strategy to calibrate your morning mindset.',
        yield: 'ELITE',
        type: 'BATTLE',
        intelCount: 1,
        icon: '🎙️',
        isWarZone: true
    },
    {
        id: 'random-duel',
        title: 'TacticalDuel: 1v1',
        description: 'Engage in a high-stakes blitz against a random aspirant.',
        yield: 'CRITICAL',
        type: 'BATTLE',
        intelCount: 5,
        icon: '⚔️',
        isWarZone: true
    },
    {
        id: 'squad-hub',
        title: 'Squad Alliances',
        description: 'Coordinate with your tactical unit. Share intelligence and track group readiness.',
        yield: 'ELITE',
        type: 'BATTLE',
        intelCount: 0,
        icon: '👥',
        isWarZone: true
    }
];

export default function PracticeNavigator({ onMissionSelect }: { onMissionSelect: (id: string) => void }) {
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'PYQ' | 'MOCK' | 'WAR_ZONE'>('ALL');

    const filteredMissions = MISSIONS.filter(m => {
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'WAR_ZONE') return m.isWarZone;
        return m.type === activeFilter;
    });

    return (
        <div className="w-full flex flex-col pt-4">
            {/* 1. Tactical Mission Filters */}
            <div className="flex gap-3 overflow-x-auto px-6 mb-10 no-scrollbar">
                {['ALL', 'PYQ', 'MOCK', 'WAR_ZONE'].map((f) => (
                    <button
                        key={f}
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveFilter(f as any);
                        }}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border whitespace-nowrap ${activeFilter === f
                            ? (f === 'WAR_ZONE' ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]')
                            : 'bg-white/[0.03] text-white/40 border-white/5 hover:border-white/10'
                            }`}
                    >
                        {f === 'ALL' ? 'All Missions' : f === 'PYQ' ? 'Elite PYQs' : f === 'MOCK' ? 'Mock Series' : '💀 War Zone'}
                    </button>
                ))}
            </div>

            {/* 2. Mission Briefings (Aerial View Cards) */}
            <div className="px-6 space-y-4">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">Practice Briefing</h2>
                        <p className="text-[10px] text-white/30 uppercase mt-1 tracking-widest font-bold">Training Range 1.0</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {filteredMissions.map((mission, idx) => (
                        <motion.button
                            key={mission.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => {
                                triggerHaptic('medium');
                                onMissionSelect(mission.id);
                            }}
                            className="relative w-full rounded-3xl overflow-hidden border border-white/10 group p-6 text-left flex items-center justify-between bg-black/40 backdrop-blur-3xl hover:border-white/20 transition-all"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                                    {mission.icon}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-sm font-black text-white uppercase tracking-wider">{mission.title}</h3>
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${mission.yield === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : mission.yield === 'ELITE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-400'
                                            }`}>
                                            {mission.yield} Yield
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-white/30 font-medium max-w-[240px] leading-tight mb-2">
                                        {mission.description}
                                    </p>

                                    {mission.type === 'TOURNAMENT' && (
                                        <div className="flex items-center gap-4 mt-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px]">💰</span>
                                                <span className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest">{mission.prizePool}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                                                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{mission.participants} Active</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-lg font-black text-white">{mission.intelCount}</div>
                                <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Questions</div>
                            </div>

                            {/* Tactical Highlight */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${mission.isWarZone ? 'bg-rose-500' : 'bg-indigo-500'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* 3. Global Practice Stats Gauge */}
            <div className="mt-12 px-6">
                <div className="bg-[#111] border border-white/5 rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
                                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Training Readiness</h4>
                            </div>
                            <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Simulating G-Force...</p>
                        </div>
                        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
                            <span className="text-xl">📊</span>
                        </div>
                    </div>

                    <div className="flex gap-4 relative z-10">
                        <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">Total Attempted</span>
                            <span className="text-lg font-black text-white">4,280</span>
                        </div>
                        <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">Elite Accuracy</span>
                            <span className="text-lg font-black text-indigo-400">78%</span>
                        </div>
                    </div>

                    {/* Background grid effect */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                </div>
            </div>

            {/* Spacer for Bottom Nav */}
            <div className="h-32" />
        </div>
    );
}

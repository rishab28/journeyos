'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Hyper-Minimal Dashboard
// Apple Fitness / Uber Level Focus
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProgressStore } from '@/store/progressStore';
import { useSRSStore } from '@/store/srsStore';

export default function DailyDashboard() {
    const {
        currentStreak,
        todayReviewed,
        dailyGoal,
        dailyProgress,
    } = useProgressStore();

    const syncStatus = useSRSStore((s) => s.syncStatus);

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    const progressPercent = Math.round(dailyProgress * 100);
    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    const boundedProgress = Math.min(dailyProgress, 1);
    const strokeDashoffset = circumference - (boundedProgress * circumference);

    return (
        <motion.div
            className="w-full flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* ── Minimal Streak Left ── */}
            <div className="flex items-center gap-4 opacity-90">
                <div className="flex items-center gap-2">
                    <span className="text-xl shrink-0">🔥</span>
                    <span className="text-3xl font-black text-white tabular-nums">{currentStreak}</span>
                </div>
                {/* Sync Status Badge */}
                <div className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center gap-2">
                    <motion.div
                        className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-indigo-500 shadow-[0_0_8px_#6366f1]' :
                            syncStatus === 'syncing' ? 'bg-white/40' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                            }`}
                        animate={syncStatus === 'syncing' ? { opacity: [0.4, 1, 0.4] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-[9px] font-caps text-white/30">{syncStatus}</span>
                </div>
            </div>

            {/* ── Progress Ring Right ── */}
            <div className="relative w-12 h-12 flex items-center justify-center group">
                {/* Background Ring */}
                <svg className="w-12 h-12 transform -rotate-90">
                    <circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke="rgba(255,255,255,0.04)"
                        strokeWidth="3.5"
                        fill="transparent"
                    />
                    {/* Foreground Ring */}
                    <motion.circle
                        cx="24"
                        cy="24"
                        r={radius}
                        stroke={todayReviewed >= dailyGoal ? "#6366f1" : "rgba(255,255,255,0.2)"}
                        strokeWidth="3.5"
                        fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                        strokeLinecap="round"
                    />
                </svg>
                {/* Center Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {todayReviewed >= dailyGoal ? (
                        <span className="text-sm text-indigo-400 font-black">✓</span>
                    ) : (
                        <span className="text-[10px] text-white/50 font-bold">{progressPercent}%</span>
                    )}
                </div>
                {/* Tooltip on hover */}
                <div className="absolute -top-10 right-0 px-2 py-1 glass-panel rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    <p className="text-[9px] font-caps text-white/60">{todayReviewed}/{dailyGoal} Reviewed</p>
                </div>
            </div>
        </motion.div>
    );
}

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
    // Bound the progress so it doesn't wrap backwards if dailyProgress > 1
    const boundedProgress = Math.min(dailyProgress, 1);
    const strokeDashoffset = circumference - (boundedProgress * circumference);

    return (
        <motion.div
            className="w-full px-6 pt-8 pb-4 flex items-center justify-between z-50 bg-black"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* ── Minimal Streak Left ── */}
            <div className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity cursor-default isolate">
                <div className="flex items-center gap-1.5">
                    <span className="text-xl shrink-0 -mt-0.5">🔥</span>
                    <span className="text-2xl font-extrabold tracking-tight text-white">{currentStreak}</span>
                </div>
                {/* Sync Indicator */}
                <div className="flex items-center gap-1 pl-1">
                    <motion.div
                        className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500' :
                                syncStatus === 'syncing' ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: syncStatus === 'syncing' ? 1 : 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </div>
            </div>

            {/* ── Premium Branding Center ── */}
            <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
                <span className="text-[10px] font-black tracking-[0.4em] text-white/20 uppercase whitespace-nowrap">JourneyOS</span>
            </div>

            {/* ── Apple Fitness Style Progress Ring Right ── */}
            <div className="relative w-9 h-9 flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity cursor-default">
                {/* Background Ring */}
                <svg className="w-9 h-9 transform -rotate-90">
                    <circle
                        cx="18"
                        cy="18"
                        r={radius}
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="3"
                        fill="transparent"
                    />
                    {/* Foreground Ring */}
                    <motion.circle
                        cx="18"
                        cy="18"
                        r={radius}
                        stroke={todayReviewed >= dailyGoal ? "#10b981" : "#ffffff"} // Emerald when done, White when in progress
                        strokeWidth="3"
                        fill="transparent"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        strokeLinecap="round"
                    />
                </svg>
                {/* Center Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {todayReviewed >= dailyGoal ? (
                        <span className="text-[11px] text-emerald-400 font-bold tracking-tighter">✓</span>
                    ) : (
                        <span className="text-[9px] text-white/60 font-medium tracking-tighter">{progressPercent}</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

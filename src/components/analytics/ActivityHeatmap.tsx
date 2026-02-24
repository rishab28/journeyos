'use client';

import { motion } from 'framer-motion';
import { useProgressStore } from '@/store/progressStore';
import { useMemo } from 'react';

// ═══════════════════════════════════════════════════════════
// GitHub-Style 30-Day Activity Heatmap
// ═══════════════════════════════════════════════════════════

export default function ActivityHeatmap() {
    const { totalReviewed, currentStreak } = useProgressStore();

    // Generate a beautiful mock 30-day history based on streak and total volume
    // In production, this would map directly to `review_history` timestamps
    const days = useMemo(() => {
        const arr = [];
        const today = new Date();

        let remainingReviewsToDistribute = totalReviewed;
        const avgPerDay = remainingReviewsToDistribute > 0 ? remainingReviewsToDistribute / Math.max(currentStreak, 1) : 0;

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            // Is this day within the active streak?
            const isActiveStreakDay = i < currentStreak;

            let count = 0;
            if (isActiveStreakDay) {
                // Generate a believable bell curve around the average
                const variance = avgPerDay * 0.4;
                count = Math.max(1, Math.floor(avgPerDay + (Math.random() * variance * 2 - variance)));
                remainingReviewsToDistribute -= count;
            } else if (Math.random() > 0.7) {
                // Random isolated study days before the streak
                count = Math.floor(Math.random() * 15);
                remainingReviewsToDistribute -= count;
            }

            arr.push({
                date,
                count: Math.max(0, count),
            });
        }

        // Ensure today always has some if totalReviewed > 0 and streak > 0
        if (currentStreak > 0 && totalReviewed > 0) {
            arr[29].count = Math.max(1, arr[29].count);
        }

        return arr;
    }, [totalReviewed, currentStreak]);

    const getIntensityColor = (count: number) => {
        if (count === 0) return 'bg-white/[0.03] border-white/[0.02]';
        if (count < 5) return 'bg-emerald-500/20 border-emerald-500/20';
        if (count < 15) return 'bg-emerald-500/40 border-emerald-500/40';
        if (count < 30) return 'bg-emerald-500/70 border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
        return 'bg-emerald-400 border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.5)]'; // 30+ is nuclear
    };

    return (
        <div className="p-5 rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-semibold text-emerald-400/50 uppercase tracking-widest">
                    📅 30-Day Tactical Grid
                </p>
                <div className="text-right">
                    <p className="text-xs font-bold text-white/50">{totalReviewed} Reviews</p>
                </div>
            </div>

            {/* Grid Container (10 columns x 3 rows ideally, or 7x4 for month) */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {days.map((day, i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.015 }}
                        className={`aspect-square rounded-sm border ${getIntensityColor(day.count)} relative group`}
                    >
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-black/90 border border-white/10 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                            {day.count} cards on {day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-1.5 mt-3">
                <span className="text-[9px] text-white/30 mr-1">Less</span>
                <div className="w-2.5 h-2.5 rounded-sm bg-white/[0.03]" />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20" />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40" />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70" />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                <span className="text-[9px] text-white/30 ml-1">More</span>
            </div>
        </div>
    );
}

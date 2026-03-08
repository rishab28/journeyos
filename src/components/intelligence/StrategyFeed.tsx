'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Proactive Mentorship (Live Strategy Feed)
// Delivers live, context-aware nudges bridging the user to Rank-1.
// ═══════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';
import { useProgressStore } from '@/store/progressStore';
import { useEffect, useState } from 'react';

export default function StrategyFeed() {
    const { msi, isBurnoutMode } = useSRSStore();
    const { rankProbability, accuracy } = useProgressStore();
    const [nudge, setNudge] = useState<{ title: string; message: string; type: 'warning' | 'success' | 'info' | 'urgent' } | null>(null);

    useEffect(() => {
        // Cognitive Performance Engine Nudge Logic
        if (msi < 30) {
            setNudge({
                title: 'Mental Stamina Critical (MSI < 30%)',
                message: 'Bhai, fatigue is setting in. Your cognitive load is too high. I am throttling new cards and serving easy mnemonics to recover your baseline.',
                type: 'urgent'
            });
        } else if (isBurnoutMode) {
            setNudge({
                title: 'Burnout Shield Activated',
                message: 'You are fast-swiping without reading. Deep breath. Let\'s do 5 easy foundational concepts to get the flow back.',
                type: 'warning'
            });
        } else if (accuracy < 60) {
            setNudge({
                title: 'Conceptual Drift Detected',
                message: 'Your accuracy is slipping below Rank-1 thresholds. We are locking advanced modules until we fix these building blocks.',
                type: 'warning'
            });
        } else if (msi > 80 && accuracy > 85) {
            setNudge({
                title: 'Flow State Confirmed ⚡',
                message: 'Flawless recall. Your neurons are fully primed. I am accelerating the exposure of high-weightage, difficult PYQs.',
                type: 'success'
            });
        } else {
            setNudge({
                title: 'Rank-1 Trajectory Active',
                message: `Current Pace: ${rankProbability}% Probability. Steady progress. Keep hitting the daily targets.`,
                type: 'info'
            });
        }
    }, [msi, isBurnoutMode, accuracy, rankProbability]);

    if (!nudge) return null;

    const styles = {
        urgent: 'border-rose-500/50 bg-rose-500/10 text-rose-400',
        warning: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
        success: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400',
        info: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400',
    };

    const icons = {
        urgent: '🚨',
        warning: '⚠️',
        success: '⚡',
        info: '🧠',
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative w-full max-w-lg mx-auto mb-6 p-4 rounded-2xl border backdrop-blur-md overflow-hidden ${styles[nudge.type]}`}
            >
                {/* Minimalist Grid Background */}
                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]"></div>

                <div className="relative z-10 flex items-start gap-4">
                    <div className="flex-shrink-0 text-3xl mt-1">
                        {icons[nudge.type]}
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest mb-1">
                            {nudge.title}
                        </h4>
                        <p className="text-sm opacity-90 leading-relaxed">
                            {nudge.message}
                        </p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

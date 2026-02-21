'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Oracle Mentor (Hyper-Personalized Coach)
// Analyzes user state (accuracy, speed, MSI) to provide
// 'Mentor Pulse' nudges and 'Strategic Shortcuts'.
// ═══════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import { useProgressStore } from '@/store/progressStore';
import { useSRSStore } from '@/store/srsStore';
import { useEffect, useState } from 'react';

export default function OracleMentor() {
    const { rankProbability, accuracy } = useProgressStore();
    const { msi, isBurnoutMode } = useSRSStore();
    const [pulse, setPulse] = useState<{ message: string; type: 'shortcut' | 'motivation' | 'warning' } | null>(null);

    useEffect(() => {
        // Evaluate the user's emotional/cognitive state to provide tactical guidance
        if (accuracy < 50) {
            setPulse({
                type: 'shortcut',
                message: 'STRATEGIC SHORTCUT: You are stuck in a low-accuracy loop. Abandon standard reading. Switch strictly to PYQ-driven reverse engineering for the next 48 hours.',
            });
        } else if (isBurnoutMode || msi < 40) {
            setPulse({
                type: 'warning',
                message: 'EMOTIONAL STATE: Frustration/Fatigue detected. Let go of the heavy modules today. We are pivoting to high-reward, low-effort maps and mnemonics.',
            });
        } else if (accuracy > 85 && rankProbability > 75) {
            setPulse({
                type: 'motivation',
                message: 'MOMENTUM: You are outperforming 99% of peers right now. Double down on Weak-Subject Elimination. Do not let the foot off the gas.',
            });
        } else {
            setPulse({
                type: 'motivation',
                message: 'CONSISTENCY: The compounding effect is working. Your Rank 1 trajectory is stable. Trust the system and execute the daily targets.',
            });
        }
    }, [accuracy, msi, isBurnoutMode, rankProbability]);

    if (!pulse) return null;

    const pulseStyles = {
        shortcut: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/40 via-black/40 to-black/40 border-amber-500/30 text-amber-200',
        warning: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-900/40 via-black/40 to-black/40 border-rose-500/30 text-rose-200',
        motivation: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/40 via-black/40 to-black/40 border-cyan-500/30 text-cyan-200',
    };

    return (
        <div className="relative w-full max-w-lg mx-auto mb-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative overflow-hidden p-[1px] rounded-2xl ${pulse.type === 'shortcut' ? 'bg-gradient-to-r from-amber-500/50 via-amber-300/50 to-amber-500/50' : 'bg-white/5'}`}
            >
                {/* Magic border animation for shortcuts */}
                {pulse.type === 'shortcut' && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-200 to-amber-500 rounded-2xl blur-sm opacity-50"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />
                )}

                <div className={`relative h-full w-full p-5 rounded-[15px] border backdrop-blur-xl ${pulseStyles[pulse.type]}`}>
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 relative">
                            <div className="w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center relative overflow-hidden">
                                <span className="text-xl relative z-10">👁️‍🗨️</span>
                                <motion.div
                                    className="absolute inset-0 bg-white/20"
                                    animate={{ opacity: [0, 0.5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                                    Oracle Mentor Pulse
                                </h4>
                                {pulse.type === 'shortcut' && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[8px] font-bold uppercase tracking-widest border border-amber-500/30 animate-pulse">
                                        Action Required
                                    </span>
                                )}
                            </div>
                            <p className="text-sm font-medium leading-relaxed opacity-90">
                                {pulse.message}
                            </p>

                            {pulse.type === 'shortcut' && (
                                <button className="mt-4 w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-colors border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                                    Execute Strategic Shortcut
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

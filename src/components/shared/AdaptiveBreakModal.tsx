'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Adaptive Break Modal (Bio-Sense Intervention)
// Triggers when MSI is critical to prevent cognitive failure.
// ═══════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { X, Wind, Battery, Heart, Zap } from 'lucide-react';
import { triggerHaptic } from '@/lib/core/haptics';

export default function AdaptiveBreakModal() {
    const { msi, resetBurnout } = useSRSStore();
    const isOpen = msi < 20;

    const handleDismiss = () => {
        triggerHaptic('medium');
        resetBurnout(); // In a real scenario, this might just dismiss the modal or log a break
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-sm"
                    >
                        <GlassCard className="p-8 border-rose-500/30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-900/20 via-black to-black">
                            <button
                                onClick={handleDismiss}
                                className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="relative">
                                    <motion.div
                                        className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Battery size={40} className="relative z-10" />
                                    </motion.div>
                                    <div className="absolute inset-0 bg-rose-500/20 blur-2xl rounded-full" />
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">System Redline</h2>
                                    <p className="text-rose-400 text-[10px] font-black uppercase tracking-[0.2em]">Bio-Sense Intervention Required</p>
                                </div>

                                <p className="text-sm text-white/60 leading-relaxed font-medium">
                                    Your Mental Stamina has hit <span className="text-rose-400 font-bold">{msi.toFixed(0)}%</span>.
                                    Recall quality is decaying. Continuing now will lead to **Pseudo-Knowledge** formation.
                                </p>

                                <div className="w-full space-y-3">
                                    <button
                                        onClick={handleDismiss}
                                        className="w-full py-4 rounded-2xl bg-white text-black text-sm font-bold uppercase tracking-widest hover:bg-white/90 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Wind size={18} />
                                        Take 5 Min Break
                                    </button>
                                    <button
                                        onClick={handleDismiss}
                                        className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                                    >
                                        Dismiss Intervention
                                    </button>
                                </div>

                                <div className="flex items-center gap-4 pt-4 opacity-40">
                                    <div className="flex flex-col items-center gap-1">
                                        <Heart size={14} />
                                        <span className="text-[8px] font-bold uppercase">Rest</span>
                                    </div>
                                    <div className="h-px w-8 bg-white/20" />
                                    <div className="flex flex-col items-center gap-1">
                                        <Wind size={14} />
                                        <span className="text-[8px] font-bold uppercase">Breathe</span>
                                    </div>
                                    <div className="h-px w-8 bg-white/20" />
                                    <div className="flex flex-col items-center gap-1">
                                        <Zap size={14} />
                                        <span className="text-[8px] font-bold uppercase">Sync</span>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

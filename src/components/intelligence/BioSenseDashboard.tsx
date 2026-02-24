'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Bio-Sense Dashboard (Neuro-Telemetry)
// Visualizes MSI, Cognitive Load, and Adaptive Trends.
// ═══════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';
import { useProgressStore } from '@/store/progressStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { DataPulse } from '@/components/ui/DataPulse';
import { Activity, Brain, Zap, ShieldAlert } from 'lucide-react';

export default function BioSenseDashboard() {
    const { msi, isBurnoutMode, sessionStartMs, lastCardTopic } = useSRSStore();
    const { accuracy, upscIQ } = useProgressStore();

    const staminaColor = msi > 70 ? 'emerald' : msi > 40 ? 'amber' : 'rose';
    const staminaLabel = msi > 70 ? 'Peak Focus' : msi > 40 ? 'Cognitive Strain' : 'Critical Fatigue';

    return (
        <div className="space-y-6">
            <GlassCard className="p-6 overflow-hidden relative">
                {/* Background Glow */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 ${staminaColor === 'emerald' ? 'bg-emerald-500' : staminaColor === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`} />

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Bio-Sense Pulse</h2>
                        <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Real-time Neuro-Telemetry</p>
                    </div>
                    <DataPulse color={staminaColor} size="lg" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* MSI Meter */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Mental Stamina</span>
                            <span className={`text-2xl font-black tabular-nums ${staminaColor === 'emerald' ? 'text-emerald-400' : staminaColor === 'amber' ? 'text-amber-400' : 'text-rose-400'}`}>{msi.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full ${staminaColor === 'emerald' ? 'bg-emerald-500' : staminaColor === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${msi}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-wide ${staminaColor === 'emerald' ? 'text-emerald-400/80' : staminaColor === 'amber' ? 'text-amber-400/80' : 'text-rose-400/80'}`}>{staminaLabel}</p>
                    </div>

                    {/* Cognitive Load */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Cognitive Load</span>
                            <span className="text-2xl font-black tabular-nums text-indigo-400">{Math.min(100, (100 - accuracy + (isBurnoutMode ? 40 : 0))).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-indigo-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (100 - accuracy + (isBurnoutMode ? 40 : 0)))}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-400/80">
                            {isBurnoutMode ? 'Burnout Shield Active' : 'Optimal Sync'}
                        </p>
                    </div>
                </div>
            </GlassCard>

            <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-4 flex flex-col items-center text-center space-y-2 bg-white/[0.02]">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                        <Brain size={20} />
                    </div>
                    <div>
                        <div className="text-lg font-black text-white">{upscIQ}</div>
                        <div className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Dynamic IQ</div>
                    </div>
                </GlassCard>

                <GlassCard className="p-4 flex flex-col items-center text-center space-y-2 bg-white/[0.02]">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                        <Zap size={20} />
                    </div>
                    <div>
                        <div className="text-lg font-black text-white">
                            {Math.round((Date.now() - sessionStartMs) / 60000)}m
                        </div>
                        <div className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Flow Session</div>
                    </div>
                </GlassCard>
            </div>

            {isBurnoutMode && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-4"
                >
                    <div className="p-2 rounded-full bg-rose-500/20 text-rose-400">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest">Surgical Throttling Active</h4>
                        <p className="text-[10px] text-rose-400/60 leading-tight">Feed is restricted to Mnemonics & Foundation cards until MSI recovers.</p>
                    </div>
                </motion.div>
            )}

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                    <Activity size={14} className="text-emerald-400" />
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Neural Continuity</span>
                </div>
                <div className="text-sm font-medium text-white/80">
                    Last Context: <span className="text-emerald-400">{lastCardTopic || 'Deep Learning'}</span>
                </div>
                <div className="mt-2 text-[10px] text-white/40 leading-relaxed italic">
                    "Continuity preserves semantic stability. Your current focus is aligned with Rank-1 trajectories."
                </div>
            </div>
        </div>
    );
}

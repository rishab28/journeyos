'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Bio-Sense Dashboard (Neuro-Telemetry)
// Visualizes MSI, Cognitive Load, and Adaptive Trends.
// ═══════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';
import { useProgressStore } from '@/store/progressStore';
import { DataPulse } from '@/components/ui/DataPulse';
import { Activity, Brain, Zap, ShieldAlert } from 'lucide-react';

export default function BioSenseDashboard() {
    const { msi, isBurnoutMode, sessionStartMs, lastCardTopic } = useSRSStore();
    const { accuracy, upscIQ } = useProgressStore();

    const staminaColor = msi > 70 ? 'indigo' : msi > 40 ? 'amber' : 'rose';
    const staminaLabel = msi > 70 ? 'PEAK FOCUS' : msi > 40 ? 'COGNITIVE STRAIN' : 'CRITICAL FATIGUE';

    return (
        <div className="space-y-6">
            <div className="p-8 rounded-[40px] glass-panel relative overflow-hidden group">
                {/* Background Dynamic Glow */}
                <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] opacity-20 transition-all duration-1000 ${staminaColor === 'indigo' ? 'bg-indigo-500' : staminaColor === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`} />

                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div>
                        <h2 className="text-[28px] font-bold text-white tracking-tight">Bio-Sense Pulse</h2>
                        <p className="font-caps text-white/30 mt-1">REAL-TIME NEURO-TELEMETRY</p>
                    </div>
                    <DataPulse color={staminaColor} size="lg" />
                </div>

                <div className="grid grid-cols-2 gap-8 relative z-10">
                    {/* MSI Meter */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="font-caps text-white/20 tracking-[0.2em] text-[10px]">MENTAL STAMINA</span>
                            <span className={`text-[32px] font-bold tabular-nums leading-none ${staminaColor === 'indigo' ? 'text-indigo-400' : staminaColor === 'amber' ? 'text-amber-400' : 'text-rose-400'}`}>
                                {msi.toFixed(0)}<span className="text-sm opacity-30 ml-0.5">%</span>
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full ${staminaColor === 'indigo' ? 'bg-indigo-500' : staminaColor === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${msi}%` }}
                                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </div>
                        <p className={`font-caps tracking-[0.15em] text-[9px] font-black ${staminaColor === 'indigo' ? 'text-indigo-400/60' : staminaColor === 'amber' ? 'text-amber-400/60' : 'text-rose-400/60'}`}>{staminaLabel}</p>
                    </div>

                    {/* Cognitive Load */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <span className="font-caps text-white/20 tracking-[0.2em] text-[10px]">COGNITIVE LOAD</span>
                            <span className="text-[32px] font-bold tabular-nums leading-none text-indigo-400">
                                {Math.min(100, (100 - accuracy + (isBurnoutMode ? 40 : 0))).toFixed(0)}<span className="text-sm opacity-30 ml-0.5">%</span>
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-indigo-500/40"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (100 - accuracy + (isBurnoutMode ? 40 : 0)))}%` }}
                                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </div>
                        <p className="font-caps tracking-[0.15em] text-[9px] font-black text-indigo-400/60">
                            {isBurnoutMode ? 'BURNOUT SHIELD ACTIVE' : 'OPTIMAL SYNC'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
                <div className="p-6 rounded-[32px] glass-card-premium flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                        <Brain size={24} />
                    </div>
                    <div>
                        <div className="text-[32px] font-bold text-white leading-none mb-2">{upscIQ}</div>
                        <div className="font-caps text-white/20 tracking-[0.2em] text-[10px]">DYNAMIC IQ</div>
                    </div>
                </div>

                <div className="p-6 rounded-[32px] glass-card-premium flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                        <Zap size={24} />
                    </div>
                    <div>
                        <div className="text-[32px] font-bold text-white leading-none mb-2">
                            {Math.round((Date.now() - sessionStartMs) / 60000)}<span className="text-sm opacity-30 ml-0.5">m</span>
                        </div>
                        <div className="font-caps text-white/20 tracking-[0.2em] text-[10px]">FLOW SESSION</div>
                    </div>
                </div>
            </div>

            {isBurnoutMode && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-[32px] bg-rose-500/5 border border-rose-500/20 flex items-center gap-6"
                >
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                        <ShieldAlert size={28} />
                    </div>
                    <div>
                        <h4 className="font-black text-rose-400 uppercase tracking-widest text-xs">Surgical Throttling Active</h4>
                        <p className="text-[11px] text-rose-400/60 leading-tight mt-1">Feed restricted to Mnemonics & Foundation until MSI &gt; 40%.</p>
                    </div>
                </motion.div>
            )}

            <div className="p-6 rounded-[32px] glass-panel border border-white/5 group hover:border-indigo-500/20 transition-all">
                <div className="flex items-center gap-3 mb-4">
                    <Activity size={18} className="text-indigo-400" />
                    <span className="font-caps text-white/40 tracking-[0.2em] text-[10px]">NEURAL CONTINUITY</span>
                </div>
                <div className="text-md font-bold text-white/90">
                    Last Context: <span className="text-indigo-400">{lastCardTopic || 'Deep Learning'}</span>
                </div>
                <div className="mt-3 text-[11px] text-white/30 leading-relaxed italic border-l-2 border-white/5 pl-4">
                    "Continuity preserves semantic stability. Your current focus is aligned with Rank-1 trajectories."
                </div>
            </div>
        </div>
    );
}

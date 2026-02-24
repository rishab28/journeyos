'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Oracle Deep Intelligence (Executive Insights)
// High-fidelity psychometric and cognitive analytics
// ═══════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { useProgressStore } from '@/store/progressStore';

export default function DeepIntelligence() {
    const { accuracy, upscIQ } = useProgressStore();

    return (
        <div className="space-y-6">
            {/* 1. Neural Decay Curve (Predictive Model) */}
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Neural Decay Profile</h4>
                        <p className="text-sm font-bold text-white">Projected Forgetting Curve</p>
                    </div>
                    <div className="px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-[8px] font-black text-rose-400 uppercase tracking-widest">
                        Purge Risk: High
                    </div>
                </div>

                <div className="h-24 flex items-end gap-1 mb-4">
                    {[0.9, 0.75, 0.6, 0.5, 0.42, 0.38, 0.35].map((val, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <motion.div
                                className="w-full bg-gradient-to-t from-emerald-500/40 to-emerald-400 rounded-sm"
                                initial={{ height: 0 }}
                                animate={{ height: `${val * 100}%` }}
                                transition={{ delay: i * 0.1, duration: 1 }}
                            />
                            <span className="text-[7px] font-bold text-white/20">Day {i}</span>
                        </div>
                    ))}
                </div>
                <p className="text-[9px] text-white/30 font-medium leading-relaxed italic">
                    *Based on current entropy, your brain will purge 42% of "Polity Articles" in the next 72 hours if not reinforced.
                </p>
            </div>

            {/* 2. Psychometric Breakdown (Error Root Cause) */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                    <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-4">Conceptual Gaps</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-white/40">Polity</span>
                            <span className="text-white font-bold">12%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-blue-500" initial={{ width: 0 }} animate={{ width: '12%' }} />
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-white/40">Economy</span>
                            <span className="text-white font-bold">28%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-blue-500" initial={{ width: 0 }} animate={{ width: '28%' }} />
                        </div>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                    <h4 className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-4">Silly Mistakes</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-white/40">Reading Error</span>
                            <span className="text-white font-bold">45%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-rose-500" initial={{ width: 0 }} animate={{ width: '45%' }} />
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-white/40">Timer Stress</span>
                            <span className="text-white font-bold">18%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div className="h-full bg-rose-500" initial={{ width: 0 }} animate={{ width: '18%' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. AIR Trajectory (7-Day Trend) */}
            <div className="bg-[#0f1117] border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div>
                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">AIR Trajectory</h4>
                        <p className="text-sm font-bold text-white">7-Day Rank Momentum</p>
                    </div>
                    <div className="text-right">
                        <span className="text-xl font-black text-emerald-400">↑ 1,240</span>
                        <p className="text-[8px] font-black text-white/20 uppercase">Ranks climbed</p>
                    </div>
                </div>

                <div className="relative h-20 w-full mb-2">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20">
                        <motion.path
                            d="M 0 18 Q 20 15 40 10 T 80 5 T 100 2"
                            fill="none" stroke="#10b981" strokeWidth="1"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2 }}
                        />
                        <circle cx="100" cy="2" r="1.5" fill="#10b981" />
                    </svg>
                </div>
                <div className="flex justify-between text-[7px] font-black text-white/10 uppercase tracking-widest px-1">
                    <span>-7 Days</span>
                    <span>Today</span>
                </div>
            </div>

            {/* 4. Cognitive Load Balance */}
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 text-center">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Cognitive Saturation Level</p>
                <div className="flex justify-center items-center gap-12">
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-white">72%</span>
                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Focus Depth</span>
                    </div>
                    <div className="w-[1px] h-10 bg-white/5" />
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-emerald-400">0.82</span>
                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Input/ROI</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
            <div className="glass-panel rounded-[40px] p-8 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                        <h4 className="font-caps text-white/20 tracking-[0.2em] text-[10px] mb-2 uppercase">NEURAL DECAY PROFILE</h4>
                        <p className="text-xl font-bold text-white tracking-tight">Projected Forgetting Curve</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] font-black text-rose-400 uppercase tracking-widest">
                        PURGE RISK: HIGH
                    </div>
                </div>

                <div className="h-32 flex items-end gap-1.5 mb-6 relative z-10">
                    {[0.9, 0.75, 0.6, 0.5, 0.42, 0.38, 0.35].map((val, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar">
                            <div className="w-full relative h-full flex items-end">
                                <motion.div
                                    className="w-full bg-gradient-to-t from-indigo-500/40 to-indigo-400/80 rounded-lg group-hover/bar:from-indigo-500 group-hover/bar:to-indigo-400 transition-all duration-500"
                                    initial={{ height: 0 }}
                                    animate={{ height: `${val * 100}%` }}
                                    transition={{ delay: i * 0.1, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                                />
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-lg" />
                            </div>
                            <span className="font-caps text-[8px] text-white/20 font-bold">D{i}</span>
                        </div>
                    ))}
                </div>
                <p className="text-[11px] text-white/30 font-medium leading-relaxed italic border-l-2 border-white/5 pl-4 relative z-10">
                    *Based on current entropy, your brain will purge 42% of "Polity Articles" in the next 72 hours if not reinforced.
                </p>
            </div>

            {/* 2. Psychometric Breakdown (Error Root Cause) */}
            <div className="grid grid-cols-2 gap-5">
                <div className="glass-card-premium rounded-[32px] p-8">
                    <h4 className="font-caps text-indigo-400/60 tracking-[0.2em] text-[9px] mb-6 uppercase">CONCEPTUAL GAPS</h4>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-white/40 uppercase tracking-wider">Polity</span>
                                <span className="text-white tabular-nums">12%</span>
                            </div>
                            <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                                <motion.div className="h-full bg-indigo-500/60" initial={{ width: 0 }} animate={{ width: '12%' }} transition={{ duration: 1, delay: 0.2 }} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-white/40 uppercase tracking-wider">Economy</span>
                                <span className="text-white tabular-nums">28%</span>
                            </div>
                            <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                                <motion.div className="h-full bg-indigo-500/60" initial={{ width: 0 }} animate={{ width: '28%' }} transition={{ duration: 1, delay: 0.3 }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-card-premium rounded-[32px] p-8">
                    <h4 className="font-caps text-rose-400/60 tracking-[0.2em] text-[9px] mb-6 uppercase">SILLY MISTAKES</h4>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-white/40 uppercase tracking-wider">Reading</span>
                                <span className="text-white tabular-nums">45%</span>
                            </div>
                            <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                                <motion.div className="h-full bg-rose-500/60" initial={{ width: 0 }} animate={{ width: '45%' }} transition={{ duration: 1, delay: 0.2 }} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-white/40 uppercase tracking-wider">Stress</span>
                                <span className="text-white tabular-nums">18%</span>
                            </div>
                            <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
                                <motion.div className="h-full bg-rose-500/60" initial={{ width: 0 }} animate={{ width: '18%' }} transition={{ duration: 1, delay: 0.3 }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. AIR Trajectory (7-Day Trend) */}
            <div className="glass-panel rounded-[40px] p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[80px] rounded-full group-hover:bg-indigo-500/10 transition-all duration-700" />
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div>
                        <h4 className="font-caps text-indigo-400 tracking-[0.2em] text-[10px] mb-2 uppercase">AIR TRAJECTORY</h4>
                        <p className="text-xl font-bold text-white tracking-tight">7-Day Rank Momentum</p>
                    </div>
                    <div className="text-right">
                        <span className="text-[32px] font-bold text-indigo-400 leading-none">↑ 1,240</span>
                        <p className="font-caps text-white/20 text-[8px] mt-1 tracking-widest">RANKS CLIMBED</p>
                    </div>
                </div>

                <div className="relative h-24 w-full mb-4 px-2">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20">
                        <defs>
                            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#818cf8" stopOpacity="1" />
                            </linearGradient>
                        </defs>
                        <motion.path
                            d="M 0 18 Q 20 15 40 10 T 80 5 T 100 2"
                            fill="none" stroke="url(#lineGradient)" strokeWidth="2"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        />
                        <motion.circle
                            cx="100" cy="2" r="3" fill="#818cf8"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 2 }}
                            className="shadow-[0_0_12px_#6366f1]"
                        />
                    </svg>
                </div>
                <div className="flex justify-between font-caps text-[8px] text-white/10 tracking-[0.3em] px-2">
                    <span>L-7 DAYS</span>
                    <span>TODAY</span>
                </div>
            </div>

            {/* 4. Cognitive Load Balance */}
            <div className="glass-card-premium rounded-[32px] p-10 text-center">
                <p className="font-caps text-white/20 tracking-[0.4em] text-[10px] mb-8 uppercase">COGNITIVE SATURATION LEVEL</p>
                <div className="flex justify-center items-center gap-16">
                    <div className="flex flex-col items-center">
                        <span className="text-[36px] font-bold text-white leading-none">72<span className="text-sm opacity-20 ml-0.5">%</span></span>
                        <span className="font-caps text-white/20 tracking-[0.2em] text-[9px] mt-2">FOCUS DEPCH</span>
                    </div>
                    <div className="w-[1px] h-12 bg-white/5" />
                    <div className="flex flex-col items-center">
                        <span className="text-[36px] font-bold text-indigo-400 leading-none">0.82</span>
                        <span className="font-caps text-white/20 tracking-[0.2em] text-[9px] mt-2">INPUT/ROI</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

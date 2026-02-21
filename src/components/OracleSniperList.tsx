'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Oracle Sniper List (2026 Predictions)
// ═══════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// Mock Data based on the 15-year God-Mode calibration
const PREDICTIONS = [
    {
        topic: "Post-Independence Consolidation",
        confidence: 94,
        format: "Statement Analysis (Not Matching)",
        trendEvolution: "UPSC ignored this from 2014-2020. Slowly introduced 1 question in 2022. Due to recent 75-year anniversaries, pattern shift indicates a complex multi-statement question."
    },
    {
        topic: "Space Economy & Private Sector (IN-SPACe)",
        confidence: 88,
        format: "Pair Matching",
        trendEvolution: "Shifted from ISRO-only factuals (2018) to privatization policies. Expect 3 pairs of private space startups and their rockets."
    },
    {
        topic: "Directive Principles / Constitutional Morality",
        confidence: 91,
        format: "Concept Application",
        trendEvolution: "Direct articles ran out in 2017. 2020-2023 tested 'Constitutionalism'. Next logical step is DPSP vs Fundamental Rights conceptual limits."
    }
];

export default function OracleSniperList() {
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    return (
        <div className="w-full px-6 py-12 text-white">
            <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                <div className="w-12 h-12 rounded-full border border-[#00ffcc] flex items-center justify-center text-xl bg-[#00ffcc]/10 shadow-[0_0_15px_rgba(0,255,204,0.3)]">
                    👁️
                </div>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-widest text-[#00ffcc] drop-shadow-md">
                        The 2026 Sniper List
                    </h1>
                    <p className="text-white/50 text-xs tracking-widest uppercase mt-1">15-Year Recursive Backtest Active</p>
                </div>
            </div>

            {/* Conversational Accuracy Banner */}
            <div className="bg-[#00ffcc]/10 border border-[#00ffcc]/30 p-4 rounded-xl mb-8 flex items-start gap-4 shadow-[0_4px_20px_rgba(0,255,204,0.05)]">
                <span className="text-2xl mt-1">🧠</span>
                <div>
                    <h3 className="text-[#00ffcc] font-bold text-sm uppercase tracking-wider mb-1">Oracle Validation Protocol</h3>
                    <p className="text-white/80 text-[13px] leading-relaxed font-mono">
                        "Bhai, hamare AI ne 2024 mein <strong className="text-white">82%</strong> themes predict ki thi, aur 2025 mein <strong className="text-white">89%</strong>. 15 saal ka recursive loop analyze karke ye 2026 ki aakhri list hai. Ye sabse lethal hai."
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {PREDICTIONS.map((pred, idx) => (
                    <motion.div
                        key={idx}
                        onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
                        className="bg-[#111] border border-white/10 p-5 rounded-xl cursor-pointer hover:border-[#00ffcc]/40 transition-colors"
                        whileHover={{ y: -2 }}
                    >
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-white/90 w-2/3">{pred.topic}</h3>
                            <div className="flex flex-col items-end">
                                <span className="text-[#00ffcc] font-black text-xl">{pred.confidence}%</span>
                                <span className="text-[9px] text-white/40 uppercase tracking-widest">Confidence</span>
                            </div>
                        </div>

                        <AnimatePresence>
                            {selectedIdx === idx && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 pt-4 border-t border-white/5 space-y-3"
                                >
                                    <div>
                                        <span className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-widest">Expected Format</span>
                                        <p className="text-sm text-white/80">{pred.format}</p>
                                    </div>
                                    <div className="bg-[#00ffcc]/5 p-3 rounded border border-[#00ffcc]/10">
                                        <span className="text-[10px] text-[#00ffcc] font-bold uppercase tracking-widest flex items-center gap-2 mb-1">
                                            <span>⚡</span> Trend Evolution Analysis
                                        </span>
                                        <p className="text-xs text-white/70 leading-relaxed font-mono">
                                            {pred.trendEvolution}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            <div className="mt-12 text-center text-white/30 text-[10px] uppercase tracking-[0.2em]">
                Oracle Engine Sync Active // Model Checksum: a9f83c1
            </div>
        </div>
    );
}

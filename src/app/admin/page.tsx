'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin Master Control (War Room)
// ═══════════════════════════════════════════════════════════

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AdminDashboardPage() {
    return (
        <div className="w-full min-h-screen bg-[#050505] text-white font-mono p-6 sm:p-12 lg:p-24 overflow-y-auto">

            {/* Ambient Background Grid */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

            <div className="relative z-10 max-w-4xl mx-auto">
                <header className="mb-12 border-b border-fuchsia-500/20 pb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-widest text-fuchsia-400 drop-shadow-[0_0_15px_rgba(232,121,249,0.3)] flex items-center gap-4">
                            <span className="text-4xl">🦅</span> System Command
                        </h1>
                        <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] pl-1 pt-2 border-l-2 border-fuchsia-500/30 ml-2 mt-2">
                            Restricted Access // Authority Level: Omega
                        </p>
                    </div>
                    <Link href="/dashboard" className="text-xs text-white/30 hover:text-white uppercase tracking-widest border border-white/10 px-4 py-2 rounded transition-colors bg-white/5">
                        Exit Matrix
                    </Link>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* 1. Smart Ingestor */}
                    <Link href="/admin/ingest" className="block w-full">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#0c0c11] border border-[#00ffcc]/20 rounded p-8 relative overflow-hidden group hover:border-[#00ffcc]/50 transition-colors h-full"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ffcc]/5 blur-[30px] rounded-full group-hover:bg-[#00ffcc]/10 transition-colors" />
                            <h2 className="text-2xl font-bold text-[#00ffcc] mb-2 flex items-center gap-3">
                                <span>📥</span> Smart Ingestor
                            </h2>
                            <p className="text-sm text-white/50 leading-relaxed mb-6 font-sans">
                                Upload PDFs (Laxmikanth, VisionIAS) via Gemini 1.5 Flash. Generates and embeds Atomic Flashcards.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-[#00ffcc]/70 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 bg-[#00ffcc] rounded-full animate-pulse" />
                                Data Pipeline Active
                            </div>
                        </motion.div>
                    </Link>

                    {/* 2. Oracle Calibration Terminal */}
                    <Link href="/admin/oracle" className="block w-full">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#0c0c11] border border-fuchsia-500/20 rounded p-8 relative overflow-hidden group hover:border-fuchsia-500/50 transition-colors h-full"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 blur-[30px] rounded-full group-hover:bg-fuchsia-500/10 transition-colors" />
                            <h2 className="text-2xl font-bold text-fuchsia-400 mb-2 flex items-center gap-3">
                                <span>👁️</span> Oracle Engine
                            </h2>
                            <p className="text-sm text-white/50 leading-relaxed mb-6 font-sans">
                                15-Year Recursive Backtesting Terminal. Feed PYQs to calibrate logic weights and generate the 2026 Sniper List.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-fuchsia-400/70 uppercase tracking-widest">
                                <span className="text-xs">⚙️</span> Awaiting Calibration Cycle
                            </div>
                        </motion.div>
                    </Link>

                    {/* 3. Lethality Monitor (Placeholder for future) */}
                    <div className="block w-full opacity-50 cursor-not-allowed">
                        <motion.div
                            className="bg-[#0c0c11] border border-red-500/20 rounded p-8 relative overflow-hidden h-full"
                        >
                            <h2 className="text-2xl font-bold text-red-400 mb-2 flex items-center gap-3">
                                <span>🩸</span> Lethality Monitor
                            </h2>
                            <p className="text-sm text-white/50 leading-relaxed mb-6 font-sans">
                                System-wide macro analytics. Track standard deviation of user failure rates across difficult patterns.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-red-500 uppercase tracking-widest">
                                <span className="text-xs">🔒</span> Offline
                            </div>
                        </motion.div>
                    </div>

                    {/* 4. Cohort Analytics (Placeholder for future) */}
                    <div className="block w-full opacity-50 cursor-not-allowed">
                        <motion.div
                            className="bg-[#0c0c11] border border-white/10 rounded p-8 relative overflow-hidden h-full"
                        >
                            <h2 className="text-2xl font-bold text-white/80 mb-2 flex items-center gap-3">
                                <span>👥</span> Cohort Activity
                            </h2>
                            <p className="text-sm text-white/50 leading-relaxed mb-6 font-sans">
                                Track active streaks, average UPSC IQ velocity, and squad interactions across the network.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest">
                                <span className="text-xs">🔒</span> Offline
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </div>
    );
}

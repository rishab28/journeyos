'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Study Tools (Brain Vault)
// High-density visual intelligence: Mindmaps, Timelines, Tables
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToolCategory = 'MINDMAP' | 'TIMELINE' | 'TABLE';

export default function StudyTools() {
    const [activeTool, setActiveTool] = useState<ToolCategory>('MINDMAP');

    return (
        <div className="w-full flex flex-col gap-8">
            {/* ── Sub-Tab Navigation (Tactical Pills) ── */}
            <div className="flex gap-2 p-1.5 bg-white/[0.02] border border-white/[0.05] rounded-[24px]">
                {(['MINDMAP', 'TIMELINE', 'TABLE'] as const).map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveTool(cat)}
                        className={`relative flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.25em] rounded-[18px] transition-all ${activeTool === cat ? 'text-white' : 'text-white/30 hover:text-white/50'
                            }`}
                    >
                        {activeTool === cat && (
                            <motion.div
                                layoutId="activeToolIndicator"
                                className="absolute inset-0 bg-white/[0.04] border border-white/5 rounded-[18px] shadow-lg"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{cat === 'MINDMAP' ? 'NEURAL MAP' : cat === 'TIMELINE' ? 'CHRONOS' : 'DATA MATRIX'}</span>
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ── Neural Map (Mindmap) ── */}
                {activeTool === 'MINDMAP' && (
                    <motion.div
                        key="mindmap"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="glass-panel border border-white/[0.06] rounded-[40px] p-10 min-h-[440px] relative overflow-hidden flex flex-col items-center justify-center group"
                    >
                        <div className="absolute top-8 left-10 relative z-20">
                            <h3 className="text-sm font-bold text-white tracking-tight">Neural Topology</h3>
                            <p className="font-caps text-white/30 text-[9px] mt-1 tracking-[0.2em]">GS PAPER 2 • POLITY CONNECTIONS</p>
                        </div>

                        {/* Visual Mindmap Mockup */}
                        <div className="relative w-full h-full flex items-center justify-center py-12">
                            <motion.div
                                animate={{ scale: [1, 1.05, 1], boxShadow: ['0 0 20px rgba(99,102,241,0.1)', '0 0 40px rgba(99,102,241,0.2)', '0 0 20px rgba(99,102,241,0.1)'] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="w-28 h-28 rounded-full border border-indigo-500/30 bg-indigo-500/5 flex items-center justify-center text-center p-5 relative z-10 backdrop-blur-xl"
                            >
                                <span className="text-[11px] font-black text-white uppercase tracking-tighter leading-none">Preamble</span>

                                {/* Connection Lines (SVG) */}
                                <svg className="absolute inset-0 -z-10 overflow-visible pointer-events-none" style={{ width: '100%', height: '100%' }}>
                                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                                        <line
                                            key={angle}
                                            x1="50%" y1="50%"
                                            x2={`${50 + 80 * Math.cos(angle * Math.PI / 180)}%`}
                                            y2={`${50 + 80 * Math.sin(angle * Math.PI / 180)}%`}
                                            stroke="rgba(99,102,241,0.15)" strokeWidth="1.5"
                                        />
                                    ))}
                                </svg>
                            </motion.div>

                            {/* Outer Nodes */}
                            {[
                                { label: 'Justice', pos: 'top-0 left-4' },
                                { label: 'Liberty', pos: 'top-0 right-4' },
                                { label: 'Equality', pos: 'bottom-0 left-4' },
                                { label: 'Fraternity', pos: 'bottom-0 right-4' },
                                { label: 'Sovereign', pos: 'top-1/2 -left-12 -translate-y-1/2' },
                                { label: 'Socialist', pos: 'top-1/2 -right-12 -translate-y-1/2' },
                            ].map((node, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.15 }}
                                    className={`absolute ${node.pos} px-4 py-2 rounded-2xl glass-card-premium border border-white/5 flex items-center justify-center p-2 text-center transition-all hover:bg-white/[0.08] cursor-pointer group/node active:scale-95`}
                                >
                                    <span className="font-caps text-[9px] font-bold text-white/50 tracking-widest group-hover/node:text-indigo-300 transition-colors uppercase">{node.label}</span>
                                </motion.div>
                            ))}
                        </div>

                        <div className="absolute bottom-10 right-10 flex gap-3 relative z-20">
                            <div className="px-4 py-2 rounded-full glass-panel border border-white/10 text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                CONNECTIVE IQ: 88
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Chronos Flow (Timeline) ── */}
                {activeTool === 'TIMELINE' && (
                    <motion.div
                        key="timeline"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass-panel border border-white/[0.06] rounded-[40px] p-10 min-h-[440px] flex flex-col"
                    >
                        <div className="mb-12">
                            <h3 className="text-sm font-bold text-white tracking-tight">Chronos Flow</h3>
                            <p className="font-caps text-white/30 text-[9px] mt-1 tracking-[0.2em]">MODERN HISTORY • 1857 - 1947</p>
                        </div>

                        <div className="flex-1 border-l-2 border-indigo-500/20 ml-6 space-y-12 relative pb-10">
                            {[
                                { year: '1857', title: 'The Great Revolt', intel: 'Sepoy Mutiny, End of EIC rule' },
                                { year: '1885', title: 'INC Formation', intel: 'A.O. Hume, First Session Mumbai' },
                                { year: '1905', title: 'Bengal Partition', intel: 'Swadeshi Movement, Curzon' },
                                { year: '1919', title: 'Rowlatt Act', intel: 'Jallianwala Bagh, Montague-Chelmsford' },
                            ].map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="relative pl-12 group"
                                >
                                    <div className="absolute left-[-11px] top-1.5 w-5 h-5 rounded-full bg-[#050508] border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:scale-125 transition-transform duration-300" />
                                    <span className="font-caps text-[11px] font-black text-indigo-400 tracking-widest mb-1.5 block">{step.year}</span>
                                    <h4 className="text-lg font-bold text-white/90 mb-1 tracking-tight">{step.title}</h4>
                                    <p className="font-caps text-[9px] text-white/30 font-bold tracking-[0.15em] leading-tight uppercase">{step.intel}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── Data Matrix (Tables) ── */}
                {activeTool === 'TABLE' && (
                    <motion.div
                        key="table"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass-panel border border-white/[0.06] rounded-[40px] p-10 min-h-[440px]"
                    >
                        <div className="mb-10">
                            <h3 className="text-sm font-bold text-white tracking-tight">Data Matrix</h3>
                            <p className="font-caps text-white/30 text-[9px] mt-1 tracking-[0.2em]">CONSTITUTIONAL BODIES COMPARISON</p>
                        </div>

                        <div className="overflow-x-auto no-scrollbar rounded-2xl border border-white/5 bg-white/[0.01]">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/[0.05]">
                                        <th className="px-6 py-5 font-caps text-[10px] font-black text-white/20 tracking-[0.3em] uppercase">BODY</th>
                                        <th className="px-6 py-5 font-caps text-[10px] font-black text-white/20 tracking-[0.3em] uppercase">ARTICLE</th>
                                        <th className="px-6 py-5 font-caps text-[10px] font-black text-white/20 tracking-[0.3em] uppercase">AUTHORITY</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {[
                                        { name: 'ECI', art: '324', auth: 'President' },
                                        { name: 'UPSC', art: '315-323', auth: 'President' },
                                        { name: 'SPSC', art: '315-323', auth: 'Governor' },
                                        { name: 'CAG', art: '148', auth: 'President' },
                                        { name: 'AGI', art: '76', auth: 'President' },
                                    ].map((row, i) => (
                                        <tr key={i} className="group hover:bg-white/[0.03] transition-all duration-300">
                                            <td className="px-6 py-5 text-[13px] font-bold text-white tracking-tight uppercase">{row.name}</td>
                                            <td className="px-6 py-5 text-[12px] font-black text-indigo-400 tabular-nums">{row.art}</td>
                                            <td className="px-6 py-5 font-caps text-[10px] font-bold text-white/40 tracking-widest uppercase">{row.auth}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

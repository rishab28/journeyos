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
        <div className="w-full flex flex-col gap-6">
            {/* ── Sub-Tab Navigation (Tactical Pills) ── */}
            <div className="flex gap-2 p-1.5 bg-white/[0.03] border border-white/[0.05] rounded-2xl">
                {(['MINDMAP', 'TIMELINE', 'TABLE'] as const).map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveTool(cat)}
                        className={`relative flex-1 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${activeTool === cat ? 'text-white' : 'text-white/30 hover:text-white/50'
                            }`}
                    >
                        {activeTool === cat && (
                            <motion.div
                                layoutId="activeToolIndicator"
                                className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10">{cat === 'MINDMAP' ? 'Neural Map' : cat === 'TIMELINE' ? 'Chronos' : 'Data Matrix'}</span>
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
                        className="bg-[#0a0a0a] border border-white/[0.06] rounded-[2rem] p-8 min-h-[400px] relative overflow-hidden flex flex-col items-center justify-center"
                    >
                        <div className="absolute top-6 left-8">
                            <h3 className="text-xs font-black text-white/90 uppercase tracking-[0.2em]">Neural Topology</h3>
                            <p className="text-[10px] text-white/30 uppercase mt-1 tracking-widest font-bold">GS Paper 2: Polity Connections</p>
                        </div>

                        {/* Visual Mindmap Mockup */}
                        <div className="relative w-full h-full flex items-center justify-center">
                            <motion.div
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="w-24 h-24 rounded-full border border-white/20 bg-white/[0.02] flex items-center justify-center text-center p-4 relative z-10"
                            >
                                <span className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">Preamble</span>

                                {/* Connection Lines (SVG) */}
                                <svg className="absolute inset-0 -z-10 overflow-visible pointer-events-none" style={{ width: '100%', height: '100%' }}>
                                    {[0, 90, 180, 270].map((angle) => (
                                        <line
                                            key={angle}
                                            x1="50%" y1="50%"
                                            x2={`${50 + 60 * Math.cos(angle * Math.PI / 180)}%`}
                                            y2={`${50 + 60 * Math.sin(angle * Math.PI / 180)}%`}
                                            stroke="rgba(255,255,255,0.1)" strokeWidth="1"
                                        />
                                    ))}
                                </svg>
                            </motion.div>

                            {/* Outer Nodes */}
                            {[
                                { label: 'Justice', pos: 'top-10 left-10' },
                                { label: 'Liberty', pos: 'top-10 right-10' },
                                { label: 'Equality', pos: 'bottom-10 left-10' },
                                { label: 'Fraternity', pos: 'bottom-10 right-10' },
                            ].map((node, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.2 }}
                                    className={`absolute ${node.pos} w-16 h-16 rounded-2xl border border-white/5 bg-white/[0.01] flex items-center justify-center p-2 text-center transition-all hover:bg-white/[0.05] cursor-pointer`}
                                >
                                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{node.label}</span>
                                </motion.div>
                            ))}
                        </div>

                        <div className="absolute bottom-8 right-8 flex gap-2">
                            <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-black text-white/40 uppercase tracking-widest">Connective IQ: 88</div>
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
                        className="bg-[#0a0a0a] border border-white/[0.06] rounded-[2rem] p-8 min-h-[400px] flex flex-col"
                    >
                        <div className="mb-10">
                            <h3 className="text-xs font-black text-white/90 uppercase tracking-[0.2em]">Chronos Flow</h3>
                            <p className="text-[10px] text-white/30 uppercase mt-1 tracking-widest font-bold">Modern History: 1857 - 1947</p>
                        </div>

                        <div className="flex-1 border-l-2 border-white/10 ml-4 space-y-12 relative">
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
                                    className="relative pl-10"
                                >
                                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-black border-2 border-[#00ffcc] shadow-[0_0_10px_#00ffcc]" />
                                    <span className="text-[10px] font-black text-[#00ffcc] uppercase tracking-widest mb-1 block">{step.year}</span>
                                    <h4 className="text-sm font-bold text-white/90 mb-1">{step.title}</h4>
                                    <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest leading-none">{step.intel}</p>
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
                        className="bg-[#0a0a0a] border border-white/[0.06] rounded-[2rem] p-8 min-h-[400px]"
                    >
                        <div className="mb-8">
                            <h3 className="text-xs font-black text-white/90 uppercase tracking-[0.2em]">Data Matrix</h3>
                            <p className="text-[10px] text-white/30 uppercase mt-1 tracking-widest font-bold">Constitutional Bodies Comparison</p>
                        </div>

                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="py-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Body</th>
                                        <th className="py-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Article</th>
                                        <th className="py-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Appointment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02]">
                                    {[
                                        { name: 'ECI', art: '324', auth: 'President' },
                                        { name: 'UPSC', art: '315-323', auth: 'President' },
                                        { name: 'SPSC', art: '315-323', auth: 'Governor' },
                                        { name: 'CAG', art: '148', auth: 'President' },
                                        { name: 'AGI', art: '76', auth: 'President' },
                                    ].map((row, i) => (
                                        <tr key={i} className="group hover:bg-white/[0.01] transition-colors">
                                            <td className="py-4 text-[11px] font-black text-white uppercase tracking-wider">{row.name}</td>
                                            <td className="py-4 text-[10px] font-bold text-[#00ffcc] tabular-nums">{row.art}</td>
                                            <td className="py-4 text-[10px] font-medium text-white/40 uppercase tracking-widest">{row.auth}</td>
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

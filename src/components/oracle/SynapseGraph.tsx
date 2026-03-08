'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Synapse Graph (Knowledge Graph)
// Visualizes how a single topic impacts multiple subjects,
// reinforcing cross-disciplinary understanding for Mains.
// ═══════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import { Subject } from '@/types';
import { useState } from 'react';

// Mock data: A single node's cross-subject impact
const mockSynapses = {
    'Land Reforms': [
        { subject: Subject.HISTORY, impact: 'Abolition of Zamindari and post-independence consolidation.' },
        { subject: Subject.ECONOMY, impact: 'Redistribution of wealth, agricultural productivity changes.' },
        { subject: Subject.POLITY, impact: 'First Amendment Act, Schedule 9, and Right to Property.' },
    ],
    'Monetary Policy': [
        { subject: Subject.ECONOMY, impact: 'Inflation targeting and repo rate mechanisms.' },
        { subject: Subject.CURRENT_AFFAIRS, impact: 'Recent RBI MPC decisions and global rate hikes.' },
    ]
};

export default function SynapseGraph({ activeTopic = 'Land Reforms' }: { activeTopic?: string }) {
    const [selectedSynapse, setSelectedSynapse] = useState<number | null>(null);
    const nodes = mockSynapses[activeTopic as keyof typeof mockSynapses] || [];

    if (nodes.length === 0) return null;

    // Fixed radial positions for up to 4 satellite nodes (Top, Right, Bottom, Left)
    const positions = [
        { x: 0, y: -100 },
        { x: 100, y: 0 },
        { x: 0, y: 100 },
        { x: -100, y: 0 },
    ];

    return (
        <div className="w-full max-w-lg mx-auto bg-black/40 rounded-3xl p-6 border border-white/5 shadow-2xl overflow-hidden relative min-h-[400px]">
            {/* Header */}
            <div className="text-center mb-10 relative z-20">
                <p className="text-[10px] text-indigo-400 font-bold tracking-[0.2em] uppercase mb-1">
                    Cross-Subject Synapse
                </p>
                <h3 className="text-xl font-black text-white">{activeTopic}</h3>
            </div>

            {/* Graph Canvas */}
            <div className="relative w-full h-[250px] flex items-center justify-center">
                {/* Connecting Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                    <defs>
                        <radialGradient id="lineGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="rgba(99,102,241,0.8)" />
                            <stop offset="100%" stopColor="rgba(99,102,241,0.1)" />
                        </radialGradient>
                    </defs>
                    {nodes.map((_, i) => (
                        <motion.line
                            key={i}
                            x1="50%"
                            y1="50%"
                            x2={`calc(50% + ${positions[i].x}px)`}
                            y2={`calc(50% + ${positions[i].y}px)`}
                            stroke="url(#lineGlow)"
                            strokeWidth={selectedSynapse === i ? 3 : 1}
                            strokeDasharray={selectedSynapse === i ? "none" : "4 4"}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, delay: i * 0.2 }}
                            className="transition-all duration-300"
                        />
                    ))}
                </svg>

                {/* Central Node */}
                <motion.div
                    className="absolute z-10 w-16 h-16 bg-indigo-900/80 rounded-full border-2 border-indigo-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setSelectedSynapse(null)}
                >
                    <span className="text-2xl">🧠</span>
                </motion.div>

                {/* Satellite Nodes */}
                {nodes.map((node, i) => (
                    <motion.div
                        key={i}
                        className="absolute z-20 flex flex-col items-center justify-center cursor-pointer group"
                        initial={{ opacity: 0, x: 0, y: 0 }}
                        animate={{ opacity: 1, x: positions[i].x, y: positions[i].y }}
                        transition={{ duration: 0.6, delay: 0.2 + i * 0.2, type: 'spring' }}
                        onClick={() => setSelectedSynapse(i)}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${selectedSynapse === i
                            ? 'bg-indigo-500/20 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                            : 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40'
                            }`}>
                            <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">
                                {node.subject.substring(0, 3).toUpperCase()}
                            </span>
                        </div>

                        {/* Tooltip / Impact Description */}
                        <AnimatePresence>
                            {selectedSynapse === i && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 5, scale: 0.9 }}
                                    className="absolute top-14 w-48 p-3 bg-black/90 border border-indigo-500/30 rounded-xl shadow-xl z-30"
                                >
                                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                        {node.subject} Impact
                                    </p>
                                    <p className="text-xs leading-relaxed text-white/80">
                                        {node.impact}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            <div className="mt-4 text-center">
                <p className="text-[10px] text-white/30 uppercase tracking-widest">
                    Tap nodes to expand inter-disciplinary insight
                </p>
            </div>
        </div>
    );
}

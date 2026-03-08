'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Visual Confidence Brain
// Renders an abstract glowing "mind map" of user knowledge
// density across different subjects.
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useProgressStore } from '@/store/progressStore';
import { Subject } from '@/types';

// Positions for a stylized "brain" or "network" map
const NODE_POSITIONS: Partial<Record<Subject, { top: string; left: string; delay: number }>> = {
    [Subject.HISTORY]: { top: '20%', left: '30%', delay: 0 },
    [Subject.POLITY]: { top: '35%', left: '70%', delay: 0.1 },
    [Subject.GEOGRAPHY]: { top: '65%', left: '20%', delay: 0.2 },
    [Subject.ECONOMY]: { top: '75%', left: '60%', delay: 0.3 },
    [Subject.ENVIRONMENT]: { top: '50%', left: '45%', delay: 0.4 },
    [Subject.SCIENCE]: { top: '30%', left: '50%', delay: 0.5 },
    [Subject.CURRENT_AFFAIRS]: { top: '60%', left: '80%', delay: 0.6 },
};

export default function VisualConfidenceBrain() {
    const { subjectStats } = useProgressStore();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const subjects = Object.values(Subject);

    return (
        <div className="relative w-full aspect-square max-w-sm mx-auto bg-black/40 rounded-full border border-white/[0.03] shadow-[inset_0_0_100px_rgba(255,255,255,0.02)] overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />

            {/* Title / Overlay */}
            <div className="absolute top-6 inset-x-0 text-center z-20 pointer-events-none">
                <p className="text-[9px] text-white/30 uppercase tracking-[3px] font-bold">Heat-Map of Ignorance</p>
                <p className="text-[8px] text-rose-400/70 mt-0.5 font-bold uppercase tracking-wider">Exposing Blind Spots</p>
            </div>

            {/* Synapse Lines (Simulated SVG connections between nodes) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                {subjects.map((subjA, i) => {
                    const posA = NODE_POSITIONS[subjA as Subject];
                    if (!posA) return null;
                    return subjects.slice(i + 1).map((subjB) => {
                        const posB = NODE_POSITIONS[subjB as Subject];
                        if (!posB) return null;
                        // Only draw a line if at least one subject has been touched
                        const activeA = subjectStats[subjA as Subject]?.total > 0;
                        const activeB = subjectStats[subjB as Subject]?.total > 0;
                        if (!activeA && !activeB) return null;

                        const strokeColor = activeA && activeB ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.05)';
                        const strokeWidth = activeA && activeB ? 1.5 : 0.5;

                        return (
                            <line
                                key={`${subjA}-${subjB}`}
                                x1={posA.left}
                                y1={posA.top}
                                x2={posB.left}
                                y2={posB.top}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                strokeDasharray="4 4"
                                className={activeA && activeB ? 'animate-pulse' : ''}
                            />
                        );
                    });
                })}
            </svg>

            {/* Neural Nodes (Subjects) */}
            {subjects.map((subject) => {
                const stat = subjectStats[subject as Subject] || { total: 0, accuracy: 0 };
                const pos = NODE_POSITIONS[subject as Subject];
                if (!pos) return null;

                // Determine node appearance based on mastery
                const hasStarted = stat.total > 0;
                const mastery = stat.accuracy; // 0 to 100

                let nodeColor = 'bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)]';
                let pulseColor = 'rgba(255,255,255,0.1)';
                let sizeClass = 'w-6 h-6';

                if (hasStarted) {
                    if (mastery >= 80) {
                        nodeColor = 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]';
                        pulseColor = 'rgba(255,255,255,0.4)';
                        sizeClass = 'w-10 h-10';
                    } else if (mastery >= 50) {
                        nodeColor = 'bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.5)]';
                        pulseColor = 'rgba(129,140,248,0.3)';
                        sizeClass = 'w-8 h-8';
                    } else {
                        nodeColor = 'bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.4)]';
                        pulseColor = 'rgba(251,146,60,0.2)';
                        sizeClass = 'w-7 h-7';
                    }
                } else {
                    // Phase 18: Blind Spot (Ignorance)
                    nodeColor = 'bg-rose-900/80 shadow-[0_0_20px_rgba(225,29,72,0.8)] border-rose-500/50';
                    pulseColor = 'rgba(225,29,72,0.5)';
                    sizeClass = 'w-8 h-8';
                }

                return (
                    <motion.button
                        key={subject}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 + pos.delay, type: 'spring' }}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center group"
                        style={{ top: pos.top, left: pos.left }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="relative flex items-center justify-center">
                            {/* Outer Pulse Ring */}
                            <motion.div
                                className="absolute inset-[-4px] rounded-full"
                                style={{ border: `1px solid ${pulseColor}` }}
                                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: hasStarted ? 3 : 1.5, repeat: Infinity, delay: pos.delay }}
                            />

                            {/* Core Node */}
                            <div className={`${sizeClass} rounded-full transition-all duration-700 ${nodeColor} flex items-center justify-center border border-white/20`}>
                                {!hasStarted && <span className="text-[10px] text-rose-200 font-bold">!</span>}
                            </div>
                        </div>

                        {/* Subject Label */}
                        <div className="absolute top-full mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 bg-black/80 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/5">
                            <p className="text-[9px] font-bold text-white tracking-wider uppercase">
                                {subject}
                            </p>
                            {hasStarted ? (
                                <p className="text-[8px] text-white/50 text-center tabular-nums">
                                    {Math.round(mastery)}% Acc
                                </p>
                            ) : (
                                <p className="text-[8px] text-rose-400 text-center font-bold tracking-widest uppercase mt-0.5">
                                    Blind Spot
                                </p>
                            )}
                        </div>
                    </motion.button>
                );
            })}
        </div >
    );
}

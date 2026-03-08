'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — NeedleGauge Component
// Collapsible on mobile, full gauge on desktop
// Animated SVG gauge showing Rank Probability
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgressStore } from '@/store/progressStore';

export default function NeedleGauge() {
    const {
        rankProbability,
        accuracy,
        totalReviewed,
        currentStreak,
        bestStreak,
    } = useProgressStore();

    const [isExpanded, setIsExpanded] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Prevent SSR hydration mismatch — SVG math produces different floats on server vs client
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    // Gauge geometry
    const centerX = 120;
    const centerY = 110;
    const radius = 85;
    const startAngle = 220;
    const endAngle = 320;
    const totalSweep = endAngle - startAngle;

    const needleAngle = startAngle + (rankProbability / 100) * totalSweep;

    const createArc = (start: number, end: number, r: number) => {
        const startRad = (start * Math.PI) / 180;
        const endRad = (end * Math.PI) / 180;
        const x1 = centerX + r * Math.cos(startRad);
        const y1 = centerY + r * Math.sin(startRad);
        const x2 = centerX + r * Math.cos(endRad);
        const y2 = centerY + r * Math.sin(endRad);
        const largeArc = end - start > 180 ? 1 : 0;
        return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
    };

    const getColor = (prob: number) => {
        if (prob >= 70) return { gradient: ['#818cf8', '#a5b4fc'], label: 'Excellent' };
        if (prob >= 45) return { gradient: ['#f59e0b', '#fbbf24'], label: 'Good' };
        if (prob >= 20) return { gradient: ['#f97316', '#fb923c'], label: 'Developing' };
        return { gradient: ['#ef4444', '#f87171'], label: 'Starting' };
    };

    const colorInfo = getColor(rankProbability);

    return (
        <motion.div
            className="fixed bottom-4 left-3 sm:bottom-6 sm:left-4 z-40"
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* ═══ MINI PILL (mobile default) ═══ */}
            <motion.button
                className="sm:hidden flex items-center gap-2 bg-black/80 backdrop-blur-xl rounded-full border border-white/15 px-3 py-2 shadow-2xl cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
                whileTap={{ scale: 0.95 }}
                layout
            >
                {/* Mini arc indicator */}
                <svg viewBox="0 0 32 20" className="w-7 h-5 flex-shrink-0">
                    <path
                        d="M 4 18 A 12 12 0 0 1 28 18"
                        fill="none"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <path
                        d={`M 4 18 A 12 12 0 0 1 ${4 + 24 * Math.min(rankProbability / 100, 1)} ${18 - 12 * Math.sin(Math.PI * Math.min(rankProbability / 100, 1))}`}
                        fill="none"
                        stroke={colorInfo.gradient[0]}
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                </svg>
                <span className="text-sm font-bold text-white tabular-nums">
                    {rankProbability.toFixed(1)}%
                </span>
                <span className="text-[10px] text-white/40">
                    🔥{currentStreak}
                </span>
                <motion.span
                    className="text-white/30 text-xs ml-0.5"
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                >
                    ▲
                </motion.span>
            </motion.button>

            {/* ═══ EXPANDED PANEL (mobile tap-to-expand) ═══ */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        className="sm:hidden absolute bottom-full left-0 mb-2 bg-black/85 backdrop-blur-2xl rounded-2xl border border-white/10 p-3 shadow-2xl"
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        transition={{ duration: 0.25 }}
                    >
                        <svg viewBox="0 0 240 140" className="mx-auto w-[180px] h-[105px]">
                            <path d={createArc(startAngle, endAngle, radius)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
                            <motion.path
                                d={createArc(startAngle, startAngle + (rankProbability / 100) * totalSweep, radius)}
                                fill="none" stroke="url(#gaugeGradientMobile)" strokeWidth="12" strokeLinecap="round"
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                            <defs>
                                <linearGradient id="gaugeGradientMobile" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor={colorInfo.gradient[0]} />
                                    <stop offset="100%" stopColor={colorInfo.gradient[1]} />
                                </linearGradient>
                            </defs>
                            <motion.line x1={centerX} y1={centerY}
                                x2={centerX + (radius - 20) * Math.cos((needleAngle * Math.PI) / 180)}
                                y2={centerY + (radius - 20) * Math.sin((needleAngle * Math.PI) / 180)}
                                stroke="white" strokeWidth="2.5" strokeLinecap="round"
                                initial={{ x2: centerX + (radius - 20) * Math.cos((startAngle * Math.PI) / 180), y2: centerY + (radius - 20) * Math.sin((startAngle * Math.PI) / 180) }}
                                animate={{ x2: centerX + (radius - 20) * Math.cos((needleAngle * Math.PI) / 180), y2: centerY + (radius - 20) * Math.sin((needleAngle * Math.PI) / 180) }}
                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            />
                            <circle cx={centerX} cy={centerY} r="5" fill="white" />
                            <circle cx={centerX} cy={centerY} r="3" fill={colorInfo.gradient[0]} />
                            <text x={centerX} y={centerY - 20} textAnchor="middle" className="fill-white" style={{ fontSize: '28px', fontWeight: 800 }}>
                                {rankProbability.toFixed(1)}%
                            </text>
                            <text x={centerX} y={centerY - 4} textAnchor="middle" className="fill-white/40" style={{ fontSize: '9px', letterSpacing: '2px' }}>
                                RANK PROBABILITY
                            </text>
                        </svg>
                        <div className="flex items-center justify-between px-2 mt-1 text-center">
                            <div>
                                <p className="text-[9px] text-white/30 uppercase tracking-wider">Accuracy</p>
                                <p className="text-xs font-bold text-white/80">{accuracy}%</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-white/30 uppercase tracking-wider">Reviewed</p>
                                <p className="text-xs font-bold text-white/80">{totalReviewed}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-white/30 uppercase tracking-wider">Streak</p>
                                <p className="text-xs font-bold text-white/80">
                                    🔥 {currentStreak}
                                    <span className="text-[9px] text-white/30 ml-1">/ {bestStreak}</span>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ FULL GAUGE (desktop, always visible) ═══ */}
            <motion.div
                className="hidden sm:block relative bg-black/70 backdrop-blur-2xl rounded-3xl border border-white/10 p-4 shadow-2xl"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
            >
                <svg viewBox="0 0 240 140" className="mx-auto w-[240px] h-[140px]">
                    <path d={createArc(startAngle, endAngle, radius)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
                    <motion.path
                        d={createArc(startAngle, startAngle + (rankProbability / 100) * totalSweep, radius)}
                        fill="none" stroke="url(#gaugeGradientDesktop)" strokeWidth="12" strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: 'easeOut', delay: 1.2 }}
                    />
                    <defs>
                        <linearGradient id="gaugeGradientDesktop" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={colorInfo.gradient[0]} />
                            <stop offset="100%" stopColor={colorInfo.gradient[1]} />
                        </linearGradient>
                    </defs>
                    <motion.line x1={centerX} y1={centerY}
                        x2={centerX + (radius - 20) * Math.cos((needleAngle * Math.PI) / 180)}
                        y2={centerY + (radius - 20) * Math.sin((needleAngle * Math.PI) / 180)}
                        stroke="white" strokeWidth="2.5" strokeLinecap="round"
                        initial={{ x2: centerX + (radius - 20) * Math.cos((startAngle * Math.PI) / 180), y2: centerY + (radius - 20) * Math.sin((startAngle * Math.PI) / 180) }}
                        animate={{ x2: centerX + (radius - 20) * Math.cos((needleAngle * Math.PI) / 180), y2: centerY + (radius - 20) * Math.sin((needleAngle * Math.PI) / 180) }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 1.2 }}
                    />
                    <circle cx={centerX} cy={centerY} r="5" fill="white" />
                    <circle cx={centerX} cy={centerY} r="3" fill={colorInfo.gradient[0]} />
                    <text x={centerX} y={centerY - 20} textAnchor="middle" className="fill-white text-2xl font-bold" style={{ fontSize: '28px', fontWeight: 800 }}>
                        {rankProbability.toFixed(1)}%
                    </text>
                    <text x={centerX} y={centerY - 4} textAnchor="middle" className="fill-white/40" style={{ fontSize: '9px', letterSpacing: '2px' }}>
                        RANK PROBABILITY
                    </text>
                </svg>

                <div className="flex items-center justify-between px-2 mt-1">
                    <div className="text-center">
                        <p className="text-[10px] text-white/30 uppercase tracking-wider">Accuracy</p>
                        <p className="text-sm font-bold text-white/80">{accuracy}%</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-white/30 uppercase tracking-wider">Reviewed</p>
                        <p className="text-sm font-bold text-white/80">{totalReviewed}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-white/30 uppercase tracking-wider">Streak</p>
                        <p className="text-sm font-bold text-white/80">
                            🔥 {currentStreak}
                            <span className="text-[10px] text-white/30 ml-1">/ {bestStreak}</span>
                        </p>
                    </div>
                </div>

                <motion.div
                    className="mt-2 text-center"
                    key={colorInfo.label}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <span
                        className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                        style={{
                            background: `${colorInfo.gradient[0]}20`,
                            color: colorInfo.gradient[1],
                            border: `1px solid ${colorInfo.gradient[0]}40`,
                        }}
                    >
                        {colorInfo.label}
                    </span>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

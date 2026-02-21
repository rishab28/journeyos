'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Subject Mastery Cards
// Horizontal scrollable row showing per-subject accuracy
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProgressStore } from '@/store/progressStore';
import { Subject } from '@/types';

const SUBJECT_ICONS: Record<string, string> = {
    'Polity': '🏛️',
    'History': '📜',
    'Geography': '🌍',
    'Economy': '💰',
    'Science': '🔬',
    'Environment': '🌿',
    'Current Affairs': '📰',
    'Ethics': '⚖️',
    'Mathematics': '📐',
    'Reasoning': '🧩',
};

function getBarColor(accuracy: number): { bar: string; text: string } {
    if (accuracy >= 60) return { bar: 'linear-gradient(135deg, #10b981, #34d399)', text: 'text-emerald-400' };
    if (accuracy >= 30) return { bar: 'linear-gradient(135deg, #f59e0b, #fbbf24)', text: 'text-amber-400' };
    return { bar: 'linear-gradient(135deg, #ef4444, #f87171)', text: 'text-rose-400' };
}

export default function SubjectMastery() {
    const subjectStats = useProgressStore((s) => s.subjectStats);

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    // Only show subjects with at least 1 attempt
    const activeSubjects = Object.values(Subject)
        .filter((s) => subjectStats[s]?.total > 0)
        .sort((a, b) => (subjectStats[b]?.accuracy || 0) - (subjectStats[a]?.accuracy || 0));

    if (activeSubjects.length === 0) return null;

    return (
        <motion.div
            className="w-full px-4 py-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
        >
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
                Subject Mastery
            </p>

            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                {activeSubjects.map((subject, i) => {
                    const stat = subjectStats[subject];
                    const colors = getBarColor(stat.accuracy);
                    const icon = SUBJECT_ICONS[subject] || '📚';

                    return (
                        <motion.div
                            key={subject}
                            className="flex-shrink-0 w-[130px] p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i, duration: 0.3 }}
                        >
                            <div className="flex items-center gap-1.5 mb-2">
                                <span className="text-sm">{icon}</span>
                                <p className="text-[11px] font-bold text-white/70 truncate">{subject}</p>
                            </div>

                            {/* Accuracy bar */}
                            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-1.5">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: colors.bar }}
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${stat.accuracy}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 + 0.1 * i }}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <p className={`text-xs font-black tabular-nums ${colors.text}`}>
                                    {stat.accuracy}%
                                </p>
                                <p className="text-[9px] text-white/20">
                                    {stat.correct}/{stat.total}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}

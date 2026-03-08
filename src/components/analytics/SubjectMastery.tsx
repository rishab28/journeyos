'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Subject Mastery Cards
// Horizontal scrollable row showing per-subject accuracy
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProgressStore } from '@/store/progressStore';
import { useSRSStore } from '@/store/srsStore';
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
    'PYQs': '🏆',
    'UPSC Notifications': '📢',
};

function getBarColor(accuracy: number): { bar: string; text: string } {
    if (accuracy >= 70) return { bar: 'linear-gradient(135deg, #6366f1, #818cf8)', text: 'text-indigo-400' };
    if (accuracy >= 40) return { bar: 'linear-gradient(135deg, #94a3b8, #cbd5e1)', text: 'text-slate-400' };
    return { bar: 'linear-gradient(135deg, #f43f5e, #fb7185)', text: 'text-rose-400' };
}

export default function SubjectMastery() {
    const subjectStats = useProgressStore((s) => s.subjectStats);
    const subjectMastery = useSRSStore((s) => s.subjectMastery);

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    // Only show subjects with at least 1 attempt
    const activeSubjects = Object.values(Subject)
        .filter((s) => subjectStats[s]?.total > 0)
        .sort((a, b) => (subjectMastery[b] || 0) - (subjectMastery[a] || 0));

    if (activeSubjects.length === 0) return null;

    return (
        <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
        >
            <p className="font-caps text-white/20 tracking-[0.3em] text-[10px] mb-6 uppercase px-1">
                SUBJECT MASTERY
            </p>

            <div className="flex gap-4 overflow-x-auto pb-6 -mx-2 px-2 no-scrollbar">
                {activeSubjects.map((subject, i) => {
                    const stat = subjectStats[subject];
                    const mastery = subjectMastery[subject] || 0;
                    const colors = getBarColor(mastery);
                    const icon = SUBJECT_ICONS[subject] || '📚';

                    return (
                        <motion.div
                            key={subject}
                            className="flex-shrink-0 w-[160px] p-5 rounded-[28px] glass-card-premium group hover:border-indigo-500/30 transition-all duration-500"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xl group-hover:scale-110 transition-transform duration-500">{icon}</span>
                                <p className="text-[12px] font-bold text-white/80 truncate tracking-tight">{subject}</p>
                            </div>

                            {/* Neural Stability bar */}
                            <div className="h-1.5 rounded-full bg-white/[0.03] overflow-hidden mb-3">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: colors.bar }}
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${mastery}%` }}
                                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 + 0.1 * i }}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <p className={`text-[13px] font-bold tabular-nums ${colors.text}`}>
                                    {mastery}<span className="text-[9px] opacity-40 ml-0.5">%</span>
                                </p>
                                <p className="font-caps text-[8px] text-white/20 tracking-widest">
                                    {stat?.total} CARDS
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div >
        </motion.div >
    );
}

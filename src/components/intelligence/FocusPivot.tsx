'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';
import { Subject, CardType } from '@/types';
import { useState } from 'react';
import { Target } from 'lucide-react';

export default function FocusPivot() {
    const activeSubject = useSRSStore((s) => s.activeSubject);
    const activeChapter = useSRSStore((s) => s.activeChapter);
    const activeType = useSRSStore((s) => s.activeType);
    const availableFilters = useSRSStore((s) => s.availableFilters);
    const setFilters = useSRSStore((s) => s.setFilters);
    const [isExpanded, setIsExpanded] = useState(false);

    const subjects = ['Mixed', ...availableFilters.subjects];
    const chapters = availableFilters.chapters;

    return (
        <div className="fixed top-24 left-6 right-6 z-[60] flex flex-col gap-3">
            {/* Subject Level */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 items-center">
                <button
                    onClick={() => {
                        setFilters({ type: activeType === CardType.PYQ ? 'All' : CardType.PYQ, subject: 'Mixed', topic: null, chapter: null });
                    }}
                    className={`flex items-center shrink-0 gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${activeType === CardType.PYQ
                        ? 'bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-white/[0.03] text-amber-500/50 border-white/5 hover:bg-amber-500/10 hover:text-amber-500'
                        }`}
                >
                    <Target size={12} />
                    PYQ Only
                </button>
                <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />
                {subjects.map((s) => (
                    <button
                        key={s}
                        onClick={() => {
                            setFilters({ subject: s as any, topic: null, chapter: null, type: 'All' });
                            if (s !== 'Mixed') setIsExpanded(true);
                            else setIsExpanded(false);
                        }}
                        className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${activeSubject === s && activeType !== CardType.PYQ
                            ? 'bg-white text-black border-white'
                            : 'bg-white/[0.03] text-white/40 border-white/5 hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        {s}
                    </button>
                ))
                }
            </div >

            {/* Chapter Level (Conditional) */}
            <AnimatePresence>
                {
                    isExpanded && chapters.length > 0 && activeType !== CardType.PYQ && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex gap-2 overflow-x-auto no-scrollbar pb-2"
                        >
                            <button
                                onClick={() => setFilters({ chapter: null })}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight transition-all whitespace-nowrap border ${activeChapter === null
                                    ? 'bg-white/20 text-white border-white/30'
                                    : 'bg-white/[0.01] text-white/20 border-white/5 hover:text-white/40'
                                    }`}
                            >
                                All Chapters
                            </button>
                            {
                                chapters.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setFilters({ chapter: c })}
                                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight transition-all whitespace-nowrap border ${activeChapter === c
                                            ? 'bg-white/20 text-white border-white/30'
                                            : 'bg-white/[0.01] text-white/20 border-white/5 hover:text-white/40'
                                            }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                        </motion.div>
                    )}
            </AnimatePresence>
        </div>
    );
}

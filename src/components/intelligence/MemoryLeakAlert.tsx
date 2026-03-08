'use client';

import { useSRSStore } from '@/store/srsStore';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function MemoryLeakAlert() {
    const cards = useSRSStore((s) => s.cards);
    const msi = useSRSStore((s) => s.msi);
    const [isBreathingMode, setIsBreathingMode] = useState(false);

    useEffect(() => {
        if (msi < 30) {
            setIsBreathingMode(true);
        }
    }, [msi]);

    if (isBreathingMode) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-rose-950/40 rounded-3xl border border-rose-500/20 text-center relative overflow-hidden mb-6">
                <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />
                <span className="text-4xl mb-3 relative z-10">🫁</span>
                <h3 className="text-lg font-bold text-rose-400 uppercase tracking-widest mb-2 relative z-10">Cognitive Fatigue Detected</h3>
                <p className="text-white/60 text-xs leading-relaxed mb-6 font-medium relative z-10">
                    Your Mental Stamina Index (MSI) has dropped below 30%. Your retention rate is projected at &lt;40%.
                    <br /><br />Enforcing a 3-minute biological reset.
                </p>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative z-10">
                    <motion.div
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 180, ease: 'linear' }}
                        onAnimationComplete={() => setIsBreathingMode(false)}
                        className="h-full bg-indigo-500"
                    />
                </div>
                <p className="text-[10px] text-indigo-500/50 mt-3 font-bold tracking-[0.3em] uppercase relative z-10 animate-pulse">
                    Breathe
                </p>
            </div>
        );
    }

    // Find cards that are in the "Red Zone" (interval < 2 days AND easeFactor < 2.0)
    // Means the user is repeatedly forgetting these specific concepts.
    const leakingCards = cards.filter(c => c.srs.interval < 2 && c.srs.easeFactor < 2.0);

    if (leakingCards.length === 0) {
        return (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-500/[0.05] border border-indigo-500/10">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-sm">🛡️</div>
                <div>
                    <p className="text-xs font-bold text-indigo-400">Zero Weak-Links</p>
                    <p className="text-[10px] text-white/40">You have no concepts in the Death-Zone.</p>
                </div>
            </div>
        );
    }

    const leaksByTopic = leakingCards.reduce((acc, card) => {
        const topic = card.syllabusTopic || card.topic;
        acc[topic] = (acc[topic] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topLeaks = Object.entries(leaksByTopic)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-rose-500 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        Critical Leaks Detected
                    </h3>
                    <p className="text-sm font-medium text-white/80 mt-1">
                        <span className="text-rose-400 font-bold">{leakingCards.length} concepts</span> decaying rapidly
                    </p>
                    <p className="text-[10px] text-white/40 mt-1">Retention span &lt; 3 days</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            </div>

            <div className="space-y-3 pt-2">
                {topLeaks.map(([topic, count], i) => (
                    <motion.div
                        key={topic}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative overflow-hidden flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
                    >
                        {/* Subtle red gradient on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                            <span className="text-sm text-white font-medium truncate max-w-[200px]">{topic}</span>
                        </div>
                        <div className="relative z-10 flex items-center gap-2">
                            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Cards</span>
                            <span className="text-sm font-black tabular-nums text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                                {count}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <button className="w-full mt-2 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-400 transition-colors text-white text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                Seal Memory Leaks Now
            </button>
        </div>
    );
}

'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Duel Engine (1v1 Competitive Blitz)
// High-stakes random matchmaking for MCQ mastery
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';
import { triggerHaptic } from '@/lib/core/haptics';
import { CardType } from '@/types';
import { trackCognitiveAction } from '@/app/actions/learner';

type DuelState = 'IDLE' | 'MATCHING' | 'BATTLE' | 'RESULT';

export default function DuelSystem() {
    const { cards } = useSRSStore();
    const [state, setState] = useState<DuelState>('IDLE');
    const [score, setScore] = useState({ user: 0, opponent: 0 });
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [opponentName, setOpponentName] = useState('');
    const [opponentIQ, setOpponentIQ] = useState(0);

    // Duel Questions (Random selection of 5 MCQs)
    const duelCards = useMemo(() => {
        const filtered = [...cards].filter(c => c.type === CardType.MCQ);
        if (filtered.length === 0) return [];
        return filtered.sort(() => Math.random() - 0.5).slice(0, 5);
    }, [cards, state === 'IDLE']);

    const startMatchmaking = () => {
        if (duelCards.length === 0) {
            import('sonner').then(({ toast }) => toast.error('Shields Down: Not enough MCQs found in the Vault for a Duel.'));
            return;
        }
        triggerHaptic('medium');
        setState('MATCHING');

        // Simulate matchmaking
        const opponents = ['Aspirant_2025', 'I.A.S_Dreamer', 'Polity_Sniper', 'Prelims_Hunter', 'Strategy_Ghost'];
        setTimeout(() => {
            setOpponentName(opponents[Math.floor(Math.random() * opponents.length)]);
            setOpponentIQ(Math.floor(Math.random() * 40) + 60);
            setState('BATTLE');
            triggerHaptic('success');
        }, 2500);
    };

    const handleAnswer = (isCorrect: boolean) => {
        if (isCorrect) {
            setScore(prev => ({ ...prev, user: prev.user + 1 }));
            triggerHaptic('light');
        } else {
            triggerHaptic('warning');
        }

        // Simulate opponent AI answering randomly based on IQ
        setTimeout(() => {
            const oppCorrect = Math.random() < (opponentIQ / 100);
            if (oppCorrect) setScore(prev => ({ ...prev, opponent: prev.opponent + 1 }));
        }, 500);

        if (currentQuestionIdx < 4) {
            setCurrentQuestionIdx(prev => prev + 1);
        } else {
            // Track end of duel as a session event if needed, 
            // but for now we track individual cards
            setTimeout(() => setState('RESULT'), 1000);
        }

        // Telemetry tracking for competitive MCQ
        const card = duelCards[currentQuestionIdx];
        if (card) {
            trackCognitiveAction({
                action: 'card_swiped',
                targetId: card.id,
                metadata: {
                    type: 'BATTLE_MCQ',
                    correct: isCorrect,
                    opponentIQ,
                    score: score.user + (isCorrect ? 1 : 0)
                }
            });
        }
    };

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {state === 'IDLE' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-gradient-to-br from-[#111] to-black border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-white/[0.02] -z-10" />
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-6 shadow-2xl">
                            ⚔️
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Random Duel</h3>
                        <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest max-w-[200px] leading-relaxed">
                            Battle a random aspirant in a 5-question MCQ blitz.
                        </p>

                        <button
                            onClick={startMatchmaking}
                            className="mt-8 px-10 py-4 rounded-full bg-white text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                        >
                            Find Opponent
                        </button>
                    </motion.div>
                )}

                {state === 'MATCHING' && (
                    <motion.div
                        key="matching"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-black border border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center min-h-[300px]"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl"
                            />
                            <div className="w-24 h-24 rounded-full border-2 border-white/5 flex items-center justify-center relative z-10">
                                <span className="text-4xl animate-pulse">📡</span>
                            </div>
                        </div>
                        <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.3em] mt-8 animate-pulse">Matchmaking...</h3>
                        <p className="text-[10px] text-white/20 uppercase font-black mt-2 tracking-widest">Scanning War Room</p>
                    </motion.div>
                )}

                {state === 'BATTLE' && (
                    <motion.div
                        key="battle"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black border border-white/10 rounded-3xl overflow-hidden"
                    >
                        {/* Battle Header */}
                        <div className="flex items-center justify-between p-6 bg-white/[0.03] border-b border-white/5">
                            <div className="text-left flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm border border-indigo-500/30">👤</div>
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase">You</p>
                                    <p className="text-sm font-black text-white">{score.user}</p>
                                </div>
                            </div>
                            <div className="text-center bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Blitz {currentQuestionIdx + 1}/5</span>
                            </div>
                            <div className="text-right flex items-center gap-3 flex-row-reverse">
                                <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-sm border border-rose-500/30">⚔️</div>
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase truncate max-w-[80px]">{opponentName}</p>
                                    <p className="text-sm font-black text-white">{score.opponent}</p>
                                </div>
                            </div>
                        </div>

                        {/* Battle Question */}
                        <div className="p-8">
                            <h4 className="text-lg font-bold text-white leading-tight mb-8">
                                {duelCards[currentQuestionIdx]?.front}
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                {Array.isArray(duelCards[currentQuestionIdx]?.options) &&
                                    duelCards[currentQuestionIdx].options.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleAnswer(opt.isCorrect)}
                                            className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-left text-sm font-medium text-white/80 hover:bg-white/10 hover:border-white/20 active:scale-[0.98] transition-all"
                                        >
                                            {opt.text}
                                        </button>
                                    ))}
                                {(!duelCards[currentQuestionIdx]?.options || duelCards[currentQuestionIdx].options.length === 0) && (
                                    <p className="text-white/20 text-xs text-center py-4">No options found for this intel card.</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {state === 'RESULT' && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-b from-[#111] to-black border border-white/10 rounded-3xl p-10 text-center"
                    >
                        <div className="mb-6">
                            <span className="text-6xl">{score.user > score.opponent ? '🏆' : score.user === score.opponent ? '🤝' : '💀'}</span>
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
                            {score.user > score.opponent ? 'Victory Secure' : score.user === score.opponent ? 'Stalemate' : 'Defeat'}
                        </h3>
                        <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em] mb-8">
                            Final Score: {score.user} - {score.opponent}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">XP Gained</p>
                                <p className="text-xl font-black text-indigo-400">+{score.user * 20}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">IQ Surge</p>
                                <p className="text-xl font-black text-blue-400">+{score.user > score.opponent ? 1.2 : 0.4}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setState('IDLE');
                                setScore({ user: 0, opponent: 0 });
                                setCurrentQuestionIdx(0);
                            }}
                            className="w-full py-4 rounded-2xl bg-white/[0.05] border border-white/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/[0.1] transition-all"
                        >
                            Return to Command Room
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

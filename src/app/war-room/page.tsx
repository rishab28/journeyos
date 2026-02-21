'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — WAR ROOM (Test Simulator)
// Intense, time-bound, full-length mockup simulator with negative marking
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';
import type { StudyCard, MCQOption } from '@/types';
import Link from 'next/link';
import { toast } from 'sonner';

type WarStage = 'BRIEFING' | 'COMBAT' | 'AAR'; // After Action Report

const TOTAL_TIME = 2 * 60 * 60; // 2 Hours in seconds
const QUESTION_COUNT = 100;

export default function WarRoomPage() {
    const cards = useSRSStore((s) => s.cards);
    const fetchLiveCards = useSRSStore((s) => s.fetchLiveCards);

    const [stage, setStage] = useState<WarStage>('BRIEFING');
    const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
    const [combatCards, setCombatCards] = useState<StudyCard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({}); // cardId -> optionId

    // UI Effects
    const [isPulsing, setIsPulsing] = useState(false);

    useEffect(() => { fetchLiveCards(); }, [fetchLiveCards]);

    // Timer logic and intense heartbeat effect
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (stage === 'COMBAT' && timeLeft > 0) {
            timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);

            // Heartbeat pulse when time is running low (last 15 minutes)
            if (timeLeft < 15 * 60) {
                setIsPulsing(timeLeft % 2 === 0);
            }
        } else if (stage === 'COMBAT' && timeLeft === 0) {
            handleSubmitExam();
        }
        return () => clearTimeout(timer);
    }, [stage, timeLeft]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const startCombat = () => {
        // Filter only MCQs for the simulator
        const mcqs = cards.filter(c => c.type === 'MCQ');
        if (mcqs.length < 10) {
            toast.error('Not enough MCQs in the arsenal. Ingest more database to run a simulation.');
            return;
        }

        // Shuffle and pick up to QUESTION_COUNT
        const shuffled = [...mcqs].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(QUESTION_COUNT, shuffled.length));

        setCombatCards(selected);
        setAnswers({});
        setTimeLeft(TOTAL_TIME);
        setStage('COMBAT');

        // Attempt Fullscreen for immersion
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => { });
        }
    };

    const handleAnswer = (optionId: string) => {
        const dId = combatCards[currentIndex].id;
        setAnswers(prev => ({
            ...prev,
            [dId]: prev[dId] === optionId ? '' : optionId // Toggle off if clicked again
        }));
    };

    const handleSubmitExam = () => {
        setStage('AAR');
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        }
    };

    // Calculate score
    const result = useMemo(() => {
        if (stage !== 'AAR') return null;

        let correct = 0;
        let incorrect = 0;
        let unattempted = 0;

        combatCards.forEach(card => {
            const userAnswer = answers[card.id];
            if (!userAnswer) {
                unattempted++;
                return;
            }

            const correctOption = card.options?.find(o => o.isCorrect);
            if (correctOption && correctOption.id === userAnswer) {
                correct++;
            } else {
                incorrect++;
            }
        });

        const marks = (correct * 2) - (incorrect * 0.66);
        return { correct, incorrect, unattempted, marks: parseFloat(marks.toFixed(2)) };
    }, [stage, answers, combatCards]);

    return (
        <main className={`min-h-screen font-sans transition-colors duration-1000 ${stage === 'COMBAT' ? (isPulsing ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-950/40 via-black to-black' : 'bg-[#030000]') : 'bg-[#050505]'
            }`}>
            <AnimatePresence mode="wait">
                {/* ═════════════════ BRIEFING STAGE ═════════════════ */}
                {stage === 'BRIEFING' && (
                    <motion.div
                        key="briefing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center justify-center min-h-screen px-6 text-center max-w-2xl mx-auto"
                    >
                        <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8 relative">
                            <div className="absolute inset-0 rounded-full border border-red-500 animate-[ping_3s_ease-out_infinite]" />
                            <span className="text-4xl">⚔️</span>
                        </div>

                        <h1 className="text-5xl sm:text-7xl font-black text-red-500 tracking-tighter uppercase mb-4 drop-shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                            WAR ROOM
                        </h1>
                        <p className="text-white/60 text-lg sm:text-xl font-medium mb-12 max-w-lg leading-relaxed">
                            Full-length high-stress simulation. 100 Questions. 2 Hours. Negative Marking (+2, -0.66). Once started, exit is prohibited.
                        </p>

                        <button
                            onClick={startCombat}
                            className="group relative px-12 py-5 rounded-full bg-red-600 hover:bg-red-500 transition-all font-black text-white uppercase tracking-[0.3em] overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)] hover:shadow-[0_0_80px_rgba(239,68,68,0.5)]"
                        >
                            <span className="relative z-10">Initiate Combat</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-red-400/0 via-white/20 to-red-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        </button>

                        <Link href="/" className="mt-8 text-white/30 hover:text-white/60 text-xs font-bold uppercase tracking-widest transition-colors">
                            Retreat to Base
                        </Link>
                    </motion.div>
                )}

                {/* ═════════════════ COMBAT STAGE ═════════════════ */}
                {stage === 'COMBAT' && combatCards.length > 0 && (
                    <motion.div
                        key="combat"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col h-screen max-w-4xl mx-auto px-4 sm:px-8 relative"
                    >
                        {/* HUD (Heads Up Display) */}
                        <div className="flex items-center justify-between py-6 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <span className="text-red-500 font-black text-2xl tabular-nums tracking-widest bg-red-950/50 px-4 py-2 rounded-xl border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            <div className="text-center absolute left-1/2 -translate-x-1/2">
                                <span className="text-[10px] uppercase font-bold text-white/30 tracking-[0.3em]">Target</span>
                                <div className="text-white font-black text-xl tracking-widest">
                                    {currentIndex + 1} <span className="text-white/20 text-sm">/ {combatCards.length}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmitExam}
                                className="text-xs font-black uppercase text-white/50 hover:text-white tracking-widest px-4 py-2 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                Submit
                            </button>
                        </div>

                        {/* Question Arena */}
                        <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full py-8">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="w-full"
                            >
                                <div className="mb-6 flex items-center gap-3">
                                    <span className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] bg-white/5 px-2.5 py-1 rounded-md">
                                        {combatCards[currentIndex].subject}
                                    </span>
                                </div>
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white/90 leading-tight md:leading-snug mb-12">
                                    {combatCards[currentIndex].front}
                                </h2>

                                {/* Options Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {combatCards[currentIndex].options?.map((opt: MCQOption) => {
                                        const isSelected = answers[combatCards[currentIndex].id] === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleAnswer(opt.id)}
                                                className={`p-6 rounded-2xl border text-left flex gap-4 transition-all duration-200 ${isSelected
                                                        ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_30px_rgba(37,99,235,0.15)]'
                                                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                                                    }`}
                                            >
                                                <span className={`font-black shrink-0 ${isSelected ? 'text-blue-400' : 'text-white/20'}`}>
                                                    {opt.id.toUpperCase()}
                                                </span>
                                                <span className={`text-base font-medium ${isSelected ? 'text-white' : 'text-white/70'}`}>
                                                    {opt.text}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </div>

                        {/* Navigation Footer */}
                        <div className="py-6 border-t border-white/5 flex items-center justify-between">
                            <button
                                onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
                                disabled={currentIndex === 0}
                                className="px-6 py-3 rounded-xl bg-white/5 text-white/70 font-bold uppercase text-xs tracking-widest disabled:opacity-20 hover:bg-white/10 transition-colors"
                            >
                                Previous
                            </button>

                            {/* Question Palette Indicator (Mini) */}
                            <div className="hidden sm:flex gap-1 overflow-x-auto max-w-sm px-4 hide-scrollbar">
                                {combatCards.map((c, i) => (
                                    <div
                                        key={c.id}
                                        onClick={() => setCurrentIndex(i)}
                                        className={`w-2 h-8 rounded-sm cursor-pointer transition-all ${currentIndex === i
                                                ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                                                : answers[c.id]
                                                    ? 'bg-blue-500/50 hover:bg-blue-400'
                                                    : 'bg-white/10 hover:bg-white/30'
                                            }`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentIndex(p => Math.min(combatCards.length - 1, p + 1))}
                                disabled={currentIndex === combatCards.length - 1}
                                className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold uppercase text-xs tracking-widest hover:bg-white/20 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ═════════════════ AFTER ACTION REPORT ═════════════════ */}
                {stage === 'AAR' && result && (
                    <motion.div
                        key="aar"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="min-h-screen px-4 sm:px-8 py-12 max-w-3xl mx-auto w-full"
                    >
                        <h1 className="text-3xl font-black uppercase text-white tracking-[0.3em] text-center mb-12">After Action Report</h1>

                        {/* Massive Score Hero */}
                        <div className="flex flex-col items-center mb-16">
                            <span className="text-[120px] font-black leading-none drop-shadow-2xl tabular-nums tracking-tighter mix-blend-plus-lighter"
                                style={{ color: result.marks > (combatCards.length * 0.9) ? '#10b981' : (result.marks > (combatCards.length * 0.5) ? '#f59e0b' : '#ef4444') }}>
                                {result.marks}
                            </span>
                            <span className="text-xs font-black uppercase tracking-[0.4em] text-white/30 mt-2">Net Score</span>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4 mb-16 px-4">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl text-center">
                                <div className="text-3xl font-black text-emerald-400 mb-1">{result.correct}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/50">Correct</div>
                            </div>
                            <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl text-center">
                                <div className="text-3xl font-black text-rose-400 mb-1">{result.incorrect}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-rose-500/50">Incorrect</div>
                            </div>
                            <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl text-center">
                                <div className="text-3xl font-black text-white/80 mb-1">{result.unattempted}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Skipped</div>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <Link
                                href="/dashboard"
                                className="px-12 py-5 rounded-full bg-white text-black font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] transition-all"
                            >
                                Analyze Performance
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

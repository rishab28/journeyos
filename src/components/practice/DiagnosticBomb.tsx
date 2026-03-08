'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Diagnostic Bomb (Volume Control)
// Flushes out the 80% fluff if the user already knows the basics
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';
import confetti from 'canvas-confetti';

// 5 Rapid-fire questions to assess baseline competence
const BOMB_QUESTIONS = [
    {
        q: "Which article of the Constitution deals with the formation of new states?",
        options: ["Article 2", "Article 3", "Article 14", "Article 368"],
        ans: 1
    },
    {
        q: "Who is the ex-officio Chairman of the Rajya Sabha?",
        options: ["President", "Vice-President", "Prime Minister", "CJI"],
        ans: 1
    },
    {
        q: "Can a Money Bill be introduced in the Rajya Sabha?",
        options: ["Yes", "No"],
        ans: 1
    },
    {
        q: "What is the maximum gap allowed between two sessions of Parliament?",
        options: ["3 months", "6 months", "9 months", "1 year"],
        ans: 1
    },
    {
        q: "Which schedule contains the Anti-Defection Law?",
        options: ["8th Schedule", "9th Schedule", "10th Schedule", "12th Schedule"],
        ans: 2
    }
];

export default function DiagnosticBomb() {
    const completeDiagnostic = useSRSStore(s => s.completeDiagnostic);
    const [qIndex, setQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isExploding, setIsExploding] = useState(true);
    const [showResult, setShowResult] = useState(false);

    // Initial siren / heartbeat effect
    useEffect(() => {
        const timer = setTimeout(() => setIsExploding(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    const handleAnswer = (selectedIndex: number) => {
        const correct = selectedIndex === BOMB_QUESTIONS[qIndex].ans;
        if (correct) setScore(s => s + 1);

        if (qIndex < BOMB_QUESTIONS.length - 1) {
            setQIndex(qIndex + 1);
        } else {
            // Finished
            setShowResult(true);
            const finalScore = score + (correct ? 1 : 0);
            if (finalScore >= 4) {
                // Fire confetti for skipping the fluff
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#6366f1', '#818cf8', '#ffffff']
                });
            }
        }
    };

    const handleComplete = () => {
        completeDiagnostic(score);
    };

    if (isExploding) {
        return (
            <div className="fixed inset-0 z-[100] bg-red-600 flex items-center justify-center animate-pulse">
                <div className="text-center">
                    <h1 className="text-7xl mb-4">💣</h1>
                    <h2 className="text-4xl font-black text-white uppercase tracking-widest drop-shadow-xl" style={{ fontFamily: 'var(--font-outfit)' }}>
                        Diagnostic Bomb
                    </h2>
                    <p className="text-white/80 font-bold mt-2 uppercase tracking-widest text-sm">Assessing Baseline Competence...</p>
                </div>
                <div className="absolute inset-0 bg-black/50 pointer-events-none mix-blend-multiply" />
            </div>
        );
    }

    if (showResult) {
        const passed = score >= 4;
        return (
            <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white/[0.03] border border-white/10 rounded-3xl p-8 text-center"
                >
                    <div className="text-5xl mb-6">{passed ? '🚀' : '🧱'}</div>
                    <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wider">{passed ? 'Foundation Bypassed' : 'Foundation Required'}</h2>
                    <div className="text-4xl font-black tabular-nums text-indigo-400 mb-4">{score} <span className="text-lg text-white/30">/ 5</span></div>

                    <p className="text-white/60 text-sm leading-relaxed mb-8">
                        {passed
                            ? "High UPSC IQ detected. We have permanently archived 200+ low-yield 'fluff' cards for this topic. You will only see Advanced & Lethal cards."
                            : "Baseline gaps detected. We will feed you the Foundation-level syllabus first before escalating to Advanced topics."}
                    </p>

                    <button
                        onClick={handleComplete}
                        className={`w-full py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors ${passed ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                        Enter The Feed
                    </button>
                </motion.div>
            </div>
        );
    }

    const q = BOMB_QUESTIONS[qIndex];

    return (
        <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col p-6">
            <div className="flex-1 max-w-lg mx-auto w-full flex flex-col justify-center">
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-rose-500 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">Diagnostic {qIndex + 1}/5</span>
                        <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Speed Test</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                        {q.q}
                    </h2>
                </div>

                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {q.options.map((opt, i) => (
                            <motion.button
                                key={`${qIndex}-${i}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => handleAnswer(i)}
                                className="w-full text-left p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-white/90 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
                            >
                                <span className="opacity-40 mr-4 font-mono">{String.fromCharCode(65 + i)}</span>
                                {opt}
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Countdown / Stress bar at bottom */}
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-6">
                <motion.div
                    className="h-full bg-rose-500"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 7, ease: 'linear' }}
                    key={qIndex} // resets animation on new question
                />
            </div>
        </div>
    );
}

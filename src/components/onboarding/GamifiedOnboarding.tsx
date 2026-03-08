'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — The Matrix Download (Onboarding Hook)
// Zero-friction trivia to validate the user's ego instantly.
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgressStore } from '@/store/progressStore';

const TRIVIA = [
    {
        id: 1,
        question: "Why is India aggressively buying crude oil from Russia despite western sanctions?",
        options: [
            { text: "Ideological alignment with Putin", isCorrect: false },
            { text: "Strategic autonomy & 30% discount", isCorrect: true },
        ],
        explanation: "India operates on 'Strategic Autonomy', prioritizing national interest (cheap energy for 1.4B people) over western geopolitical alliances."
    },
    {
        id: 2,
        question: "If the RBI suddenly increases the Repo Rate, what happens instantly?",
        options: [
            { text: "Your home loan EMI goes up", isCorrect: true },
            { text: "Stock market hits an all-time high", isCorrect: false },
        ],
        explanation: "A repo rate hike makes borrowing expensive. Banks pass this cost to you instantly, increasing your EMI to suck liquidity out of the market."
    },
    {
        id: 3,
        question: "Which right allows you to legally refuse to unlock your phone for the police?",
        options: [
            { text: "Right against Self-Incrimination (Art 20)", isCorrect: true },
            { text: "Right to Free Speech (Art 19)", isCorrect: false },
        ],
        explanation: "Article 20(3) of the Constitution protects you from being compelled to be a witness against yourself."
    }
];

export default function GamifiedOnboarding({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(0); // 0 = Intro, 1-3 = Questions, 4 = Result
    const [score, setScore] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);

    const setUPSC_IQ = useProgressStore((s) => s.setUPSC_IQ);

    const handleAnswer = (isCorrect: boolean) => {
        if (isCorrect) setScore(prev => prev + 1);
        setShowExplanation(true);
        setTimeout(() => {
            setShowExplanation(false);
            setStep(prev => prev + 1);
        }, 3500); // Give them 3.5s to read the mind-blowing explanation
    };

    const handleFinish = () => {
        // Calculate fake/ego-inflating IQ based on score (0 = 105, 1 = 115, 2 = 125, 3 = 145)
        const iqScores = [105, 115, 125, 145];
        const finalIQ = iqScores[score] || 115;

        setUPSC_IQ(finalIQ);
        onComplete();
    };


    return (
        <div className="fixed inset-0 z-[100] bg-[#050508] flex items-center justify-center p-8 overflow-hidden">
            {/* ── Ambient Background (Premium Orbs) ── */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-indigo-500/10 blur-[180px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/5 blur-[150px] rounded-full" />
                <div className="absolute inset-0 noise-overlay opacity-[0.04] pointer-events-none" />
            </div>

            <AnimatePresence mode="wait">
                {step === 0 && (
                    <motion.div
                        key="intro-welcome"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
                        className="relative z-10 w-full max-w-2xl text-center"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex justify-center mb-10"
                        >
                            <div className="px-5 py-2 rounded-full glass-panel border-indigo-500/20 bg-indigo-500/5">
                                <span className="font-caps text-[10px] text-indigo-400 tracking-[0.4em] font-black uppercase">INITIALIZING JOURNEY OS</span>
                            </div>
                        </motion.div>

                        <h1 className="text-4xl sm:text-6xl font-bold text-white tracking-tighter leading-none mb-6 font-outfit">
                            Welcome to your <br />
                            <span className="text-indigo-500">Cognitive Engine.</span>
                        </h1>

                        <div className="space-y-6 text-[16px] font-medium text-white/50 px-8 leading-relaxed mb-16 max-w-xl mx-auto tracking-tight">
                            <p>
                                JourneyOS is an elite Spaced Repetition feed built for UPSC.
                            </p>
                            <p>
                                The AI tracks exactly what you forget and automatically feeds you high-yield flashcards exactly when you need to review them.
                            </p>
                        </div>

                        <button
                            onClick={() => setStep(1)}
                            className="bg-white text-black px-16 py-6 rounded-[24px] font-caps text-[13px] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,255,255,0.15)] hover:shadow-[0_25px_50px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all"
                        >
                            BEGIN CALIBRATION
                        </button>
                    </motion.div>
                )}

                {step === 1 && (
                    <motion.div
                        key="intro-trivia"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px)' }}
                        className="relative z-10 w-full max-w-2xl text-center"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex justify-center mb-10"
                        >
                            <div className="px-5 py-2 rounded-full glass-panel border-indigo-500/20 bg-indigo-500/5">
                                <span className="font-caps text-[10px] text-indigo-400 tracking-[0.4em] font-black uppercase">SYSTEM INITIALIZATION V4.0</span>
                            </div>
                        </motion.div>

                        <h1 className="text-5xl sm:text-7xl font-bold text-white tracking-tighter leading-none mb-8 font-outfit uppercase">
                            Study 14 Hours <br /> <span className="text-white/10">OR</span> <br /> <span className="text-indigo-500 shadow-[0_0_50px_rgba(99,102,241,0.2)]">Swipe 30 Mins.</span>
                        </h1>
                        <p className="text-[15px] font-medium text-white/40 px-12 leading-relaxed mb-16 max-w-xl mx-auto tracking-tight">
                            Traditional coaching makes UPSC boring. JourneyOS makes it addictive. Let's see if you have the baseline logic to survive the Matrix.
                        </p>
                        <button
                            onClick={() => setStep(2)}
                            className="bg-white text-black px-16 py-6 rounded-[24px] font-caps text-[13px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.15)] hover:shadow-[0_25px_50px_rgba(255,255,255,0.25)]"
                        >
                            START MATRIX DOWNLOAD
                        </button>
                    </motion.div>
                )}

                {(step >= 2 && step <= 4) && (
                    <motion.div
                        key={`q-${step}`}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        className="relative z-10 w-full max-w-xl"
                    >
                        <div className="text-center mb-12">
                            <span className="font-caps text-indigo-400 font-black uppercase tracking-[0.3em] text-[11px] px-4 py-1.5 rounded-full glass-panel border-indigo-500/20">LOGICAL CALIBRATION {step - 1}/3</span>
                        </div>

                        <h2 className="text-[28px] sm:text-[34px] text-white font-bold text-center leading-[1.3] mb-14 text-balance tracking-tight">
                            {TRIVIA[step - 2].question}
                        </h2>

                        {!showExplanation ? (
                            <div className="space-y-4">
                                {TRIVIA[step - 2].options.map((opt, i) => (
                                    <motion.button
                                        key={i}
                                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleAnswer(opt.isCorrect)}
                                        className="w-full glass-panel border border-white/5 p-7 rounded-[28px] text-left group relative overflow-hidden transition-all"
                                    >
                                        <div className="absolute inset-0 bg-indigo-500/[0.01] group-hover:bg-indigo-500/[0.03] transition-colors" />
                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-caps text-[11px] font-black text-white/20 group-hover:text-indigo-400 group-hover:border-indigo-500/40 transition-all">0{i + 1}</div>
                                            <span className="font-bold text-[16px] text-white/60 group-hover:text-white transition-colors tracking-tight">{opt.text}</span>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="glass-panel border-indigo-500/30 p-10 rounded-[40px] text-center shadow-[0_0_50px_rgba(99,102,241,0.1)] relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 animate-shimmer" />
                                <span className="text-4xl block mb-6 drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]">🤯</span>
                                <h3 className="font-caps text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] mb-4">THE ABSOLUTE TRUTH</h3>
                                <p className="text-white text-[17px] leading-relaxed font-bold tracking-tight px-4">
                                    {TRIVIA[step - 2].explanation}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {step === 5 && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="relative z-10 w-full max-w-xl text-center"
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', damping: 15, delay: 0.5 }}
                            className="w-32 h-32 rounded-full border-4 border-indigo-500 flex items-center justify-center mx-auto mb-10 shadow-[0_0_60px_rgba(99,102,241,0.6)] bg-indigo-500/5 relative group"
                        >
                            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl animate-pulse" />
                            <span className="text-4xl font-black text-white relative z-10 tabular-nums">{[105, 115, 125, 145][score]}</span>
                        </motion.div>

                        <h2 className="text-3xl font-bold text-white uppercase tracking-tight mb-6 font-outfit">UPSC IQ Calibrated</h2>

                        <p className="text-[15px] text-white/40 leading-relaxed mb-14 px-10 tracking-tight">
                            You answered {score}/3 correctly. Your baseline logic places you in the <strong className="text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.3)]">Top {score === 3 ? '1.2%' : score === 2 ? '14.8%' : '39.5%'}</strong> of the country.
                            <br /><br />
                            Forget the noise. Forget the heavy textbooks. <br />
                            <span className="text-white/20 italic">You were born for the swipe.</span>
                        </p>

                        <button
                            onClick={handleFinish}
                            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white py-6 rounded-[28px] font-caps text-[14px] font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(99,102,241,0.3)] hover:scale-[1.02] transition-all hover:shadow-[0_25px_60px_rgba(99,102,241,0.4)] active:scale-95"
                        >
                            ENTER THE MATRIX
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

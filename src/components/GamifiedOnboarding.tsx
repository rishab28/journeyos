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
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6 overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)] z-0 pointer-events-none" />
            <motion.div
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-indigo-900/10 z-0 pointer-events-none"
            />

            <AnimatePresence mode="wait">
                {step === 0 && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                        className="relative z-10 w-full max-w-lg text-center"
                    >
                        <h1 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-6">
                            Study 14 Hours <br /> <span className="text-white/20">OR</span> <br /> <span className="text-indigo-500">Swipe 30 Mins.</span>
                        </h1>
                        <p className="text-sm font-medium text-white/50 px-8 leading-relaxed mb-12">
                            Traditional coaching makes UPSC boring. JourneyOS makes it addictive. Let's see if you have the baseline logic to survive.
                        </p>
                        <button
                            onClick={() => setStep(1)}
                            className="bg-white text-black px-12 py-4 rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-transform"
                        >
                            Start Matrix Download
                        </button>
                    </motion.div>
                )}

                {(step >= 1 && step <= 3) && (
                    <motion.div
                        key={`q-${step}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="relative z-10 w-full max-w-lg"
                    >
                        <div className="text-center mb-8">
                            <span className="text-indigo-500 font-bold uppercase tracking-[0.2em] text-[10px]">Logical Calibration {step}/3</span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl text-white font-medium text-center leading-snug mb-10 text-balance drop-shadow-lg">
                            {TRIVIA[step - 1].question}
                        </h2>

                        {!showExplanation ? (
                            <div className="space-y-4">
                                {TRIVIA[step - 1].options.map((opt, i) => (
                                    <motion.button
                                        key={i}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleAnswer(opt.isCorrect)}
                                        className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-left text-white/90 hover:bg-white/10 transition-colors"
                                    >
                                        <span className="text-xs font-bold text-white/30 uppercase tracking-widest mr-4">OPT {i + 1}</span>
                                        <span className="font-medium text-sm">{opt.text}</span>
                                    </motion.button>
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center"
                            >
                                <span className="text-3xl block mb-4">🤯</span>
                                <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-[10px] mb-2">The Absolute Truth</h3>
                                <p className="text-emerald-50 text-sm leading-relaxed font-medium">
                                    {TRIVIA[step - 1].explanation}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {step === 4 && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="relative z-10 w-full max-w-lg text-center"
                    >
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', damping: 15, delay: 0.5 }}
                            className="w-24 h-24 rounded-full border-4 border-indigo-500 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(99,102,241,0.5)]"
                        >
                            <span className="text-3xl font-black text-white">{[105, 115, 125, 145][score]}</span>
                        </motion.div>

                        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4">UPSC IQ Calibrated</h2>

                        <p className="text-sm text-white/60 leading-relaxed mb-10 px-6">
                            You answered {score}/3 correctly. Your baseline logic places you in the <strong className="text-white">Top {score === 3 ? '1%' : score === 2 ? '15%' : '40%'}</strong> of the country.
                            <br /><br />
                            You don't need to read heavy textbooks. You just need to swipe.
                        </p>

                        <button
                            onClick={handleFinish}
                            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_10px_40px_rgba(99,102,241,0.4)] hover:scale-[1.02] transition-transform"
                        >
                            Enter The Matrix
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

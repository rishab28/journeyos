'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Dynamic Onboarding (Brain-Extension)
// First-time UX: Assesses UPSC IQ & Interest Profile
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgressStore } from '@/store/progressStore';

export default function OnboardingModal() {
    const upscIQ = useProgressStore((s) => s.upscIQ);
    const setUPSC_IQ = useProgressStore((s) => s.setUPSC_IQ);
    const setInterestProfile = useProgressStore((s) => s.setInterestProfile);

    const [mounted, setMounted] = useState(false);
    const [step, setStep] = useState(0); // 0 = welcome, 1 = IQ, 2 = Interest

    // Internal selections before saving
    const [selectedIQ, setSelectedIQ] = useState<number | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // If already onboarded, don't show
    if (!mounted || upscIQ > 0) return null;

    const handleComplete = () => {
        if (selectedIQ !== null && selectedProfile !== null) {
            setInterestProfile(selectedProfile);
            setUPSC_IQ(selectedIQ); // This will unmount the modal
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050505] overflow-hidden"
            style={{ backdropFilter: 'blur(20px)' }}>

            <AnimatePresence mode="wait">
                {step === 0 && (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-md w-full px-8 text-center space-y-8"
                    >
                        <div className="w-16 h-16 mx-auto rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                            🧠
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white font-outfit mb-3">Welcome to JourneyOS</h1>
                            <p className="text-white/50 text-sm leading-relaxed">
                                This OS acts as your <strong>Brain-Extension</strong>. <br />
                                To personalize your matrix, we need to calibrate your starting parameters.
                            </p>
                        </div>
                        <button
                            onClick={() => setStep(1)}
                            className="w-full py-4 rounded-full bg-white text-black font-bold focus:outline-none hover:bg-gray-200 transition-colors"
                        >
                            Initiate Calibration
                        </button>
                    </motion.div>
                )}

                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="max-w-md w-full px-6 space-y-8"
                    >
                        <div className="text-center">
                            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">Parameter 1 of 2</p>
                            <h2 className="text-2xl font-black text-white font-outfit">Baseline UPSC IQ</h2>
                            <p className="text-white/40 text-xs mt-2">Be brutally honest. We use this to inject invisible scaffolding natively.</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => setSelectedIQ(10)}
                                className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedIQ === 10 ? 'bg-violet-500/10 border-violet-500/50' : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'}`}
                            >
                                <p className="font-bold text-white text-sm mb-1">🌱 Complete Beginner (IQ: 10)</p>
                                <p className="text-[10px] text-white/40">Zero prior knowledge. Need Layman terms.</p>
                            </button>
                            <button
                                onClick={() => setSelectedIQ(40)}
                                className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedIQ === 40 ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'}`}
                            >
                                <p className="font-bold text-white text-sm mb-1">📖 Read NCERTs (IQ: 40)</p>
                                <p className="text-[10px] text-white/40">Basic concepts cleared. Need intermediate connections.</p>
                            </button>
                            <button
                                onClick={() => setSelectedIQ(80)}
                                className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedIQ === 80 ? 'bg-rose-500/10 border-rose-500/50' : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'}`}
                            >
                                <p className="font-bold text-white text-sm mb-1">⚔️ Veteran / Mains Ready (IQ: 80)</p>
                                <p className="text-[10px] text-white/40">Give me advanced facts and heavy pressure.</p>
                            </button>
                        </div>

                        <button
                            disabled={selectedIQ === null}
                            onClick={() => setStep(2)}
                            className="w-full py-4 rounded-full bg-white text-black font-bold focus:outline-none disabled:bg-white/10 disabled:text-white/30 transition-colors"
                        >
                            Next Parameter
                        </button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="max-w-md w-full px-6 space-y-8"
                    >
                        <div className="text-center">
                            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-2">Parameter 2 of 2</p>
                            <h2 className="text-2xl font-black text-white font-outfit">Interest Profile</h2>
                            <p className="text-white/40 text-xs mt-2">Select a mental anchor. We will generate custom analogies based on this.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setSelectedProfile('Sports')} className={`p-4 rounded-2xl border text-center transition-all ${selectedProfile === 'Sports' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/[0.05]'}`}>
                                <div className="text-2xl mb-2">🏏</div>
                                <p className="text-xs font-bold">Sports</p>
                            </button>
                            <button onClick={() => setSelectedProfile('Movies')} className={`p-4 rounded-2xl border text-center transition-all ${selectedProfile === 'Movies' ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/[0.05]'}`}>
                                <div className="text-2xl mb-2">🎬</div>
                                <p className="text-xs font-bold">Movies</p>
                            </button>
                            <button onClick={() => setSelectedProfile('Technology')} className={`p-4 rounded-2xl border text-center transition-all ${selectedProfile === 'Technology' ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/[0.05]'}`}>
                                <div className="text-2xl mb-2">💻</div>
                                <p className="text-xs font-bold">Technology</p>
                            </button>
                            <button onClick={() => setSelectedProfile('Geopolitics')} className={`p-4 rounded-2xl border text-center transition-all ${selectedProfile === 'Geopolitics' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/[0.05]'}`}>
                                <div className="text-2xl mb-2">🌍</div>
                                <p className="text-xs font-bold">Geopolitics</p>
                            </button>
                        </div>

                        <button
                            disabled={selectedProfile === null}
                            onClick={handleComplete}
                            className="w-full py-4 rounded-full bg-white text-black font-bold focus:outline-none disabled:bg-white/10 disabled:text-white/30 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            Finalize Brain-Extension
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

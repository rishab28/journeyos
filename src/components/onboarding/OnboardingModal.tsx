'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Dynamic Onboarding & Delayed Auth
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgressStore } from '@/store/progressStore';
import AuthForm from '@/components/auth/AuthForm';

export default function OnboardingModal() {
    const upscIQ = useProgressStore((s) => s.upscIQ);
    const userId = useProgressStore((s) => s.userId);
    const showAuthModal = useProgressStore((s) => s.showAuthModal);
    const setUPSC_IQ = useProgressStore((s) => s.setUPSC_IQ);
    const setInterestProfile = useProgressStore((s) => s.setInterestProfile);
    const setShowAuthModal = useProgressStore((s) => s.setShowAuthModal);
    const hydrate = useProgressStore((s) => s.hydrate);

    const [mounted, setMounted] = useState(false);
    const [step, setStep] = useState(0); // 0 welcome, 1 IQ, 2 Interest, 3 Auth

    // Internal selections
    const [selectedIQ, setSelectedIQ] = useState<number | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Effect to handle external trigger for Auth
    useEffect(() => {
        if (showAuthModal) {
            setStep(3);
        }
    }, [showAuthModal]);

    if (!mounted) return null;

    // Show only if onboarding not complete OR auth modal triggered
    const needsOnboarding = upscIQ === 0;
    const isVisible = needsOnboarding || (showAuthModal && !userId);

    if (!isVisible) return null;

    const handleOnboardingComplete = () => {
        if (selectedIQ !== null && selectedProfile !== null) {
            setInterestProfile(selectedProfile);
            setUPSC_IQ(selectedIQ);
            if (!userId) {
                setStep(3); // Go to Auth if not logged in
            }
        }
    };

    const handleAuthSuccess = async () => {
        setShowAuthModal(false);
        // On success, trigger a full hydration to pull data for this user
        await hydrate();
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
                            <h1 className="text-3xl font-black text-white font-outfit mb-3 uppercase tracking-tighter">Welcome to JourneyOS</h1>
                            <p className="text-white/50 text-sm leading-relaxed">
                                This OS acts as your <strong>Brain-Extension</strong>. <br />
                                To personalize your matrix, we need to calibrate your starting parameters.
                            </p>
                        </div>
                        <button
                            onClick={() => setStep(1)}
                            className="w-full py-4 rounded-full bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-colors"
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
                            <h2 className="text-2xl font-black text-white font-outfit uppercase tracking-tighter">Baseline UPSC IQ</h2>
                            <p className="text-white/40 text-xs mt-2">Be brutally honest. We use this to inject invisible scaffolding natively.</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => setSelectedIQ(10)}
                                className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedIQ === 10 ? 'bg-violet-500/10 border-violet-500/50' : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'}`}
                            >
                                <p className="font-bold text-white text-sm mb-1">🌱 Complete Beginner (IQ: 10)</p>
                                <p className="text-[10px] text-white/40 text-center uppercase tracking-widest">Zero prior knowledge. Need Layman terms.</p>
                            </button>
                            <button
                                onClick={() => setSelectedIQ(40)}
                                className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedIQ === 40 ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'}`}
                            >
                                <p className="font-bold text-white text-sm mb-1">📖 Read NCERTs (IQ: 40)</p>
                                <p className="text-[10px] text-white/40 text-center uppercase tracking-widest">Basic concepts cleared. Need intermediate connections.</p>
                            </button>
                            <button
                                onClick={() => setSelectedIQ(80)}
                                className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedIQ === 80 ? 'bg-rose-500/10 border-rose-500/50' : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'}`}
                            >
                                <p className="font-bold text-white text-sm mb-1">⚔️ Veteran / Mains Ready (IQ: 80)</p>
                                <p className="text-[10px] text-white/40 text-center uppercase tracking-widest">Give me advanced facts and heavy pressure.</p>
                            </button>
                        </div>

                        <button
                            disabled={selectedIQ === null}
                            onClick={() => setStep(2)}
                            className="w-full py-4 rounded-full bg-white text-black font-black text-sm uppercase tracking-widest focus:outline-none disabled:opacity-30 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
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
                            <h2 className="text-2xl font-black text-white font-outfit uppercase tracking-tighter">Interest Profile</h2>
                            <p className="text-white/40 text-xs mt-2">Select a mental anchor. We will generate custom analogies based on this.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setSelectedProfile('Sports')} className={`p-4 rounded-2xl border text-center transition-all ${selectedProfile === 'Sports' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/[0.05]'}`}>
                                <div className="text-2xl mb-2">🏏</div>
                                <p className="text-xs font-bold uppercase tracking-widest">Sports</p>
                            </button>
                            <button onClick={() => setSelectedProfile('Movies')} className={`p-4 rounded-2xl border text-center transition-all ${selectedProfile === 'Movies' ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/[0.05]'}`}>
                                <div className="text-2xl mb-2">🎬</div>
                                <p className="text-xs font-bold uppercase tracking-widest">Movies</p>
                            </button>
                            <button onClick={() => setSelectedProfile('Technology')} className={`p-4 rounded-2xl border text-center transition-all ${selectedProfile === 'Technology' ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/[0.05]'}`}>
                                <div className="text-2xl mb-2">💻</div>
                                <p className="text-xs font-bold uppercase tracking-widest">Technology</p>
                            </button>
                            <button onClick={() => setSelectedProfile('Geopolitics')} className={`p-4 rounded-2xl border text-center transition-all ${selectedProfile === 'Geopolitics' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/[0.05]'}`}>
                                <div className="text-2xl mb-2">🌍</div>
                                <p className="text-xs font-bold uppercase tracking-widest">Geopolitics</p>
                            </button>
                        </div>

                        <button
                            disabled={selectedProfile === null}
                            onClick={handleOnboardingComplete}
                            className="w-full py-4 rounded-full bg-white text-black font-black text-sm uppercase tracking-widest focus:outline-none disabled:opacity-30 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            Finalize Brain-Extension
                        </button>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md w-full px-6 space-y-8"
                    >
                        <div className="text-center mb-8">
                            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl mb-4">
                                🔒
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Save Progress to Matrix</h2>
                            <p className="text-white/40 text-[10px] uppercase tracking-widest leading-relaxed mt-2">
                                You've explored the initial feed. <br />
                                Authorized agents can sync progress across nodes.
                            </p>
                        </div>

                        <AuthForm onSuccess={handleAuthSuccess} />

                        {!showAuthModal && (
                            <button
                                onClick={() => {
                                    setUPSC_IQ(selectedIQ || 40); // Close if they explicitly want to skip for now
                                }}
                                className="w-full text-white/20 text-[10px] font-bold uppercase tracking-widest hover:text-white/40 transition-colors"
                            >
                                Continue as Guest (Progress may be lost)
                            </button>
                        )}

                        {showAuthModal && (
                            <button
                                onClick={() => setShowAuthModal(false)}
                                className="w-full text-white/20 text-[10px] font-bold uppercase tracking-widest hover:text-white/40 transition-colors"
                            >
                                Dismiss for now
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

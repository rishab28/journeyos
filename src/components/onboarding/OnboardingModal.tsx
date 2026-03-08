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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050508]/80 backdrop-blur-[40px] overflow-hidden">
            {/* Ambient Orbs for Onboarding */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-indigo-500/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] bg-violet-600/5 blur-[100px] rounded-full" />
            </div>

            <AnimatePresence mode="wait">
                {step === 0 && (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 1.05 }}
                        className="max-w-lg w-full px-10 text-center space-y-12 relative z-10"
                    >
                        <div className="w-20 h-20 mx-auto rounded-[32px] glass-panel border-indigo-500/30 flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(99,102,241,0.2)] bg-indigo-500/5">
                            🧠
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-4xl font-bold text-white font-outfit uppercase tracking-tighter leading-none">Welcome to JourneyOS</h1>
                            <p className="text-[15px] font-medium text-white/40 leading-relaxed px-6 tracking-tight">
                                This OS acts as your <strong>Neural-Extension</strong>. <br />
                                To personalize your matrix, we need to calibrate your baseline cognitive parameters.
                            </p>
                        </div>
                        <button
                            onClick={() => setStep(1)}
                            className="w-full py-6 rounded-[28px] bg-white text-black font-caps text-[13px] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:scale-105 transition-all"
                        >
                            INITIATE CALIBRATION
                        </button>
                    </motion.div>
                )}

                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        className="max-w-xl w-full px-8 space-y-10 relative z-10"
                    >
                        <div className="text-center">
                            <span className="font-caps text-[9px] text-white/20 uppercase tracking-[0.4em] font-black mb-4 inline-block">PARAMETER 01 / 02</span>
                            <h2 className="text-3xl font-bold text-white font-outfit uppercase tracking-tighter">Baseline Neural Tier</h2>
                            <p className="text-white/40 text-[13px] mt-3 tracking-tight">Be brutally honest. We use this to inject invisible scaffolding natively.</p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { id: 10, label: "Complete Beginner", icon: "🌱", iq: 10, desc: "Zero prior knowledge. Need Layman terms." },
                                { id: 40, label: "Advanced Reader", icon: "📖", iq: 40, desc: "Concepts cleared. Need intermediate links." },
                                { id: 80, label: "Veteran / Mains Ready", icon: "⚔️", iq: 80, desc: "Advanced facts and heavy pressure." }
                            ].map((tier) => (
                                <button
                                    key={tier.id}
                                    onClick={() => setSelectedIQ(tier.id)}
                                    className={`w-full p-6 rounded-[32px] border text-left transition-all relative group overflow-hidden ${selectedIQ === tier.id ? 'glass-panel border-indigo-500/50 bg-indigo-500/5' : 'glass-card-premium border-white/5 bg-white/[0.01] hover:border-white/10'}`}
                                >
                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                            {tier.icon}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-[16px] mb-1 tracking-tight">{tier.label}</p>
                                            <p className="font-caps text-[9px] text-white/30 tracking-[0.2em] font-black uppercase">{tier.desc}</p>
                                        </div>
                                    </div>
                                    {selectedIQ === tier.id && (
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <button
                            disabled={selectedIQ === null}
                            onClick={() => setStep(2)}
                            className="w-full py-6 rounded-[28px] bg-white text-black font-caps text-[13px] font-black uppercase tracking-[0.2em] focus:outline-none disabled:opacity-20 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95"
                        >
                            NEXT PARAMETER
                        </button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="max-w-xl w-full px-8 space-y-12 relative z-10"
                    >
                        <div className="text-center">
                            <span className="font-caps text-[9px] text-white/20 uppercase tracking-[0.4em] font-black mb-4 inline-block">PARAMETER 02 / 02</span>
                            <h2 className="text-3xl font-bold text-white font-outfit uppercase tracking-tighter">Interest Profile</h2>
                            <p className="text-white/40 text-[13px] mt-3 tracking-tight">Select a mental anchor. We generate analogies based on this.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: 'Sports', label: 'Sports', icon: '🏏', color: 'indigo' },
                                { id: 'Movies', label: 'Movies', icon: '🎬', color: 'indigo' },
                                { id: 'Technology', label: 'Tech', icon: '💻', color: 'indigo' },
                                { id: 'Geopolitics', label: 'Global', icon: '🌍', color: 'indigo' }
                            ].map((profile) => (
                                <button
                                    key={profile.id}
                                    onClick={() => setSelectedProfile(profile.id)}
                                    className={`p-8 rounded-[36px] border text-center transition-all relative group ${selectedProfile === profile.id ? 'glass-panel border-indigo-500/50 bg-indigo-500/5' : 'glass-card-premium border-white/5 bg-white/[0.01] hover:border-white/10'}`}
                                >
                                    <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">{profile.icon}</div>
                                    <p className="font-caps text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-white transition-colors">{profile.label}</p>
                                    {selectedProfile === profile.id && (
                                        <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <button
                            disabled={selectedProfile === null}
                            onClick={handleOnboardingComplete}
                            className="w-full py-6 rounded-[28px] bg-white text-black font-caps text-[13px] font-black uppercase tracking-[0.2em] focus:outline-none disabled:opacity-20 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95"
                        >
                            FINALIZE NEURAL EXTENSION
                        </button>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-lg w-full px-10 space-y-12 relative z-10"
                    >
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto rounded-[24px] glass-panel border-indigo-500/30 flex items-center justify-center text-3xl mb-8 bg-indigo-500/5">
                                🔒
                            </div>
                            <h2 className="text-2xl font-bold text-white uppercase tracking-tight font-outfit">Save Progress to Matrix</h2>
                            <p className="text-white/30 font-caps text-[10px] uppercase tracking-[0.3em] font-black leading-relaxed mt-4 px-8">
                                Authorized agents can sync neural <br /> progress across all hardware nodes.
                            </p>
                        </div>

                        <div className="glass-panel p-8 rounded-[40px] border-white/5">
                            <AuthForm onSuccess={handleAuthSuccess} />
                        </div>

                        <div className="flex flex-col gap-4">
                            {!showAuthModal && (
                                <button
                                    onClick={() => {
                                        setUPSC_IQ(selectedIQ || 40); // Close if they explicitly want to skip for now
                                    }}
                                    className="w-full text-white/20 font-caps text-[9px] font-black uppercase tracking-[0.3em] hover:text-white transition-all"
                                >
                                    CONTINUE AS GUEST AGENT
                                </button>
                            )}

                            {showAuthModal && (
                                <button
                                    onClick={() => setShowAuthModal(false)}
                                    className="w-full text-white/20 font-caps text-[9px] font-black uppercase tracking-[0.3em] hover:text-white transition-all"
                                >
                                    DISMISS TEMPORARILY
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

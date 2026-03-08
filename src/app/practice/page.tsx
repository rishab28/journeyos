'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/lib/core/haptics';
import PracticeNavigator from '@/components/practice/PracticeNavigator';
import DuelSystem from '@/components/practice/DuelSystem';
import WarBriefing from '@/components/admin/WarBriefing';
import SquadDashboard from '@/components/squads/SquadDashboard';
import VerticalReels from '@/components/stories/VerticalReels';
import { getDiscoveryFeed } from '@/app/actions/learner';
import { StudyCard } from '@/types';
import Link from 'next/link';
import { useSRSStore } from '@/store/srsStore';
import MentorChat from '@/components/mentor/MentorChat';
import { useProfileStore } from '@/store/profileStore';

export default function PracticePage() {
    const [exploreCards, setExploreCards] = useState<StudyCard[]>([]);
    const [reelsStartId, setReelsStartId] = useState<string | null>(null);
    const [activeWarMission, setActiveWarMission] = useState<'briefing' | 'duel' | 'squad-hub' | null>(null);
    const [isMentorOpen, setIsMentorOpen] = useState(false);
    const { avatarUrl } = useProfileStore();

    // Load Discovery Feed Data (Used for Practice missions)
    useEffect(() => {
        getDiscoveryFeed(20).then((feedRes) => {
            if (feedRes.success) setExploreCards(feedRes.cards);
        });
    }, []);

    const handleMissionSelect = (id: string) => {
        triggerHaptic('medium');
        if (id === 'war-briefing') {
            setActiveWarMission('briefing');
        } else if (id === 'random-duel') {
            setActiveWarMission('duel');
        } else if (id === 'squad-hub') {
            setActiveWarMission('squad-hub');
        } else {
            if (exploreCards.length === 0) {
                alert("No live study cards available. Please visit the admin panel to generate and set cards to 'live'.");
                return;
            }
            const randomId = exploreCards[Math.floor(Math.random() * exploreCards.length)]?.id;
            if (randomId) setReelsStartId(randomId);
        }
    };

    return (
        <main className="relative min-h-screen bg-[#0b0e17] pb-32 overflow-x-hidden pt-8">
            <div className="absolute left-6 top-8 sm:left-10 sm:top-10 z-50">
                <Link href="/dashboard" className="group">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group-hover:bg-white/10 group-hover:border-white/20 transition-all shadow-lg backdrop-blur-md">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        ) : (
                            <span className="text-sm group-hover:scale-110 transition-transform">👤</span>
                        )}
                    </div>
                </Link>
            </div>

            <div className="absolute right-6 top-8 sm:right-10 sm:top-10 z-50">
                <button
                    onClick={() => {
                        triggerHaptic('medium');
                        setIsMentorOpen(true);
                    }}
                    className="group"
                >
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all shadow-lg backdrop-blur-md">
                        <span className="text-sm group-hover:scale-110 transition-transform">🔍</span>
                    </div>
                </button>
            </div>
            {/* Ambient background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-900/10 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-6">
                <div className="mb-10">
                    <h1 className="text-[32px] sm:text-[40px] leading-[1.1] font-black text-white tracking-[-0.03em]" style={{ fontFamily: 'var(--font-outfit)' }}>
                        War Zone
                    </h1>
                    <p className="text-[11px] sm:text-[12px] text-white/40 mt-1.5 font-extrabold tracking-[0.25em] uppercase">Tactical Practice & Missions</p>
                </div>

                <div className="space-y-8">
                    <AnimatePresence mode="wait">
                        {activeWarMission === 'briefing' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mb-8"
                            >
                                <WarBriefing />
                                <button
                                    onClick={() => setActiveWarMission(null)}
                                    className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-4 block w-full text-center hover:text-white/40 transition-colors"
                                >
                                    Dismiss Briefing ✕
                                </button>
                            </motion.div>
                        )}
                        {activeWarMission === 'duel' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mb-8"
                            >
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                                        <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Live Battle Zone</h4>
                                    </div>
                                    <button
                                        onClick={() => setActiveWarMission(null)}
                                        className="text-[9px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-colors"
                                    >
                                        Close ✕
                                    </button>
                                </div>
                                <DuelSystem />
                            </motion.div>
                        )}
                        {activeWarMission === 'squad-hub' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mb-8"
                            >
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                                        <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Squad Headquarters</h4>
                                    </div>
                                    <button
                                        onClick={() => setActiveWarMission(null)}
                                        className="text-[9px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-colors"
                                    >
                                        Close ✕
                                    </button>
                                </div>
                                <SquadDashboard />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative">
                        <PracticeNavigator onMissionSelect={handleMissionSelect} />
                    </div>
                </div>
            </div>

            {/* Vertical Reels Overlay */}
            <AnimatePresence>
                {reelsStartId && (
                    <VerticalReels
                        cards={exploreCards}
                        layoutIdStart={reelsStartId}
                        onClose={() => setReelsStartId(null)}
                    />
                )}
            </AnimatePresence>
            <MentorChat isOpen={isMentorOpen} onClose={() => setIsMentorOpen(false)} />
        </main>
    );
}

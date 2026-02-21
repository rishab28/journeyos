'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Autonomous Brain Dashboard (Phase 16)
// A zero-noise, AI-guided dashboard for beginners (upscIQ < 50).
// Only shows Readiness Score and "Next Action" Path.
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useProgressStore } from '@/store/progressStore';
import { useSRSStore } from '@/store/srsStore';
import VisualConfidenceBrain from './VisualConfidenceBrain';

export default function AutonomousDashboard() {
    const router = useRouter();
    const { upscIQ, interestProfile, accuracy, totalReviewed } = useProgressStore();
    const cards = useSRSStore(s => s.cards);

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    // Derived minimalist stats
    // Readiness Score: Weighted by accuracy but capped for beginners until volume is high
    const readinessScore = Math.min(Math.round(accuracy * (Math.min(totalReviewed / 200, 1))), 99);

    // AI Next Action logic
    // Recommend the subject with the most Foundation cards due, or overall lowest mastery
    const dueCards = cards.filter(c => c.srs.interval === 0 && c.scaffoldLevel === 'Foundation');

    // Group by subject to find where they need the most grounding
    const subjectCounts = dueCards.reduce((acc, card) => {
        acc[card.subject] = (acc[card.subject] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    let nextSubject = 'Polity'; // Default starting point
    let highestDue = 0;

    Object.entries(subjectCounts).forEach(([subject, count]) => {
        if (count > highestDue) {
            highestDue = count;
            nextSubject = subject;
        }
    });

    const hasCardsToReview = highestDue > 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* ── User Context Banner ── */}
            <div className="text-center space-y-1">
                <p className="text-[10px] text-indigo-400/70 uppercase tracking-widest font-black flex items-center justify-center gap-1.5">
                    <span>🧠 Brain-Extension Mode Active</span>
                </p>
                <h2 className="text-xl font-medium text-white/80">
                    Adapting to your <span className="text-indigo-400 font-bold">{interestProfile}</span> intuition.
                </h2>
                <p className="text-xs text-white/30">
                    UPSC IQ: {upscIQ} (Foundation Lock Enabled)
                </p>
            </div>

            {/* ── Minimalist Readiness Score ── */}
            <motion.div
                className="relative bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 overflow-hidden text-center backdrop-blur-md"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
                <p className="text-[10px] text-white/30 uppercase tracking-[4px] font-bold mb-3">Overall Readiness</p>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-6xl font-black text-white tracking-tighter tabular-nums" style={{ fontFamily: 'var(--font-outfit)' }}>
                        {readinessScore}
                    </span>
                    <span className="text-xl text-white/20 font-bold">%</span>
                </div>
                <p className="text-xs text-white/40 mt-3 max-w-[200px] mx-auto leading-relaxed">
                    Master the foundational blocks to unlock advanced inter-disciplinary concepts.
                </p>
            </motion.div>

            {/* ── AI Auto-Pilot Next Action ── */}
            <motion.div
                className="relative w-full"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                {/* Glow behind button */}
                <div className="absolute inset-x-8 -inset-y-2 bg-indigo-500/20 blur-2xl rounded-full pointer-events-none" />

                <button
                    onClick={() => router.push('/')} // Navigates back to StudyFeed
                    className="relative w-full overflow-hidden p-[2px] rounded-2xl group active:scale-95 transition-transform"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-rose-500 to-indigo-500 opacity-60 group-hover:opacity-100 transition-opacity bg-[length:200%_auto] animate-gradient" />
                    <div className="relative bg-black/80 backdrop-blur-md rounded-[14px] px-6 py-4 flex items-center justify-between">
                        <div className="text-left">
                            <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold mb-0.5">Auto-Pilot Active</p>
                            <p className="text-base font-bold text-white">
                                {hasCardsToReview ? `Start ${nextSubject} Foundation` : 'All Caught Up — Explore Content'}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            <span className="text-lg">▶</span>
                        </div>
                    </div>
                </button>
            </motion.div>

            {/* ── Visual Confidence Brain ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
            >
                <VisualConfidenceBrain />
            </motion.div>
        </div>
    );
}

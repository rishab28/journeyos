'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Client Shell
// Wraps pages with bottom navigation (non-admin routes)
// ═══════════════════════════════════════════════════════════

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import BottomNav from '@/components/navigation/BottomNav';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import AdaptiveBreakModal from '@/components/shared/AdaptiveBreakModal';
import MentorChat from '@/components/mentor/MentorChat';
import { useEffect } from 'react';
import { syncEngine } from '@/lib/core/db/syncEngine';
import { motion } from 'framer-motion';

export default function ClientShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname.startsWith('/admin');
    const [isMentorOpen, setIsMentorOpen] = useState(false);

    useEffect(() => {
        syncEngine.init();
    }, []);

    return (
        <>
            <div className={isAdmin ? '' : 'pb-16'}>
                {children}
            </div>
            {!isAdmin && <BottomNav />}
            {!isAdmin && <OnboardingModal />}
            <AdaptiveBreakModal />

            {/* ── Global Mentor FAB ── */}
            {!isAdmin && !isMentorOpen && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20, delay: 0.5 }}
                    onClick={() => setIsMentorOpen(true)}
                    className="fixed bottom-24 right-6 z-[90] w-14 h-14 rounded-full bg-indigo-500/20 backdrop-blur-xl border border-indigo-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:bg-indigo-500/30 hover:scale-110 active:scale-95 transition-all"
                >
                    <span className="text-2xl">🧠</span>
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-indigo-500 animate-pulse border-2 border-[#050508]" />
                </motion.button>
            )}
            {!isAdmin && <MentorChat isOpen={isMentorOpen} onClose={() => setIsMentorOpen(false)} />}
        </>
    );
}


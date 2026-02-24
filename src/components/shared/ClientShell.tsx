'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Client Shell
// Wraps pages with bottom navigation (non-admin routes)
// ═══════════════════════════════════════════════════════════

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/navigation/BottomNav';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import AdaptiveBreakModal from '@/components/shared/AdaptiveBreakModal';
import { useEffect } from 'react';
import { syncEngine } from '@/lib/core/db/syncEngine';

export default function ClientShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname.startsWith('/admin');

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
        </>
    );
}

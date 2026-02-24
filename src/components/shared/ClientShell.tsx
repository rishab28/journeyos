'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Client Shell
// Wraps pages with bottom navigation (non-admin routes)
// ═══════════════════════════════════════════════════════════

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/navigation/BottomNav';
import OnboardingModal from '@/components/onboarding/OnboardingModal';

export default function ClientShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname.startsWith('/admin');

    return (
        <>
            <div className={isAdmin ? '' : 'pb-16'}>
                {children}
            </div>
            {!isAdmin && <BottomNav />}
            {!isAdmin && <OnboardingModal />}
        </>
    );
}

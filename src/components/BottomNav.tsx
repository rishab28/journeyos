'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Bottom Navigation Bar
// Mobile-first glassmorphism nav: Study | Insights | Admin
// ═══════════════════════════════════════════════════════════

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';

const NAV_ITEMS = [
    { href: '/', label: 'Feed', icon: '⚡', activeIcon: '⚡' },
    { href: '/library', label: 'Vault', icon: '📂', activeIcon: '📁' },
    { href: '/dashboard', label: 'Profile', icon: '👤', activeIcon: '🎯' },
];

export default function BottomNav() {
    const pathname = usePathname();
    const { triggerFeedScroll } = useSRSStore();

    // Don't show on admin pages (they have their own nav)
    if (pathname.startsWith('/admin')) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50">
            {/* Glassmorphism background */}
            <div className="bg-[#0b0e17]/80 backdrop-blur-2xl border-t border-white/[0.06]">
                <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-6">
                    {NAV_ITEMS.map((item) => {
                        const isActive =
                            item.href === '/'
                                ? pathname === '/'
                                : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative flex flex-col items-center justify-center gap-0.5 w-16 py-1"
                                onClick={(e) => {
                                    if (item.href === '/' && pathname === '/') {
                                        e.preventDefault();
                                        triggerFeedScroll();
                                    }
                                }}
                            >
                                <motion.span
                                    animate={isActive ? { scale: 1.2, filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' } : { scale: 1 }}
                                    className="text-xl transition-all duration-300"
                                >
                                    {isActive ? item.activeIcon : item.icon}
                                </motion.span>
                                <span
                                    className={`text-[10px] font-semibold tracking-wider transition-colors duration-200 ${isActive ? 'text-white' : 'text-white/30'
                                        }`}
                                >
                                    {item.label}
                                </span>

                                {/* Active indicator */}
                                {isActive && (
                                    <motion.div
                                        className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                                        style={{
                                            background: 'linear-gradient(90deg, #7c3aed, #c026d3)',
                                        }}
                                        layoutId="bottomNavIndicator"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Safe area for iPhone notch */}
            <div className="bg-[#0b0e17]/80 h-[env(safe-area-inset-bottom)]" />
        </nav>
    );
}

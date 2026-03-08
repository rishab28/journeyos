'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Bottom Navigation Bar (Minimalist Executive)
// Ultra-premium floating glass capsule with fluid physics.
// ═══════════════════════════════════════════════════════════

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';
import { Compass, Target, BookOpen, User } from 'lucide-react';

const NAV_ITEMS = [
    { href: '/', label: 'Feed', icon: Compass },
    { href: '/practice', label: 'Practice', icon: Target },
    { href: '/library', label: 'Library', icon: BookOpen },
    { href: '/dashboard', label: 'Profile', icon: User },
];

export default function BottomNav() {
    const pathname = usePathname();
    const { triggerFeedScroll } = useSRSStore();

    // Hide entirely on admin interfaces
    if (pathname.startsWith('/admin')) return null;

    return (
        <nav className="fixed bottom-6 w-full flex justify-center z-[100] px-4 pointer-events-none">
            {/* ── Premium Glass Capsule ── */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-[#050508]/60 backdrop-blur-3xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_20px_rgba(99,102,241,0.1)] rounded-full px-2 py-2 flex items-center gap-1 pointer-events-auto"
            >
                {NAV_ITEMS.map((item) => {
                    const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={(e) => {
                                if (item.href === '/' && pathname === '/') {
                                    e.preventDefault();
                                    triggerFeedScroll();
                                }
                            }}
                            className="relative group px-5 py-3 rounded-full flex items-center justify-center transition-all hover:bg-white/5 active:scale-90"
                        >
                            {/* ── Active Background Pill ── */}
                            {isActive && (
                                <motion.div
                                    layoutId="bottom-nav-active-pill"
                                    className="absolute inset-0 bg-indigo-500/10 rounded-full"
                                    transition={{ type: 'spring', bounce: 0.15, duration: 0.6 }}
                                />
                            )}

                            {/* ── Content ── */}
                            <div className="relative flex items-center gap-3 z-10">
                                <motion.div
                                    animate={{
                                        scale: isActive ? 1.05 : 0.9,
                                        color: isActive ? '#818cf8' : 'rgba(255,255,255,0.4)',
                                    }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center justify-center"
                                >
                                    <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                                </motion.div>

                                <AnimatePresence mode="popLayout">
                                    {isActive && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -5, scale: 0.95 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: -5, scale: 0.95 }}
                                            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                                            className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-300 whitespace-nowrap overflow-hidden"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* ── Subtle Active Glow ── */}
                            {isActive && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 0.6, scale: 1 }}
                                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-indigo-500 blur-[4px] rounded-full"
                                />
                            )}
                        </Link>
                    );
                })}
            </motion.div>
        </nav>
    );
}

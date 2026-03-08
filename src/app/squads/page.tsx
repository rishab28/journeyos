'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Squads Page (Collective Intelligence)
// ═══════════════════════════════════════════════════════════

import Link from 'next/link';
import SquadDashboard from '@/components/squads/SquadDashboard';

export default function SquadsPage() {
    return (
        <main className="relative min-h-screen bg-black pb-32 overflow-x-hidden pt-8">
            {/* Ambient background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/10 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 -ml-2 text-white/40 hover:text-white transition-colors group">
                        <span className="text-xl group-hover:-translate-x-1 transition-transform inline-block">←</span>
                    </Link>
                    <div>
                        <h1 className="text-[32px] sm:text-[40px] leading-[1.1] font-black text-white tracking-[-0.03em]"
                            style={{ fontFamily: 'var(--font-outfit)' }}>
                            Squads
                        </h1>
                        <p className="text-[11px] sm:text-[12px] text-white/40 mt-1.5 font-extrabold tracking-[0.25em] uppercase">
                            Collective Brain Intelligence
                        </p>
                    </div>
                </div>

                {/* Squad Dashboard */}
                <SquadDashboard />
            </div>
        </main>
    );
}

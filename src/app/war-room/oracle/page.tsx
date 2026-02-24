'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — War Room: Oracle Predictor
// ═══════════════════════════════════════════════════════════

import OracleSniperList from '@/components/oracle/OracleSniperList';

export default function OraclePage() {
    return (
        <div className="w-full min-h-screen bg-[#050505] overflow-y-auto">
            <div className="max-w-4xl mx-auto pt-20 pb-24">
                <OracleSniperList />
            </div>

            {/* Absolute Back Button */}
            <div className="fixed top-8 left-6 z-50">
                <a href="/war-room" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                    ←
                </a>
            </div>
        </div>
    );
}

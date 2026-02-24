'use client';

import SquadDashboard from '@/components/squads/SquadDashboard';
import { motion } from 'framer-motion';

export default function SquadsPage() {
    return (
        <main className="relative min-h-screen bg-[#0b0e17] overflow-y-auto pt-24 pb-32">
            {/* Ambient background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="bg-orb bg-orb-1 opacity-40" />
                <div className="bg-orb bg-orb-3 opacity-40" />
            </div>

            <div className="relative z-10">
                <SquadDashboard />
            </div>
        </main>
    );
}

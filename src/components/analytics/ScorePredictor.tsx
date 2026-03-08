'use client';

import { motion } from 'framer-motion';
import { useProgressStore } from '@/store/progressStore';

export default function ScorePredictor() {
    const { accuracy, totalReviewed, upscIQ } = useProgressStore();

    // Prelims Projection (Out of 200)
    const calculatePrelimsScore = () => {
        if (totalReviewed === 0) return 0;
        const volumeWeight = Math.min(totalReviewed / 800, 1) * 30; // Up to 30 points for volume
        const accuracyWeight = (accuracy / 100) * 140; // Up to 140 points for accuracy
        const iqBonus = (upscIQ / 200) * 10; // Small bonus for IQ
        return Math.min(Math.round(volumeWeight + accuracyWeight + iqBonus + 20), 188); // Base 20 to start curve
    };

    // Mains Projection (Out of 1000 - GS Papers)
    const calculateMainsScore = () => {
        if (totalReviewed === 0) return 0;
        const base = (accuracy / 100) * 400;
        const volume = Math.min(totalReviewed / 1500, 1) * 100;
        const iq = (upscIQ / 200) * 50;
        return Math.min(Math.round(base + volume + iq + 250), 620); // Base 250
    };

    const prelims = calculatePrelimsScore();
    const mains = calculateMainsScore();

    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Prelims Score */}
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5">🏆</div>
                <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">Prelims GS Prediction</h4>
                <div>
                    <span className="text-3xl font-black text-white tabular-nums">{prelims === 0 ? '--' : prelims}</span>
                    <span className="text-sm font-bold text-white/20 ml-1">/ 200</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-indigo-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(prelims / 200) * 100}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    </div>
                </div>
                <p className="text-[8px] font-bold text-indigo-400/60 uppercase tracking-widest mt-2">
                    {prelims > 105 ? 'SAFE ZONE' : prelims > 90 ? 'EDGE' : 'NEEDS ACCURACY'}
                </p>
            </div>

            {/* Mains Score */}
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5">✍️</div>
                <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-3">Mains GS Projected</h4>
                <div>
                    <span className="text-3xl font-black text-white tabular-nums">{mains === 0 ? '--' : mains}</span>
                    <span className="text-sm font-bold text-white/20 ml-1">/ 1000</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(mains / 1000) * 100}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    </div>
                </div>
                <p className="text-[8px] font-bold text-purple-400/60 uppercase tracking-widest mt-2">
                    {mains > 450 ? 'EXECUTIVE FLOW' : mains > 350 ? 'COMPETITIVE' : 'STRENGTHEN NODES'}
                </p>
            </div>
        </div>
    );
}

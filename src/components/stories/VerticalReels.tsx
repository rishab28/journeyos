'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Vertical Reels Engine (The Core Engine View)
// Immersive smooth snap-scrolling interface for discovery
// ═══════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { StudyCard as StudyCardType } from '@/types';
import StudyCard from '@/components/study/StudyCard';

interface VerticalReelsProps {
    cards: StudyCardType[];
    layoutIdStart: string; // The ID of the card clicked from the grid for smooth animation
    onClose: () => void;
}

export default function VerticalReels({ cards, layoutIdStart, onClose }: VerticalReelsProps) {
    if (cards.length === 0) return null;

    // We pre-sort or locate the clicked card to be first, or just scroll to it
    // For simplicity in Phase 1, we assume the feed is reordered so clicked is first
    // or we just render them in order with the layoutId map

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black"
        >
            {/* Minimalist Top Nav for Reels */}
            <div className="absolute top-0 left-0 w-full z-[110] flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🧭</span>
                    <span className="text-sm font-bold text-white tracking-widest uppercase opacity-80">Explore Feed</span>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:bg-white/20 transition-all font-bold text-xl"
                >
                    ×
                </button>
            </div>

            {/* The infinite vertical snap container */}
            <div className="w-full h-full overflow-y-auto snap-y snap-mandatory scrollbar-none pb-20">
                {cards.map((card, idx) => (
                    // We wrap the StudyCard to enable Framer shared layout animation if it was the triggering card
                    <div key={card.id} className="w-full h-full snap-start snap-always relative">
                        {card.id === layoutIdStart ? (
                            <motion.div layoutId={`explore-card-${card.id}`} className="w-full h-full">
                                <StudyCard card={card} isActive={true} />
                            </motion.div>
                        ) : (
                            <StudyCard card={card} isActive={true} />
                        )}

                        {/* Fake engagement action bar (Like, Share, Bookmark) floating on the right like Reels */}
                        <div className="absolute right-4 bottom-32 flex flex-col gap-6 items-center z-10">
                            <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-lg flex flex-col items-center justify-center hover:bg-white/20 transition-all group">
                                <span className="text-xl group-hover:scale-110 transition-transform">🔥</span>
                                <span className="text-[10px] font-bold text-white/70 mt-0.5">{card.priorityScore ? card.priorityScore * 14 : 24}</span>
                            </button>
                            <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-lg flex flex-col items-center justify-center hover:bg-white/20 transition-all group">
                                <span className="text-xl group-hover:scale-110 transition-transform">🔖</span>
                                <span className="text-[10px] font-bold text-white/70 mt-0.5">Save</span>
                            </button>
                            <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-lg flex flex-col items-center justify-center hover:bg-white/20 transition-all group">
                                <span className="text-xl group-hover:scale-110 transition-transform">📤</span>
                            </button>
                        </div>
                    </div>
                ))}

                {/* Loading indicator at end of feed */}
                <div className="w-full h-[50px] snap-start flex items-center justify-center mt-8">
                    <span className="text-white/30 text-xs">Pull for more discovery...</span>
                </div>
            </div>
        </motion.div>
    );
}

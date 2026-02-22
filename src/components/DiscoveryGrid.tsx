'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Discovery Grid
// Pinterest-style masonry layout for the Explore Engine using raw CSS columns
// ═══════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { StudyCard } from '@/types';

interface DiscoveryGridProps {
    cards: StudyCard[];
    onCardClick: (cardId: string) => void;
}

export default function DiscoveryGrid({ cards, onCardClick }: DiscoveryGridProps) {
    if (cards.length === 0) {
        return (
            <div className="w-full py-12 flex flex-col items-center justify-center text-white/30">
                <span className="text-4xl mb-4 opacity-50">🔭</span>
                <p className="text-sm font-bold">The void is empty.</p>
                <p className="text-xs mt-1">Check back later for new intelligence.</p>
            </div>
        );
    }

    return (
        <div className="w-full px-4 mt-2">
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span>⚡</span> Discovery Engine
            </h2>

            {/* CSS Masonry layout: Fast, native, no external JS library needed for Phase 1 */}
            <div className="columns-2 sm:columns-3 md:columns-4 gap-4 w-full space-y-4 pb-24">
                {cards.map((card, idx) => {
                    const isLongContent = card.front.length > 80;

                    return (
                        <motion.div
                            key={card.id}
                            layoutId={`explore-card-${card.id}`}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: idx * 0.03, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            onClick={() => onCardClick(card.id)}
                            className={`break-inside-avoid relative w-full bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden cursor-pointer group hover:bg-white/[0.05] hover:border-white/20 transition-all duration-500 p-5 flex flex-col backdrop-blur-2xl ${isLongContent ? 'min-h-[220px]' : 'min-h-[180px]'}`}
                        >
                            {/* Priority / Context Top Badge */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${card.difficulty === 'HARD' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                                            card.difficulty === 'MEDIUM' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                            }`} />
                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">{card.subject}</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-white/15 uppercase tracking-widest">{card.topic}</span>
                                </div>
                                {card.isPyqTagged && (
                                    <div className="bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg">
                                        <span className="text-[8px] font-black text-rose-400 uppercase tracking-tighter">PYQ</span>
                                    </div>
                                )}
                            </div>

                            {/* Question Preview */}
                            <div className="flex-1">
                                <p className="text-[15px] text-white/90 font-bold leading-tight tracking-tight group-hover:text-white transition-colors line-clamp-4">
                                    {card.front}
                                </p>
                            </div>

                            {/* Interaction Overlay (Visible on bottom part) */}
                            <div className="mt-6 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 opacity-20 group-hover:opacity-60 transition-opacity">
                                        <span className="text-xs">🤍</span>
                                        <span className="text-[10px] font-black text-white">2.4k</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-20 group-hover:opacity-60 transition-opacity">
                                        <span className="text-xs">⚡</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 shadow-2xl">
                                    <span className="text-[10px]">▶️</span>
                                </div>
                            </div>

                            {/* Glass overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

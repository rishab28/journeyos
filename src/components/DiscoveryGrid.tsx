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
                    // Randomize height slightly for the pinterest masonry look based on the content length
                    const isLongContent = card.front.length > 80 || card.back.length > 100;

                    return (
                        <motion.div
                            key={card.id}
                            layoutId={`explore-card-${card.id}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05, duration: 0.4 }}
                            onClick={() => onCardClick(card.id)}
                            className={`break-inside-avoid relative w-full bg-[#111] border border-white/5 rounded-2xl overflow-hidden cursor-pointer group hover:bg-white/[0.03] transition-colors p-4 flex flex-col justify-between ${isLongContent ? 'min-h-[180px]' : 'min-h-[140px]'}`}
                        >
                            {/* Priority / Lethality Top Badge */}
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${card.difficulty === 'HARD' ? 'bg-rose-500' :
                                            card.difficulty === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`} />
                                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{card.subject}</span>
                                </div>
                                {card.isPyqTagged && (
                                    <span className="bg-rose-500/20 text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                                        <span className="animate-pulse">🔥</span> PYQ
                                    </span>
                                )}
                            </div>

                            {/* Crisp Preview text */}
                            <div className="flex-1">
                                <p className="text-xs sm:text-sm text-white/90 font-semibold leading-relaxed line-clamp-3 md:line-clamp-4 group-hover:text-white transition-colors">
                                    {card.front}
                                </p>
                                <p className="text-[10px] text-white/30 mt-2 line-clamp-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    {card.back}
                                </p>
                            </div>

                            {/* Bottom Footprint */}
                            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
                                <span className="text-[9px] font-medium text-white/50">{card.topic.substring(0, 15)}...</span>
                                <div className="flex gap-2">
                                    <span className="text-xs">👁️</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Memory Heatmap
// Shows retention zones per topic using SRS interval data
// 🟢 Mastered (>7d) | 🟡 Learning (1-7d) | 🔴 Danger (0d)
// ═══════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';

interface TopicZone {
    topic: string;
    subject: string;
    cardCount: number;
    avgInterval: number;
    avgOracleConfidence: number; // Phase 15
    zone: 'mastered' | 'learning' | 'danger';
}

export default function MemoryHeatmap() {
    const cards = useSRSStore((s) => s.cards);

    // Group cards by topic, calculate avg interval & oracle confidence
    const topicMap = new Map<string, { subject: string; intervals: number[]; oracleConfidences: number[] }>();

    cards.forEach((card) => {
        const key = card.topic;
        if (!topicMap.has(key)) {
            topicMap.set(key, { subject: card.subject, intervals: [], oracleConfidences: [] });
        }
        topicMap.get(key)!.intervals.push(card.srs.interval);
        topicMap.get(key)!.oracleConfidences.push(card.oracleConfidence || 0);
    });

    const zones: TopicZone[] = Array.from(topicMap.entries())
        .map(([topic, data]) => {
            const avg = data.intervals.reduce((a, b) => a + b, 0) / data.intervals.length;
            const avgOracle = data.oracleConfidences.reduce((a, b) => a + b, 0) / data.oracleConfidences.length;
            return {
                topic,
                subject: data.subject,
                cardCount: data.intervals.length,
                avgInterval: Math.round(avg * 10) / 10,
                avgOracleConfidence: Math.round(avgOracle),
                zone: avg > 7 ? 'mastered' as const : avg >= 1 ? 'learning' as const : 'danger' as const,
            };
        })
        .sort((a, b) => b.avgOracleConfidence - a.avgOracleConfidence || a.avgInterval - b.avgInterval); // Priority to Oracle, then Danger

    if (zones.length === 0) {
        return (
            <p className="text-xs text-white/15 text-center py-4">
                Start studying to see your memory retention map
            </p>
        );
    }

    const zoneConfig = {
        danger: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', dot: 'bg-rose-500', label: '🔴 Review Now' },
        learning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500', label: '🟡 Learning' },
        mastered: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500', label: '🟢 Mastered' },
    };

    const dangerCount = zones.filter(z => z.zone === 'danger').length;
    const learningCount = zones.filter(z => z.zone === 'learning').length;
    const masteredCount = zones.filter(z => z.zone === 'mastered').length;

    return (
        <div className="space-y-3">
            {/* Zone Summary */}
            <div className="flex items-center gap-3 text-[10px]">
                {dangerCount > 0 && (
                    <span className="text-rose-400/60">🔴 {dangerCount} danger</span>
                )}
                {learningCount > 0 && (
                    <span className="text-amber-400/60">🟡 {learningCount} learning</span>
                )}
                {masteredCount > 0 && (
                    <span className="text-emerald-400/60">🟢 {masteredCount} mastered</span>
                )}
            </div>

            {/* Topic Cells */}
            <div className="grid grid-cols-2 gap-2">
                {zones.map((zone, i) => {
                    const config = zoneConfig[zone.zone];
                    const isHighLethality = zone.avgOracleConfidence > 80;

                    return (
                        <motion.div
                            key={zone.topic}
                            className={`p-3 rounded-xl border relative overflow-hidden ${config.bg} ${isHighLethality ? 'border-[#00ffcc]/40 shadow-[0_0_15px_#00ffcc20]' : config.border}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            {isHighLethality && (
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-tr from-[#00ffcc]/5 to-transparent pointer-events-none"
                                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                />
                            )}

                            <div className="flex items-center justify-between mb-1 relative z-10">
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                                    <span className="text-[9px] text-white/25 uppercase tracking-wider">{zone.subject}</span>
                                </div>
                                {isHighLethality && (
                                    <span className="text-[8px] font-black text-[#00ffcc] uppercase tracking-tighter">Neural Focus</span>
                                )}
                            </div>
                            <p className="text-[11px] text-white/60 font-medium truncate relative z-10">{zone.topic}</p>
                            <div className="flex items-center justify-between mt-1.5 relative z-10">
                                <span className="text-[9px] text-white/20">{zone.cardCount} cards</span>
                                <span className={`text-[9px] ${isHighLethality ? 'text-[#00ffcc]/60 font-bold' : 'text-white/20'}`}>
                                    {zone.avgInterval}d avg
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

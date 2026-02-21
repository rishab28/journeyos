'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Failure Audit (Phase 15)
// Tracks the root causes of forgetting (Concept vs Fact vs Panic)
// ═══════════════════════════════════════════════════════════

import { useSRSStore } from '@/store/srsStore';
import { motion } from 'framer-motion';

export default function FailureAudit() {
    const reviewHistory = useSRSStore((s) => s.reviewHistory);

    // Aggregate failures
    const failures = reviewHistory.filter(r => r.failureReason);
    if (failures.length === 0) {
        return (
            <div className="py-6 text-center border border-dashed border-white/10 rounded-2xl">
                <p className="text-white/20 text-xs font-medium">No failure data collected yet.</p>
                <p className="text-white/15 text-[10px] mt-1">Tag root causes during card review to see the audit.</p>
            </div>
        );
    }

    const counts: Record<string, number> = {
        '🧠 Concept Gap': 0,
        '📝 Fact Slip': 0,
        '🌪️ Confusion / Panic': 0,
    };

    let total = 0;
    failures.forEach(r => {
        // match strings loosely in case of emoji variations
        if (r.failureReason?.includes('Concept Gap')) counts['🧠 Concept Gap']++;
        else if (r.failureReason?.includes('Fact Slip')) counts['📝 Fact Slip']++;
        else if (r.failureReason?.includes('Confusion') || r.failureReason?.includes('Panic')) counts['🌪️ Confusion / Panic']++;
        else counts['🌪️ Confusion / Panic']++; // default bucket
        total++;
    });

    const categories = [
        { label: 'Concept Gap', icon: '🧠', raw: '🧠 Concept Gap', color: '#f43f5e', desc: 'Core logic is missing' },
        { label: 'Fact Slip', icon: '📝', raw: '📝 Fact Slip', color: '#f59e0b', desc: 'Recall failure' },
        { label: 'Panic Engine', icon: '🌪️', raw: '🌪️ Confusion / Panic', color: '#8b5cf6', desc: 'Stress or active mix-up' },
    ];

    // Find the primary bottleneck
    const worstCat = [...categories].sort((a, b) => counts[b.raw] - counts[a.raw])[0];

    return (
        <div className="space-y-6">
            {total > 0 && (
                <div className="p-4 bg-[#0a0a0a] border border-rose-500/20 rounded-2xl flex items-center justify-between shadow-[0_0_30px_rgba(244,63,94,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full" />

                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-2xl shadow-inner">
                            {worstCat.icon}
                        </div>
                        <div>
                            <p className="text-[10px] text-rose-400 uppercase tracking-[0.2em] font-black">Primary Bottleneck</p>
                            <p className="text-sm text-white/90 font-medium mt-0.5">
                                Critical leaks isolated to <span style={{ color: worstCat.color }} className="font-bold">{worstCat.label}</span>
                            </p>
                        </div>
                    </div>
                    <div className="text-right relative z-10">
                        <p className="text-2xl font-black tabular-nums text-rose-500 tracking-tighter">
                            {Math.round((counts[worstCat.raw] / total) * 100)}%
                        </p>
                        <p className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Impact</p>
                    </div>
                </div>
            )}

            <div className="space-y-5">
                {categories.map((cat, i) => {
                    const count = counts[cat.raw];
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                        <div key={i} className="group cursor-default">
                            <div className="flex justify-between items-end mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.02] border border-white/[0.05] text-sm group-hover:bg-white/[0.05] transition-colors">
                                        {cat.icon}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-white/90 tracking-wide">{cat.label}</p>
                                        <p className="text-[10px] text-white/40 mt-0.5">{cat.desc}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black tabular-nums tracking-tighter" style={{ color: cat.color }}>
                                        {pct}<span className="text-[10px] opacity-50 ml-0.5">%</span>
                                    </p>
                                    <p className="text-[9px] font-bold tracking-widest uppercase text-white/20 mt-0.5">
                                        {count} Incidents
                                    </p>
                                </div>
                            </div>

                            {/* Premium Progress Bar */}
                            <div className="h-2 rounded-full bg-white/[0.03] overflow-hidden border border-white/[0.02] relative">
                                <motion.div
                                    className="absolute top-0 bottom-0 left-0 rounded-full"
                                    style={{
                                        backgroundColor: cat.color,
                                        boxShadow: `0 0 10px ${cat.color}40`
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1.5, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

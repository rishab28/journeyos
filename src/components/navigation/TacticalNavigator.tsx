'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Tactical Navigator (Aerial View)
// Purpose-built Command Center for UPSC Syllabus Exploration
// ═══════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';
import { Subject } from '@/types';
import { NeonBadge } from '@/components/ui/NeonBadge';
import { DataPulse } from '@/components/ui/DataPulse';

// Tactical Filter Types
type TacticalFilter = 'MASTERED' | 'HIGH_LETHALITY' | 'PYQ_HOTSPOTS' | 'UNSEEN';

const TACTICAL_FILTERS: { id: TacticalFilter, label: string, icon: string, color: string }[] = [
    { id: 'HIGH_LETHALITY', label: 'High Lethality', icon: '🔥', color: '#6366f1' },
    { id: 'PYQ_HOTSPOTS', label: 'PYQ Hotspots', icon: '🎯', color: '#818cf8' },
    { id: 'UNSEEN', label: 'Unseen Terr.', icon: '🔭', color: '#cbd5e1' },
    { id: 'MASTERED', label: 'Fully Secured', icon: '🛡️', color: '#ffffff' },
];

// UPSC Syllabus Definition
const UPSC_SYLLABUS = [
    {
        paper: 'GS 1',
        title: 'Heritage & Geography',
        subjects: [
            { name: Subject.POLITY, topics: ['Constitution', 'Parliament', 'Judiciary'] }, // Mocked for UI
            { name: Subject.SCIENCE, topics: ['Space', 'Biotech', 'IT'] },
        ]
    },
    {
        paper: 'GS 2',
        title: 'Governance & IR',
        subjects: [
            { name: Subject.POLITY, topics: ['Governance', 'Social Justice', 'IR'] },
        ]
    },
    {
        paper: 'GS 3',
        title: 'Economy & Env',
        subjects: [
            { name: Subject.ECONOMY, topics: ['Planning', 'Agriculture', 'Environment'] },
        ]
    },
    {
        paper: 'GS 4',
        title: 'Ethics & Case',
        subjects: [
            { name: Subject.CURRENT_AFFAIRS, topics: ['Human Interface', 'Moral Thinkers'] },
        ]
    }
];

interface TacticalNavigatorProps {
    onTopicSelect?: () => void;
}

export default function TacticalNavigator({ onTopicSelect }: TacticalNavigatorProps) {
    const cards = useSRSStore(s => s.cards);
    const setFilters = useSRSStore(s => s.setFilters);
    const [activeFilter, setActiveFilter] = useState<TacticalFilter | null>(null);
    const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);

    const handleTopicClick = (subject: Subject, topic: string) => {
        setFilters({ subject, topic });
        if (onTopicSelect) onTopicSelect();
    };

    const selectedPaper = useMemo(() =>
        UPSC_SYLLABUS.find(p => p.paper === selectedPaperId),
        [selectedPaperId]
    );

    // Calculate Intelligence based on real card data
    const filteredIntelligence = useMemo(() => {
        const total = cards.length;
        const mastered = cards.filter(c => (c.srs?.interval || 0) > 10).length;
        const lethal = cards.filter(c => (c.priorityScore || 0) > 7).length;
        const pyqs = cards.filter(c => c.type === 'PYQ').length;
        return {
            totalTopics: total,
            masteredTopics: mastered,
            lethalTopics: lethal,
            pyqDensity: pyqs,
        };
    }, [cards, activeFilter]);

    return (
        <div className="w-full flex flex-col pt-4">
            {/* 1. Tactical Filter Hub */}
            <div className="flex gap-3 overflow-x-auto px-6 mb-10 no-scrollbar">
                {TACTICAL_FILTERS.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setActiveFilter(activeFilter === f.id ? null : f.id)}
                        className={`px-5 py-3 rounded-2xl flex items-center gap-3 transition-all border whitespace-nowrap ${activeFilter === f.id
                            ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                            : 'bg-white/[0.03] text-white/40 border-white/5 hover:border-white/10'
                            }`}
                    >
                        <span className="text-sm">{f.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.1em]">{f.label}</span>
                        {activeFilter === f.id && (
                            <motion.div
                                layoutId="activeTag"
                                className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* 2. Strategic Topography or Micro-Topic Grid */}
            <div className="px-6 space-y-4 min-h-[400px]">
                <AnimatePresence mode="wait">
                    {!selectedPaper ? (
                        <motion.div
                            key="topography"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h2 className="text-sm font-black text-white uppercase tracking-[0.3em]">Aerial View</h2>
                                    <p className="text-[10px] text-white/30 uppercase mt-1 tracking-widest font-bold">Syllabus Topography 1.1</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Intelligence Secure</span>
                                    <div className="text-xl font-black text-white">42%</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {UPSC_SYLLABUS.map((paper, idx) => (
                                    <motion.button
                                        key={paper.paper}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => setSelectedPaperId(paper.paper)}
                                        className="relative aspect-[16/10] rounded-3xl overflow-hidden border border-white/10 group p-6 text-left flex flex-col justify-between"
                                    >
                                        {/* Paper Identity */}
                                        <div className="relative z-10">
                                            <span className="text-3xl font-black text-white/10 absolute -top-4 -left-2 select-none group-hover:text-white/20 transition-colors">{paper.paper}</span>
                                            <h3 className="text-xs font-black text-white/90 uppercase tracking-[0.2em] relative mt-4">{paper.title}</h3>
                                        </div>

                                        {/* Stat Badge */}
                                        <div className="relative z-10 flex justify-between items-end">
                                            <div>
                                                <div className="flex gap-1 mb-2">
                                                    {[...Array(5)].map((_, i) => (
                                                        <div key={i} className={`w-4 h-1 rounded-full ${i < idx + 2 ? 'bg-indigo-500' : 'bg-white/10'}`} />
                                                    ))}
                                                </div>
                                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Mastery Status</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-tighter block mb-1">Yield</span>
                                                <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-black uppercase text-indigo-400">{idx === 0 ? 'High' : 'Medium'}</div>
                                            </div>
                                        </div>

                                        {/* Tactical Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-3xl -z-10" />
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="heatmap"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            {/* Breadcrumbs / Back */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedPaperId(null)}
                                    className="p-2 -ml-2 text-white/40 hover:text-white transition-colors"
                                >
                                    ←
                                </button>
                                <div>
                                    <h2 className="text-sm font-black text-indigo-400 uppercase tracking-[0.3em]">{selectedPaper.paper}</h2>
                                    <p className="text-[10px] text-white/30 uppercase mt-0.5 tracking-widest font-bold">Tactical Heatmap</p>
                                </div>
                            </div>

                            {/* Micro-Topic Intelligence Grid */}
                            {selectedPaper.subjects.map(subject => (
                                <div key={subject.name} className="space-y-4">
                                    <div className="flex justify-between items-center border-l-2 border-indigo-500/30 pl-3">
                                        <h3 className="text-xs font-black text-white/80 uppercase tracking-widest">{subject.name}</h3>
                                        <span className="text-[9px] font-bold text-white/20 uppercase">Intelligence Density</span>
                                    </div>

                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                        {[...Array(12)].map((_, i) => {
                                            const mastery = Math.random();
                                            const topicName = `${subject.name} Topic ${i + 1}`;
                                            return (
                                                <div
                                                    key={i}
                                                    onClick={() => handleTopicClick(subject.name, topicName)}
                                                    className="aspect-square rounded-lg relative group cursor-pointer active:scale-95 transition-all"
                                                    style={{
                                                        backgroundColor: mastery > 0.8 ? '#6366f1' : mastery > 0.5 ? '#6366f144' : mastery > 0.3 ? '#818cf822' : '#ffffff05',
                                                        border: `1px solid ${mastery > 0.3 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)'}`
                                                    }}
                                                >
                                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 rounded-lg flex items-center justify-center">
                                                        <span className="text-[8px] font-black text-white px-1 text-center leading-none">Topic {i + 1}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 3. Global Intelligence Gauge */}
            <div className="mt-12 px-6">
                <div className="bg-[#111] border border-white/5 rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <DataPulse color="indigo" size="sm" />
                                <h4 className="text-[10px] font-black text-white uppercase tracking-widest ml-1">Global Sync Status</h4>
                            </div>
                            <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest pl-4">Scanning Weak Synapses...</p>
                        </div>
                        <div className="w-12 h-12 rounded-full border border-indigo-500/20 flex items-center justify-center">
                            <span className="text-xl">📡</span>
                        </div>
                    </div>

                    <div className="flex gap-4 relative z-10">
                        <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">High Priority</span>
                            <span className="text-lg font-black text-indigo-400">{filteredIntelligence.lethalTopics} <span className="text-[10px] font-bold opacity-30">Cards</span></span>
                        </div>
                        <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">PYQ Cards</span>
                            <span className="text-lg font-black text-white/60">{filteredIntelligence.pyqDensity} <span className="text-[10px] font-bold opacity-30">Cards</span></span>
                        </div>
                    </div>

                    {/* Background grid effect */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                </div>
            </div>

            {/* Empty space for bottom nav */}
            <div className="h-32" />
        </div>
    );
}

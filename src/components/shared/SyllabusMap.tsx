'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Granular Syllabus Map
// Visualizes micro-topic completion across GS papers
// ═══════════════════════════════════════════════════════════

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';

// Static UPSC Syllabus Structure (Phase 24 Expansion)
const UPSC_SYLLABUS = [
    {
        paper: 'GS Paper 1',
        description: 'Heritage, History & Geography',
        subjects: [
            { name: 'History', topics: ['Modern Indian History', 'Freedom Struggle', 'Post-Independence', 'World History', 'Art & Culture'] },
            { name: 'Geography', topics: ['Physical Geography', 'Indian Geography', 'World Geography', 'Natural Resources', 'Geohazards'] },
            { name: 'Society', topics: ['Salient features of Indian Society', 'Role of Women', 'Population Issues', 'Poverty', 'Urbanization', 'Globalization', 'Secularism'] }
        ]
    },
    {
        paper: 'GS Paper 2',
        description: 'Governance, Constitution & IR',
        subjects: [
            { name: 'Polity', topics: ['Constitution', 'Amendments', 'Union & States', 'Parliament & State Legislatures', 'Executive & Judiciary', 'Constitutional Bodies'] },
            { name: 'Governance', topics: ['Government Policies', 'NGOs & SHGs', 'Welfare Schemes', 'Health, Education, HR', 'E-governance', 'Civil Services'] },
            { name: 'International Relations', topics: ['Neighborhood Relations', 'Bilateral Agreements', 'Global Groupings (UN, WTO)', 'Indian Diaspora'] }
        ]
    },
    {
        paper: 'GS Paper 3',
        description: 'Economy, Environment & Tech',
        subjects: [
            { name: 'Economy', topics: ['Macroeconomics', 'Planning & Resource Mobilization', 'Inclusive Growth', 'Government Budgeting', 'Agriculture & Subsidies', 'Food Processing', 'Land Reforms', 'Infrastructure', 'Investment Models'] },
            { name: 'Science', topics: ['IT & Computers', 'Space', 'Robotics', 'Nanotech', 'Biotech', 'IPR'] },
            { name: 'Environment', topics: ['Conservation', 'Pollution', 'EIA'] },
            { name: 'Security', topics: ['Internal Security', 'Border Management', 'Cyber Security', 'Terrorism'] }
        ]
    },
    {
        paper: 'GS Paper 4',
        description: 'Ethics, Integrity & Aptitude',
        subjects: [
            { name: 'Ethics', topics: ['Human Interface', 'Attitude', 'Aptitude & Foundational Values', 'Emotional Intelligence', 'Moral Thinkers', 'Public Administration Ethics', 'Probity in Governance'] }
        ]
    }
];

export default function SyllabusMap() {
    const cards = useSRSStore(s => s.cards);
    const [expandedPaper, setExpandedPaper] = useState<string | null>('GS Paper 2'); // Default open Polity

    // Calculate Completion based on cards in SRS database
    const syllabusProgress = useMemo(() => {
        const stats: Record<string, Record<string, Record<string, { total: number, mastered: number }>>> = {};

        // Initialize structure
        UPSC_SYLLABUS.forEach(paper => {
            stats[paper.paper] = {};
            paper.subjects.forEach(sub => {
                stats[paper.paper][sub.name] = {};
                sub.topics.forEach(top => {
                    stats[paper.paper][sub.name][top] = { total: 0, mastered: 0 };
                });
            });
        });

        // Tally cards
        cards.forEach(card => {
            const paper = UPSC_SYLLABUS.find(p => p.subjects.some(s => s.name === card.subject));
            if (!paper) return;

            const subjectData = paper.subjects.find(s => s.name === card.subject);
            if (!subjectData) return;

            // Simple mapper: try to match card topic to syllabus micro-topic, fallback to first
            let matchedTopic = subjectData.topics.find(t => card.topic?.toLowerCase().includes(t.toLowerCase()));
            if (!matchedTopic) matchedTopic = subjectData.topics[0]; // fallback

            if (!stats[paper.paper][card.subject][matchedTopic]) {
                stats[paper.paper][card.subject][matchedTopic] = { total: 0, mastered: 0 };
            }

            stats[paper.paper][card.subject][matchedTopic].total++;
            // Criteria for "mastered": interval > 14 days or highly confident
            if (card.srs.interval > 14) {
                stats[paper.paper][card.subject][matchedTopic].mastered++;
            }
        });

        return stats;
    }, [cards]);

    const calculatePercentage = (mastered: number, total: number) => {
        if (total === 0) return 0; // Means no cards exist for this micro-topic yet
        return Math.round((mastered / total) * 100);
    };

    return (
        <div className="bg-[#050505] rounded-[2rem] border border-white/5 p-6 sm:p-8">
            <h2 className="text-xl font-black uppercase tracking-[0.2em] text-white flex items-center gap-3 mb-2">
                <span className="text-2xl">🗺️</span> Strategic Topography
            </h2>
            <p className="text-white/40 text-sm font-medium mb-8">Granular micro-topic completion across all 4 GS Papers.</p>

            <div className="space-y-4">
                {UPSC_SYLLABUS.map((paper) => {
                    const isExpanded = expandedPaper === paper.paper;

                    // Paper-level aggregate calculation
                    let paperTotal = 0;
                    let paperMastered = 0;
                    Object.values(syllabusProgress[paper.paper]).forEach(subj => {
                        Object.values(subj).forEach(topicStat => {
                            paperTotal += topicStat.total;
                            paperMastered += topicStat.mastered;
                        });
                    });
                    const paperPercent = calculatePercentage(paperMastered, Math.max(paperTotal, 1)); // Avoid division by zero display issue if totally empty

                    return (
                        <div key={paper.paper} className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
                            {/* Paper Header (Clickable) */}
                            <button
                                onClick={() => setExpandedPaper(isExpanded ? null : paper.paper)}
                                className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
                            >
                                <div className="text-left">
                                    <div className="text-sm font-black text-white/90 uppercase tracking-widest">{paper.paper}</div>
                                    <div className="text-[10px] uppercase text-white/40 tracking-[0.2em] mt-1">{paper.description}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-lg font-black text-indigo-400">{paperPercent}%</div>
                                        <div className="text-[9px] uppercase tracking-widest text-white/30 hidden sm:block">Mastered</div>
                                    </div>
                                    <span className="text-white/20 text-xl transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>↓</span>
                                </div>
                            </button>

                            {/* Paper Subjects & Topics (Collapsible) */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-white/5 bg-black/40"
                                    >
                                        <div className="p-5 space-y-8">
                                            {paper.subjects.map(subject => (
                                                <div key={subject.name}>
                                                    <h3 className="text-xs font-black text-white/60 uppercase tracking-[0.2em] mb-4 border-l-2 border-white/20 pl-3">
                                                        {subject.name}
                                                    </h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                                                        {subject.topics.map(topic => {
                                                            const stats = syllabusProgress[paper.paper]?.[subject.name]?.[topic] || { total: 0, mastered: 0 };
                                                            const percent = calculatePercentage(stats.mastered, stats.total);

                                                            return (
                                                                <div key={topic} className="group">
                                                                    <div className="flex justify-between items-end mb-1.5">
                                                                        <span className="text-xs font-medium text-white/80 group-hover:text-white transition-colors">{topic}</span>
                                                                        <span className="text-[10px] font-bold text-white/40 tabular-nums">
                                                                            {stats.total > 0 ? `${percent}%` : 'TBP'} {/* TBP = To Be Populated */}
                                                                        </span>
                                                                    </div>
                                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                                        <motion.div
                                                                            className="h-full bg-indigo-500/80 rounded-full"
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${stats.total > 0 ? percent : 0}%` }}
                                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

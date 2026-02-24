'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Premium Mains Arena (Supreme Polish)
// Tactical mission selection, immersive writing, topper evaluation
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';
import { evaluateMains, EvalResult } from '@/app/actions/learner';
import type { StudyCard } from '@/types';
import Link from 'next/link';

type MainsStage = 'SELECTION' | 'WRITING' | 'EVALUATING' | 'RESULT';

export default function MainsArenaPage() {
    const cards = useSRSStore((s) => s.cards);
    const fetchLiveCards = useSRSStore((s) => s.fetchLiveCards);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // State
    const [stage, setStage] = useState<MainsStage>('SELECTION');
    const [activeFilter, setActiveFilter] = useState<string>('ALL');
    const [selectedMission, setSelectedMission] = useState<StudyCard | null>(null);
    const [answer, setAnswer] = useState('');
    const [result, setResult] = useState<EvalResult | null>(null);
    const [error, setError] = useState('');

    useEffect(() => { fetchLiveCards(); }, [fetchLiveCards]);

    // Derived filters
    const availableTopics = useMemo(() => {
        const topics = new Set(cards.map(c => c.topic));
        return ['ALL', '★ PYQs ONLY', ...Array.from(topics).slice(0, 5)];
    }, [cards]);

    // Active Mission Generation
    const missionBriefs = useMemo(() => {
        let pool = cards.filter(c => c.type === 'FLASHCARD' || c.type === 'PYQ');

        if (activeFilter === '★ PYQs ONLY') {
            pool = pool.filter(c => c.isPyqTagged);
        } else if (activeFilter !== 'ALL') {
            pool = pool.filter(c => c.topic === activeFilter);
        }

        // Shuffle and pick 3
        return [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
    }, [cards, activeFilter]);

    const handleStartMission = (mission: StudyCard) => {
        setSelectedMission(mission);
        setAnswer('');
        setError('');
        setStage('WRITING');
        // Auto-focus slightly after transition
        setTimeout(() => textareaRef.current?.focus(), 500);
    };

    const handleSubmit = async () => {
        if (!selectedMission || !answer.trim()) return;
        setStage('EVALUATING');
        setError('');

        const res = await evaluateMains(selectedMission.id, selectedMission.front, answer);
        if (res.error) {
            setError(res.error);
            setStage('WRITING');
        } else {
            setResult(res);
            setStage('RESULT');
        }
    };

    const getScoreData = (score: number) => {
        if (score >= 8) return { color: '#10b981', label: 'Rank 1 Trajectory 🏆', shadow: 'rgba(16, 185, 129, 0.4)' };
        if (score >= 5) return { color: '#f59e0b', label: 'Average Attempt 💪', shadow: 'rgba(245, 158, 11, 0.4)' };
        return { color: '#ef4444', label: 'Needs Re-Evaluation 🚨', shadow: 'rgba(239, 68, 68, 0.4)' };
    };

    return (
        <main className="relative min-h-screen bg-[#050505] overflow-hidden flex flex-col font-sans">
            {/* Ambient Background Magic */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-900/20 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>

            {/* Top Navigation Strip */}
            <div className="relative z-20 flex items-center justify-between px-6 pt-10 pb-4 max-w-2xl mx-auto w-full">
                <Link href="/" className="group flex items-center gap-2 text-white/50 hover:text-white transition-colors text-[11px] font-extrabold uppercase tracking-[0.2em] px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.05] backdrop-blur-md">
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> Feed
                </Link>
                <div className="flex flex-col items-center">
                    <h1 className="text-[12px] sm:text-[13px] font-black text-white tracking-[0.3em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
                        Mains Arena
                    </h1>
                </div>
                <div className="w-[84px]" /> {/* Spacer for precise centering */}
            </div>

            <AnimatePresence mode="wait">
                {/* ═════════════════ SELECTION STAGE ═════════════════ */}
                {stage === 'SELECTION' && (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="relative z-10 flex-1 flex flex-col pt-6 pb-24 px-6 max-w-2xl mx-auto w-full"
                    >
                        <div className="mb-8 text-center">
                            <h2 className="text-[40px] sm:text-[48px] leading-[1.1] font-black text-white tracking-[-0.03em] mb-3 drop-shadow-lg font-outfit">Select Target</h2>
                            <p className="text-white/40 text-[14px] sm:text-[15px] font-medium tracking-wide">Choose your battlefield. Engage with high-yield questions.</p>
                        </div>

                        {/* Premium Filters Array */}
                        <div className="flex flex-wrap justify-center gap-2 mb-10">
                            {availableTopics.map(topic => {
                                const isActive = activeFilter === topic;
                                return (
                                    <button
                                        key={topic}
                                        onClick={() => setActiveFilter(topic)}
                                        className={`px-5 py-2.5 rounded-2xl text-[11px] sm:text-[12px] font-extrabold transition-all uppercase tracking-[0.2em] backdrop-blur-md border ${isActive
                                            ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105'
                                            : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                                            }`}
                                    >
                                        {topic}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Mission Briefs (Sleek Cards) */}
                        <div className="flex flex-col gap-4 pb-12">
                            {missionBriefs.length === 0 ? (
                                <div className="text-center py-16 px-4 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.01]">
                                    <p className="text-white/30 text-sm font-medium tracking-wide">No viable targets in this sector.</p>
                                </div>
                            ) : (
                                missionBriefs.map((mission, idx) => (
                                    <motion.button
                                        key={mission.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
                                        onClick={() => handleStartMission(mission)}
                                        className="relative w-full text-left p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/[0.08] hover:border-white/20 transition-all group backdrop-blur-xl overflow-hidden shadow-2xl"
                                        whileHover={{ y: -4, scale: 1.01 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        {/* Hover Glow Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]" />

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-[10px] sm:text-[11px] text-violet-300 font-extrabold uppercase tracking-[0.2em] bg-violet-500/20 px-3 py-1.5 rounded-full border border-violet-500/20">
                                                    Subject {idx + 1}
                                                </span>
                                                {mission.isPyqTagged && (
                                                    <span className="text-[10px] sm:text-[11px] text-amber-300 font-extrabold uppercase tracking-[0.2em] flex items-center gap-1.5 shadow-[0_0_10px_rgba(251,191,36,0.2)] bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                                                        <span>★</span> PYQ {mission.examName || mission.pyqYears || ''}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-[20px] sm:text-[22px] text-white/90 font-semibold leading-[1.5] tracking-[-0.01em] group-hover:text-white transition-colors line-clamp-3 mb-6">
                                                {mission.front}
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                                <span className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-extrabold">{mission.subject} / {mission.topic}</span>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ═════════════════ WRITING STAGE ═════════════════ */}
                {stage === 'WRITING' && selectedMission && (
                    <motion.div
                        key="writing"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="relative z-10 flex-1 flex flex-col h-full max-w-3xl mx-auto w-full px-4 sm:px-6"
                    >
                        {/* Immersive Question Header */}
                        <div className="mt-4 mb-6 p-6 sm:p-8 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
                            <span className="text-[10px] sm:text-[11px] text-white/40 font-extrabold uppercase tracking-[0.25em] mb-3 block flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Live Target
                            </span>
                            <h2 className="text-[18px] sm:text-[22px] text-white leading-[1.5] tracking-[-0.01em] font-medium font-outfit">
                                {selectedMission.front}
                            </h2>
                        </div>

                        {/* Zen Writing Area */}
                        <div className="flex-1 flex flex-col relative rounded-[2rem] bg-white/[0.01] border border-white/[0.03] backdrop-blur-md overflow-hidden transition-all focus-within:bg-white/[0.03] focus-within:border-white/[0.08]">
                            <textarea
                                ref={textareaRef}
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="Start typing your response. Structure your points clearly. Focus."
                                className="flex-1 w-full bg-transparent text-white/80 text-[18px] sm:text-[20px] leading-[1.7] tracking-[-0.01em] placeholder:text-white/15 focus:outline-none resize-none p-6 sm:p-10 no-scrollbar font-serif mx-auto max-w-3xl"
                            />

                            {/* Sticky Action Footer */}
                            <div className="p-6 sm:p-8 flex items-center justify-between border-t border-white/[0.05] bg-gradient-to-t from-black via-black/90 to-transparent">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6">
                                    <button onClick={() => setStage('SELECTION')} className="text-white/30 hover:text-white text-[11px] font-extrabold uppercase tracking-[0.2em] transition-colors">
                                        ⊗ Cancel Target
                                    </button>
                                    <span className="text-[10px] text-emerald-400 tracking-[0.2em] uppercase font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                                        {answer.split(/\s+/).filter(Boolean).length} Words Engaged
                                    </span>
                                </div>
                                <motion.button
                                    onClick={handleSubmit}
                                    disabled={!answer.trim()}
                                    className="px-8 py-4 rounded-full text-black font-black uppercase tracking-[0.2em] text-[11px] sm:text-[12px] disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                    style={{ background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)' }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Transmit
                                </motion.button>
                            </div>
                        </div>
                        <div className="h-28" /> {/* Safe area for Bottom Nav */}
                    </motion.div>
                )}

                {/* ═════════════════ EVALUATING STAGE ═════════════════ */}
                {stage === 'EVALUATING' && (
                    <motion.div
                        key="evaluating"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className="relative w-24 h-24 mb-8">
                            <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                            <div className="absolute inset-0 border-4 border-t-white rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">🧠</div>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-[0.2em] uppercase mb-3">Analyzing Logic</h2>
                        <p className="text-white/40 text-sm max-w-sm leading-relaxed">Cross-referencing your arguments against peak performer blueprints...</p>
                    </motion.div>
                )}

                {/* ═════════════════ RESULT STAGE ═════════════════ */}
                {stage === 'RESULT' && result && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative z-10 flex-1 flex flex-col px-4 sm:px-6 max-w-3xl mx-auto w-full overflow-y-auto no-scrollbar pb-32"
                    >
                        {/* Hero Score Display */}
                        <div className="flex flex-col items-center text-center mt-8 mb-12">
                            <div className="relative">
                                {/* Glowing backdrop */}
                                <div className="absolute inset-0 blur-3xl opacity-30" style={{ background: getScoreData(result.score).color }} />

                                <span className="relative text-[120px] sm:text-[150px] leading-none font-black drop-shadow-2xl tabular-nums tracking-[-0.05em] mix-blend-plus-lighter"
                                    style={{ color: getScoreData(result.score).color }}>
                                    {result.score}
                                </span>
                            </div>
                            <span className="text-[12px] font-black uppercase tracking-[0.4em] mt-2 mb-4 text-white/30">Total Score (/10)</span>

                            <div className="px-6 py-2.5 rounded-full backdrop-blur-xl border flex items-center gap-3 shadow-2xl"
                                style={{
                                    backgroundColor: `${getScoreData(result.score).color}15`,
                                    borderColor: `${getScoreData(result.score).color}40`,
                                    boxShadow: `0 0 40px ${getScoreData(result.score).shadow}`
                                }}>
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getScoreData(result.score).color }} />
                                <span className="text-sm font-extrabold uppercase tracking-widest text-white shadow-black drop-shadow-md">
                                    {getScoreData(result.score).label}
                                </span>
                            </div>
                        </div>

                        {/* Structural Feedback Area */}
                        {result.topperComparison && (
                            <div className="p-6 sm:p-8 rounded-[2rem] bg-amber-500/[0.03] border border-amber-500/10 backdrop-blur-xl shadow-lg relative overflow-hidden mb-6 group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full group-hover:bg-amber-500/20 transition-all" />
                                <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4">
                                    <div className="bg-amber-500/20 p-2.5 rounded-xl shrink-0 text-xl shadow-lg shadow-amber-500/10 mt-1 sm:mt-0">⚖️</div>
                                    <div className="flex-1">
                                        <h4 className="text-[11px] sm:text-[12px] text-amber-400 uppercase tracking-[0.25em] font-black mb-1.5">Topper Blueprint Match</h4>
                                        <p className="text-amber-50/90 font-medium text-[15px] sm:text-[16px] leading-[1.6] tracking-[-0.01em] mb-4">{result.topperComparison}</p>

                                        <div className="flex flex-wrap gap-x-8 gap-y-4 pt-4 border-t border-amber-500/10">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Intro Word Count</span>
                                                <span className={`text-base font-black ${result.introLength > 35 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    {result.introLength} <span className="text-[10px] font-medium opacity-50 ml-1">/ avg 25</span>
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Conclusion Present</span>
                                                <span className={`text-sm font-black ${result.conclusionPresent ? 'text-emerald-400' : 'text-rose-400'} mt-0.5`}>
                                                    {result.conclusionPresent ? 'YES' : 'NO'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Precision Grids */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Hits */}
                            <div className="p-6 sm:p-8 rounded-[2rem] bg-emerald-500/[0.03] border border-emerald-500/10 backdrop-blur-xl shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-all" />
                                <h4 className="text-[11px] text-emerald-400 uppercase tracking-[0.2em] font-black flex items-center gap-3 mb-6">
                                    <span className="bg-emerald-500/20 p-1.5 rounded-lg">🎯</span> Strategic Hits
                                </h4>
                                {result.keywords && result.keywords.length > 0 ? (
                                    <div className="flex flex-col gap-3">
                                        {result.keywords.map((kw, i) => (
                                            <span key={i} className="text-sm text-emerald-50 font-medium flex items-start gap-3 leading-relaxed">
                                                <span className="text-emerald-500 mt-1.5 text-[8px]">■</span> {kw}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-white/20 italic font-medium">No highly specific keywords detected.</p>
                                )}
                            </div>

                            {/* Misses */}
                            <div className="p-6 sm:p-8 rounded-[2rem] bg-rose-500/[0.03] border border-rose-500/10 backdrop-blur-xl shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full group-hover:bg-rose-500/20 transition-all" />
                                <h4 className="text-[11px] text-rose-400 uppercase tracking-[0.2em] font-black flex items-center gap-3 mb-6">
                                    <span className="bg-rose-500/20 p-1.5 rounded-lg">🚨</span> Critical Misses
                                </h4>
                                {result.missing && result.missing.length > 0 ? (
                                    <div className="flex flex-col gap-3">
                                        {result.missing.map((pt, i) => (
                                            <span key={i} className="text-sm text-rose-50 font-medium flex items-start gap-3 leading-relaxed">
                                                <span className="text-rose-500 mt-1.5 text-[8px]">■</span> {pt}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-white/20 italic font-medium">Flawless execution. No major omissions.</p>
                                )}
                            </div>
                        </div>

                        {/* Deep Feedback / Topper Deconstruction */}
                        <div className="p-6 sm:p-10 rounded-[2rem] bg-indigo-500/[0.03] border border-indigo-500/10 backdrop-blur-xl shadow-lg relative overflow-hidden mb-12 flex flex-col gap-8 mx-auto max-w-3xl">
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />

                            <div className="relative z-10">
                                <h4 className="text-[11px] text-indigo-400 uppercase tracking-[0.2em] font-black flex items-center gap-3 mb-4">
                                    <span className="bg-indigo-500/20 p-1.5 rounded-lg text-lg">🏛️</span> Body Structure Validation
                                </h4>
                                <p className="text-sm sm:text-base text-indigo-50/80 leading-relaxed whitespace-pre-line border-l-2 border-indigo-500/30 pl-4 py-1">
                                    {result.bodyStructure}
                                </p>
                            </div>

                            <div className="h-[1px] w-full bg-indigo-500/10 relative z-10" />

                            <div className="relative z-10">
                                <h4 className="text-[11px] sm:text-[12px] text-indigo-400 uppercase tracking-[0.25em] font-black flex items-center gap-3 mb-4">
                                    <span className="bg-indigo-500/20 p-1.5 rounded-lg text-xl">🧠</span> Overall Mental Model
                                </h4>
                                <p className="text-[16px] sm:text-[18px] text-indigo-50/90 leading-[1.7] tracking-[-0.01em] font-serif whitespace-pre-line">
                                    {result.feedback}
                                </p>
                            </div>
                        </div>

                        {/* Action CTA */}
                        <motion.button
                            onClick={() => {
                                setStage('SELECTION');
                                setResult(null);
                            }}
                            className="w-full sm:w-auto mx-auto px-12 py-5 rounded-full bg-white text-black font-black tracking-[0.2em] uppercase text-xs transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Select Next Target
                        </motion.button>
                        <div className="h-12" /> {/* Bottom Padding */}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

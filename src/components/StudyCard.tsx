'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Ultra-Premium StudyCard (Instagram Reels Style)
// Full screen, zero distraction, high-fidelity glassmorphism
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { StudyCard as StudyCardType, CardType, MCQOption } from '@/types';
import { useSRSStore } from '@/store/srsStore';
import { useProgressStore } from '@/store/progressStore';
import { askLiveAI } from '@/app/actions/askAI';
import SuggestEditModal from './SuggestEditModal';
import { toast } from 'sonner';
import { calculateLethalityScore, getLethalityBreakdown } from '@/lib/oracle/lethalityEngine';
import { triggerHaptic } from '@/lib/haptics';

interface StudyCardProps {
    card: StudyCardType;
    isActive: boolean;
    isRapidFire?: boolean;
    onAnswered?: () => void;
}

// Adaptive text sizing for central focus (Bespoke Apple-style Typography)
function questionSize(text: string) {
    if (text.length > 250) return 'text-[22px] sm:text-[26px] leading-[1.3] tracking-tight font-medium';
    if (text.length > 120) return 'text-[28px] sm:text-[32px] leading-[1.2] tracking-tight font-bold';
    return 'text-[36px] sm:text-[42px] leading-[1.1] font-black tracking-tight drop-shadow-sm';
}

function truncateWords(text: string, limit: number = 20) {
    const words = text.split(/\s+/);
    if (words.length <= limit) return { text, isTruncated: false };
    return { text: words.slice(0, limit).join(' ') + '...', isTruncated: true };
}

function answerSize(text: string) {
    if (text.length > 300) return 'text-[18px] sm:text-[20px] leading-[1.6] tracking-normal font-normal text-white/80';
    if (text.length > 150) return 'text-[22px] sm:text-[26px] leading-[1.5] tracking-[-0.01em] font-medium text-white/90';
    return 'text-[28px] sm:text-[32px] leading-[1.3] font-bold tracking-[-0.015em] text-white';
}

export default function StudyCard({ card, isActive, isRapidFire, onAnswered }: StudyCardProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDoubtChat, setShowDoubtChat] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false); // Replacing isFlipped for accordion
    const [doubtQuestion, setDoubtQuestion] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isAskingAI, setIsAskingAI] = useState(false);

    // Micro-Engines
    const [certainty, setCertainty] = useState<number>(3);
    const [showRootCause, setShowRootCause] = useState(false);
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [timeTakenMs, setTimeTakenMs] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(7);

    const submitReview = useSRSStore((s) => s.submitReview);
    const recordAnswer = useProgressStore((s) => s.recordAnswer);
    const currentStreak = useProgressStore((s) => s.currentStreak);

    // Addictive Mechanics
    const [isLegendary, setIsLegendary] = useState(false);
    const [isMicroAmbush, setIsMicroAmbush] = useState(false);

    // Zero-Friction Listen Mode
    const isListenMode = useSRSStore((s) => s.isListenMode);

    useEffect(() => {
        if (isActive) {
            // Roll dice for mechanics
            const isPyq = card.type === CardType.PYQ || card.isPyqTagged;
            // 15% chance for a PYQ to become a Micro-Ambush (if not already in rapid fire)
            if (isPyq && !isRapidFire && Math.random() < 0.15) {
                setIsMicroAmbush(true);
            }

            // 10% chance for a legendary drop on high streaks for cards with tricks
            if (currentStreak > 15 && (card.topperTrick || card.customAnalogy) && Math.random() < 0.10) {
                setIsLegendary(true);
            }
        } else {
            setIsLegendary(false);
            setIsMicroAmbush(false);
        }
    }, [isActive, card, currentStreak, isRapidFire]);

    useEffect(() => {
        setTimeTakenMs(null);
        setHasAnswered(false);
        setSelectedOption(null);
        setShowRootCause(false);
        setShowDoubtChat(false);
        setShowAnswer(false);
        setAiResponse('');
    }, [card.id]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        const speedRequired = isRapidFire || isMicroAmbush;

        if (isActive && speedRequired && !hasAnswered && timeLeft > 0) {
            timer = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (isActive && speedRequired && !hasAnswered && timeLeft === 0) {
            handleAction(false, '🌪️ Panic/Timeout');
        }

        if (!isActive || (!isRapidFire && !isMicroAmbush)) {
            setTimeLeft(isMicroAmbush ? 10 : 7);
        }

        return () => clearTimeout(timer);
    }, [isActive, isRapidFire, hasAnswered, timeLeft, isMicroAmbush]);

    // Phase 6: Keyboard Shortcuts (Unicorn UX)
    useEffect(() => {
        if (!isActive || showEditModal || showDoubtChat) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Space to Expand
            if (e.code === 'Space') {
                e.preventDefault();
                setShowAnswer(!showAnswer);
            }

            // ... MCQ logic stays ...
            if (card.type === CardType.MCQ && !hasAnswered) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= (card.options?.length || 0)) {
                    handleMCQSelect(card.options![num - 1]);
                }
            }

            // Enter/v for Recall
            if (showAnswer && !hasAnswered) {
                if (e.key === 'Enter' || e.key === 'v') {
                    handleAction(true);
                }
                if (e.key === 'x' || e.key === 'f') {
                    handleAction(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, hasAnswered, card, showEditModal, showDoubtChat, showAnswer]);

    // Zero-Friction Listen Mode (Simplified for Reels)
    useEffect(() => {
        if (!isActive || !isListenMode || typeof window === 'undefined') {
            window.speechSynthesis?.cancel();
            return;
        }

        const synth = window.speechSynthesis;
        synth.cancel();

        const readText = (text: string, onEnd?: () => void) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.05;
            utterance.pitch = 1.0;
            const voices = synth.getVoices();
            const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US'));
            if (preferredVoice) utterance.voice = preferredVoice;

            if (onEnd) utterance.onend = onEnd;
            synth.speak(utterance);
        };

        if (!hasAnswered) {
            readText(card.front, () => {
                setTimeout(() => {
                    setShowAnswer(true);
                }, 1500);
            });
        } else {
            let textToRead = card.back;
            if (card.customAnalogy) textToRead += ". Analogy: " + card.customAnalogy;
            if (card.topperTrick) textToRead += ". Trick to remember: " + card.topperTrick;

            readText(textToRead, () => {
                setTimeout(() => {
                    if (onAnswered) onAnswered();
                }, 3000);
            });
        }

        return () => {
            synth.cancel();
        };
    }, [isActive, isListenMode, hasAnswered, card]);





    const handleMCQSelect = (option: MCQOption) => {
        if (hasAnswered) return;
        const ttMs = Date.now() - startTime;
        setTimeTakenMs(ttMs);
        triggerHaptic(option.isCorrect ? 'success' : 'warning');
        setSelectedOption(option.id);
        setHasAnswered(true);
        setShowAnswer(true);

        submitReview(card.id, option.isCorrect, undefined, certainty, ttMs);
        recordAnswer(card.subject, option.isCorrect);

        if (onAnswered) {
            setTimeout(() => onAnswered(), 1500);
        }
    };

    const handleAction = (recalled: boolean, failureReason?: string) => {
        if (hasAnswered) return;
        const ttMs = Date.now() - startTime;
        setTimeTakenMs(ttMs);
        triggerHaptic(recalled ? 'success' : 'medium');
        setHasAnswered(true);
        setShowAnswer(true);

        submitReview(card.id, recalled, failureReason, certainty, ttMs);
        recordAnswer(card.subject, recalled);

        if (onAnswered && recalled) {
            setTimeout(() => onAnswered(), 1200);
        }
    };

    const difficultyAccent = {
        EASY: { dot: 'bg-emerald-500', text: 'text-emerald-400' },
        MEDIUM: { dot: 'bg-amber-500', text: 'text-amber-400' },
        HARD: { dot: 'bg-rose-500', text: 'text-rose-400' },
    }[card.difficulty];

    const typeLabel = {
        [CardType.FLASHCARD]: 'Flashcard',
        [CardType.MCQ]: 'MCQ',
        [CardType.PYQ]: 'PYQ',
    }[card.type];

    return (
        <div className={`w-full h-full relative overflow-hidden bg-black transition-all duration-300 ${showAnswer ? 'z-[200]' : 'z-10'}`}>
            <motion.div
                className={`relative w-full h-full mx-auto border-x shadow-2xl overflow-hidden transition-all duration-500 ${currentStreak >= 10 ? 'border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)] animate-pulse-slow' : 'border-white/5'}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={isActive ? { opacity: 1, scale: hasAnswered ? 0.99 : 1 } : { opacity: 0.4, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >

                {/* Floating Action Menu (Right Side) - Minimalist 🔥 Oracle Link Only */}
                <div className={`absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-8 items-center z-50 pointer-events-auto transition-opacity duration-300 ${showAnswer ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    {card.oracleConfidence && (
                        <motion.button
                            onClick={(e) => { e.stopPropagation(); setShowAnswer(true); }}
                            className="w-14 h-14 rounded-full bg-black/40 border border-[#00ffcc]/30 flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(0,255,204,0.15)] relative overflow-hidden group"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <div className="absolute inset-0 bg-[#00ffcc]/10 animate-pulse" />
                            <span className="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">🔥</span>
                        </motion.button>
                    )}
                </div>

                {/* Rapid Fire Indicator */}
                {isRapidFire && !hasAnswered && (
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5 z-50">
                        <motion.div className="h-full bg-emerald-500" initial={{ width: '100%' }} animate={{ width: `${(timeLeft / 7) * 100}%` }} transition={{ duration: 1, ease: "linear" }} />
                    </div>
                )}

                {/* ═══════════ INSTAGRAM POST + CAPTION CONTENT ═══════════ */}
                <div className="relative w-full h-full flex flex-col">
                    {/* Top Context Bar (Premium Glass Badges) - Visible on Front Only */}
                    <AnimatePresence>
                        {!showAnswer && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute top-12 inset-x-0 flex justify-center gap-3 z-50 px-6"
                            >
                                <div className="px-4 py-1.5 rounded-full bg-white/[0.05] backdrop-blur-2xl border border-white/10 flex items-center gap-2 shadow-2xl">
                                    <span className={`w-1.5 h-1.5 rounded-full ${difficultyAccent.dot} animate-pulse`} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{card.subject}</span>
                                </div>
                                <div className="px-4 py-1.5 rounded-full bg-white/[0.05] backdrop-blur-2xl border border-white/10 flex items-center gap-2 shadow-2xl">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{card.topic}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Unified Scroll Area (Question + Interaction) */}
                    <div className="flex-1 overflow-y-auto no-scrollbar relative">
                        <div className="min-h-full flex flex-col items-center justify-center pt-24 pb-44 px-8 sm:px-12 gap-16">
                            {/* 1. The Question */}
                            <motion.div
                                className="w-full"
                                animate={{
                                    opacity: showAnswer ? 0 : 1,
                                    scale: showAnswer ? 0.95 : 1
                                }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <motion.p
                                    className={`${questionSize(card.front)} text-white text-balance text-center w-full drop-shadow-2xl mb-10`}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8, ease: "circOut" }}
                                >
                                    {card.front}
                                </motion.p>
                            </motion.div>

                            {/* 2. Interaction Layer (MCQ Options) */}
                            {card.type === CardType.MCQ && !hasAnswered && (
                                <div className="w-full flex flex-col gap-3">
                                    {card.options?.map((opt, i) => (
                                        <motion.button
                                            key={opt.id}
                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{ delay: i * 0.05, duration: 0.5, ease: "backOut" }}
                                            onClick={(e) => { e.stopPropagation(); handleMCQSelect(opt); }}
                                            className={`group relative w-full py-4.5 px-6 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${selectedOption === opt.id
                                                ? (opt.isCorrect ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-rose-500/20 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.2)]')
                                                : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-colors ${selectedOption === opt.id ? 'bg-white text-black border-transparent' : 'bg-black/40 text-white/40 border-white/10'}`}>
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                            <span className={`flex-1 text-left text-[14px] sm:text-[15px] font-bold leading-tight ${selectedOption === opt.id ? 'text-white' : 'text-white/70'}`}>
                                                {opt.text}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. The Caption (Expandable Answer Section) - Now Absolute to allow feed snapping */}
                    <motion.div
                        className="absolute bottom-0 inset-x-0 w-full bg-gradient-to-t from-black via-black/95 to-transparent pt-32 pb-8 px-6 z-40"
                        initial={false}
                        animate={{
                            height: showAnswer ? '100.1%' : '140px', // Slight overfill to ensure clean cover
                            maxHeight: showAnswer ? '100%' : '140px',
                            backgroundColor: showAnswer ? 'rgba(0,0,0,0.98)' : 'rgba(0,0,0,0)'
                        }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="max-w-xl mx-auto flex flex-col h-full">
                            <AnimatePresence mode="wait">
                                {!showAnswer ? (
                                    <motion.div
                                        key="preview"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col gap-2"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sniper Intel</span>
                                            <div className="flex-1 h-[1px] bg-white/5" />
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <p className="text-white/60 text-sm line-clamp-1 flex-1 font-medium">
                                                {card.back.replace(/[#*]/g, '').slice(0, 100)}...
                                            </p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowAnswer(true); triggerHaptic('light'); }}
                                                className="text-white/80 text-[11px] font-black uppercase tracking-wider hover:text-white transition-colors"
                                            >
                                                Learn More
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="expanded"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 30 }}
                                        className="space-y-6 overflow-y-auto pr-2 no-scrollbar pb-32"
                                    >
                                        {/* Header / Collapse Button */}
                                        <div className="flex items-center justify-between sticky top-0 bg-transparent py-2 z-10">
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Master Intel</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowAnswer(false); }}
                                                className="text-white/30 hover:text-white/60 p-1"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                            </button>
                                        </div>

                                        {/* Structured Content Sections */}
                                        <div className="space-y-8">
                                            {/* Section 1: The Logic */}
                                            <div className="space-y-3">
                                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] font-outfit">The Logic</h4>
                                                <ReactMarkdown
                                                    components={{
                                                        p: ({ children }) => <p className="text-[18px] sm:text-[21px] font-bold text-white/90 leading-[1.6] tracking-tight">{children}</p>,
                                                        strong: ({ children }) => <span className="text-emerald-400 font-black">{children}</span>,
                                                    }}
                                                >
                                                    {card.back}
                                                </ReactMarkdown>
                                            </div>

                                            {/* Section 2: The Trick (If exists) */}
                                            {card.topperTrick && (
                                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                                                    <h4 className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-2">The Trick</h4>
                                                    <p className="text-white/90 text-sm font-medium leading-relaxed italic">
                                                        {card.topperTrick}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Section 3: The Source */}
                                            <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <h4 className="text-[9px] font-black text-white/20 uppercase tracking-widest">The Source</h4>
                                                    <span className="text-white/40 text-[10px] font-bold">{typeLabel} • {card.difficulty} • {card.subject} • {card.topic}</span>
                                                </div>
                                                {card.year && (
                                                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black text-white/30 uppercase tracking-widest">PYQ {card.year}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bottom Actions for Review - Premium Glass Pills */}
                                        {!hasAnswered && (
                                            <div className="flex gap-4 pt-10">
                                                <motion.button
                                                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                                                    whileTap={{ scale: 0.96 }}
                                                    onClick={(e) => { e.stopPropagation(); handleAction(false); }}
                                                    className="flex-1 py-4.5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl text-[11px] font-black uppercase tracking-[0.25em] text-white/50 transition-all"
                                                >
                                                    Forgot
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.02, backgroundColor: '#f0f0f0' }}
                                                    whileTap={{ scale: 0.96 }}
                                                    onClick={(e) => { e.stopPropagation(); handleAction(true); }}
                                                    className="flex-1 py-4.5 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-[0.25em] shadow-[0_15px_35px_rgba(255,255,255,0.25)] transition-all"
                                                >
                                                    Got It
                                                </motion.button>
                                            </div>
                                        )}

                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowDoubtChat(true); }}
                                            className="w-full py-5 rounded-3xl border border-white/[0.03] bg-gradient-to-b from-white/[0.02] to-transparent text-[10px] text-white/20 font-black uppercase tracking-[0.4em] hover:text-white/40 transition-all mt-4"
                                        >
                                            Ask Oracle IQ
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                </div>
            </motion.div>

            {showEditModal && (
                <SuggestEditModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    cardId={card.id}
                    originalFront={card.front}
                    originalBack={card.back}
                />
            )}
        </div>
    );
}

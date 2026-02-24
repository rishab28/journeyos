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
import { askLiveAI } from '@/app/actions/core';
import { evaluateMains, EvalResult, trackCognitiveAction } from '@/app/actions/learner';
import SuggestEditModal from '@/components/shared/SuggestEditModal';
import { toast } from 'sonner';
import { triggerHaptic } from '@/lib/core/haptics';
import { shareIntel, getMySquads } from '@/app/actions/squads';
import { Share2, Users } from 'lucide-react';
import React, { memo, useCallback } from 'react';

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

const StudyCard = memo(function StudyCard({ card, isActive, isRapidFire, onAnswered }: StudyCardProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDoubtChat, setShowDoubtChat] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [doubtQuestion, setDoubtQuestion] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isAskingAI, setIsAskingAI] = useState(false);

    // Mains Evaluation State
    const [mainsAnswer, setMainsAnswer] = useState('');
    const [isEvaluatingMains, setIsEvaluatingMains] = useState(false);
    const [mainsResult, setMainsResult] = useState<EvalResult | null>(null);

    // Micro-Engines
    const [certainty, setCertainty] = useState<number>(3);
    const [showRootCause, setShowRootCause] = useState(false);
    const [recalled, setRecalled] = useState<boolean | null>(null);
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [timeTakenMs, setTimeTakenMs] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(7);

    const submitReview = useSRSStore((s) => s.submitReview);
    const recordAnswer = useProgressStore((s) => s.recordAnswer);
    const currentStreak = useProgressStore((s) => s.currentStreak);
    const isListenMode = useSRSStore((s) => s.isListenMode);

    // Addictive Mechanics
    const [isLegendary, setIsLegendary] = useState(false);
    const [isMicroAmbush, setIsMicroAmbush] = useState(false);

    useEffect(() => {
        if (isActive) {
            const isPyq = card.type === CardType.PYQ || card.isPyqTagged;
            if (isPyq && !isRapidFire && Math.random() < 0.15) {
                setIsMicroAmbush(true);
            }
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
        setRecalled(null);
        setAiResponse('');
        setMainsAnswer('');
        setMainsResult(null);
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

    useEffect(() => {
        if (!isActive || showEditModal || showDoubtChat) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                setShowAnswer(!showAnswer);
            }

            if (card.type === CardType.MCQ && !hasAnswered && Array.isArray(card.options)) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= card.options.length) {
                    handleMCQSelect(card.options[num - 1]);
                }
            }

            if (showAnswer && !hasAnswered) {
                if (e.key === 'Enter' || e.key === 'v') {
                    handleAction(true);
                }
                if (e.key === 'x' || e.key === 'f') {
                    handleAction(false);
                }
            }
        };

        // Do not swallow keydown events if the user is typing in a textarea or input
        if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') return;

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, hasAnswered, card, showEditModal, showDoubtChat, showAnswer]);

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

    const handleMCQSelect = useCallback((option: MCQOption) => {
        if (hasAnswered) return;
        const ttMs = Date.now() - startTime;
        setTimeTakenMs(ttMs);
        triggerHaptic(option.isCorrect ? 'success' : 'warning');
        setSelectedOption(option.id);
        setHasAnswered(true);
        setShowAnswer(true);

        submitReview(card.id, option.isCorrect, undefined, certainty, ttMs);
        recordAnswer(card.subject, option.isCorrect);

        // Telemetry tracking
        trackCognitiveAction({
            action: 'card_swiped',
            targetId: card.id,
            metadata: { type: 'MCQ', correct: option.isCorrect, timeTakenMs: ttMs }
        });

        if (onAnswered) {
            setTimeout(() => onAnswered(), 1500);
        }
    }, [hasAnswered, startTime, card.id, card.subject, certainty, submitReview, recordAnswer, onAnswered]);

    const handleAction = useCallback((isRecalled: boolean, failureReason?: string) => {
        if (hasAnswered) return;
        const ttMs = Date.now() - startTime;
        setTimeTakenMs(ttMs);
        triggerHaptic(isRecalled ? 'success' : 'medium');
        setHasAnswered(true);
        setShowAnswer(true);
        setRecalled(isRecalled);

        submitReview(card.id, isRecalled, failureReason, certainty, ttMs);
        recordAnswer(card.subject, isRecalled);

        // Telemetry tracking
        trackCognitiveAction({
            action: 'card_swiped',
            targetId: card.id,
            metadata: { type: card.type, correct: isRecalled, timeTakenMs: ttMs, failureReason }
        });

        if (onAnswered && isRecalled) {
            setTimeout(() => onAnswered(), 1200);
        }
    }, [hasAnswered, startTime, card.id, card.subject, certainty, submitReview, recordAnswer, onAnswered]);

    const handleShareToSquad = async () => {
        triggerHaptic('medium');
        const squadsRes = await getMySquads();
        if (!squadsRes.success || !squadsRes.squads || squadsRes.squads.length === 0) {
            toast.error("Join a Squad first to share intel!");
            return;
        }

        // Share to the first squad for now (MVP)
        const squad = squadsRes.squads[0];
        const res = await shareIntel(squad.id, 'card', card.id, card.front, {
            front: card.front,
            back: card.back,
            subject: card.subject,
            topic: card.topic
        });

        if (res.success) {
            toast.success(`Broadcasting to ${squad.name}!`);
        } else {
            toast.error("Broadcast failed.");
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
        [CardType.MAINS]: 'Mains Brief',
    }[card.type];

    return (
        <div className={`w-full h-full relative overflow-hidden bg-black transition-all duration-300 ${showAnswer ? 'z-[200]' : 'z-10'}`}>
            <motion.div
                className={`relative w-full h-full mx-auto border-x shadow-2xl overflow-hidden transition-all duration-500 ${currentStreak >= 10 ? 'border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)] animate-pulse-slow' : 'border-white/5'}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={isActive ? { opacity: 1, scale: hasAnswered ? 0.99 : 1 } : { opacity: 0.4, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Floating Action Menu (Right Side) */}
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

                    <motion.button
                        onClick={(e) => { e.stopPropagation(); handleShareToSquad(); }}
                        className="w-14 h-14 rounded-full bg-black/40 border border-white/20 flex items-center justify-center backdrop-blur-md group"
                        whileHover={{ scale: 1.1, borderColor: 'rgba(0, 255, 204, 0.4)' }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Share2 size={24} className="text-white/40 group-hover:text-[#00ffcc] transition-colors" />
                    </motion.button>
                </div>

                {/* Rapid Fire Indicator */}
                {isRapidFire && !hasAnswered && (
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5 z-50">
                        <motion.div className="h-full bg-emerald-500" initial={{ width: '100%' }} animate={{ width: `${(timeLeft / 7) * 100}%` }} transition={{ duration: 1, ease: "linear" }} />
                    </div>
                )}

                <div className="relative w-full h-full flex flex-col">
                    {/* Top Context Bar */}
                    <AnimatePresence>
                        {!showAnswer && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute top-10 inset-x-0 flex flex-col items-center gap-2 z-50 px-6"
                            >
                                <div className="flex justify-center gap-3">
                                    <div className="px-4 py-1.5 rounded-full bg-white/[0.05] backdrop-blur-2xl border border-white/10 flex items-center gap-2 shadow-2xl">
                                        <span className={`w-1.5 h-1.5 rounded-full ${difficultyAccent.dot} animate-pulse`} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{card.subject}</span>
                                    </div>
                                    <div className="px-4 py-1.5 rounded-full bg-white/[0.05] backdrop-blur-2xl border border-white/10 flex items-center gap-2 shadow-2xl">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{card.topic}</span>
                                    </div>
                                </div>

                                {useSRSStore.getState().causalBridgePrompt && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="px-4 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md"
                                    >
                                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                                            {useSRSStore.getState().causalBridgePrompt}
                                        </p>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Unified Scroll Area */}
                    <div className="flex-1 overflow-y-auto no-scrollbar relative">
                        <div className="min-h-full flex flex-col items-center justify-start pb-32 px-8 sm:px-12 gap-6">
                            {/* Visual Spacer for Header Labels */}
                            <div className="h-40 w-full flex-shrink-0" />

                            <motion.div
                                className="w-full"
                                animate={{ opacity: showAnswer ? 0 : 1, scale: showAnswer ? 0.95 : 1 }}
                                transition={{ duration: 0.6 }}
                            >
                                <motion.p className={`${questionSize(card.front)} text-white text-balance text-center w-full drop-shadow-2xl mb-6`}>
                                    {card.front}
                                </motion.p>
                            </motion.div>

                            {card.type === CardType.MCQ && !hasAnswered && Array.isArray(card.options) && (
                                <div className="w-full flex flex-col gap-3">
                                    {card.options.map((opt, i) => (
                                        <motion.button
                                            key={opt.id}
                                            onClick={(e) => { e.stopPropagation(); handleMCQSelect(opt); }}
                                            className={`group relative w-full py-4.5 px-6 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${selectedOption === opt.id ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-white/20'}`}
                                        >
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border border-white/10 bg-black/40 text-white/40">
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                            <span className="flex-1 text-left text-[14px] font-bold text-white/70">
                                                {opt.text}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            {card.type === CardType.MAINS && !hasAnswered && (
                                <div className="w-full flex flex-col gap-4 mt-4 w-[100%] max-w-[800px] z-50">
                                    <textarea
                                        value={mainsAnswer}
                                        onChange={(e) => setMainsAnswer(e.target.value)}
                                        placeholder="Type your answer here..."
                                        className="w-full h-40 bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white/90 text-[14px] leading-relaxed resize-none focus:outline-none focus:border-[#00ffcc]/50 focus:bg-white/[0.05] transition-all"
                                    />
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (!mainsAnswer.trim() || isEvaluatingMains) return;
                                            setIsEvaluatingMains(true);
                                            try {
                                                const res = await evaluateMains(card.id, card.front, mainsAnswer);
                                                setMainsResult(res);
                                                setHasAnswered(true);
                                                setShowAnswer(true);
                                                setRecalled(res.score >= 5);
                                                recordAnswer(card.subject, res.score >= 5);
                                                submitReview(card.id, res.score >= 5, undefined, certainty, Date.now() - startTime);
                                                trackCognitiveAction({
                                                    action: 'mains_evaluated',
                                                    targetId: card.id,
                                                    metadata: { score: res.score, length: mainsAnswer.length }
                                                });
                                            } catch (err) {
                                                toast.error("Evaluation failed.");
                                            } finally {
                                                setIsEvaluatingMains(false);
                                            }
                                        }}
                                        disabled={isEvaluatingMains || !mainsAnswer.trim()}
                                        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00ffcc]/10 to-emerald-500/10 border border-[#00ffcc]/30 text-[#00ffcc] font-black uppercase tracking-widest text-[12px] hover:from-[#00ffcc]/20 hover:to-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isEvaluatingMains ? <span className="w-4 h-4 rounded-full border-2 border-t-transparent border-[#00ffcc] animate-spin" /> : '⚡ Submit to Oracle'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Answer Section */}
                    <motion.div
                        className="absolute bottom-0 inset-x-0 w-full bg-gradient-to-t from-black via-black/95 to-transparent pt-32 pb-8 px-6 z-40"
                        animate={{
                            height: showAnswer ? '100.1%' : '140px',
                            maxHeight: showAnswer ? '100%' : '140px',
                            backgroundColor: showAnswer ? 'rgba(0,0,0,0.98)' : 'rgba(0,0,0,0)'
                        }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="max-w-xl mx-auto flex flex-col h-full">
                            <AnimatePresence mode="wait">
                                {!showAnswer ? (
                                    <motion.div key="preview" className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sniper Intel</span>
                                            <div className="flex-1 h-[1px] bg-white/5" />
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <p className="text-white/60 text-sm line-clamp-1 flex-1 font-medium">
                                                {card.back.replace(/[#*]/g, '').slice(0, 100)}...
                                            </p>
                                            <button onClick={() => setShowAnswer(true)} className="text-white/80 text-[11px] font-black tracking-wider uppercase">Learn More</button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="expanded" className="space-y-6 overflow-y-auto no-scrollbar pb-32">
                                        <div className="flex items-center justify-between sticky top-0 bg-transparent py-2 z-10">
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Master Intel</span>
                                            <button onClick={() => setShowAnswer(false)} className="text-white/30 p-1">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
                                            </button>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">The Logic</h4>
                                                <ReactMarkdown components={{ p: ({ children }) => <p className="text-[21px] font-bold text-white/90 leading-[1.6]">{children}</p> }}>
                                                    {card.back}
                                                </ReactMarkdown>
                                            </div>

                                            {card.topperTrick && (
                                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                                                    <h4 className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-2">The Trick</h4>
                                                    <p className="text-white/90 text-sm italic">{card.topperTrick}</p>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <h4 className="text-[9px] font-black text-white/20 uppercase tracking-widest">The Source</h4>
                                                    <span className="text-white/40 text-[10px] font-bold">{typeLabel} • {card.difficulty} • {card.subject}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {card.type === CardType.MAINS && mainsResult && (
                                            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 mb-8 mt-4 shadow-xl">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="w-2 h-2 rounded-full bg-[#00ffcc] shadow-[0_0_8px_#00ffcc]" />
                                                    <h4 className="text-[10px] font-black text-[#00ffcc] uppercase tracking-widest">Oracle Evaluation</h4>
                                                </div>

                                                <div className="flex items-end gap-4 mb-6">
                                                    <div className="text-[48px] font-black text-white leading-none tracking-tighter">
                                                        {mainsResult.score}<span className="text-[20px] text-white/30">/10</span>
                                                    </div>
                                                    <div className="pb-1 text-[11px] font-bold text-white/50 uppercase tracking-widest">
                                                        {mainsResult.score >= 7 ? 'Rank-1 Bound' : mainsResult.score >= 5 ? 'Average Contender' : 'Needs Work'}
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="bg-white/5 rounded-xl p-4">
                                                        <h5 className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Topper Comparison</h5>
                                                        <p className="text-[13px] text-white/80 font-medium leading-relaxed">{mainsResult.topperComparison}</p>
                                                    </div>

                                                    <div className="bg-white/5 rounded-xl p-4">
                                                        <h5 className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Detailed Feedback</h5>
                                                        <p className="text-[13px] text-white/80 font-medium leading-relaxed">{mainsResult.feedback}</p>
                                                    </div>

                                                    {mainsResult.missing && mainsResult.missing.length > 0 && (
                                                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                                                            <h5 className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-2">Missing Keywords</h5>
                                                            <div className="flex flex-wrap gap-2">
                                                                {mainsResult.missing.map((kw: string) => (
                                                                    <span key={kw} className="px-2 py-1 bg-rose-500/10 rounded-md text-[10px] font-bold text-rose-300">{kw}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {!hasAnswered && card.type !== CardType.MAINS && (
                                            <>
                                                <div className="flex items-center gap-6 mb-12">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Memory Stability</span>
                                                        <span className="text-sm font-black text-white">{(card.srs as any).stability || card.srs.interval} Days</span>
                                                    </div>
                                                    <div className="w-px h-6 bg-white/10" />
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Next Sync</span>
                                                        <span className="text-sm font-black text-emerald-400">
                                                            {new Date(card.srs.nextReviewDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center gap-8 w-full">
                                                    <div className="flex gap-20">
                                                        <button onClick={() => handleAction(true)} className="group flex flex-col items-center gap-4">
                                                            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl group-hover:bg-emerald-500 transition-all">🧠</div>
                                                            <span className="text-[10px] font-black text-emerald-400/60 uppercase group-hover:text-emerald-400">Recalled</span>
                                                        </button>
                                                        <button onClick={() => handleAction(false)} className="group flex flex-col items-center gap-4">
                                                            <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-3xl group-hover:bg-rose-500 transition-all">💀</div>
                                                            <span className="text-[10px] font-black text-rose-400/60 uppercase group-hover:text-rose-400">Forgot</span>
                                                        </button>
                                                    </div>

                                                    {recalled === false && (
                                                        <button
                                                            onClick={async () => {
                                                                const { useProgressStore } = await import('@/store/progressStore');
                                                                const interest = useProgressStore.getState().interestProfile;
                                                                const { generateAIAnalogy } = await import('@/app/actions/learner/analogyEngine');
                                                                const res = await generateAIAnalogy(card.topic, card.back, interest);
                                                                if (res.success) alert(res.analogy);
                                                            }}
                                                            className="px-6 py-2.5 rounded-full border border-[#00ffcc]/30 bg-[#00ffcc]/5 text-[10px] font-black text-[#00ffcc] uppercase tracking-widest hover:bg-[#00ffcc]/10 transition-all flex items-center gap-3"
                                                        >
                                                            ☄️ Infuse AI Analogy
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        <button
                                            onClick={() => setShowDoubtChat(true)}
                                            className="w-full py-5 rounded-3xl border border-white/[0.03] bg-gradient-to-b from-white/[0.02] text-[10px] text-white/20 font-black uppercase tracking-[0.4em] mt-4"
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
});

export default StudyCard;

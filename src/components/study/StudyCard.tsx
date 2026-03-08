'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Executive Minimalist StudyCard
// Mobile-first, high-focus, distraction-free learning
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { StudyCard as StudyCardType, CardType, MCQOption } from '@/types';
import { useSRSStore } from '@/store/srsStore';
import { useProgressStore } from '@/store/progressStore';
import { evaluateMains, EvalResult, trackCognitiveAction } from '@/app/actions/learner';
import SuggestEditModal from '@/components/shared/SuggestEditModal';
import { toast } from 'sonner';
import { triggerHaptic } from '@/lib/core/haptics';
import { shareIntel, getMySquads } from '@/app/actions/squads';
import { Share2, Languages } from 'lucide-react';
import React, { memo, useCallback } from 'react';
import MermaidMindMap from '@/components/shared/MermaidMindMap';

interface StudyCardProps {
    card: StudyCardType;
    isActive: boolean;
    isRapidFire?: boolean;
    onAnswered?: () => void;
}

// Adaptive text sizing for central focus
function questionSize(text: string) {
    if (text.length > 250) return 'text-[22px] sm:text-[24px] leading-relaxed font-medium';
    if (text.length > 120) return 'text-[26px] sm:text-[30px] leading-relaxed font-bold';
    return 'text-[32px] sm:text-[38px] leading-tight font-bold tracking-tight';
}

const StudyCard = memo(function StudyCard({ card, isActive, isRapidFire, onAnswered }: StudyCardProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [language, setLanguage] = useState<'en' | 'hi'>('en');

    // Mains Evaluation State
    const [mainsAnswer, setMainsAnswer] = useState('');
    const [isEvaluatingMains, setIsEvaluatingMains] = useState(false);
    const [mainsResult, setMainsResult] = useState<EvalResult | null>(null);

    // Micro-Engines
    const [recalled, setRecalled] = useState<boolean | null>(null);
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [timeTakenMs, setTimeTakenMs] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(7);

    const submitReview = useSRSStore((s) => s.submitReview);
    const recordAnswer = useProgressStore((s) => s.recordAnswer);
    const isListenMode = useSRSStore((s) => s.isListenMode);

    useEffect(() => {
        setTimeTakenMs(null);
        setHasAnswered(false);
        setSelectedOption(null);
        setShowAnswer(false);
        setRecalled(null);
        setMainsAnswer('');
        setMainsResult(null);
        setStartTime(Date.now());
    }, [card.id]);

    useEffect(() => {
        if (!isActive || showEditModal) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                setShowAnswer(!showAnswer);
            }

            let currentOptions = card.options;
            if (typeof currentOptions === 'string') {
                try { currentOptions = JSON.parse(currentOptions); } catch (e) { currentOptions = []; }
            }
            if ((card.type === CardType.MCQ || card.type === CardType.PYQ) && !hasAnswered && Array.isArray(currentOptions) && currentOptions.length > 0) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= currentOptions.length) {
                    handleMCQSelect(currentOptions[num - 1]);
                }
            }

            if (showAnswer && !hasAnswered) {
                if (e.key === 'Enter' || e.key === 'v') handleAction(true);
                if (e.key === 'x' || e.key === 'f') handleAction(false);
            }
        };

        if (document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'INPUT') return;

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, hasAnswered, card, showEditModal, showAnswer]);

    const handleMCQSelect = useCallback((option: MCQOption) => {
        if (hasAnswered) return;
        const ttMs = Date.now() - startTime;
        setTimeTakenMs(ttMs);
        triggerHaptic(option.isCorrect ? 'success' : 'warning');
        setSelectedOption(option.id);
        setHasAnswered(true);

        submitReview(card.id, option.isCorrect, undefined, 3, ttMs);
        recordAnswer(card.subject, option.isCorrect);

        trackCognitiveAction({
            action: 'card_swiped',
            targetId: card.id,
            metadata: { type: 'MCQ', correct: option.isCorrect, timeTakenMs: ttMs }
        });
    }, [hasAnswered, startTime, card.id, card.subject, submitReview, recordAnswer]);

    const handleAction = useCallback((isRecalled: boolean, failureReason?: string) => {
        if (hasAnswered) return;
        const ttMs = Date.now() - startTime;
        setTimeTakenMs(ttMs);
        triggerHaptic(isRecalled ? 'success' : 'medium');
        setHasAnswered(true);
        setShowAnswer(true);
        setRecalled(isRecalled);

        submitReview(card.id, isRecalled, failureReason, 3, ttMs);
        recordAnswer(card.subject, isRecalled);

        trackCognitiveAction({
            action: 'card_swiped',
            targetId: card.id,
            metadata: { type: card.type, correct: isRecalled, timeTakenMs: ttMs, failureReason }
        });

        if (onAnswered && isRecalled) setTimeout(() => onAnswered(), 1200);
    }, [hasAnswered, startTime, card.id, card.subject, submitReview, recordAnswer, onAnswered]);

    const handleShareToSquad = async () => {
        triggerHaptic('medium');
        const squadsRes = await getMySquads();
        if (!squadsRes.success || !squadsRes.squads?.length) {
            toast.error("Join a Squad first to share intel!");
            return;
        }

        const squad = squadsRes.squads[0] as any;
        const res = await shareIntel(squad.id, 'card', card.id, card.front, {
            front: card.front,
            back: card.back,
            subject: card.subject,
            topic: card.topic
        });

        if (res.success) toast.success(`Broadcasting to ${squad.name}!`);
        else toast.error("Broadcast failed.");
    };

    const typeLabel = {
        [CardType.FLASHCARD]: 'Flashcard',
        [CardType.MCQ]: 'MCQ',
        [CardType.PYQ]: 'PYQ',
        [CardType.MAINS]: 'Mains Brief',
    }[card.type];

    const questionText = language === 'hi' ? (card.translations?.hi?.front || card.front) : card.front;
    const answerText = language === 'hi' ? (card.translations?.hi?.back || card.back) : card.back;

    return (
        <div className="w-full h-full relative overflow-hidden bg-[#050508]">
            <motion.div
                className="relative w-full h-full mx-auto border-x border-white/[0.03] shadow-2xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0.4, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Minimal Header Controls */}
                <div className="absolute top-10 right-8 flex flex-col gap-5 z-50">
                    {card.translations?.hi && (
                        <button
                            onClick={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}
                            className="w-12 h-12 rounded-full glass-panel border border-white/10 text-white/40 hover:text-white flex items-center justify-center transition-all hover:border-indigo-500/30"
                        >
                            <Languages size={20} />
                        </button>
                    )}
                    <button
                        onClick={handleShareToSquad}
                        className="w-12 h-12 rounded-full glass-panel border border-white/10 text-white/40 hover:text-white flex items-center justify-center transition-all hover:border-indigo-500/30"
                    >
                        <Share2 size={20} />
                    </button>
                </div>

                <div className="relative w-full h-full flex flex-col">
                    {/* Centered Question Core */}
                    <div className="flex-1 flex flex-col items-center justify-center px-12 text-center pb-24">
                        <motion.div
                            animate={{ opacity: showAnswer ? 0.3 : 1, y: showAnswer ? -40 : 0, scale: showAnswer ? 0.95 : 1 }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="space-y-10"
                        >
                            <div className="flex justify-center gap-3">
                                <span className="px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 font-caps text-[9px] text-white/30 tracking-[0.25em] uppercase font-black">
                                    {card.subject}
                                </span>
                                <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                                    <span className="font-caps text-[9px] text-indigo-400 tracking-[0.25em] uppercase font-black">
                                        {typeLabel}
                                    </span>
                                </div>
                            </div>

                            <h2 className={`${questionSize(questionText)} text-white font-bold leading-tight tracking-tight max-w-2xl mx-auto`}>
                                {questionText}
                            </h2>
                        </motion.div>

                        {/* Options */}
                        {(() => {
                            let parsedOptions = card.options;
                            if (typeof parsedOptions === 'string') {
                                try {
                                    parsedOptions = JSON.parse(parsedOptions);
                                } catch (e) {
                                    parsedOptions = [];
                                }
                            }
                            const hasValidOptions = (card.type === CardType.MCQ || card.type === CardType.PYQ) && Array.isArray(parsedOptions) && parsedOptions.length > 0;

                            if (!hasValidOptions) return null;

                            return (
                                <div className="w-full max-w-md flex flex-col gap-4 mt-16 z-20 pb-10">
                                    {parsedOptions.map((opt: MCQOption, i: number) => {
                                        const isSelected = selectedOption === opt.id;
                                        const showResult = hasAnswered;

                                        let btnClass = "group w-full py-5 px-8 rounded-2xl glass-card-premium border border-white/5 hover:border-indigo-500/30 transition-all flex items-center gap-6 text-left relative overflow-hidden";
                                        let indicatorClass = "relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[12px] font-black text-white/30 group-hover:text-indigo-400 group-hover:border-indigo-500/40 transition-all";
                                        let textClass = "relative text-[15px] font-bold text-white/50 group-hover:text-white transition-colors tracking-tight";

                                        if (showResult) {
                                            if (opt.isCorrect) {
                                                btnClass = "w-full py-5 px-8 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center gap-6 text-left relative overflow-hidden";
                                                indicatorClass = "relative w-10 h-10 rounded-xl bg-green-500/20 text-[12px] font-black text-green-400 border border-green-500/30 flex items-center justify-center";
                                                textClass = "relative text-[15px] font-bold text-green-100 tracking-tight";
                                            } else if (isSelected) {
                                                btnClass = "w-full py-5 px-8 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-6 text-left relative overflow-hidden";
                                                indicatorClass = "relative w-10 h-10 rounded-xl bg-red-500/20 text-[12px] font-black text-red-400 border border-red-500/30 flex items-center justify-center";
                                                textClass = "relative text-[15px] font-bold text-red-100 tracking-tight";
                                            } else {
                                                btnClass = "w-full py-5 px-8 rounded-2xl bg-white/[0.02] border border-white/[0.02] flex items-center gap-6 text-left relative overflow-hidden opacity-40";
                                                indicatorClass = "relative w-10 h-10 rounded-xl bg-transparent text-[12px] font-black text-white/20 flex items-center justify-center";
                                                textClass = "relative text-[15px] font-bold text-white/20 tracking-tight";
                                            }
                                        }

                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleMCQSelect(opt)}
                                                disabled={hasAnswered}
                                                className={btnClass}
                                            >
                                                {!showResult && <div className="absolute inset-0 bg-indigo-500/[0.01] group-hover:bg-indigo-500/[0.03] transition-colors" />}
                                                <div className={indicatorClass}>
                                                    {String.fromCharCode(65 + i)}
                                                </div>
                                                <span className={textClass}>
                                                    {opt.text}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Minimalist Answer Shell (Premium Obsidian Tucked) */}
                    <motion.div
                        className="absolute bottom-0 inset-x-0 w-full bg-[#08080a] z-40 rounded-t-[48px] border-t border-white/[0.05] shadow-[0_-30px_60px_rgba(0,0,0,0.8)]"
                        initial={{ height: '120px' }}
                        animate={{ height: showAnswer ? '100%' : '120px' }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Drag Handle / Indicator */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10 rounded-full" />

                        <div className="max-w-2xl mx-auto flex flex-col h-full px-10">
                            {!showAnswer ? (
                                <div className="h-full flex items-center justify-between pt-4">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="font-caps text-[9px] text-indigo-400/60 tracking-[0.3em] font-black uppercase">EXECUTIVE SUMMARY</span>
                                        <p className="text-[13px] font-bold text-white/40 line-clamp-1 truncate max-w-[240px] tracking-tight">
                                            {card.back.slice(0, 100)}...
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowAnswer(true)}
                                        className="h-12 px-6 rounded-2xl glass-panel border border-white/10 font-caps text-[10px] text-white/40 tracking-[0.2em] hover:text-white hover:border-white/20 transition-all font-black"
                                    >
                                        REVEAL INTEL
                                    </button>
                                </div>
                            ) : (
                                <div className="pt-20 pb-40 overflow-y-auto no-scrollbar space-y-16">
                                    <div className="flex justify-between items-center">
                                        <span className="font-caps text-[10px] text-indigo-400 tracking-[0.4em] font-black uppercase">MASTER PERSPECTIVE</span>
                                        <button onClick={() => setShowAnswer(false)} className="w-10 h-10 rounded-full glass-panel border border-white/10 flex items-center justify-center text-white/20 hover:text-white transition-colors">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                        </button>
                                    </div>

                                    <div className="space-y-8 prose prose-invert max-w-none">
                                        <ReactMarkdown components={{
                                            p: ({ children }) => <p className="text-[24px] font-bold text-white/90 leading-[1.6] tracking-tight">{children}</p>,
                                            li: ({ children }) => <li className="text-[20px] font-medium text-white/70 leading-relaxed mb-4">{children}</li>
                                        }}>
                                            {answerText}
                                        </ReactMarkdown>
                                    </div>

                                    {card.topicMap && (
                                        <div className="pt-12 border-t border-white/[0.04]">
                                            <div className="flex items-center gap-3 mb-10">
                                                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                                <h4 className="font-caps text-[10px] text-white/20 tracking-[0.3em] font-black uppercase">NEURAL CONCEPT MAP</h4>
                                            </div>
                                            <div className="rounded-[32px] glass-panel p-8 border border-white/5">
                                                <MermaidMindMap code={card.topicMap} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Area */}
                                    {!hasAnswered && (
                                        <div className="pt-16 space-y-12">
                                            <div className="flex justify-center gap-20">
                                                <button onClick={() => handleAction(true)} className="group flex flex-col items-center gap-6">
                                                    <div className="w-24 h-24 rounded-full border border-white/10 glass-panel flex items-center justify-center text-4xl group-hover:border-indigo-500 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-500 scale-110">🧠</div>
                                                    <span className="font-caps text-[11px] text-white/20 tracking-[0.3em] font-black group-hover:text-white transition-colors">RECALLED</span>
                                                </button>
                                                <button onClick={() => handleAction(false)} className="group flex flex-col items-center gap-6">
                                                    <div className="w-24 h-24 rounded-full border border-white/10 glass-panel flex items-center justify-center text-4xl group-hover:border-rose-500 group-hover:shadow-[0_0_30px_rgba(244,63,94,0.15)] transition-all duration-500 scale-110">💀</div>
                                                    <span className="font-caps text-[11px] text-white/20 tracking-[0.3em] font-black group-hover:text-white transition-colors">FORGOT</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
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

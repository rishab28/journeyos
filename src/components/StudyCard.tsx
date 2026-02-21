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

interface StudyCardProps {
    card: StudyCardType;
    isActive: boolean;
    isRapidFire?: boolean;
    onAnswered?: () => void;
}

// Adaptive text sizing for central focus (Bespoke Apple-style Typography)
function questionSize(text: string) {
    if (text.length > 250) return 'text-[22px] sm:text-[26px] leading-[1.4] tracking-[-0.01em] font-medium';
    if (text.length > 120) return 'text-[28px] sm:text-[34px] leading-[1.25] tracking-[-0.02em] font-semibold';
    return 'text-[36px] sm:text-[44px] leading-[1.15] font-black tracking-[-0.03em]';
}

function answerSize(text: string) {
    if (text.length > 300) return 'text-[18px] sm:text-[20px] leading-[1.6] tracking-normal font-normal text-white/80';
    if (text.length > 150) return 'text-[22px] sm:text-[26px] leading-[1.5] tracking-[-0.01em] font-medium text-white/90';
    return 'text-[28px] sm:text-[32px] leading-[1.3] font-bold tracking-[-0.015em] text-white';
}

export default function StudyCard({ card, isActive, isRapidFire, onAnswered }: StudyCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDoubtChat, setShowDoubtChat] = useState(false);
    const [showDeepDive, setShowDeepDive] = useState(false);
    const [doubtQuestion, setDoubtQuestion] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isAskingAI, setIsAskingAI] = useState(false);

    // Micro-Engines
    const [certainty, setCertainty] = useState<number>(3); // 1 = Low, 5 = High
    const [showRootCause, setShowRootCause] = useState(false);
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [timeTakenMs, setTimeTakenMs] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(7); // Rapid Fire 7s timer

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
        setIsFlipped(false);
        setHasAnswered(false);
        setSelectedOption(null);
        setShowRootCause(false);
        setShowDoubtChat(false);
        setShowDeepDive(false);
        setAiResponse('');
    }, [card.id]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        const speedRequired = isRapidFire || isMicroAmbush;

        if (isActive && speedRequired && !isFlipped && !hasAnswered && timeLeft > 0) {
            timer = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (isActive && speedRequired && !isFlipped && !hasAnswered && timeLeft === 0) {
            handleAction(false, '🌪️ Panic/Timeout');
        }

        if (!isActive || (!isRapidFire && !isMicroAmbush)) {
            setTimeLeft(isMicroAmbush ? 10 : 7);
        }

        return () => clearTimeout(timer);
    }, [isActive, isRapidFire, isFlipped, hasAnswered, timeLeft, isMicroAmbush]);

    // Phase 6: Keyboard Shortcuts (Unicorn UX)
    useEffect(() => {
        if (!isActive || showEditModal || showDoubtChat) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Space to Flip
            if (e.code === 'Space') {
                e.preventDefault();
                handleFlip();
            }

            // 1-4 for MCQ Options
            if (card.type === CardType.MCQ && !hasAnswered) {
                const num = parseInt(e.key);
                if (num >= 1 && num <= (card.options?.length || 0)) {
                    handleMCQSelect(card.options![num - 1]);
                    toast.success(`Speed Select: Option ${num}`, { icon: '⚡', duration: 1000 });
                }
            }

            // Enter/v for Recall, x/f for Forgot
            if (isFlipped && !hasAnswered) {
                if (e.key === 'Enter' || e.key === 'v') {
                    handleAction(true);
                    toast.success('Focused Recall +5 XP', { icon: '🧠', duration: 1000 });
                }
                if (e.key === 'x' || e.key === 'f') {
                    handleAction(false);
                    toast.error('Synapse Gap Detected', { icon: '🌑', duration: 1000 });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, isFlipped, hasAnswered, card, showEditModal, showDoubtChat]);

    // Listen Mode Engine (Auto-Play & Auto-Swipe)
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
            // Try to find a good English voice
            const voices = synth.getVoices();
            const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US'));
            if (preferredVoice) utterance.voice = preferredVoice;

            if (onEnd) utterance.onend = onEnd;
            synth.speak(utterance);
        };

        if (!isFlipped && !hasAnswered) {
            // Read Front Card
            readText(card.front, () => {
                // Wait 1.5 seconds after reading question, then flip
                setTimeout(() => {
                    setIsFlipped(true);
                }, 1500);
            });
        } else if (isFlipped && !hasAnswered) {
            // Read Back Card
            let textToRead = card.back;
            if (card.customAnalogy) textToRead += ". Analogy: " + card.customAnalogy;
            if (card.topperTrick) textToRead += ". Trick to remember: " + card.topperTrick;

            readText(textToRead, () => {
                // Wait 2.5 seconds after reading answer, then auto-mark correct and swipe next
                setTimeout(() => {
                    if (card.type === CardType.MCQ) {
                        const correctOpt = card.options?.find(o => o.isCorrect);
                        if (correctOpt) handleMCQSelect(correctOpt);
                    } else {
                        handleAction(true); // Default to 'Recalled' in passive mode
                    }
                }, 2500);
            });
        }

        return () => {
            synth.cancel();
        };
    }, [isActive, isListenMode, isFlipped, hasAnswered, card]);



    const triggerHaptic = (success: boolean) => {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            try {
                navigator.vibrate(success ? [30, 40, 30] : [150]);
            } catch (e) { }
        }
    };

    const handleFlip = () => {
        if (card.type !== CardType.MCQ && !hasAnswered) {
            setIsFlipped(!isFlipped);
            if (!isFlipped) setStartTime(Date.now());
        }
    };

    const handleMCQSelect = (option: MCQOption) => {
        if (hasAnswered) return;
        const ttMs = Date.now() - startTime;
        setTimeTakenMs(ttMs);
        triggerHaptic(option.isCorrect);
        setSelectedOption(option.id);
        setHasAnswered(true);
        setIsFlipped(true);

        submitReview(card.id, option.isCorrect, undefined, certainty, ttMs);
        recordAnswer(card.subject, option.isCorrect);

        // Auto-scroll to next card after a short delay
        if (onAnswered) {
            setTimeout(() => onAnswered(), 600);
        }
    };

    const handleAction = (recalled: boolean, failureReason?: string) => {
        if (hasAnswered) return;
        const ttMs = Date.now() - startTime;
        setTimeTakenMs(ttMs);
        triggerHaptic(recalled);
        setHasAnswered(true);

        submitReview(card.id, recalled, failureReason, certainty, ttMs);
        recordAnswer(card.subject, recalled);

        // Auto-scroll to next card after a short delay
        if (onAnswered) {
            setTimeout(() => onAnswered(), 600);
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
        <div className="w-full h-screen snap-start snap-always relative flex items-center justify-center p-3 pb-[4.5rem] sm:p-6 sm:pb-[5.5rem]">
            <motion.div
                className="relative w-full h-full max-h-[85vh] max-w-xl mx-auto rounded-[2rem] sm:rounded-[2.5rem] bg-[#0c0c11] border border-white/5 shadow-2xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={isActive ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0.4, scale: 0.95, y: 20 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Minimal Top Bar */}
                <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-50 pointer-events-none">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold">{typeLabel}</span>
                        <div className="flex items-center gap-1.5 opacity-60">
                            <div className={`w-1.5 h-1.5 rounded-full ${difficultyAccent.dot}`} />
                            <span className={`text-[10px] tracking-wider uppercase font-semibold ${difficultyAccent.text}`}>{card.difficulty}</span>
                        </div>
                    </div>

                    <div className="flex gap-4 items-center pointer-events-auto">
                        <button onClick={(e) => { e.stopPropagation(); setShowDoubtChat(true); setIsFlipped(true); }} className="text-white/40 hover:text-white transition-colors bg-white/5 p-2 rounded-full backdrop-blur-md">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }} className="text-white/40 hover:text-white transition-colors bg-white/5 p-2 rounded-full backdrop-blur-md">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                        </button>
                    </div>
                </div>

                {/* Rapid Fire Indicator */}
                {isRapidFire && !isFlipped && !hasAnswered && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-transparent z-50">
                        <motion.div className="h-full bg-white/80" initial={{ width: '100%' }} animate={{ width: `${(timeLeft / 7) * 100}%` }} transition={{ duration: 1, ease: "linear" }} />
                    </div>
                )}

                {/* The Flipping Content */}
                <motion.div
                    className="relative w-full h-full perspective-1000 cursor-pointer"
                    onClick={handleFlip}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {/* ═══════════ FRONT FACE ═══════════ */}
                    <motion.div
                        className="absolute inset-0 w-full h-full flex flex-col items-center justify-start px-6 py-20 sm:px-10 sm:py-24 bg-[#0c0c11] overflow-y-auto overflow-x-hidden"
                        style={{ backfaceVisibility: 'hidden' }}
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} // Apple-like spring/easing
                    >
                        <div className="flex-1 flex items-center justify-center w-full max-w-xl mx-auto my-auto min-h-0 shrink-0">
                            <p className={`${questionSize(card.front)} text-white text-balance text-left w-full mb-12 sm:mb-20 px-2 sm:px-0`}>
                                {card.front}
                            </p>
                        </div>

                        {/* MCQ Options (Sleek List) */}
                        {card.type === CardType.MCQ && Array.isArray(card.options) && card.options.length > 0 && (
                            <div className="w-full max-w-xl mx-auto space-y-4 pb-24 shrink-0 px-2 sm:px-0">
                                {card.options.map((opt) => {
                                    let optClass = 'text-white/70 hover:text-white hover:bg-white/[0.04] border-white/5 bg-white/[0.02] shadow-sm';
                                    if (hasAnswered) {
                                        if (opt.isCorrect) optClass = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/[0.08] shadow-[0_0_20px_rgba(16,185,129,0.1)] font-semibold';
                                        else if (selectedOption === opt.id) optClass = 'text-white/40 line-through opacity-50 border-transparent bg-transparent';
                                        else optClass = 'text-white/20 opacity-30 border-transparent bg-transparent';
                                    }
                                    return (
                                        <motion.button
                                            key={opt.id}
                                            onClick={(e) => { e.stopPropagation(); handleMCQSelect(opt); }}
                                            className={`w-full py-5 px-6 sm:px-8 rounded-[1.5rem] border transition-all duration-300 text-left text-[17px] sm:text-[19px] leading-relaxed tracking-tight ${optClass}`}
                                        >
                                            {opt.text}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>

                    {/* ═══════════ BACK FACE ═══════════ */}
                    <motion.div
                        className="absolute inset-0 w-full h-full flex flex-col items-center justify-start px-6 py-20 sm:px-10 sm:py-24 bg-[#0c0c11] overflow-y-auto overflow-x-hidden"
                        style={{ backfaceVisibility: 'hidden', rotateY: 180 }}
                        animate={{ rotateY: isFlipped ? 0 : -180 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="w-full max-w-xl flex flex-col justify-center my-auto pb-32 mx-auto min-h-0 shrink-0">
                            <div className="text-white/90 text-left text-balance mb-12 px-2 sm:px-0">
                                <ReactMarkdown
                                    components={{
                                        p: ({ children }) => <p className={`${answerSize(card.back)} mb-6 leading-[1.6]`}>{children}</p>,
                                        ul: ({ children }) => <ul className="list-disc pl-6 mb-8 space-y-5 text-white/90 text-[20px] sm:text-[24px] leading-[1.6] marker:text-emerald-500">{children}</ul>,
                                        li: ({ children }) => <li className="pl-2">{children}</li>,
                                        strong: ({ children }) => <strong className="text-emerald-400 font-bold drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]">{children}</strong>,
                                    }}
                                >
                                    {card.back}
                                </ReactMarkdown>
                            </div>

                            {/* Minimalist Add-ons (Progressive Disclosure) */}
                            {(!showDeepDive && (card.firstPrinciples || card.explanation || card.mainsPoint || card.topperTrick || card.currentAffairs)) && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowDeepDive(true); }}
                                    className="mt-2 mx-auto w-max px-6 py-3 rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-bold uppercase tracking-widest flex items-center gap-3 backdrop-blur-md"
                                >
                                    <span>Deep Dive</span>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                                </button>
                            )}

                            {showDeepDive && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-8 mt-4 border-t border-white/10 pt-8"
                                >
                                    {card.topperTrick && (
                                        <div className="border-l-[3px] border-purple-500/40 pl-5 py-2">
                                            <h4 className="text-purple-400 text-[10px] uppercase tracking-[0.25em] font-extrabold mb-2">Memory Trick</h4>
                                            <p className="text-white/80 text-[16px] sm:text-[18px] leading-[1.6] tracking-tight">{card.topperTrick}</p>
                                        </div>
                                    )}
                                    {card.mainsPoint && (
                                        <div className="border-l-[3px] border-amber-500/40 pl-5 py-2">
                                            <h4 className="text-amber-400 text-[10px] uppercase tracking-[0.25em] font-extrabold mb-2">Mains Context</h4>
                                            <p className="text-white/80 text-[16px] sm:text-[18px] leading-[1.6] tracking-tight">{card.mainsPoint}</p>
                                        </div>
                                    )}
                                    {card.firstPrinciples && (
                                        <div className="border-l-[3px] border-white/10 pl-5 py-2">
                                            <h4 className="text-[10px] text-white/40 uppercase tracking-[0.25em] font-extrabold mb-2">First Principles</h4>
                                            <p className="text-white/70 text-[16px] sm:text-[18px] leading-[1.6] tracking-tight">{card.firstPrinciples}</p>
                                        </div>
                                    )}
                                    {card.explanation && !card.firstPrinciples && (
                                        <div className="border-l-[3px] border-blue-500/40 pl-5 py-2">
                                            <h4 className="text-[10px] text-blue-400 uppercase tracking-[0.25em] font-extrabold mb-2">Logic / 'Kyun'</h4>
                                            <p className="text-white/80 text-[16px] sm:text-[18px] leading-[1.6] tracking-tight">{card.explanation}</p>
                                        </div>
                                    )}
                                    {/* Live Synapse */}
                                    {card.currentAffairs && (
                                        <div className="border-l-[3px] border-emerald-500/40 pl-5 py-2">
                                            <h4 className="text-emerald-400 text-[10px] uppercase tracking-[0.25em] font-extrabold mb-2 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Live Synapse
                                            </h4>
                                            <p className="text-emerald-50/80 text-[16px] sm:text-[18px] leading-[1.6] tracking-tight">{card.currentAffairs}</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* AI Chat block */}
                            {showDoubtChat && (
                                <div className="mt-8 pt-8 border-t border-white/10 w-full" onClick={e => e.stopPropagation()}>
                                    <h4 className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold mb-4">Oracle Mentor</h4>
                                    {aiResponse ? (
                                        <p className="text-white/90 text-sm leading-relaxed whitespace-pre-line">{aiResponse}</p>
                                    ) : (
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                placeholder="Ask anything..."
                                                value={doubtQuestion}
                                                onChange={e => setDoubtQuestion(e.target.value)}
                                                className="flex-1 bg-transparent border-b border-white/20 pb-2 text-lg text-white font-medium focus:outline-none focus:border-white transition-colors"
                                                autoFocus
                                            />
                                            <button
                                                onClick={async () => {
                                                    if (!doubtQuestion) return;
                                                    setIsAskingAI(true);
                                                    const res = await askLiveAI(card.id, doubtQuestion);
                                                    setAiResponse(res.error || res.answer);
                                                    setIsAskingAI(false);
                                                }}
                                                disabled={isAskingAI}
                                                className="text-white font-bold tracking-widest uppercase text-xs disabled:opacity-50"
                                            >
                                                {isAskingAI ? '...' : 'Send'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Minimalist Bottom Action Bar */}
                        {card.type !== CardType.MCQ && !hasAnswered && (
                            <div className="absolute bottom-8 left-6 right-6 flex items-center justify-center gap-2 sm:gap-4 z-50">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowRootCause(true); }}
                                    className="w-14 h-14 rounded-full border border-white/10 bg-black/50 backdrop-blur-xl flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all font-light text-xl"
                                >
                                    ✕
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleAction(true); }}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-black flex items-center justify-center font-bold tracking-tight text-xl transition-transform hover:scale-105 active:scale-95"
                                >
                                    ✓
                                </button>
                            </div>
                        )}

                        {showRootCause && !hasAnswered && card.type !== CardType.MCQ && (
                            <div className="absolute bottom-10 left-6 right-6 flex flex-col gap-3 max-w-xs mx-auto z-50">
                                <button onClick={(e) => { e.stopPropagation(); handleAction(false, '🧠 Concept Gap'); }} className="w-full py-4 border border-white/20 rounded-full text-white text-sm font-semibold tracking-wide hover:bg-white/10 transition-colors bg-black/50 backdrop-blur-md">Concept Gap</button>
                                <button onClick={(e) => { e.stopPropagation(); handleAction(false, '📝 Fact Slip'); }} className="w-full py-4 border border-white/20 rounded-full text-white text-sm font-semibold tracking-wide hover:bg-white/10 transition-colors bg-black/50 backdrop-blur-md">Fact Slip</button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
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

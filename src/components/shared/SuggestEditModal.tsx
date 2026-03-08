'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Suggest Edit Modal
// Bottom sheet for crowdsourced card editing
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitSuggestion } from '@/app/actions/learner';

interface SuggestEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    cardId: string;
    originalFront: string;
    originalBack: string;
}

export default function SuggestEditModal({ isOpen, onClose, cardId, originalFront, originalBack }: SuggestEditModalProps) {
    const [front, setFront] = useState(originalFront);
    const [back, setBack] = useState(originalBack);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setResult(null);

        try {
            const res = await submitSuggestion({
                cardId,
                originalFront,
                originalBack,
                suggestedFront: front,
                suggestedBack: back,
            });

            if (res.success) {
                const msg = res.aiApproved
                    ? `✅ AI approved! Sent for admin review. Reason: ${res.aiReason}`
                    : `📝 Suggestion saved. ${res.aiReason ? `AI: ${res.aiReason}` : 'Pending review.'}`;
                setResult({ type: 'success', message: msg });
                setTimeout(() => { onClose(); setResult(null); }, 3000);
            } else {
                setResult({ type: 'error', message: res.error || 'Failed to submit' });
            }
        } catch {
            setResult({ type: 'error', message: 'Network error. Try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasChanges = front !== originalFront || back !== originalBack;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        className="fixed inset-x-0 bottom-0 z-[70] max-h-[85vh] overflow-y-auto"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    >
                        <div className="bg-[#0f1320] border-t border-white/10 rounded-t-3xl p-5 sm:p-6">
                            {/* Drag Handle */}
                            <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-5" />

                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold text-white/90">✏️ Suggest Edit</h3>
                                <button onClick={onClose} className="text-white/30 hover:text-white/50 transition-colors text-sm">
                                    ✕
                                </button>
                            </div>

                            {/* Front */}
                            <div className="mb-4">
                                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                                    Question (Front)
                                </label>
                                <textarea
                                    value={front}
                                    onChange={e => setFront(e.target.value)}
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25"
                                />
                                <span className="text-[10px] text-white/15 mt-1 block text-right">{front.length} chars</span>
                            </div>

                            {/* Back */}
                            <div className="mb-5">
                                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                                    Answer (Back)
                                </label>
                                <textarea
                                    value={back}
                                    onChange={e => setBack(e.target.value)}
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25"
                                />
                                <span className="text-[10px] text-white/15 mt-1 block text-right">{back.length} chars</span>
                            </div>

                            {/* Feedback */}
                            <AnimatePresence>
                                {result && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`p-3 rounded-xl text-xs font-medium mb-4 ${result.type === 'success' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                            }`}
                                    >
                                        {result.message}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Submit */}
                            <motion.button
                                onClick={handleSubmit}
                                disabled={!hasChanges || isSubmitting}
                                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${!hasChanges || isSubmitting
                                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                    : 'text-white'
                                    }`}
                                style={hasChanges && !isSubmitting ? {
                                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                    boxShadow: '0 6px 20px rgba(124, 58, 237, 0.3)',
                                } : undefined}
                                whileTap={hasChanges && !isSubmitting ? { scale: 0.97 } : {}}
                            >
                                {isSubmitting ? '🔄 Validating with AI...' : '🚀 Submit Suggestion'}
                            </motion.button>

                            <p className="text-[10px] text-white/15 text-center mt-2">
                                AI will validate your edit before sending to admin
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

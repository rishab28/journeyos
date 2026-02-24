'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin News Synapse Intake
// Allows admin to paste daily news and auto-link to syllabus
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ingestNews, NewsIngestResult } from '@/app/actions/admin';
import { toast } from 'sonner';

export default function AdminNewsPage() {
    const [rawText, setRawText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<NewsIngestResult | null>(null);

    const handleIngest = async () => {
        if (!rawText.trim() || rawText.length < 50) {
            toast.error('Please paste a substantial amount of text (at least 50 chars).');
            return;
        }

        setIsProcessing(true);
        setResult(null);
        toast.loading('Initializing Synapse Engine...', { id: 'news-ingest' });

        try {
            const tempResult = await ingestNews(rawText);

            if (tempResult.success) {
                toast.success(`Synapse Link Complete: ${tempResult.eventsProcessed} events found, ${tempResult.linksCreated} cards interlinked.`, { id: 'news-ingest' });
                setResult(tempResult);
                setRawText('');
            } else {
                toast.error(tempResult.error || 'Failed to process news.', { id: 'news-ingest' });
            }
        } catch (err: any) {
            toast.error(err.message || 'An unexpected error occurred.', { id: 'news-ingest' });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 font-sans pb-32">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-widest text-emerald-400 mb-2 font-outfit">
                            Live Synapse Engine
                        </h1>
                        <p className="text-white/40 text-sm font-medium">Paste daily editorial/news to auto-link with static syllabus cards.</p>
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-6 sm:p-8 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Raw Source Text</label>
                        <span className="text-[10px] text-white/30 uppercase tracking-widest">{rawText.length} chars</span>
                    </div>
                    <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="Paste The Hindu editorial, Indian Express explainer, or daily news brief here..."
                        className="w-full h-64 bg-black/40 border border-white/5 rounded-2xl p-6 text-white text-sm leading-loose focus:outline-none focus:border-emerald-500/30 transition-colors font-serif resize-none"
                    />
                    <div className="mt-6 flex justify-end">
                        <motion.button
                            onClick={handleIngest}
                            disabled={isProcessing || !rawText.trim()}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] text-xs px-8 py-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isProcessing ? 'Synthesizing...' : 'Ignite Synapse'}
                        </motion.button>
                    </div>
                </div>

                {/* Results Area */}
                <AnimatePresence>
                    {result && result.success && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-emerald-500/[0.02] border border-emerald-500/20 rounded-[2rem] p-6 sm:p-8 backdrop-blur-xl"
                        >
                            <h2 className="text-lg font-bold text-emerald-400 mb-6 flex items-center gap-3">
                                <span className="text-2xl">⚡</span> Synapse Network Expanded
                            </h2>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-black/50 p-6 rounded-2xl border border-white/5 text-center">
                                    <div className="text-4xl font-black text-white mb-2">{result.eventsProcessed}</div>
                                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Events Extracted</div>
                                </div>
                                <div className="bg-black/50 p-6 rounded-2xl border border-white/5 text-center">
                                    <div className="text-4xl font-black text-emerald-400 mb-2">{result.linksCreated}</div>
                                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Cards Interlinked</div>
                                </div>
                            </div>

                            {result.linkedCards.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-4 border-b border-white/10 pb-2">New Connections Formed</h3>
                                    <ul className="space-y-3">
                                        {result.linkedCards.map((link, idx) => (
                                            <li key={idx} className="flex flex-col sm:flex-row gap-2 sm:gap-6 bg-white/[0.02] p-4 rounded-xl border border-white/[0.05]">
                                                <span className="text-emerald-400 font-bold text-sm shrink-0 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    {link.event}
                                                </span>
                                                <span className="text-white/60 text-sm hidden sm:block">→</span>
                                                <span className="text-white/80 text-sm">{link.title}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

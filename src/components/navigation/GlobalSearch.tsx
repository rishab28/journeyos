'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Global Doubt Solver UI
// Handles RAG queries and synthesizes Rank-1 answers.
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { askGlobalAI } from '@/app/actions/core';
import ReactMarkdown from 'react-markdown';
import { StudyCard } from '@/types';

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ answer?: string, sources?: Partial<StudyCard & { similarity: number }>[], error?: string } | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || query.length < 5) return;

        setIsLoading(true);
        setResult(null);

        try {
            const res = await askGlobalAI(query);
            if (res.success) {
                setResult({ answer: res.answer, sources: res.sources });
            } else {
                setResult({ error: res.error });
            }
        } catch (error) {
            setResult({ error: 'Failed to connect to Global AI.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto my-6 relative z-50">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="relative group px-4">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500 mx-4"></div>
                <div className="relative bg-[#11131a] border border-white/10 rounded-2xl shadow-2xl p-2 flex items-center">
                    <span className="pl-3 pr-2 text-white/50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask the World-Class RAG anything..."
                        className="w-full bg-transparent text-white placeholder-white/30 outline-none px-2 py-2 text-sm"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || query.length < 5}
                        className="ml-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin h-3 w-3 border-2 border-white/20 border-t-white rounded-full" />
                                Processing
                            </>
                        ) : (
                            'Synthesize'
                        )}
                    </button>
                </div>
            </form>

            {/* Results Section */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mt-6 mx-4 bg-[#0f0f13] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden relative"
                    >
                        {result.error ? (
                            <div className="text-red-400 text-sm flex items-center gap-2">
                                <span className="text-lg">⚠️</span> {result.error}
                            </div>
                        ) : (
                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black ring-1 ring-indigo-500/30">
                                        R1
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white/90 uppercase tracking-widest">
                                            Rank-1 Synthesis
                                        </h3>
                                        <p className="text-[10px] text-emerald-400">Powered by Global Knowledge Retrieval</p>
                                    </div>
                                </div>

                                <div className="prose prose-invert prose-sm max-w-none text-white/80 leading-relaxed font-medium">
                                    <ReactMarkdown>{result.answer || ''}</ReactMarkdown>
                                </div>

                                {result.sources && result.sources.length > 0 && (
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                            Synthesized from {result.sources.length} Context Cards
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {result.sources.map((source, idx) => (
                                                <div key={source.id || idx} className="bg-[#1a1d24] border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-white/10 transition-colors cursor-pointer group">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                                    <span className="text-[10px] text-white/80 font-semibold truncate max-w-[150px]">
                                                        {source.subject} - {source.topic}
                                                    </span>
                                                    <span className="text-[9px] text-emerald-300/80 bg-emerald-500/10 px-1.5 py-0.5 rounded ml-1">
                                                        {Math.round((source.similarity || 0) * 100)}% Match
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

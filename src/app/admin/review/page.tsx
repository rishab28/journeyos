'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Batch Review Dashboard
// High-speed admin review table with batch approve/reject
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardStatus, Domain, Subject } from '@/types';
import { fetchReviewCards, batchApproveCards, rejectCards } from '@/app/actions/admin';

interface CardRow {
    id: string;
    type: string;
    domain: string;
    subject: string;
    topic: string;
    sub_topic: string | null;
    difficulty: string;
    status: string;
    front: string;
    back: string;
    exam_tags: string[];
    source_pdf: string | null;
    created_at: string;
}

export default function ReviewPage() {
    const [cards, setCards] = useState<CardRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState<CardStatus>(CardStatus.ADMIN_REVIEW);
    const [domainFilter, setDomainFilter] = useState<string>('');
    const [subjectFilter, setSubjectFilter] = useState<string>('');

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Batch action feedback
    const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const loadCards = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchReviewCards({
                status: statusFilter,
                domain: domainFilter || undefined,
                subject: subjectFilter || undefined,
                page,
                limit: 50,
            });
            if (result.error) {
                setError(result.error);
            }
            setCards(result.cards as unknown as CardRow[]);
            setTotal(result.total);
            setTotalPages(result.totalPages);
        } catch {
            setError('Failed to load cards');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, domainFilter, subjectFilter, page]);

    useEffect(() => { loadCards(); }, [loadCards]);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        if (selectedIds.size === cards.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(cards.map(c => c.id)));
        }
    };

    const handleBatchApprove = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;

        const result = await batchApproveCards(ids);
        if (result.success) {
            setActionResult({ type: 'success', message: `✅ ${result.count} cards approved & live!` });
            setSelectedIds(new Set());
            loadCards();
        } else {
            setActionResult({ type: 'error', message: result.error || 'Batch approve failed' });
        }
        setTimeout(() => setActionResult(null), 4000);
    };

    const handleBatchReject = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;

        const result = await rejectCards(ids);
        if (result.success) {
            setActionResult({ type: 'success', message: `🗑️ ${result.count} cards archived` });
            setSelectedIds(new Set());
            loadCards();
        } else {
            setActionResult({ type: 'error', message: result.error || 'Batch reject failed' });
        }
        setTimeout(() => setActionResult(null), 4000);
    };

    const statusTabs = [
        { val: CardStatus.ADMIN_REVIEW, label: 'Review', color: 'text-indigo-400' },
        { val: CardStatus.DRAFT, label: 'Drafts', color: 'text-white/50' },
        { val: CardStatus.COMMUNITY_REVIEW, label: 'Community', color: 'text-white/60' },
        { val: CardStatus.LIVE, label: 'Live', color: 'text-white' },
        { val: CardStatus.ARCHIVED, label: 'Archived', color: 'text-white/20' },
    ];

    return (
        <div className="space-y-5">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Review <span className="text-white/20">Dashboard</span></h1>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-2">
                        {total} nodes · Page {page}/{totalPages || 1}
                    </p>
                </div>

                {/* Batch Actions */}
                {selectedIds.size > 0 && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
                        <span className="text-xs text-white/40 mr-2">{selectedIds.size} selected</span>
                        <button
                            onClick={handleBatchApprove}
                            className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white transition-all shadow-lg shadow-indigo-500/20"
                        >
                            Propagate Intelligence
                        </button>
                        <button
                            onClick={handleBatchReject}
                            className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all"
                        >
                            Purge
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Status Tabs */}
            <div className="flex gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5">
                {statusTabs.map(tab => (
                    <button
                        key={tab.val}
                        onClick={() => { setStatusFilter(tab.val); setPage(1); setSelectedIds(new Set()); }}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${statusFilter === tab.val
                            ? `bg-white/10 ${tab.color}`
                            : 'text-white/25 hover:text-white/40'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <select
                    value={domainFilter}
                    onChange={e => { setDomainFilter(e.target.value); setPage(1); }}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 focus:outline-none appearance-none cursor-pointer"
                >
                    <option value="" className="bg-[#0b0e17]">All Domains</option>
                    {Object.values(Domain).map(d => (
                        <option key={d} value={d} className="bg-[#0b0e17]">{d}</option>
                    ))}
                </select>
                <select
                    value={subjectFilter}
                    onChange={e => { setSubjectFilter(e.target.value); setPage(1); }}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 focus:outline-none appearance-none cursor-pointer"
                >
                    <option value="" className="bg-[#0b0e17]">All Subjects</option>
                    {Object.values(Subject).map(s => (
                        <option key={s} value={s} className="bg-[#0b0e17]">{s}</option>
                    ))}
                </select>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {actionResult && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`p-3 rounded-xl text-sm font-medium ${actionResult.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                    >
                        {actionResult.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-2xl">⚙️</motion.span>
                </div>
            ) : error ? (
                <div className="text-center py-20">
                    <p className="text-sm text-rose-400/70">{error}</p>
                    <p className="text-xs text-white/20 mt-1">Check Supabase connection</p>
                </div>
            ) : cards.length === 0 ? (
                <div className="text-center py-20">
                    <span className="text-4xl opacity-10 block mb-3">📭</span>
                    <p className="text-sm text-white/20">No cards in &quot;{statusFilter}&quot; status</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="pb-2 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === cards.length && cards.length > 0}
                                        onChange={selectAll}
                                        className="rounded bg-white/10 border-white/20 accent-violet-500"
                                    />
                                </th>
                                <th className="pb-4 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Sect</th>
                                <th className="pb-4 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Subject</th>
                                <th className="pb-4 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Intelligence Node</th>
                                <th className="pb-4 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Intensity</th>
                                <th className="pb-4 text-left text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Context</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cards.map(card => (
                                <tr key={card.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                                    <td className="py-3 pr-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(card.id)}
                                            onChange={() => toggleSelect(card.id)}
                                            className="rounded bg-white/10 border-white/20 accent-violet-500"
                                        />
                                    </td>
                                    <td className="py-3 pr-3">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded leading-none ${card.type === 'MCQ' ? 'bg-indigo-500/10 text-indigo-400' :
                                            card.type === 'PYQ' ? 'bg-white/10 text-white' :
                                                'bg-white/5 text-white/40'
                                            }`}>
                                            {card.type}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-3">
                                        <span className="text-xs text-white/50">{card.subject}</span>
                                        {card.sub_topic && <span className="text-[10px] text-white/20 block">{card.sub_topic}</span>}
                                    </td>
                                    <td className="py-3 pr-3 max-w-sm">
                                        <button
                                            onClick={() => setExpandedId(expandedId === card.id ? null : card.id)}
                                            className="text-left"
                                        >
                                            <p className="text-xs text-white/60 line-clamp-1 group-hover:text-white/80 transition-colors">{card.front}</p>
                                        </button>
                                        <AnimatePresence>
                                            {expandedId === card.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mt-2 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                                                        <p className="text-[10px] uppercase text-white/20 mb-1 font-semibold">Answer</p>
                                                        <p className="text-xs text-white/40 whitespace-pre-line">{card.back}</p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </td>
                                    <td className="py-3 pr-3">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${card.difficulty === 'HARD' ? 'text-white' :
                                            card.difficulty === 'EASY' ? 'text-white/40' :
                                                'text-white/70'
                                            }`}>
                                            {card.difficulty}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-3">
                                        <div className="flex gap-1 flex-wrap">
                                            {(card.exam_tags || []).map((tag: string) => (
                                                <span key={tag} className="text-[9px] bg-white/5 text-white/25 px-1.5 py-0.5 rounded">{tag}</span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/40 disabled:opacity-20 hover:bg-white/10 transition-all"
                    >
                        ← Prev
                    </button>
                    <span className="text-xs text-white/30">
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/40 disabled:opacity-20 hover:bg-white/10 transition-all"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}

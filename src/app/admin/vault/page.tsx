'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin Intel Vault Browser
// Surgical Content Management & Repository Oversight
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Edit3,
    Trash2,
    CheckCircle2,
    Eye,
    Database,
    Tag,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Save,
    X
} from 'lucide-react';
import { browseCards, updateVaultCard, deleteVaultCard } from '@/app/actions/admin';
import { StudyCard, CardStatus, Subject, CardType } from '@/types';

export default function VaultBrowserPage() {
    const [cards, setCards] = useState<StudyCard[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [subject, setSubject] = useState<Subject | ''>('');
    const [status, setStatus] = useState<CardStatus | ''>('');
    const [isLoading, setIsLoading] = useState(true);
    const [editingCard, setEditingCard] = useState<StudyCard | null>(null);

    useEffect(() => {
        loadCards();
    }, [page, subject, status]);

    const loadCards = async () => {
        setIsLoading(true);
        const res = await browseCards({
            query: search,
            subject: subject || undefined,
            status: status || undefined,
            page,
            limit: 20
        });
        if (res.success && res.data) {
            setCards(res.data);
            setTotal(res.total);
        }
        setIsLoading(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadCards();
    };

    const handleSaveEdit = async () => {
        if (!editingCard) return;
        const res = await updateVaultCard(editingCard.id, editingCard);
        if (res.success) {
            setCards(cards.map(c => c.id === editingCard.id ? editingCard : c));
            setEditingCard(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to purge this intelligence node?')) return;
        const res = await deleteVaultCard(id);
        if (res.success) {
            setCards(cards.filter(c => c.id !== id));
            setTotal(total - 1);
        }
    };

    return (
        <div className="min-h-screen">
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Repository Control</span>
                    <h2 className="text-white/40 text-xs font-black uppercase tracking-widest">Global Intelligence Vault</h2>
                </div>
                <div className="flex justify-between items-end">
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Intel <span className="text-white/20">Browser</span></h1>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Nodes Indexed</p>
                        <p className="text-xl font-black text-white">{total.toLocaleString()}</p>
                    </div>
                </div>
            </header>

            {/* Tactical Search & Filters */}
            <div className="bg-[#0c0c0c] border border-white/10 rounded-3xl p-6 mb-8 flex flex-col md:flex-row gap-6">
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input
                        type="text"
                        placeholder="Search front, back, or topic..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                </form>
                <div className="flex gap-4">
                    <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value as Subject)}
                        className="bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-emerald-500/50"
                    >
                        <option value="">All Subjects</option>
                        {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as CardStatus)}
                        className="bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-emerald-500/50"
                    >
                        <option value="">All Status</option>
                        {Object.values(CardStatus).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                </div>
            </div>

            {/* Tactical Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="h-64 bg-white/5 border border-white/5 rounded-3xl animate-pulse" />
                    ))
                ) : cards.length === 0 ? (
                    <div className="col-span-full py-32 text-center opacity-30 flex flex-col items-center">
                        <Database size={48} className="mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest">No nodes found in the current sector.</p>
                    </div>
                ) : (
                    cards.map((card) => (
                        <div key={card.id} className="bg-[#0c0c0c] border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all flex flex-col justify-between group h-full">
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider ${card.status === CardStatus.LIVE ? 'bg-white/10 text-white border border-white/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                                        {card.status}
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingCard(card)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-white">
                                            <Edit3 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(card.id)} className="p-2 rounded-lg bg-rose-500/5 hover:bg-rose-500/20 transition-colors text-rose-500/40 hover:text-rose-500">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-white font-bold text-xs mb-3 line-clamp-2 leading-relaxed">{card.front}</h3>
                                <p className="text-white/40 text-[10px] leading-relaxed line-clamp-3 mb-6">{card.back}</p>
                            </div>
                            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest flex items-center gap-1">
                                    <Tag size={10} /> {card.subject}
                                </span>
                                <span className="text-[9px] font-black text-white/40 uppercase bg-white/5 px-2 py-0.5 rounded leading-none">{card.type}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            <div className="mt-12 flex items-center justify-center gap-6">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-3 rounded-full bg-white/5 border border-white/10 disabled:opacity-20 hover:bg-white/10 transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-xs font-black uppercase tracking-widest text-white/40">Page {page} of {Math.ceil(total / 20)}</span>
                <button
                    disabled={page >= Math.ceil(total / 20)}
                    onClick={() => setPage(page + 1)}
                    className="p-3 rounded-full bg-white/5 border border-white/10 disabled:opacity-20 hover:bg-white/10 transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Back to Base */}
            <div className="mt-24 relative z-10 flex justify-center">
                <button
                    onClick={() => window.history.back()}
                    className="group flex flex-col items-center gap-4 py-8 px-12 transition-all"
                >
                    <div className="w-16 h-1 w-full bg-white/5 rounded-full group-hover:bg-white/20 transition-all mb-4" />
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] group-hover:text-white transition-colors">Return to Strategic Deck</span>
                </button>
            </div>
        </div>
    );
}

'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin Individual Source Editor
// View, inline-edit, and delete specific cards tied to a PDF
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Supabase operations
import { createClient } from '@supabase/supabase-js';

// We fall back to client-side supabase for quick row edits in admin panel
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SourceEditorPage({ params }: { params: { source_id: string } }) {
    const filename = decodeURIComponent(params.source_id);
    const [cards, setCards] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState({ front: '', back: '', type: '' });

    useEffect(() => {
        loadCards();
    }, [filename]);

    const loadCards = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('cards')
            .select('*')
            .eq('source_pdf', filename)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setCards(data);
        }
        setIsLoading(false);
    };

    const handleDeleteCard = async (id: string) => {
        if (!confirm('Delete this flashcard permanently?')) return;

        const { error } = await supabase.from('cards').delete().eq('id', id);
        if (!error) {
            setCards(prev => prev.filter(c => c.id !== id));
        } else {
            alert('Error deleting card: ' + error.message);
        }
    };

    const startEditing = (card: any) => {
        setEditingId(card.id);
        setEditData({ front: card.front, back: card.back, type: card.type });
    };

    const saveEdit = async (id: string) => {
        const { error } = await supabase
            .from('cards')
            .update({
                front: editData.front,
                back: editData.back,
                type: editData.type,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (!error) {
            setCards(prev => prev.map(c => c.id === id ? { ...c, ...editData } : c));
            setEditingId(null);
        } else {
            alert('Error saving card: ' + error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Link href="/admin/sources">
                            <button className="text-white/40 hover:text-white transition-colors">← Back</button>
                        </Link>
                        <h1 className="text-2xl font-bold text-white/90 truncate max-w-[300px]" title={filename}>
                            {filename}
                        </h1>
                    </div>
                    <p className="text-sm text-white/40">Manage extracted flashcards for this specific source.</p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold font-mono">
                        {cards.length} Cards
                    </span>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-3xl opacity-50">
                        ⚙️
                    </motion.div>
                </div>
            ) : cards.length === 0 ? (
                <div className="p-12 text-center border border-white/5 rounded-3xl bg-black/20">
                    <p className="text-sm text-white/40">No cards found for this PDF.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {cards.map(card => (
                            <motion.div
                                key={card.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="p-5 bg-black/40 border border-white/5 rounded-2xl hover:border-white/10 transition-colors"
                            >
                                {editingId === card.id ? (
                                    <div className="space-y-3">
                                        <div className="flex gap-2 mb-2">
                                            {['FLASHCARD', 'MCQ', 'PYQ'].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setEditData(prev => ({ ...prev, type: t }))}
                                                    className={`px-3 py-1 text-xs font-bold rounded ${editData.type === t ? 'bg-violet-600/50 text-white' : 'bg-white/5 text-white/40'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest pl-1 mb-1 block">Front / Question</label>
                                            <textarea
                                                value={editData.front}
                                                onChange={e => setEditData(prev => ({ ...prev, front: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-violet-500/50 outline-none"
                                                rows={2}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest pl-1 mb-1 block">Back / Answer</label>
                                            <textarea
                                                value={editData.back}
                                                onChange={e => setEditData(prev => ({ ...prev, back: e.target.value }))}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-violet-500/50 outline-none"
                                                rows={4}
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => saveEdit(card.id)} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-bold hover:bg-emerald-500/30">Save Changes</button>
                                            <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-white/5 text-white/60 rounded-xl text-sm font-bold hover:bg-white/10">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                                        <div className="space-y-2 flex-1 w-full">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${card.type === 'MCQ' ? 'bg-blue-500/20 text-blue-400' :
                                                        card.type === 'PYQ' ? 'bg-orange-500/20 text-orange-400' :
                                                            'bg-violet-500/20 text-violet-400'
                                                    }`}>
                                                    {card.type}
                                                </span>
                                                <span className="text-[10px] text-white/20">ID: {card.id.split('-')[0]}</span>
                                            </div>
                                            <p className="text-sm font-medium text-white/90">{card.front}</p>
                                            <p className="text-xs text-white/50 bg-black/50 p-3 rounded-xl border border-white/[0.02]">
                                                {card.back}
                                            </p>
                                        </div>

                                        <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                            <button
                                                onClick={() => startEditing(card)}
                                                className="flex-1 sm:flex-none p-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCard(card.id)}
                                                className="flex-1 sm:flex-none p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-bold transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

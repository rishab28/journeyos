'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin Sources Manager
// View uploaded PDFs, track generated cards, and cascade delete
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// You will need to build the fetchPdfSources action
import { fetchPdfSources, deleteSourceCascade, PdfSource } from '@/app/actions/sourceManagement';

export default function SourcesPage() {
    const [sources, setSources] = useState<PdfSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSources();
    }, []);

    const loadSources = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetchPdfSources();
            if (res.success && res.data) {
                setSources(res.data);
            } else {
                setError(res.error || 'Failed to load sources');
            }
        } catch (err: any) {
            setError(err.message || 'Unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm(`Are you sure you want to delete ${filename} AND all its associated flashcards? This cannot be undone.`)) {
            return;
        }

        try {
            const res = await deleteSourceCascade(filename);
            if (res.success) {
                setSources(prev => prev.filter(s => s.id !== filename));
            } else {
                alert(`Error deleting: ${res.error}`);
            }
        } catch (err: any) {
            alert(`Error deleting: ${err.message}`);
        }
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes'
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-white/90">📚 Source Management</h1>
                    <p className="text-sm text-white/40 mt-1">Manage uploaded PDFs and their generated neural flashcards.</p>
                </div>
                <Link href="/admin/ingest">
                    <button className="px-4 py-2 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-xl text-sm font-bold hover:bg-violet-600/30 transition-colors">
                        + New Ingest
                    </button>
                </Link>
            </div>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-medium">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-3xl opacity-50">
                        ⚙️
                    </motion.div>
                </div>
            ) : sources.length === 0 ? (
                <div className="p-12 text-center border border-white/5 rounded-3xl bg-black/20">
                    <div className="text-4xl mb-4 opacity-50">📂</div>
                    <h3 className="text-lg font-bold text-white/80 mb-2">No Sources Uploaded</h3>
                    <p className="text-sm text-white/40 mb-6">You haven't uploaded any PDFs through the Smart Ingestor yet.</p>
                    <Link href="/admin/ingest">
                        <button className="px-6 py-3 bg-white/5 text-white/80 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors">
                            Go to Ingestor
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {sources.map(source => (
                            <motion.div
                                key={source.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="p-5 bg-black/40 border border-white/5 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:border-white/10 transition-colors"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">📄</span>
                                        <h3 className="text-base font-bold text-white/90 truncate max-w-[200px] sm:max-w-xs" title={source.name}>
                                            {source.name}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-white/40 font-medium ml-7">
                                        <span>{formatBytes(source.size)}</span>
                                        <span>•</span>
                                        <span>{formatDate(source.created_at)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                                        <p className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-wider mb-0.5">Cards Generated</p>
                                        <p className="text-lg font-black text-emerald-400">{source.cardCount}</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDelete(source.id)}
                                            className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition-colors" title="Delete Source & Cards"
                                        >
                                            🗑️
                                        </button>
                                        <Link href={`/admin/sources/${encodeURIComponent(source.id)}`}>
                                            <button className="p-3 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl transition-colors" title="Manage Cards">
                                                🛠️
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

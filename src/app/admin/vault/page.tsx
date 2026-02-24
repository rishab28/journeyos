'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPdfSources, deleteSourceCascade, updateSourceMetadata, PdfSource } from '@/app/actions/admin';

export default function IntelligenceVault() {
    const [sources, setSources] = useState<PdfSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<string | 'All'>('All');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        loadSources();
    }, []);

    const loadSources = async () => {
        setIsLoading(true);
        const res = await fetchPdfSources();
        if (res.success && res.data) {
            setSources(res.data);
        }
        setIsLoading(false);
    };

    const folders = useMemo(() => {
        const unique = Array.from(new Set(sources.map(s => s.folder || 'Uncategorized')));
        return ['All', ...unique];
    }, [sources]);

    const filteredSources = useMemo(() => {
        return sources.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFolder = selectedFolder === 'All' || s.folder === selectedFolder;
            return matchesSearch && matchesFolder;
        });
    }, [sources, searchQuery, selectedFolder]);

    const handleDelete = async (filename: string) => {
        if (!confirm('Are you absolutely sure? This will delete the PDF and ALL associated flashcards permanently.')) return;
        setDeletingId(filename);
        const res = await deleteSourceCascade(filename);
        if (res.success) {
            setSources(prev => prev.filter(s => s.id !== filename));
        } else {
            alert(`Error: ${res.error}`);
        }
        setDeletingId(null);
    };

    const handleMoveToFolder = async (filename: string, folderName: string) => {
        const res = await updateSourceMetadata(filename, { folder_name: folderName });
        if (res.success) {
            setSources(prev => prev.map(s => s.id === filename ? { ...s, folder: folderName } : s));
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 relative overflow-hidden">
            {/* 🎨 Luxury Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Header Section */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-20">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-1 h-12 bg-gradient-to-b from-emerald-500 to-transparent rounded-full" />
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-1">Intelligence Vault</h1>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Strategic Asset Management • Bio-Sync v2.0</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 bg-white/5 p-1 rounded-[2rem] border border-white/10 backdrop-blur-3xl"
                >
                    <div className="px-8 py-4 text-center">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Total Assets</p>
                        <p className="text-2xl font-black font-outfit">{sources.length}</p>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="px-8 py-4 text-center">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Knowledge Yield</p>
                        <p className="text-2xl font-black font-outfit text-[#00ffcc]">{sources.reduce((acc, s) => acc + s.cardCount, 0)}</p>
                    </div>
                </motion.div>
            </div>

            {/* Controls Deck */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
                <div className="lg:col-span-5 relative group">
                    <input
                        type="text"
                        placeholder="Scan for Intel..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] px-8 py-5 text-sm font-bold placeholder:text-white/10 focus:outline-none focus:border-white/20 transition-all focus:bg-white/[0.05]"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/40 transition-colors">🔍</div>
                </div>

                <div className="lg:col-span-7 flex gap-3 overflow-x-auto pb-4 scrollbar-none">
                    {folders.map(folder => (
                        <button
                            key={folder}
                            onClick={() => setSelectedFolder(folder)}
                            className={`px-8 py-5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap border ${selectedFolder === folder
                                ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                                : 'bg-white/[0.03] text-white/30 border-white/5 hover:border-white/20 hover:text-white'
                                }`}
                        >
                            {folder}
                        </button>
                    ))}
                </div>
            </div>

            {/* Intelligence Grid (Bento Style) */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-2 border-white/5 border-t-white rounded-full mb-6"
                    />
                    <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em] animate-pulse">Synchronizing Cryptographic Vault...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
                    <AnimatePresence mode="popLayout">
                        {filteredSources.map((source, i) => (
                            <motion.div
                                key={source.id}
                                layout
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.03 }}
                                className="group relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <div className="glass-card rounded-[2.5rem] p-8 border-white/5 flex flex-col h-full bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500">
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/5 flex items-center justify-center text-2xl">
                                            📜
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Status</span>
                                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-tighter border border-emerald-500/20">
                                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                                Active
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="mb-10 flex-1">
                                        <h3 className="text-xl font-black text-white tracking-tight mb-2 group-hover:text-[#00ffcc] transition-colors line-clamp-2">
                                            {source.displayName || source.name}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                                {formatSize(source.size)}
                                            </span>
                                            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                                VLD.{new Date(source.created_at).getFullYear()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Yield Progress */}
                                    <div className="mb-10">
                                        <div className="flex justify-between items-end mb-3">
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Knowledge Yield</p>
                                            <p className="text-xs font-black text-white">{source.cardCount} <span className="text-white/20 font-medium">Nodes</span></p>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((source.cardCount / 100) * 100, 100)}%` }}
                                                className="h-full bg-gradient-to-r from-[#00ffcc] to-emerald-500 rounded-full"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex items-center justify-between gap-4 pt-6 border-t border-white/5">
                                        <div className="flex gap-1 p-1 bg-black/40 rounded-xl border border-white/5">
                                            {['GS', 'Mains', 'PYQ'].map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => handleMoveToFolder(source.id, f)}
                                                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${source.folder === f ? 'bg-white/10 text-white shadow-lg' : 'text-white/20 hover:text-white/60'
                                                        }`}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => handleDelete(source.id)}
                                            disabled={deletingId === source.id}
                                            className="w-10 h-10 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-center text-rose-500/40 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all disabled:opacity-50"
                                        >
                                            {deletingId === source.id ? '...' : '✕'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

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

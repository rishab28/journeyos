'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSRSStore } from '@/store/srsStore';
import { Subject } from '@/types';

export default function CommandBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const availableFilters = useSRSStore((s) => s.availableFilters);
    const setFilters = useSRSStore((s) => s.setFilters);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const results = [
        ...availableFilters.subjects.map(s => ({ type: 'Subject', label: s, value: s })),
        ...availableFilters.chapters.map(c => ({ type: 'Chapter', label: c, value: c }))
    ].filter(r => r.label.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

    const handleSelect = (result: any) => {
        if (result.type === 'Subject') {
            setFilters({ subject: result.value as Subject, topic: null, chapter: null });
        } else {
            setFilters({ chapter: result.value });
        }
        setIsOpen(false);
        setQuery('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-md bg-black/60">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full max-w-xl bg-[#050508]/90 border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,1),0_0_40px_rgba(255,255,255,0.02)] overflow-hidden backdrop-blur-3xl"
                    >
                        <div className="flex items-center px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                            <svg className="w-4 h-4 text-white/40 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Teleport to Subject or Chapter..."
                                className="bg-transparent border-none outline-none text-white text-lg w-full placeholder:text-white/20"
                            />
                            <div className="flex gap-1 items-center">
                                <span className="text-[10px] font-bold text-white/30 border border-white/10 px-1.5 py-0.5 rounded leading-none uppercase">Esc</span>
                            </div>
                        </div>

                        <div className="p-2">
                            {results.length > 0 ? (
                                results.map((msg, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect(msg)}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-all text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border ${msg.type === 'Subject'
                                                ? 'bg-white/5 border-white/10 text-white/70'
                                                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                                }`}>
                                                {msg.type}
                                            </span>
                                            <span className="text-white/80 font-bold text-sm">{msg.label}</span>
                                        </div>
                                        <span className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em] border border-white/5 px-2 py-1 rounded bg-white/5">Select</span>
                                    </button>
                                ))
                            ) : (
                                <div className="px-5 py-8 text-center">
                                    <p className="text-white/20 text-sm font-medium">No results found for &quot;{query}&quot;</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-white/[0.02] px-5 py-2.5 flex items-center justify-between">
                            <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Mastermind Navigation Engine</span>
                            <div className="flex gap-3">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] text-white/10 font-black uppercase tracking-widest">Up/Down to navigate</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

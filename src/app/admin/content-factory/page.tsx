'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Subject } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle2, Factory } from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin Content Factory
// Generate high-yield flashcards autonomously via AI
// ═══════════════════════════════════════════════════════════

export default function ContentFactoryPage() {
    const [status, setStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});
    const [counts, setCounts] = useState<Record<string, number>>({});

    const handleSeed = async (subject: Subject) => {
        setStatus(prev => ({ ...prev, [subject]: 'loading' }));
        try {
            const res = await fetch('/api/admin/seed-cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject })
            });
            const data = await res.json();

            if (data.success) {
                setStatus(prev => ({ ...prev, [subject]: 'success' }));
                setCounts(prev => ({ ...prev, [subject]: (prev[subject] || 0) + data.count }));
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error(err);
            setStatus(prev => ({ ...prev, [subject]: 'error' }));
        }
    };

    const subjects = Object.values(Subject);

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12">
            <header className="max-w-4xl mx-auto flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                    <Link href="/admin" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                            <Factory className="text-indigo-500" />
                            Content <span className="text-white/30">Factory</span>
                        </h1>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] mt-1">Autonomous Quality Generation</p>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map(subject => {
                    const currentStatus = status[subject] || 'idle';
                    const count = counts[subject] || 0;

                    return (
                        <div key={subject} className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold">{subject}</h3>
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Session Yield: {count}</p>
                                </div>
                                {currentStatus === 'success' && <CheckCircle2 className="text-indigo-400" size={24} />}
                                {currentStatus === 'error' && <span className="text-white/20 text-xs font-black uppercase">Failed</span>}
                            </div>

                            <button
                                onClick={() => handleSeed(subject)}
                                disabled={currentStatus === 'loading'}
                                className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${currentStatus === 'loading' ? 'bg-white/5 text-white/30' :
                                    currentStatus === 'success' ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20' :
                                        'bg-white text-black hover:bg-gray-200'
                                    }`}
                            >
                                {currentStatus === 'loading' ? (
                                    <><Loader2 size={14} className="animate-spin" /> Generating AI Cards...</>
                                ) : currentStatus === 'success' ? (
                                    <>Generate More</>
                                ) : (
                                    <>Trigger Generation</>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </main >
    );
}

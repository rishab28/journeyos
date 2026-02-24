'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Smart Admin Ingestor
// Client-side PDF text extraction → Server AI → Draft cards
// ═══════════════════════════════════════════════════════════

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Domain, Subject } from '@/types';
import { registerSource, uploadPdfToStorage } from '@/app/actions/admin';
import type { IngestResult } from '@/types';
import { useRouter } from 'next/navigation';

const EXAM_TAG_OPTIONS = ['UPSC', 'HAS', 'HPAS', 'State PSC', 'SSC', 'Banking', 'Railway'];

const TOPIC_SUGGESTIONS: Record<string, string[]> = {
    'Polity': ['Fundamental Rights', 'DPSP', 'Parliament', 'Judiciary', 'Constitutional Amendments', 'Local Government', 'Emergency Provisions'],
    'History': ['Ancient India', 'Medieval India', 'Modern India', 'Indian National Movement', 'World History', 'Art & Culture'],
    'Geography': ['Indian Monsoon', 'Indian Rivers', 'Climatology', 'Geomorphology', 'Oceanography', 'Economic Geography'],
    'Economy': ['Banking & Finance', 'Monetary Policy', 'Fiscal Policy', 'International Trade', 'Indian Economy', 'Budget'],
    'Science': ['Physics', 'Chemistry', 'Biology', 'Space Technology', 'Nuclear Technology', 'Biotechnology'],
    'Environment': ['Biodiversity', 'Climate Change', 'Pollution', 'Conservation', 'Environmental Laws', 'Ecology'],
    'Current Affairs': ['National', 'International', 'Economy', 'Science & Tech', 'Sports', 'Awards'],
    'Ethics': ['Ethics in Governance', 'Attitude', 'Aptitude', 'Emotional Intelligence', 'Case Studies'],
    'Mathematics': ['Algebra', 'Geometry', 'Arithmetic', 'Data Interpretation', 'Statistics'],
    'Reasoning': ['Logical Reasoning', 'Analytical Reasoning', 'Verbal Reasoning', 'Non-Verbal'],
    'PYQs': ['Prelims GS-1', 'Prelims GS-2 (CSAT)', 'GS Mains Paper 1', 'GS Mains Paper 2', 'GS Mains Paper 3', 'GS Mains Paper 4', 'Essay'],
    'UPSC Notifications': ['Exam Dates', 'Syllabus Changes', 'Eligibility Criteria', 'Application Process', 'Interview Schedule', 'Results'],
};

type ProcessingStep = 'idle' | 'uploading' | 'registering' | 'done';

export default function IngestPage() {
    const router = useRouter();
    const [domain, setDomain] = useState<Domain>(Domain.GS);
    const [subject, setSubject] = useState<string>('');
    const [topic, setTopic] = useState<string>('');
    const [customTopic, setCustomTopic] = useState('');
    const [examTags, setExamTags] = useState<string[]>(['UPSC']);
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [step, setStep] = useState<ProcessingStep>('idle');
    const [queueProgress, setQueueProgress] = useState({ current: 0, total: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isProcessing = step !== 'idle' && step !== 'done';

    const toggleExamTag = (tag: string) => {
        setExamTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
        if (droppedFiles.length > 0) {
            setFiles(prev => [...prev, ...droppedFiles]);
        }
    };

    const handleSubmit = async () => {
        if (files.length === 0 || !subject) return;

        setQueueProgress({ current: 0, total: files.length });
        let errors: string[] = [];

        for (let i = 0; i < files.length; i++) {
            const currentFile = files[i];
            setQueueProgress({ current: i + 1, total: files.length });

            // ── Step 1: Upload raw PDF to Supabase Storage ──
            setStep('uploading');
            const formData = new FormData();
            formData.append('file', currentFile);

            const uploadRes = await uploadPdfToStorage(formData);
            if (!uploadRes.success || !uploadRes.filename) {
                errors.push(`Failed to upload ${currentFile.name}: ${uploadRes.error}`);
                continue;
            }

            // ── Step 2: Register in source_metadata ──
            setStep('registering');
            const finalTopic = topic === '__custom__' ? customTopic : topic;
            const regRes = await registerSource(uploadRes.filename, {
                display_name: currentFile.name,
                domain,
                subject,
                folder_name: finalTopic
            });

            if (!regRes.success) {
                errors.push(`Failed to register ${currentFile.name}: ${regRes.error}`);
            }
        }

        if (errors.length > 0) {
            alert(errors.join('\n'));
            setStep('idle');
            return;
        }

        setStep('done');
    };

    const topics = subject ? (TOPIC_SUGGESTIONS[subject] || []) : [];
    const finalTopic = topic === '__custom__' ? customTopic : topic;

    return (
        <div className="space-y-12 max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Smart <span className="text-white/20 italic font-medium">Ingestor</span></h1>
                    <p className="text-sm text-white/40 mt-3 font-medium italic">High-fidelity content generation via Gemini 1.5 Flash</p>
                </div>
                <div className="flex items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Neural Link Active</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* ── Left: Strategic Mission Control ── */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="glass-card rounded-[2.5rem] p-10 space-y-8">
                        {/* Domain & Subject Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4 pl-1">Target Domain</label>
                                <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
                                    {Object.values(Domain).map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setDomain(d)}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${domain === d
                                                ? 'bg-white/10 text-white shadow-xl border border-white/10'
                                                : 'text-white/20 hover:text-white/40'
                                                }`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4 pl-1">Category Subject</label>
                                <select
                                    value={subject}
                                    onChange={e => { setSubject(e.target.value); setTopic(''); }}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-white/80 focus:outline-none focus:border-white/20 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-black">Select Subject...</option>
                                    {Object.values(Subject).map(s => (
                                        <option key={s} value={s} className="bg-black">{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Topic Selection */}
                        <div>
                            <label className="block text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4 pl-1">Strategic Topic</label>
                            {topics.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {topics.map(t => (
                                            <button
                                                key={t}
                                                onClick={() => { setTopic(t); setCustomTopic(''); }}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${topic === t
                                                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                                    : 'bg-white/5 border border-white/5 text-white/30 hover:bg-white/10'
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setTopic('__custom__')}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${topic === '__custom__'
                                                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                                                : 'bg-white/5 border border-white/5 text-white/20 hover:bg-white/10'
                                                }`}
                                        >
                                            + Custom
                                        </button>
                                    </div>
                                    {topic === '__custom__' && (
                                        <motion.input
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            type="text"
                                            value={customTopic}
                                            onChange={e => setCustomTopic(e.target.value)}
                                            placeholder="Specify mission topic..."
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3 text-sm text-white/80 focus:outline-none focus:border-white/20"
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="bg-black/20 border border-white/5 rounded-2xl p-4 text-center">
                                    <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest italic">Awaiting Subject Definition</p>
                                </div>
                            )}
                        </div>

                        {/* File Upload Zone */}
                        <div>
                            <label className="block text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4 pl-1">Source Intelligence (PDF)</label>
                            <div
                                onDrop={handleDrop}
                                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative min-h-[180px] p-8 rounded-[2rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${isDragging
                                    ? 'border-violet-500/40 bg-violet-500/5'
                                    : files.length > 0
                                        ? 'border-white/20 bg-white/[0.02]'
                                        : 'border-white/5 bg-black/20 hover:border-white/10'
                                    }`}
                            >
                                <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={e => {
                                    if (e.target.files?.length) {
                                        setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                    }
                                }} className="hidden" />

                                {files.length > 0 ? (
                                    <div className="w-full space-y-3">
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Payload: {files.length} Modules</span>
                                            <button onClick={(e) => { e.stopPropagation(); setFiles([]); }} className="text-[9px] font-bold text-white/20 hover:text-rose-400 uppercase tracking-widest transition-colors">Abort All</button>
                                        </div>
                                        <div className="max-h-32 overflow-y-auto w-full pr-2 space-y-2 no-scrollbar">
                                            {files.map((f, i) => (
                                                <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                                    <span className="text-xs font-medium text-white/60 truncate w-3/4">📄 {f.name}</span>
                                                    <span className="text-[9px] font-bold text-white/20 uppercase">{(f.size / 1024 / 1024).toFixed(1)} Mb</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <span className="text-4xl block mb-4 opacity-10">💎</span>
                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Drop Operational Data or Click to Select</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Execute Action */}
                        <motion.button
                            onClick={handleSubmit}
                            disabled={files.length === 0 || !subject || !finalTopic || isProcessing}
                            whileHover={!isProcessing ? { scale: 1.01 } : {}}
                            whileTap={!isProcessing ? { scale: 0.98 } : {}}
                            className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all relative overflow-hidden ${isProcessing
                                ? 'bg-white/5 text-white/20 cursor-wait'
                                : files.length === 0 || !subject || !finalTopic
                                    ? 'bg-white/5 text-white/10'
                                    : 'text-white'
                                }`}
                        >
                            <div className="relative z-10 flex items-center justify-center gap-4">
                                {isProcessing ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>Initialising Cycle ({queueProgress.current}/{queueProgress.total})</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-lg">🔥</span>
                                        <span>Execute Extraction Mission</span>
                                    </>
                                )}
                            </div>
                            {!isProcessing && files.length > 0 && subject && finalTopic && (
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-90" />
                            )}
                        </motion.button>
                    </div>
                </div>

                {/* ── Right: Mission Feedback ── */}
                <div className="lg:col-span-12 xl:col-span-5">
                    <AnimatePresence mode="wait">
                        {step === 'done' ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <div className="p-8 rounded-[2rem] border bg-emerald-500/5 border-emerald-500/10 text-center">
                                    <span className="text-5xl block mb-6">🛰️</span>
                                    <h2 className="text-2xl font-black text-white mb-2">Intelligence Registered</h2>
                                    <p className="text-sm text-white/40 mb-8 font-medium italic">
                                        Mission data has been uploaded and secured. The Neural Processor is now awaiting execution.
                                    </p>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => router.push('/admin/processor')}
                                            className="w-full py-4 rounded-xl bg-[#00ffcc] text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,255,204,0.3)] hover:scale-[1.02] transition-all"
                                        >
                                            Go to Neural Processor 🧠
                                        </button>
                                        <button
                                            onClick={() => { setFiles([]); setStep('idle'); }}
                                            className="w-full py-4 rounded-xl bg-white/5 text-white/40 font-black text-[10px] uppercase tracking-[0.2em] border border-white/5 hover:bg-white/10 transition-all"
                                        >
                                            Register More Sources
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : !isProcessing ? (
                            <div className="h-[400px] glass-card rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center opacity-40">
                                <span className="text-5xl mb-6">🏛️</span>
                                <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-2">Awaiting Mission</h3>
                                <p className="text-[10px] font-medium text-white/40 italic leading-relaxed">
                                    Select target parameters and drop source intelligence to begin the capture sequence.
                                </p>
                            </div>
                        ) : (
                            <div className="h-[400px] glass-card rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                    className="text-6xl mb-8 opacity-20"
                                >
                                    {step === 'uploading' ? '🛰️' : '📡'}
                                </motion.div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-[0.4em] mb-4">
                                    {step === 'uploading' ? 'Securing Payload' : 'Registering Synapse'}
                                </h3>
                                <div className="w-full max-w-[200px] h-1 bg-white/5 rounded-full overflow-hidden mb-4">
                                    <motion.div
                                        className="h-full bg-[#00ffcc]"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${(queueProgress.current / queueProgress.total) * 100}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                                    Module {queueProgress.current} of {queueProgress.total}
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Neural Ingestor (NotebookLM Bridge)
// Surgical Intelligence Extraction & Rapid Feed Sync
// ═══════════════════════════════════════════════════════════

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap,
    Link as LinkIcon,
    FileText,
    Upload,
    AlertTriangle,
    Loader2,
    CheckCircle2,
    Binary,
    Cpu,
    X
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Subject, Domain } from '@/types';

export default function NeuralIngestorPage() {
    const [source, setSource] = useState('');
    const [isFile, setIsFile] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [subject, setSubject] = useState<Subject>(Subject.HISTORY);
    const [domain, setDomain] = useState<Domain>(Domain.GS);
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'cloning' | 'analyzing' | 'syncing' | 'complete' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<{ cardsCreated: number; notebookId: string } | null>(null);

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
        if (droppedFiles.length > 0) {
            setSelectedFile(droppedFiles[0]);
        }
    };

    const handleIngest = async () => {
        if (!isFile && !source) return;
        if (isFile && !selectedFile) return;
        setIsLoading(true);
        setStatus('cloning');
        setError(null);

        try {
            setTimeout(() => setStatus('analyzing'), 2000);
            setTimeout(() => setStatus('syncing'), 8000);

            let response;

            if (isFile && selectedFile) {
                // Upload file via FormData
                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('subject', subject);
                formData.append('domain', domain);
                formData.append('topic', topic);
                formData.append('examTags', JSON.stringify(['UPSC']));

                response = await fetch('/api/intelligence/ingest', {
                    method: 'POST',
                    body: formData,
                });
            } else {
                response = await fetch('/api/intelligence/ingest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ source, isFile: false, subject, domain, topic, examTags: ['UPSC'] })
                });
            }

            const data = await response.json();

            if (!data.success) {
                setStatus('error');
                setError(data.message || data.error);
            } else {
                setStatus('complete');
                setStats({ cardsCreated: data.cardsCreated, notebookId: data.notebookId });
                setSource('');
                setSelectedFile(null);
                setTopic('');
            }
        } catch (err: any) {
            setStatus('error');
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 max-w-5xl mx-auto">
            {/* Header Area */}
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                        <Cpu className="text-indigo-400" size={18} />
                    </div>
                    <span className="font-caps text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">Intelligence Ingestor</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter uppercase text-white mb-2">Neural <span className="text-indigo-500">Bridge</span></h1>
                <p className="text-white/40 font-medium max-w-xl leading-relaxed"> Programmatic extraction of surgical intelligence from external repositories using the NotebookLM Nexus Protocol. </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Configuration Card */}
                <div className="lg:col-span-2 space-y-6">
                    <GlassCard className="p-8 border-white/10" variant="panel">
                        <div className="space-y-8">
                            {/* Mode Toggle */}
                            <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 w-fit">
                                <button
                                    onClick={() => setIsFile(false)}
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${!isFile ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-white/20 hover:text-white/40'}`}
                                ><LinkIcon size={14} /> URL</button>
                                <button
                                    onClick={() => setIsFile(true)}
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isFile ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-white/20 hover:text-white/40'}`}
                                ><FileText size={14} /> File</button>
                            </div>

                            {/* Source Input — URL or File Picker */}
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">
                                    {isFile ? 'Drop or Select PDF' : 'Target Intel Source (URL)'}
                                </label>

                                {isFile ? (
                                    /* ── Drag-and-Drop File Picker ── */
                                    <div
                                        onDrop={handleFileDrop}
                                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`relative min-h-[160px] p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${isDragging
                                                ? 'border-indigo-500/40 bg-indigo-500/5'
                                                : selectedFile
                                                    ? 'border-white/20 bg-white/[0.02]'
                                                    : 'border-white/5 bg-black/20 hover:border-white/10'
                                            }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf"
                                            onChange={e => {
                                                if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                                            }}
                                            className="hidden"
                                        />

                                        {selectedFile ? (
                                            <div className="w-full flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                                        <FileText className="text-indigo-400" size={22} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white truncate max-w-[280px]">{selectedFile.name}</p>
                                                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 transition-colors text-white/20 hover:text-rose-400"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <Upload className="mx-auto mb-3 text-white/10" size={36} />
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                                                    Drop PDF Here or Click to Browse
                                                </p>
                                                <p className="text-[9px] text-white/10 mt-1">Supports .pdf files</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* ── URL Text Input ── */
                                    <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20">
                                            <LinkIcon size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            value={source}
                                            onChange={(e) => setSource(e.target.value)}
                                            placeholder="https://en.wikipedia.org/wiki/..."
                                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white font-medium focus:outline-none focus:border-indigo-500/50 transition-all"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Classification Metadata */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">Surgical Subject</label>
                                    <select
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value as Subject)}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-[11px] font-bold text-white uppercase tracking-wider focus:outline-none focus:border-indigo-500/50 transition-all"
                                    >
                                        {Object.values(Subject).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">Specific Topic Cluster</label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="E.g. Mughal Architecture"
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white font-medium focus:outline-none focus:border-indigo-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handleIngest}
                                disabled={isLoading || (isFile ? !selectedFile : !source)}
                                className="w-full py-6 rounded-2xl bg-white text-black font-black uppercase tracking-[0.3em] text-[12px] flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                                {isLoading ? 'Extracting Intel...' : 'PULSE NEURAL INGESTION'}
                            </button>
                        </div>
                    </GlassCard>

                    {/* Status Feedback Area */}
                    <AnimatePresence>
                        {status !== 'idle' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <GlassCard className={`p-8 border-l-4 ${status === 'complete' ? 'border-l-emerald-500' :
                                    status === 'error' ? 'border-l-rose-500' :
                                        'border-l-indigo-500'
                                    }`} variant="panel">
                                    <div className="flex items-start gap-6">
                                        <div className="flex-1">
                                            <h3 className="text-white font-black uppercase tracking-widest text-sm mb-2">
                                                {status === 'complete' ? 'Extraction Successful' :
                                                    status === 'error' ? 'Extraction Failed' :
                                                        'Neural Sync in Progress'}
                                            </h3>

                                            {status === 'complete' && stats && (
                                                <div className="space-y-4">
                                                    <p className="text-white/40 text-[11px] font-medium leading-relaxed">
                                                        NotebookLM successfully parsed the repository and generated structured study nodes.
                                                    </p>
                                                    <div className="flex gap-4">
                                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                                                            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Nodes Created</p>
                                                            <p className="text-xl font-black text-white">{stats.cardsCreated}</p>
                                                        </div>
                                                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3">
                                                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Notebook ID</p>
                                                            <p className="text-xs font-mono text-white/60">{stats.notebookId.substring(0, 16)}...</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {status === 'error' && (
                                                <div className="space-y-4">
                                                    <p className="text-rose-400/80 text-[11px] font-bold leading-relaxed flex items-center gap-2">
                                                        <AlertTriangle size={14} /> {error}
                                                    </p>
                                                    {error === 'AUTHENTICATION_REQUIRED' && (
                                                        <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4">
                                                            <p className="text-[10px] text-white/60 font-medium">
                                                                NotebookLM requires a manual login for the first session. Please run:
                                                                <br />
                                                                <code className="bg-black/40 px-2 py-1 rounded mt-2 inline-block text-rose-300 font-mono">notebooklm login</code>
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {isLoading && (
                                                <div className="space-y-6 mt-4">
                                                    <div className="flex items-center justify-between text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                                                        <span>{status.toUpperCase()}</span>
                                                        <span>{status === 'cloning' ? '25%' : status === 'analyzing' ? '65%' : '90%'}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-indigo-500 shadow-[0_0_15px_#6366f1]"
                                                            initial={{ width: '0%' }}
                                                            animate={{
                                                                width: status === 'cloning' ? '25%' :
                                                                    status === 'analyzing' ? '65%' :
                                                                        '90%'
                                                            }}
                                                            transition={{ duration: 1 }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {status === 'complete' ? <CheckCircle2 className="text-emerald-500 shrink-0" size={32} /> :
                                            status === 'error' ? <AlertTriangle className="text-rose-500 shrink-0" size={32} /> :
                                                <Loader2 className="animate-spin text-indigo-500 shrink-0" size={32} />}
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Lateral Intel: System Status */}
                <div className="space-y-6">
                    <GlassCard className="p-6 border-white/5" variant="default">
                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                            <Binary size={14} /> Nexus Protocol Status
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-white/60">NotebookLM Link</span>
                                <span className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> Active
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-white/60">Extraction Fidelity</span>
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">High (98%)</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-white/60">Sync Latency</span>
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">2.1s</span>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 border-white/5 bg-indigo-500/[0.02]" variant="default">
                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Ingestion Tips</h4>
                        <ul className="space-y-3">
                            <li className="text-[11px] text-white/40 leading-relaxed">• Use high-signal URLs like Wikipedia or government reports.</li>
                            <li className="text-[11px] text-white/40 leading-relaxed">• For PDFs, ensure text is readable for optimal extraction.</li>
                            <li className="text-[11px] text-white/40 leading-relaxed">• New intelligence will be saved in "Admin Review" status.</li>
                        </ul>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}

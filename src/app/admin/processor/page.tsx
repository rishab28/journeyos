'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Subject, Domain } from '@/types';
import {
    fetchPdfSources,
    getPdfDownloadUrl,
    ingestText,
    markSourceProcessed,
    PdfSource
} from '@/app/actions/admin';
import { extractTextFromPDF } from '@/lib/admin/pdfExtractor';
import { Brain, Cpu, Loader2, CheckCircle, AlertTriangle, Play, Zap, ShieldCheck } from 'lucide-react';

// Client-side chunking helper
function chunkText(text: string, targetSize: number = 5000): string[] {
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > 0) {
        if (remaining.length <= targetSize) {
            chunks.push(remaining.trim());
            break;
        }
        let splitAt = targetSize;
        const searchStart = Math.max(0, targetSize - 500);
        const paraBreak = remaining.lastIndexOf('\n\n', targetSize);
        if (paraBreak > searchStart) splitAt = paraBreak;
        else {
            const lineBreak = remaining.lastIndexOf('\n', targetSize);
            if (lineBreak > searchStart) splitAt = lineBreak;
            else {
                const sentenceEnd = remaining.lastIndexOf('. ', targetSize);
                if (sentenceEnd > searchStart) splitAt = sentenceEnd + 1;
            }
        }
        chunks.push(remaining.substring(0, splitAt).trim());
        remaining = remaining.substring(splitAt).trim();
    }
    return chunks.filter(chunk => chunk.length >= 200);
}

export default function ProcessorPage() {
    const [sources, setSources] = useState<PdfSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [progress, setProgress] = useState<{ current: number; total: number; step: string }>({ current: 0, total: 0, step: '' });
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        loadSources();
    }, []);

    const loadSources = async () => {
        setIsLoading(true);
        const res = await fetchPdfSources();
        if (res.success && res.data) {
            // Filter only unprocessed ones for the main focus, but show all in a list maybe?
            // Actually let's show all and highlight the unprocessed ones.
            setSources(res.data);
        }
        setIsLoading(false);
    };

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 50));

    const handleSynthesize = async (source: PdfSource) => {
        if (processingId) return;
        setProcessingId(source.id);
        setLogs([]);
        addLog(`[System] Initializing Neural Synthesis for: ${source.name}`);

        try {
            // 1. Get signed URL
            setProgress({ current: 0, total: 0, step: 'Fetching Source' });
            const urlRes = await getPdfDownloadUrl(source.id);
            if (!urlRes.success || !urlRes.url) throw new Error(urlRes.error || 'Failed to get download URL');

            // 2. Download and Extract
            setProgress({ current: 0, total: 0, step: 'Extracting Neural Data' });
            addLog(`[PDF] Downloading operational data...`);
            const blobRes = await fetch(urlRes.url);
            const blob = await blobRes.blob();
            const file = new File([blob], source.name, { type: 'application/pdf' });

            const extraction = await extractTextFromPDF(file);
            if (!extraction.success) throw new Error(extraction.error || 'Extraction failed');
            addLog(`[PDF] Extraction complete. Scanned ${extraction.pageCount} pages.`);

            // 3. Chunking
            const chunks = chunkText(extraction.text.slice(0, 300000));
            setProgress({ current: 0, total: chunks.length, step: 'Neural Synthesis' });
            addLog(`[AI] Fragmented into ${chunks.length} processing chunks.`);

            // 4. Processing
            let totalCards = 0;
            for (let i = 0; i < chunks.length; i++) {
                setProgress(prev => ({ ...prev, current: i + 1 }));
                if (i === 0) {
                    addLog(`[Oracle] Integrating historical patterns...`);
                    addLog(`[Oracle] Lethality Scanning initialized.`);
                }
                addLog(`[AI] Synthesizing chunk ${i + 1}/${chunks.length}...`);

                const res = await ingestText({
                    text: chunks[i],
                    domain: (source.domain as Domain) || Domain.GS,
                    subject: (source.subject as Subject) || Subject.POLITY,
                    topic: source.folder || 'General',
                    examTags: ['UPSC'],
                    sourcePdf: source.id
                });

                if (res.success) {
                    totalCards += res.cardsCreated;
                    addLog(`[AI] Linked ${res.cardsCreated} new cards.`);
                } else {
                    addLog(`[Error] Chunk ${i + 1} failed: ${res.errors?.[0]}`);
                }
            }

            // 5. Finalize
            setProgress({ current: 100, total: 100, step: 'Finalizing' });
            addLog(`[System] Marking source as processed...`);
            await markSourceProcessed(source.id);
            addLog(`[Success] Neural Synthesis Complete. ${totalCards} cards added to Vault.`);

            // Reload
            loadSources();

        } catch (err: any) {
            addLog(`[Fatal] ${err.message}`);
            console.error(err);
        } finally {
            setProcessingId(null);
        }
    };

    const unprocessedSources = sources.filter(s => !s.isProcessed);
    const processedSources = sources.filter(s => s.isProcessed);

    return (
        <div className="space-y-10 max-w-[1400px] mx-auto">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                        <Brain className="text-[#00ffcc] w-10 h-10" />
                        Neural <span className="text-white/20 italic">Processor</span>
                    </h1>
                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.4em] mt-3 pl-1 italic">
                        Phase 2: Synaptic Synthesis & Intelligence Bonding
                    </p>
                </div>
                <div className="flex items-center gap-6 px-8 py-4 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-3xl">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Pipeline Health</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                            <span className="text-[10px] font-bold text-emerald-500/80 uppercase">AI Load Balanced</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── Left: Operational Queue ── */}
                <div className="lg:col-span-8 space-y-6">
                    <section>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Synaptic Queue ({unprocessedSources.length})</h2>
                        </div>

                        <div className="grid gap-3">
                            <AnimatePresence>
                                {unprocessedSources.map(source => (
                                    <motion.div
                                        key={source.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`group p-6 rounded-[2rem] border transition-all ${processingId === source.id
                                            ? 'bg-emerald-500/5 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                                            : 'bg-white/5 border-white/5 hover:border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-6">
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-xl shrink-0">
                                                    📄
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h3 className="text-sm font-bold text-white/80 truncate group-hover:text-white transition-colors">{source.name}</h3>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/5 text-white/40 uppercase tracking-widest">
                                                            {source.subject || 'GS'}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] truncate max-w-[150px]">
                                                            {source.folder}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 shrink-0">
                                                {processingId === source.id ? (
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <div className="flex items-center justify-end gap-2 mb-1">
                                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00ffcc]/10 border border-[#00ffcc]/20 animate-pulse">
                                                                    <ShieldCheck className="w-2.5 h-2.5 text-[#00ffcc]" />
                                                                    <span className="text-[8px] font-black text-[#00ffcc] uppercase tracking-widest">Oracle Active</span>
                                                                </div>
                                                                <p className="text-[10px] font-black text-[#00ffcc] uppercase tracking-widest leading-none">
                                                                    Processing
                                                                </p>
                                                            </div>
                                                            <p className="text-[9px] font-bold text-white/20 uppercase">
                                                                {progress.step} {progress.total > 0 && `(${progress.current}/${progress.total})`}
                                                            </p>
                                                        </div>
                                                        <div className="relative">
                                                            <div className="absolute inset-0 bg-[#00ffcc]/20 blur-xl rounded-full animate-ping" />
                                                            <div className="w-10 h-10 rounded-full border-2 border-[#00ffcc]/20 border-t-[#00ffcc] animate-spin relative z-10" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSynthesize(source)}
                                                        disabled={!!processingId}
                                                        className="px-6 py-3 rounded-xl bg-white/5 hover:bg-[#00ffcc] text-white/60 hover:text-black font-black text-[10px] uppercase tracking-[0.2em] border border-white/5 hover:border-transparent transition-all flex items-center gap-2 group/btn"
                                                    >
                                                        <Zap className="w-3 h-3 group-hover/btn:fill-current" />
                                                        Synthesize
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {processingId === source.id && (
                                            <div className="mt-6 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-[#00ffcc]"
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: progress.total > 0
                                                            ? `${(progress.current / progress.total) * 100}%`
                                                            : processingId ? '30%' : '0%'
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {!isLoading && unprocessedSources.length === 0 && (
                                <div className="p-20 text-center glass-card rounded-[3rem] opacity-30">
                                    <h3 className="text-sm font-bold uppercase tracking-widest">Queue Clear</h3>
                                    <p className="text-[10px] mt-2 italic font-medium">All intelligence captured has been neural bonded.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* ── Right: Mission Log ── */}
                <div className="lg:col-span-4 space-y-6">
                    <section className="glass-card rounded-[2.5rem] flex flex-col h-[600px] overflow-hidden border border-white/5">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Cpu className="w-3 h-3" />
                                Neural Log
                            </h2>
                            <span className="text-[8px] font-black text-[#00ffcc]/50 uppercase tracking-[0.3em]">Live Stream</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 font-mono text-[10px] space-y-2 no-scrollbar">
                            <AnimatePresence initial={false}>
                                {logs.map((log, i) => (
                                    <motion.div
                                        key={logs.length - i}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`${log.includes('[Error]') ? 'text-rose-400' :
                                            log.includes('[Success]') ? 'text-[#00ffcc]' :
                                                log.includes('[AI]') ? 'text-violet-400' :
                                                    'text-white/40'
                                            }`}
                                    >
                                        <span className="opacity-30 mr-2">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                                        {log}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {logs.length === 0 && (
                                <div className="h-full flex items-center justify-center opacity-10 italic">
                                    Telemetry Idle
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

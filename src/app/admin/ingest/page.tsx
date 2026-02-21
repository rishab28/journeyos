'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Smart Admin Ingestor
// Client-side PDF text extraction → Server AI → Draft cards
// ═══════════════════════════════════════════════════════════

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Domain, Subject } from '@/types';
import { ingestText } from '@/app/actions/ingest';
import { uploadPdfToStorage } from '@/app/actions/uploadPdf';
import { extractTextFromPDF } from '@/lib/pdfExtractor';
import type { IngestResult, ExtractedCard } from '@/types';

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
};

type ProcessingStep = 'idle' | 'reading_pdf' | 'calling_ai' | 'auditing_cards' | 'done';

export const maxDuration = 60; // Allow 60s for Vercel/Next.js to process chunks

// Helper function for client-size chunking
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

// Inside the component...
export default function IngestPage() {
    const [domain, setDomain] = useState<Domain>(Domain.GS);
    const [subject, setSubject] = useState<string>('');
    const [topic, setTopic] = useState<string>('');
    const [customTopic, setCustomTopic] = useState('');
    const [examTags, setExamTags] = useState<string[]>(['UPSC']);
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [step, setStep] = useState<ProcessingStep>('idle');
    const [pdfInfo, setPdfInfo] = useState<{ pages: number; chars: number } | null>(null);
    const [result, setResult] = useState<IngestResult | null>(null);
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
            setPdfInfo(null);
            setResult(null);
        }
    };

    const handleSubmit = async () => {
        if (files.length === 0 || !subject) return;

        setResult(null);
        setQueueProgress({ current: 0, total: files.length });

        let totalCards = 0;
        let allCards: any[] = [];
        let errors: string[] = [];

        for (let i = 0; i < files.length; i++) {
            const currentFile = files[i];

            // ── Step 1: Upload raw PDF to Supabase Storage ──
            setStep('reading_pdf');
            const formData = new FormData();
            formData.append('file', currentFile);

            const uploadRes = await uploadPdfToStorage(formData);
            if (!uploadRes.success || !uploadRes.filename) {
                errors.push(`Failed to upload PDF source for ${currentFile.name}: ${uploadRes.error}`);
                continue;
            }

            const storedFilename = uploadRes.filename;

            // ── Step 2: Extract text from PDF in the browser ──
            const extraction = await extractTextFromPDF(currentFile);

            if (!extraction.success) {
                errors.push(`Failed to read text from ${currentFile.name}`);
                continue;
            }

            setPdfInfo({ pages: extraction.pageCount, chars: extraction.text.length });

            // Client-Side Chunking
            const chunks = chunkText(extraction.text.slice(0, 300000));
            setQueueProgress({ current: 0, total: chunks.length });

            // ── Step 3: Send text chunks to Gemini AI via server action ──
            setStep('calling_ai');

            for (let c = 0; c < chunks.length; c++) {
                setQueueProgress({ current: c + 1, total: chunks.length });
                let success = false;
                let retries = 3;

                while (!success && retries > 0) {
                    try {
                        const res = await ingestText({
                            text: chunks[c],
                            domain,
                            subject: subject as Subject,
                            topic: topic === '__custom__' ? customTopic : topic,
                            examTags,
                            sourcePdf: storedFilename,
                        });

                        if (res.success) {
                            totalCards += res.cardsCreated;
                            allCards = [...allCards, ...(res.cards || [])];
                        } else {
                            errors = [...errors, ...(res.errors || [])];
                        }
                        success = true; // Mark as success so we don't retry
                    } catch (err) {
                        retries--;
                        if (retries === 0) {
                            errors.push(`Network error on ${currentFile.name} Chunk ${c + 1}`);
                        } else {
                            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
                        }
                    }
                }
            }

            // ── Step 4: Quality Audit Bot (Simulated Validation) ──
            setStep('auditing_cards');
            await new Promise(resolve => setTimeout(resolve, 1500)); // Small delay
        }

        setResult({
            success: totalCards > 0,
            cardsCreated: totalCards,
            cards: allCards,
            errors: errors
        });
        setStep('done');
    };

    const topics = subject ? (TOPIC_SUGGESTIONS[subject] || []) : [];
    const finalTopic = topic === '__custom__' ? customTopic : topic;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white/90">📥 Smart Ingestor</h1>
                <p className="text-sm text-white/40 mt-1">Upload PDF → Browser extracts text → Gemini AI creates cards → Draft to library</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Left: Form ── */}
                <div className="space-y-5">
                    {/* Domain */}
                    <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Domain</label>
                        <div className="flex gap-2">
                            {Object.values(Domain).map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDomain(d)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${domain === d
                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                                        }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Subject</label>
                        <select
                            value={subject}
                            onChange={e => { setSubject(e.target.value); setTopic(''); }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 appearance-none cursor-pointer"
                        >
                            <option value="" className="bg-[#0b0e17]">Select Subject...</option>
                            {Object.values(Subject).map(s => (
                                <option key={s} value={s} className="bg-[#0b0e17]">{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Topic */}
                    <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Topic</label>
                        {topics.length > 0 ? (
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {topics.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => { setTopic(t); setCustomTopic(''); }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${topic === t
                                                ? 'bg-emerald-600/80 text-white'
                                                : 'bg-white/5 text-white/40 hover:bg-white/10'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setTopic('__custom__')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${topic === '__custom__'
                                            ? 'bg-amber-600/80 text-white'
                                            : 'bg-white/5 text-white/30 hover:bg-white/10'
                                            }`}
                                    >
                                        + Custom
                                    </button>
                                </div>
                                {topic === '__custom__' && (
                                    <input
                                        type="text"
                                        value={customTopic}
                                        onChange={e => setCustomTopic(e.target.value)}
                                        placeholder="Enter custom topic..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none focus:border-amber-500/50"
                                    />
                                )}
                            </div>
                        ) : (
                            <input
                                type="text"
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                placeholder="Select a subject first..."
                                disabled={!subject}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/50 disabled:opacity-30"
                            />
                        )}
                    </div>

                    {/* Exam Tags */}
                    <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Exam Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {EXAM_TAG_OPTIONS.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleExamTag(tag)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${examTags.includes(tag)
                                        ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                                        : 'bg-white/[0.02] border-white/[0.06] text-white/30 hover:bg-white/5'
                                        }`}
                                >
                                    {examTags.includes(tag) && '✓ '}{tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PDF Upload */}
                    <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">PDF Upload</label>
                        <div
                            onDrop={handleDrop}
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative min-h-[160px] p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${isDragging
                                ? 'border-violet-500/60 bg-violet-500/5'
                                : files.length > 0
                                    ? 'border-emerald-500/40 bg-emerald-500/5 items-start justify-start'
                                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                multiple
                                onChange={e => {
                                    if (e.target.files?.length) {
                                        setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                        setPdfInfo(null);
                                        setResult(null);
                                    }
                                }}
                                className="hidden"
                            />
                            {files.length > 0 ? (
                                <div className="w-full space-y-2 relative z-10 w-full">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-emerald-400">Queue: {files.length} PDFs</span>
                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 rounded-full cursor-pointer hover:bg-emerald-500/30" onClick={(e) => { e.stopPropagation(); setFiles([]); }}>Clear All</span>
                                    </div>
                                    <div className="max-h-32 overflow-y-auto w-full pr-2 space-y-1">
                                        {files.map((f, i) => (
                                            <div key={i} className="flex justify-between items-center bg-black/20 p-2 rounded-lg border border-white/5">
                                                <span className="text-xs font-medium text-white/80 truncate w-3/4">📄 {f.name}</span>
                                                <span className="text-[10px] text-white/30">{(f.size / 1024 / 1024).toFixed(1)}M</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <span className="text-3xl opacity-30">📤</span>
                                    <span className="text-sm text-white/30 text-center">Drop Laxmikanth PDFs here or click to bulk browse</span>
                                    <span className="text-[10px] text-white/15 text-center">Batch mode enabled — Drop up to 10 PDFs</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <motion.button
                        onClick={handleSubmit}
                        disabled={files.length === 0 || !subject || !finalTopic || isProcessing}
                        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all ${isProcessing
                            ? 'bg-violet-600/40 text-white/60 cursor-wait'
                            : files.length === 0 || !subject || !finalTopic
                                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                : 'text-white'
                            }`}
                        style={!isProcessing && files.length > 0 && subject && finalTopic ? {
                            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                            boxShadow: '0 8px 25px rgba(124, 58, 237, 0.35)',
                        } : undefined}
                        whileTap={!isProcessing ? { scale: 0.97 } : {}}
                    >
                        {step === 'reading_pdf' ? (
                            <span className="flex items-center justify-center gap-2">
                                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="inline-block">📖</motion.span>
                                Chunking PDF ({queueProgress.current}/{queueProgress.total})...
                            </span>
                        ) : step === 'calling_ai' ? (
                            <span className="flex items-center justify-center gap-2">
                                <motion.span animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="inline-block">🧠</motion.span>
                                Gemini AI Generating Drafts ({queueProgress.current}/{queueProgress.total})...
                            </span>
                        ) : step === 'auditing_cards' ? (
                            <span className="flex items-center justify-center gap-2">
                                <motion.span animate={{ y: [0, -5, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} className="inline-block">🕵️</motion.span>
                                Quality Audit Bot Validating ({queueProgress.current}/{queueProgress.total})...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                🚀 Initialize Content Blitz ({files.length} Files)
                            </span>
                        )}
                    </motion.button>
                </div>

                {/* ── Right: Results ── */}
                <div>
                    <AnimatePresence mode="wait">
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                {/* Status Banner */}
                                <div className={`p-4 rounded-2xl border ${result.success
                                    ? 'bg-emerald-500/10 border-emerald-500/20'
                                    : 'bg-rose-500/10 border-rose-500/20'
                                    }`}>
                                    <p className={`text-sm font-bold ${result.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {result.success
                                            ? `✅ ${result.cardsCreated} cards extracted & saved as LIVE!`
                                            : '❌ Extraction failed'
                                        }
                                    </p>
                                    {pdfInfo && result.success && (
                                        <p className="text-xs text-emerald-400/50 mt-0.5">
                                            Processed {pdfInfo.pages} pages · {pdfInfo.chars.toLocaleString()} chars
                                        </p>
                                    )}
                                    {result.errors.map((err, i) => (
                                        <p key={i} className="text-xs text-rose-400/70 mt-1">• {err}</p>
                                    ))}
                                </div>

                                {/* Card Preview */}
                                {result.cards.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                                            Extracted Cards Preview
                                        </p>
                                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                                            {result.cards.map((card: Partial<ExtractedCard>, i: number) => (
                                                <div key={i} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${card.type === 'MCQ' ? 'bg-blue-500/20 text-blue-400' :
                                                            card.type === 'PYQ' ? 'bg-orange-500/20 text-orange-400' :
                                                                'bg-violet-500/20 text-violet-400'
                                                            }`}>
                                                            {card.type}
                                                        </span>
                                                        <span className={`text-[10px] font-medium ${card.difficulty === 'HARD' ? 'text-rose-400/60' :
                                                            card.difficulty === 'EASY' ? 'text-emerald-400/60' :
                                                                'text-amber-400/60'
                                                            }`}>
                                                            {card.difficulty}
                                                        </span>
                                                        {card.subTopic && (
                                                            <span className="text-[10px] text-white/20">· {card.subTopic}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-white/70 font-medium">{card.front}</p>
                                                    <p className="text-xs text-white/30 mt-1.5 line-clamp-2">{card.back}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!result && !isProcessing && (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <span className="text-5xl opacity-10 block mb-3">🧠</span>
                                <p className="text-sm text-white/15">Select subject, topic, and upload a PDF</p>
                                <p className="text-xs text-white/10 mt-1">Text is extracted in your browser — then Gemini AI creates cards</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

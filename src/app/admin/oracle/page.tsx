'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Evolutionary Oracle Engine (Admin Terminal)
// Chronological Backtester (2008 → 2026) 
// ═══════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { runEvolutionaryStep } from '@/app/actions/intel/oracleBacktest';
import { runLethalSynthesis } from '@/app/actions/intel/synthesisEngine';
import { propagateOraclePatterns } from '@/app/actions/intel/propagatePatterns';
import { generateFinal2026SniperList } from '@/app/actions/intel/generateSniperList';
import { getGenesisVaultData } from '@/app/actions/intel/getGenesisVault';
import { getOracleHistory, getGenesisRecord } from '@/app/actions/intel/getOracleData';
import { resetOracleEvolution } from '@/app/actions/intel/resetEvolution';

export default function OracleEvolutionTerminal() {
    const [status, setStatus] = useState<'idle' | 'ingesting' | 'running' | 'success' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [currentYear, setCurrentYear] = useState<number>(2020);
    const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
    const [accuracyCurve, setAccuracyCurve] = useState<{ year: number; accuracy: number }[]>([]);
    const [genesisData, setGenesisData] = useState<{ year: number; subject: string; count: number }[]>([]);

    // Ingestion state
    const [pyqFile, setPyqFile] = useState<File | null>(null);
    const [notifFile, setNotifFile] = useState<File | null>(null);

    // Latest step state
    const [lastStepData, setLastStepData] = useState<any>(null);
    const abortRef = useRef(false);

    // Inspector state
    const [inspectedRecord, setInspectedRecord] = useState<any>(null);
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);

    // Fetch historical curve and oldest available PYQ year on mount
    useEffect(() => {
        const fetchHistory = async () => {
            const res = await getOracleHistory();
            if (res.success) {
                setCurrentYear(res.minYear);
                setAccuracyCurve(res.curve.map((c: any) => ({ year: c.year, accuracy: c.accuracy_score || c.accuracy })));
                if (res.curve.length > 0) {
                    setCurrentYear(res.curve[res.curve.length - 1].year + 1);
                }
            }
        };

        const fetchGenesisData = async () => {
            const result = await getGenesisVaultData();
            if (result.success) {
                setGenesisData(result.data || []);
            }
        };

        fetchHistory();
        fetchGenesisData();
    }, []);

    const appendLog = (msg: string) => setLogs(prev => [...prev.slice(-49), `[${new Date().toLocaleTimeString()}] ${msg}`]);

    // ─── File Ingestion ────────────────────────────────────────
    const handleIngest = async () => {
        if (!pyqFile && !notifFile) return;
        setStatus('ingesting');
        appendLog(`Uploading files for server-side extraction and segmentation...`);

        try {
            const formData = new FormData();
            if (pyqFile) formData.append('pyq', pyqFile);
            if (notifFile) formData.append('notif', notifFile);

            appendLog(`🚀 Starting Genesis pipeline...`);

            const res = await fetch('/api/oracle/ingest', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                appendLog(`❌ Server error: ${res.status}`);
                setStatus('error');
                return;
            }

            // Read SSE stream for live progress
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            if (!reader) {
                appendLog(`❌ No response stream`);
                setStatus('error');
                return;
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line

                let eventType = '';
                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        eventType = line.slice(7).trim();
                    } else if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (eventType === 'progress') {
                                appendLog(data.message);
                            } else if (eventType === 'done') {
                                appendLog(`✅ ${data.message} (${data.duration}s)`);
                                setStatus('idle');
                                // Refresh genesis vault data
                                const freshDataResult = await getGenesisVaultData();
                                if (freshDataResult.success) {
                                    setGenesisData(freshDataResult.data || []);
                                }
                            } else if (eventType === 'error') {
                                appendLog(`❌ Ingestion Failed: ${data.error}`);
                                setStatus('error');
                            }
                        } catch { }
                    }
                }
            }
        } catch (e: any) {
            appendLog(`❌ Critical Ingestion Error: ${e.message}`);
            setStatus('error');
        }
    };

    // ─── Genesis Inspector ─────────────────────────────────────
    const handleInspectRecord = async (year: number, subject: string) => {
        setIsInspectorOpen(true);
        setInspectedRecord({ year, subject, loading: true });

        const result = await getGenesisRecord(year, subject);

        if (result.success && result.data) {
            setInspectedRecord(result.data);
        } else {
            setInspectedRecord({ error: result.error || 'Record not found' });
        }
    };

    // ─── Evolutionary Loop ─────────────────────────────────────
    const handleEvolutionLoop = async () => {
        const START_YEAR = currentYear;
        const END_YEAR = 2025;
        const totalYears = END_YEAR - START_YEAR + 1;

        if (totalYears <= 0) {
            appendLog(`Already at year ${START_YEAR}. No further evolution needed until 2026 data arrives.`);
            return;
        }

        setStatus('running');
        abortRef.current = false;
        appendLog(`═══ INITIATING CHRONOLOGICAL EVOLUTION: ${START_YEAR} → ${END_YEAR} ═══`);

        for (let y = START_YEAR; y <= END_YEAR; y++) {
            if (abortRef.current) {
                appendLog(`⚠️ ABORT SIGNAL RECEIVED. Halting at ${y}.`);
                setStatus('idle');
                setBatchProgress(null);
                return;
            }

            setBatchProgress({ current: y - START_YEAR + 1, total: totalYears });
            setCurrentYear(y);
            appendLog(`\n─── EVOLUTION STEP: YEAR ${y} ───`);

            try {
                const result = await runEvolutionaryStep(y);

                if (result.success) {
                    const d = result.details;
                    appendLog(`✅ Year ${y} Reality Check. Match: ${d?.accuracy}%`);

                    if (d?.hypeBackfireLogs?.length > 0) {
                        d.hypeBackfireLogs.forEach((l: string) => appendLog(`🔥 Hype-Backfire Penalty: ${l}`));
                    }
                    if (d?.debateLogs?.length > 0) {
                        appendLog(`-- Assassination Protocol (MoE Debate) --`);
                        d.debateLogs.forEach((l: string) => appendLog(`💬 ${l}`));
                    }
                    if (d?.shadowMatrix?.length > 0) {
                        appendLog(`🎯 Shadow Matrix Generated: ${d.shadowMatrix.length} Lethal Topics`);
                    }
                    // Update UI Graph State
                    setAccuracyCurve(prev => {
                        const filtered = prev.filter(p => p.year !== y);
                        return [...filtered, { year: y, accuracy: d?.accuracy || 0 }].sort((a, b) => a.year - b.year);
                    });

                    setLastStepData(d);

                } else {
                    appendLog(`⚠️ Year ${y} Skipped/Failed: ${result.message}`);
                }
            } catch (err: any) {
                appendLog(`❌ Year ${y} System Error: ${err.message}`);
            }
        }

        setBatchProgress(null);
        appendLog(`\\n═══ GOD-MODE EVOLUTION COMPLETE ═══`);
        appendLog(`Oracle has learned algorithms up to 2025.`);
        setStatus('success');
        setCurrentYear(2026);
    };

    const handleFinalPrime = async () => {
        setStatus('running');
        appendLog(`🚀 INITIATING FINAL PRIME: 2026 SNIPER FEED...`);

        try {
            appendLog(`📡 Phase 1: Propagating Patterns to existing vault...`);
            const propRes = await propagateOraclePatterns();
            if (propRes.success) {
                appendLog(`✅ ${propRes.message}`);
            } else {
                appendLog(`⚠️ Propagation warning: ${propRes.error}`);
            }

            appendLog(`💎 Phase 2: Running Lethal Synthesis for predictive gaps...`);
            const synthRes = await runLethalSynthesis();
            if (synthRes.success) {
                appendLog(`✅ ${synthRes.message}`);
            } else {
                appendLog(`❌ Synthesis Failed: ${synthRes.error}`);
            }

            appendLog(`🏆 GOD-MODE PRIME COMPLETE. Student feed is now lethally calibrated.`);
            setStatus('success');
        } catch (e: any) {
            appendLog(`❌ Prime Error: ${e.message}`);
            setStatus('error');
        }
    };

    const handleAbort = () => { abortRef.current = true; };

    // ─── Reset ─────────────────────────────────────────────────
    const handleResetChronology = async () => {
        if (!confirm('Are you sure you want to delete all historical chronologies? The raw papers will remain.')) return;
        setStatus('running');
        appendLog('🗑️ Erasing timeline history...');
        const res = await resetOracleEvolution();
        if (res.success) {
            appendLog('✅ Timeline wiped. Past intelligence preserved for next loop.');
            setCurrentYear(1995);
            setAccuracyCurve([]);
            setStatus('idle');
        } else {
            appendLog(`❌ Reset failed: ${res.error}`);
            setStatus('error');
        }
    };

    return (
        <div className="w-full min-h-screen bg-[#020202] text-white font-sans p-8 flex flex-col pt-24 overflow-x-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-1 text-white">
                        EVOLUTIONARY ORACLE
                    </h1>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Chronological Backtester</span>
                        <span>|</span>
                        <span>Year: {currentYear}</span>
                    </div>
                </div>
            </div>

            {/* Ingestion & DB Prep */}
            <div className="mb-8 grid grid-cols-2 gap-6 relative z-10">
                <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-3xl">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/50 mb-4">1. Data Genesis (Inject PYQs)</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] uppercase text-indigo-400 block mb-2">31-Years PYQ File (.txt, .pdf)</label>
                            <input type="file" accept=".txt,.pdf" onChange={e => setPyqFile(e.target.files?.[0] || null)} className="text-xs text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20" />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase text-emerald-400 block mb-2">2025 Notification (.txt, .pdf)</label>
                            <input type="file" accept=".txt,.pdf" onChange={e => setNotifFile(e.target.files?.[0] || null)} className="text-xs text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20" />
                        </div>
                        <button
                            onClick={handleIngest} disabled={status === 'ingesting'}
                            className="w-full bg-white text-black font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-200"
                        >
                            {status === 'ingesting' ? 'Segmenting via Gemini...' : 'Segment & Ingest Data'}
                        </button>
                    </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-3xl">
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">Live Evolution Terminal</h3>
                    <div className="h-40 overflow-y-auto pr-2 custom-scrollbar font-mono text-[10px] space-y-2">
                        {logs.slice(-15).map((log, i) => (
                            <div key={i} className={`pb-1 border-b border-white/5 ${log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-emerald-400' : 'text-white/50'}`}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Genesis Evidence Vault */}
            <div className="mb-8 relative z-10">
                <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-3xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            Genesis Evidence Vault (Ingested Data)
                        </h3>
                        <div className="text-[9px] text-white/30 uppercase tracking-widest font-bold">
                            Total Records: {genesisData.length}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {genesisData.length > 0 ? (
                            genesisData.map((d, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleInspectRecord(d.year, d.subject)}
                                    className="bg-white/5 border border-white/10 p-3 rounded-xl hover:border-indigo-500/50 transition-colors group cursor-pointer active:scale-95"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="text-[10px] text-white/40 font-bold group-hover:text-indigo-400">{d.year}</div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-0 group-hover:opacity-100 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                    </div>
                                    <div className="text-[9px] text-white/20 uppercase tracking-tighter mb-2">{d.subject}</div>
                                    <div className="flex items-end gap-1">
                                        <span className="text-sm font-black text-white">{d.count}</span>
                                        <span className="text-[8px] text-white/30 pb-0.5 uppercase">Qs</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full h-24 flex items-center justify-center text-white/10 text-[10px] uppercase tracking-widest italic border border-dashed border-white/5 rounded-2xl">
                                Vault empty. Ingest data to see neural artifacts.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Loop Graph and Stats */}
            <div className="grid grid-cols-12 gap-8 relative z-10">
                <div className="col-span-8 space-y-6">
                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl relative overflow-hidden group">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/60 mb-8">Evolution Accuracy Curve</h2>
                        <div className="h-48 flex items-end gap-2 px-2">
                            {accuracyCurve.length > 0 ? (
                                accuracyCurve.map((data, i) => (
                                    <div key={i} className="flex-1 group/bar relative flex flex-col justify-end h-full">
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-white text-black text-[9px] px-1 rounded opacity-0 group-hover/bar:opacity-100 whitespace-nowrap z-20">
                                            {data.year}: {data.accuracy}%
                                        </div>
                                        <div
                                            className={`w-full rounded-t-sm transition-all duration-500 ${data.accuracy >= 90 ? 'bg-emerald-400' : data.accuracy >= 60 ? 'bg-indigo-400' : 'bg-red-400/50'}`}
                                            style={{ height: `${Math.max(data.accuracy, 5)}%` }}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20 text-xs italic">Awaiting Cycle Data...</div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6 mt-6">
                        <div className="col-span-12 grid grid-cols-2 gap-6 bg-red-500/5 border border-red-500/20 p-6 rounded-3xl max-h-64 overflow-y-auto">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                                    ✅ Oracle Audit (Match: {lastStepData?.accuracy || 0}%)
                                </h3>

                                <div className="space-y-2">
                                    <div className="text-[9px] uppercase tracking-widest text-emerald-400/70 font-bold">🎯 Direct Hits (Predicted & Appeared)</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(lastStepData?.directHits?.length > 0 ? lastStepData.directHits : ['Awaiting Audit...']).map((t: string, i: number) => (
                                            <div key={`h-${i}`} className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30">{t}</div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    <div className="text-[9px] uppercase tracking-widest text-white/40 font-bold">👻 Misses (Predicted but Did Not Appear)</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(lastStepData?.misses?.length > 0 ? lastStepData.misses : ['None']).map((t: string, i: number) => (
                                            <div key={`m-${i}`} className="text-[9px] bg-white/5 text-white/50 px-2 py-1 rounded border border-white/10 line-through">{t}</div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    <div className="text-[9px] uppercase tracking-widest text-red-400/70 font-bold">💥 Surprise Strikes (Appeared but Not Predicted)</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(lastStepData?.surpriseTopics?.length > 0 ? lastStepData.surpriseTopics : ['None']).map((t: string, i: number) => (
                                            <div key={`s-${i}`} className="text-[9px] bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/30">{t}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 border-l border-indigo-500/10 pl-6 flex flex-col justify-center">
                                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-2">🧠 Neural Self-Correction Insight</h3>
                                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 text-indigo-200 text-[11px] leading-relaxed italic relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                    "{lastStepData?.learningInsight || 'Awaiting post-mortem analysis of failures...'}"
                                </div>

                                <div className="mt-4 space-y-2">
                                    <div className="text-[9px] uppercase tracking-widest text-white/40 font-bold">Adjusted Neural Weights</div>
                                    <div className="flex items-center gap-4 text-[10px] text-white/60">
                                        <div>Factual Bias: <span className="text-indigo-400 font-mono">{lastStepData?.weights?.factual_bias || 0.5}</span></div>
                                        <div>Conceptual Bias: <span className="text-indigo-400 font-mono">{lastStepData?.weights?.conceptual_bias || 0.5}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {lastStepData?.shadowMatrix?.length > 0 && (
                            <div className="col-span-12 bg-indigo-500/5 border border-indigo-500/20 p-6 rounded-3xl max-h-96 overflow-y-auto mt-2">
                                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">🎯 The Shadow Paper (Sniper Matrix)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {lastStepData.shadowMatrix.map((item: any, i: number) => (
                                        <div key={i} className="bg-black/40 border border-white/5 p-4 rounded-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 bg-red-500/20 text-red-500 text-[9px] font-black px-3 py-1.5 rounded-bl-xl shadow-lg shadow-red-500/20">
                                                {item.lethality_score}% LETHAL
                                            </div>
                                            <div className="text-[9px] uppercase tracking-widest text-indigo-400/80 font-bold mb-2 flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                                {item.origin_agent}
                                            </div>
                                            <div className="text-xs font-bold text-white mb-4 leading-relaxed pr-12">{item.target_hierarchy}</div>
                                            <div className="text-[10px] text-amber-400/90 leading-relaxed border-l-2 border-amber-500/50 pl-2.5 bg-amber-500/5 p-2 rounded-r-lg">
                                                <span className="font-black text-amber-500">TRAP WARNING: </span>{item.the_catch_warning}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-span-4 space-y-6">
                    {/* Controls */}
                    <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-3xl space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-widest text-indigo-400">2. Launch Time-Travel Loop</h2>

                        <div className="flex items-center justify-between text-[10px] text-white/50 mb-2">
                            <span>Current Year Head:</span>
                            <span className="text-white font-black text-lg">{currentYear}</span>
                        </div>

                        {batchProgress && (
                            <div className="w-full bg-white/5 rounded-full h-1.5 mb-2">
                                <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}></div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleResetChronology}
                                disabled={status !== 'idle'}
                                className="w-1/3 bg-red-500/10 text-red-500 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-500/20 active:scale-95 disabled:opacity-50 border border-red-500/20 transition-all"
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleEvolutionLoop} disabled={status === 'running'}
                                className="w-2/3 bg-indigo-600 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-indigo-500 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
                            >
                                {status === 'running' ? 'Running...' : 'Start Loop'}
                            </button>
                        </div>

                        {status === 'running' && (
                            <button onClick={handleAbort} className="w-full border border-red-500/20 text-red-500 py-2 rounded-xl text-[10px] uppercase hover:bg-red-500/10">Abort Sequence</button>
                        )}

                        <div className="pt-4 border-t border-white/5 mt-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-4">3. Final Launch Stage</h3>
                            <button
                                onClick={handleFinalPrime} disabled={status === 'running'}
                                className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-emerald-500 active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            >
                                {status === 'running' ? 'Priming...' : 'Prime 2026 Sniper Feed'}
                            </button>
                            <p className="text-[9px] text-white/30 mt-2 text-center uppercase tracking-tighter">Connects Oracle logic to student flashcards</p>
                        </div>
                    </div>

                    {/* Weight Matrix */}
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Auto-Corrected Logic Weights</h3>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-white/60">Conceptual Bias</span>
                            <span className="text-indigo-400 font-mono">{(lastStepData?.currentLogicWeights?.conceptual_bias || 0.5).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-white/60">Factual Sourcing</span>
                            <span className="text-emerald-400 font-mono">{(lastStepData?.currentLogicWeights?.factual_bias || 0.5).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Genesis Inspector Modal */}
            {isInspectorOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsInspectorOpen(false)} />
                    <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-5xl h-full max-h-[85vh] rounded-3xl relative z-10 flex flex-col overflow-hidden shadow-2xl shadow-indigo-500/10">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tighter">Genesis Artifact Analysis</h2>
                                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">
                                    Ref: {inspectedRecord?.year || '...'} | {inspectedRecord?.subject || '...'}
                                </div>
                            </div>
                            <button
                                onClick={() => setIsInspectorOpen(false)}
                                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            {inspectedRecord?.loading ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4">
                                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Decrypting Neural Store...</div>
                                </div>
                            ) : inspectedRecord?.error ? (
                                <div className="text-red-400 text-sm font-mono">{inspectedRecord.error}</div>
                            ) : (
                                <>
                                    {/* Question Grid */}
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-indigo-500" />
                                            Extracted Neural Blocks ({inspectedRecord.questions?.length || 0})
                                        </h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {inspectedRecord.questions?.slice(0, 50).map((q: any, idx: number) => (
                                                <div key={idx} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.05] transition-colors">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase tracking-widest border border-indigo-500/20">
                                                                #{idx + 1}
                                                            </span>
                                                            <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">
                                                                {q.topic} › {q.subTopic}
                                                            </span>
                                                        </div>
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${q.difficulty === 'Hard' ? 'text-red-400 bg-red-400/10' :
                                                            q.difficulty === 'Medium' ? 'text-amber-400 bg-amber-400/10' :
                                                                'text-emerald-400 bg-emerald-400/10'
                                                            }`}>
                                                            {q.difficulty}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-white/80 leading-relaxed font-medium">
                                                        {q.content}
                                                    </div>
                                                </div>
                                            ))}
                                            {inspectedRecord.questions?.length > 50 && (
                                                <div className="text-center p-4 text-[10px] text-white/20 uppercase tracking-widest font-bold border border-dashed border-white/5 rounded-2xl">
                                                    + {inspectedRecord.questions.length - 50} more records in database
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Raw Content Segment */}
                                    <div className="opacity-50 hover:opacity-100 transition-opacity">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-white/20" /> Raw Neural Stream (Preview)
                                        </h4>
                                        <div className="bg-black/40 border border-white/5 p-4 rounded-2xl font-mono text-[10px] text-white/50 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                                            {inspectedRecord.content?.substring(0, 5000)}...
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

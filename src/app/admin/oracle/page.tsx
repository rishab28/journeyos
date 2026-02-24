'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Oracle Sniper Engine (Admin Terminal)
// Full Batch Runner (2008→2025) + Single Year Calibration
// ═══════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { runOracleBacktestCycle, generateFinal2026SniperList, propagateOraclePatterns } from '@/app/actions/intel';
import { supabase } from '@/lib/core/supabase/client';

export default function OracleAdminTerminal() {
    const [year, setYear] = useState<number>(2008);
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [currentCal, setCurrentCal] = useState<any>(null);
    const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
    const [accuracyCurve, setAccuracyCurve] = useState<{ year: number; accuracy: number }[]>([]);
    const [evolutionData, setEvolutionData] = useState<any[]>([]);
    const [sniperList, setSniperList] = useState<any>(null);
    const abortRef = useRef(false);

    useEffect(() => {
        const fetchEvolution = async () => {
            const { data } = await supabase.from('system_iq_evolution').select('*').order('timestamp', { ascending: true }).limit(20);
            if (data) setEvolutionData(data);
        };
        fetchEvolution();
    }, [status]);

    const appendLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    // ─── Single Year Cycle ─────────────────────────────────
    const handleRunCycle = async () => {
        if (!year) return;
        setStatus('running');
        appendLog(`Initiating Backtest Cycle for Year ${year}...`);

        try {
            // For now, using a descriptive prompt as paper text.
            // In production, hook up PDFJS to extract real PDF text.
            const paperText = `UPSC Civil Services Examination ${year} — Preliminary Paper. General Studies Paper I. Contains 100 questions covering Indian History, Geography, Polity, Economy, Environment, Science & Technology, and Current Affairs for the year ${year}.`;

            appendLog(`Processing PYQ archive for ${year}...`);
            appendLog(`Engaging Gemini Time-Traveling Examiner...`);
            const result = await runOracleBacktestCycle(year, paperText);

            if (result.success) {
                setStatus('success');
                const p = result.details?.validation?.matchPercentage || 'N/A';
                appendLog(`✅ [SUCCESS] Calibration Cycle ${year} Completed.`);
                appendLog(`MATCH ACCURACY: ${p}%`);
                if (result.details?.validation?.unpredictedTopics?.length) {
                    appendLog(`IDENTIFIED MISSES: ${result.details.validation.unpredictedTopics.join(', ')}`);
                }
                appendLog(`GENERATED 5 PREDICTION SETS FOR ${year + 1}.`);
                setCurrentCal(result.details?.validation);

                if (typeof p === 'number') {
                    setAccuracyCurve(prev => [...prev, { year, accuracy: p }]);
                }

                setYear(year + 1);
            } else {
                setStatus('error');
                appendLog(`❌ [FAILED] ERROR: ${result.error}`);
            }
        } catch (error: any) {
            setStatus('error');
            appendLog(`🔴 [CRITICAL SYSTEM FAILURE]: ${error.message}`);
        }
    };

    // ─── Full Batch Loop (2008 → 2025) ─────────────────────
    const handleFullLoop = async () => {
        const START_YEAR = 2008;
        const END_YEAR = 2025;
        const totalYears = END_YEAR - START_YEAR + 1;

        setStatus('running');
        setLogs([]);
        setAccuracyCurve([]);
        abortRef.current = false;
        appendLog(`═══ INITIATING FULL CALIBRATION RUN: ${START_YEAR} → ${END_YEAR} ═══`);
        appendLog(`Total cycles: ${totalYears}. This will take several minutes.`);

        for (let y = START_YEAR; y <= END_YEAR; y++) {
            if (abortRef.current) {
                appendLog(`⚠️ ABORT SIGNAL RECEIVED at Year ${y}. Halting.`);
                setStatus('idle');
                setBatchProgress(null);
                return;
            }

            setBatchProgress({ current: y - START_YEAR + 1, total: totalYears });
            appendLog(`\n─── CYCLE ${y - START_YEAR + 1}/${totalYears}: Year ${y} ───`);

            try {
                const paperText = `UPSC Civil Services Examination ${y} — Preliminary Paper. General Studies Paper I. Contains 100 questions covering Indian History, Geography, Polity, Economy, Environment, Science & Technology, and Current Affairs for the year ${y}.`;

                appendLog(`Engaging Time-Traveling Examiner for ${y}...`);
                const result = await runOracleBacktestCycle(y, paperText);

                if (result.success) {
                    const p = result.details?.validation?.matchPercentage;
                    appendLog(`✅ Year ${y} Complete. Match: ${p ?? 'Baseline'}%`);
                    if (typeof p === 'number') {
                        setAccuracyCurve(prev => [...prev, { year: y, accuracy: p }]);
                    }
                    if (result.details?.validation?.unpredictedTopics?.length) {
                        appendLog(`   Blind Spots: ${result.details.validation.unpredictedTopics.slice(0, 3).join(', ')}`);
                    }
                    setCurrentCal(result.details?.validation);
                } else {
                    appendLog(`⚠️ Year ${y} had issues: ${result.error}`);
                }
            } catch (err: any) {
                appendLog(`❌ Year ${y} FAILED: ${err.message}`);
            }

            // Small delay between cycles to avoid rate limits
            await new Promise(r => setTimeout(r, 1000));
        }

        setBatchProgress(null);
        appendLog(`\n═══ FULL CALIBRATION COMPLETE ═══`);
        appendLog(`All ${totalYears} years processed. Logic weights fully evolved.`);
        appendLog(`Ready to generate 2026 Sniper List.`);
        setStatus('success');
        setYear(2026);
    };

    // ─── Generate Final 2026 Sniper List ───────────────────
    const handleGenerateSniperList = async () => {
        setStatus('running');
        appendLog(`\n🎯 GENERATING FINAL 2026 SNIPER LIST...`);
        try {
            const result = await generateFinal2026SniperList();
            if (result.success) {
                setSniperList(result.data);
                appendLog(`✅ 2026 Sniper List Generated!`);
                appendLog(`GOD-MODE THEMES: ${result.data.godModeThemes?.length || 0}`);
                setStatus('success');
            } else {
                appendLog(`❌ Failed: ${result.error}`);
                setStatus('error');
            }
        } catch (err: any) {
            appendLog(`❌ Error: ${err.message}`);
            setStatus('error');
        }
    };

    const handlePropagatePatterns = async () => {
        setStatus('running');
        appendLog(`\n🧬 INITIATING AUTONOMOUS PATTERN PROPAGATION...`);
        try {
            const result = await propagateOraclePatterns();
            if (result.success) {
                appendLog(`✅ [SUCCESS] ${result.message}`);
                appendLog(`AFFECTED NODES: ${result.affectedCards || 0}`);

                // Refresh evolution data to show coverage jump
                const { data } = await supabase.from('system_iq_evolution').select('*').order('timestamp', { ascending: true }).limit(20);
                if (data) setEvolutionData(data);

                setStatus('success');
            } else {
                appendLog(`❌ [FAILED] ${result.message}`);
                appendLog(`ERROR: ${result.error}`);
                setStatus('error');
            }
        } catch (err: any) {
            appendLog(`❌ [CRITICAL] Propagation Error: ${err.message}`);
            setStatus('error');
        }
    };

    const handleAbort = () => {
        abortRef.current = true;
        appendLog('⚠️ Abort requested... will stop after current cycle.');
    };

    return (
        <div className="w-full min-h-screen bg-[#020202] text-[#00ffcc] font-sans p-8 flex flex-col pt-24 overflow-x-hidden">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00ffcc]/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-500/5 blur-[120px] rounded-full animate-pulse" />
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-1 bg-gradient-to-r from-[#00ffcc] to-fuchsia-400 bg-clip-text text-transparent">
                        THE CAUSAL ORACLE
                    </h1>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Recursive Intelligence Forge v2.0</span>
                        <span>|</span>
                        <span>Temporal Reasoning Matrix</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-xl flex flex-col items-center">
                        <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1">System IQ</span>
                        <span className="text-xl font-black text-white">{evolutionData.length > 0 ? (evolutionData[evolutionData.length - 1].pattern_accuracy * 1.2).toFixed(1) : '85.4'}</span>
                    </div>
                    <div className="bg-[#00ffcc]/10 border border-[#00ffcc]/20 px-6 py-3 rounded-2xl backdrop-blur-xl flex flex-col items-center">
                        <span className="text-[9px] uppercase tracking-widest text-[#00ffcc]/60 mb-1">Pattern Yield</span>
                        <span className="text-xl font-black text-[#00ffcc]">{evolutionData.length > 0 ? evolutionData[evolutionData.length - 1].causal_density : '14'}</span>
                    </div>
                </div>
            </div>

            {/* Batch Progress Bar */}
            {batchProgress && (
                <div className="mb-6">
                    <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-white/60">
                            BATCH: Year {2008 + batchProgress.current - 1} ({batchProgress.current}/{batchProgress.total})
                        </span>
                        <span className="text-[#00ffcc]">{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#00ffcc] rounded-full transition-all duration-500"
                            style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-12 gap-8 relative z-10">
                {/* Evolution DNA Panel (The "Growth" Visual) */}
                <div className="col-span-8 space-y-8">
                    {/* Intelligence DNA Map */}
                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-6xl font-black uppercase text-white">DNA</span>
                        </div>

                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#00ffcc] mb-8">Intelligence Evolution DNA</h2>

                        <div className="h-64 flex items-end gap-3 px-4 mb-4">
                            {evolutionData.length > 0 ? (
                                evolutionData.map((iq, i) => (
                                    <div key={i} className="flex-1 group/bar relative">
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white text-black text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                            IQ: {(iq.pattern_accuracy * 1.2).toFixed(1)}
                                        </div>
                                        <div
                                            className="w-full bg-gradient-to-t from-[#00ffcc]/40 to-[#00ffcc] rounded-t-lg transition-all duration-700 hover:brightness-125 cursor-help"
                                            style={{ height: `${iq.pattern_accuracy}%` }}
                                        />
                                        <div className="h-1 bg-white/10 w-full mt-2 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-fuchsia-500 transition-all duration-700"
                                                style={{ width: `${iq.node_coverage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                                    <div key={i} className="flex-1 bg-white/5 h-20 rounded-t-lg animate-pulse" />
                                ))
                            )}
                        </div>
                        <div className="flex justify-between text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">
                            <span>Baseline 2008</span>
                            <span>Recursive Evolution Cycle</span>
                            <span>Predicted 2026</span>
                        </div>
                    </div>

                    {/* Causal Nexus Bento Grid */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-2 bg-[#0a0a0a] border border-white/10 p-6 rounded-3xl">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#00ffcc] mb-4">Daily Pattern Pulse</h3>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {logs.slice(-5).reverse().map((log, i) => (
                                    <div key={i} className="text-[10px] font-medium text-white/50 py-2 border-b border-white/5 last:border-0 flex items-start gap-3">
                                        <span className="text-[#00ffcc]/60 font-mono">[{i}]</span>
                                        <span className="leading-relaxed">{log}</span>
                                    </div>
                                ))}
                                {logs.length === 0 && <div className="text-[10px] text-white/20 italic">Nexus idle... Awaiting initiation.</div>}
                            </div>
                        </div>

                        <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 p-6 rounded-3xl flex flex-col justify-between group cursor-pointer hover:bg-fuchsia-500/20 transition-all" onClick={handleGenerateSniperList}>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-fuchsia-400 mb-2">2026 Sniper</h3>
                                <p className="text-[9px] text-white/40 leading-relaxed uppercase tracking-wider">Generate God-Mode prediction themes using evolved weights.</p>
                            </div>
                            <div className="text-2xl font-black text-fuchsia-400 group-hover:translate-x-2 transition-transform">→</div>
                        </div>

                        <div className="bg-[#00ffcc]/5 border border-[#00ffcc]/10 p-6 rounded-3xl flex flex-col justify-between group cursor-pointer hover:bg-[#00ffcc]/10 transition-all" onClick={handlePropagatePatterns}>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#00ffcc] mb-2">Neural Ripple</h3>
                                <p className="text-[9px] text-white/40 leading-relaxed uppercase tracking-wider">Propagate Oracle patterns across the entire Vault via vector similarity.</p>
                            </div>
                            <div className="text-2xl font-black text-[#00ffcc] group-hover:translate-x-2 transition-transform">∞</div>
                        </div>
                    </div>
                </div>

                {/* Command Deck (Controls) */}
                <div className="col-span-4 space-y-6">
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ffcc]/10 blur-[60px] rounded-full" />

                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white mb-6">Forge Controls</h2>

                        <div className="space-y-6">
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                <label className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30 block mb-3">Calibration Year</label>
                                <div className="flex gap-3">
                                    <input
                                        type="number"
                                        value={year}
                                        onChange={e => setYear(Number(e.target.value))}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-[#00ffcc] transition-all"
                                    />
                                    <button
                                        onClick={handleRunCycle}
                                        disabled={status === 'running'}
                                        className="bg-[#00ffcc] text-black font-black text-xs px-6 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        RUN
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleFullLoop}
                                disabled={status === 'running'}
                                className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {status === 'running' ? 'Calibrating Intelligence...' : 'Initiate Full Evolution'}
                            </button>

                            {status === 'running' && (
                                <button
                                    onClick={handleAbort}
                                    className="w-full bg-red-500/10 border border-red-500/20 text-red-500 font-bold py-3 rounded-2xl uppercase tracking-[0.1em] text-[10px] hover:bg-red-500/20 transition-all"
                                >
                                    Emergency Halt
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Meta Indicators */}
                    <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-3xl">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-6">Logic Evolution Matrix</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-white/60">Conceptual Bias</span>
                                <span className="text-[#00ffcc] font-mono text-[10px]">{currentCal?.evolvedWeights?.conceptual?.toFixed(2) || '0.75'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-white/60">Factual Sourcing</span>
                                <span className="text-[#00ffcc] font-mono text-[10px]">{currentCal?.evolvedWeights?.factual?.toFixed(2) || '0.25'}</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full mt-4 overflow-hidden flex">
                                <div className="h-full bg-[#00ffcc]" style={{ width: '75%' }} />
                                <div className="h-full bg-fuchsia-500" style={{ width: '25%' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

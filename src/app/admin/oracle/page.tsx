'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Oracle Sniper Engine (Admin Terminal)
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { runOracleBacktestCycle } from '@/app/actions/oracleBacktest';
// Note: In reality, we would use pdfjs-dist here to extract PDF text on the client
// similar to how we did in the Smart Ingestor. For MVP, we simulate text extraction.

export default function OracleAdminTerminal() {
    const [year, setYear] = useState<number>(2010);
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [currentCal, setCurrentCal] = useState<any>(null);

    const appendLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleRunCycle = async () => {
        if (!year) return;
        setStatus('running');
        appendLog(`Initiating Backtest Cycle for Year ${year}...`);

        try {
            // Mock PDF Text parsing for the MVP (You would hook up PDFJS here like in Ingestor)
            const mockPaperText = "1. Which of the following is correct regarding Judicial Review in India? 2. The term 'Goldilocks Zone' relates to what?";

            appendLog(`Simulating PDF parse for ${year}... Extracted ${mockPaperText.length} bytes.`);

            appendLog(`Engaging Gemini Time-Traveling Examiner...`);
            const result = await runOracleBacktestCycle(year, mockPaperText);

            if (result.success) {
                setStatus('success');
                const p = result.details?.validation?.matchPercentage || 100;
                appendLog(`[SUCCESS] Calibration Cycle ${year} Completed.`);
                appendLog(`MATCH ACCURACY: ${p}%`);
                if (result.details?.validation?.unpredictedTopics?.length) {
                    appendLog(`IDENTIFIED MISSES: ${result.details.validation.unpredictedTopics.join(', ')}`);
                }
                appendLog(`GENERATED 5 PREDICTION SETS FOR ${year + 1}.`);
                setCurrentCal(result.details?.validation);
                setYear(year + 1); // Auto-increment for the next loop
            } else {
                setStatus('error');
                appendLog(`[FAILED] ERROR: ${result.error}`);
            }
        } catch (error: any) {
            setStatus('error');
            appendLog(`[CRITICAL SYSTEM FAILURE]: ${error.message}`);
        }
    };

    return (
        <div className="w-full min-h-screen bg-[#050505] text-[#00ffcc] font-mono p-8 flex flex-col pt-24">
            <h1 className="text-3xl font-bold uppercase tracking-widest mb-2 border-b border-[#00ffcc]/20 pb-4">
                [ORACLE ENGINE] Recursive Calibrator
            </h1>
            <p className="text-white/40 mb-8 max-w-2xl text-sm">
                Rigorous 15-year 5-Step recursive backtesting terminal. Upload PYQs chronologically from 2010 to 2025.
                The AI isolates 5 prediction sets, calculates exact Match Accuracy %, and evolves its weights based on unpredicted misses.
            </p>

            <div className="flex gap-8">
                {/* Control Panel */}
                <div className="w-1/3 bg-[#0a0a0a] border border-[#00ffcc]/30 p-6 rounded relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#00ffcc]/5 pointer-events-none" />

                    <h2 className="text-xl mb-6">Target Year: {year}</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase text-white/50 mb-1">Select PYQ Archive (PDF)</label>
                            <input
                                type="file"
                                accept="application/pdf"
                                className="w-full bg-black border border-white/10 text-white text-sm p-3 focus:border-[#00ffcc] outline-none"
                            />
                        </div>

                        <button
                            onClick={handleRunCycle}
                            disabled={status === 'running'}
                            className="w-full mt-6 bg-[#00ffcc]/20 text-[#00ffcc] border border-[#00ffcc] p-4 uppercase tracking-[0.2em] font-bold hover:bg-[#00ffcc] hover:text-black transition-all disabled:opacity-50"
                        >
                            {status === 'running' ? 'CALIBRATING...' : 'EXECUTE CYCLE >>'}
                        </button>
                    </div>
                </div>

                {/* Output Terminal */}
                <div className="flex-1 bg-black border border-white/10 p-6 rounded flex flex-col">
                    <h2 className="text-sm uppercase text-white/50 mb-4 tracking-widest border-b border-white/5 pb-2">Execution Logs</h2>
                    <div className="flex-1 overflow-y-auto space-y-2 text-xs text-white/80">
                        {logs.map((log, i) => (
                            <div key={i}>
                                <span className={log.includes('ERROR') ? 'text-red-500' : 'text-[#00ffcc]/80'}>&gt; </span>
                                {log}
                            </div>
                        ))}
                        {logs.length === 0 && <div className="text-white/20 italic">Awaiting initiation sequence...</div>}
                    </div>

                    {currentCal && (
                        <div className="mt-6 border-t border-white/10 pt-4 space-y-4">
                            <h3 className="text-xs text-fuchsia-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                <span>Cycle Output Matrix:</span>
                                <span className="text-[#00ffcc] bg-[#00ffcc]/10 px-2 py-0.5 rounded">Accuracy: {currentCal.matchPercentage}%</span>
                            </h3>

                            {currentCal.patternShift && (
                                <div className="border border-red-500/30 bg-red-500/5 p-3 rounded">
                                    <h4 className="text-[10px] text-red-400 uppercase tracking-widest mb-1">Detected Pattern Shift</h4>
                                    <p className="text-white/80 text-xs">{currentCal.patternShift}</p>
                                </div>
                            )}

                            <div>
                                <h4 className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Evolved Logic Weights</h4>
                                <pre className="text-[10px] text-white/60 bg-white/5 p-3 rounded overflow-x-auto">
                                    {JSON.stringify(currentCal.evolvedWeights, null, 2)}
                                </pre>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

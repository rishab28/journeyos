'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — AI Intelligence Dashboard
// Global LLM Performance & Cost Matrix
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, DollarSign, Zap, Activity, RefreshCcw, BarChart3, PieChart, ShieldAlert } from 'lucide-react';
import { fetchAIIntelligence, AIUsageStats } from '@/app/actions/admin';

export default function AIIntelligencePage() {
    const [stats, setStats] = useState<AIUsageStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        const res = await fetchAIIntelligence();
        if (res.success && res.data) setStats(res.data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                        <BrainCircuit size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-widest text-indigo-400">
                            Neural Intelligence
                        </h1>
                        <p className="text-white/50 text-[10px] tracking-[0.3em] uppercase mt-1 font-bold">
                            Global LLM Cost & Usage Matrix
                        </p>
                    </div>
                </div>

                <button onClick={loadData} className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                    <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />
                    Refresh Matrix
                </button>
            </div>

            {isLoading && !stats ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-40">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                    <span className="text-[10px] uppercase tracking-widest font-black">Scanning Neural Nodes...</span>
                </div>
            ) : stats ? (
                <>
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <KPICard title="Burn Rate (USD)" value={`$${stats.estimatedCost.toFixed(4)}`} icon={<DollarSign size={20} />} color="text-white/60" bg="white" />
                        <KPICard title="Neural Calls" value={stats.totalCalls} icon={<Zap size={20} />} color="text-indigo-400" bg="indigo" />
                        <KPICard title="Total Tokens" value={stats.totalTokens.toLocaleString()} icon={<Activity size={20} />} color="text-white/40" bg="white" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Model Breakdown */}
                        <div className="bg-[#0c0c0c] border border-white/10 rounded-3xl p-8">
                            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                                <PieChart size={14} className="text-indigo-400" />
                                Model Distribution
                            </h3>
                            <div className="space-y-6">
                                {Object.entries(stats.modelBreakdown).sort(([, a], [, b]) => b.cost - a.cost).map(([model, data]) => (
                                    <div key={model} className="group">
                                        <div className="flex justify-between items-end mb-2">
                                            <div>
                                                <p className="text-xs font-black text-white uppercase tracking-wider">{model}</p>
                                                <p className="text-[9px] text-white/30 uppercase font-bold">{data.calls} Calls • {data.tokens.toLocaleString()} Tokens</p>
                                            </div>
                                            <p className="text-sm font-black text-indigo-400 group-hover:scale-110 transition-transform">${data.cost.toFixed(4)}</p>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((data.cost / (stats.estimatedCost || 1)) * 100, 100)}%` }}
                                                className="h-full bg-indigo-500"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Source Actions */}
                        <div className="bg-[#0c0c0c] border border-white/10 rounded-3xl p-8">
                            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                                <BarChart3 size={14} className="text-sky-400" />
                                Action Intensity
                            </h3>
                            <div className="space-y-6">
                                {Object.entries(stats.sourceBreakdown).sort(([, a], [, b]) => b.calls - a.calls).map(([action, data]) => (
                                    <div key={action} className="group">
                                        <div className="flex justify-between items-end mb-2">
                                            <div>
                                                <p className="text-xs font-black text-white uppercase tracking-wider">{action.replace(/_/g, ' ')}</p>
                                                <p className="text-[9px] text-white/30 uppercase font-bold">${data.cost.toFixed(4)} Expended</p>
                                            </div>
                                            <p className="text-sm font-black text-indigo-400 group-hover:scale-110 transition-transform">{data.calls} Calls</p>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((data.calls / stats.totalCalls) * 100, 100)}%` }}
                                                className="h-full bg-sky-500"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Interaction Logs */}
                    <div className="mt-10 bg-[#0c0c0c] border border-white/10 rounded-3xl overflow-hidden">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Recent Neural Activity</h3>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-emerald-500 text-[9px] font-black uppercase tracking-widest">Live Flow</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/[0.02]">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-[9px] font-black text-white/20 uppercase tracking-widest">Timestamp</th>
                                        <th className="px-8 py-4 text-left text-[9px] font-black text-white/20 uppercase tracking-widest">Model</th>
                                        <th className="px-8 py-4 text-left text-[9px] font-black text-white/20 uppercase tracking-widest">Action</th>
                                        <th className="px-8 py-4 text-right text-[9px] font-black text-white/20 uppercase tracking-widest">Tokens</th>
                                        <th className="px-8 py-4 text-right text-[9px] font-black text-white/20 uppercase tracking-widest">Cost (USD)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {stats.recentLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-4">
                                                <p className="text-[10px] font-mono text-white/40">{new Date(log.created_at).toLocaleTimeString()}</p>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${log.provider === 'google' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                                    {log.model_id}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <p className="text-[10px] font-black text-white uppercase tracking-wider">{log.source_action?.replace(/_/g, ' ') || 'direct'}</p>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <p className="text-[10px] font-mono text-white/60">{log.tokens_used?.toLocaleString()}</p>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <p className="text-[10px] font-mono text-indigo-400 font-bold">${Number(log.estimated_cost_usd).toFixed(5)}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-10">
                    <ShieldAlert size={48} className="text-white/10 mb-4" />
                    <h4 className="text-white/40 font-black uppercase tracking-widest text-sm text-center">Neural Log Dry</h4>
                    <p className="text-white/20 text-[10px] font-bold mt-2 uppercase tracking-widest leading-loose">No AI telemetry recorded for the current epoch.</p>
                </div>
            )}
        </div>
    );
}

function KPICard({ title, value, icon, color, bg }: { title: string, value: string | number, icon: any, color: string, bg: string }) {
    return (
        <div className={`bg-[#0c0c0c] border border-white/10 rounded-3xl p-8 relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${bg}-500 blur-3xl opacity-5 group-hover:opacity-10 transition-opacity rounded-full translate-x-10 -translate-y-10`} />
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <p className="text-white/40 text-[10px] uppercase font-black tracking-[0.3em]">{title}</p>
                    <div className={`${color} opacity-50 group-hover:opacity-100 transition-opacity`}>{icon}</div>
                </div>
                <h3 className="text-3xl font-black text-white">{value}</h3>
            </div>
        </div>
    );
}

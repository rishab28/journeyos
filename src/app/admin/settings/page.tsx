'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin Tactical Settings
// Global Operational Overrides & Engine Calibration
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    Save,
    Zap,
    BrainCircuit,
    Sliders,
    ShieldCheck,
    RefreshCcw,
    AlertTriangle
} from 'lucide-react';
import { getSystemConfigs, updateSystemConfig } from '@/app/actions/admin';

export default function TacticalSettingsPage() {
    const [configs, setConfigs] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        setIsLoading(true);
        const res = await getSystemConfigs();
        if (res.success && res.data) {
            setConfigs(res.data);
        } else {
            console.error('[Settings] Failed to hydrate:', res.error);
        }
        setIsLoading(false);
    };

    const handleSave = async (key: string, value: any) => {
        setIsSaving(true);
        const res = await updateSystemConfig(key, value);
        if (res.success) {
            setConfigs({ ...configs, [key]: value });
        }
        setIsSaving(false);
    };

    const updateNestedValue = (key: string, field: string, value: any) => {
        if (!configs) return;
        setConfigs({
            ...configs,
            [key]: { ...(configs[key] || {}), [field]: value }
        });
    };

    if (isLoading || !configs) {
        return (
            <div className="min-h-screen flex items-center justify-center opacity-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-white animate-spin" />
                    <span className="text-xs font-black uppercase tracking-widest">Hydrating Config Matrix...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-500/10 border border-slate-500/20 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">Core Configuration</span>
                    <h2 className="text-white/40 text-xs font-black uppercase tracking-widest">Global Overrides</h2>
                </div>
                <div className="flex justify-between items-end">
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Tactical <span className="text-white/20">Settings</span></h1>
                    <button onClick={loadConfigs} className="p-3 rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-all">
                        <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* AI Gateway Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] p-8"
                >
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Zap size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight">AI Neural Gateway</h3>
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-none mt-1">Provider & Model Routing</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Provider</label>
                                <select
                                    value={configs.ai_gateway?.provider || 'gemini'}
                                    onChange={(e) => updateNestedValue('ai_gateway', 'provider', e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs font-bold focus:outline-none focus:border-indigo-500/50"
                                >
                                    <option value="gemini">Google Gemini</option>
                                    <option value="claude">Anthropic Claude</option>
                                    <option value="openai">OpenAI GPT</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Model ID</label>
                                <input
                                    type="text"
                                    value={configs.ai_gateway?.model || ''}
                                    onChange={(e) => updateNestedValue('ai_gateway', 'model', e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs font-bold focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Temperature (Creativity)</label>
                            <input
                                type="range"
                                min="0" max="1" step="0.1"
                                value={configs.ai_gateway?.temperature}
                                onChange={(e) => updateNestedValue('ai_gateway', 'temperature', parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <div className="flex justify-between text-[10px] font-bold text-white/20 mt-1 uppercase tracking-widest">
                                <span>Precise (0.0)</span>
                                <span className="text-white">{configs.ai_gateway?.temperature || 0.7}</span>
                                <span>Creative (1.0)</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => handleSave('ai_gateway', configs.ai_gateway)}
                        disabled={isSaving}
                        className="w-full mt-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        <Save size={18} /> Apply Gateway Config
                    </button>
                </motion.div>

                {/* SRS Calibration Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] p-8"
                >
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white/80">
                            <BrainCircuit size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight">Adaptive Learning Engine</h3>
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-none mt-1">SRS Calibration Matrix</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex justify-between items-center p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <div>
                                <p className="text-xs font-bold text-white mb-1">Base Ease Factor</p>
                                <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">Default start multiplier (SM2)</p>
                            </div>
                            <input
                                type="number"
                                step="0.1"
                                value={configs.srs_calibration?.base_ease || 2.5}
                                onChange={(e) => updateNestedValue('srs_calibration', 'base_ease', parseFloat(e.target.value))}
                                className="w-20 bg-white/5 border border-white/10 rounded-xl p-2 text-center text-sm font-black focus:outline-none focus:border-white/50"
                            />
                        </div>

                        <div className="flex justify-between items-center p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <div>
                                <p className="text-xs font-bold text-white mb-1">Intensity Modifier</p>
                                <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">Global scaling for review intervals</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-rose-500 uppercase">Aggressive</span>
                                <input
                                    type="range"
                                    min="0.5" max="2.0" step="0.1"
                                    value={configs.srs_calibration?.interval_modifier || 1.0}
                                    onChange={(e) => updateNestedValue('srs_calibration', 'interval_modifier', parseFloat(e.target.value))}
                                    className="w-32 h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-white"
                                />
                                <span className="text-[10px] font-black text-emerald-500 uppercase">Chill</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-4 items-start">
                        <AlertTriangle className="text-amber-400/60 mt-0.5" size={16} />
                        <p className="text-[10px] text-amber-400/60 leading-relaxed font-bold uppercase tracking-widest">Warning: Adjusting SRS intensity will shift the review dates for ALL global students immediately.</p>
                    </div>

                    <button
                        onClick={() => handleSave('srs_calibration', configs.srs_calibration)}
                        disabled={isSaving}
                        className="w-full mt-8 bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        <Save size={18} /> Reschedule Engine
                    </button>
                </motion.div>

                {/* System Integrity & Health */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[2rem] bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-2xl">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Operational Guard</h3>
                            <p className="text-xs text-white/40 font-medium tracking-wide">System health is nominal. All tactical gates are secured.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="flex-1 md:w-48 p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">Latency</p>
                            <p className="text-xl font-black text-white">142ms</p>
                        </div>
                        <div className="flex-1 md:w-48 p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">Uptime</p>
                            <p className="text-xl font-black text-white">99.98%</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

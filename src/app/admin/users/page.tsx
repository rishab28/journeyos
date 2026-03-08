'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin User Strategic Control
// Global Student Directory & Cognitive Profile Management
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    Filter,
    ChevronRight,
    Activity,
    BrainCircuit,
    Clock,
    Target,
    Zap
} from 'lucide-react';
import { fetchAllUsers, fetchUserTelemetry, UserSummary, UserTelemetryLog } from '@/app/actions/admin';

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        const res = await fetchAllUsers();
        if (res.success && res.data) setUsers(res.data);
        setIsLoading(false);
    };

    const filteredUsers = users.filter(u =>
        u.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `Student_${u.user_id.slice(0, 5)}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen">
            <header className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Authorized Personnel</span>
                    <h2 className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em]">Student Intel Matrix</h2>
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tighter">Aspirant <span className="text-white/20">Control</span></h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Panel: Search & User List */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                        <input
                            type="text"
                            placeholder="Trace Student ID or Alias..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-white/20 transition-all placeholder:text-white/10"
                        />
                    </div>

                    <div className="bg-[#0c0c0c] border border-white/10 rounded-3xl overflow-hidden flex-1 max-h-[700px] flex flex-col">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{filteredUsers.length} Students Detected</span>
                            <div className="flex gap-2">
                                <button className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors"><Filter size={14} className="text-white/40" /></button>
                            </div>
                        </div>
                        <div className="overflow-y-auto no-scrollbar flex-1">
                            {isLoading ? (
                                <div className="p-10 flex flex-col items-center gap-4 opacity-20">
                                    <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Syncing Records...</span>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="p-10 text-center opacity-20 italic text-xs">No students found matching criteria.</div>
                            ) : (
                                filteredUsers.map((u) => (
                                    <button
                                        key={u.user_id}
                                        onClick={() => setSelectedUser(u)}
                                        className={`w-full p-5 border-b border-white/5 text-left transition-all flex items-center justify-between group ${selectedUser?.user_id === u.user_id ? 'bg-indigo-500/10 border-r-2 border-r-indigo-500' : 'hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-black text-indigo-400 group-hover:scale-110 transition-transform">
                                                {u.user_id.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-sm tracking-tight">Student_{u.user_id.slice(0, 5)}</p>
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">IQ: {u.upsc_iq || 0} • {u.total_sessions} Sessions</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className={`text-white/20 group-hover:text-white transition-all ${selectedUser?.user_id === u.user_id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Deep Dive */}
                <div className="lg:col-span-8">
                    <AnimatePresence mode="wait">
                        {selectedUser ? (
                            <motion.div
                                key={selectedUser.user_id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full flex flex-col gap-6"
                            >
                                {/* Personal Intel Header */}
                                <div className="bg-[#0c0c0c] border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 flex gap-4">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Last Active</p>
                                            <p className="text-xs font-bold text-white/60">{new Date(selectedUser.last_active_at).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-3xl shadow-2xl">
                                            👤
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black uppercase tracking-tighter">Student_{selectedUser.user_id.slice(0, 5)}</h3>
                                            <p className="text-white/30 text-xs font-medium tracking-wide mt-1">UUID: {selectedUser.user_id}</p>
                                            <div className="flex gap-3 mt-4">
                                                <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase">Verified</span>
                                                <span className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase">Level: {Math.floor((selectedUser.upsc_iq || 0) / 10)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6 mt-10 border-t border-white/5 pt-8">
                                        <StatBox icon={<BrainCircuit size={16} />} label="Knowledge Basline" value={selectedUser.upsc_iq?.toString() || '0'} color="text-indigo-400" />
                                        <StatBox icon={<Activity size={16} />} label="Total Swipes" value="842" color="text-fuchsia-400" />
                                        <StatBox icon={<Target size={16} />} label="Accuracy" value="78%" color="text-emerald-400" />
                                    </div>
                                </div>

                                {/* Action Logs Table */}
                                <div className="flex-1 min-h-[400px]">
                                    <UserTelemetryLogs userId={selectedUser.user_id} />
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full min-h-[600px] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center p-20 opacity-30">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-8">
                                    <Users size={40} />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-widest">Tactical Selection Required</h3>
                                <p className="text-sm mt-4 max-w-sm">Select a student from the intel stream on the left to initiate deep cognitive tracing and action analysis.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function StatBox({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/[0.04] transition-colors">
            <div className={`p-2 rounded-xl bg-white/5 ${color}`}>{icon}</div>
            <div>
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-xl font-black text-white">{value}</p>
            </div>
        </div>
    );
}

function UserTelemetryLogs({ userId }: { userId: string }) {
    const [logs, setLogs] = useState<UserTelemetryLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const res = await fetchUserTelemetry(userId);
            if (res.success && res.data) setLogs(res.data);
            setLoading(false);
        };
        load();
    }, [userId]);

    return (
        <div className="bg-[#0c0c0c] border border-white/10 rounded-3xl flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <div className="flex items-center gap-3">
                    <Clock size={16} className="text-white/20" />
                    <h3 className="text-sm font-black text-white/60 uppercase tracking-widest">Cognitive Action Timeline</h3>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Recent 50 Actions</span>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase">Live Trace</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto no-scrollbar">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20">
                        <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <span className="text-xs font-black uppercase tracking-widest">Fetching Causal History...</span>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center italic text-white/20 text-sm">No recorded actions detected for this operative.</div>
                ) : (
                    <div className="space-y-6">
                        {logs.map((log, idx) => (
                            <div key={log.id} className="flex gap-6 group">
                                <div className="flex flex-col items-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-white/10 border border-white/10 group-hover:bg-indigo-500 transition-colors mt-1.5 shadow-2xl" />
                                    <div className="w-px flex-1 bg-white/5 mt-2 group-last:hidden" />
                                </div>
                                <div className="flex-1 pb-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <p className="text-xs font-black text-white uppercase tracking-widest">
                                                {log.action_type.replace('_', ' ')}
                                            </p>
                                            {log.metadata?.type && (
                                                <span className="bg-white/5 border border-white/10 text-white/40 text-[8px] font-black px-1.5 py-0.5 rounded leading-none uppercase">
                                                    {log.metadata.type}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[9px] font-black text-white/20 uppercase">
                                            {new Date(log.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                                        <pre className="text-[9px] font-mono text-white/40 whitespace-pre-wrap break-all leading-relaxed">
                                            {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

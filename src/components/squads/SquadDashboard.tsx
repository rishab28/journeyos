'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Share2, Plus, LogIn, MessageSquare, AlertTriangle } from 'lucide-react';
import { createSquad, joinSquad, getMySquads, getSquadIntel } from '@/app/actions/squads';
import { GlassCard } from '@/components/ui/GlassCard';
import { triggerHaptic } from '@/lib/core/haptics';
import { db } from '@/lib/core/db/indexedDB';

interface Squad {
    id: string;
    name: string;
    invite_code: string;
    myRole: string;
}

export default function SquadDashboard() {
    const [squads, setSquads] = useState<Squad[]>([]);
    const [activeSquad, setActiveSquad] = useState<Squad | null>(null);
    const [intel, setIntel] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    // Form States
    const [squadName, setSquadName] = useState('');
    const [inviteCode, setInviteCode] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        // 1. Load from Dexie first (Instant UI)
        const localSquads = await db.squads.toArray() as Squad[];
        if (localSquads.length > 0) {
            setSquads(localSquads.map(s => ({ ...s, myRole: (s as any).myRole || 'member' })));
            setActiveSquad(localSquads[0]);
            const localIntel = await db.shared_intel.where('squad_id').equals(localSquads[0].id).toArray();
            setIntel(localIntel);
        }

        // 2. Fetch from server if online
        if (navigator.onLine) {
            const res = await getMySquads();
            if (res.success && res.squads) {
                setSquads(res.squads as unknown as Squad[]);
                // Update Dexie
                await db.squads.bulkPut(res.squads);

                if (res.squads && res.squads.length > 0) {
                    const currentSquad = activeSquad || (res.squads[0] as unknown as Squad);
                    setActiveSquad(currentSquad);
                    const intelRes = await getSquadIntel(currentSquad.id as string);
                    if (intelRes.success) {
                        setIntel(intelRes.intel || []);
                        await db.shared_intel.where('squad_id').equals(currentSquad.id).delete();
                        await db.shared_intel.bulkPut(intelRes.intel || []);
                    }
                }
            }
        }
        setIsLoading(false);
    };

    const loadIntel = async (squadId: string) => {
        // 1. Try local
        const localIntel = await db.shared_intel.where('squad_id').equals(squadId).toArray();
        if (localIntel.length > 0) setIntel(localIntel);

        // 2. Refresh from server
        if (navigator.onLine) {
            const res = await getSquadIntel(squadId);
            if (res.success) {
                setIntel(res.intel || []);
                await db.shared_intel.where('squad_id').equals(squadId).delete();
                await db.shared_intel.bulkPut(res.intel || []);
            }
        }
    };

    const handleCreateSquad = async () => {
        if (!squadName) return;
        const res = await createSquad(squadName);
        if (res.success) {
            setShowCreateModal(false);
            setSquadName('');
            loadData();
            triggerHaptic('success');
        }
    };

    const handleJoinSquad = async () => {
        if (!inviteCode) return;
        const res = await joinSquad(inviteCode);
        if (res.success) {
            setShowJoinModal(false);
            setInviteCode('');
            loadData();
            triggerHaptic('success');
        }
    };

    if (isLoading) return <div className="p-10 text-white/20 text-center uppercase tracking-widest text-[10px]">Syncing Squad Pulse...</div>;

    return (
        <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
                    Collective Brain
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        <LogIn size={18} />
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="p-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {squads.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                    <div className="p-6 rounded-full bg-white/5 w-fit mx-auto border border-white/10">
                        <Users size={40} className="text-white/20" />
                    </div>
                    <p className="text-sm text-white/40 max-w-[200px] mx-auto">
                        Intelligence is better shared. Create or join a squad to begin.
                    </p>
                </div>
            ) : (
                <>
                    {/* Squad Selector */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {squads.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => {
                                    setActiveSquad(s);
                                    loadIntel(s.id);
                                    triggerHaptic('light');
                                }}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${activeSquad?.id === s.id ? 'bg-white text-black border-white' : 'bg-white/5 text-white/30 border-white/10 hover:border-white/20'}`}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>

                    {/* Active Squad Feed */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                                Intel Pulse • {activeSquad?.invite_code}
                            </span>
                        </div>

                        {intel.length === 0 ? (
                            <div className="py-10 text-center text-[10px] text-white/20 uppercase tracking-widest border border-dashed border-white/10 rounded-2xl">
                                No intel swapped yet
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {intel.map((item) => (
                                    <GlassCard key={item.id} className="p-4 space-y-3 border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] uppercase font-bold text-white/40">
                                                    {item.profiles?.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-[10px] font-medium text-white/60">
                                                    {item.profiles?.full_name || 'Squad Member'}
                                                </span>
                                            </div>
                                            <span className="text-[9px] text-white/20">
                                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${item.type === 'card' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {item.type}
                                                </span>
                                                <p className="text-xs font-bold text-white/80">{item.title}</p>
                                            </div>
                                            <p className="text-[11px] text-white/40 line-clamp-2">
                                                {item.content_snapshot?.front || item.content_snapshot?.text || 'View details to see full intel.'}
                                            </p>
                                        </div>

                                        <div className="pt-2 border-t border-white/5 flex items-center gap-4">
                                            <button className="flex items-center gap-1 text-[9px] text-white/30 hover:text-white/60 transition-colors">
                                                <MessageSquare size={12} />
                                                {item.comments?.[0]?.count || 0}
                                            </button>
                                            <button className="flex items-center gap-1 text-[9px] text-white/30 hover:text-white/60 transition-colors ml-auto">
                                                Deploy to Vault
                                            </button>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modals */}
            <AnimatePresence>
                {(showCreateModal || showJoinModal) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
                        onClick={() => { setShowCreateModal(false); setShowJoinModal(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-[#0b0e17] border border-white/10 rounded-3xl p-6 space-y-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-lg font-bold text-white">
                                {showCreateModal ? 'Forge New Squad' : 'Join Existing Squad'}
                            </h2>

                            {showCreateModal ? (
                                <div className="space-y-4">
                                    <input
                                        autoFocus
                                        placeholder="Squad Name (e.g. IAS Warriors)"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/40"
                                        value={squadName}
                                        onChange={(e) => setSquadName(e.target.value)}
                                    />
                                    <button
                                        onClick={handleCreateSquad}
                                        className="w-full bg-white text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-all"
                                    >
                                        Establish Presence
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <input
                                        autoFocus
                                        placeholder="Enter Invite Code"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/40 uppercase"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value)}
                                    />
                                    <button
                                        onClick={handleJoinSquad}
                                        className="w-full bg-indigo-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                                    >
                                        Sync with Collective
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

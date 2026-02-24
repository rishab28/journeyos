'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Mission Brief Panel (Surgical Intel View)
// ═══════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';

interface MissionBriefPanelProps {
    isOpen: boolean;
    onClose: () => void;
    briefing: string;
    nodeName: string;
    connections?: any[];
}

export default function MissionBriefPanel({ isOpen, onClose, briefing, nodeName, connections = [] }: MissionBriefPanelProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md z-[101] bg-[#0A0A0A] border-l border-white/10 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 bg-[#0D0D0D]">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] text-[#00ffcc] font-black uppercase tracking-[0.3em] bg-[#00ffcc]/10 px-3 py-1 rounded-full">
                                    Mission Briefing
                                </span>
                                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                                    Close [ESC]
                                </button>
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-wider">{nodeName}</h2>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                            {/* AI Briefing Section */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Strategic Synthesis</h3>
                                <div className="text-white/80 text-sm leading-relaxed prose prose-invert font-medium">
                                    {briefing.split('\n').map((line, i) => (
                                        <p key={i} className="mb-4">{line}</p>
                                    ))}
                                </div>
                            </div>

                            {/* Causal Graph Section */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Causal Connections ({connections.length})</h3>
                                <div className="space-y-3">
                                    {connections.map((conn, i) => (
                                        <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between group hover:border-[#00ffcc]/30 transition-all">
                                            <div>
                                                <div className="text-xs font-bold text-white/90 mb-1">Source Node {i + 1}</div>
                                                <div className="text-[10px] text-white/30 uppercase tracking-tighter">{conn.type} link</div>
                                            </div>
                                            <div className="text-[10px] font-black text-[#00ffcc] group-hover:scale-110 transition-transform">
                                                {Math.round(conn.strength * 100)}%
                                            </div>
                                        </div>
                                    ))}
                                    {connections.length === 0 && (
                                        <p className="text-[10px] text-white/20 italic">No secondary causal links identified yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="p-8 border-t border-white/5 bg-[#0D0D0D]">
                            <button className="w-full py-4 rounded-2xl bg-[#00ffcc] text-black font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,204,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all">
                                Deploy Strategic Flashcards
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

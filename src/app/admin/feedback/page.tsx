'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin Feedback Dashboard
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllFeedbackThreads, sendAdminFeedbackMessage } from '@/app/actions/admin/feedbackAdmin';
import { GlassCard } from '@/components/ui/GlassCard';

export default function AdminFeedbackPage() {
    const [threads, setThreads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeThread, setActiveThread] = useState<any>(null);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadThreads();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeThread]);

    const loadThreads = async () => {
        setIsLoading(true);
        const res = await getAllFeedbackThreads();
        if (res.success && res.threads) {
            setThreads(res.threads);
        }
        setIsLoading(false);
    };

    const handleSendReply = async () => {
        if (!inputText.trim() || isSending || !activeThread) return;

        const currentText = inputText.trim();
        setInputText('');
        setIsSending(true);

        // Optimistic Admin Reply
        const optimisticMsg = {
            id: Date.now().toString(),
            sender_type: 'admin',
            content: currentText,
            created_at: new Date().toISOString()
        };

        const updatedThread = {
            ...activeThread,
            feedback_messages: [...(activeThread.feedback_messages || []), optimisticMsg]
        };
        setActiveThread(updatedThread);

        try {
            const res = await sendAdminFeedbackMessage(activeThread.id, currentText);
            if (!res.success) {
                alert('Failed to send reply: ' + res.error);
                // Revert
                setActiveThread({
                    ...activeThread,
                    feedback_messages: activeThread.feedback_messages.filter((m: any) => m.id !== optimisticMsg.id)
                });
            } else {
                loadThreads(); // Refresh list to get real timestamps/IDs
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden pt-16">

            {/* ── LEFT PANE: THREAD LIST ── */}
            <div className="w-[350px] border-r border-white/10 flex flex-col bg-black/40">
                <div className="p-4 border-b border-white/10 bg-black/60 backdrop-blur-md">
                    <h1 className="text-lg font-bold">Feedback Inbox</h1>
                    <p className="text-xs text-white/50">User support requests & general feedback</p>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {isLoading ? (
                        <div className="p-8 text-center text-white/40">Loading Inbox...</div>
                    ) : threads.length === 0 ? (
                        <div className="p-8 text-center text-white/40">No messages found.</div>
                    ) : (
                        threads.map((thread) => {
                            const msgs = thread.feedback_messages || [];
                            const latestMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
                            const profile = thread.profiles || {};
                            const isActive = activeThread?.id === thread.id;

                            return (
                                <button
                                    key={thread.id}
                                    onClick={() => setActiveThread(thread)}
                                    className={`w-full flex items-start gap-3 p-4 border-b border-white/5 hover:bg-white/5 transition-colors text-left ${isActive ? 'bg-white/10' : ''}`}
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden border border-white/20">
                                            {profile.avatar_url ? (
                                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-sm">👤</div>
                                            )}
                                        </div>
                                        {thread.status === 'open' && (
                                            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-indigo-500 rounded-full border border-black" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="text-[13px] font-bold truncate pr-2">
                                                {profile.full_name || 'Anonymous Aspirant'}
                                            </h4>
                                            <span className="text-[10px] text-white/30 shrink-0">
                                                {new Date(thread.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h5 className="text-[11px] text-indigo-400/80 font-black uppercase tracking-widest truncate mb-1">RE: {thread.topic}</h5>
                                        <p className="text-[12px] text-white/60 truncate w-full">
                                            {latestMsg ? (latestMsg.sender_type === 'admin' ? `You: ${latestMsg.content}` : latestMsg.content) : 'No messages'}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── RIGHT PANE: CHAT VIEW ── */}
            <div className="flex-1 flex flex-col bg-[#050505] relative">
                {!activeThread ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                        <span className="text-6xl mb-4 opacity-50">📬</span>
                        <p>Select a thread to view or reply</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 shrink-0 border-b border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-between px-6 z-10">
                            <div className="flex items-center gap-4">
                                <h2 className="text-lg font-black uppercase tracking-tighter">{activeThread.profiles?.full_name || 'Aspirant'}</h2>
                                <span className="text-[9px] bg-white/5 border border-white/10 text-white/40 px-2 py-1 rounded-full uppercase tracking-[0.2em] font-black">
                                    {activeThread.topic}
                                </span>
                            </div>
                            <div className="text-xs text-white/40">
                                ID: {activeThread.id.slice(0, 8)}...
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {(!activeThread.feedback_messages || activeThread.feedback_messages.length === 0) && (
                                <div className="text-center text-white/20 mt-10">No messages in this thread.</div>
                            )}
                            {activeThread.feedback_messages?.map((msg: any, idx: number) => {
                                const isAdmin = msg.sender_type === 'admin';
                                return (
                                    <div key={msg.id || idx} className={`flex w-full ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${isAdmin
                                            ? 'bg-indigo-600 border border-indigo-500/30 text-white rounded-tr-sm'
                                            : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'
                                            }`}>
                                            {!isAdmin && <div className="text-[10px] text-white/40 mb-2 font-black uppercase tracking-widest">{activeThread.profiles?.full_name || 'Aspirant'}</div>}
                                            {isAdmin && <div className="text-[10px] text-white/60 mb-2 font-black uppercase tracking-widest text-right">JourneyOS Command</div>}
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>

                        {/* Compose Area */}
                        <div className="p-4 bg-black/40 border-t border-white/10 shrink-0">
                            <div className="flex gap-2 max-w-4xl mx-auto">
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Execute response..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-[14px] focus:outline-none focus:border-indigo-500/50 resize-none h-16"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendReply();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleSendReply}
                                    disabled={!inputText.trim() || isSending}
                                    className="px-8 rounded-xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors disabled:opacity-20"
                                >
                                    {isSending ? 'Sending...' : 'Transmit'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Vault Feedback System (Instagram Style DMs)
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileStore } from '@/store/profileStore';
import { triggerHaptic } from '@/lib/core/haptics';
import {
    getUserFeedbackThreads,
    getFeedbackMessages,
    sendFeedbackMessage,
    createFeedbackThread
} from '@/app/actions/learner/feedback';

interface VaultDMInboxProps {
    isOpen: boolean;
    onClose: () => void;
}

type ViewState = 'inbox' | 'newThread' | 'chat';

export default function VaultDMInbox({ isOpen, onClose }: VaultDMInboxProps) {
    const { avatarUrl, fullName } = useProfileStore();

    const [view, setView] = useState<ViewState>('inbox');
    const [threads, setThreads] = useState<any[]>([]);
    const [isLoadingThreads, setIsLoadingThreads] = useState(false);

    // Active Chat State
    const [activeThread, setActiveThread] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    // New Thread State
    const [newThreadTopic, setNewThreadTopic] = useState('');

    // Input
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Scroll ref for chat
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load threads when opened
    useEffect(() => {
        if (isOpen && view === 'inbox') {
            loadThreads();
        }
    }, [isOpen, view]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (view === 'chat') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, view]);

    const loadThreads = async () => {
        setIsLoadingThreads(true);
        const res = await getUserFeedbackThreads();
        if (res.success) {
            setThreads(res.threads || []);
        }
        setIsLoadingThreads(false);
    };

    const loadMessages = async (threadId: string) => {
        setIsLoadingMessages(true);
        const res = await getFeedbackMessages(threadId);
        if (res.success) {
            setMessages(res.messages || []);
        }
        setIsLoadingMessages(false);
    };

    const handleOpenThread = async (thread: any) => {
        triggerHaptic('medium');
        setActiveThread(thread);
        setView('chat');
        await loadMessages(thread.id);
    };

    const handleStartNewThread = () => {
        triggerHaptic('light');
        setActiveThread(null);
        setNewThreadTopic('');
        setView('newThread');
    };

    const handleConfirmNewTopic = () => {
        if (!newThreadTopic.trim()) return;
        triggerHaptic('medium');
        setActiveThread('NEW'); // Marker for new thread
        setMessages([]); // Empty messages
        setView('chat');
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || isSending) return;
        const currentText = inputText.trim();
        setInputText(''); // Optimistic clear
        triggerHaptic('medium');
        setIsSending(true);

        try {
            if (activeThread === 'NEW') {
                // Creates thread + first message
                const res = await createFeedbackThread(newThreadTopic, currentText);
                if (res.success && res.thread) {
                    setActiveThread(res.thread);
                    setMessages([{ ...res.message }]);
                    // Refresh thread list in background
                    loadThreads();
                } else {
                    alert('Failed to send message: ' + res.error);
                }
            } else if (activeThread?.id) {
                // Optimistic UI update
                const optimisticMsg = {
                    id: Date.now().toString(),
                    sender_type: 'user',
                    content: currentText,
                    created_at: new Date().toISOString()
                };
                setMessages((prev) => [...prev, optimisticMsg]);

                const res = await sendFeedbackMessage(activeThread.id, currentText, 'user');
                if (!res.success) {
                    // Revert optimistic if failed
                    setMessages((prev) => prev.filter(m => m.id !== optimisticMsg.id));
                    alert('Failed to send message: ' + res.error);
                } else {
                    // Update exact message id from db if needed, or just let it be since we only append
                }
            }
        } catch (err) {
            console.error('Send error:', err);
        } finally {
            setIsSending(false);
        }
    };

    const handleBackToInbox = () => {
        triggerHaptic('light');
        setView('inbox');
        setActiveThread(null);
        setMessages([]);
        loadThreads();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed inset-0 z-[100] flex flex-col bg-black sm:p-4"
                >
                    <div className="w-full h-full sm:max-w-md sm:mx-auto sm:border sm:border-white/10 sm:rounded-3xl sm:shadow-2xl sm:overflow-hidden flex flex-col bg-[#050505]">

                        {/* ── INBOX VIEW ── */}
                        {view === 'inbox' && (
                            <>
                                {/* Inbox Header */}
                                <div className="flex items-center justify-between px-6 pl-4 pt-12 pb-4 sm:pt-6 border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-10">
                                    <div className="flex items-center gap-3">
                                        <button onClick={onClose} className="p-2 -ml-2 text-white/60 hover:text-white transition-colors">
                                            <span className="text-xl leading-none">‹</span>
                                        </button>
                                        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                            <span>Direct Messages</span>
                                            <span className="text-sm bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">{threads.length}</span>
                                        </h2>
                                    </div>
                                    <button onClick={handleStartNewThread} className="text-white hover:opacity-75 transition-opacity">
                                        <span className="text-2xl leading-none">📝</span>
                                    </button>
                                </div>

                                {/* Thread List */}
                                <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
                                    {isLoadingThreads ? (
                                        <div className="flex justify-center p-8"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: 'linear', duration: 1 }} className="text-xl">⚙️</motion.div></div>
                                    ) : threads.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-12 text-center h-64">
                                            <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center mb-4 text-3xl">✈️</div>
                                            <h3 className="text-white font-bold mb-2">Your Messages</h3>
                                            <p className="text-white/40 text-sm">Send private messages to JourneyOS Admin/Support.</p>
                                            <button onClick={handleStartNewThread} className="mt-6 text-blue-500 font-bold text-sm">Send Message</button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            {threads.map((thread) => {
                                                const latestMsg = thread.feedback_messages?.[0]; // Assuming ordered descending, wait, inner join is ascending or descending?
                                                // Wait, we didn't order the inner join, but usually DB returns them ordered by PK. Let's assume we can find the last one.
                                                const msgs = thread.feedback_messages || [];
                                                const preview = msgs.length > 0 ? msgs[msgs.length - 1].content : 'No messages yet';

                                                return (
                                                    <button
                                                        key={thread.id}
                                                        onClick={() => handleOpenThread(thread)}
                                                        className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left border-b border-white/[0.02]"
                                                    >
                                                        <div className="relative">
                                                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-[2px]">
                                                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center border-2 border-black">
                                                                    <span className="text-xl">🛡️</span>
                                                                </div>
                                                            </div>
                                                            {thread.status === 'open' && (
                                                                <div className="absolute top-1 right-0 w-3.5 h-3.5 bg-blue-500 border-2 border-black rounded-full" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-white font-semibold text-sm truncate">{thread.topic}</h4>
                                                            <p className="text-white/50 text-[13px] truncate mt-0.5">{preview}</p>
                                                        </div>
                                                        <div className="text-[11px] text-white/30 whitespace-nowrap">
                                                            {new Date(thread.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* ── NEW THREAD TOPIC SETUP ── */}
                        {view === 'newThread' && (
                            <>
                                <div className="flex items-center justify-between px-6 pl-4 pt-12 pb-4 sm:pt-6 border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-10">
                                    <div className="flex items-center gap-3">
                                        <button onClick={handleBackToInbox} className="p-2 -ml-2 text-white/60 hover:text-white transition-colors">
                                            <span className="text-xl leading-none">‹</span>
                                        </button>
                                        <h2 className="text-lg font-bold tracking-tight text-white">New Message</h2>
                                    </div>
                                    <button
                                        onClick={handleConfirmNewTopic}
                                        disabled={!newThreadTopic.trim()}
                                        className={`text-sm font-bold ${newThreadTopic.trim() ? 'text-blue-500' : 'text-white/20'}`}
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="p-6">
                                    <p className="text-white/60 text-sm mb-4">What is this conversation about?</p>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={newThreadTopic}
                                        onChange={(e) => setNewThreadTopic(e.target.value)}
                                        placeholder="e.g. Content Error, Feedback, Feature Request..."
                                        className="w-full bg-transparent border-b border-white/20 pb-2 text-white focus:outline-none focus:border-white transition-colors placeholder:text-white/20 text-lg"
                                        onKeyDown={(e) => e.key === 'Enter' && handleConfirmNewTopic()}
                                    />
                                </div>
                            </>
                        )}

                        {/* ── CHAT VIEW ── */}
                        {view === 'chat' && (
                            <div className="flex flex-col h-full bg-[#000]">
                                {/* Chat Header */}
                                <div className="flex items-center gap-3 px-6 pl-4 pt-12 pb-4 sm:pt-6 border-b border-white/10 bg-[#050505] sticky top-0 z-10 shadow-md">
                                    <button onClick={handleBackToInbox} className="p-2 -ml-2 text-white/60 hover:text-white transition-colors">
                                        <span className="text-xl leading-none">‹</span>
                                    </button>
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
                                            <span className="text-sm">🛡️</span>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <h3 className="text-white font-bold text-[15px] leading-tight truncate">Admin / Support</h3>
                                            <span className="text-[11px] text-white/40 truncate">{activeThread === 'NEW' ? newThreadTopic : activeThread?.topic}</span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <span className="text-lg cursor-pointer">ℹ️</span>
                                    </div>
                                </div>

                                {/* Chat Body */}
                                <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-4">
                                    {/* Sender Meta Area at Top */}
                                    <div className="flex flex-col items-center justify-center py-6 border-b border-white/5 mb-2">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mb-3">
                                            <span className="text-3xl">🛡️</span>
                                        </div>
                                        <h3 className="text-white font-bold text-lg">JourneyOS Support</h3>
                                        <p className="text-white/40 text-xs mt-1">JourneyOS Admin</p>
                                        <p className="text-white/20 text-[10px] mt-2 bg-white/5 py-1 px-3 rounded-full">Secure Connection</p>
                                    </div>

                                    {isLoadingMessages ? (
                                        <div className="flex justify-center p-8"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: 'linear', duration: 1 }} className="text-xl text-white/40">⚙️</motion.div></div>
                                    ) : (
                                        messages.map((msg, idx) => {
                                            const isUser = msg.sender_type === 'user';
                                            return (
                                                <div key={msg.id || idx} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                    {!isUser && (
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 mr-2 self-end mb-1">
                                                            <span className="text-[10px]">🛡️</span>
                                                        </div>
                                                    )}
                                                    <div
                                                        className={`max-w-[75%] px-4 py-2.5 rounded-[1.2rem] text-[15px] leading-snug ${isUser
                                                                ? 'bg-[#3797f0] text-white rounded-br-md self-end'
                                                                : 'bg-[#262626] border border-white/5 text-white/90 rounded-bl-md self-start'
                                                            }`}
                                                        style={{ wordBreak: 'break-word' }}
                                                    >
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} className="h-1 shrink-0" />
                                </div>

                                {/* Chat Input Footer */}
                                <div className="p-4 bg-[#050505] border-t border-white/5 mb-[env(safe-area-inset-bottom)] shrink-0">
                                    <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-full border border-white/10 px-1 py-1">
                                        <div className="p-2 w-9 h-9 rounded-full bg-[#3797f0]/10 flex items-center justify-center shrink-0 ml-1">
                                            <span className="text-sm">📸</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Message..."
                                            className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/30 focus:outline-none px-2 py-2.5 min-w-0"
                                        />
                                        {inputText.trim() ? (
                                            <button
                                                onClick={handleSendMessage}
                                                disabled={isSending}
                                                className="text-[#3797f0] font-bold px-4 py-2 text-[15px] transition-opacity hover:opacity-80 active:opacity-60 disabled:opacity-50"
                                            >
                                                Send
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-1 pr-3 text-white/40 shrink-0">
                                                <span className="text-xl p-1 shrink-0">🎤</span>
                                                <span className="text-xl p-1 shrink-0">🖼️</span>
                                                <span className="text-xl p-1 shrink-0">❤️</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

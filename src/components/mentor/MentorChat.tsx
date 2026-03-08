'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Mentor Chat Component
// Human-centric strategic UPSC guidance system
// ═══════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/lib/core/haptics';
import { askMentor, getMentorConversations, getMentorMessages, createMentorConversation, deleteMentorConversation, updateConversationTags } from '@/app/actions/learner/mentor';
import { useProfileStore } from '@/store/profileStore';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'mentor';
    timestamp: Date;
}

export default function MentorChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { avatarUrl } = useProfileStore();
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [editTags, setEditTags] = useState({ subject: '', topic: '' });
    const scrollRef = useRef<HTMLDivElement>(null);

    // ── Load History ──
    useEffect(() => {
        if (isOpen) {
            loadConversations();
        }
    }, [isOpen]);

    const loadConversations = async () => {
        const res = await getMentorConversations();
        if (res.success && res.conversations) {
            setConversations(res.conversations);
            // Auto-select latest if no active
            if (!activeConversationId && res.conversations.length > 0) {
                switchConversation(res.conversations[0].id);
            }
        }
    };

    const switchConversation = async (id: string) => {
        setActiveConversationId(id);
        triggerHaptic('light');
        const res = await getMentorMessages(id);
        if (res.success && res.messages) {
            setMessages(res.messages.map((m: any) => ({
                id: m.id,
                text: m.content,
                sender: m.role,
                timestamp: new Date(m.created_at)
            })));
        }
        if (window.innerWidth < 640) setShowHistory(false);
    };

    const handleNewChat = () => {
        setActiveConversationId(null);
        setMessages([]);
        setShowHistory(false);
        setIsEditingTags(false);
        triggerHaptic('medium');
    };

    const handleUpdateTags = async () => {
        if (!activeConversationId) return;
        const res = await updateConversationTags(activeConversationId, editTags.subject, editTags.topic);
        if (res.success) {
            setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, subject: editTags.subject, topic: editTags.topic } : c));
            setIsEditingTags(false);
            triggerHaptic('medium');
        }
    };

    const activeConv = conversations.find(c => c.id === activeConversationId);

    useEffect(() => {
        if (activeConv) {
            setEditTags({ subject: activeConv.subject || '', topic: activeConv.topic || '' });
        }
    }, [activeConversationId, activeConv]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const fakeId = Date.now().toString();
        const userMsg: Message = {
            id: fakeId,
            text: input,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);
        triggerHaptic('light');

        try {
            const res = await askMentor(input, activeConversationId || undefined);
            if (res.success) {
                const mentorMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: res.answer,
                    sender: 'mentor',
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, mentorMsg]);

                // If it was a new chat, update the active ID and refresh history list
                if (!activeConversationId) {
                    setActiveConversationId(res.conversationId);
                    loadConversations();
                }
            } else {
                throw new Error(res.error);
            }
            triggerHaptic('medium');
        } catch (err) {
            console.error(err);
            const errMsg: Message = {
                id: (Date.now() + 2).toString(),
                text: "Kshama chahta hoon, lagta hai signal mein kuch issue hai. Phir se try karen?",
                sender: 'mentor',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errMsg]);
        } finally {
            setIsTyping(false);
        }
    };

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
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
                    />

                    {/* Chat Panel */}
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[800px] h-[90vh] sm:h-[650px] bg-[#0b0e17] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] z-[101] flex flex-row shadow-2xl overflow-hidden"
                    >
                        {/* ── Sidebar (History) ── */}
                        <AnimatePresence>
                            {(showHistory || window.innerWidth >= 640) && (
                                <motion.div
                                    initial={{ x: -300 }}
                                    animate={{ x: 0 }}
                                    exit={{ x: -300 }}
                                    className={`absolute sm:relative z-20 w-[260px] h-full bg-[#07090f] border-r border-white/5 flex flex-col transition-all overflow-hidden ${!showHistory && 'hidden sm:flex'}`}
                                >
                                    <div className="p-5 border-b border-white/5">
                                        <button
                                            onClick={handleNewChat}
                                            className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-[11px] font-black text-white/60 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            <span>+</span> New Strategy Session
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-4 ml-2">Recent Sessions</p>
                                        {conversations.map((conv) => (
                                            <button
                                                key={conv.id}
                                                onClick={() => switchConversation(conv.id)}
                                                className={`w-full text-left p-3 rounded-xl transition-all group relative ${activeConversationId === conv.id ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5'}`}
                                            >
                                                <p className={`text-[11px] font-bold truncate pr-6 ${activeConversationId === conv.id ? 'text-indigo-400' : 'text-white/40 group-hover:text-white/60'}`}>
                                                    {conv.title}
                                                </p>
                                                {conv.subject && (
                                                    <div className="flex items-center gap-1 mt-1.5">
                                                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-white/5 text-white/30 uppercase tracking-tighter border border-white/5">{conv.subject}</span>
                                                        <span className="text-[8px] text-white/10 uppercase tracking-tighter">/</span>
                                                        <span className="text-[8px] font-bold text-white/20 truncate max-w-[100px] uppercase tracking-tighter">{conv.topic}</span>
                                                    </div>
                                                )}
                                                <p className="text-[9px] text-white/10 mt-1 font-medium italic">
                                                    {new Date(conv.updated_at).toLocaleDateString()}
                                                </p>
                                                {activeConversationId === conv.id && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="p-5 border-t border-white/5 bg-black/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 overflow-hidden">
                                                {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-xs">👤</span>}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white tracking-widest uppercase">Officer</p>
                                                <p className="text-[8px] text-white/30 uppercase tracking-tighter">Active Duty</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Main Chat Area ── */}
                        <div className="flex-1 flex flex-col relative bg-[#0b0e17]">
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-xl">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setShowHistory(!showHistory)}
                                        className="sm:hidden w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40"
                                    >
                                        📜
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                            <span className="text-xl">🎓</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-black text-white tracking-widest uppercase" style={{ fontFamily: 'var(--font-outfit)' }}>UPSC Mentor</h3>
                                                {activeConv && !isEditingTags && (
                                                    <button
                                                        onClick={() => setIsEditingTags(true)}
                                                        className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-black text-white/20 hover:text-indigo-400 hover:border-indigo-400/30 transition-all uppercase tracking-widest"
                                                    >
                                                        {activeConv.subject ? `${activeConv.subject} • ${activeConv.topic}` : 'Add Tag'}
                                                    </button>
                                                )}
                                            </div>
                                            {isEditingTags ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <input
                                                        value={editTags.subject}
                                                        onChange={(e) => setEditTags({ ...editTags, subject: e.target.value })}
                                                        placeholder="Subject"
                                                        className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[9px] text-indigo-400 focus:outline-none w-24"
                                                    />
                                                    <input
                                                        value={editTags.topic}
                                                        onChange={(e) => setEditTags({ ...editTags, topic: e.target.value })}
                                                        placeholder="Topic"
                                                        className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[9px] text-indigo-400 focus:outline-none w-32"
                                                    />
                                                    <button onClick={handleUpdateTags} className="text-[10px] text-indigo-400 hover:scale-110 transition-all">✓</button>
                                                    <button onClick={() => setIsEditingTags(false)} className="text-[10px] text-white/20 hover:scale-110 transition-all">✕</button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                                    <span className="text-[9px] text-white/40 font-bold tracking-widest uppercase">Intelligence Link Active</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all hover:bg-white/10 active:scale-90"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Messages Area */}
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 no-scrollbar h-full bg-grid-white/[0.02]"
                            >
                                {messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                                        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl grayscale">🎓</div>
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-black text-white tracking-widest uppercase">New Strategy Briefing</h4>
                                            <p className="text-[11px] max-w-[200px] leading-relaxed">Poochiye, kya help karoon? Syllabus path, topic analysis ya strategic guidance?</p>
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[85%] p-5 rounded-2xl text-[14px] leading-relaxed relative ${msg.sender === 'user'
                                                ? 'bg-white/10 text-white rounded-tr-none border border-white/5 shadow-xl'
                                                : 'bg-white/[0.03] text-white/90 rounded-tl-none border border-white/10 shadow-[0_4px_30px_rgba(99,102,241,0.02)]'
                                                }`}>
                                                <div className="whitespace-pre-wrap">{msg.text}</div>
                                                <p className="text-[8px] text-white/20 mt-3 font-bold uppercase tracking-widest text-right">
                                                    {msg.sender === 'mentor' ? 'Strategic Intel' : 'Officer Query'}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/[0.03] p-5 rounded-2xl rounded-tl-none border border-white/10">
                                            <div className="flex gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-indigo-500/60 rounded-full animate-bounce" />
                                                <span className="w-1.5 h-1.5 bg-indigo-500/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                <span className="w-1.5 h-1.5 bg-indigo-500/60 rounded-full animate-bounce [animation-delay:0.4s]" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-6 sm:p-8 bg-black/60 border-t border-white/5 backdrop-blur-3xl">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                    className="relative max-w-2xl mx-auto"
                                >
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask for strategy, concept depth, or analysis..."
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-7 pr-16 text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/40 transition-all shadow-2xl focus:bg-white/[0.05]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isTyping}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-indigo-500 text-white flex items-center justify-center disabled:opacity-20 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/10"
                                    >
                                        <span className="text-xl">⚡</span>
                                    </button>
                                </form>
                                <p className="text-[9px] text-center text-white/20 mt-6 font-black tracking-[0.3em] uppercase">
                                    Neural Architecture — V2.5 PERSISTENT
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

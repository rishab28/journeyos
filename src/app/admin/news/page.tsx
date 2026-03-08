'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Admin News RSS Engine
// Auto-pulls from The Hindu, IE, TOI, BBC, AJ every 4 hours
// Manual Run Now button for immediate sync
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const RSS_SOURCES = [
    { name: 'The Hindu', url: 'https://www.thehindu.com/feeder/default.rss', icon: '📰' },
    { name: 'Indian Express', url: 'https://indianexpress.com/feed/', icon: '🗞️' },
    { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms', icon: '📄' },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', icon: '🌍' },
    { name: 'BBC South Asia', url: 'http://feeds.bbci.co.uk/news/world/asia/rss.xml', icon: '🎙️' },
];

interface SyncResult {
    success: boolean;
    count?: number;
    error?: string;
    timestamp?: string;
}

export default function AdminNewsPage() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastResult, setLastResult] = useState<SyncResult | null>(null);
    const [nextSyncIn, setNextSyncIn] = useState<string>('');
    const [recentStories, setRecentStories] = useState<any[]>([]);
    const [isLoadingStories, setIsLoadingStories] = useState(true);

    // Fetch recent stories from DB
    const fetchRecentStories = async () => {
        setIsLoadingStories(true);
        try {
            const res = await fetch('/api/admin/recent-stories');
            if (res.ok) {
                const data = await res.json();
                setRecentStories(data.stories || []);
            }
        } catch (_) { }
        setIsLoadingStories(false);
    };

    useEffect(() => {
        fetchRecentStories();

        // Calculate next auto-sync (every 4h from last sync stored in localStorage)
        const updateCountdown = () => {
            const lastSync = localStorage.getItem('lastStoriesSync');
            if (lastSync) {
                const next = new Date(lastSync).getTime() + 4 * 60 * 60 * 1000;
                const diff = next - Date.now();
                if (diff > 0) {
                    const h = Math.floor(diff / 3600000);
                    const m = Math.floor((diff % 3600000) / 60000);
                    setNextSyncIn(`${h}h ${m}m`);
                } else {
                    setNextSyncIn('Sync due!');
                    // Auto trigger if overdue
                    triggerSync(true);
                }
            } else {
                setNextSyncIn('Never synced');
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000);
        return () => clearInterval(interval);
    }, []);

    const triggerSync = async (auto = false) => {
        if (isSyncing) return;
        setIsSyncing(true);
        if (!auto) toast.loading('Pulling RSS feeds & classifying with AI...', { id: 'rss-sync' });

        try {
            const res = await fetch('/api/cron/stories');
            const data = await res.json();

            localStorage.setItem('lastStoriesSync', new Date().toISOString());
            setLastResult({ ...data, timestamp: new Date().toISOString() });

            if (data.success) {
                toast.success(`✅ Synced! ${data.count} new UPSC stories saved.`, { id: 'rss-sync' });
                fetchRecentStories();
            } else {
                toast.error(data.error || 'Sync failed', { id: 'rss-sync' });
            }
        } catch (err: any) {
            toast.error('Network error: ' + err.message, { id: 'rss-sync' });
            setLastResult({ success: false, error: err.message });
        } finally {
            setIsSyncing(false);
        }
    };

    const subjectColor: Record<string, string> = {
        Polity: 'bg-blue-500/20 text-blue-400',
        Economy: 'bg-emerald-500/20 text-emerald-400',
        Environment: 'bg-green-500/20 text-green-400',
        Science: 'bg-cyan-500/20 text-cyan-400',
        History: 'bg-amber-500/20 text-amber-400',
        Geography: 'bg-orange-500/20 text-orange-400',
        'Current Affairs': 'bg-purple-500/20 text-purple-400',
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 font-sans pb-32">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-start justify-between border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-widest text-white mb-2">
                            🗞️ RSS News <span className="text-white/20">Engine</span>
                        </h1>
                        <p className="text-white/40 text-xs font-black uppercase tracking-widest mt-1">Intelligent Extraction Matrix</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <motion.button
                            onClick={() => triggerSync()}
                            disabled={isSyncing}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-3 shadow-[0_4px_20px_rgba(79,70,229,0.2)]"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isSyncing ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <span>Execute Pulse Sync</span>
                                    <span>⚡</span>
                                </>
                            )}
                        </motion.button>
                        <span className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-black">
                            Auto-Pulse: {nextSyncIn || 'SYNCHRONIZING...'}
                        </span>
                    </div>
                </div>

                {/* RSS Sources Status */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6">
                    <h2 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Live Sources (Every 4h)</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {RSS_SOURCES.map((src) => (
                            <div key={src.name} className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-2xl p-4">
                                <span className="text-xl">{src.icon}</span>
                                <div>
                                    <p className="text-xs font-bold text-white/80">{src.name}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] text-emerald-400/70 uppercase tracking-widest font-bold">Active</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Last Sync Result */}
                <AnimatePresence>
                    {lastResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`border rounded-3xl p-6 ${lastResult.success ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{lastResult.success ? '✅' : '❌'}</span>
                                <div>
                                    <p className="font-bold text-sm">
                                        {lastResult.success ? `${lastResult.count} new stories saved` : 'Sync failed'}
                                    </p>
                                    {lastResult.error && <p className="text-xs text-red-400 mt-1">{lastResult.error}</p>}
                                    {lastResult.timestamp && (
                                        <p className="text-[10px] text-white/30 mt-1">
                                            {new Date(lastResult.timestamp).toLocaleTimeString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Recent Stories (from DB) */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-black uppercase tracking-widest text-white/40">Recent Stories in DB</h2>
                        <button onClick={fetchRecentStories} className="text-[10px] text-white/30 hover:text-white uppercase tracking-widest transition-colors">
                            Refresh ↺
                        </button>
                    </div>
                    {isLoadingStories ? (
                        <div className="text-center py-8 text-white/20 text-[10px] uppercase tracking-widest">Loading...</div>
                    ) : recentStories.length === 0 ? (
                        <div className="border border-dashed border-white/10 rounded-3xl p-12 text-center">
                            <p className="text-white/20 text-sm">No stories yet. Click "Run Now" to pull from RSS sources.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentStories.map((story) => (
                                <div key={story.id} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${subjectColor[story.subject] || 'bg-white/10 text-white/40'}`}>
                                                {story.subject}
                                            </span>
                                            <span className="text-[9px] text-white/20 uppercase tracking-widest">
                                                {story.metadata?.source || 'Unknown'}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-white/90 leading-snug line-clamp-2">{story.title}</p>
                                        <p className="text-[10px] text-white/30 mt-1 uppercase tracking-widest">{story.syllabus_topic}</p>
                                    </div>
                                    {story.source_url && (
                                        <a
                                            href={story.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 hover:text-white hover:border-white/30 transition-colors uppercase tracking-widest"
                                        >
                                            Source →
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

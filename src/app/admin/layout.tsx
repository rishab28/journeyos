import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'JourneyOS Admin',
    description: 'Content Engine — Admin Dashboard',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // ── Admin Auth Guard ──
    // Check if the current user is an admin via profiles.is_admin
    // Falls back to allowing access if auth is not yet configured (MVP grace period)
    let isAuthorized = false;

    try {
        const supabase = createServerSupabaseClient();

        // First, try to get the current user from the session
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Check if the user is an admin
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('user_id', user.id)
                .single();

            isAuthorized = profile?.is_admin === true;
        } else {
            // MVP Grace: If no auth is set up yet (no user logged in),
            // allow access so the founder can use the admin panel.
            // In production, flip this to false.
            isAuthorized = true;
        }
    } catch (error) {
        // If profiles table doesn't exist yet or any DB error,
        // allow access during MVP setup phase
        console.warn('[Admin Guard] Auth check failed, allowing MVP access:', error);
        isAuthorized = true;
    }

    if (!isAuthorized) {
        redirect('/');
    }

    return (
        <div className="min-h-screen bg-[#050508] text-white selection:bg-indigo-500/30 font-inter">
            {/* ── Ambient Tactical Layer ── */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
            <div className="fixed inset-0 z-0 pointer-events-none noise-overlay opacity-[0.03]" />
            <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-transparent via-[#050508]/50 to-[#050508]" />

            {/* ── Admin Tactical Top Bar ── */}
            <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#050508]/80 backdrop-blur-3xl">
                <div className="max-w-[1700px] mx-auto px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <a href="/admin" className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl glass-panel border-indigo-500/30 flex items-center justify-center text-xl group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                                🦅
                            </div>
                            <div className="hidden sm:block">
                                <p className="font-caps text-[9px] font-black text-indigo-400 tracking-[0.3em] uppercase mb-0.5">COMMAND CENTER</p>
                                <p className="font-caps text-[11px] font-black text-white uppercase tracking-widest">NEXUS PROTOCOL <span className="text-white/20 ml-2">v4.2.0</span></p>
                            </div>
                        </a>

                        <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />

                        <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {[
                                { label: 'WAR ROOM', href: '/admin/war-room', icon: '📡' },
                                { label: 'USERS', href: '/admin/users', icon: '👥' },
                                { label: 'VAULT', href: '/admin/vault', icon: '🗄️' },
                                { label: 'REVIEW', href: '/admin/review', icon: '✅' },
                                { label: 'INGEST', href: '/admin/ingest', icon: '📥' },
                                { label: 'PROCESS', href: '/admin/processor', icon: '⚙️' },
                                { label: 'ORACLE', href: '/admin/oracle', icon: '👁️' },
                                { label: 'NEWS', href: '/admin/news', icon: '📰' },
                                { label: 'TASKS', href: '/admin/tasks', icon: '⚡' },
                            ].map((tab) => (
                                <a
                                    key={tab.label}
                                    href={tab.href}
                                    className="px-5 py-2.5 rounded-2xl font-caps text-[10px] font-black uppercase tracking-[0.25em] text-white/30 hover:text-white hover:bg-white/[0.03] transition-all flex items-center gap-3 whitespace-nowrap border border-transparent hover:border-white/5"
                                >
                                    <span className="text-[14px] opacity-40">{tab.icon}</span>
                                    {tab.label}
                                </a>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-8">
                        {/* Terminal HUD Indicators */}
                        <div className="hidden lg:flex items-center gap-10">
                            <div className="flex flex-col items-end">
                                <span className="font-caps text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">NETWORK</span>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_#6366f1]" />
                                    <span className="font-caps text-[9px] font-black text-white/80 uppercase tracking-widest">SECURED</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="font-caps text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">PIPELINE</span>
                                <span className="font-caps text-[9px] font-black text-indigo-400 uppercase tracking-widest">ACTIVE</span>
                            </div>
                        </div>

                        <a href="/" className="px-6 py-2.5 rounded-2xl glass-panel border border-white/10 font-caps text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white hover:border-white/30 transition-all active:scale-95">
                            EXIT
                        </a>
                    </div>
                </div>
            </header>

            {/* ── Page Content ── */}
            <main className="relative z-10 max-w-[1600px] mx-auto px-6 py-10">
                {children}
            </main>
        </div>
    );
}


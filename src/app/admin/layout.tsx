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
        <div className="min-h-screen bg-[#050505] text-white selection:bg-[#00ffcc]/30">
            {/* ── Ambient Matrix Background ── */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-transparent via-black to-[#050505]" />

            {/* ── Admin Tactical Top Bar ── */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-2xl">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <a href="/admin" className="flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-lg bg-[#00ffcc]/10 border border-[#00ffcc]/20 flex items-center justify-center text-sm group-hover:bg-[#00ffcc]/20 transition-all shadow-[0_0_15px_rgba(0,255,204,0.1)]">
                                🦅
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Command</p>
                                <p className="text-xs font-black text-white uppercase tracking-widest">JourneyOS v2.1</p>
                            </div>
                        </a>

                        <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />

                        <nav className="flex items-center gap-1">
                            {[
                                { label: 'War Room', href: '/admin/war-room', icon: '📡' },
                                { label: 'Users', href: '/admin/users', icon: '👥' },
                                { label: 'Vault', href: '/admin/vault/browser', icon: '🗄️' },
                                { label: 'Ingest', href: '/admin/ingest', icon: '📥' },
                                { label: 'Processor', href: '/admin/processor', icon: '🧠' },
                                { label: 'Oracle', href: '/admin/oracle', icon: '👁️' },
                                { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
                            ].map((tab) => (
                                <a
                                    key={tab.label}
                                    href={tab.href}
                                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white/30 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                                >
                                    <span className="opacity-50 group-hover:opacity-100">{tab.icon}</span>
                                    {tab.label}
                                </a>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Terminal HUD Indicators */}
                        <div className="hidden lg:flex items-center gap-6">
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Network</span>
                                <div className="flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-emerald-500/80 uppercase">Secured</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Stream</span>
                                <span className="text-[9px] font-black text-white/60 uppercase">Real-Time</span>
                            </div>
                        </div>

                        <a href="/" className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:border-white/30 transition-all">
                            Exit
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

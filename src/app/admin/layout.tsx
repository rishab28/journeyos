import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
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
        <div className="min-h-screen bg-[#0b0e17] text-white">
            {/* ── Admin Top Bar ── */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0b0e17]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <a href="/" className="text-white/40 hover:text-white/70 transition-colors text-sm">
                            ← Study
                        </a>
                        <span className="text-white/10">|</span>
                        <span className="text-sm font-semibold text-white/80 tracking-wide">
                            ADMIN
                        </span>
                    </div>
                    <nav className="flex items-center gap-4">
                        <a href="/admin/ingest"
                            className="text-xs font-medium text-white/40 hover:text-violet-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                            📥 Ingest
                        </a>
                        <a href="/admin/sources"
                            className="text-xs font-medium text-white/40 hover:text-blue-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                            📚 Sources
                        </a>
                        <a href="/admin/review"
                            className="text-xs font-medium text-white/40 hover:text-emerald-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                            ✅ Review
                        </a>
                        <a href="/admin/news"
                            className="text-xs font-medium text-white/40 hover:text-amber-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                            📰 News
                        </a>
                    </nav>
                </div>
            </header>

            {/* ── Page Content ── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {children}
            </main>
        </div>
    );
}

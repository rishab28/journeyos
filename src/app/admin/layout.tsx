import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'JourneyOS Admin',
    description: 'Content Engine — Admin Dashboard',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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

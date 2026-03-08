'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Clean Study Home (Zero Noise)
// Immersive full-screen study feed, nothing else
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import StudyFeed from '@/components/study/StudyFeed';
import { useSRSStore } from '@/store/srsStore';
import { useProgressStore } from '@/store/progressStore';
import GamifiedOnboarding from '@/components/onboarding/GamifiedOnboarding';
import { triggerHaptic } from '@/lib/core/haptics';
import StudyCardSkeleton from '@/components/study/StudyCardSkeleton';
import { GlassCard } from '@/components/ui/GlassCard';

import Link from 'next/link';
import MentorChat from '@/components/mentor/MentorChat';
import SyncStatusIndicator from '@/components/shared/SyncStatusIndicator';
import { getActiveStories } from '@/app/actions/learner';
import { CurrentAffairStory } from '@/types';
import { useProfileStore } from '@/store/profileStore';

export default function HomePage() {
  const totalCards = useSRSStore((s) => s.cards.length);
  const todayReviewed = useProgressStore((s) => s.todayReviewed);
  const currentStreak = useProgressStore((s) => s.currentStreak);
  const upscIQ = useProgressStore((s) => s.upscIQ);
  const { avatarUrl, fetchProfile } = useProfileStore();

  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [stories, setStories] = useState<CurrentAffairStory[]>([]);

  // Load Stories & Profile (Global)
  useEffect(() => {
    getActiveStories().then((res) => {
      if (res.success) setStories(res.stories);
    });
    fetchProfile();
  }, []);

  if (upscIQ === 0) {
    return <GamifiedOnboarding onComplete={() => window.location.reload()} />;
  }

  return (
    <main className="relative w-full h-screen overflow-hidden flex flex-col bg-[#050508]">
      {/* ── Ambient Background (Premium Orbs) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 noise-overlay opacity-[0.03] pointer-events-none" />
      </div>

      {/* ── Top Navigation Bar: Executive Command Center ── */}
      <div className="relative z-50 pt-14 pb-8 border-b border-white/[0.04] bg-black/40 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">

          {/* Left: Tactical Module (Profile) */}
          <Link href="/dashboard" className="group relative">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative w-12 h-12 rounded-full glass-panel border border-white/10 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-indigo-500/40 group-active:scale-95">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Neural Identity" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <span className="text-lg grayscale group-hover:grayscale-0 transition-all">👤</span>
              )}
            </div>
          </Link>

          {/* Center: System Status */}
          <div className="flex flex-col items-center group cursor-default">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse-fast shadow-[0_0_10px_#6366f1]" />
              <span className="font-caps text-[12px] font-black tracking-[0.4em] text-white/90 uppercase">
                NEURAL FEED
              </span>
            </div>
            <div className="mt-2.5 px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.05]">
              <p className="font-caps text-[8px] text-white/20 tracking-[0.2em] font-bold">MODE: SURGICAL FOCUS</p>
            </div>
          </div>

          {/* Right: Intelligence Module (Search) */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              setIsMentorOpen(true);
            }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative w-12 h-12 rounded-full glass-panel border border-white/10 flex items-center justify-center transition-all duration-500 group-hover:border-indigo-500/40 group-active:scale-95">
              <span className="text-lg opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all grayscale group-hover:grayscale-0">🔍</span>
            </div>
          </button>
        </div>

        {/* Sync Status Floating Tab */}
        <div className="absolute bottom-[-14px] left-1/2 -translate-x-1/2 z-10">
          <SyncStatusIndicator />
        </div>
      </div>

      {/* ── Main Immersive Area ── */}
      <div className="relative z-10 flex-1 min-h-0 overflow-hidden">
        <StudyFeed stories={stories} />
      </div>

      <MentorChat isOpen={isMentorOpen} onClose={() => setIsMentorOpen(false)} />
    </main >
  );
}

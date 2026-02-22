'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Clean Study Home (Zero Noise)
// Immersive full-screen study feed, nothing else
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import StudyFeed from '@/components/StudyFeed';
import { useSRSStore } from '@/store/srsStore';
import { useProgressStore } from '@/store/progressStore';
import GamifiedOnboarding from '@/components/GamifiedOnboarding';
import { triggerHaptic } from '@/lib/haptics';
import StudyCardSkeleton from '@/components/StudyCardSkeleton';

// Discovery Engine Imports
import CurrentAffairStories from '@/components/CurrentAffairStories';
import DiscoveryGrid from '@/components/DiscoveryGrid';
import VerticalReels from '@/components/VerticalReels';
import { getDiscoveryFeed } from '@/app/actions/getDiscoveryFeed';
import { getActiveStories } from '@/app/actions/getStories';
import { StudyCard, CurrentAffairStory } from '@/types';

export default function HomePage() {
  const totalCards = useSRSStore((s) => s.cards.length);
  const todayReviewed = useProgressStore((s) => s.todayReviewed);
  const currentStreak = useProgressStore((s) => s.currentStreak);
  const upscIQ = useProgressStore((s) => s.upscIQ);

  // Discovery / Explore State
  const [activeTab, setActiveTab] = useState<'study' | 'explore'>('study');

  const handleTabSwitch = (tab: 'study' | 'explore') => {
    if (activeTab === tab) return;
    triggerHaptic('light');
    setActiveTab(tab);
  };
  const [stories, setStories] = useState<CurrentAffairStory[]>([]);
  const [exploreCards, setExploreCards] = useState<StudyCard[]>([]);
  const [reelsStartId, setReelsStartId] = useState<string | null>(null);
  const [isLoadingExplore, setIsLoadingExplore] = useState(false);

  // Load Explore Data
  useEffect(() => {
    if (activeTab === 'explore' && exploreCards.length === 0) {
      setIsLoadingExplore(true);
      Promise.all([
        getActiveStories(),
        getDiscoveryFeed(20) // Initial batch size
      ]).then(([storiesRes, feedRes]) => {
        if (storiesRes.success) setStories(storiesRes.stories);
        if (feedRes.success) setExploreCards(feedRes.cards);
      }).finally(() => {
        setIsLoadingExplore(false);
      });
    }
  }, [activeTab, exploreCards.length]);

  if (upscIQ === 0) {
    return <GamifiedOnboarding onComplete={() => window.location.reload()} />;
  }

  return (
    <main className="relative w-full h-screen overflow-hidden flex flex-col bg-[#0b0e17]">
      {/* Ambient background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="bg-orb bg-orb-1 opacity-60" />
        <div className="bg-orb bg-orb-2 opacity-60" />
        <div className="bg-orb bg-orb-3 opacity-60" />
      </div>
      {/* ── Top Navigation Bar: Glass Blade (Standard Flow) ── */}
      <div className="relative z-50 flex flex-col pt-8 pb-4 bg-black/90 backdrop-blur-2xl border-b border-white/[0.05]">
        <div className="flex justify-center items-center gap-10 px-4">
          <button
            onClick={() => handleTabSwitch('study')}
            className="flex flex-col items-center group relative"
          >
            <span
              className={`text-sm font-black transition-all tracking-[0.25em] uppercase ${activeTab === 'study' ? 'text-white' : 'text-white/20 group-hover:text-white/50'}`}
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              Study
            </span>
            {activeTab === 'study' && (
              <motion.div
                layoutId="tabUnderline"
                className="w-1 h-1 rounded-full bg-[#00ffcc] mt-2 shadow-[0_0_12px_#00ffcc]"
              />
            )}
          </button>

          <button
            onClick={() => handleTabSwitch('explore')}
            className="flex flex-col items-center group relative"
          >
            <span
              className={`text-sm font-black transition-all tracking-[0.25em] uppercase ${activeTab === 'explore' ? 'text-white' : 'text-white/20 group-hover:text-white/50'}`}
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              Explore
            </span>
            {activeTab === 'explore' && (
              <motion.div
                layoutId="tabUnderline"
                className="w-1 h-1 rounded-full bg-[#00ffcc] mt-2 shadow-[0_0_12px_#00ffcc]"
              />
            )}
          </button>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="relative z-10 flex-1 min-h-0 overflow-hidden">
        {activeTab === 'study' ? (
          <StudyFeed />
        ) : (
          <div className="w-full h-full flex flex-col overflow-y-auto no-scrollbar pb-32 pt-6">
            {/* 1. Global Discovery Search (Instagram Style) */}
            <div className="px-6 mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-[#00ffcc]/5 rounded-2xl blur-xl group-focus-within:bg-[#00ffcc]/10 transition-all" />
                <div className="relative flex items-center bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 backdrop-blur-3xl group-focus-within:border-[#00ffcc]/30 transition-all">
                  <span className="text-xl mr-4 opacity-40 group-focus-within:opacity-100 transition-opacity">🔍</span>
                  <input
                    type="text"
                    placeholder="Search topics, subjects, or PYQs..."
                    className="bg-transparent border-none outline-none text-sm font-medium text-white placeholder:text-white/20 w-full"
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-[1px] h-4 bg-white/10" />
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">AI</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Category Chips (Trending Badges) */}
            <div className="flex gap-3 overflow-x-auto px-6 mb-8 no-scrollbar">
              {['Trending', 'For You', 'Polity', 'Economy', 'Science', 'Ethics', 'History'].map((cat, i) => (
                <button
                  key={cat}
                  className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${i === 0
                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                    : 'bg-white/[0.03] text-white/40 border-white/5 hover:border-white/20 hover:text-white'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 3. Stories Carousel */}
            {!isLoadingExplore && stories.length > 0 && (
              <div className="mb-8">
                <CurrentAffairStories stories={stories} />
              </div>
            )}

            {/* 4. Masonry Discovery Grid */}
            <div className="px-1">
              {isLoadingExplore ? (
                <div className="w-full px-5 columns-2 gap-4 space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="break-inside-avoid w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 min-h-[160px] animate-pulse" />
                  ))}
                </div>
              ) : (
                <DiscoveryGrid
                  cards={exploreCards}
                  onCardClick={(id: string) => setReelsStartId(id)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Full Screen Vertical Reels Overlay ── */}
      <AnimatePresence>
        {reelsStartId && (
          <VerticalReels
            cards={exploreCards}
            layoutIdStart={reelsStartId}
            onClose={() => setReelsStartId(null)}
          />
        )}
      </AnimatePresence>
    </main >
  );
}

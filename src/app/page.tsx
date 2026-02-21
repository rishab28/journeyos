'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Clean Study Home (Zero Noise)
// Immersive full-screen study feed, nothing else
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import StudyFeed from '@/components/StudyFeed';
import { useSRSStore } from '@/store/srsStore';
import { useProgressStore } from '@/store/progressStore';
import GamifiedOnboarding from '@/components/GamifiedOnboarding';

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

      {/* ── Top Navigation Bar ── */}
      <div className="absolute top-0 inset-x-0 z-50 flex flex-col pt-12 pb-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex justify-center items-center gap-6 px-4">
          <button
            onClick={() => setActiveTab('study')}
            className={`text-lg font-bold transition-all tracking-wider ${activeTab === 'study' ? 'text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-white/40 hover:text-white/80'}`}
            style={{ fontFamily: 'var(--font-outfit)' }}
          >
            STUDY
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`text-lg font-bold transition-all tracking-wider ${activeTab === 'explore' ? 'text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-white/40 hover:text-white/80'}`}
            style={{ fontFamily: 'var(--font-outfit)' }}
          >
            EXPLORE
          </button>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="relative z-10 flex-1 min-h-0 pt-24 overflow-y-auto scrollbar-none">
        {activeTab === 'study' ? (
          <StudyFeed />
        ) : (
          <div className="w-full pb-24">
            {/* 1. Stories Carousel */}
            {!isLoadingExplore && stories.length > 0 && (
              <CurrentAffairStories stories={stories} />
            )}

            {/* 2. Masonry Discovery Grid */}
            {isLoadingExplore ? (
              <div className="w-full py-20 flex flex-col items-center justify-center">
                <span className="text-3xl animate-bounce mb-4 block">🧠</span>
                <p className="text-white/40 text-sm font-bold animate-pulse">Scanning the void for intel...</p>
              </div>
            ) : (
              <DiscoveryGrid
                cards={exploreCards}
                onCardClick={(id: string) => setReelsStartId(id)}
              />
            )}
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
    </main>
  );
}

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

import CurrentAffairStories from '@/components/stories/CurrentAffairStories';
import TacticalNavigator from '@/components/navigation/TacticalNavigator';
import PracticeNavigator from '@/components/practice/PracticeNavigator';
import VerticalReels from '@/components/stories/VerticalReels';
import DuelSystem from '@/components/practice/DuelSystem';
import SquadDashboard from '@/components/squads/SquadDashboard';
import SyncStatusIndicator from '@/components/shared/SyncStatusIndicator';
import { getDiscoveryFeed, getActiveStories } from '@/app/actions/learner';
import { StudyCard, CurrentAffairStory } from '@/types';

export default function HomePage() {
  const totalCards = useSRSStore((s) => s.cards.length);
  const todayReviewed = useProgressStore((s) => s.todayReviewed);
  const currentStreak = useProgressStore((s) => s.currentStreak);
  const upscIQ = useProgressStore((s) => s.upscIQ);

  // Discovery / Explore / Practice / Squads State
  const [activeTab, setActiveTab] = useState<'study' | 'practice' | 'explore' | 'squads'>('study');

  const handleTabSwitch = (tab: 'study' | 'practice' | 'explore' | 'squads') => {
    if (activeTab === tab) return;
    triggerHaptic('light');
    setActiveTab(tab);
  };
  const [stories, setStories] = useState<CurrentAffairStory[]>([]);
  const [exploreCards, setExploreCards] = useState<StudyCard[]>([]);
  const [reelsStartId, setReelsStartId] = useState<string | null>(null);
  const [isLoadingExplore, setIsLoadingExplore] = useState(false);

  // Load Stories (Global)
  useEffect(() => {
    getActiveStories().then((res) => {
      if (res.success) setStories(res.stories);
    });
  }, []);

  // Load Explore Feed Data
  useEffect(() => {
    if (activeTab === 'explore' && exploreCards.length === 0) {
      setIsLoadingExplore(true);
      getDiscoveryFeed(20).then((feedRes) => {
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
      <div className="relative z-50 flex flex-col pt-10 pb-10 bg-black/95 backdrop-blur-3xl border-b border-white/[0.05]">
        <div className="absolute right-6 top-10 sm:right-10">
          <SyncStatusIndicator />
        </div>
        <div className="flex justify-center items-center gap-10 px-4 scale-90 sm:scale-100">
          <button
            onClick={() => handleTabSwitch('study')}
            className="flex flex-col items-center group relative"
          >
            <span
              className={`text-[10px] font-black transition-all tracking-[0.2em] uppercase ${activeTab === 'study' ? 'text-white' : 'text-white/20 group-hover:text-white/50'}`}
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
            onClick={() => handleTabSwitch('practice')}
            className="flex flex-col items-center group relative"
          >
            <span
              className={`text-[10px] font-black transition-all tracking-[0.2em] uppercase ${activeTab === 'practice' ? 'text-white' : 'text-white/20 group-hover:text-white/50'}`}
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              Practice
            </span>
            {activeTab === 'practice' && (
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
              className={`text-[10px] font-black transition-all tracking-[0.2em] uppercase ${activeTab === 'explore' ? 'text-white' : 'text-white/20 group-hover:text-white/50'}`}
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

          <button
            onClick={() => handleTabSwitch('squads')}
            className="flex flex-col items-center group relative"
          >
            <span
              className={`text-[10px] font-black transition-all tracking-[0.2em] uppercase ${activeTab === 'squads' ? 'text-white' : 'text-white/20 group-hover:text-white/50'}`}
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              Squads
            </span>
            {activeTab === 'squads' && (
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
          <StudyFeed stories={stories} />
        ) : activeTab === 'practice' ? (
          <div className="w-full h-full flex flex-col overflow-y-auto no-scrollbar pb-32 pt-6">
            {/* Phase 33: Battle Zone (Random Duel) */}
            <div className="px-6 mb-8">
              <div className="flex items-center gap-2 mb-4 px-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Battle Zone</h4>
              </div>
              <DuelSystem />
            </div>

            {/* 1. Practice Mission Navigator */}
            <div className="flex-1">
              <PracticeNavigator
                onMissionSelect={(id) => {
                  // Launch Practice Feed with random start
                  const randomId = exploreCards[Math.floor(Math.random() * exploreCards.length)]?.id;
                  if (randomId) setReelsStartId(randomId);
                }}
              />
            </div>
          </div>
        ) : activeTab === 'explore' ? (
          <div className="w-full h-full flex flex-col overflow-y-auto no-scrollbar pb-32 pt-6">
            {/* 1. Command Search (Floating Glass) */}
            <div className="px-6 mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-[#00ffcc]/5 rounded-2xl blur-xl group-focus-within:bg-[#00ffcc]/10 transition-all" />
                <GlassCard variant="default" className="relative flex items-center px-5 py-4 group-focus-within:border-[#00ffcc]/30">
                  <span className="text-xl mr-4 opacity-40 group-focus-within:opacity-100 transition-opacity">🔭</span>
                  <input
                    type="text"
                    placeholder="Search Intelligence, PYQs, or Topics..."
                    className="bg-transparent border-none outline-none text-sm font-medium text-white placeholder:text-white/20 w-full"
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-[1px] h-4 bg-white/10" />
                    <span className="text-[10px] font-black text-[#00ffcc] uppercase tracking-widest">Tactical</span>
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* 3. Tactical Aerial Navigator */}
            <div className="flex-1">
              {isLoadingExplore ? (
                <div className="px-6 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-full h-[180px] bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <TacticalNavigator onTopicSelect={() => handleTabSwitch('study')} />
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col overflow-y-auto no-scrollbar pb-32 pt-6">
            <SquadDashboard />
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

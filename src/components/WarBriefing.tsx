'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Voice-Enabled War Briefing
// 60-second AI audio strategy delivered at the start of the day.
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgressStore } from '@/store/progressStore';

export default function WarBriefing() {
    const { rankProbability, accuracy, currentStreak } = useProgressStore();
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasBriefedToday, setHasBriefedToday] = useState(false);

    const playBriefing = () => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            alert("Your browser does not support the Web Speech API.");
            return;
        }

        setIsPlaying(true);

        const text = `Good morning Commander. Your current Rank 1 probability is ${rankProbability}%. 
        Overall accuracy stands at ${accuracy}%. Your current streak is ${currentStreak} days. 
        Today's objective: Neutralize the blind spots in your Heat-Map of Ignorance. 
        Focus strictly on the 'Why' behind every concept. 
        Your cognitive stamina tracker is active. I will intervene if you burn out. Let's conquer the day.`;

        const msg = new SpeechSynthesisUtterance(text);

        // Try to find a good authoritative voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Samantha') || v.lang.includes('en-GB'));
        if (preferredVoice) msg.voice = preferredVoice;

        msg.rate = 1.05;
        msg.pitch = 0.9;

        msg.onend = () => {
            setIsPlaying(false);
            setHasBriefedToday(true);
        };

        window.speechSynthesis.speak(msg);
    };

    const stopBriefing = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        }
    };

    if (hasBriefedToday) return null;

    return (
        <div className="relative w-full max-w-lg mx-auto mb-6">
            <motion.button
                onClick={isPlaying ? stopBriefing : playBriefing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isPlaying
                        ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                        : 'bg-black/40 border-white/5 hover:bg-white/5'
                    }`}
            >
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="text-3xl">🎙️</div>
                        {isPlaying && (
                            <motion.div
                                className="absolute inset-0 bg-indigo-500 rounded-full mix-blend-screen"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                        )}
                    </div>
                    <div className="text-left">
                        <h4 className={`text-sm font-black uppercase tracking-widest ${isPlaying ? 'text-indigo-400' : 'text-white/80'}`}>
                            {isPlaying ? 'Broadcasting...' : 'Daily War Briefing'}
                        </h4>
                        <p className="text-xs text-white/40 mt-0.5">
                            {isPlaying ? 'Listen to today\'s Rank-1 strategy.' : 'Tap to initialize daily strategic audio-feed.'}
                        </p>
                    </div>
                </div>

                {/* Animated Audio Bars */}
                <div className="flex items-end gap-1 h-6">
                    {[1, 2, 3, 4].map((i) => (
                        <motion.div
                            key={i}
                            className={`w-1 rounded-t-sm ${isPlaying ? 'bg-indigo-400' : 'bg-white/20'}`}
                            animate={isPlaying ? { height: ['20%', '100%', '40%', '80%', '20%'] } : { height: '20%' }}
                            transition={isPlaying ? { duration: 0.8, repeat: Infinity, delay: i * 0.1 } : {}}
                        />
                    ))}
                </div>
            </motion.button>
        </div>
    );
}

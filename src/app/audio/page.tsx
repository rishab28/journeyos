'use client';

import { useState, useEffect, useRef } from 'react';
import { useSRSStore } from '@/store/srsStore';
import { motion } from 'framer-motion';

// Quick and dirty Web Speech implementations for Commuter Mode
export default function AudioMode() {
    const cards = useSRSStore(s => s.cards);
    const currentIndex = useSRSStore(s => s.currentIndex);
    const submitReview = useSRSStore(s => s.submitReview);
    const fetchLiveCards = useSRSStore(s => s.fetchLiveCards);

    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (cards.length === 0) fetchLiveCards();
    }, [cards.length, fetchLiveCards]);

    useEffect(() => {
        // Initialize SpeechRecognition if browser supports it
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-IN'; // Indian English dialect for UPSC

            recognitionRef.current.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                setIsListening(false);
                validateAnswerStatewise(text);
            };

            recognitionRef.current.onerror = () => {
                setIsListening(false);
                setFeedback("I couldn't hear that properly. Try again.");
            };
        }
    }, [currentIndex, cards]);

    const playQuestion = () => {
        if (cards.length === 0) return;
        const synth = window.speechSynthesis;
        if (synth.speaking) synth.cancel();

        setIsPlaying(true);
        const card = cards[currentIndex];
        const utterance = new SpeechSynthesisUtterance("Question. " + card.front);
        utterance.rate = 0.9;

        utterance.onend = () => setIsPlaying(false);
        synth.speak(utterance);
    };

    const startListening = () => {
        if (recognitionRef.current) {
            setTranscript('');
            setFeedback('');
            setIsListening(true);
            try {
                recognitionRef.current.start();
            } catch (e) {
                // If Already started, ignore
            }
        } else {
            setFeedback("Speech Recognition not supported in this browser.");
        }
    };

    const validateAnswerStatewise = async (spokenText: string) => {
        // Mock Gemini Validation: A quick keyword check to avoid calling Gemini for every simple audio swipe.
        // True robust validation should hit a server action, but for speed on front-end we fuzzy string match first.
        setFeedback("Analyzing your response...");
        const card = cards[currentIndex];

        // Simple fuzzy comparison
        const targetWords = card.back.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        let matchCount = 0;
        targetWords.forEach(w => {
            if (spokenText.toLowerCase().includes(w)) matchCount++;
        });

        const ratio = targetWords.length > 0 ? matchCount / targetWords.length : 1;

        setTimeout(() => {
            let msg = '';
            let recalled = false;
            if (ratio > 0.4) {
                msg = "Perfect! Marking as Correct ✅";
                recalled = true;
            } else {
                msg = "Not quite. The correct answer was: " + card.back + " ❌";
            }
            setFeedback(msg);

            // Speak it
            const synth = window.speechSynthesis;
            synth.cancel();
            synth.speak(new SpeechSynthesisUtterance(msg));

            // Auto advance
            setTimeout(() => {
                submitReview(card.id, recalled);
                setTranscript('');
                setFeedback('');
                playQuestion();
            }, 3000);
        }, 1000);
    };

    if (cards.length === 0) return <div className="p-10 text-white">Loading audio deck...</div>;
    const card = cards[currentIndex];

    return (
        <div className="w-full h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center" style={{ fontFamily: 'var(--font-outfit)' }}>
            <h1 className="text-2xl font-black text-amber-500 uppercase tracking-[0.2em] mb-2">Commuter Mode</h1>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-12">Audio-First Learning Expressway</p>

            <div className="w-full max-w-sm aspect-square rounded-full border border-white/10 flex flex-col items-center justify-center relative bg-white/[0.02]">
                <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-pulse" style={{ animationDuration: isPlaying ? '1s' : '3s' }} />

                <h2 className="text-xs text-blue-400 font-bold uppercase tracking-[0.3em] mb-4">Question {currentIndex + 1}</h2>
                <p className="text-lg text-white/90 px-4 leading-relaxed font-serif">"{card.front}"</p>
            </div>

            <div className="mt-12 space-x-4">
                <button
                    onClick={playQuestion}
                    disabled={isPlaying || isListening}
                    className="p-4 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
                >
                    ▶️ Play Audio
                </button>
                <button
                    onClick={startListening}
                    disabled={isPlaying || isListening}
                    className="p-4 px-8 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold hover:bg-rose-500/30 disabled:opacity-50 transition-all"
                >
                    {isListening ? '🎙️ Listening...' : '🎙️ Answer'}
                </button>
            </div>

            <div className="mt-10 h-24 max-w-md w-full border border-white/5 rounded-2xl bg-white/[0.01] p-4 text-left">
                <p className="text-xs text-white/20 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">Transcript</p>
                <p className="text-sm text-white/80">{transcript || <span className="text-white/20 italic">Speak to transcribe...</span>}</p>
            </div>

            {feedback && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-sm font-semibold text-emerald-400 max-w-xs">
                    {feedback}
                </motion.div>
            )}
        </div>
    );
}

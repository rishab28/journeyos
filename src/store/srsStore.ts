// ═══════════════════════════════════════════════════════════
// JourneyOS — SRS Store (SM2 Algorithm + Card Deck)
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import {
    StudyCard,
    CardType,
    Difficulty,
    Domain,
    CardStatus,
    Subject,
    SRSData,
    ReviewQuality,
    ReviewResponse,
} from '@/types';
import { cognitiveEngine } from '@/lib/CognitiveTracker';
import { staminaEngine } from '@/lib/StaminaOptimizer';

// ─── SM2 Algorithm ──────────────────────────────────────────

export function calculateSM2(
    quality: ReviewQuality,
    currentSRS: SRSData,
    certaintyScore?: number,
    upscIQ?: number,
    scaffoldLevel?: string,
    isPseudoKnowledge: boolean = false
): SRSData {
    const { easeFactor, interval, repetitions } = currentSRS;

    let newEF = easeFactor;
    let newInterval = interval;
    let newReps = repetitions;

    if (quality >= ReviewQuality.CORRECT_DIFFICULT) {
        // Correct response
        if (newReps === 0) {
            newInterval = 1;
        } else if (newReps === 1) {
            newInterval = 6;
        } else {
            newInterval = Math.round(interval * easeFactor);
        }
        newReps += 1;
    } else {
        // Incorrect — reset
        newReps = 0;
        newInterval = 1;
    }

    // Certainty Multiplier (Scale 1-5): If Certainty is 5 (100%), interval is boosted 1.25x. If 1 (20%), interval is penalized to 0.85x.
    if (quality >= ReviewQuality.CORRECT_DIFFICULT && certaintyScore !== undefined) {
        // Range: 1 (0.85x) to 5 (1.25x)
        const certaintyMultiplier = 0.75 + (certaintyScore * 0.10);
        newInterval = Math.max(1, Math.round(newInterval * certaintyMultiplier));
    }

    // Phase 16: Awareness Score / IQ Scaffolding Multiplier
    // Complete beginners (IQ < 40) need much tighter intervals, especially on Intermediate/Advanced cards if they somehow see them.
    if (upscIQ !== undefined && quality >= ReviewQuality.CORRECT_DIFFICULT) {
        const iqMultiplier = Math.max(0.5, Math.min(upscIQ / 80, 1.0)); // e.g., IQ 10 -> 0.5x interval (2x frequency)
        // If Foundation card and Beginner, give a small leniency buffer back compared to Advanced cards
        const scaffoldPenalty = (scaffoldLevel === 'Advanced' && upscIQ < 50) ? 0.7 : 1.0;

        // If pseudo-knowledge (right answer but high hesitation), penalize awareness by a flat 10%
        const pseudoPenalty = isPseudoKnowledge ? 0.9 : 1.0;
        const awarenessScore = iqMultiplier * scaffoldPenalty * pseudoPenalty;
        newInterval = Math.max(1, Math.round(newInterval * awarenessScore));
    }

    // Update ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    // Modified to ensure Quality 4 (Hesitation) results in a slight drop
    let efChange = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    if (quality === 4) {
        efChange = -0.05; // Slight penalty for hesitation so it doesn't stay flat
    }

    newEF = easeFactor + efChange;

    // Minimum EF is 1.3
    if (newEF < 1.3) newEF = 1.3;

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + newInterval);

    return {
        easeFactor: Math.round(newEF * 100) / 100,
        interval: newInterval,
        repetitions: newReps,
        nextReviewDate: nextDate.toISOString(),
        lastReviewDate: new Date().toISOString(),
    };
}

// ─── Mock Data ──────────────────────────────────────────────

const defaultSRS: SRSData = {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
};

const now = new Date().toISOString();

export const MOCK_CARDS: StudyCard[] = [
    {
        id: '1',
        type: CardType.FLASHCARD,
        domain: Domain.GS,
        subject: Subject.POLITY,
        topic: 'Fundamental Rights',
        difficulty: Difficulty.MEDIUM,
        examTags: ['UPSC', 'HAS'],
        status: CardStatus.LIVE,
        front: 'Article 21 of the Indian Constitution guarantees which fundamental right?',
        back: 'Right to Life and Personal Liberty — "No person shall be deprived of his life or personal liberty except according to the procedure established by law."',
        srs: { ...defaultSRS },
        createdAt: now,
        updatedAt: now,
    },
    {
        id: '2',
        type: CardType.MCQ,
        domain: Domain.GS,
        subject: Subject.HISTORY,
        topic: 'Indian National Movement',
        difficulty: Difficulty.EASY,
        examTags: ['UPSC'],
        status: CardStatus.LIVE,
        front: 'The Quit India Movement was launched in which year?',
        back: '1942 — Launched by Mahatma Gandhi on 8 August 1942 at the Bombay session of the All India Congress Committee.',
        options: [
            { id: 'a', text: '1940', isCorrect: false },
            { id: 'b', text: '1942', isCorrect: true },
            { id: 'c', text: '1944', isCorrect: false },
            { id: 'd', text: '1946', isCorrect: false },
        ],
        srs: { ...defaultSRS },
        createdAt: now,
        updatedAt: now,
    },
    {
        id: '3',
        type: CardType.PYQ,
        domain: Domain.GS,
        subject: Subject.GEOGRAPHY,
        topic: 'Indian Monsoon',
        difficulty: Difficulty.HARD,
        examTags: ['UPSC'],
        status: CardStatus.LIVE,
        front: 'Consider the following statements about the Indian monsoon:\n1. The onset of monsoon is driven by the shift of ITCZ\n2. The Western Ghats receive more rainfall than Eastern Ghats\n3. October heat is caused by retreating monsoon\n\nWhich of the above are correct?',
        back: 'All three statements (1, 2, and 3) are correct.\n\n• The ITCZ shifts northward, pulling moisture-laden winds.\n• Western Ghats act as orographic barrier.\n• October heat occurs due to high humidity during retreat.',
        year: 2022,
        examName: 'UPSC CSE Prelims 2022',
        srs: { ...defaultSRS },
        createdAt: now,
        updatedAt: now,
    },
    {
        id: '4',
        type: CardType.FLASHCARD,
        domain: Domain.GS,
        subject: Subject.ECONOMY,
        topic: 'Fiscal Policy',
        difficulty: Difficulty.MEDIUM,
        examTags: ['UPSC', 'HAS'],
        status: CardStatus.LIVE,
        front: 'What is the difference between Revenue Deficit and Fiscal Deficit?',
        back: 'Revenue Deficit = Revenue Expenditure − Revenue Receipts (current spending exceeds current income).\n\nFiscal Deficit = Total Expenditure − Total Receipts excluding borrowings (total borrowing requirement of the government).',
        srs: { ...defaultSRS },
        createdAt: now,
        updatedAt: now,
    },
    {
        id: '5',
        type: CardType.MCQ,
        domain: Domain.GS,
        subject: Subject.SCIENCE,
        topic: 'Space Technology',
        difficulty: Difficulty.EASY,
        examTags: ['UPSC'],
        status: CardStatus.LIVE,
        front: 'Which ISRO mission successfully placed a spacecraft in Mars orbit on its first attempt?',
        back: 'Mars Orbiter Mission (Mangalyaan) — launched on 5 November 2013, entered Mars orbit on 24 September 2014.',
        options: [
            { id: 'a', text: 'Chandrayaan-1', isCorrect: false },
            { id: 'b', text: 'Mangalyaan (MOM)', isCorrect: true },
            { id: 'c', text: 'Gaganyaan', isCorrect: false },
            { id: 'd', text: 'Aditya-L1', isCorrect: false },
        ],
        srs: { ...defaultSRS },
        createdAt: now,
        updatedAt: now,
    },
    {
        id: '6',
        type: CardType.FLASHCARD,
        domain: Domain.GS,
        subject: Subject.ENVIRONMENT,
        topic: 'Biodiversity',
        difficulty: Difficulty.HARD,
        examTags: ['UPSC', 'HAS'],
        status: CardStatus.LIVE,
        front: 'What are Biodiversity Hotspots? Name the hotspots present in India.',
        back: 'Biodiversity Hotspots are regions with ≥1,500 endemic vascular plant species and ≤30% of original habitat remaining.\n\nIndia has 4 hotspots:\n1. Western Ghats & Sri Lanka\n2. Himalayas\n3. Indo-Burma\n4. Sundaland (Nicobar Islands)',
        srs: { ...defaultSRS },
        createdAt: now,
        updatedAt: now,
    },
    {
        id: '7',
        type: CardType.PYQ,
        domain: Domain.GS,
        subject: Subject.POLITY,
        topic: 'Constitutional Amendments',
        difficulty: Difficulty.MEDIUM,
        examTags: ['UPSC'],
        status: CardStatus.LIVE,
        front: 'The 73rd Constitutional Amendment Act is related to:',
        back: 'Panchayati Raj Institutions — It gave constitutional status to Panchayati Raj, added Part IX to the Constitution, and mandated states to establish a three-tier system of Panchayats.',
        year: 2021,
        examName: 'UPSC CSE Prelims 2021',
        srs: { ...defaultSRS },
        createdAt: now,
        updatedAt: now,
    },
    {
        id: '11', // New card ID
        type: CardType.FLASHCARD,
        domain: Domain.GS,
        subject: Subject.POLITY,
        topic: 'Directive Principles of State Policy (DPSP)',
        difficulty: Difficulty.MEDIUM,
        examTags: ['UPSC'],
        status: CardStatus.LIVE,
        front: 'What are the Directive Principles of State Policy (DPSP) and their significance?',
        back: 'DPSPs are guidelines to the central and state governments of India to be kept in mind while framing laws and policies. They are non-justiciable but fundamental in the governance of the country, aiming to establish a welfare state.',
        explanation: 'BR Ambedkar likened it to an instruction instrument.',
        customAnalogy: 'Think of DPSP as the "moral compass" for the government. Just as a compass guides a ship (the nation) towards a destination (a welfare state), DPSP guides lawmakers when framing policies.',
        firstPrinciples: 'The historical necessity: Post-independence India was impoverished. Fundamental Rights guaranteed immediate political freedom, but economic and social rights (DPSP) had to be progressive directives based on state capacity.',
        lethalityScore: 88,
        srs: { ...defaultSRS },
        createdAt: now,
        updatedAt: now,
    },
    {
        id: '8',
        type: CardType.FLASHCARD,
        domain: Domain.GS,
        subject: Subject.ETHICS,
        topic: 'Emotional Intelligence',
        difficulty: Difficulty.EASY,
        examTags: ['UPSC'],
        status: CardStatus.LIVE,
        front: 'Define Emotional Intelligence and its key components as per Daniel Goleman.',
        back: 'Emotional Intelligence (EI) is the ability to recognize, understand, manage, and effectively express one\'s own feelings and engage with those of others.\n\n5 Components:\n1. Self-awareness\n2. Self-regulation\n3. Motivation\n4. Empathy\n5. Social skills',
        srs: { ...defaultSRS },
        createdAt: now,
        updatedAt: now,
    },
    {
        id: '9',
        type: CardType.MCQ,
        domain: Domain.GS,
        subject: Subject.CURRENT_AFFAIRS,
        topic: 'International Organizations',
        difficulty: Difficulty.MEDIUM,
        examTags: ['UPSC', 'HAS'],
        status: CardStatus.LIVE,
        front: 'Which country holds the presidency of G20 in 2025?',
        back: 'South Africa holds the G20 Presidency in 2025, following Brazil (2024) and India (2023).',
        options: [
            { id: 'a', text: 'Brazil', isCorrect: false },
            { id: 'b', text: 'South Africa', isCorrect: true },
            { id: 'c', text: 'Germany', isCorrect: false },
            { id: 'd', text: 'Japan', isCorrect: false },
        ],
        srs: { ...defaultSRS },
        createdAt: now,
        updatedAt: now,
    },
    {
        id: '10',
        type: CardType.FLASHCARD,
        domain: Domain.GS,
        subject: Subject.HISTORY,
        topic: 'Ancient India',
        difficulty: Difficulty.HARD,
        examTags: ['UPSC'],
        status: CardStatus.LIVE,
        front: 'Explain the significance of the Ashoka Edicts in Indian history.',
        back: 'Ashoka\'s Edicts (269–232 BCE) are the oldest deciphered writings in the Indian subcontinent.\n\nSignificance:\n• First evidence of state policy of Dhamma (moral law)\n• Written in Brahmi & Kharosthi scripts\n• Spread across the Mauryan Empire on rocks and pillars\n• Promote non-violence, tolerance, and welfare\n• Provide insights into Mauryan administration',
        srs: { ...defaultSRS },
        createdAt: now,
        updatedAt: now,
    },
];

// ─── Store Interface ────────────────────────────────────────

import { supabase } from '@/lib/supabase/client';

// ... (keep MOCK_CARDS as fallback later) ...

interface SRSStore {
    cards: StudyCard[];
    currentIndex: number;
    reviewHistory: ReviewResponse[];
    isLoading: boolean;

    // Diagnostic Bomb State
    needsDiagnostic: boolean;
    diagnosticScore: number;
    hasPassedDiagnostic: boolean;

    // Cognitive Load Handler (Burnout Tracking)
    sessionStartMs: number;
    fastSwipeCount: number;
    isBurnoutMode: boolean;
    burnoutEasyCardsRemaining: number;

    recentResults: boolean[];
    isStoicIntervention: boolean;

    // Mental Stamina Index
    msi: number;

    // Zero-Friction Listen Mode (Auto-play Reels)
    isListenMode: boolean;

    // Phase 6: Mastermind Filters
    activeSubject: Subject | 'Mixed';
    activeTopic: string | null;
    activeChapter: string | null;

    availableFilters: {
        subjects: Subject[];
        topics: string[];
        chapters: string[];
    };

    syncStatus: 'synced' | 'syncing' | 'error';

    // Actions
    fetchLiveCards: () => Promise<void>;
    submitReview: (cardId: string, recalled: boolean, failureReason?: string, certaintyScore?: number, timeToAnswerMs?: number) => Promise<void>;
    nextCard: () => void;
    previousCard: () => void;
    setCurrentIndex: (index: number) => void;
    setFilters: (filters: { subject?: Subject | 'Mixed', topic?: string | null, chapter?: string | null }) => void;
    resetDeck: () => void;
    resetBurnout: () => void;
    dismissStoicIntervention: () => void;
    completeDiagnostic: (score: number) => void;
    toggleListenMode: () => void;
}

export const useSRSStore = create<SRSStore>((set, get) => ({
    cards: [],
    currentIndex: 0,
    reviewHistory: [],
    isLoading: true,

    needsDiagnostic: true, // Trigger on first open of a topic
    diagnosticScore: 0,
    hasPassedDiagnostic: false,

    sessionStartMs: Date.now(),
    fastSwipeCount: 0,
    isBurnoutMode: false,
    burnoutEasyCardsRemaining: 0,
    recentResults: [],
    isStoicIntervention: false,
    msi: 100,
    isListenMode: false,

    activeSubject: 'Mixed',
    activeTopic: null,
    activeChapter: null,
    syncStatus: 'synced',

    availableFilters: {
        subjects: [],
        topics: [],
        chapters: []
    },

    completeDiagnostic: (score: number) => {
        const passed = score >= 4;
        set({ needsDiagnostic: false, diagnosticScore: score, hasPassedDiagnostic: passed });
        get().fetchLiveCards(); // Re-fetch to apply filtering logic
    },

    toggleListenMode: () => set((state) => ({ isListenMode: !state.isListenMode })),

    setFilters: (filters) => {
        set((state) => ({
            ...state,
            activeSubject: filters.subject !== undefined ? filters.subject : state.activeSubject,
            activeTopic: filters.topic !== undefined ? filters.topic : state.activeTopic,
            activeChapter: filters.chapter !== undefined ? filters.chapter : state.activeChapter,
        }));
        get().fetchLiveCards();
    },

    fetchLiveCards: async () => {
        set({ isLoading: true, sessionStartMs: Date.now(), fastSwipeCount: 0, isBurnoutMode: false });
        try {
            const { activeSubject, activeTopic, activeChapter } = get();
            let query = supabase
                .from('cards')
                .select('*')
                .eq('status', CardStatus.LIVE);

            // Mastermind Filters
            if (activeSubject !== 'Mixed') {
                query = query.eq('subject', activeSubject);
            }
            if (activeTopic) {
                query = query.eq('topic', activeTopic);
            }
            if (activeChapter) {
                query = query.eq('sub_topic', activeChapter); // sub_topic used as chapter
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data && data.length > 0) {
                // Grab upscIQ and accuracy from useProgressStore
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const { useProgressStore } = require('./progressStore');
                const { upscIQ, accuracy } = useProgressStore.getState();

                const filteredData = data.filter(row => {
                    const { hasPassedDiagnostic, activeSubject, activeTopic, activeChapter } = get();

                    // Mastermind Override: If user manually picks a filter, show EVERYTHING in that filter.
                    // This gives absolute control to the 'Mastermind'.
                    if (activeSubject !== 'Mixed' || activeTopic || activeChapter) {
                        return true;
                    }

                    // Diagnostic Bomb Rule: Skip ONLY IF they have mastered it (Repetitions > 2) 
                    // and we have other cards to show.
                    if (hasPassedDiagnostic && row.scaffold_level === 'Foundation') {
                        const srs = row.ease_factor ? { repetitions: row.repetitions } : { repetitions: 0 };
                        // If they've seen it 3 times correctly, then hide it. Else keep it.
                        if (srs.repetitions > 2) return false;
                    }

                    // Invisible Scaffolding Engine Rule:
                    // If IQ < 50 AND their overall accuracy is < 80%, lock them heavily into Foundation cards only.
                    if (upscIQ > 0 && upscIQ < 50 && accuracy < 80) {
                        return row.scaffold_level === 'Foundation';
                    }
                    return true;
                });

                // Map DB columns to camelCase StudyCard interface
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mappedCards: StudyCard[] = filteredData.map((dbCard: any) => ({
                    id: dbCard.id,
                    type: dbCard.type as CardType,
                    domain: (dbCard.domain as Domain) || Domain.GS,
                    subject: (dbCard.subject as Subject) || Subject.POLITY,
                    topic: dbCard.topic,
                    subTopic: dbCard.sub_topic,
                    difficulty: (dbCard.difficulty as Difficulty) || Difficulty.MEDIUM,
                    examTags: dbCard.exam_tags || [],
                    status: dbCard.status as CardStatus,
                    front: dbCard.front,
                    back: dbCard.back,
                    explanation: dbCard.explanation || undefined,
                    topperTrick: dbCard.topper_trick || undefined,
                    eliminationTrick: dbCard.elimination_trick || undefined,
                    mainsPoint: dbCard.mains_point || undefined,
                    syllabusTopic: dbCard.syllabus_topic || undefined,
                    crossRefs: dbCard.cross_refs || undefined,
                    isPyqTagged: dbCard.is_pyq_tagged || false,
                    pyqYears: dbCard.pyq_years || undefined,
                    currentAffairs: dbCard.current_affairs || undefined,
                    priorityScore: dbCard.priority_score ?? 5,
                    isVerified: dbCard.is_verified || false,
                    options: (() => {
                        const raw = dbCard.options;
                        if (!raw) return undefined;
                        if (Array.isArray(raw)) return raw;
                        if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return undefined; } }
                        return undefined;
                    })(),
                    year: dbCard.year,
                    examName: dbCard.exam_name,
                    sourcePdf: dbCard.source_pdf,
                    scaffoldLevel: dbCard.scaffold_level || 'Foundation',
                    customAnalogy: dbCard.custom_analogy || undefined,
                    srs: {
                        easeFactor: Number(dbCard.ease_factor) || 2.5,
                        interval: Number(dbCard.interval) || 0,
                        repetitions: Number(dbCard.repetitions) || 0,
                        nextReviewDate: dbCard.next_review_date,
                        lastReviewDate: dbCard.last_review_date,
                    },
                    createdAt: dbCard.created_at,
                    updatedAt: dbCard.updated_at,
                }));
                // Weightage Engine Setup (Sort by priority * SRS need)
                const now = new Date();
                const nowMs = now.getTime();
                const currentHour = now.getHours();
                // Assume peak focus is 8 AM to 12 PM (can be expanded to pull from profile later)
                const isPeakFocus = currentHour >= 8 && currentHour < 12;

                // The Death Zone (Auto-Archive)
                // If a card interval > 60 days, it is permanently retired (until explicit full mock test)
                const aliveCards = mappedCards.filter(c => c.srs.interval <= 60);

                aliveCards.sort((a, b) => {
                    // Base urgency (if interval is 0, it's highly urgent. If they're due, urgent)
                    const aDue = new Date(a.srs.nextReviewDate || a.createdAt).getTime() - nowMs;
                    const bDue = new Date(b.srs.nextReviewDate || b.createdAt).getTime() - nowMs;

                    // Invisible Intelligence Multiplier: Priority Score gives up to 1.5x boost
                    let aWeight = 1 + ((a.priorityScore || 5) / 10) * 0.5;
                    let bWeight = 1 + ((b.priorityScore || 5) / 10) * 0.5;

                    // Circadian Rhythm Optimizer: Boost HARD during peak, EASY/Mnemonic heavily during non-peak
                    if (isPeakFocus) {
                        if (a.difficulty === Difficulty.HARD) aWeight *= 1.2;
                        if (b.difficulty === Difficulty.HARD) bWeight *= 1.2;
                    } else {
                        if (a.difficulty === Difficulty.EASY || a.topperTrick) aWeight *= 1.2;
                        if (b.difficulty === Difficulty.EASY || b.topperTrick) bWeight *= 1.2;
                    }

                    // Lower score = more urgent. We boost (reduce) due time by the weight multiplier.
                    const aScore = aDue / aWeight;
                    const bScore = bDue / bWeight;

                    return aScore - bScore;
                });

                // Top 20% Lethality Filter (Volume Control)
                // If in Mastermind Mode (manual filter) or deck is small, be more lenient.
                const { activeSubject, activeTopic, activeChapter } = get();
                const isMastermindMode = activeSubject !== 'Mixed' || activeTopic || activeChapter;

                let finalFeed: StudyCard[] = [];

                if (isMastermindMode) {
                    finalFeed = aliveCards.slice(0, 50); // Just give them everything they filtered for
                } else {
                    // THE SNIPER FEED INTERLEAVING (30% PYQ : 40% Predicted : 30% CA)
                    const pyqs = aliveCards.filter(c => c.type === CardType.PYQ);
                    const predicted = aliveCards.filter(c => (c.oracleConfidence || 0) > 80);
                    const currentAffairs = aliveCards.filter(c => c.subject === Subject.CURRENT_AFFAIRS);
                    const others = aliveCards.filter(c => c.type !== CardType.PYQ && (c.oracleConfidence || 0) <= 80 && c.subject !== Subject.CURRENT_AFFAIRS);

                    const targetCount = 20; // Target daily batch size
                    const counts = {
                        pyq: Math.ceil(targetCount * 0.3),
                        pred: Math.ceil(targetCount * 0.4),
                        ca: Math.ceil(targetCount * 0.3)
                    };

                    // Interleave
                    const slicePYQ = pyqs.slice(0, counts.pyq);
                    const slicePred = predicted.slice(0, counts.pred);
                    const sliceCA = currentAffairs.slice(0, counts.ca);

                    finalFeed = [...slicePYQ, ...slicePred, ...sliceCA];

                    // Fill remaining slots if any group is empty
                    if (finalFeed.length < targetCount) {
                        const remaining = others.slice(0, targetCount - finalFeed.length);
                        finalFeed = [...finalFeed, ...remaining];
                    }

                    // Final shuffle of the interleaved batch to prevent grouping
                    finalFeed.sort(() => Math.random() - 0.5);
                }

                // Discovery Engine (Unique values for filters)
                const subjects = Array.from(new Set(data.map(c => c.subject as Subject)));
                const topics = Array.from(new Set(data.map(c => c.topic).filter(Boolean)));
                const chapters = Array.from(new Set(data.map(c => c.sub_topic).filter(Boolean)));

                set({
                    cards: finalFeed,
                    isLoading: false,
                    currentIndex: 0,
                    availableFilters: { subjects, topics, chapters }
                });
            } else {
                // Fallback to MOCK_CARDS if DB has no live cards yet so screen isn't empty
                set({ cards: [...MOCK_CARDS], isLoading: false, currentIndex: 0 });
            }
        } catch (error) {
            console.error('Error fetching live cards:', error);
            set({ cards: [...MOCK_CARDS], isLoading: false, currentIndex: 0 });
        }
    },

    submitReview: async (cardId: string, recalled: boolean, failureReason?: string, certaintyScore?: number, timeToAnswerMs?: number) => {
        const quality = recalled
            ? ReviewQuality.CORRECT_HESITATION  // quality 4 for "Recalled"
            : ReviewQuality.BLACKOUT;           // quality 0 for "Forgot"

        const { cards, reviewHistory, sessionStartMs, fastSwipeCount, burnoutEasyCardsRemaining, currentIndex, recentResults } = get();
        const cardIndex = cards.findIndex((c) => c.id === cardId);
        if (cardIndex === -1) return;

        // Stoic Burnout Shield Logic
        const newRecentResults = [...recentResults, recalled];
        if (newRecentResults.length > 10) {
            newRecentResults.shift();
        }

        let newIsStoicIntervention = get().isStoicIntervention;
        // If 70% forget rate over the last 10 cards, intervene
        if (newRecentResults.length === 10) {
            const forgotCount = newRecentResults.filter(r => !r).length;
            if (forgotCount >= 7) {
                newIsStoicIntervention = true;
                newRecentResults.length = 0; // reset it
            }
        }

        // Cognitive Load Handler Logic
        const now = Date.now();
        const timeSpentMs = now - sessionStartMs;

        let newBurnoutEasyCardsRemaining = burnoutEasyCardsRemaining > 0 ? burnoutEasyCardsRemaining - 1 : 0;

        // If they spent less than 2.0 seconds reading a card, it's a "fast swipe"
        const isFastSwipe = timeSpentMs < 2000;
        const newFastSwipeCount = isFastSwipe ? fastSwipeCount + 1 : 0;

        // Trigger burnout mode if they did 3 fast swipes in a row
        const newBurnoutMode = newFastSwipeCount >= 3;

        if (newBurnoutMode && newFastSwipeCount === 3) {
            // Activate intervention: 5 easy cards next
            newBurnoutEasyCardsRemaining = 5;
        }

        const card = cards[cardIndex];

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useProgressStore } = require('./progressStore');
        const upscIQ = useProgressStore.getState().upscIQ;

        // Phase 18: Cognitive Tracking
        // We evaluate hesitation time vs the baseline for this complexity
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cognitiveMetrics = cognitiveEngine.evaluateHesitation(
            card.scaffoldLevel as any || 'Intermediate',
            quality
        );

        // Drain or restore stamina based on the outcome
        staminaEngine.processReviewEvent(quality, cognitiveMetrics.isPseudoKnowledge);
        const { msi } = staminaEngine.getCurrentStamina();

        const newSRS = calculateSM2(
            quality,
            card.srs,
            certaintyScore,
            upscIQ,
            card.scaffoldLevel,
            cognitiveMetrics.isPseudoKnowledge
        );

        const updatedCards = [...cards];
        updatedCards[cardIndex] = {
            ...card,
            srs: newSRS,
            updatedAt: new Date().toISOString(),
        };

        const response: ReviewResponse = {
            cardId,
            quality,
            timestamp: new Date().toISOString(),
            failureReason,
            certaintyScore,
            timeToAnswerMs,
        };

        // Cognitive Load Easy Card Injection
        if (newBurnoutEasyCardsRemaining === 5 && currentIndex < updatedCards.length - 1) {
            // Re-sort the upcoming queue to pull Easy / Mnemonic-heavy cards to the immediate next slots
            const consumed = updatedCards.slice(0, currentIndex + 1);
            const remaining = updatedCards.slice(currentIndex + 1);

            // Partition remaining into 'easy' and 'normal'
            const easyCards = [];
            const normalCards = [];
            for (const c of remaining) {
                if (c.difficulty === Difficulty.EASY || c.topperTrick || c.explanation) {
                    easyCards.push(c);
                } else {
                    normalCards.push(c);
                }
            }

            // Splice up to 5 easy cards to the very front of the queue
            const injectedEasy = easyCards.splice(0, 5);
            const refixedQueue = [...injectedEasy, ...easyCards, ...normalCards];

            updatedCards.splice(0, updatedCards.length, ...consumed, ...refixedQueue);
        }

        set({
            cards: updatedCards,
            reviewHistory: [...reviewHistory, response],
            sessionStartMs: now,          // Reset timer for the next card
            fastSwipeCount: newFastSwipeCount,
            isBurnoutMode: newBurnoutMode,
            burnoutEasyCardsRemaining: newBurnoutEasyCardsRemaining,
            recentResults: newRecentResults,
            isStoicIntervention: newIsStoicIntervention,
            msi,
            syncStatus: 'syncing',
        });

        // Async Background Sync (Stripe/Linear Pattern)
        try {
            const { error } = await supabase
                .from('cards')
                .update({
                    ease_factor: newSRS.easeFactor,
                    interval: newSRS.interval,
                    repetitions: newSRS.repetitions,
                    next_review_date: newSRS.nextReviewDate,
                    last_review_date: newSRS.lastReviewDate,
                })
                .eq('id', cardId);

            if (error) throw error;

            // ─── Insert Review History (Audit Trail) ───
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('review_history')
                    .insert({
                        user_id: user.id,
                        card_id: cardId,
                        quality,
                        recalled,
                        failure_reason: failureReason || null,
                        certainty_score: certaintyScore || null,
                        time_to_answer_ms: timeToAnswerMs || null,
                        ease_factor: newSRS.easeFactor,
                        interval: newSRS.interval,
                        repetitions: newSRS.repetitions,
                    });
            }

            set({ syncStatus: 'synced' });
        } catch (err) {
            console.error('Sync failed:', err);
            set({ syncStatus: 'error' });
        }
    },

    nextCard: () => {
        const { currentIndex, cards } = get();
        if (currentIndex < cards.length - 1) {
            set({ currentIndex: currentIndex + 1 });
        }
    },

    previousCard: () => {
        const { currentIndex } = get();
        if (currentIndex > 0) {
            set({ currentIndex: currentIndex - 1 });
        }
    },

    setCurrentIndex: (index: number) => set({ currentIndex: index, sessionStartMs: Date.now() }),

    resetDeck: () => {
        const { fetchLiveCards } = get();
        fetchLiveCards();
    },

    resetBurnout: () => set({ isBurnoutMode: false, fastSwipeCount: 0, sessionStartMs: Date.now(), burnoutEasyCardsRemaining: 0 }),
    dismissStoicIntervention: () => set({ isStoicIntervention: false, sessionStartMs: Date.now() })
}));

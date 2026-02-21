// ═══════════════════════════════════════════════════════════
// JourneyOS — Type System & Content Engine Schema
// Future-proof for any exam: UPSC, HAS, State PSC, etc.
// ═══════════════════════════════════════════════════════════

/** Card categories */
export enum CardType {
  FLASHCARD = 'FLASHCARD',
  MCQ = 'MCQ',
  PYQ = 'PYQ',
}

/** Difficulty levels */
export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

/** Knowledge domain — top-level grouping */
export enum Domain {
  GS = 'GS',                   // General Studies
  APTITUDE = 'APTITUDE',       // CSAT / Aptitude
  OPTIONAL = 'OPTIONAL',       // Optional subjects
}

/** Subject categories (extensible for any exam) */
export enum Subject {
  POLITY = 'Polity',
  HISTORY = 'History',
  GEOGRAPHY = 'Geography',
  ECONOMY = 'Economy',
  SCIENCE = 'Science',
  ENVIRONMENT = 'Environment',
  CURRENT_AFFAIRS = 'Current Affairs',
  ETHICS = 'Ethics',
  MATHEMATICS = 'Mathematics',
  REASONING = 'Reasoning',
  ENGLISH = 'English',
  HINDI = 'Hindi',
}

/** Card lifecycle status */
export enum CardStatus {
  DRAFT = 'draft',
  COMMUNITY_REVIEW = 'community_review',
  ADMIN_REVIEW = 'admin_review',
  LIVE = 'live',
  ARCHIVED = 'archived',
}

/** AI validation status for suggestions */
export enum AIValidationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ERROR = 'error',
}

/** MCQ option structure */
export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/** SM2 Spaced Repetition Data */
export interface SRSData {
  easeFactor: number;       // EF >= 1.3, default 2.5
  interval: number;         // days until next review
  repetitions: number;      // consecutive correct recalls
  nextReviewDate: string;   // ISO date string
  lastReviewDate?: string;  // ISO date string
}

/** Base study card interface */
export interface StudyCard {
  id: string;
  type: CardType;
  domain: Domain;
  subject: Subject;
  topic: string;
  subTopic?: string;
  difficulty: Difficulty;
  examTags: string[];        // e.g., ['UPSC', 'HAS', 'HPAS']
  status: CardStatus;

  // Content
  front: string;             // Question / prompt
  back: string;              // Answer / explanation
  explanation?: string;      // 2-line analogy-based explanation
  topperTrick?: string;      // Mnemonic or topper memory trick
  eliminationTrick?: string; // Topper's smart guessing elimination trick
  mainsPoint?: string;       // How to use in GS Mains Paper
  syllabusTopic?: string;    // Official UPSC syllabus topic
  crossRefs?: string[];      // Cross-references to other subjects/topics
  logicDerivation?: string;  // Detailed logic/derivation for deeper understanding
  firstPrinciples?: string;  // Phase 19: Explains 'Why' this fact exists biologically/historically
  interlinkIds?: string[];   // Array of UUIDs for connected cards
  isPyqTagged?: boolean;     // True if fact appeared in past UPSC/HAS exams
  pyqYears?: string;         // Years when asked (e.g., "UPSC 2019, 2021")
  currentAffairs?: string;   // Dynamic link to current events
  priorityScore?: number;    // 1-10 UPSC weightage importance
  lethalityScore?: number;   // 0-100 Phase 19 PYQ Lethality (Frequency * Weightage)
  isVerified?: boolean;      // Expert-verified by admin
  options?: MCQOption[];      // Only for MCQ type
  year?: number;             // Only for PYQ type
  examName?: string;         // Only for PYQ (e.g., "UPSC CSE 2023")
  sourcePdf?: string;        // Source PDF filename

  // Phase 16: Personalization
  scaffoldLevel?: 'Foundation' | 'Intermediate' | 'Advanced';
  customAnalogy?: string;    // Highly personalized layman analogy

  // SRS metadata
  srs: SRSData;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/** Review quality grade (SM2 uses 0-5 scale) */
export enum ReviewQuality {
  BLACKOUT = 0,
  INCORRECT = 1,
  INCORRECT_EASY = 2,
  CORRECT_DIFFICULT = 3,
  CORRECT_HESITATION = 4,
  PERFECT = 5,
}

/** Review response from user actions */
export interface ReviewResponse {
  cardId: string;
  quality: ReviewQuality;
  timestamp: string;
  failureReason?: string;
  certaintyScore?: number;
  timeToAnswerMs?: number;
}

/** User accuracy & progress tracking */
export interface UserProgress {
  totalReviewed: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  rankProbability: number;
  subjectStats: Record<Subject, SubjectStat>;

  // Phase 16: Personalization
  upscIQ: number;            // Assessed baseline knowledge score
  interestProfile: string;   // E.g., 'Sports', 'Geopolitics', 'Movies'
}

/** Per-subject statistics */
export interface SubjectStat {
  total: number;
  correct: number;
  accuracy: number;
}

// ─── Database Row Types ─────────────────────────────────────

/** Supabase DB row for cards table */
export interface DBCard {
  id: string;
  user_id: string;
  type: CardType;
  domain: Domain;
  subject: Subject;
  topic: string;
  sub_topic: string | null;
  difficulty: Difficulty;
  exam_tags: string[];
  status: CardStatus;
  front: string;
  back: string;
  explanation: string | null;
  topper_trick: string | null;
  elimination_trick: string | null;
  mains_point: string | null;
  syllabus_topic: string | null;
  cross_refs: string[] | null;
  logic_derivation: string | null;
  interlink_ids: string[] | null;
  is_pyq_tagged: boolean;
  pyq_years: string | null;
  current_affairs: string | null;
  priority_score: number;
  is_verified: boolean;
  options: MCQOption[] | null;
  year: number | null;
  exam_name: string | null;
  source_pdf: string | null;
  scaffold_level: 'Foundation' | 'Intermediate' | 'Advanced';
  custom_analogy: string | null;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review_date: string;
  last_review_date: string | null;
  created_at: string;
  updated_at: string;
}

/** Supabase DB row for suggestions table */
export interface DBSuggestion {
  id: string;
  card_id: string;
  user_id: string | null;
  original_front: string;
  original_back: string;
  suggested_front: string;
  suggested_back: string;
  ai_validation_status: AIValidationStatus;
  ai_response: string | null;
  is_applied: boolean;
  created_at: string;
  updated_at: string;
}

// ─── AI / Ingest Types ──────────────────────────────────────

/** Result from Gemini card extraction */
export interface IngestResult {
  success: boolean;
  cardsCreated: number;
  cards: Partial<StudyCard>[];
  errors: string[];
}

/** AI-extracted card (before DB insertion) */
export interface ExtractedCard {
  type: CardType;
  front: string;
  back: string;
  explanation?: string;
  topperTrick?: string;
  eliminationTrick?: string;
  mainsPoint?: string;
  syllabusTopic?: string;
  crossRefs?: string[];
  logicDerivation?: string;
  interlinkIds?: string[];
  isPyqTagged?: boolean;
  pyqYears?: string;
  currentAffairs?: string;
  priorityScore?: number;
  subTopic?: string;
  difficulty: Difficulty;
  options?: MCQOption[];
  year?: number;
  examName?: string;
  scaffoldLevel?: 'Foundation' | 'Intermediate' | 'Advanced';
  customAnalogy?: string;
}

/** 24-Hour Ephemeral Story for Current Affairs */
export interface CurrentAffairStory {
  id: string;
  subject: Subject;
  content: string[]; // Array of strings or JSON slides
  mcqId?: string;    // Links to the validating card ID
  expiresAt: string;
  createdAt: string;

  // Client-populated relation if fetched together
  mcqCard?: StudyCard;
}

import Dexie, { Table } from 'dexie';
import { StudyCard, CurrentAffairStory, ReviewResponse } from '@/types';

export interface LocalReview extends ReviewResponse {
    id?: number;
    synced: number;
    type: 'review' | 'progress'; // Distinguish between SRS reviews and metric updates
    data?: any; // For flexible progress data
}

export class JourneyDatabase extends Dexie {
    cards!: Table<StudyCard>;
    stories!: Table<CurrentAffairStory>;
    syncQueue!: Table<LocalReview>;
    profiles!: Table<any>;
    userProgress!: Table<any>;

    constructor() {
        super('JourneyOS_DB');
        this.version(2).stores({
            // Primary key is id
            // Indexes: type, subject, topic, status, nextReviewDate (for SRS filtering), priorityScore
            cards: 'id, type, subject, topic, status, srs.nextReviewDate, priorityScore, updatedAt',

            // Primary key is id
            // Indexes: subject, expiresAt (for cleanup)
            stories: 'id, subject, expiresAt',

            // Primary key is id (auto-increment)
            // Indexes: cardId, synced (to find pending reviews), timestamp
            syncQueue: '++id, cardId, synced, timestamp, type',
            profiles: 'user_id',
            userProgress: 'user_id'
        });
    }

    /**
     * Clean up expired stories
     */
    async cleanupExpiredStories() {
        const now = new Date().toISOString();
        return this.stories.where('expiresAt').below(now).delete();
    }
}

export const db = new JourneyDatabase();

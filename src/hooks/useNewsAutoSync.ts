'use client';

// ═══════════════════════════════════════════════════════════
// JourneyOS — News Auto-Sync Hook
// Triggers RSS sync every 4 hours automatically.
// Called once in the home page layout.
// ═══════════════════════════════════════════════════════════

import { useEffect } from 'react';

const SYNC_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const STORAGE_KEY = 'lastStoriesSync';

export function useNewsAutoSync() {
    useEffect(() => {
        const triggerIfDue = async () => {
            try {
                const lastSync = localStorage.getItem(STORAGE_KEY);
                const now = Date.now();

                if (lastSync) {
                    const diff = now - new Date(lastSync).getTime();
                    if (diff < SYNC_INTERVAL_MS) {
                        // Not due yet
                        return;
                    }
                }

                console.log('[NewsAutoSync] Sync due — pulling RSS feeds...');
                const res = await fetch('/api/cron/stories');
                const data = await res.json();

                if (data.success) {
                    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
                    console.log(`[NewsAutoSync] Done — ${data.count} new stories saved.`);
                } else {
                    console.warn('[NewsAutoSync] Sync failed:', data.error);
                }
            } catch (err) {
                console.warn('[NewsAutoSync] Error:', err);
            }
        };

        // Small delay so it doesn't block initial render
        const timer = setTimeout(triggerIfDue, 3000);
        return () => clearTimeout(timer);
    }, []);
}

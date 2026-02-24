import { NextResponse } from 'next/server';
import { scrapeAndSyncStories } from '@/app/actions/admin/stories';

// ═══════════════════════════════════════════════════════════
// JourneyOS — Stories Sync API Route
// GET /api/cron/stories → Triggers the RSS→AI→DB pipeline
// Can be called manually or via cron job
// ═══════════════════════════════════════════════════════════

export async function GET() {
    try {
        console.log('[API/Stories] Manual sync triggered...');
        const result = await scrapeAndSyncStories();

        return NextResponse.json({
            success: result.success,
            count: result.count || 0,
            error: result.error || null,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[API/Stories] Route Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

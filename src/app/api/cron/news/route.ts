import { NextResponse } from 'next/server';
import { scrapeAndSyncStories } from '@/app/actions/admin/stories';

// Vercel Cron forces a GET request, but POST is safer if triggered manually.
export async function GET(request: Request) {
    // Optional: Protect this route with a secret key in production
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Cron] Triggering Automated News Pipeline...');
        const result = await scrapeAndSyncStories();

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Successfully generated ${result.count} stories.`
        });

    } catch (error: any) {
        console.error('[Cron] Error in News Pipeline:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

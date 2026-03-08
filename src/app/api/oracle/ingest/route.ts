import { NextRequest, NextResponse } from 'next/server';
import { oracleGenesis } from '@/services/oracle';

export const maxDuration = 300; // 5 min max for serverless

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const pyqFile = formData.get('pyq') as File | null;
        const notifFile = formData.get('notif') as File | null;

        if (!pyqFile && !notifFile) {
            return NextResponse.json({ success: false, error: 'No files uploaded.' }, { status: 400 });
        }

        // Set up streaming response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const send = (event: string, data: any) => {
                    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
                };

                const onProgress = (msg: string) => {
                    console.log(`[Genesis] ${msg}`);
                    send('progress', { message: msg });
                };

                try {
                    const pyq = pyqFile ? Buffer.from(await pyqFile.arrayBuffer()) : undefined;
                    const notification = notifFile ? Buffer.from(await notifFile.arrayBuffer()) : undefined;

                    const startTime = Date.now();
                    const result = await oracleGenesis.processIngest({
                        pyq,
                        pyqFilename: pyqFile?.name,
                        notification,
                        notifFilename: notifFile?.name,
                    }, onProgress);

                    const duration = Math.round((Date.now() - startTime) / 1000);

                    send('done', {
                        success: result.success,
                        message: result.message,
                        yearsProcessed: result.yearsProcessed,
                        duration
                    });
                } catch (error: any) {
                    const msg = error.message || 'Unknown error';
                    const is429 = msg.includes('429') || msg.includes('RATE_LIMIT');
                    send('error', {
                        error: is429
                            ? 'All API keys have hit their daily quota. Please wait 1-2 minutes and try again.'
                            : msg
                    });
                }

                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: any) {
        console.error('[Genesis API] Critical:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

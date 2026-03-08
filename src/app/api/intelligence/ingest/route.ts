import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createServerSupabaseClient } from '@/lib/core/supabase/server';
import { CardType, Domain, Subject, CardStatus, Difficulty } from '@/types';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import os from 'os';

const execPromise = promisify(exec);

// Path to the Python virtual environment and bridge script
const VENV_PYTHON = "/Users/rishabsayrta/new journey/notebooklm-py/venv/bin/python3";
const BRIDGE_SCRIPT = "/Users/rishabsayrta/new journey/journeyos-app/scripts/notebooklm_bridge.py";

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';
        let source: string;
        let isFile = false;
        let domain: string;
        let subject: string;
        let topic: string;
        let examTags: string[];

        if (contentType.includes('multipart/form-data')) {
            // ── File Upload via FormData ──
            const formData = await req.formData();
            const file = formData.get('file') as File | null;

            if (!file) {
                return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
            }

            // Save uploaded file to a temp directory
            const tempDir = path.join(os.tmpdir(), 'journeyos-ingest');
            await mkdir(tempDir, { recursive: true });
            const tempPath = path.join(tempDir, file.name);

            const buffer = Buffer.from(await file.arrayBuffer());
            await writeFile(tempPath, buffer);

            source = tempPath;
            isFile = true;
            domain = formData.get('domain') as string || 'GS';
            subject = formData.get('subject') as string || 'History';
            topic = formData.get('topic') as string || 'General Intelligence';
            examTags = JSON.parse(formData.get('examTags') as string || '["UPSC"]');

        } else {
            // ── URL via JSON ──
            const body = await req.json();
            source = body.source;
            isFile = body.isFile || false;
            domain = body.domain;
            subject = body.subject;
            topic = body.topic;
            examTags = body.examTags;
        }

        if (!source) {
            return NextResponse.json({ success: false, error: 'Source is required' }, { status: 400 });
        }

        console.log(`[IntelIngest] Pulsing NotebookLM for source: ${source} (isFile: ${isFile})`);

        // 1. Execute the Python Bridge
        const command = `"${VENV_PYTHON}" "${BRIDGE_SCRIPT}" "${source}" ${isFile ? '--file' : ''}`;

        try {
            const { stdout, stderr } = await execPromise(command);

            if (stderr && !stdout) {
                console.error('[IntelIngest] Bridge Stderr:', stderr);
                return NextResponse.json({ success: false, error: stderr }, { status: 500 });
            }

            const result = JSON.parse(stdout);

            if (!result.success) {
                if (result.error.includes('notebooklm login')) {
                    return NextResponse.json({
                        success: false,
                        error: 'AUTHENTICATION_REQUIRED',
                        message: 'NotebookLM requires authentication. Please run "notebooklm login" in the terminal.'
                    }, { status: 401 });
                }
                return NextResponse.json({ success: false, error: result.error }, { status: 500 });
            }

            // 2. Process and Save to Database
            const quizData = result.data;
            const cardsToInsert = quizData.map((item: any) => ({
                type: CardType.FLASHCARD,
                domain: domain || Domain.GS,
                subject: subject || Subject.HISTORY,
                topic: topic || 'General Intelligence',
                front: item.question,
                back: item.answer,
                difficulty: Difficulty.MEDIUM,
                status: CardStatus.ADMIN_REVIEW,
                exam_tags: examTags || ['UPSC'],
                explanation: `Generated via NotebookLM Integration. Source: ${source}`,
                next_review_date: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                ease_factor: 2.5,
                interval: 0,
                repetitions: 0
            }));

            const supabase = await createServerSupabaseClient();
            const { error: dbError } = await supabase
                .from('cards')
                .insert(cardsToInsert);

            if (dbError) {
                console.error('[IntelIngest] DB Insert Error:', dbError);
                return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                cardsCreated: cardsToInsert.length,
                notebookId: result.notebook_id
            });

        } catch (execErr: any) {
            console.error('[IntelIngest] Execution Error:', execErr);
            return NextResponse.json({ success: false, error: execErr.message }, { status: 500 });
        }

    } catch (err: any) {
        console.error('[IntelIngest] Request Error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
